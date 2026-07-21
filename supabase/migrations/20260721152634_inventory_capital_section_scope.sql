-- Escopo específico da seção Capital e Inventário.
-- A Equipe de Inventário consulta escolas e programas da própria CRE e opera
-- bens patrimoniais, sem ampliar o acesso genérico às demais tabelas do RADAR.

create or replace function public.inventory_can_access_cre_school(p_school_id text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
    select auth.uid() is not null
       and public.current_app_role() = 'inventory'
       and exists (
            select 1
            from public.schools s
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
$$;

comment on function public.inventory_can_access_cre_school(text) is
'Autoriza a Equipe de Inventário a consultar escolas da própria CRE exclusivamente nas políticas da seção Capital e Inventário.';

revoke all on function public.inventory_can_access_cre_school(text) from public;
grant execute on function public.inventory_can_access_cre_school(text) to authenticated;
grant execute on function public.inventory_can_access_cre_school(text) to service_role;

create or replace function public.can_access_school(p_school_id text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
    select case
        when auth.uid() is null then false
        when public.current_app_role() in ('technical_admin', 'sme_management', 'federal_assistant') then true
        when exists (
            select 1
            from public.user_school_scopes uss
            where uss.user_id = auth.uid()
              and uss.school_id = p_school_id
        ) then true
        when public.current_app_role() = 'controller' then exists (
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
        when public.current_app_role() = 'inventory' then exists (
            select 1
            from public.assets a
            where a.school_id = p_school_id
        )
        else false
    end
$$;

comment on function public.can_access_school(text) is
'Predicado genérico de acesso escolar. O acesso transversal do Inventário à seção patrimonial é tratado por inventory_can_access_cre_school nas políticas específicas.';

revoke all on function public.can_access_school(text) from public;
grant execute on function public.can_access_school(text) to authenticated;
grant execute on function public.can_access_school(text) to service_role;

drop policy if exists schools_read on public.schools;
create policy schools_read
on public.schools
for select
to authenticated
using (
    public.can_access_school(id)
    or public.inventory_can_access_cre_school(id)
);

drop policy if exists school_programs_read on public.school_programs;
create policy school_programs_read
on public.school_programs
for select
to authenticated
using (
    public.can_access_school(school_id)
    or public.inventory_can_access_cre_school(school_id)
);

drop policy if exists assets_read on public.assets;
create policy assets_read
on public.assets
for select
to authenticated
using (
    public.can_access_school(school_id)
    or public.inventory_can_access_cre_school(school_id)
);

drop policy if exists assets_insert on public.assets;
create policy assets_insert
on public.assets
for insert
to authenticated
with check (
    (
        public.current_app_role() in ('technical_admin', 'federal_assistant')
        and public.can_access_school(school_id)
    )
    or (
        public.current_app_role() = 'inventory'
        and public.inventory_can_access_cre_school(school_id)
    )
);

drop policy if exists assets_update on public.assets;
create policy assets_update
on public.assets
for update
to authenticated
using (
    (
        public.current_app_role() in ('technical_admin', 'federal_assistant')
        and public.can_access_school(school_id)
    )
    or (
        public.current_app_role() = 'inventory'
        and public.inventory_can_access_cre_school(school_id)
    )
)
with check (
    (
        public.current_app_role() in ('technical_admin', 'federal_assistant')
        and public.can_access_school(school_id)
    )
    or (
        public.current_app_role() = 'inventory'
        and public.inventory_can_access_cre_school(school_id)
    )
);
