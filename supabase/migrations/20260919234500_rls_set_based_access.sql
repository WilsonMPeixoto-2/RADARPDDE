-- Otimiza autorização escolar sem alterar a semântica de acesso.
-- Os conjuntos autorizados são calculados uma vez por statement via initPlan nas policies.
begin;

create or replace function radar_private.accessible_school_ids()
returns text[]
language sql
stable
security definer
set search_path to 'pg_catalog', 'public', 'radar_private'
as $function$
    with context as materialized (
        select
            auth.uid() as user_id,
            radar_private.current_app_role() as app_role
    ),
    allowed as (
        -- Perfis globais preservam leitura de todas as escolas.
        select s.id as school_id
        from public.schools s
        cross join context c
        where c.user_id is not null
          and c.app_role in ('technical_admin', 'sme_management', 'federal_assistant')

        union

        -- Escopo escolar explícito concede leitura independentemente do perfil efetivo.
        select uss.school_id
        from public.user_school_scopes uss
        cross join context c
        where c.user_id is not null
          and uss.user_id = c.user_id

        union

        -- Controlador lê toda a CRE ativa.
        select s.id
        from public.schools s
        join public.user_profiles up
          on up.profile_id = 'controller'
         and up.active = true
        join public.profiles p
          on p.id = up.profile_id
         and p.active = true
        cross join context c
        where c.app_role = 'controller'
          and up.user_id = c.user_id
          and up.cre_scope is not null
          and btrim(up.cre_scope) <> ''
          and s.cre = up.cre_scope

        union

        -- Semântica histórica de can_access_school para Inventário:
        -- escola da própria CRE somente quando já existe ao menos um bem,
        -- além dos escopos explícitos acima.
        select s.id
        from public.schools s
        join public.assets a on a.school_id = s.id
        join public.user_profiles up
          on up.profile_id = 'inventory'
         and up.active = true
        join public.profiles p
          on p.id = up.profile_id
         and p.active = true
        cross join context c
        where c.app_role = 'inventory'
          and up.user_id = c.user_id
          and up.cre_scope is not null
          and btrim(up.cre_scope) <> ''
          and s.cre = up.cre_scope
    )
    select coalesce(
        array_agg(allowed.school_id order by allowed.school_id),
        array[]::text[]
    )
    from allowed
$function$;

create or replace function radar_private.writable_school_ids()
returns text[]
language sql
stable
security definer
set search_path to 'pg_catalog', 'public', 'radar_private'
as $function$
    with context as materialized (
        select
            auth.uid() as user_id,
            radar_private.current_app_role() as app_role
    ),
    allowed as (
        -- Administrador técnico e Assistente Federal preservam escrita global.
        select s.id as school_id
        from public.schools s
        cross join context c
        where c.user_id is not null
          and c.app_role in ('technical_admin', 'federal_assistant')

        union

        -- Escrita explícita continua válida para qualquer usuário autenticado.
        select uss.school_id
        from public.user_school_scopes uss
        cross join context c
        where c.user_id is not null
          and uss.user_id = c.user_id
          and uss.can_write = true

        union

        -- Controlador preserva escrita colaborativa em toda a própria CRE.
        select s.id
        from public.schools s
        join public.user_profiles up
          on up.profile_id = 'controller'
         and up.active = true
        join public.profiles p
          on p.id = up.profile_id
         and p.active = true
        cross join context c
        where c.app_role = 'controller'
          and up.user_id = c.user_id
          and up.cre_scope is not null
          and btrim(up.cre_scope) <> ''
          and s.cre = up.cre_scope
    )
    select coalesce(
        array_agg(allowed.school_id order by allowed.school_id),
        array[]::text[]
    )
    from allowed
$function$;

create or replace function radar_private.inventory_cre_school_ids()
returns text[]
language sql
stable
security definer
set search_path to 'pg_catalog', 'public', 'radar_private'
as $function$
    with context as materialized (
        select
            auth.uid() as user_id,
            radar_private.current_app_role() as app_role
    )
    select coalesce(
        array_agg(s.id order by s.id),
        array[]::text[]
    )
    from public.schools s
    join public.user_profiles up
      on up.profile_id = 'inventory'
     and up.active = true
    join public.profiles p
      on p.id = up.profile_id
     and p.active = true
    cross join context c
    where c.app_role = 'inventory'
      and up.user_id = c.user_id
      and up.cre_scope is not null
      and btrim(up.cre_scope) <> ''
      and s.cre = up.cre_scope
$function$;

revoke all on function radar_private.accessible_school_ids() from public, anon;
revoke all on function radar_private.writable_school_ids() from public, anon;
revoke all on function radar_private.inventory_cre_school_ids() from public, anon;
grant execute on function radar_private.accessible_school_ids() to authenticated, service_role;
grant execute on function radar_private.writable_school_ids() to authenticated, service_role;
grant execute on function radar_private.inventory_cre_school_ids() to authenticated, service_role;

-- Mantém a API pública histórica, agora delegando à mesma fonte de autorização.
create or replace function radar_private.can_access_school(p_school_id text)
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog', 'public', 'radar_private'
as $function$
    select coalesce(
        p_school_id = any(radar_private.accessible_school_ids()),
        false
    )
$function$;

create or replace function radar_private.can_write_school(p_school_id text)
returns boolean
language sql
stable
security definer
set search_path to 'pg_catalog', 'public', 'radar_private'
as $function$
    select coalesce(
        p_school_id = any(radar_private.writable_school_ids()),
        false
    )
$function$;

-- Logs administrativos: preserva autoria/SME e substitui avaliação escolar linha a linha.
alter policy administrative_logs_insert on public.administrative_logs
with check (
    (select public.current_app_role()) = 'technical_admin'
    or (
        actor_user_id = (select auth.uid())
        and (
            school_id is null
            or school_id = any((select radar_private.accessible_school_ids()))
        )
    )
);

alter policy administrative_logs_read on public.administrative_logs
using (
    (select public.current_app_role()) = 'technical_admin'
    or (
        (select public.current_app_role()) = 'sme_management'
        and actor_user_id = (select auth.uid())
    )
    or (
        (select public.current_app_role()) <> all(array['technical_admin', 'sme_management']::text[])
        and (
            school_id is null
            or school_id = any((select radar_private.accessible_school_ids()))
        )
    )
);

-- Patrimônio mantém a exceção de Inventário por CRE, separada da escrita cadastral genérica.
alter policy assets_read on public.assets
using (
    school_id = any((select radar_private.accessible_school_ids()))
    or school_id = any((select radar_private.inventory_cre_school_ids()))
);

alter policy assets_insert on public.assets
with check (
    (
        (select public.current_app_role()) = any(array['technical_admin', 'federal_assistant', 'controller']::text[])
        and school_id = any((select radar_private.writable_school_ids()))
    )
    or school_id = any((select radar_private.inventory_cre_school_ids()))
);

alter policy assets_update on public.assets
using (
    (
        (select public.current_app_role()) = any(array['technical_admin', 'federal_assistant', 'controller']::text[])
        and school_id = any((select radar_private.writable_school_ids()))
    )
    or school_id = any((select radar_private.inventory_cre_school_ids()))
)
with check (
    (
        (select public.current_app_role()) = any(array['technical_admin', 'federal_assistant', 'controller']::text[])
        and school_id = any((select radar_private.writable_school_ids()))
    )
    or school_id = any((select radar_private.inventory_cre_school_ids()))
);

alter policy pendencies_read on public.pendencies
using (school_id = any((select radar_private.accessible_school_ids())));

alter policy pendencies_insert on public.pendencies
with check (school_id = any((select radar_private.writable_school_ids())));

alter policy pendencies_update on public.pendencies
using (school_id = any((select radar_private.writable_school_ids())))
with check (school_id = any((select radar_private.writable_school_ids())));

alter policy pendency_contacts_read on public.pendency_contacts
using (school_id = any((select radar_private.accessible_school_ids())));

alter policy pendency_contacts_insert on public.pendency_contacts
with check (school_id = any((select radar_private.writable_school_ids())));

alter policy pendency_contacts_update on public.pendency_contacts
using (school_id = any((select radar_private.writable_school_ids())))
with check (school_id = any((select radar_private.writable_school_ids())));

alter policy pendency_attempts_read on public.pendency_attempts
using (
    exists (
        select 1
        from public.pendencies p
        where p.id = pendency_attempts.pendency_id
          and p.school_id = any((select radar_private.accessible_school_ids()))
    )
);

alter policy pendency_attempts_insert on public.pendency_attempts
with check (
    exists (
        select 1
        from public.pendencies p
        where p.id = pendency_attempts.pendency_id
          and p.school_id = any((select radar_private.writable_school_ids()))
    )
);

alter policy pendency_attempts_update on public.pendency_attempts
using (
    exists (
        select 1
        from public.pendencies p
        where p.id = pendency_attempts.pendency_id
          and p.school_id = any((select radar_private.writable_school_ids()))
    )
)
with check (
    exists (
        select 1
        from public.pendencies p
        where p.id = pendency_attempts.pendency_id
          and p.school_id = any((select radar_private.writable_school_ids()))
    )
);

alter policy registered_invoices_read on public.registered_invoices
using (school_id = any((select radar_private.accessible_school_ids())));

alter policy registered_invoices_insert on public.registered_invoices
with check (school_id = any((select radar_private.writable_school_ids())));

alter policy registered_invoices_update on public.registered_invoices
using (school_id = any((select radar_private.writable_school_ids())))
with check (school_id = any((select radar_private.writable_school_ids())));

alter policy school_programs_read on public.school_programs
using (
    school_id = any((select radar_private.accessible_school_ids()))
    or school_id = any((select radar_private.inventory_cre_school_ids()))
);

alter policy school_programs_insert on public.school_programs
with check (school_id = any((select radar_private.writable_school_ids())));

alter policy school_programs_update on public.school_programs
using (school_id = any((select radar_private.writable_school_ids())))
with check (school_id = any((select radar_private.writable_school_ids())));

alter policy schools_read on public.schools
using (
    id = any((select radar_private.accessible_school_ids()))
    or id = any((select radar_private.inventory_cre_school_ids()))
);

alter policy schools_update on public.schools
using (id = any((select radar_private.writable_school_ids())))
with check (id = any((select radar_private.writable_school_ids())));

alter policy verifications_read on public.verifications
using (school_id = any((select radar_private.accessible_school_ids())));

alter policy verifications_insert on public.verifications
with check (school_id = any((select radar_private.writable_school_ids())));

alter policy verifications_update on public.verifications
using (school_id = any((select radar_private.writable_school_ids())))
with check (school_id = any((select radar_private.writable_school_ids())));

commit;
