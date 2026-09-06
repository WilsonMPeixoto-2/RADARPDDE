-- Endurece a RPC genérica de reanálise para que a fronteira PostgreSQL aplique
-- as mesmas invariantes já exigidas pelo domínio da aplicação.
create or replace function public.reanalyze_pendency_with_verification(
    p_pendency jsonb,
    p_attempt jsonb,
    p_verification_patch jsonb,
    p_expected_pendency_version integer,
    p_expected_verification_version integer,
    p_administrative_log jsonb default null::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
declare
    v_pendency public.pendencies%rowtype;
    v_existing_pendency public.pendencies%rowtype;
    v_verification public.verifications%rowtype;
    v_existing_verification public.verifications%rowtype;
    v_attempt public.pendency_attempts%rowtype;
    v_existing_attempt public.pendency_attempts%rowtype;
    v_pendency_id text := nullif(p_pendency ->> 'id', '');
    v_verification_id text := nullif(p_verification_patch ->> 'id', '');
    v_attempt_id text := nullif(p_attempt ->> 'id', '');
    v_result text := lower(btrim(coalesce(p_attempt ->> 'result', '')));
    v_role text := public.current_app_role();
    v_attempt_payload jsonb;
    v_key text;
begin
    if v_role is null or v_role not in ('technical_admin', 'federal_assistant', 'controller') then
        raise exception 'AUTHORIZATION_DENIED: perfil % não pode reanalisar pendências', coalesce(v_role, 'sem_perfil');
    end if;
    if v_pendency_id is null or v_verification_id is null then raise exception 'VALIDATION_ERROR: pendência e verificação são obrigatórias'; end if;
    if p_attempt is null or coalesce(jsonb_typeof(p_attempt), '') <> 'object' or v_attempt_id is null then
        raise exception 'VALIDATION_ERROR: reanálise exige a tentativa aguardando mais recente';
    end if;
    if not public.radar_jsonb_matches('compatibilityPayload', coalesce(p_pendency -> 'payload', '{}'::jsonb))
        or not public.radar_jsonb_matches('analysis', coalesce(p_verification_patch -> 'analysis', '{}'::jsonb))
        or not public.radar_jsonb_matches('bonification', coalesce(p_verification_patch -> 'bonification', '{}'::jsonb))
        or not public.radar_jsonb_matches('compatibilityPayload', coalesce(p_verification_patch -> 'payload', '{}'::jsonb))
        or not public.radar_jsonb_matches('attempt', p_attempt)
        or not public.radar_jsonb_matches('errors', coalesce(p_attempt -> 'errors', '[]'::jsonb))
        or not public.radar_jsonb_matches('compatibilityPayload', coalesce(p_attempt -> 'payload', '{}'::jsonb)) then
        raise exception 'VALIDATION_ERROR: payload de reanálise incompatível';
    end if;
    select * into v_existing_pendency from public.pendencies where id = v_pendency_id for update;
    if not found then raise exception 'NOT_FOUND: pendencies/%', v_pendency_id; end if;
    if not public.can_write_school(v_existing_pendency.school_id) then raise exception 'AUTHORIZATION_DENIED: usuário sem escrita para a escola %', v_existing_pendency.school_id; end if;
    if v_existing_pendency.row_version <> p_expected_pendency_version then raise exception 'OPTIMISTIC_CONFLICT: pendencies/%', v_pendency_id; end if;
    if v_existing_pendency.status <> 'Aguardando reanálise' then raise exception 'VALIDATION_ERROR: reanálise exige Pendência Aguardando reanálise'; end if;
    select * into v_existing_attempt from public.pendency_attempts where pendency_id = v_existing_pendency.id order by attempt_number desc limit 1 for update;
    if not found or v_existing_attempt.result is not null or v_existing_attempt.analyzed_at is not null then
        raise exception 'VALIDATION_ERROR: reanálise exige a tentativa aguardando mais recente';
    end if;
    if v_existing_attempt.id is distinct from v_attempt_id
        or v_existing_attempt.pendency_id is distinct from nullif(p_attempt ->> 'pendency_id', '')
        or v_existing_attempt.attempt_number is distinct from nullif(p_attempt ->> 'attempt_number', '')::integer then
        raise exception 'VALIDATION_ERROR: tentativa informada não é a tentativa aguardando mais recente';
    end if;
    if nullif(p_attempt ->> 'analyzed_at', '') is null then raise exception 'VALIDATION_ERROR: reanálise exige instante de análise'; end if;
    if v_result not in ('correto', 'incorreto', 'arquivo_indisponivel') then raise exception 'VALIDATION_ERROR: resultado de reanálise inválido'; end if;
    -- Callers especializados já determinam a transição para Resolvida/Aberta e podem
    -- omitir resolved_at. A fronteira genérica valida o estado e materializa o instante
    -- de resolução quando necessário, sem exigir que o cliente fabrique esse timestamp.
    if (v_result = 'correto' and (
            nullif(p_pendency ->> 'status', '') <> 'Resolvida'
            or nullif(p_pendency ->> 'canceled_at', '') is not null
        ))
       or (v_result in ('incorreto', 'arquivo_indisponivel') and (
            nullif(p_pendency ->> 'status', '') <> 'Aberta'
            or nullif(p_pendency ->> 'resolved_at', '') is not null
            or nullif(p_pendency ->> 'canceled_at', '') is not null
        )) then
        raise exception 'VALIDATION_ERROR: resultado e estado final da Pendência são incompatíveis';
    end if;
    select * into v_existing_verification from public.verifications
     where id = v_verification_id and school_id = v_existing_pendency.school_id
       and competence_id = v_existing_pendency.competence_origin and program_id is not distinct from v_existing_pendency.program_id for update;
    if not found then raise exception 'VALIDATION_ERROR: verificação não pertence ao contexto da Pendência'; end if;
    if v_existing_verification.row_version <> p_expected_verification_version then raise exception 'OPTIMISTIC_CONFLICT: verifications/%', v_verification_id; end if;
    update public.pendencies set
        status = p_pendency ->> 'status',
        responsible_area = coalesce(p_pendency ->> 'responsible_area', responsible_area),
        next_actor = coalesce(p_pendency ->> 'next_actor', next_actor),
        reason = coalesce(p_pendency ->> 'reason', reason),
        notes = coalesce(p_pendency ->> 'notes', notes),
        resolved_at = case
            when v_result = 'correto' then coalesce(
                nullif(p_pendency ->> 'resolved_at', '')::timestamptz,
                v_existing_pendency.resolved_at,
                now()
            )
            else null
        end,
        canceled_at = null,
        payload = coalesce(p_pendency -> 'payload', payload)
     where id = v_pendency_id and row_version = p_expected_pendency_version returning * into v_pendency;
    if not found then raise exception 'OPTIMISTIC_CONFLICT: pendencies/%', v_pendency_id; end if;
    v_attempt_payload := coalesce(v_existing_attempt.payload, '{}'::jsonb);
    foreach v_key in array array['status','dataAnalise','analisadoPor','analisadoPorId','authenticatedRoleAnalise','actingProfileAnalise','resultado','errosEncontrados','observacaoAnalise'] loop
        if coalesce(p_attempt -> 'payload', '{}'::jsonb) ? v_key then v_attempt_payload := jsonb_set(v_attempt_payload, array[v_key], p_attempt -> 'payload' -> v_key, true); end if;
    end loop;
    update public.pendency_attempts set
        analyzed_at = (p_attempt ->> 'analyzed_at')::timestamptz,
        result = v_result,
        errors = coalesce(p_attempt -> 'errors', errors),
        payload = v_attempt_payload
     where id = v_existing_attempt.id returning * into v_attempt;
    update public.verifications set
        analysis = coalesce(p_verification_patch -> 'analysis', analysis),
        bonification = coalesce(p_verification_patch -> 'bonification', bonification),
        bonus_result = case when p_verification_patch ? 'bonus_result' then nullif(p_verification_patch ->> 'bonus_result', '') else bonus_result end,
        payload = coalesce(p_verification_patch -> 'payload', payload)
     where id = v_existing_verification.id and row_version = p_expected_verification_version returning * into v_verification;
    if not found then raise exception 'OPTIMISTIC_CONFLICT: verifications/%', v_verification_id; end if;
    if p_administrative_log is null or nullif(p_administrative_log ->> 'id', '') is null or nullif(p_administrative_log ->> 'action', '') is null
       or not public.radar_jsonb_matches('auditDetails', coalesce(p_administrative_log -> 'details', '{}'::jsonb)) then
        raise exception 'VALIDATION_ERROR: log administrativo obrigatório e inválido';
    end if;
    if nullif(p_administrative_log ->> 'school_id', '') is not null and (p_administrative_log ->> 'school_id') is distinct from v_existing_pendency.school_id then
        raise exception 'VALIDATION_ERROR: log administrativo pertence a outra escola';
    end if;
    insert into public.administrative_logs (id, school_id, actor_user_id, user_identifier, profile_name, action, details, event_at)
    values (
        p_administrative_log ->> 'id',
        v_existing_pendency.school_id,
        auth.uid(),
        coalesce(p_administrative_log ->> 'user_identifier', ''),
        coalesce(p_administrative_log ->> 'profile_name', public.current_app_role(), ''),
        p_administrative_log ->> 'action',
        coalesce(p_administrative_log -> 'details', '{}'::jsonb),
        coalesce(nullif(p_administrative_log ->> 'event_at', '')::timestamptz, now())
    );
    return jsonb_build_object('pendency', to_jsonb(v_pendency), 'attempt', to_jsonb(v_attempt), 'verification', to_jsonb(v_verification));
end
$function$;
revoke all on function public.reanalyze_pendency_with_verification(jsonb,jsonb,jsonb,integer,integer,jsonb) from public, anon;
grant execute on function public.reanalyze_pendency_with_verification(jsonb,jsonb,jsonb,integer,integer,jsonb) to authenticated;
