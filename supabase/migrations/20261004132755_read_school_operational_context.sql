-- Leitura escolar candidata. Não substitui nem altera a RPC global vigente.
-- Completude significa F(escola, competência, históricos), não todo o histórico
-- ou todos os contatos. Referências não isoláveis exigem fallback antes do apply.
begin;

create or replace function public.read_school_operational_context(
    p_school_id text,
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
    v_school_id text := nullif(btrim(p_school_id), '');
    v_history_statuses text[];
    v_envelope jsonb;
    v_entities jsonb;
begin
    if v_school_id is null then
        raise exception 'INVALID_SCHOOL_OPERATIONAL_CONTEXT: informe uma escola';
    end if;
    if p_competence_id is null
        or p_competence_id !~ '^\d{4}-(0[1-9]|1[0-2])$' then
        raise exception 'INVALID_SCHOOL_OPERATIONAL_CONTEXT: informe uma competência mensal válida';
    end if;
    if exists (
        select 1 from unnest(p_history_statuses) as requested(status)
        where requested.status is null or requested.status not in ('Resolvida', 'Cancelada')
    ) then
        raise exception 'INVALID_SCHOOL_OPERATIONAL_CONTEXT: estado histórico de Pendência inválido';
    end if;
    select coalesce(array_agg(distinct status order by status), array[]::text[])
        into v_history_statuses from unnest(p_history_statuses) as requested(status);

    v_envelope := jsonb_build_object(
        'schemaVersion', 1,
        'schoolId', v_school_id,
        'competenceId', p_competence_id,
        'historyStatuses', to_jsonb(v_history_statuses),
        'coverage', jsonb_build_object(
            'kind', 'competence-and-dependencies',
            'complete', true,
            'contacts', 'selected-pendencies',
            'collections', jsonb_build_array('verifications', 'registeredInvoices',
                'pendencies', 'pendencyAttempts', 'pendencyContacts', 'assets')
        ),
        'fallback', null
    );

    -- FKs por ID não garantem escola comum. Inspecionar os dois sentidos evita
    -- omitir dependências locais selecionadas pela RPC global via raiz estrangeira.
    -- O guard é conservador: considera relações visíveis de qualquer competência
    -- da escola, inclusive as que não estão na cobertura mensal solicitada.
    -- Destino oculto por RLS também é não isolável; nunca consultar como DEFINER.
    if exists (
        select 1 from public.registered_invoices i
        where i.school_id = v_school_id and (
            (i.linked_asset_id is not null and not exists (
                select 1 from public.assets a where a.id = i.linked_asset_id and a.school_id = v_school_id
            )) or (i.verification_id is not null and not exists (
                select 1 from public.verifications v where v.id = i.verification_id and v.school_id = v_school_id
            ))
        )
    ) or exists (
        select 1 from public.pendencies p
        where p.school_id = v_school_id and p.registered_invoice_id is not null
          and not exists (select 1 from public.registered_invoices i
              where i.id = p.registered_invoice_id and i.school_id = v_school_id)
    ) or exists (
        select 1 from public.pendency_contacts c
        where c.school_id = v_school_id and c.pendency_id is not null
          and not exists (select 1 from public.pendencies p
              where p.id = c.pendency_id and p.school_id = v_school_id)
    ) or exists (
        select 1 from public.assets a
        join public.registered_invoices i on i.linked_asset_id = a.id
        where a.school_id = v_school_id and i.school_id <> v_school_id
    ) or exists (
        select 1 from public.verifications v
        join public.registered_invoices i on i.verification_id = v.id
        where v.school_id = v_school_id and i.school_id <> v_school_id
    ) or exists (
        select 1 from public.registered_invoices i
        join public.pendencies p on p.registered_invoice_id = i.id
        where i.school_id = v_school_id and p.school_id <> v_school_id
    ) or exists (
        select 1 from public.pendencies p
        join public.pendency_contacts c on c.pendency_id = p.id
        where p.school_id = v_school_id and c.school_id <> v_school_id
    ) then
        return jsonb_set(v_envelope, '{coverage,complete}', 'false'::jsonb)
            || jsonb_build_object('entities', null,
                'fallback', jsonb_build_object('kind', 'global', 'reason', 'NON_ISOLATABLE_RELATION'));
    end if;

    -- Mesmo fechamento da RPC global, restringindo raízes e dependências na SQL,
    -- antes de UNION/JSON. Não chamar a RPC global para filtrar seu JSON pronto.
    with
    monthly_verifications as (
        select v.* from public.verifications v
        where v.school_id = v_school_id and v.competence_id = p_competence_id
    ),
    monthly_invoices as (
        select i.* from public.registered_invoices i
        where i.school_id = v_school_id and i.competence_id = p_competence_id
    ),
    selected_pendencies as (
        select p.* from public.pendencies p
        where p.school_id = v_school_id and (
            p.competence_origin = p_competence_id
            or p.status in ('Aberta', 'Aguardando reanálise')
            or p.status = any(v_history_statuses)
        )
    ),
    active_assets as (
        select a.* from public.assets a
        where a.school_id = v_school_id and a.status in ('Não encaminhada', 'Encaminhada')
    ),
    base_assets as (
        select a.* from public.assets a
        where a.school_id = v_school_id and a.competence_id = p_competence_id
        union
        select * from active_assets
    ),
    selected_attempts as (
        select pa.* from public.pendency_attempts pa
        join selected_pendencies p on p.id = pa.pendency_id
    ),
    selected_contacts as (
        select pc.* from public.pendency_contacts pc
        join selected_pendencies p on p.id = pc.pendency_id
        where pc.school_id = v_school_id
    ),
    pendency_dependency_contexts as (
        select distinct p.school_id, p.competence_origin as competence_id, p.program_id
        from selected_pendencies p where p.competence_origin <> p_competence_id
    ),
    pendency_verification_dependencies as (
        select v.* from public.verifications v
        join pendency_dependency_contexts c on c.school_id = v.school_id
            and c.competence_id = v.competence_id
            and (c.program_id is null or c.program_id = v.program_id)
        where v.school_id = v_school_id
    ),
    linked_historical_invoices as (
        select i.* from public.registered_invoices i
        join selected_pendencies p on p.registered_invoice_id = i.id
        where p.competence_origin <> p_competence_id and i.school_id = v_school_id
    ),
    active_asset_invoices as (
        select i.* from public.registered_invoices i
        join active_assets a on a.id = i.linked_asset_id
        where i.school_id = v_school_id
    ),
    invoice_dependency_contexts as (
        select distinct p.school_id, p.competence_origin as competence_id, p.program_id
        from selected_pendencies p where p.competence_origin <> p_competence_id
        union
        select distinct i.school_id, i.competence_id, i.program_id
        from active_asset_invoices i
        where i.competence_id is not null and i.competence_id <> p_competence_id
    ),
    dependency_invoices as (
        select i.* from public.registered_invoices i
        join invoice_dependency_contexts c on c.school_id = i.school_id
            and c.competence_id = i.competence_id
            and (c.program_id is null or c.program_id = i.program_id)
        where i.school_id = v_school_id
    ),
    selected_invoices as (
        select * from monthly_invoices
        union select * from linked_historical_invoices
        union select * from active_asset_invoices
        union select * from dependency_invoices
    ),
    invoice_verification_contexts as (
        select distinct i.school_id, i.competence_id, i.program_id
        from selected_invoices i
        where i.competence_id is not null and i.competence_id <> p_competence_id
    ),
    invoice_verification_dependencies as (
        select v.* from public.verifications v
        join invoice_verification_contexts c on c.school_id = v.school_id
            and c.competence_id = v.competence_id
            and (c.program_id is null or c.program_id = v.program_id)
        where v.school_id = v_school_id
    ),
    selected_verifications as (
        select * from monthly_verifications
        union select * from pendency_verification_dependencies
        union select * from invoice_verification_dependencies
    ),
    linked_assets as (
        select a.* from public.assets a
        join selected_invoices i on i.linked_asset_id = a.id
        where a.school_id = v_school_id
    ),
    selected_assets as (
        select * from base_assets union select * from linked_assets
    )
    select jsonb_build_object(
        'verifications', coalesce((select jsonb_agg(to_jsonb(v) order by v.id) from selected_verifications v), '[]'::jsonb),
        'registeredInvoices', coalesce((select jsonb_agg(to_jsonb(i) order by i.id) from selected_invoices i), '[]'::jsonb),
        'pendencies', coalesce((select jsonb_agg(to_jsonb(p) order by p.id) from selected_pendencies p), '[]'::jsonb),
        'pendencyAttempts', coalesce((select jsonb_agg(to_jsonb(pa) order by pa.id) from selected_attempts pa), '[]'::jsonb),
        'pendencyContacts', coalesce((select jsonb_agg(to_jsonb(pc) order by pc.id) from selected_contacts pc), '[]'::jsonb),
        'assets', coalesce((select jsonb_agg(to_jsonb(a) order by a.id) from selected_assets a), '[]'::jsonb)
    ) into v_entities;

    return v_envelope || jsonb_build_object('entities', v_entities);
end;
$function$;

revoke all on function public.read_school_operational_context(text, text, text[]) from public, anon, authenticated;
grant execute on function public.read_school_operational_context(text, text, text[]) to authenticated, service_role;

comment on function public.read_school_operational_context(text, text, text[]) is
    'Envelope v1 do fechamento operacional de uma escola/competência/históricos sob RLS. Arrays completos apenas nessa cobertura; contatos gerais excluídos. Relações não isoláveis retornam entities=null e fallback global, sem aplicação parcial.';

commit;
