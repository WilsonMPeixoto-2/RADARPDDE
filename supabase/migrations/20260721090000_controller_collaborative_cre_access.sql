-- RADAR PDDE — acesso colaborativo dos Controladores dentro da mesma CRE.
-- A carteira permanece como responsabilidade principal e filtro padrão,
-- não como fronteira de autorização entre integrantes da equipe.

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

create or replace function public.can_write_school(p_school_id text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
    select case
        when auth.uid() is null then false
        when public.current_app_role() in ('technical_admin', 'federal_assistant') then true
        when public.current_app_role() = 'controller' then (
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

revoke all on function public.can_access_school(text) from public;
revoke all on function public.can_write_school(text) from public;
grant execute on function public.can_access_school(text) to authenticated;
grant execute on function public.can_write_school(text) to authenticated;

comment on function public.can_access_school(text) is
    'Autoriza leitura pelo papel institucional. Controladores acessam todas as escolas da própria CRE; carteira define responsabilidade e filtro padrão.';

comment on function public.can_write_school(text) is
    'Autoriza escrita operacional. Controladores colaboram em todas as escolas da própria CRE sem alterar automaticamente a responsabilidade principal.';
