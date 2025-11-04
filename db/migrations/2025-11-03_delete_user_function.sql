-- Migration: create secure delete_user(user_id uuid) RPC
-- Purpose: allow an authenticated user to irreversibly delete their account
-- Note: This function runs as the schema owner (security definer) and must
-- be created by a privileged migration runner (service role). It checks that
-- the caller's auth.uid() matches the requested user_id to avoid abuse.

-- If a function with a different parameter name exists, CREATE OR REPLACE
-- cannot rename its input parameter. Drop it first to ensure replacement
-- succeeds. We use CASCADE because dependent objects (wrapper RPC) will
-- be recreated by migrations.
drop function if exists public.delete_user(uuid) cascade;

create or replace function public.delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as
$$
begin
  -- Authorization: only the session user may delete their own account
  if auth.uid() is null or auth.uid()::uuid <> p_user_id then
    raise exception 'not_authorized' using message = 'You are not authorized to delete this user';
  end if;

  -- Delete dependent rows first to avoid FK constraint issues.
  -- Order matters depending on your schema. Adjust table names as needed.
  delete from public.documents where public.documents.user_id = p_user_id;
  delete from public.projects where public.projects.user_id = p_user_id;
  delete from public.skills where public.skills.user_id = p_user_id;
  delete from public.certifications where public.certifications.user_id = p_user_id;
  delete from public.education where public.education.user_id = p_user_id;
  delete from public.employment where public.employment.user_id = p_user_id;

  -- Remove profile row (if present)
  delete from public.profiles where public.profiles.id = p_user_id;

  -- Finally remove the auth.user row so the user cannot sign in anymore.
  delete from auth.users where auth.users.id = p_user_id;
end;
$$;

-- Allow authenticated (logged-in) users to call this function. The function itself
-- enforces that auth.uid() must equal the passed user_id.
grant execute on function public.delete_user(uuid) to authenticated;
