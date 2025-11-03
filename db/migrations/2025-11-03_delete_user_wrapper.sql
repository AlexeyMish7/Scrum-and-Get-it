-- Wrapper function to provide a stable RPC signature that accepts `user_id`
-- This calls the main delete_user(p_user_id) function and lets clients call
-- the RPC using the common parameter name `user_id` to avoid schema cache mismatches.

create or replace function public.delete_user_userid(user_id uuid)
returns void
language sql
security definer
set search_path = public, pg_catalog
as
$$
select public.delete_user($1);
$$;

grant execute on function public.delete_user_userid(uuid) to authenticated;
