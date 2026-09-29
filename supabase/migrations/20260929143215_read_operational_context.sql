-- RADAR PDDE — leitura operacional set-based por competência.
-- Consolida o fechamento funcional mensal e suas dependências históricas em uma única RPC.
begin;

create or replace function public.read_operational_context(
    p_competence_id text,
    p_history_statuses text[] default array[]::text[]
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = pg_catalog, public
as $function$
declare
    v_history_statuses text[] := coalesce(p_history_statuses, array[]::text[]);
    v_result jsonb;
begin
    if p_competence_id is null
        or p_competence_id !~ '^\d{4}-(0[1-9]|1[0-2])$' then
        raise exception 'INVALID_OPERATIONAL_CONTEXT: informe uma competência mensal válida';
    end if;

    if exists (
        select 1
        from unnest(v_history_statuses) as requested(status)
        where requested.status not in ('Resolvida', 'Cancelada')
    ) then
        raise exception 'INVALID_OPERATIONAL_CONTEXT: estado histórico de Pendência inválido';
    end if;

    with
    monthly_verifications as (
        select v.*
        from public.verifications v
        where v.competence_id = p_competence_id
    ),
    monthly_invoices as (
        select ri.*
        from public.registered_invoices ri
        where ri.competence_id = p_competence_id
    ),
    monthly_pendencies as (
        select p.*
        from public.pendencies p
        where p.competence_origin = p_competence_id
    ),
    active_pendencies as (
        select p.*
        from public.pendencies p
        where p.status in ('Aberta', 'Aguardando reanálise')
    ),
    requested_historical_pendencies as (
        select p.*
        from public.pendencies p
        where p.status = any(v_history_statuses)
    ),
    selected_pendencies as (
        select * from monthly_pendencies
        union
        select * from active_pendencies
        union
        select * from requested_historical_pendencies
    ),
    monthly_assets as (
        select a.*
        from public.assets a
        where a.competence_id = p_competence_id
    ),
    active_assets as (
        select a.*
        from public.assets a
        where a.status in ('Não encaminhada', 'Encaminhada')
    ),
    base_assets as (
        select * from monthly_assets
        union
        select * from active_assets
    ),
    selected_attempts as (
        select pa.*
        from public.pendency_attempts pa
        join selected_pendencies p on p.id = pa.pendency_id
    ),
    selected_contacts as (
        select pc.*
        from public.pendency_contacts pc
        join selected_pendencies p on p.id = pc.pendency_id
    ),
    pendency_dependency_contexts as (
        select distinct
            p.school_id,
            p.competence_origin as competence_id,
            p.program_id
        from selected_pendencies p
        where p.competence_origin <> p_competence_id
    ),
    pendency_verification_dependencies as (
        select v.*
        from public.verifications v
        join pendency_dependency_contexts c
          on c.school_id = v.school_id
         and c.competence_id = v.competence_id
         and (c.program_id is null or c.program_id = v.program_id)
    ),
    linked_historical_invoices as (
        select ri.*
        from public.registered_invoices ri
        join selected_pendencies p
          on p.registered_invoice_id = ri.id
        where p.competence_origin <> p_competence_id
    ),
    active_asset_invoices as (
        select ri.*
        from public.registered_invoices ri
        join active_assets a
          on a.id = ri.linked_asset_id
    ),
    invoice_dependency_contexts as (
        select distinct
            p.school_id,
            p.competence_origin as competence_id,
            p.program_id
        from selected_pendencies p
        where p.competence_origin <> p_competence_id

        union

        select distinct
            ri.school_id,
            ri.competence_id,
            ri.program_id
        from active_asset_invoices ri
        where ri.competence_id is not null
          and ri.competence_id <> p_competence_id
    ),
    dependency_invoices as (
        select ri.*
        from public.registered_invoices ri
        join invoice_dependency_contexts c
          on c.school_id = ri.school_id
         and c.competence_id = ri.competence_id
         and (c.program_id is null or c.program_id = ri.program_id)
    ),
    selected_invoices as (
        select * from monthly_invoices
        union
        select * from linked_historical_invoices
        union
        select * from active_asset_invoices
        union
        select * from dependency_invoices
    ),
    invoice_verification_contexts as (
        select distinct
            ri.school_id,
            ri.competence_id,
            ri.program_id
        from selected_invoices ri
        where ri.competence_id is not null
          and ri.competence_id <> p_competence_id
    ),
    invoice_verification_dependencies as (
        select v.*
        from public.verifications v
        join invoice_verification_contexts c
          on c.school_id = v.school_id
         and c.competence_id = v.competence_id
         and (c.program_id is null or c.program_id = v.program_id)
    ),
    selected_verifications as (
        select * from monthly_verifications
        union
        select * from pendency_verification_dependencies
        union
        select * from invoice_verification_dependencies
    ),
    linked_assets as (
        select a.*
        from public.assets a
        join selected_invoices ri
          on ri.linked_asset_id = a.id
    ),
    selected_assets as (
        select * from base_assets
        union
        select * from linked_assets
    )
    select jsonb_build_object(
        'competenceId', p_competence_id,
        'entities', jsonb_build_object(
            'verifications', coalesce(
                (select jsonb_agg(to_jsonb(v) order by v.id) from selected_verifications v),
                '[]'::jsonb
            ),
            'registeredInvoices', coalesce(
                (select jsonb_agg(to_jsonb(ri) order by ri.id) from selected_invoices ri),
                '[]'::jsonb
            ),
            'pendencies', coalesce(
                (select jsonb_agg(to_jsonb(p) order by p.id) from selected_pendencies p),
                '[]'::jsonb
            ),
            'pendencyAttempts', coalesce(
                (select jsonb_agg(to_jsonb(pa) order by pa.id) from selected_attempts pa),
                '[]'::jsonb
            ),
            'pendencyContacts', coalesce(
                (select jsonb_agg(to_jsonb(pc) order by pc.id) from selected_contacts pc),
                '[]'::jsonb
            ),
            'assets', coalesce(
                (select jsonb_agg(to_jsonb(a) order by a.id) from selected_assets a),
                '[]'::jsonb
            )
        )
    )
    into v_result;

    return v_result;
end;
$function$;

revoke all on function public.read_operational_context(text, text[])
    from public, anon, authenticated;
grant execute on function public.read_operational_context(text, text[])
    to authenticated, service_role;

comment on function public.read_operational_context(text, text[]) is
    'Retorna o contexto operacional fechado da competência em uma única leitura set-based, preservando Pendências e dependências históricas sob RLS do chamador.';

commit;
