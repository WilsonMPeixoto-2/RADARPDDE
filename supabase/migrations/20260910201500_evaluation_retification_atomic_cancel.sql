-- RADAR PDDE — retificação auditável de avaliação técnica com cancelamento atômico da Pendência.
-- A operação corrige exclusivamente um lançamento técnico marcado como Incorreto por erro do operador.
-- Não substitui o fluxo legítimo Registrar novo envio -> Reanalisar.

begin;

create or replace function public.retify_verification_with_pendency_cancel(
    p_verification jsonb,
    p_expected_verification_version integer,
    p_pendency jsonb,
    p_expected_pendency_version integer,
    p_administrative_log jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_role text := public.current_app_role();
    v_verification_id text := nullif(p_verification ->> 'id', '');
    v_pendency_id text := nullif(p_pendency ->> 'id', '');
    v_school_id text;
    v_document_key text;
    v_requested_analysis text;
    v_event_at timestamptz;
    v_user_identifier text;
    v_profile_name text;
    v_existing_verification public.verifications%rowtype;
    v_existing_pendency public.pendencies%rowtype;
    v_saved_verification public.verifications%rowtype;
    v_saved_pendency public.pendencies%rowtype;
    v_log public.administrative_logs%rowtype;
    v_history jsonb;
    v_cancel_event jsonb;
    v_cancellation jsonb;
    v_next_payload jsonb;
begin
    if v_role not in ('controller', 'federal_assistant', 'technical_admin') then
        raise exception 'AUTHORIZATION_DENIED: perfil sem permissão para retificar avaliações';
    end if;

    if jsonb_typeof(p_verification) <> 'object'
        or v_verification_id is null
        or jsonb_typeof(p_pendency) <> 'object'
        or v_pendency_id is null then
        raise exception 'VALIDATION_ERROR: verificação e pendência canônicas são obrigatórias';
    end if;

    if p_expected_verification_version is null or p_expected_pendency_version is null then
        raise exception 'VALIDATION_ERROR: retificação exige versões esperadas da verificação e da pendência';
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

    if not public.radar_jsonb_matches(
        'analysis', coalesce(p_verification -> 'analysis', '{}'::jsonb)
    ) or not public.radar_jsonb_matches(
        'bonification', coalesce(p_verification -> 'bonification', '{}'::jsonb)
    ) or not public.radar_jsonb_matches(
        'compatibilityPayload', coalesce(p_verification -> 'payload', '{}'::jsonb)
    ) then
        raise exception 'VALIDATION_ERROR: verificação incompatível';
    end if;

    if not public.radar_jsonb_matches(
        'compatibilityPayload', coalesce(p_pendency -> 'payload', '{}'::jsonb)
    ) then
        raise exception 'VALIDATION_ERROR: payload da pendência incompatível';
    end if;

    select *
    into v_existing_verification
    from public.verifications
    where id = v_verification_id
    for update;

    if not found then
        raise exception 'NOT_FOUND: verifications/%', v_verification_id;
    end if;

    select *
    into v_existing_pendency
    from public.pendencies
    where id = v_pendency_id
    for update;

    if not found then
        raise exception 'NOT_FOUND: pendencies/%', v_pendency_id;
    end if;

    if v_existing_verification.row_version <> p_expected_verification_version then
        raise exception 'OPTIMISTIC_CONFLICT: verifications/%', v_verification_id;
    end if;
    if v_existing_pendency.row_version <> p_expected_pendency_version then
        raise exception 'OPTIMISTIC_CONFLICT: pendencies/%', v_pendency_id;
    end if;

    v_school_id := v_existing_verification.school_id;
    v_document_key := v_existing_pendency.document_key;

    if not public.can_write_school(v_school_id) then
        raise exception 'AUTHORIZATION_DENIED: usuário sem escrita para a escola %', v_school_id;
    end if;

    if v_existing_pendency.school_id is distinct from v_school_id
        or v_existing_pendency.competence_origin is distinct from v_existing_verification.competence_id
        or v_existing_pendency.program_id is distinct from v_existing_verification.program_id then
        raise exception 'VALIDATION_ERROR: verificação e pendência pertencem a contextos diferentes';
    end if;

    if nullif(p_verification ->> 'school_id', '') is distinct from v_existing_verification.school_id
        or nullif(p_verification ->> 'competence_id', '') is distinct from v_existing_verification.competence_id
        or nullif(p_verification ->> 'program_id', '') is distinct from v_existing_verification.program_id then
        raise exception 'VALIDATION_ERROR: contexto da verificação não pode ser alterado';
    end if;

    if nullif(p_pendency ->> 'school_id', '') is distinct from v_existing_pendency.school_id
        or nullif(p_pendency ->> 'competence_origin', '') is distinct from v_existing_pendency.competence_origin
        or nullif(p_pendency ->> 'program_id', '') is distinct from v_existing_pendency.program_id
        or nullif(p_pendency ->> 'document_key', '') is distinct from v_existing_pendency.document_key
        or nullif(p_pendency ->> 'registered_invoice_id', '') is distinct from v_existing_pendency.registered_invoice_id then
        raise exception 'VALIDATION_ERROR: contexto da pendência não pode ser alterado';
    end if;

    if v_document_key in ('notaFiscal', 'boletoInternet', 'consAssessoria') then
        raise exception 'VALIDATION_ERROR: documento possui fluxo técnico derivado e não admite retificação agregada';
    end if;

    if v_existing_pendency.status not in ('Aberta', 'Aguardando reanálise') then
        raise exception 'INVALID_TRANSITION: somente pendência ativa pode ser cancelada por retificação';
    end if;

    if nullif(v_existing_verification.analysis ->> v_document_key, '') is distinct from 'Incorreto' then
        raise exception 'INVALID_TRANSITION: análise atual precisa ser Incorreto para cancelar pendência por retificação';
    end if;

    if nullif(p_pendency ->> 'status', '') is distinct from 'Cancelada' then
        raise exception 'INVALID_TRANSITION: retificação com pendência ativa deve resultar em Pendência Cancelada';
    end if;

    v_requested_analysis := nullif(p_verification -> 'analysis' ->> v_document_key, '');
    if v_requested_analysis not in ('Não analisado', 'Correto', 'Correto (Atrasado)') then
        raise exception 'VALIDATION_ERROR: estado técnico de destino inválido para retificação';
    end if;

    if coalesce(p_verification -> 'bonification', '{}'::jsonb) is distinct from v_existing_verification.bonification
        or nullif(p_verification ->> 'bonus_result', '') is distinct from v_existing_verification.bonus_result
        or coalesce(p_verification -> 'payload', '{}'::jsonb) is distinct from v_existing_verification.payload then
        raise exception 'VALIDATION_ERROR: retificação técnica não pode alterar bonificação, consolidação ou payload da verificação';
    end if;

    if (coalesce(p_verification -> 'analysis', '{}'::jsonb) - v_document_key)
        is distinct from (v_existing_verification.analysis - v_document_key) then
        raise exception 'VALIDATION_ERROR: retificação técnica não pode alterar a análise de outros documentos';
    end if;

    if coalesce(p_pendency ->> 'responsible_area', '') is distinct from v_existing_pendency.responsible_area
        or coalesce(p_pendency ->> 'reason', '') is distinct from v_existing_pendency.reason
        or coalesce(p_pendency ->> 'notes', '') is distinct from v_existing_pendency.notes then
        raise exception 'VALIDATION_ERROR: cancelamento por retificação não pode editar dados cadastrais da pendência';
    end if;

    if v_requested_analysis = 'Correto'
        and lower(coalesce(v_existing_verification.bonus_result, '')) in ('apta', 'inapta')
        and coalesce(v_existing_verification.bonification ->> v_document_key, '') = 'Não' then
        raise exception 'LATE_ANALYSIS_REQUIRED: documento exige Correto (Atrasado) após não entrega consolidada';
    end if;

    v_event_at := coalesce(
        nullif(p_administrative_log ->> 'event_at', '')::timestamptz,
        now()
    );
    v_user_identifier := coalesce(
        nullif(p_administrative_log ->> 'user_identifier', ''),
        auth.uid()::text,
        'Sistema'
    );
    v_profile_name := coalesce(
        nullif(p_administrative_log ->> 'profile_name', ''),
        v_role,
        'sistema'
    );

    v_history := case
        when jsonb_typeof(v_existing_pendency.payload -> 'historico') = 'array'
            then v_existing_pendency.payload -> 'historico'
        else '[]'::jsonb
    end;
    v_cancel_event := jsonb_build_object(
        'id', 'evento-retificacao-' || (p_administrative_log ->> 'id'),
        'tipo', 'cancelamento',
        'dataHora', v_event_at,
        'usuario', v_user_identifier,
        'perfil', v_profile_name,
        'detalhe', 'Pendência cancelada: cancelada por retificação da avaliação',
        'erros', case
            when jsonb_typeof(v_existing_pendency.payload -> 'errosAtuais') = 'array'
                then v_existing_pendency.payload -> 'errosAtuais'
            else '[]'::jsonb
        end,
        'tentativaId', null
    );
    v_cancellation := jsonb_build_object(
        'justificativa', 'cancelada por retificação da avaliação',
        'dataHora', v_event_at,
        'usuario', v_user_identifier,
        'perfil', v_profile_name
    );
    v_next_payload := v_existing_pendency.payload || jsonb_build_object(
        'status', 'Cancelada',
        'proximoAtor', null,
        'dataResolucao', null,
        'cancelamento', v_cancellation,
        'historico', v_history || jsonb_build_array(v_cancel_event)
    );

    update public.verifications
    set analysis = jsonb_set(
        v_existing_verification.analysis,
        array[v_document_key],
        to_jsonb(v_requested_analysis),
        true
    )
    where id = v_verification_id
      and row_version = p_expected_verification_version
    returning * into v_saved_verification;

    if not found then
        raise exception 'OPTIMISTIC_CONFLICT: verifications/%', v_verification_id;
    end if;

    update public.pendencies
    set
        status = 'Cancelada',
        next_actor = '',
        resolved_at = null,
        canceled_at = v_event_at,
        payload = v_next_payload
    where id = v_pendency_id
      and row_version = p_expected_pendency_version
    returning * into v_saved_pendency;

    if not found then
        raise exception 'OPTIMISTIC_CONFLICT: pendencies/%', v_pendency_id;
    end if;

    if nullif(p_administrative_log ->> 'school_id', '') is not null
        and (p_administrative_log ->> 'school_id') is distinct from v_school_id then
        raise exception 'VALIDATION_ERROR: log administrativo pertence a outra escola';
    end if;

    insert into public.administrative_logs (
        id,
        school_id,
        actor_user_id,
        user_identifier,
        profile_name,
        action,
        details,
        event_at
    ) values (
        p_administrative_log ->> 'id',
        v_school_id,
        auth.uid(),
        coalesce(p_administrative_log ->> 'user_identifier', ''),
        v_profile_name,
        p_administrative_log ->> 'action',
        coalesce(p_administrative_log -> 'details', '{}'::jsonb),
        v_event_at
    )
    returning * into v_log;

    return jsonb_build_object(
        'verification', to_jsonb(v_saved_verification),
        'pendency', to_jsonb(v_saved_pendency),
        'administrative_log', to_jsonb(v_log)
    );
end
$$;

revoke all on function public.retify_verification_with_pendency_cancel(jsonb, integer, jsonb, integer, jsonb) from public;
grant execute on function public.retify_verification_with_pendency_cancel(jsonb, integer, jsonb, integer, jsonb) to authenticated;

commit;
