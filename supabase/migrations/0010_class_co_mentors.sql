-- Lets a class have extra mentors on top of its single primary mentor
-- (classes.mentor_id, unchanged). A co-mentor is just a normal mentor
-- account -- there's no new role, they see the exact same mentor UI, just
-- with an extra class in their list.
create table public.class_co_mentors (
  class_id uuid not null references public.classes (id) on delete cascade,
  mentor_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (class_id, mentor_id)
);

alter table public.class_co_mentors enable row level security;

create policy "class_co_mentors: admin manage all" on public.class_co_mentors
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
-- No mentor-facing policy needed: every other table's policies check
-- membership via is_mentor_of_class() below, a SECURITY DEFINER function
-- that bypasses RLS internally (same pattern as current_role() and
-- is_student_in_mentors_class()) -- otherwise a mentor's own session
-- wouldn't be able to read class_co_mentors rows to prove they're in it,
-- since only the admin policy above would apply to their role.

create or replace function public.is_mentor_of_class(p_class_id uuid, p_mentor_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.classes c where c.id = p_class_id and c.mentor_id = p_mentor_id
  ) or exists (
    select 1 from public.class_co_mentors cc where cc.class_id = p_class_id and cc.mentor_id = p_mentor_id
  );
$$;

-- Reuse is_mentor_of_class() inside the roster-visibility function too, so
-- a co-mentor sees the same students a primary mentor would.
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
    where e.student_id = p_student_id and public.is_mentor_of_class(e.class_id, p_mentor_id)
  );
$$;

-- Broaden every mentor-facing policy to go through is_mentor_of_class()
-- instead of checking classes.mentor_id directly.
drop policy "classes: authenticated read active" on public.classes;
create policy "classes: authenticated read active" on public.classes
  for select using (
    is_active = true or public.current_role() = 'admin' or public.is_mentor_of_class(id, auth.uid())
  );

drop policy "classes: mentor update own" on public.classes;
create policy "classes: mentor update own" on public.classes
  for update using (public.is_mentor_of_class(id, auth.uid()));

drop policy "enrollments: mentor read own class" on public.enrollments;
create policy "enrollments: mentor read own class" on public.enrollments
  for select using (public.is_mentor_of_class(class_id, auth.uid()));

drop policy "payments: mentor read own class" on public.payments;
create policy "payments: mentor read own class" on public.payments
  for select using (public.is_mentor_of_class(class_id, auth.uid()));

drop policy "attendance: mentor insert own class" on public.attendance;
create policy "attendance: mentor insert own class" on public.attendance
  for insert with check (mentor_id = auth.uid() and public.is_mentor_of_class(class_id, auth.uid()));

drop policy "attendance: mentor read own class" on public.attendance;
create policy "attendance: mentor read own class" on public.attendance
  for select using (public.is_mentor_of_class(class_id, auth.uid()));

drop policy "attendance: mentor delete own class" on public.attendance;
create policy "attendance: mentor delete own class" on public.attendance
  for delete using (public.is_mentor_of_class(class_id, auth.uid()));
