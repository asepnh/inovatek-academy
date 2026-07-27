-- The "profiles: self update" policy (0001_init.sql) only restricts which
-- ROW a user can update (their own) -- RLS has no built-in concept of
-- restricting which COLUMN, so any signed-up user could currently send a
-- direct PATCH to Supabase's REST API and set their own `role` to 'admin',
-- bypassing this app's UI entirely.
--
-- Fix: a trigger that blocks any role change unless the acting session is
-- already an admin. Legitimate role changes still work fine:
--  - An admin promoting someone via /admin/users/[id]/edit acts through
--    their own authenticated (admin) session, so current_role() = 'admin'
--    and the change is allowed.
--  - Invite consumption and createUserAccount() go through the service-role
--    client (no auth.uid()), so current_role() returns null there --
--    trusted backend code paths are unaffected, only end-user sessions are
--    restricted.
create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- current_role() is null when there's no authenticated session at all
  -- (i.e. the service-role client), which must stay unrestricted -- only
  -- block real end-user sessions that aren't an admin.
  if new.role is distinct from old.role
     and public.current_role() is not null
     and public.current_role() <> 'admin' then
    raise exception 'Only an admin can change a user''s role.';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_self_role_change
  before update on public.profiles
  for each row execute procedure public.prevent_self_role_change();
