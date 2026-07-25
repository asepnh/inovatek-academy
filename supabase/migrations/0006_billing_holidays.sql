-- Lets an admin mark a given month as a billing holiday (e.g. school break)
-- so the monthly invoice-generation cron skips creating new payment rows
-- for that month, without needing to disable the cron entirely. Existing
-- overdue-payment detection still runs as normal on holiday months.
create table public.billing_holidays (
  year smallint not null check (year >= 2020),
  month smallint not null check (month between 1 and 12),
  note text default '',
  created_at timestamptz not null default now(),
  primary key (year, month)
);

alter table public.billing_holidays enable row level security;

create policy "billing_holidays: admin manage all" on public.billing_holidays
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
