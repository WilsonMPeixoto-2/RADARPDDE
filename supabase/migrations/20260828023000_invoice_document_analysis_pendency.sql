-- Individualiza análise técnica e Pendências por registro de Notas Fiscais.
-- Mantém notaFiscal como dimensão agregada e registered_invoice_id como identidade
-- do documento/despesa específico. Não recria boletoInternet como documento.

begin;

alter table public.pendencies
    drop constraint if exists pendencies_registered_invoice_advisory_chk;

alter table public.pendencies
    add constraint pendencies_registered_invoice_document_chk
    check (
        registered_invoice_id is null
        or document_key in ('consAssessoria', 'notaFiscal')
    );

comment on column public.pendencies.registered_invoice_id is
    'Despesa/Nota Fiscal específica vinculada à Pendência individual de Consulta Assessoria ou Notas Fiscais.';


-- A trava histórica criada originalmente para Consulta Assessoria também deve
-- proteger qualquer Nota Fiscal com histórico individual de notaFiscal.
-- Os triggers existentes continuam apontando para esta função; redefini-la
-- mantém compatibilidade e fecha o vínculo estrutural no banco.
create or replace function radar_private.protect_service_advisory_invoice_history()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, radar_private
as $$
declare
    v_has_individual_history boolean;
    v_has_advisory_history boolean;
begin
    select
        bool_or(document_key in ('consAssessoria', 'notaFiscal')),
        bool_or(document_key = 'consAssessoria')
      into v_has_individual_history, v_has_advisory_history
      from public.pendencies
     where registered_invoice_id = old.id;

    if not coalesce(v_has_individual_history, false) then
        if tg_op = 'DELETE' then return old; end if;
        return new;
    end if;

    if tg_op = 'DELETE' then
        raise exception 'INTEGRITY_CONFLICT: Nota Fiscal possui histórico de pendência individual e não pode ser excluída';
    end if;

    if new.school_id is distinct from old.school_id
        or new.competence_id is distinct from old.competence_id
        or new.program_id is distinct from old.program_id then
        raise exception 'INTEGRITY_CONFLICT: Nota Fiscal possui histórico de pendência individual e não pode alterar escola, competência ou programa';
    end if;

    if new.expense_type is distinct from old.expense_type
        and coalesce(v_has_advisory_history, false) then
        raise exception 'INTEGRITY_CONFLICT: Nota Fiscal possui histórico de pendência da Assessoria e deve permanecer como prestação de serviço';
    end if;

    return new;
end
$$;

revoke all on function radar_private.protect_service_advisory_invoice_history()
    from public, anon, authenticated;

comment on function radar_private.protect_service_advisory_invoice_history() is
    'Impede apagar ou deslocar de escola/competência/programa Nota Fiscal com histórico individual; histórico de Assessoria também protege a natureza de serviço.';

create or replace function public.save_pendency_command(
    p_operation text,
    p_pendency jsonb,
    p_expected_pendency_version integer,
    p_attempt jsonb,
    p_verification jsonb,
    p_expected_verification_version integer,
    p_administrative_log jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_role text := public.current_app_role();
    v_operation text := lower(btrim(coalesce(p_operation, '')));
    v_id text := nullif(p_pendency ->> 'id', '');
    v_school_id text := nullif(p_pendency ->> 'school_id', '');
    v_registered_invoice_id text := nullif(p_pendency ->> 'registered_invoice_id', '');
    v_existing public.pendencies%rowtype;
    v_saved public.pendencies%rowtype;
    v_attempt public.pendency_attempts%rowtype;
    v_verification public.verifications%rowtype;
    v_log public.administrative_logs%rowtype;
    v_invoice public.registered_invoices%rowtype;
begin
    if v_operation not in ('open', 'register_attempt', 'update_status') then
        raise exception 'VALIDATION_ERROR: operação de pendência inválida';
    end if;
    if v_role not in ('controller', 'federal_assistant', 'technical_admin') then
        raise exception 'AUTHORIZATION_DENIED: perfil sem permissão para alterar pendências';
    end if;
    if jsonb_typeof(p_pendency) <> 'object'
        or v_id is null
        or v_school_id is null
        or nullif(p_pendency ->> 'competence_origin', '') is null
        or nullif(p_pendency ->> 'document_key', '') is null
        or nullif(p_pendency ->> 'status', '') is null then
        raise exception 'VALIDATION_ERROR: pendência canônica inválida';
    end if;
    if not public.can_write_school(v_school_id) then
        raise exception 'AUTHORIZATION_DENIED: usuário sem escrita para a escola %', v_school_id;
    end if;
    if not public.radar_jsonb_matches(
        'compatibilityPayload', coalesce(p_pendency -> 'payload', '{}'::jsonb)
    ) then
        raise exception 'VALIDATION_ERROR: payload da pendência incompatível';
    end if;
    if p_administrative_log is null
        or jsonb_typeof(p_administrative_log) <> 'object'
        or nullif(p_administrative_log ->> 'id', '') is null
        or nullif(p_administrative_log ->> 'action', '') is null
        or not public.radar_jsonb_matches(
            'auditDetails', coalesce(p_administrative_log -> 'details', '{}'::jsonb)
        ) then
        raise exception 'VALIDATION_ERROR: log administrativo obrigatório e inválido';
    end if;
    if nullif(p_administrative_log ->> 'school_id', '') is not null
        and (p_administrative_log ->> 'school_id') is distinct from v_school_id then
        raise exception 'VALIDATION_ERROR: log administrativo pertence a outra escola';
    end if;

    if v_operation = 'open'
        and p_pendency ->> 'document_key' = 'notaFiscal'
        and v_registered_invoice_id is null then
        raise exception 'VALIDATION_ERROR: nova Pendência de Notas Fiscais exige registered_invoice_id';
    end if;

    if v_registered_invoice_id is not null then
        if p_pendency ->> 'document_key' not in ('consAssessoria', 'notaFiscal') then
            raise exception 'VALIDATION_ERROR: documento não admite vínculo individual com despesa';
        end if;
        select * into v_invoice
          from public.registered_invoices
         where id = v_registered_invoice_id;
        if not found then
            raise exception 'NOT_FOUND: registered_invoices/%', v_registered_invoice_id;
        end if;
        if v_invoice.school_id is distinct from v_school_id
            or v_invoice.competence_id is distinct from (p_pendency ->> 'competence_origin')
            or v_invoice.program_id is distinct from nullif(p_pendency ->> 'program_id', '') then
            raise exception 'VALIDATION_ERROR: despesa e pendência pertencem a contextos diferentes';
        end if;
        if p_pendency ->> 'document_key' = 'consAssessoria'
            and v_invoice.expense_type <> 'servico' then
            raise exception 'VALIDATION_ERROR: pendência de Assessoria exige NF de serviço';
        end if;
        if p_pendency ->> 'document_key' = 'notaFiscal'
            and v_invoice.expense_type not in (
                'consumo', 'permanente', 'servico', 'boleto_internet', 'a_identificar'
            ) then
            raise exception 'VALIDATION_ERROR: tipo de despesa inválido para Pendência de Notas Fiscais';
        end if;
    end if;

    if v_operation = 'open' and ((p_verification is null) <> (p_expected_verification_version is null)) then
        raise exception 'VALIDATION_ERROR: abertura com análise exige verificação e versão esperada';
    end if;

    if p_verification is not null then
        if not public.radar_jsonb_matches('analysis', coalesce(p_verification -> 'analysis', '{}'::jsonb))
            or not public.radar_jsonb_matches('bonification', coalesce(p_verification -> 'bonification', '{}'::jsonb))
            or not public.radar_jsonb_matches('compatibilityPayload', coalesce(p_verification -> 'payload', '{}'::jsonb)) then
            raise exception 'VALIDATION_ERROR: verificação da pendência incompatível';
        end if;
        if nullif(p_verification ->> 'id', '') is null
            or nullif(p_verification ->> 'school_id', '') is distinct from v_school_id
            or nullif(p_verification ->> 'competence_id', '') is distinct from nullif(p_pendency ->> 'competence_origin', '')
            or nullif(p_verification ->> 'program_id', '') is distinct from nullif(p_pendency ->> 'program_id', '') then
            raise exception 'VALIDATION_ERROR: verificação e pendência pertencem a contextos diferentes';
        end if;
    end if;

    if v_operation = 'open' then
        if p_expected_pendency_version is not null then
            raise exception 'VALIDATION_ERROR: abertura não aceita versão esperada';
        end if;
        insert into public.pendencies (
            id, school_id, competence_origin, program_id, document_key,
            registered_invoice_id,
            status, responsible_area, next_actor, reason, notes,
            opened_at, resolved_at, canceled_at, payload
        ) values (
            v_id,
            v_school_id,
            p_pendency ->> 'competence_origin',
            nullif(p_pendency ->> 'program_id', ''),
            p_pendency ->> 'document_key',
            v_registered_invoice_id,
            p_pendency ->> 'status',
            coalesce(p_pendency ->> 'responsible_area', ''),
            coalesce(p_pendency ->> 'next_actor', ''),
            coalesce(p_pendency ->> 'reason', ''),
            coalesce(p_pendency ->> 'notes', ''),
            coalesce(nullif(p_pendency ->> 'opened_at', '')::timestamptz, now()),
            nullif(p_pendency ->> 'resolved_at', '')::timestamptz,
            nullif(p_pendency ->> 'canceled_at', '')::timestamptz,
            coalesce(p_pendency -> 'payload', '{}'::jsonb)
        )
        returning * into v_saved;
    else
        select * into v_existing
        from public.pendencies
        where id = v_id
        for update;
        if not found then raise exception 'NOT_FOUND: pendencies/%', v_id; end if;
        if v_existing.school_id is distinct from v_school_id
            or v_existing.competence_origin is distinct from (p_pendency ->> 'competence_origin')
            or v_existing.program_id is distinct from nullif(p_pendency ->> 'program_id', '')
            or v_existing.document_key is distinct from (p_pendency ->> 'document_key')
            or v_existing.registered_invoice_id is distinct from v_registered_invoice_id then
            raise exception 'VALIDATION_ERROR: contexto da pendência não pode ser alterado';
        end if;
        if p_expected_pendency_version is null
            or v_existing.row_version <> p_expected_pendency_version then
            raise exception 'OPTIMISTIC_CONFLICT: pendencies/%', v_id;
        end if;
        update public.pendencies set
            status = p_pendency ->> 'status',
            responsible_area = coalesce(p_pendency ->> 'responsible_area', ''),
            next_actor = coalesce(p_pendency ->> 'next_actor', ''),
            reason = coalesce(p_pendency ->> 'reason', ''),
            notes = coalesce(p_pendency ->> 'notes', ''),
            resolved_at = nullif(p_pendency ->> 'resolved_at', '')::timestamptz,
            canceled_at = nullif(p_pendency ->> 'canceled_at', '')::timestamptz,
            payload = coalesce(p_pendency -> 'payload', '{}'::jsonb)
        where id = v_id and row_version = p_expected_pendency_version
        returning * into v_saved;
        if not found then raise exception 'OPTIMISTIC_CONFLICT: pendencies/%', v_id; end if;
    end if;

    if v_operation = 'open' and p_verification is not null then
        update public.verifications set
            analysis = coalesce(p_verification -> 'analysis', analysis),
            bonification = coalesce(p_verification -> 'bonification', bonification),
            bonus_result = case
                when p_verification ? 'bonus_result'
                    then nullif(p_verification ->> 'bonus_result', '')
                else bonus_result
            end,
            payload = coalesce(p_verification -> 'payload', payload)
        where id = p_verification ->> 'id'
          and school_id = v_school_id
          and row_version = p_expected_verification_version
        returning * into v_verification;
        if not found then
            raise exception 'OPTIMISTIC_CONFLICT: verifications/%', p_verification ->> 'id';
        end if;
    end if;

    if v_operation = 'register_attempt' then
        if p_attempt is null
            or p_verification is null
            or p_expected_verification_version is null then
            raise exception 'VALIDATION_ERROR: novo envio exige tentativa e verificação versionada';
        end if;
        if not public.radar_jsonb_matches('attempt', p_attempt)
            or not public.radar_jsonb_matches('errors', coalesce(p_attempt -> 'errors', '[]'::jsonb))
            or not public.radar_jsonb_matches('compatibilityPayload', coalesce(p_attempt -> 'payload', '{}'::jsonb)) then
            raise exception 'VALIDATION_ERROR: tentativa incompatível';
        end if;
        insert into public.pendency_attempts (
            id, pendency_id, attempt_number, available_at, submitted_at, analyzed_at,
            result, observation, drive_url, errors, payload, created_by
        ) values (
            p_attempt ->> 'id',
            v_id,
            (p_attempt ->> 'attempt_number')::integer,
            coalesce(
                nullif(p_attempt ->> 'available_at', '')::timestamptz,
                nullif(p_attempt ->> 'submitted_at', '')::timestamptz,
                now()
            ),
            coalesce(nullif(p_attempt ->> 'submitted_at', '')::timestamptz, now()),
            nullif(p_attempt ->> 'analyzed_at', '')::timestamptz,
            nullif(p_attempt ->> 'result', ''),
            coalesce(p_attempt ->> 'observation', ''),
            coalesce(p_attempt ->> 'drive_url', ''),
            coalesce(p_attempt -> 'errors', '[]'::jsonb),
            coalesce(p_attempt -> 'payload', '{}'::jsonb),
            auth.uid()
        )
        returning * into v_attempt;

        update public.verifications set
            analysis = coalesce(p_verification -> 'analysis', analysis),
            bonification = coalesce(p_verification -> 'bonification', bonification),
            bonus_result = case
                when p_verification ? 'bonus_result'
                    then nullif(p_verification ->> 'bonus_result', '')
                else bonus_result
            end,
            payload = coalesce(p_verification -> 'payload', payload)
        where id = p_verification ->> 'id'
          and school_id = v_school_id
          and row_version = p_expected_verification_version
        returning * into v_verification;
        if not found then
            raise exception 'OPTIMISTIC_CONFLICT: verifications/%', p_verification ->> 'id';
        end if;
    end if;

    insert into public.administrative_logs (
        id, school_id, actor_user_id, user_identifier,
        profile_name, action, details, event_at
    ) values (
        p_administrative_log ->> 'id',
        v_school_id,
        auth.uid(),
        coalesce(p_administrative_log ->> 'user_identifier', ''),
        coalesce(nullif(p_administrative_log ->> 'profile_name', ''), v_role),
        p_administrative_log ->> 'action',
        coalesce(p_administrative_log -> 'details', '{}'::jsonb),
        coalesce(nullif(p_administrative_log ->> 'event_at', '')::timestamptz, now())
    )
    returning * into v_log;

    return jsonb_build_object(
        'pendency', to_jsonb(v_saved),
        'attempt', case when v_attempt.id is null then null else to_jsonb(v_attempt) end,
        'verification', case when v_verification.id is null then null else to_jsonb(v_verification) end,
        'administrative_log', to_jsonb(v_log)
    );
end
$$;

revoke all on function public.save_pendency_command(text, jsonb, integer, jsonb, jsonb, integer, jsonb) from public;
grant execute on function public.save_pendency_command(text, jsonb, integer, jsonb, jsonb, integer, jsonb) to authenticated;

-- Abertura atômica: análise individual Incorreto + resumo derivado + Pendência.
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
    v_invoice_result jsonb;
    v_pendency_result jsonb;
begin
    if v_invoice_id is null
        or v_pendency_invoice_id is distinct from v_invoice_id
        or nullif(p_pendency ->> 'document_key', '') <> 'notaFiscal' then
        raise exception 'VALIDATION_ERROR: Pendência de Notas Fiscais deve apontar para a despesa atualizada';
    end if;
    if nullif(p_invoice ->> 'expense_type', '') not in (
            'consumo', 'permanente', 'servico', 'boleto_internet', 'a_identificar'
        )
        or v_analysis <> 'Incorreto' then
        raise exception 'VALIDATION_ERROR: abertura atômica exige documento fiscal individual em estado Incorreto';
    end if;
    if nullif(p_invoice ->> 'school_id', '') is distinct from nullif(p_pendency ->> 'school_id', '')
        or nullif(p_invoice ->> 'competence_id', '') is distinct from nullif(p_pendency ->> 'competence_origin', '')
        or nullif(p_invoice ->> 'program_id', '') is distinct from nullif(p_pendency ->> 'program_id', '') then
        raise exception 'VALIDATION_ERROR: despesa e Pendência pertencem a contextos diferentes';
    end if;

    select public.save_invoice_with_effects(
        p_invoice,
        null,
        p_verification_patch,
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

-- Novo envio individual. A despesa precisa estar identificada; enquanto for
-- a_identificar, a irregularidade documental continua necessariamente Incorreta.
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
    if v_actual_pendency.status <> 'Aberta'
        or v_actual_pendency.document_key <> 'notaFiscal'
        or v_actual_pendency.registered_invoice_id is distinct from v_invoice_id
        or v_actual_pendency.school_id is distinct from v_actual_invoice.school_id
        or v_actual_pendency.competence_origin is distinct from v_actual_invoice.competence_id
        or v_actual_pendency.program_id is distinct from v_actual_invoice.program_id then
        raise exception 'VALIDATION_ERROR: novo envio exige a Pendência aberta vinculada à mesma despesa e contexto';
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
                or nullif(p_asset ->> 'school_id', '') is distinct from v_actual_invoice.school_id then
                raise exception 'VALIDATION_ERROR: identificação como bem permanente exige registro patrimonial da mesma escola';
            end if;
        elsif p_asset is not null then
            raise exception 'VALIDATION_ERROR: somente bem permanente pode criar patrimônio durante a identificação';
        end if;
    else
        if v_requested_type is distinct from v_actual_invoice.expense_type
            or nullif(p_invoice ->> 'description', '') is distinct from v_actual_invoice.description
            or coalesce(p_invoice ->> 'invoice_number', '') is distinct from coalesce(v_actual_invoice.invoice_number, '')
            or (p_invoice ->> 'amount')::numeric is distinct from v_actual_invoice.amount
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
create or replace function public.reanalyze_invoice_document_pendency(
    p_invoice jsonb,
    p_expected_invoice_version integer,
    p_pendency jsonb,
    p_attempt jsonb,
    p_verification_patch jsonb,
    p_expected_pendency_version integer,
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
    v_analysis text := p_invoice #>> '{payload,analiseDocumentoFiscal}';
    v_result text := nullif(p_attempt ->> 'result', '');
    v_actual_invoice public.registered_invoices%rowtype;
    v_actual_pendency public.pendencies%rowtype;
    v_actual_attempt public.pendency_attempts%rowtype;
    v_actual_verification public.verifications%rowtype;
    v_latest_attempt integer;
    v_invoice_result jsonb;
    v_reanalysis_result jsonb;
    v_log public.administrative_logs%rowtype;
begin
    if v_invoice_id is null
        or p_attempt is null
        or nullif(p_attempt ->> 'id', '') is null
        or nullif(p_pendency ->> 'registered_invoice_id', '') is distinct from v_invoice_id
        or nullif(p_pendency ->> 'document_key', '') <> 'notaFiscal' then
        raise exception 'VALIDATION_ERROR: reanálise exige documento, Pendência e tentativa vinculados';
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
    if v_actual_invoice.expense_type = 'a_identificar' then
        raise exception 'VALIDATION_ERROR: despesa precisa ser identificada antes da reanálise';
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
    if v_actual_pendency.status <> 'Aguardando reanálise'
        or v_actual_pendency.document_key <> 'notaFiscal'
        or v_actual_pendency.registered_invoice_id is distinct from v_invoice_id
        or v_actual_pendency.school_id is distinct from v_actual_invoice.school_id
        or v_actual_pendency.competence_origin is distinct from v_actual_invoice.competence_id
        or v_actual_pendency.program_id is distinct from v_actual_invoice.program_id then
        raise exception 'VALIDATION_ERROR: reanálise exige a Pendência correta em Aguardando reanálise';
    end if;

    select * into v_actual_attempt
      from public.pendency_attempts
     where id = p_attempt ->> 'id'
       and pendency_id = v_actual_pendency.id
     for update;
    if not found then
        raise exception 'VALIDATION_ERROR: tentativa não pertence à Pendência informada';
    end if;
    select max(attempt_number) into v_latest_attempt
      from public.pendency_attempts
     where pendency_id = v_actual_pendency.id;
    if v_actual_attempt.attempt_number is distinct from v_latest_attempt
        or v_actual_attempt.result is not null
        or v_actual_attempt.analyzed_at is not null then
        raise exception 'VALIDATION_ERROR: reanálise exige a tentativa mais recente ainda aguardando';
    end if;

    if v_result not in ('correto', 'incorreto', 'arquivo_indisponivel') then
        raise exception 'VALIDATION_ERROR: resultado de reanálise inválido';
    end if;
    if (v_result = 'correto' and v_analysis not in ('Correto', 'Correto (Atrasado)'))
        or (v_result in ('incorreto', 'arquivo_indisponivel') and v_analysis <> 'Incorreto') then
        raise exception 'VALIDATION_ERROR: resultado e análise individual são incompatíveis';
    end if;
    if (v_result = 'correto' and nullif(p_pendency ->> 'status', '') <> 'Resolvida')
        or (v_result in ('incorreto', 'arquivo_indisponivel')
            and nullif(p_pendency ->> 'status', '') <> 'Aberta') then
        raise exception 'VALIDATION_ERROR: resultado e estado final da Pendência são incompatíveis';
    end if;

    if nullif(p_invoice ->> 'school_id', '') is distinct from v_actual_invoice.school_id
        or nullif(p_invoice ->> 'competence_id', '') is distinct from v_actual_invoice.competence_id
        or nullif(p_invoice ->> 'program_id', '') is distinct from v_actual_invoice.program_id
        or nullif(p_invoice ->> 'verification_id', '') is distinct from v_actual_invoice.verification_id
        or nullif(p_invoice ->> 'expense_type', '') is distinct from v_actual_invoice.expense_type
        or nullif(p_invoice ->> 'description', '') is distinct from v_actual_invoice.description
        or coalesce(p_invoice ->> 'invoice_number', '') is distinct from coalesce(v_actual_invoice.invoice_number, '')
        or (p_invoice ->> 'amount')::numeric is distinct from v_actual_invoice.amount then
        raise exception 'VALIDATION_ERROR: reanálise não pode alterar a identidade ou os dados da despesa';
    end if;
    if nullif(p_pendency ->> 'school_id', '') is distinct from v_actual_invoice.school_id
        or nullif(p_pendency ->> 'competence_origin', '') is distinct from v_actual_invoice.competence_id
        or nullif(p_pendency ->> 'program_id', '') is distinct from v_actual_invoice.program_id then
        raise exception 'VALIDATION_ERROR: contexto da reanálise não corresponde ao documento';
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
        raise exception 'VALIDATION_ERROR: verificação da reanálise não pertence ao documento';
    end if;

    select public.save_invoice_with_effects(
        p_invoice,
        null,
        null,
        p_expected_invoice_version,
        null,
        null,
        null
    ) into v_invoice_result;

    select public.reanalyze_pendency_with_verification(
        p_pendency,
        p_attempt,
        p_verification_patch,
        p_expected_pendency_version,
        p_expected_verification_version,
        p_administrative_log
    ) into v_reanalysis_result;

    select * into v_log
      from public.administrative_logs
     where id = p_administrative_log ->> 'id';

    return jsonb_build_object(
        'invoice', v_invoice_result -> 'invoice',
        'pendency', v_reanalysis_result -> 'pendency',
        'attempt', v_reanalysis_result -> 'attempt',
        'verification', v_reanalysis_result -> 'verification',
        'administrative_log', case when v_log.id is null then null else to_jsonb(v_log) end
    );
end
$$;

revoke all on function public.reanalyze_invoice_document_pendency(jsonb, integer, jsonb, jsonb, jsonb, integer, integer, jsonb) from public, anon;
grant execute on function public.reanalyze_invoice_document_pendency(jsonb, integer, jsonb, jsonb, jsonb, integer, integer, jsonb) to authenticated;

-- Cadastro atômico da despesa não identificada: o débito sem documentação
-- já nasce Incorreto e com Pendência individual obrigatória.
create or replace function public.save_unidentified_expense_with_pendency(
    p_invoice jsonb,
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
    v_invoice_result jsonb;
    v_pendency_result jsonb;
begin
    if v_invoice_id is null
        or v_pendency_invoice_id is distinct from v_invoice_id
        or nullif(p_pendency ->> 'document_key', '') <> 'notaFiscal'
        or nullif(p_pendency ->> 'status', '') <> 'Aberta' then
        raise exception 'VALIDATION_ERROR: despesa a identificar deve abrir Pendência individual de Notas Fiscais';
    end if;
    if nullif(p_invoice ->> 'expense_type', '') <> 'a_identificar'
        or p_invoice #>> '{payload,analiseDocumentoFiscal}' <> 'Incorreto'
        or nullif(p_invoice ->> 'description', '') is null
        or (p_invoice ->> 'amount')::numeric < 0 then
        raise exception 'VALIDATION_ERROR: despesa a identificar deve nascer Incorreta com descrição e valor válido';
    end if;
    if nullif(p_invoice ->> 'school_id', '') is distinct from nullif(p_pendency ->> 'school_id', '')
        or nullif(p_invoice ->> 'competence_id', '') is distinct from nullif(p_pendency ->> 'competence_origin', '')
        or nullif(p_invoice ->> 'program_id', '') is distinct from nullif(p_pendency ->> 'program_id', '') then
        raise exception 'VALIDATION_ERROR: despesa a identificar e Pendência pertencem a contextos diferentes';
    end if;

    select public.save_invoice_with_effects(
        p_invoice,
        null,
        p_verification_patch,
        null,
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

revoke all on function public.save_unidentified_expense_with_pendency(jsonb, jsonb, integer, jsonb, jsonb) from public, anon;
grant execute on function public.save_unidentified_expense_with_pendency(jsonb, jsonb, integer, jsonb, jsonb) to authenticated;

-- Limpeza fail-closed de fixtures operacionais criadas exclusivamente pela
-- conta técnica de teste durante a investigação deste hotfix.
--
-- A atribuição foi comprovada em Production por actor_user_id + log administrativo
-- contemporâneo à criação. Os logs são preservados como trilha de auditoria; apenas
-- os objetos operacionais de teste são removidos. Em banco limpo, o bloco é inerte.
-- Se houver divergência parcial de IDs, autoria, contexto, histórico ou consolidação,
-- a migration falha em vez de apagar por aproximação.
do $$
declare
    v_test_actor constant uuid := '17a51409-4823-4a36-8d85-4d4ed08da249'::uuid;
    v_invoice_ids constant text[] := array[
        'nota-c6d2e4d1-d836-4c65-b9b1-4c9be8ce3612',
        'nota-b8c2a224-186c-4938-99f9-0b4456cea833',
        'nota-b4962927-deff-4a69-bea0-777b9054311b',
        'nota-a2da969c-2e29-41f9-a9fc-f34a306e00ed',
        'nota-9838a0a5-49ca-4e12-b174-95a71d64e1f9',
        'nota-acdc7e0d-fd87-424c-b95d-ee1dbf2ff8a5',
        'nota-4bed5f8e-826a-465a-ac85-44024ccb74a5',
        'nota-81cd8e05-047c-4dbc-9376-63b7daccc252',
        'nota-0b4c974a-a525-4151-b8e2-60bc92370634',
        'nota-cb959bc9-d691-40bc-9720-bfc18e9a0621',
        'nota-51028cd5-7080-46f9-8264-7aeb70895480',
        'nota-825dea6a-8032-4f6d-b49f-f5f4b9d98b9c'
    ];
    v_pendency_ids constant text[] := array[
        'pend-46134ec0-1842-4787-9804-4bb0080cd989',
        'pend-384d9cc0-634f-4e74-9eac-f22da3b6e2c5',
        'pend-fc828ec9-d1f5-4ab2-bed9-ceba4e93d88b'
    ];
    v_any_presence integer;
    v_invoice_evidence integer;
    v_pendency_evidence integer;
    v_unexpected_context_invoices integer;
    v_linked_history integer;
    v_verification_count integer;
begin
    select
        (select count(*) from public.registered_invoices where id = any(v_invoice_ids))
        + (select count(*) from public.pendencies where id = any(v_pendency_ids))
        + (select count(*) from public.administrative_logs
            where id in (
                'log-8e80da42-3e7d-4758-848f-93842c677a7b',
                'log-0eb10350-4f16-481b-97c4-6e2c6f3456ab',
                'log-7eed6ba1-a0ab-4672-9840-179ddd7bf8eb',
                'log-d2bcd7cf-6109-4be7-bc77-e87d84d71a0d',
                'log-62996ede-e987-4909-aac9-0660db78b040',
                'log-df2ddf51-7a0e-4d82-9fc0-81138ab68338',
                'log-1e2d6f69-5315-44c2-ac7b-c3e852555258',
                'log-1c037369-4f60-4387-8ac2-b420b82691c1',
                'log-de96a656-7eaa-4f09-b507-3bc95de09b06',
                'log-24a2cae2-7ada-43c4-ab20-6f0cde23b9da',
                'log-9e092dc3-f08c-4083-a539-5407fb44ce1c',
                'log-6d897261-5a54-410f-acb1-ea12c4ecb10f',
                'log-edc31089-6ece-4f5c-ac3c-41df05003d85',
                'log-d184b73e-9b51-4dda-b82c-cf742ab87d2a',
                'log-e11faf5d-004d-41f7-8e55-b20b66933855'
            ))
      into v_any_presence;

    if v_any_presence = 0 then
        return;
    end if;

    with expected(
        invoice_id, log_id, school_id, competence_id, program_id,
        expense_type, invoice_number, amount
    ) as (
        values
        ('nota-c6d2e4d1-d836-4c65-b9b1-4c9be8ce3612','log-8e80da42-3e7d-4758-848f-93842c677a7b','04.31.009','2026-03','ADOLESCENCIAS','servico','1234',100.00::numeric),
        ('nota-b8c2a224-186c-4938-99f9-0b4456cea833','log-0eb10350-4f16-481b-97c4-6e2c6f3456ab','04.31.009','2026-03','ADOLESCENCIAS','a_identificar',null,100.00::numeric),
        ('nota-b4962927-deff-4a69-bea0-777b9054311b','log-7eed6ba1-a0ab-4672-9840-179ddd7bf8eb','04.31.009','2026-03','BASIC','a_identificar',null,300.00::numeric),
        ('nota-a2da969c-2e29-41f9-a9fc-f34a306e00ed','log-d2bcd7cf-6109-4be7-bc77-e87d84d71a0d','04.31.001','2026-08','CONECTADA','boleto_internet','Boteto 1234',100.00::numeric),
        ('nota-9838a0a5-49ca-4e12-b174-95a71d64e1f9','log-62996ede-e987-4909-aac9-0660db78b040','04.31.001','2026-08','CONECTADA','servico','NFS-E 1234',500.00::numeric),
        ('nota-acdc7e0d-fd87-424c-b95d-ee1dbf2ff8a5','log-df2ddf51-7a0e-4d82-9fc0-81138ab68338','04.31.001','2026-08','CONECTADA','servico','2345',1345.00::numeric),
        ('nota-4bed5f8e-826a-465a-ac85-44024ccb74a5','log-1e2d6f69-5315-44c2-ac7b-c3e852555258','04.31.001','2026-08','CONECTADA','a_identificar',null,200.00::numeric),
        ('nota-81cd8e05-047c-4dbc-9376-63b7daccc252','log-1c037369-4f60-4387-8ac2-b420b82691c1','04.31.001','2026-08','BASIC','a_identificar',null,200.00::numeric),
        ('nota-0b4c974a-a525-4151-b8e2-60bc92370634','log-de96a656-7eaa-4f09-b507-3bc95de09b06','04.31.001','2026-04','CONECTADA','boleto_internet','1233',200.00::numeric),
        ('nota-cb959bc9-d691-40bc-9720-bfc18e9a0621','log-24a2cae2-7ada-43c4-ab20-6f0cde23b9da','04.31.001','2026-04','CONECTADA','consumo','345',500.00::numeric),
        ('nota-51028cd5-7080-46f9-8264-7aeb70895480','log-9e092dc3-f08c-4083-a539-5407fb44ce1c','04.31.001','2026-04','CONECTADA','servico','2222',500.00::numeric),
        ('nota-825dea6a-8032-4f6d-b49f-f5f4b9d98b9c','log-6d897261-5a54-410f-acb1-ea12c4ecb10f','04.31.001','2026-04','CONECTADA','servico','4444',555.00::numeric)
    )
    select count(*)
      into v_invoice_evidence
      from expected e
      join public.registered_invoices i
        on i.id = e.invoice_id
       and i.school_id = e.school_id
       and i.competence_id = e.competence_id
       and i.program_id = e.program_id
       and i.expense_type = e.expense_type
       and i.invoice_number is not distinct from e.invoice_number
       and i.amount = e.amount
       and i.linked_asset_id is null
      join public.administrative_logs l
        on l.id = e.log_id
       and l.actor_user_id = v_test_actor
       and l.school_id = e.school_id
       and abs(extract(epoch from (l.event_at - i.created_at))) <= 10;

    if v_invoice_evidence <> 12 then
        raise exception 'TEST_FIXTURE_PREFLIGHT_FAILED: autoria/contexto das 12 despesas de teste divergiu';
    end if;

    with expected(pendency_id, log_id, school_id, competence_id, program_id) as (
        values
        ('pend-46134ec0-1842-4787-9804-4bb0080cd989','log-edc31089-6ece-4f5c-ac3c-41df05003d85','04.31.009','2026-03','ADOLESCENCIAS'),
        ('pend-384d9cc0-634f-4e74-9eac-f22da3b6e2c5','log-d184b73e-9b51-4dda-b82c-cf742ab87d2a','04.31.001','2026-08','CONECTADA'),
        ('pend-fc828ec9-d1f5-4ab2-bed9-ceba4e93d88b','log-e11faf5d-004d-41f7-8e55-b20b66933855','04.31.001','2026-08','BASIC')
    )
    select count(*)
      into v_pendency_evidence
      from expected e
      join public.pendencies p
        on p.id = e.pendency_id
       and p.school_id = e.school_id
       and p.competence_origin = e.competence_id
       and p.program_id = e.program_id
       and p.document_key = 'notaFiscal'
       and p.registered_invoice_id is null
       and p.status = 'Aberta'
      join public.administrative_logs l
        on l.id = e.log_id
       and l.actor_user_id = v_test_actor
       and l.school_id = e.school_id
       and l.action = 'Análise incorreta e pendência aberta'
       and l.details::text like '%' || e.pendency_id || '%'
     where not exists (
        select 1 from public.pendency_attempts pa where pa.pendency_id = p.id
     );

    if v_pendency_evidence <> 3 then
        raise exception 'TEST_FIXTURE_PREFLIGHT_FAILED: autoria/contexto das 3 Pendências fiscais de teste divergiu';
    end if;

    select count(*)
      into v_unexpected_context_invoices
      from public.registered_invoices i
     where (
            (i.school_id = '04.31.009' and i.competence_id = '2026-03' and i.program_id in ('ADOLESCENCIAS','BASIC'))
         or (i.school_id = '04.31.001' and i.competence_id = '2026-08' and i.program_id in ('CONECTADA','BASIC'))
         or (i.school_id = '04.31.001' and i.competence_id = '2026-04' and i.program_id = 'CONECTADA')
     )
       and not (i.id = any(v_invoice_ids));

    if v_unexpected_context_invoices <> 0 then
        raise exception 'TEST_FIXTURE_PREFLIGHT_FAILED: contexto de teste passou a conter despesa não atribuída à conta técnica';
    end if;

    select count(*)
      into v_linked_history
      from public.pendencies
     where registered_invoice_id = any(v_invoice_ids);

    if v_linked_history <> 0 then
        raise exception 'TEST_FIXTURE_PREFLIGHT_FAILED: despesa de teste passou a possuir histórico individual';
    end if;

    select count(*)
      into v_verification_count
      from public.verifications v
     where (
            (v.school_id = '04.31.009' and v.competence_id = '2026-03' and v.program_id in ('ADOLESCENCIAS','BASIC'))
         or (v.school_id = '04.31.001' and v.competence_id = '2026-08' and v.program_id in ('CONECTADA','BASIC'))
         or (v.school_id = '04.31.001' and v.competence_id = '2026-04' and v.program_id = 'CONECTADA')
     )
       and coalesce(v.bonus_result, '') = '';

    if v_verification_count <> 5 then
        raise exception 'TEST_FIXTURE_PREFLIGHT_FAILED: verificação de contexto de teste ausente ou consolidada';
    end if;

    delete from public.pendencies
     where id = any(v_pendency_ids);

    delete from public.registered_invoices
     where id = any(v_invoice_ids);

    update public.verifications
       set bonification =
               jsonb_set(
                   jsonb_set(
                       jsonb_set(
                           coalesce(bonification, '{}'::jsonb) - 'boletoInternet',
                           '{notaFiscal}', to_jsonb(''::text), true
                       ),
                       '{consEnviada}', 'false'::jsonb, true
                   ),
                   '{consAssessoria}', to_jsonb('Não se aplica'::text), true
               ),
           analysis =
               jsonb_set(
                   jsonb_set(
                       coalesce(analysis, '{}'::jsonb) - 'boletoInternet',
                       '{notaFiscal}', to_jsonb('Não analisado'::text), true
                   ),
                   '{consAssessoria}', to_jsonb('Correto'::text), true
               )
     where (
            (school_id = '04.31.009' and competence_id = '2026-03' and program_id in ('ADOLESCENCIAS','BASIC'))
         or (school_id = '04.31.001' and competence_id = '2026-08' and program_id in ('CONECTADA','BASIC'))
         or (school_id = '04.31.001' and competence_id = '2026-04' and program_id = 'CONECTADA')
     );
end
$$;

commit;
