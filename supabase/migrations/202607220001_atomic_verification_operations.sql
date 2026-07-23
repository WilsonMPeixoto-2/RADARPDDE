-- RADAR PDDE — gravação atômica de verificação e histórico administrativo.
-- Elimina a sequência REST não transacional verifications -> administrative_logs.

begin;

create or replace function public.save_verification_with_log(
    p_verification jsonb,
    p_expected_version integer default null,
    p_administrative_log jsonb default null
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_id text := nullif(p_verification ->> 'id', '');
    v_school_id text := nullif(p_verification ->> 'school_id', '');
    v_competence_id text := nullif(p_verification ->> 'competence_id', '');
    v_program_id text := nullif(p_verification ->> 'program_id', '');
    v_log_school_id text;
    v_role text := public.current_app_role();
    v_existing public.verifications%rowtype;
    v_saved public.verifications%rowtype;
    v_log public.administrative_logs%rowtype;
begin
    if jsonb_typeof(p_verification) <> 'object'
        or v_id is null
        or v_school_id is null
        or v_competence_id is null
        or v_program_id is null then
        raise exception 'VALIDATION_ERROR: verificação canônica inválida';
    end if;

    if v_role not in ('controller', 'federal_assistant', 'technical_admin') then
        raise exception 'AUTHORIZATION_DENIED: perfil sem permissão para verificações';
    end if;

    if not public.can_write_school(v_school_id) then
        raise exception 'AUTHORIZATION_DENIED: usuário sem escrita para a escola %', v_school_id;
    end if;

    if p_administrative_log is null
        or jsonb_typeof(p_administrative_log) <> 'object'
        or nullif(p_administrative_log ->> 'id', '') is null
        or nullif(p_administrative_log ->> 'action', '') is null then
        raise exception 'VALIDATION_ERROR: log administrativo obrigatório e inválido';
    end if;

    if not public.radar_jsonb_matches(
        'bonification',
        coalesce(p_verification -> 'bonification', '{}'::jsonb)
    ) then
        raise exception 'VALIDATION_ERROR: bonificação incompatível';
    end if;

    if not public.radar_jsonb_matches(
        'analysis',
        coalesce(p_verification -> 'analysis', '{}'::jsonb)
    ) then
        raise exception 'VALIDATION_ERROR: análise incompatível';
    end if;

    if not public.radar_jsonb_matches(
        'compatibilityPayload',
        coalesce(p_verification -> 'payload', '{}'::jsonb)
    ) then
        raise exception 'VALIDATION_ERROR: payload da verificação incompatível';
    end if;

    select *
    into v_existing
    from public.verifications
    where id = v_id
    for update;

    if found then
        if v_existing.school_id <> v_school_id
            or v_existing.competence_id <> v_competence_id
            or v_existing.program_id <> v_program_id then
            raise exception 'VALIDATION_ERROR: contexto da verificação não pode ser alterado';
        end if;

        if p_expected_version is null or v_existing.row_version <> p_expected_version then
            raise exception 'OPTIMISTIC_CONFLICT: verifications/%', v_id;
        end if;

        update public.verifications
        set
            bonification = coalesce(p_verification -> 'bonification', bonification),
            analysis = coalesce(p_verification -> 'analysis', analysis),
            bonus_result = case
                when p_verification ? 'bonus_result'
                    then nullif(p_verification ->> 'bonus_result', '')
                else bonus_result
            end,
            payload = coalesce(p_verification -> 'payload', payload)
        where id = v_id
          and row_version = p_expected_version
        returning * into v_saved;

        if not found then
            raise exception 'OPTIMISTIC_CONFLICT: verifications/%', v_id;
        end if;
    else
        if p_expected_version is not null then
            raise exception 'NOT_FOUND: verifications/%', v_id;
        end if;

        insert into public.verifications (
            id,
            school_id,
            competence_id,
            program_id,
            bonification,
            analysis,
            bonus_result,
            payload
        ) values (
            v_id,
            v_school_id,
            v_competence_id,
            v_program_id,
            coalesce(p_verification -> 'bonification', '{}'::jsonb),
            coalesce(p_verification -> 'analysis', '{}'::jsonb),
            nullif(p_verification ->> 'bonus_result', ''),
            coalesce(p_verification -> 'payload', '{}'::jsonb)
        )
        returning * into v_saved;
    end if;

    v_log_school_id := nullif(p_administrative_log ->> 'school_id', '');
    if v_log_school_id is not null and v_log_school_id is distinct from v_school_id then
        raise exception 'VALIDATION_ERROR: log administrativo pertence a outra escola';
    end if;

    if not public.radar_jsonb_matches(
        'auditDetails',
        coalesce(p_administrative_log -> 'details', '{}'::jsonb)
    ) then
        raise exception 'VALIDATION_ERROR: detalhes do log administrativo incompatíveis';
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
        coalesce(p_administrative_log ->> 'profile_name', v_role, ''),
        p_administrative_log ->> 'action',
        coalesce(p_administrative_log -> 'details', '{}'::jsonb),
        coalesce(nullif(p_administrative_log ->> 'event_at', '')::timestamptz, now())
    )
    returning * into v_log;

    return jsonb_build_object(
        'verification', to_jsonb(v_saved),
        'administrative_log', to_jsonb(v_log)
    );
end
$$;

revoke all on function public.save_verification_with_log(jsonb, integer, jsonb) from public;
grant execute on function public.save_verification_with_log(jsonb, integer, jsonb) to authenticated;

commit;
