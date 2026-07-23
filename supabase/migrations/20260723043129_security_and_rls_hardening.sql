-- RADAR PDDE — hardening de helpers privilegiados, RPC de exclusão e RLS.
-- Mantém a API pública estável, mas desloca SECURITY DEFINER para schema não exposto.

begin;

create schema if not exists radar_private;
revoke all on schema radar_private from public, anon;
grant usage on schema radar_private to authenticated, service_role;

create or replace function radar_private.current_app_role()
returns text
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
    select up.profile_id
    from public.user_profiles up
    join public.profiles p on p.id = up.profile_id
    where up.user_id = auth.uid()
      and up.active = true
      and p.active = true
    order by p.priority asc
    limit 1
$$;

create or replace function radar_private.current_controller_id()
returns text
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
    select up.controller_id
    from public.user_profiles up
    where up.user_id = auth.uid()
      and up.profile_id = 'controller'
      and up.active = true
    limit 1
$$;

create or replace function radar_private.can_access_school(p_school_id text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
    select case
        when auth.uid() is null then false
        when radar_private.current_app_role() in ('technical_admin', 'sme_management', 'federal_assistant') then true
        when exists (
            select 1
            from public.user_school_scopes uss
            where uss.user_id = auth.uid()
              and uss.school_id = p_school_id
        ) then true
        when radar_private.current_app_role() = 'controller' then exists (
            select 1
            from public.schools s
            join public.user_profiles up
              on up.user_id = auth.uid()
             and up.profile_id = 'controller'
             and up.active = true
            join public.profiles p
              on p.id = up.profile_id
             and p.active = true
            where s.id = p_school_id
              and up.cre_scope is not null
              and btrim(up.cre_scope) <> ''
              and s.cre = up.cre_scope
        )
        when radar_private.current_app_role() = 'inventory' then exists (
            select 1
            from public.schools s
            join public.assets a on a.school_id = s.id
            join public.user_profiles up
              on up.user_id = auth.uid()
             and up.profile_id = 'inventory'
             and up.active = true
            join public.profiles p
              on p.id = up.profile_id
             and p.active = true
            where s.id = p_school_id
              and up.cre_scope is not null
              and btrim(up.cre_scope) <> ''
              and s.cre = up.cre_scope
        )
        else false
    end
$$;

create or replace function radar_private.can_write_school(p_school_id text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
    select case
        when auth.uid() is null then false
        when radar_private.current_app_role() in ('technical_admin', 'federal_assistant') then true
        when radar_private.current_app_role() = 'controller' then (
            exists (
                select 1
                from public.schools s
                join public.user_profiles up
                  on up.user_id = auth.uid()
                 and up.profile_id = 'controller'
                 and up.active = true
                join public.profiles p
                  on p.id = up.profile_id
                 and p.active = true
                where s.id = p_school_id
                  and up.cre_scope is not null
                  and btrim(up.cre_scope) <> ''
                  and s.cre = up.cre_scope
            )
            or exists (
                select 1
                from public.user_school_scopes uss
                where uss.user_id = auth.uid()
                  and uss.school_id = p_school_id
                  and uss.can_write = true
            )
        )
        when exists (
            select 1
            from public.user_school_scopes uss
            where uss.user_id = auth.uid()
              and uss.school_id = p_school_id
              and uss.can_write = true
        ) then true
        else false
    end
$$;

revoke all on function radar_private.current_app_role() from public, anon;
revoke all on function radar_private.current_controller_id() from public, anon;
revoke all on function radar_private.can_access_school(text) from public, anon;
revoke all on function radar_private.can_write_school(text) from public, anon;
grant execute on function radar_private.current_app_role() to authenticated, service_role;
grant execute on function radar_private.current_controller_id() to authenticated, service_role;
grant execute on function radar_private.can_access_school(text) to authenticated, service_role;
grant execute on function radar_private.can_write_school(text) to authenticated, service_role;

create or replace function public.current_app_role()
returns text
language sql
stable
security invoker
set search_path = pg_catalog, radar_private
as $$ select radar_private.current_app_role() $$;

create or replace function public.current_controller_id()
returns text
language sql
stable
security invoker
set search_path = pg_catalog, radar_private
as $$ select radar_private.current_controller_id() $$;

create or replace function public.can_access_school(p_school_id text)
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, radar_private
as $$ select radar_private.can_access_school(p_school_id) $$;

create or replace function public.can_write_school(p_school_id text)
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, radar_private
as $$ select radar_private.can_write_school(p_school_id) $$;

revoke all on function public.current_app_role() from public, anon;
revoke all on function public.current_controller_id() from public, anon;
revoke all on function public.can_access_school(text) from public, anon;
revoke all on function public.can_write_school(text) from public, anon;
grant execute on function public.current_app_role() to authenticated, service_role;
grant execute on function public.current_controller_id() to authenticated, service_role;
grant execute on function public.can_access_school(text) to authenticated, service_role;
grant execute on function public.can_write_school(text) to authenticated, service_role;

-- Move a implementação privilegiada da exclusão composta para o schema interno.
alter function public.delete_invoice_with_effects(text, integer, boolean, integer, jsonb, integer, jsonb)
    set schema radar_private;
alter function radar_private.delete_invoice_with_effects(text, integer, boolean, integer, jsonb, integer, jsonb)
    rename to delete_invoice_with_effects_impl;

revoke all on function radar_private.delete_invoice_with_effects_impl(text, integer, boolean, integer, jsonb, integer, jsonb)
    from public, anon;
grant execute on function radar_private.delete_invoice_with_effects_impl(text, integer, boolean, integer, jsonb, integer, jsonb)
    to authenticated, service_role;

create or replace function public.delete_invoice_with_effects(
    p_invoice_id text,
    p_expected_invoice_version integer,
    p_delete_linked_asset boolean default true,
    p_expected_asset_version integer default null,
    p_verification_patch jsonb default null,
    p_expected_verification_version integer default null,
    p_administrative_log jsonb default null
)
returns jsonb
language sql
security invoker
set search_path = pg_catalog, radar_private
as $$
    select radar_private.delete_invoice_with_effects_impl(
        p_invoice_id,
        p_expected_invoice_version,
        p_delete_linked_asset,
        p_expected_asset_version,
        p_verification_patch,
        p_expected_verification_version,
        p_administrative_log
    )
$$;

revoke all on function public.delete_invoice_with_effects(text, integer, boolean, integer, jsonb, integer, jsonb)
    from public, anon;
grant execute on function public.delete_invoice_with_effects(text, integer, boolean, integer, jsonb, integer, jsonb)
    to authenticated, service_role;

-- Recria somente as policies sinalizadas pelos Advisors, preservando a semântica.
drop policy if exists schools_read on public.schools;
create policy schools_read on public.schools
for select to authenticated
using (
    public.can_access_school(id)
    or (
        (select public.current_app_role()) = 'inventory'
        and exists (
            select 1
            from public.user_profiles up
            join public.profiles p on p.id = up.profile_id and p.active = true
            where up.user_id = (select auth.uid())
              and up.profile_id = 'inventory'
              and up.active = true
              and up.cre_scope is not null
              and btrim(up.cre_scope) <> ''
              and schools.cre = up.cre_scope
        )
    )
);

drop policy if exists school_programs_read on public.school_programs;
create policy school_programs_read on public.school_programs
for select to authenticated
using (
    public.can_access_school(school_id)
    or (
        (select public.current_app_role()) = 'inventory'
        and exists (
            select 1
            from public.schools s
            join public.user_profiles up
              on up.user_id = (select auth.uid())
             and up.profile_id = 'inventory'
             and up.active = true
            join public.profiles p on p.id = up.profile_id and p.active = true
            where s.id = school_programs.school_id
              and up.cre_scope is not null
              and btrim(up.cre_scope) <> ''
              and s.cre = up.cre_scope
        )
    )
);

drop policy if exists assets_read on public.assets;
create policy assets_read on public.assets
for select to authenticated
using (
    public.can_access_school(school_id)
    or (
        (select public.current_app_role()) = 'inventory'
        and exists (
            select 1
            from public.schools s
            join public.user_profiles up
              on up.user_id = (select auth.uid())
             and up.profile_id = 'inventory'
             and up.active = true
            join public.profiles p on p.id = up.profile_id and p.active = true
            where s.id = assets.school_id
              and up.cre_scope is not null
              and btrim(up.cre_scope) <> ''
              and s.cre = up.cre_scope
        )
    )
);

drop policy if exists assets_insert on public.assets;
create policy assets_insert on public.assets
for insert to authenticated
with check (
    (
        (select public.current_app_role()) in ('technical_admin', 'federal_assistant', 'controller')
        and public.can_write_school(school_id)
    )
    or (
        (select public.current_app_role()) = 'inventory'
        and exists (
            select 1
            from public.schools s
            join public.user_profiles up
              on up.user_id = (select auth.uid())
             and up.profile_id = 'inventory'
             and up.active = true
            join public.profiles p on p.id = up.profile_id and p.active = true
            where s.id = assets.school_id
              and up.cre_scope is not null
              and btrim(up.cre_scope) <> ''
              and s.cre = up.cre_scope
        )
    )
);

drop policy if exists assets_update on public.assets;
create policy assets_update on public.assets
for update to authenticated
using (
    (
        (select public.current_app_role()) in ('technical_admin', 'federal_assistant', 'controller')
        and public.can_write_school(school_id)
    )
    or (
        (select public.current_app_role()) = 'inventory'
        and exists (
            select 1
            from public.schools s
            join public.user_profiles up
              on up.user_id = (select auth.uid())
             and up.profile_id = 'inventory'
             and up.active = true
            join public.profiles p on p.id = up.profile_id and p.active = true
            where s.id = assets.school_id
              and up.cre_scope is not null
              and btrim(up.cre_scope) <> ''
              and s.cre = up.cre_scope
        )
    )
)
with check (
    (
        (select public.current_app_role()) in ('technical_admin', 'federal_assistant', 'controller')
        and public.can_write_school(school_id)
    )
    or (
        (select public.current_app_role()) = 'inventory'
        and exists (
            select 1
            from public.schools s
            join public.user_profiles up
              on up.user_id = (select auth.uid())
             and up.profile_id = 'inventory'
             and up.active = true
            join public.profiles p on p.id = up.profile_id and p.active = true
            where s.id = assets.school_id
              and up.cre_scope is not null
              and btrim(up.cre_scope) <> ''
              and s.cre = up.cre_scope
        )
    )
);

commit;
