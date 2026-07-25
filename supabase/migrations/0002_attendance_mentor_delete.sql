-- Allow mentors to delete today's attendance row for students in their own
-- courses. Needed for the roster-based Present/Absent toggle: "Absent" (the
-- default) is represented by the *absence* of a row rather than an explicit
-- status, so un-marking a student as Present means deleting that row.
create policy "attendance: mentor delete own course" on public.attendance
  for delete using (
    exists (select 1 from public.courses c where c.id = attendance.course_id and c.mentor_id = auth.uid())
  );
