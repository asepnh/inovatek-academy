-- Lets parents attach an optional photo when adding a student. Photos live
-- in a private Storage bucket (not a public URL column) so access is
-- governed by RLS on storage.objects, same as every other table here.
--
-- Path convention: every object is stored at "<student_id>/<filename>", so
-- policies can check ownership by pulling the student_id out of the path via
-- storage.foldername() and joining back to public.students.
alter table public.students add column photo_path text;

insert into storage.buckets (id, name, public)
values ('student-photos', 'student-photos', false);

create policy "student-photos: parent manage own" on storage.objects
  for all using (
    bucket_id = 'student-photos'
    and exists (
      select 1 from public.students s
      where s.id::text = (storage.foldername(name))[1] and s.parent_id = auth.uid()
    )
  ) with check (
    bucket_id = 'student-photos'
    and exists (
      select 1 from public.students s
      where s.id::text = (storage.foldername(name))[1] and s.parent_id = auth.uid()
    )
  );

create policy "student-photos: admin manage all" on storage.objects
  for all using (bucket_id = 'student-photos' and public.current_role() = 'admin')
  with check (bucket_id = 'student-photos' and public.current_role() = 'admin');

create policy "student-photos: mentor read own class" on storage.objects
  for select using (
    bucket_id = 'student-photos'
    and public.is_student_in_mentors_class((storage.foldername(name))[1]::uuid, auth.uid())
  );
