-- A Equipe de Inventário precisa consultar todas as escolas da própria CRE
-- para operar a seção Capital e Inventário. Esta migration registra o primeiro
-- ajuste aplicado remotamente; as migrations seguintes restringem a ampliação
-- às políticas específicas do domínio patrimonial.

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
        else false
    end
$$;

comment on function public.can_access_school(text) is
'Autoriza leitura escolar por perfil: Controladores e Equipe de Inventário acessam escolas da mesma CRE; carteiras e escopos explícitos não ampliam escrita cadastral do Inventário.';

revoke all on function public.can_access_school(text) from public;
grant execute on function public.can_access_school(text) to authenticated;
grant execute on function public.can_access_school(text) to service_role;
