-- Move the role helper functions out of the API schema (Supabase security advisor
-- 0029). RLS policies reference functions by identity, so they keep working; the
-- helpers just stop being callable as /rest/v1/rpc/... endpoints.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.app_user_id() set schema private;
alter function public.has_role(uuid, app_role[]) set schema private;
alter function public.is_member(uuid) set schema private;
alter function public.can_see_ministry(uuid, uuid) set schema private;
alter function public.is_focal_for(uuid, uuid) set schema private;

-- Functions that call the helpers by name must be able to find them.
do $$
declare f regprocedure;
begin
  for f in
    select p.oid::regprocedure
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private') and p.prosecdef
  loop
    execute format('alter function %s set search_path = public, private, pg_temp', f);
  end loop;
end $$;
