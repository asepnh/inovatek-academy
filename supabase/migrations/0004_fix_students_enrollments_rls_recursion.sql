-- Fix "infinite recursion detected in policy for relation enrollments/students".
--
-- "students: mentor read own roster" (on students) queries enrollments, and
-- "enrollments: parent manage own students" (on enrollments) queries
-- students. Under RLS enforcement, evaluating one re-triggers the other,
-- forever. This has been present since the original schema; it just hadn't
-- been exercised by a real query until now.
--
-- Fix: move the mentor-roster check into a SECURITY DEFINER function, the
-- same pattern already used by public.current_role() to avoid recursion on
-- profiles. A SECURITY DEFINER function runs with its owner's privileges
-- (which bypass RLS in Supabase), so its internal lookups don't re-trigger
-- row security and the cycle is broken.
create or replace function public.is_student_in_mentors_class(p_student_id uuid, p_mentor_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.enrollments e
    join public.classes c on c.id = e.class_id
    where e.student_id = p_student_id and c.mentor_id = p_mentor_id
  );
$$;

drop policy "students: mentor read own roster" on public.students;
create policy "students: mentor read own roster" on public.students
  for select using (public.is_student_in_mentors_class(students.id, auth.uid()));
