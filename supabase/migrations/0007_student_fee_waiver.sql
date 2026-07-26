-- Lets an admin exempt a specific student from monthly billing (e.g. staff
-- perk for a mentor's own child). The invoice generator skips creating a
-- payment row entirely for waived students -- see src/lib/invoices.ts.
alter table public.students add column fee_waived boolean not null default false;
