-- RADAR PDDE — preserva separadamente a data em que a escola disponibilizou
-- o documento e o instante em que o lançamento foi registrado no sistema.

alter table public.pendency_attempts
    add column if not exists available_at timestamptz;

-- Para o histórico já existente, a data registrada no payload legado é a
-- melhor fonte quando puder ser interpretada. Registros antigos sem essa
-- informação mantêm submitted_at como fallback seguro e auditável.
update public.pendency_attempts
   set available_at = submitted_at
 where available_at is null;

do $$
declare
    v_record record;
    v_available_at timestamptz;
begin
    for v_record in
        select id, payload ->> 'dataDisponibilizacao' as legacy_available_at
          from public.pendency_attempts
         where nullif(btrim(coalesce(payload ->> 'dataDisponibilizacao', '')), '') is not null
    loop
        begin
            v_available_at := v_record.legacy_available_at::timestamptz;
            update public.pendency_attempts
               set available_at = v_available_at
             where id = v_record.id;
        exception when others then
            -- Payload legado malformado não pode abortar a migration inteira.
            null;
        end;
    end loop;
end
$$;

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
    v_existing public.pendencies%rowtype;
    v_saved public.pendencies%rowtype;
    v_attempt public.pendency_attempts%rowtype;
    v_verification public.verifications%rowtype;
    v_log public.administrative_logs%rowtype;
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
            status, responsible_area, next_actor, reason, notes,
            opened_at, resolved_at, canceled_at, payload
        ) values (
            v_id,
            v_school_id,
            p_pendency ->> 'competence_origin',
            nullif(p_pendency ->> 'program_id', ''),
            p_pendency ->> 'document_key',
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
            or v_existing.document_key is distinct from (p_pendency ->> 'document_key') then
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
