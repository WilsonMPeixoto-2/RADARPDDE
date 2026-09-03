-- RADAR PDDE — hotfix de integridade do novo envio de Pendências.
--
-- Corrige duas incompatibilidades entre UI/domínio e RPCs:
-- 1) substituição de envio enquanto a Pendência já está Aguardando reanálise;
-- 2) Consulta Assessoria individual com múltiplas NFs de serviço, em que
--    uma NF irmã Incorreta deve manter o agregado mensal Incorreto.
--
-- Não altera dados existentes. As funções continuam security invoker,
-- com a mesma assinatura, RLS/grants e optimistic concurrency.

create or replace function public.register_invoice_document_attempt(
    p_invoice jsonb,
    p_expected_invoice_version integer,
    p_asset jsonb,
    p_expected_asset_version integer,
    p_pendency jsonb,
    p_expected_pendency_version integer,
    p_attempt jsonb,
    p_verification_patch jsonb,
    p_expected_verification_version integer,
    p_administrative_log jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_invoice_id text := nullif(p_invoice ->> 'id', '');
    v_requested_type text := nullif(p_invoice ->> 'expense_type', '');
    v_analysis text := p_invoice #>> '{payload,analiseDocumentoFiscal}';
    v_actual_invoice public.registered_invoices%rowtype;
    v_actual_pendency public.pendencies%rowtype;
    v_actual_verification public.verifications%rowtype;
    v_next_attempt integer;
    v_identifying boolean;
    v_invoice_result jsonb;
    v_pendency_result jsonb;
begin
    if v_invoice_id is null
        or nullif(p_pendency ->> 'registered_invoice_id', '') is distinct from v_invoice_id
        or nullif(p_pendency ->> 'document_key', '') <> 'notaFiscal'
        or nullif(p_pendency ->> 'status', '') <> 'Aguardando reanálise'
        or v_analysis <> 'Não analisado' then
        raise exception 'VALIDATION_ERROR: novo envio fiscal exige documento vinculado em Não analisado e Pendência Aguardando reanálise';
    end if;

    select * into v_actual_invoice
      from public.registered_invoices
     where id = v_invoice_id
     for update;
    if not found then raise exception 'NOT_FOUND: registered_invoices/%', v_invoice_id; end if;
    if p_expected_invoice_version is null
        or v_actual_invoice.row_version <> p_expected_invoice_version then
        raise exception 'OPTIMISTIC_CONFLICT: registered_invoices/%', v_invoice_id;
    end if;

    select * into v_actual_pendency
      from public.pendencies
     where id = p_pendency ->> 'id'
     for update;
    if not found then raise exception 'NOT_FOUND: pendencies/%', p_pendency ->> 'id'; end if;
    if p_expected_pendency_version is null
        or v_actual_pendency.row_version <> p_expected_pendency_version then
        raise exception 'OPTIMISTIC_CONFLICT: pendencies/%', v_actual_pendency.id;
    end if;
    if v_actual_pendency.status not in ('Aberta', 'Aguardando reanálise')
        or v_actual_pendency.document_key <> 'notaFiscal'
        or v_actual_pendency.registered_invoice_id is distinct from v_invoice_id
        or v_actual_pendency.school_id is distinct from v_actual_invoice.school_id
        or v_actual_pendency.competence_origin is distinct from v_actual_invoice.competence_id
        or v_actual_pendency.program_id is distinct from v_actual_invoice.program_id then
        raise exception 'VALIDATION_ERROR: novo envio exige Pendência ativa vinculada à mesma despesa e contexto';
    end if;
    if nullif(p_pendency ->> 'school_id', '') is distinct from v_actual_invoice.school_id
        or nullif(p_pendency ->> 'competence_origin', '') is distinct from v_actual_invoice.competence_id
        or nullif(p_pendency ->> 'program_id', '') is distinct from v_actual_invoice.program_id then
        raise exception 'VALIDATION_ERROR: contexto do novo envio não corresponde ao documento';
    end if;

    if p_attempt is null
        or nullif(p_attempt ->> 'id', '') is null
        or nullif(p_attempt ->> 'pendency_id', '') is distinct from v_actual_pendency.id
        or nullif(p_attempt ->> 'result', '') is not null
        or nullif(p_attempt ->> 'analyzed_at', '') is not null then
        raise exception 'VALIDATION_ERROR: novo envio exige tentativa aguardando vinculada à mesma Pendência';
    end if;
    select coalesce(max(attempt_number), 0) + 1 into v_next_attempt
      from public.pendency_attempts
     where pendency_id = v_actual_pendency.id;
    if (p_attempt ->> 'attempt_number')::integer <> v_next_attempt then
        raise exception 'VALIDATION_ERROR: número da tentativa não é o próximo da Pendência';
    end if;

    select * into v_actual_verification
      from public.verifications
     where id = v_actual_invoice.verification_id
       and school_id = v_actual_invoice.school_id
       and competence_id = v_actual_invoice.competence_id
       and program_id = v_actual_invoice.program_id
     for update;
    if not found then raise exception 'NOT_FOUND: verifications/%', v_actual_invoice.verification_id; end if;
    if p_expected_verification_version is null
        or v_actual_verification.row_version <> p_expected_verification_version then
        raise exception 'OPTIMISTIC_CONFLICT: verifications/%', v_actual_invoice.verification_id;
    end if;
    if nullif(p_verification_patch ->> 'id', '') is distinct from v_actual_invoice.verification_id then
        raise exception 'VALIDATION_ERROR: verificação do novo envio não pertence ao documento';
    end if;

    if nullif(p_invoice ->> 'school_id', '') is distinct from v_actual_invoice.school_id
        or nullif(p_invoice ->> 'competence_id', '') is distinct from v_actual_invoice.competence_id
        or nullif(p_invoice ->> 'program_id', '') is distinct from v_actual_invoice.program_id
        or nullif(p_invoice ->> 'verification_id', '') is distinct from v_actual_invoice.verification_id then
        raise exception 'VALIDATION_ERROR: identidade estrutural do documento não pode ser alterada no novo envio';
    end if;

    v_identifying := v_actual_invoice.expense_type = 'a_identificar';
    if v_identifying then
        if v_actual_invoice.linked_asset_id is not null then
            raise exception 'INTEGRITY_CONFLICT: despesa a identificar não pode possuir patrimônio anterior';
        end if;
        if v_requested_type not in ('consumo', 'permanente', 'servico', 'boleto_internet')
            or nullif(p_invoice ->> 'description', '') is null
            or nullif(p_invoice ->> 'invoice_number', '') is null
            or (p_invoice ->> 'amount')::numeric < 0 then
            raise exception 'VALIDATION_ERROR: identificação exige tipo, descrição, número/referência e valor válido';
        end if;
        if v_requested_type = 'boleto_internet' and v_actual_invoice.program_id <> 'CONECTADA' then
            raise exception 'VALIDATION_ERROR: boleto de Internet só é aplicável à Educação Conectada';
        end if;
        if v_requested_type = 'permanente' then
            if p_asset is null
                or nullif(p_asset ->> 'id', '') is null
                or nullif(p_asset ->> 'school_id', '') is distinct from v_actual_invoice.school_id
                or nullif(p_invoice ->> 'linked_asset_id', '') is distinct from nullif(p_asset ->> 'id', '')
                or nullif(p_asset ->> 'competence_id', '') is distinct from v_actual_invoice.competence_id
                or nullif(p_asset ->> 'description', '') is distinct from nullif(p_invoice ->> 'description', '')
                or nullif(p_asset ->> 'expense_type', '') is distinct from 'permanente'
                or coalesce(p_asset ->> 'invoice_number', '') is distinct from coalesce(p_invoice ->> 'invoice_number', '')
                or (p_asset ->> 'amount')::numeric is distinct from (p_invoice ->> 'amount')::numeric then
                raise exception 'VALIDATION_ERROR: identificação como bem permanente exige patrimônio novo e correspondente à despesa';
            end if;
            if p_expected_asset_version is not null
                or exists (
                    select 1
                      from public.assets
                     where id = p_asset ->> 'id'
                ) then
                raise exception 'VALIDATION_ERROR: identificação como bem permanente deve criar patrimônio novo';
            end if;
        elsif p_asset is not null
            or p_expected_asset_version is not null
            or nullif(p_invoice ->> 'linked_asset_id', '') is not null then
            raise exception 'VALIDATION_ERROR: somente bem permanente pode criar ou manter vínculo patrimonial durante a identificação';
        end if;
    else
        if v_requested_type is distinct from v_actual_invoice.expense_type
            or nullif(p_invoice ->> 'description', '') is distinct from v_actual_invoice.description
            or coalesce(p_invoice ->> 'invoice_number', '') is distinct from coalesce(v_actual_invoice.invoice_number, '')
            or (p_invoice ->> 'amount')::numeric is distinct from v_actual_invoice.amount
            or nullif(p_invoice ->> 'linked_asset_id', '') is distinct from v_actual_invoice.linked_asset_id
            or p_asset is not null then
            raise exception 'VALIDATION_ERROR: novo envio de documento já identificado não pode editar a despesa';
        end if;
    end if;

    select public.save_invoice_with_effects(
        p_invoice,
        p_asset,
        null,
        p_expected_invoice_version,
        p_expected_asset_version,
        null,
        null
    ) into v_invoice_result;

    select public.save_pendency_command(
        'register_attempt',
        p_pendency,
        p_expected_pendency_version,
        p_attempt,
        p_verification_patch,
        p_expected_verification_version,
        p_administrative_log
    ) into v_pendency_result;

    return jsonb_build_object(
        'invoice', v_invoice_result -> 'invoice',
        'asset', v_invoice_result -> 'asset',
        'deleted_asset_id', v_invoice_result -> 'deleted_asset_id',
        'pendency', v_pendency_result -> 'pendency',
        'attempt', v_pendency_result -> 'attempt',
        'verification', v_pendency_result -> 'verification',
        'administrative_log', v_pendency_result -> 'administrative_log'
    );
end
$$;

revoke all on function public.register_invoice_document_attempt(jsonb, integer, jsonb, integer, jsonb, integer, jsonb, jsonb, integer, jsonb) from public, anon;
grant execute on function public.register_invoice_document_attempt(jsonb, integer, jsonb, integer, jsonb, integer, jsonb, jsonb, integer, jsonb) to authenticated;

-- Reanálise individual: altera somente a despesa vinculada e a projeção agregada.

create or replace function public.register_service_advisory_attempt(
    p_invoice jsonb,
    p_expected_invoice_version integer,
    p_pendency jsonb,
    p_expected_pendency_version integer,
    p_attempt jsonb,
    p_verification_patch jsonb,
    p_expected_verification_version integer,
    p_administrative_log jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_invoice_id text := nullif(p_invoice ->> 'id', '');
    v_pendency_id text := nullif(p_pendency ->> 'id', '');
    v_actual_invoice public.registered_invoices%rowtype;
    v_actual_pendency public.pendencies%rowtype;
    v_actual_verification public.verifications%rowtype;
    v_next_attempt_number integer;
    v_invoice_patch jsonb;
    v_pendency_patch jsonb;
    v_verification_patch jsonb;
    v_invoice_result jsonb;
    v_pendency_result jsonb;
    v_expected_advisory_analysis text;
begin
    if coalesce(jsonb_typeof(p_invoice), '') <> 'object'
        or coalesce(jsonb_typeof(p_pendency), '') <> 'object'
        or coalesce(jsonb_typeof(p_attempt), '') <> 'object'
        or coalesce(jsonb_typeof(p_verification_patch), '') <> 'object'
        or v_invoice_id is null
        or v_pendency_id is null then
        raise exception 'VALIDATION_ERROR: novo envio da Assessoria exige NF, Pendência, tentativa e verificação';
    end if;

    select * into v_actual_pendency
      from public.pendencies
     where id = v_pendency_id
     for update;
    if not found then raise exception 'NOT_FOUND: pendencies/%', v_pendency_id; end if;
    if not public.can_write_school(v_actual_pendency.school_id) then
        raise exception 'AUTHORIZATION_DENIED: usuário sem escrita para a escola %', v_actual_pendency.school_id;
    end if;
    if p_expected_pendency_version is null
        or v_actual_pendency.row_version <> p_expected_pendency_version then
        raise exception 'OPTIMISTIC_CONFLICT: pendencies/%', v_pendency_id;
    end if;
    if v_actual_pendency.status not in ('Aberta', 'Aguardando reanálise') then
        raise exception 'VALIDATION_ERROR: novo envio da Assessoria exige Pendência ativa';
    end if;
    if v_actual_pendency.document_key <> 'consAssessoria'
        or v_actual_pendency.registered_invoice_id is distinct from v_invoice_id
        or nullif(p_pendency ->> 'registered_invoice_id', '') is distinct from v_invoice_id
        or nullif(p_pendency ->> 'document_key', '') is distinct from v_actual_pendency.document_key
        or nullif(p_pendency ->> 'school_id', '') is distinct from v_actual_pendency.school_id
        or nullif(p_pendency ->> 'competence_origin', '') is distinct from v_actual_pendency.competence_origin
        or nullif(p_pendency ->> 'program_id', '') is distinct from v_actual_pendency.program_id
        or nullif(p_pendency ->> 'status', '') is distinct from 'Aguardando reanálise' then
        raise exception 'VALIDATION_ERROR: novo envio da Assessoria não corresponde à Pendência vinculada';
    end if;

    select * into v_actual_invoice
      from public.registered_invoices
     where id = v_invoice_id
     for update;
    if not found then raise exception 'NOT_FOUND: registered_invoices/%', v_invoice_id; end if;
    if p_expected_invoice_version is null
        or v_actual_invoice.row_version <> p_expected_invoice_version then
        raise exception 'OPTIMISTIC_CONFLICT: registered_invoices/%', v_invoice_id;
    end if;
    if v_actual_invoice.expense_type <> 'servico'
        or v_actual_invoice.school_id is distinct from v_actual_pendency.school_id
        or v_actual_invoice.competence_id is distinct from v_actual_pendency.competence_origin
        or v_actual_invoice.program_id is distinct from v_actual_pendency.program_id then
        raise exception 'VALIDATION_ERROR: novo envio da Assessoria aponta para NF ou contexto inválido';
    end if;
    if p_invoice #>> '{payload,analiseConsultaAssessoria}' is distinct from 'Não analisado'
        or nullif(p_invoice ->> 'school_id', '') is distinct from v_actual_invoice.school_id
        or nullif(p_invoice ->> 'competence_id', '') is distinct from v_actual_invoice.competence_id
        or nullif(p_invoice ->> 'program_id', '') is distinct from v_actual_invoice.program_id
        or nullif(p_invoice ->> 'verification_id', '') is distinct from v_actual_invoice.verification_id
        or nullif(p_invoice ->> 'source_context_key', '') is distinct from v_actual_invoice.source_context_key
        or nullif(p_invoice ->> 'linked_asset_id', '') is distinct from v_actual_invoice.linked_asset_id
        or nullif(p_invoice ->> 'description', '') is distinct from v_actual_invoice.description
        or nullif(p_invoice ->> 'expense_type', '') is distinct from v_actual_invoice.expense_type
        or coalesce(p_invoice ->> 'invoice_number', '') is distinct from coalesce(v_actual_invoice.invoice_number, '')
        or (p_invoice ->> 'amount')::numeric is distinct from v_actual_invoice.amount
        or (coalesce(p_invoice -> 'payload', '{}'::jsonb) - 'analiseConsultaAssessoria')
            is distinct from (coalesce(v_actual_invoice.payload, '{}'::jsonb) - 'analiseConsultaAssessoria') then
        raise exception 'VALIDATION_ERROR: novo envio da Assessoria não pode alterar os dados da NF';
    end if;

    select coalesce(max(attempt_number), 0) + 1
      into v_next_attempt_number
      from public.pendency_attempts
     where pendency_id = v_pendency_id;
    if nullif(p_attempt ->> 'id', '') is null
        or nullif(p_attempt ->> 'pendency_id', '') is distinct from v_pendency_id
        or (p_attempt ->> 'attempt_number')::integer is distinct from v_next_attempt_number
        or nullif(p_attempt ->> 'result', '') is not null
        or nullif(p_attempt ->> 'analyzed_at', '') is not null then
        raise exception 'VALIDATION_ERROR: tentativa da Assessoria deve ser a próxima e iniciar sem resultado';
    end if;

    select * into v_actual_verification
      from public.verifications
     where id = v_actual_invoice.verification_id
       and school_id = v_actual_invoice.school_id
       and competence_id = v_actual_invoice.competence_id
       and program_id = v_actual_invoice.program_id
     for update;
    if not found then raise exception 'NOT_FOUND: verifications/%', v_actual_invoice.verification_id; end if;
    if p_expected_verification_version is null
        or v_actual_verification.row_version <> p_expected_verification_version then
        raise exception 'OPTIMISTIC_CONFLICT: verifications/%', v_actual_invoice.verification_id;
    end if;

    -- A análise mensal é projeção das NFs de serviço. O novo envio volta
    -- somente a NF-alvo para Não analisado. Uma NF irmã ainda Incorreta
    -- mantém o agregado mensal em Incorreto.
    select case
        when exists (
            select 1
              from public.registered_invoices sibling
             where sibling.school_id = v_actual_invoice.school_id
               and sibling.competence_id = v_actual_invoice.competence_id
               and sibling.program_id is not distinct from v_actual_invoice.program_id
               and sibling.expense_type = 'servico'
               and sibling.id <> v_invoice_id
               and coalesce(
                    sibling.payload ->> 'analiseConsultaAssessoria',
                    'Não analisado'
               ) = 'Incorreto'
        ) then 'Incorreto'
        else 'Não analisado'
    end
    into v_expected_advisory_analysis;
    if nullif(p_verification_patch ->> 'id', '') is distinct from v_actual_verification.id
        or nullif(p_verification_patch ->> 'school_id', '') is distinct from v_actual_verification.school_id
        or nullif(p_verification_patch ->> 'competence_id', '') is distinct from v_actual_verification.competence_id
        or nullif(p_verification_patch ->> 'program_id', '') is distinct from v_actual_verification.program_id
        or p_verification_patch #>> '{analysis,consAssessoria}' is distinct from v_expected_advisory_analysis
        or coalesce(p_verification_patch -> 'bonification', '{}'::jsonb)
            is distinct from coalesce(v_actual_verification.bonification, '{}'::jsonb)
        or (coalesce(p_verification_patch -> 'analysis', '{}'::jsonb) - 'consAssessoria')
            is distinct from (coalesce(v_actual_verification.analysis, '{}'::jsonb) - 'consAssessoria')
        or coalesce(p_verification_patch -> 'payload', '{}'::jsonb)
            is distinct from coalesce(v_actual_verification.payload, '{}'::jsonb)
        or (
            p_verification_patch ? 'bonus_result'
            and nullif(p_verification_patch ->> 'bonus_result', '') is distinct from v_actual_verification.bonus_result
        ) then
        raise exception 'VALIDATION_ERROR: novo envio da Assessoria contém alteração indevida da verificação';
    end if;

    v_invoice_patch := to_jsonb(v_actual_invoice) - 'row_version' - 'created_at' - 'updated_at';
    v_invoice_patch := jsonb_set(
        v_invoice_patch,
        '{payload}',
        jsonb_set(
            coalesce(v_actual_invoice.payload, '{}'::jsonb),
            '{analiseConsultaAssessoria}',
            to_jsonb('Não analisado'::text),
            true
        ),
        true
    );
    v_pendency_patch := (
        to_jsonb(v_actual_pendency) - 'row_version' - 'created_at' - 'updated_at'
    ) || jsonb_build_object(
        'status', 'Aguardando reanálise',
        'responsible_area', coalesce(p_pendency ->> 'responsible_area', v_actual_pendency.responsible_area),
        'next_actor', coalesce(p_pendency ->> 'next_actor', v_actual_pendency.next_actor),
        'reason', v_actual_pendency.reason,
        'notes', coalesce(p_pendency ->> 'notes', v_actual_pendency.notes),
        'resolved_at', null,
        'canceled_at', null,
        'payload', coalesce(p_pendency -> 'payload', v_actual_pendency.payload)
    );
    v_verification_patch := to_jsonb(v_actual_verification) - 'row_version' - 'created_at' - 'updated_at';
    v_verification_patch := jsonb_set(
        v_verification_patch,
        '{analysis,consAssessoria}',
        to_jsonb(v_expected_advisory_analysis),
        true
    );

    select public.save_invoice_with_effects(
        v_invoice_patch,
        null,
        null,
        p_expected_invoice_version,
        null,
        null,
        null
    ) into v_invoice_result;

    select public.save_pendency_command(
        'register_attempt',
        v_pendency_patch,
        p_expected_pendency_version,
        p_attempt,
        v_verification_patch,
        p_expected_verification_version,
        p_administrative_log
    ) into v_pendency_result;

    return jsonb_build_object(
        'invoice', v_invoice_result -> 'invoice',
        'pendency', v_pendency_result -> 'pendency',
        'attempt', v_pendency_result -> 'attempt',
        'verification', v_pendency_result -> 'verification',
        'administrative_log', v_pendency_result -> 'administrative_log'
    );
end
$$;

revoke all on function public.register_service_advisory_attempt(jsonb, integer, jsonb, integer, jsonb, jsonb, integer, jsonb) from public, anon;
grant execute on function public.register_service_advisory_attempt(jsonb, integer, jsonb, integer, jsonb, jsonb, integer, jsonb) to authenticated;
