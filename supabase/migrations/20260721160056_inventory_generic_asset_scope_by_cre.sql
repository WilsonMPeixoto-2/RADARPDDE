-- Corrige a regra genérica legada do Inventário: uma escola com bem só pode
-- ser acessada por integrante ativo cuja cre_scope corresponda à CRE da escola.
-- As políticas específicas de Capital e Inventário continuam oferecendo a
-- leitura transversal das escolas da própria CRE, inclusive sem bens.

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
            join public.assets a
              on a.school_id = s.id
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
'Predicado genérico de acesso escolar. Inventário acessa genericamente apenas escolas com bens dentro da própria CRE; a leitura completa da seção patrimonial é concedida pelas políticas específicas.';

revoke all on function public.can_access_school(text) from public;
grant execute on function public.can_access_school(text) to authenticated;
grant execute on function public.can_access_school(text) to service_role;
