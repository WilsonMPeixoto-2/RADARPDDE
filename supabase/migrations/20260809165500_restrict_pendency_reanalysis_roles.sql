-- Restringe a reanálise de pendências aos papéis operacionais autorizados.
-- O escopo escolar continua sendo validado por can_write_school().

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
set search_path to 'pg_catalog', 'public'
as $function$
declare
    v_pendency public.pendencies%rowtype;
    v_existing_pendency public.pendencies%rowtype;
    v_verification public.verifications%rowtype;
    v_attempt public.pendency_attempts%rowtype;
    v_pendency_id text := nullif(p_pendency ->> 'id', '');
    v_verification_id text := nullif(p_verification_patch ->> 'id', '');
    v_role text := public.current_app_role();
begin
    if v_role is null or v_role not in ('technical_admin', 'federal_assistant', 'controller') then
        raise exception 'AUTHORIZATION_DENIED: perfil % não pode reanalisar pendências', coalesce(v_role, 'sem_perfil');
    end if;

    if v_pendency_id is null or v_verification_id is null then
        raise exception 'VALIDATION_ERROR: pendência e verificação são obrigatórias';
    end if;
    if not public.radar_jsonb_matches('compatibilityPayload', coalesce(p_pendency -> 'payload', '{}'::jsonb))
        or not public.radar_jsonb_matches('analysis', coalesce(p_verification_patch -> 'analysis', '{}'::jsonb))
        or not public.radar_jsonb_matches('bonification', coalesce(p_verification_patch -> 'bonification', '{}'::jsonb))
        or not public.radar_jsonb_matches('compatibilityPayload', coalesce(p_verification_patch -> 'payload', '{}'::jsonb)) then
        raise exception 'VALIDATION_ERROR: payload de reanálise incompatível';
    end if;
    if p_attempt is not null and (
        not public.radar_jsonb_matches('attempt', p_attempt)
        or not public.radar_jsonb_matches('errors', coalesce(p_attempt -> 'errors', '[]'::jsonb))
        or not public.radar_jsonb_matches('compatibilityPayload', coalesce(p_attempt -> 'payload', '{}'::jsonb))
    ) then
        raise exception 'VALIDATION_ERROR: tentativa incompatível';
    end if;

    select * into v_existing_pendency from public.pendencies where id = v_pendency_id for update;
    if not found then raise exception 'NOT_FOUND: pendencies/%', v_pendency_id; end if;
    if not public.can_write_school(v_existing_pendency.school_id) then
        raise exception 'AUTHORIZATION_DENIED: usuário sem escrita para a escola %', v_existing_pendency.school_id;
    end if;
    if v_existing_pendency.row_version <> p_expected_pendency_version then
        raise exception 'OPTIMISTIC_CONFLICT: pendencies/%', v_pendency_id;
    end if;

    update public.pendencies set
        status = coalesce(nullif(p_pendency ->> 'status', ''), status),
        responsible_area = coalesce(p_pendency ->> 'responsible_area', responsible_area),
        next_actor = coalesce(p_pendency ->> 'next_actor', next_actor),
        reason = coalesce(p_pendency ->> 'reason', reason),
        notes = coalesce(p_pendency ->> 'notes', notes),
        resolved_at = nullif(p_pendency ->> 'resolved_at', '')::timestamptz,
        canceled_at = nullif(p_pendency ->> 'canceled_at', '')::timestamptz,
        payload = coalesce(p_pendency -> 'payload', payload)
    where id = v_pendency_id and row_version = p_expected_pendency_version
    returning * into v_pendency;
    if not found then raise exception 'OPTIMISTIC_CONFLICT: pendencies/%', v_pendency_id; end if;

    if p_attempt is not null then
        insert into public.pendency_attempts (
            id, pendency_id, attempt_number, submitted_at, analyzed_at,
            result, observation, drive_url, errors, payload, created_by
        ) values (
            p_attempt ->> 'id',
            v_pendency_id,
            (p_attempt ->> 'attempt_number')::integer,
            coalesce(nullif(p_attempt ->> 'submitted_at', '')::timestamptz, now()),
            coalesce(nullif(p_attempt ->> 'analyzed_at', '')::timestamptz, now()),
            nullif(p_attempt ->> 'result', ''),
            coalesce(p_attempt ->> 'observation', ''),
            coalesce(p_attempt ->> 'drive_url', ''),
            coalesce(p_attempt -> 'errors', '[]'::jsonb),
            coalesce(p_attempt -> 'payload', '{}'::jsonb),
            auth.uid()
        )
        on conflict (id) do update set
            attempt_number = excluded.attempt_number,
            analyzed_at = excluded.analyzed_at,
            result = excluded.result,
            observation = excluded.observation,
            drive_url = excluded.drive_url,
            errors = excluded.errors,
            payload = excluded.payload
        returning * into v_attempt;
    end if;

    update public.verifications set
        analysis = coalesce(p_verification_patch -> 'analysis', analysis),
        bonification = coalesce(p_verification_patch -> 'bonification', bonification),
        bonus_result = coalesce(nullif(p_verification_patch ->> 'bonus_result', ''), bonus_result),
        payload = coalesce(p_verification_patch -> 'payload', payload)
    where id = v_verification_id
      and school_id = v_existing_pendency.school_id
      and row_version = p_expected_verification_version
    returning * into v_verification;
    if not found then raise exception 'OPTIMISTIC_CONFLICT: verifications/%', v_verification_id; end if;

    if p_administrative_log is null
        or nullif(p_administrative_log ->> 'id', '') is null
        or nullif(p_administrative_log ->> 'action', '') is null
        or not public.radar_jsonb_matches('auditDetails', coalesce(p_administrative_log -> 'details', '{}'::jsonb)) then
        raise exception 'VALIDATION_ERROR: log administrativo obrigatório e inválido';
    end if;
    if nullif(p_administrative_log ->> 'school_id', '') is not null
        and (p_administrative_log ->> 'school_id') is distinct from v_existing_pendency.school_id then
        raise exception 'VALIDATION_ERROR: log administrativo pertence a outra escola';
    end if;
    insert into public.administrative_logs (
        id, school_id, actor_user_id, user_identifier, profile_name, action, details, event_at
    ) values (
        p_administrative_log ->> 'id',
        v_existing_pendency.school_id,
        auth.uid(),
        coalesce(p_administrative_log ->> 'user_identifier', ''),
        coalesce(p_administrative_log ->> 'profile_name', public.current_app_role(), ''),
        p_administrative_log ->> 'action',
        coalesce(p_administrative_log -> 'details', '{}'::jsonb),
        coalesce(nullif(p_administrative_log ->> 'event_at', '')::timestamptz, now())
    );

    return jsonb_build_object(
        'pendency', to_jsonb(v_pendency),
        'attempt', case when v_attempt.id is null then null else to_jsonb(v_attempt) end,
        'verification', to_jsonb(v_verification)
    );
end
$function$;
