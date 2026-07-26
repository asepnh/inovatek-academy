-- Lets an admin generate a single-use signup link that pre-sets the
-- signer-upper's role (e.g. mentor), so the admin doesn't need to know the
-- person's details in advance -- they just self-register normally via
-- /signup?invite=<token>, and src/actions/auth.ts's signUp() consumes the
-- token server-side (via the service-role client, so no public RLS read
-- access is needed) instead of hardcoding role: 'parent'.
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  role public.user_role not null default 'mentor',
  created_by uuid references public.profiles (id) on delete set null,
  used_by uuid references public.profiles (id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

alter table public.invites enable row level security;

create policy "invites: admin manage all" on public.invites
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
-- No policy for anon/authenticated beyond admin: the signup flow validates
-- and consumes tokens server-side via the service-role client, which
-- bypasses RLS, so an unauthenticated visitor never needs direct table
-- access to redeem their invite link.
