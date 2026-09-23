-- Alinha a validação SQL do novo envio com o contrato canônico de patrimônio.
-- O domínio nomeia o bem como "<Programa> - <Descrição da despesa>", enquanto
-- versões anteriores da RPC aceitavam apenas a descrição nua da Nota Fiscal.
-- Mantemos ambos os formatos exatos por compatibilidade, sem relaxar escola,
-- competência, tipo, número, valor, vínculo ou exigência de patrimônio novo.

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
                or (
                    nullif(p_asset ->> 'description', '') is distinct from nullif(p_invoice ->> 'description', '')
                    and nullif(p_asset ->> 'description', '') is distinct from concat(
                        coalesce(
                            (select nullif(name, '') from public.programs where id = v_actual_invoice.program_id),
                            v_actual_invoice.program_id
                        ),
                        ' - ',
                        p_invoice ->> 'description'
                    )
                )
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
