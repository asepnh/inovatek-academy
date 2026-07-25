-- Rename the "courses" domain to "classes" to match the renamed UI
-- terminology (Course -> Class). Run this once in the Supabase SQL editor.
--
-- Postgres resolves RLS policy bodies, views, and check constraints by
-- catalog OID/attnum rather than by name, so renaming the table/columns
-- below automatically updates every policy that references them (e.g.
-- "attendance: mentor read own course") without needing to redefine them.
-- We still rename the policy names themselves, plus indexes/constraints,
-- purely for readability -- none of this changes behavior.

alter table public.courses rename to classes;
alter index public.courses_pkey rename to classes_pkey;
alter index public.courses_mentor_id_idx rename to classes_mentor_id_idx;

alter table public.enrollments rename column course_id to class_id;
alter index public.enrollments_course_id_idx rename to enrollments_class_id_idx;
alter table public.enrollments rename constraint enrollments_course_id_fkey to enrollments_class_id_fkey;
alter table public.enrollments rename constraint enrollments_student_id_course_id_key to enrollments_student_id_class_id_key;

alter table public.payments rename column course_id to class_id;
alter table public.payments rename constraint payments_course_id_fkey to payments_class_id_fkey;

alter table public.attendance rename column course_id to class_id;
alter index public.attendance_course_id_idx rename to attendance_class_id_idx;
alter table public.attendance rename constraint attendance_course_id_fkey to attendance_class_id_fkey;

-- Cosmetic: rename policies so their names match the new terminology.
alter policy "courses: authenticated read active" on public.classes rename to "classes: authenticated read active";
alter policy "courses: admin manage" on public.classes rename to "classes: admin manage";
alter policy "courses: mentor update own" on public.classes rename to "classes: mentor update own";

alter policy "enrollments: mentor read own course" on public.enrollments rename to "enrollments: mentor read own class";
alter policy "payments: mentor read own course" on public.payments rename to "payments: mentor read own class";
alter policy "attendance: mentor insert own course" on public.attendance rename to "attendance: mentor insert own class";
alter policy "attendance: mentor read own course" on public.attendance rename to "attendance: mentor read own class";
alter policy "attendance: mentor delete own course" on public.attendance rename to "attendance: mentor delete own class";
