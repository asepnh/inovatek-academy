-- Inovatek Academy: initial schema, roles, RLS policies
-- Run this once in Supabase SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- ROLES / PROFILES
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'mentor', 'parent');
create type public.enrollment_status as enum ('pending', 'active', 'cancelled');
create type public.payment_status as enum ('pending', 'paid', 'overdue', 'failed', 'cancelled');
create type public.attendance_status as enum ('present', 'late');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'parent',
  full_name text not null default '',
  email text not null default '',
  phone text,
  created_at timestamptz not null default now()
);

-- Every new auth.users row gets a matching profile (default role: parent).
-- Full name / phone come from signup metadata when provided.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'parent'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper used inside RLS policies to avoid recursive lookups.
create or replace function public.current_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- STUDENTS
-- ---------------------------------------------------------------------------
create table public.students (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null,
  grade text not null,
  qr_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create index students_parent_id_idx on public.students (parent_id);
create index students_qr_token_idx on public.students (qr_token);

-- ---------------------------------------------------------------------------
-- COURSES
-- ---------------------------------------------------------------------------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  grade_level text default 'All levels',
  monthly_fee_cents integer not null check (monthly_fee_cents >= 0),
  mentor_id uuid references public.profiles (id) on delete set null,
  schedule text default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index courses_mentor_id_idx on public.courses (mentor_id);

-- ---------------------------------------------------------------------------
-- ENROLLMENTS
-- ---------------------------------------------------------------------------
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  status public.enrollment_status not null default 'pending',
  enrolled_at timestamptz not null default now(),
  unique (student_id, course_id)
);

create index enrollments_student_id_idx on public.enrollments (student_id);
create index enrollments_course_id_idx on public.enrollments (course_id);

-- ---------------------------------------------------------------------------
-- PAYMENTS (one row per student/course/month)
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  period_month smallint not null check (period_month between 1 and 12),
  period_year smallint not null check (period_year >= 2020),
  amount_cents integer not null check (amount_cents >= 0),
  status public.payment_status not null default 'pending',
  due_date date not null,
  billplz_bill_id text,
  billplz_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (enrollment_id, period_month, period_year)
);

create index payments_student_id_idx on public.payments (student_id);
create index payments_status_idx on public.payments (status);
create index payments_billplz_bill_id_idx on public.payments (billplz_bill_id);

-- ---------------------------------------------------------------------------
-- ATTENDANCE
-- ---------------------------------------------------------------------------
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  mentor_id uuid not null references public.profiles (id) on delete set null,
  status public.attendance_status not null default 'present',
  scanned_at timestamptz not null default now()
);

create index attendance_student_id_idx on public.attendance (student_id);
create index attendance_course_id_idx on public.attendance (course_id);
create index attendance_scanned_at_idx on public.attendance (scanned_at);

-- ---------------------------------------------------------------------------
-- NOTIFICATIONS (in-app payment reminders, etc.)
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'general',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_parent_id_idx on public.notifications (parent_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.payments enable row level security;
alter table public.attendance enable row level security;
alter table public.notifications enable row level security;

-- PROFILES ---------------------------------------------------------------
create policy "profiles: self read" on public.profiles
  for select using (id = auth.uid());
create policy "profiles: admin read all" on public.profiles
  for select using (public.current_role() = 'admin');
create policy "profiles: self update" on public.profiles
  for update using (id = auth.uid());
create policy "profiles: admin update all" on public.profiles
  for update using (public.current_role() = 'admin');

-- STUDENTS -----------------------------------------------------------------
create policy "students: parent manage own" on public.students
  for all using (parent_id = auth.uid()) with check (parent_id = auth.uid());
create policy "students: admin manage all" on public.students
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "students: mentor read own roster" on public.students
  for select using (
    exists (
      select 1 from public.enrollments e
      join public.courses c on c.id = e.course_id
      where e.student_id = students.id and c.mentor_id = auth.uid()
    )
  );

-- COURSES --------------------------------------------------------------
create policy "courses: authenticated read active" on public.courses
  for select using (is_active = true or public.current_role() = 'admin' or mentor_id = auth.uid());
create policy "courses: admin manage" on public.courses
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "courses: mentor update own" on public.courses
  for update using (mentor_id = auth.uid());

-- ENROLLMENTS ------------------------------------------------------------
create policy "enrollments: parent manage own students" on public.enrollments
  for all using (
    exists (select 1 from public.students s where s.id = enrollments.student_id and s.parent_id = auth.uid())
  ) with check (
    exists (select 1 from public.students s where s.id = enrollments.student_id and s.parent_id = auth.uid())
  );
create policy "enrollments: admin manage all" on public.enrollments
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "enrollments: mentor read own course" on public.enrollments
  for select using (
    exists (select 1 from public.courses c where c.id = enrollments.course_id and c.mentor_id = auth.uid())
  );

-- PAYMENTS -----------------------------------------------------------------
create policy "payments: parent read own" on public.payments
  for select using (
    exists (select 1 from public.students s where s.id = payments.student_id and s.parent_id = auth.uid())
  );
create policy "payments: admin manage all" on public.payments
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "payments: mentor read own course" on public.payments
  for select using (
    exists (select 1 from public.courses c where c.id = payments.course_id and c.mentor_id = auth.uid())
  );
-- Payment rows are created/updated by server code using the service-role key
-- (invoice generation, Billplz webhook) which bypasses RLS, plus the policies
-- above for normal user-facing reads.

-- ATTENDANCE -----------------------------------------------------------------
create policy "attendance: mentor insert own course" on public.attendance
  for insert with check (
    mentor_id = auth.uid()
    and exists (select 1 from public.courses c where c.id = attendance.course_id and c.mentor_id = auth.uid())
  );
create policy "attendance: mentor read own course" on public.attendance
  for select using (
    exists (select 1 from public.courses c where c.id = attendance.course_id and c.mentor_id = auth.uid())
  );
create policy "attendance: parent read own students" on public.attendance
  for select using (
    exists (select 1 from public.students s where s.id = attendance.student_id and s.parent_id = auth.uid())
  );
create policy "attendance: admin manage all" on public.attendance
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- NOTIFICATIONS --------------------------------------------------------------
create policy "notifications: parent read own" on public.notifications
  for select using (parent_id = auth.uid());
create policy "notifications: parent update own (mark read)" on public.notifications
  for update using (parent_id = auth.uid());
create policy "notifications: admin manage all" on public.notifications
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
-- Notifications are inserted by server code (service-role key) during
-- invoice generation / overdue detection.

-- ---------------------------------------------------------------------------
-- Bootstrap: after creating your own account through the app's Sign Up page,
-- run this once (with your email) to promote yourself to admin:
--
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- ---------------------------------------------------------------------------
