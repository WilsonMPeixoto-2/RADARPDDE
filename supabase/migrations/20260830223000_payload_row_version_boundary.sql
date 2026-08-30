-- Hotfix pós-PR #211: rowVersion é metadado de concorrência, não conteúdo documental.
-- O bridge antigo replicava rowVersion dentro de payload e as RPCs de abertura atômica
-- comparavam o payload inteiro, criando falso conflito mesmo com expected row_version correto.
--
-- 1) limpa apenas as chaves técnicas já persistidas;
-- 2) mantém row_version exclusivamente na coluna canônica;
-- 3) ignora essas chaves na validação defensiva das duas aberturas atômicas;
-- 4) continua bloqueando qualquer alteração real de identidade, valor, número ou conteúdo.

update public.registered_invoices
   set payload = coalesce(payload, '{}'::jsonb) - 'rowVersion' - 'row_version'
 where coalesce(payload, '{}'::jsonb) ? 'rowVersion'
    or coalesce(payload, '{}'::jsonb) ? 'row_version';

update public.verifications
   set payload = coalesce(payload, '{}'::jsonb) - 'rowVersion' - 'row_version'
 where coalesce(payload, '{}'::jsonb) ? 'rowVersion'
    or coalesce(payload, '{}'::jsonb) ? 'row_version';

update public.pendencies
   set payload = coalesce(payload, '{}'::jsonb) - 'rowVersion' - 'row_version'
 where coalesce(payload, '{}'::jsonb) ? 'rowVersion'
    or coalesce(payload, '{}'::jsonb) ? 'row_version';

update public.pendency_attempts
   set payload = coalesce(payload, '{}'::jsonb) - 'rowVersion' - 'row_version'
 where coalesce(payload, '{}'::jsonb) ? 'rowVersion'
    or coalesce(payload, '{}'::jsonb) ? 'row_version';

update public.pendency_contacts
   set payload = coalesce(payload, '{}'::jsonb) - 'rowVersion' - 'row_version'
 where coalesce(payload, '{}'::jsonb) ? 'rowVersion'
    or coalesce(payload, '{}'::jsonb) ? 'row_version';

update public.assets
   set payload = coalesce(payload, '{}'::jsonb) - 'rowVersion' - 'row_version'
 where coalesce(payload, '{}'::jsonb) ? 'rowVersion'
    or coalesce(payload, '{}'::jsonb) ? 'row_version';

create or replace function public.save_invoice_document_with_pendency(
    p_invoice jsonb,
    p_expected_invoice_version integer,
    p_verification_patch jsonb,
    p_expected_verification_version integer,
    p_pendency jsonb,
    p_administrative_log jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_invoice_id text := nullif(p_invoice ->> 'id', '');
    v_pendency_invoice_id text := nullif(p_pendency ->> 'registered_invoice_id', '');
    v_analysis text := p_invoice #>> '{payload,analiseDocumentoFiscal}';
    v_actual_invoice public.registered_invoices%rowtype;
    v_actual_verification public.verifications%rowtype;
    v_invoice_patch jsonb;
    v_verification_patch jsonb;
    v_invoice_result jsonb;
    v_pendency_result jsonb;
begin
    if coalesce(jsonb_typeof(p_invoice), '') <> 'object'
        or coalesce(jsonb_typeof(p_verification_patch), '') <> 'object'
        or coalesce(jsonb_typeof(p_pendency), '') <> 'object'
        or v_invoice_id is null
        or v_pendency_invoice_id is distinct from v_invoice_id
        or nullif(p_pendency ->> 'document_key', '') is distinct from 'notaFiscal'
        or nullif(p_pendency ->> 'status', '') is distinct from 'Aberta' then
        raise exception 'VALIDATION_ERROR: Pendência de Notas Fiscais deve apontar para a despesa atualizada';
    end if;
    if nullif(p_invoice ->> 'expense_type', '') not in (
            'consumo', 'permanente', 'servico', 'boleto_internet', 'a_identificar'
        )
        or v_analysis <> 'Incorreto' then
        raise exception 'VALIDATION_ERROR: abertura atômica exige documento fiscal individual em estado Incorreto';
    end if;
    select * into v_actual_invoice
      from public.registered_invoices
     where id = v_invoice_id
     for update;
    if not found then raise exception 'NOT_FOUND: registered_invoices/%', v_invoice_id; end if;
    if not public.can_write_school(v_actual_invoice.school_id) then
        raise exception 'AUTHORIZATION_DENIED: usuário sem escrita para a escola %', v_actual_invoice.school_id;
    end if;
    if p_expected_invoice_version is null
        or v_actual_invoice.row_version <> p_expected_invoice_version then
        raise exception 'OPTIMISTIC_CONFLICT: registered_invoices/%', v_invoice_id;
    end if;
    if nullif(p_invoice ->> 'school_id', '') is distinct from v_actual_invoice.school_id
        or nullif(p_invoice ->> 'competence_id', '') is distinct from v_actual_invoice.competence_id
        or nullif(p_invoice ->> 'program_id', '') is distinct from v_actual_invoice.program_id
        or nullif(p_invoice ->> 'verification_id', '') is distinct from v_actual_invoice.verification_id
        or nullif(p_invoice ->> 'source_context_key', '') is distinct from v_actual_invoice.source_context_key
        or nullif(p_invoice ->> 'linked_asset_id', '') is distinct from v_actual_invoice.linked_asset_id
        or nullif(p_invoice ->> 'description', '') is distinct from v_actual_invoice.description
        or nullif(p_invoice ->> 'expense_type', '') is distinct from v_actual_invoice.expense_type
        or coalesce(p_invoice ->> 'invoice_number', '') is distinct from coalesce(v_actual_invoice.invoice_number, '')
        or (p_invoice ->> 'amount')::numeric is distinct from v_actual_invoice.amount
        or (coalesce(p_invoice -> 'payload', '{}'::jsonb) - 'analiseDocumentoFiscal' - 'rowVersion' - 'row_version')
            is distinct from (coalesce(v_actual_invoice.payload, '{}'::jsonb) - 'analiseDocumentoFiscal' - 'rowVersion' - 'row_version') then
        raise exception 'VALIDATION_ERROR: abertura fiscal não pode alterar os dados da despesa';
    end if;
    if nullif(p_pendency ->> 'school_id', '') is distinct from v_actual_invoice.school_id
        or nullif(p_pendency ->> 'competence_origin', '') is distinct from v_actual_invoice.competence_id
        or nullif(p_pendency ->> 'program_id', '') is distinct from v_actual_invoice.program_id then
        raise exception 'VALIDATION_ERROR: despesa e Pendência pertencem a contextos diferentes';
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
    if nullif(p_verification_patch ->> 'id', '') is distinct from v_actual_verification.id
        or nullif(p_verification_patch ->> 'school_id', '') is distinct from v_actual_verification.school_id
        or nullif(p_verification_patch ->> 'competence_id', '') is distinct from v_actual_verification.competence_id
        or nullif(p_verification_patch ->> 'program_id', '') is distinct from v_actual_verification.program_id
        or coalesce(p_verification_patch #>> '{analysis,notaFiscal}', '') not in (
            'Correto', 'Correto (Atrasado)', 'Incorreto', 'Não analisado'
        )
        or coalesce(p_verification_patch -> 'bonification', '{}'::jsonb)
            is distinct from coalesce(v_actual_verification.bonification, '{}'::jsonb)
        or (coalesce(p_verification_patch -> 'analysis', '{}'::jsonb) - 'notaFiscal')
            is distinct from (coalesce(v_actual_verification.analysis, '{}'::jsonb) - 'notaFiscal')
        or (coalesce(p_verification_patch -> 'payload', '{}'::jsonb) - 'rowVersion' - 'row_version')
            is distinct from (coalesce(v_actual_verification.payload, '{}'::jsonb) - 'rowVersion' - 'row_version')
        or (
            p_verification_patch ? 'bonus_result'
            and nullif(p_verification_patch ->> 'bonus_result', '') is distinct from v_actual_verification.bonus_result
        ) then
        raise exception 'VALIDATION_ERROR: abertura fiscal contém alteração indevida da verificação';
    end if;

    v_invoice_patch := to_jsonb(v_actual_invoice) - 'row_version' - 'created_at' - 'updated_at';
    v_invoice_patch := jsonb_set(
        v_invoice_patch,
        '{payload}',
        jsonb_set(
            (coalesce(v_actual_invoice.payload, '{}'::jsonb) - 'rowVersion' - 'row_version'),
            '{analiseDocumentoFiscal}',
            to_jsonb(v_analysis),
            true
        ),
        true
    );
    v_verification_patch := to_jsonb(v_actual_verification) - 'row_version' - 'created_at' - 'updated_at';
    v_verification_patch := jsonb_set(
        v_verification_patch,
        '{payload}',
        (coalesce(v_actual_verification.payload, '{}'::jsonb) - 'rowVersion' - 'row_version'),
        true
    );
    v_verification_patch := jsonb_set(
        v_verification_patch,
        '{analysis,notaFiscal}',
        p_verification_patch #> '{analysis,notaFiscal}',
        true
    );

    select public.save_invoice_with_effects(
        v_invoice_patch,
        null,
        v_verification_patch,
        p_expected_invoice_version,
        null,
        p_expected_verification_version,
        null
    ) into v_invoice_result;

    select public.save_pendency_command(
        'open',
        p_pendency,
        null,
        null,
        null,
        null,
        p_administrative_log
    ) into v_pendency_result;

    return jsonb_build_object(
        'invoice', v_invoice_result -> 'invoice',
        'verification', v_invoice_result -> 'verification',
        'pendency', v_pendency_result -> 'pendency',
        'administrative_log', v_pendency_result -> 'administrative_log'
    );
end
$$;

revoke all on function public.save_invoice_document_with_pendency(jsonb, integer, jsonb, integer, jsonb, jsonb) from public, anon;
grant execute on function public.save_invoice_document_with_pendency(jsonb, integer, jsonb, integer, jsonb, jsonb) to authenticated;

create or replace function public.save_service_advisory_with_pendency(
    p_invoice jsonb,
    p_expected_invoice_version integer,
    p_verification_patch jsonb,
    p_expected_verification_version integer,
    p_pendency jsonb,
    p_administrative_log jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_invoice_id text := nullif(p_invoice ->> 'id', '');
    v_analysis text := p_invoice #>> '{payload,analiseConsultaAssessoria}';
    v_actual_invoice public.registered_invoices%rowtype;
    v_actual_verification public.verifications%rowtype;
    v_invoice_patch jsonb;
    v_verification_patch jsonb;
    v_invoice_result jsonb;
    v_pendency_result jsonb;
begin
    if coalesce(jsonb_typeof(p_invoice), '') <> 'object'
        or coalesce(jsonb_typeof(p_verification_patch), '') <> 'object'
        or coalesce(jsonb_typeof(p_pendency), '') <> 'object'
        or v_invoice_id is null
        or nullif(p_pendency ->> 'registered_invoice_id', '') is distinct from v_invoice_id
        or nullif(p_pendency ->> 'document_key', '') is distinct from 'consAssessoria'
        or nullif(p_pendency ->> 'status', '') is distinct from 'Aberta' then
        raise exception 'VALIDATION_ERROR: pendência de Assessoria deve abrir para a NF de serviço vinculada';
    end if;
    if v_analysis is distinct from 'Incorreto' then
        raise exception 'VALIDATION_ERROR: abertura atômica exige Assessoria Incorreta';
    end if;

    select * into v_actual_invoice
      from public.registered_invoices
     where id = v_invoice_id
     for update;
    if not found then raise exception 'NOT_FOUND: registered_invoices/%', v_invoice_id; end if;
    if not public.can_write_school(v_actual_invoice.school_id) then
        raise exception 'AUTHORIZATION_DENIED: usuário sem escrita para a escola %', v_actual_invoice.school_id;
    end if;
    if p_expected_invoice_version is null
        or v_actual_invoice.row_version <> p_expected_invoice_version then
        raise exception 'OPTIMISTIC_CONFLICT: registered_invoices/%', v_invoice_id;
    end if;
    if v_actual_invoice.expense_type <> 'servico' then
        raise exception 'VALIDATION_ERROR: pendência de Assessoria exige NF de serviço';
    end if;
    if nullif(p_invoice ->> 'school_id', '') is distinct from v_actual_invoice.school_id
        or nullif(p_invoice ->> 'competence_id', '') is distinct from v_actual_invoice.competence_id
        or nullif(p_invoice ->> 'program_id', '') is distinct from v_actual_invoice.program_id
        or nullif(p_invoice ->> 'verification_id', '') is distinct from v_actual_invoice.verification_id
        or nullif(p_invoice ->> 'source_context_key', '') is distinct from v_actual_invoice.source_context_key
        or nullif(p_invoice ->> 'linked_asset_id', '') is distinct from v_actual_invoice.linked_asset_id
        or nullif(p_invoice ->> 'description', '') is distinct from v_actual_invoice.description
        or nullif(p_invoice ->> 'expense_type', '') is distinct from v_actual_invoice.expense_type
        or coalesce(p_invoice ->> 'invoice_number', '') is distinct from coalesce(v_actual_invoice.invoice_number, '')
        or (p_invoice ->> 'amount')::numeric is distinct from v_actual_invoice.amount
        or (coalesce(p_invoice -> 'payload', '{}'::jsonb) - 'analiseConsultaAssessoria' - 'rowVersion' - 'row_version')
            is distinct from (coalesce(v_actual_invoice.payload, '{}'::jsonb) - 'analiseConsultaAssessoria' - 'rowVersion' - 'row_version') then
        raise exception 'VALIDATION_ERROR: abertura da Assessoria não pode alterar os dados da NF';
    end if;
    if nullif(p_pendency ->> 'school_id', '') is distinct from v_actual_invoice.school_id
        or nullif(p_pendency ->> 'competence_origin', '') is distinct from v_actual_invoice.competence_id
        or nullif(p_pendency ->> 'program_id', '') is distinct from v_actual_invoice.program_id then
        raise exception 'VALIDATION_ERROR: NF e pendência de Assessoria pertencem a contextos diferentes';
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
    if nullif(p_verification_patch ->> 'id', '') is distinct from v_actual_verification.id
        or nullif(p_verification_patch ->> 'school_id', '') is distinct from v_actual_verification.school_id
        or nullif(p_verification_patch ->> 'competence_id', '') is distinct from v_actual_verification.competence_id
        or nullif(p_verification_patch ->> 'program_id', '') is distinct from v_actual_verification.program_id
        or (coalesce(p_verification_patch -> 'bonification', '{}'::jsonb) - 'consAssessoria' - 'consEnviada')
            is distinct from (coalesce(v_actual_verification.bonification, '{}'::jsonb) - 'consAssessoria' - 'consEnviada')
        or (coalesce(p_verification_patch -> 'analysis', '{}'::jsonb) - 'consAssessoria')
            is distinct from (coalesce(v_actual_verification.analysis, '{}'::jsonb) - 'consAssessoria')
        or (coalesce(p_verification_patch -> 'payload', '{}'::jsonb) - 'rowVersion' - 'row_version')
            is distinct from (coalesce(v_actual_verification.payload, '{}'::jsonb) - 'rowVersion' - 'row_version')
        or (
            p_verification_patch ? 'bonus_result'
            and nullif(p_verification_patch ->> 'bonus_result', '') is not null
            and nullif(p_verification_patch ->> 'bonus_result', '') is distinct from v_actual_verification.bonus_result
        ) then
        raise exception 'VALIDATION_ERROR: abertura da Assessoria contém alteração indevida da verificação';
    end if;

    v_invoice_patch := to_jsonb(v_actual_invoice) - 'row_version' - 'created_at' - 'updated_at';
    v_invoice_patch := jsonb_set(
        v_invoice_patch,
        '{payload}',
        jsonb_set(
            (coalesce(v_actual_invoice.payload, '{}'::jsonb) - 'rowVersion' - 'row_version'),
            '{analiseConsultaAssessoria}',
            to_jsonb(v_analysis),
            true
        ),
        true
    );

    v_verification_patch := to_jsonb(v_actual_verification) - 'row_version' - 'created_at' - 'updated_at';
    v_verification_patch := jsonb_set(
        v_verification_patch,
        '{payload}',
        (coalesce(v_actual_verification.payload, '{}'::jsonb) - 'rowVersion' - 'row_version'),
        true
    );
    v_verification_patch := jsonb_set(
        jsonb_set(
            jsonb_set(
                v_verification_patch,
                '{bonification,consAssessoria}',
                coalesce(p_verification_patch #> '{bonification,consAssessoria}', 'null'::jsonb),
                true
            ),
            '{bonification,consEnviada}',
            coalesce(p_verification_patch #> '{bonification,consEnviada}', 'false'::jsonb),
            true
        ),
        '{analysis,consAssessoria}',
        coalesce(p_verification_patch #> '{analysis,consAssessoria}', to_jsonb(v_analysis)),
        true
    );
    if p_verification_patch ? 'bonus_result' then
        v_verification_patch := jsonb_set(
            v_verification_patch,
            '{bonus_result}',
            coalesce(p_verification_patch -> 'bonus_result', 'null'::jsonb),
            true
        );
    end if;

    select public.save_invoice_with_effects(
        v_invoice_patch,
        null,
        v_verification_patch,
        p_expected_invoice_version,
        null,
        p_expected_verification_version,
        null
    ) into v_invoice_result;

    select public.save_pendency_command(
        'open',
        p_pendency,
        null,
        null,
        null,
        null,
        p_administrative_log
    ) into v_pendency_result;

    return jsonb_build_object(
        'invoice', v_invoice_result -> 'invoice',
        'verification', v_invoice_result -> 'verification',
        'pendency', v_pendency_result -> 'pendency',
        'administrative_log', v_pendency_result -> 'administrative_log'
    );
end
$$;

revoke all on function public.save_service_advisory_with_pendency(jsonb, integer, jsonb, integer, jsonb, jsonb) from public, anon;
grant execute on function public.save_service_advisory_with_pendency(jsonb, integer, jsonb, integer, jsonb, jsonb) to authenticated;
