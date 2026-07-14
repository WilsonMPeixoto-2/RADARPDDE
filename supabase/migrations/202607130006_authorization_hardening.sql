-- RADAR PDDE — endurecimento do modelo de autorização.
-- Corrige a distinção entre escopo somente leitura e escopo com escrita.

create unique index user_profiles_one_active_per_user_idx
    on public.user_profiles (user_id)
    where active = true;

create index user_school_scopes_user_idx
    on public.user_school_scopes (user_id);

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
                where s.id = p_school_id
                  and s.controller_id = public.current_controller_id()
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

revoke all on function public.can_write_school(text) from public;
grant execute on function public.can_write_school(text) to authenticated;

comment on function public.can_write_school(text) is
    'Autoriza escrita por perfil institucional, carteira própria ou exceção explicitamente marcada com can_write.';
