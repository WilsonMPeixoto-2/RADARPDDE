-- RADAR PDDE — contratos JSON compartilhados, validação pg_jsonschema e RPCs compostas restantes.
-- Todas as funções operacionais usam SECURITY INVOKER e permanecem subordinadas às políticas RLS.

create schema if not exists extensions;

do $$
begin
    if exists (select 1 from pg_available_extensions where name = 'pg_jsonschema') then
        execute 'create extension if not exists pg_jsonschema with schema extensions';
    elsif to_regprocedure('extensions.jsonb_matches_schema(json,jsonb)') is null then
        raise exception 'CAPABILITY_MISSING: pg_jsonschema não está disponível';
    end if;
end
$$;

create or replace function public.radar_json_schema(p_contract text)
returns json
language sql
immutable
security invoker
set search_path = pg_catalog, public
as $$
    select case p_contract
        when 'bonification' then '{"type":"object","additionalProperties":true}'::json
        when 'analysis' then '{"type":"object","additionalProperties":true}'::json
        when 'errors' then '{"type":"array","items":{"anyOf":[{"type":"string","minLength":1},{"type":"object","minProperties":1,"additionalProperties":true}]}}'::json
        when 'attempt' then '{"type":"object","additionalProperties":true,"properties":{"id":{"type":"string","minLength":1},"numero":{"type":"integer","minimum":1},"attempt_number":{"type":"integer","minimum":1},"errors":{"type":"array"},"errosEncontrados":{"type":"array"}},"anyOf":[{"required":["numero"]},{"required":["attempt_number"]}]}'::json
        when 'cancellation' then '{"type":"object","additionalProperties":true}'::json
        when 'resolution' then '{"type":"object","additionalProperties":true}'::json
        when 'rectification' then '{"type":"object","additionalProperties":true,"required":["antes","depois"],"properties":{"antes":{"type":"object"},"depois":{"type":"object"}}}'::json
        when 'auditDetails' then '{"type":"object","additionalProperties":true}'::json
        when 'compatibilityPayload' then '{"type":"object","additionalProperties":true}'::json
        when 'entityCounts' then '{"type":"object","additionalProperties":{"type":"integer","minimum":0}}'::json
        when 'reconciliationReport' then '{"type":"object","additionalProperties":true}'::json
        else null
    end
$$;

create or replace function public.radar_jsonb_matches(p_contract text, p_value jsonb)
returns boolean
language plpgsql
immutable
security invoker
set search_path = pg_catalog, public, extensions
as $$
declare
    v_schema json := public.radar_json_schema(p_contract);
begin
    if v_schema is null then
        raise exception 'UNKNOWN_JSON_CONTRACT: %', p_contract;
    end if;
    return extensions.jsonb_matches_schema(v_schema, p_value);
end
$$;

revoke all on function public.radar_json_schema(text) from public;
revoke all on function public.radar_jsonb_matches(text, jsonb) from public;
grant execute on function public.radar_json_schema(text) to authenticated, service_role;
grant execute on function public.radar_jsonb_matches(text, jsonb) to authenticated, service_role;

alter table public.app_config
    add constraint app_config_settings_json_contract
    check (public.radar_jsonb_matches('compatibilityPayload', settings)) not valid;
alter table public.verifications
    add constraint verifications_bonification_json_contract
    check (public.radar_jsonb_matches('bonification', bonification)) not valid,
    add constraint verifications_analysis_json_contract
    check (public.radar_jsonb_matches('analysis', analysis)) not valid,
    add constraint verifications_payload_json_contract
    check (public.radar_jsonb_matches('compatibilityPayload', payload)) not valid;
alter table public.pendencies
    add constraint pendencies_payload_json_contract
    check (public.radar_jsonb_matches('compatibilityPayload', payload)) not valid;
alter table public.pendency_attempts
    add constraint pendency_attempts_errors_json_contract
    check (public.radar_jsonb_matches('errors', errors)) not valid,
    add constraint pendency_attempts_payload_json_contract
    check (public.radar_jsonb_matches('compatibilityPayload', payload)) not valid;
alter table public.pendency_contacts
    add constraint pendency_contacts_payload_json_contract
    check (public.radar_jsonb_matches('compatibilityPayload', payload)) not valid;
alter table public.assets
    add constraint assets_payload_json_contract
    check (public.radar_jsonb_matches('compatibilityPayload', payload)) not valid;
alter table public.registered_invoices
    add constraint registered_invoices_payload_json_contract
    check (public.radar_jsonb_matches('compatibilityPayload', payload)) not valid;
alter table public.administrative_logs
    add constraint administrative_logs_details_json_contract
    check (public.radar_jsonb_matches('auditDetails', details)) not valid;
alter table public.data_import_runs
    add constraint data_import_runs_counts_json_contract
    check (public.radar_jsonb_matches('entityCounts', entity_counts)) not valid,
    add constraint data_import_runs_reconciliation_json_contract
    check (public.radar_jsonb_matches('reconciliationReport', reconciliation_report)) not valid;
alter table public.audit_events
    add constraint audit_events_old_record_json_contract
    check (old_record is null or public.radar_jsonb_matches('compatibilityPayload', old_record)) not valid,
    add constraint audit_events_new_record_json_contract
    check (new_record is null or public.radar_jsonb_matches('compatibilityPayload', new_record)) not valid;

alter table public.app_config validate constraint app_config_settings_json_contract;
alter table public.verifications validate constraint verifications_bonification_json_contract;
alter table public.verifications validate constraint verifications_analysis_json_contract;
alter table public.verifications validate constraint verifications_payload_json_contract;
alter table public.pendencies validate constraint pendencies_payload_json_contract;
alter table public.pendency_attempts validate constraint pendency_attempts_errors_json_contract;
alter table public.pendency_attempts validate constraint pendency_attempts_payload_json_contract;
alter table public.pendency_contacts validate constraint pendency_contacts_payload_json_contract;
alter table public.assets validate constraint assets_payload_json_contract;
alter table public.registered_invoices validate constraint registered_invoices_payload_json_contract;
alter table public.administrative_logs validate constraint administrative_logs_details_json_contract;
alter table public.data_import_runs validate constraint data_import_runs_counts_json_contract;
alter table public.data_import_runs validate constraint data_import_runs_reconciliation_json_contract;
alter table public.audit_events validate constraint audit_events_old_record_json_contract;
alter table public.audit_events validate constraint audit_events_new_record_json_contract;

create or replace function public.save_exercise_with_competences(
    p_config jsonb,
    p_competences jsonb,
    p_administrative_log jsonb default null
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_config public.app_config%rowtype;
    v_competence_count integer;
begin
    if public.current_app_role() not in ('technical_admin', 'sme_management') then
        raise exception 'AUTHORIZATION_DENIED: perfil sem permissão para configurar exercícios';
    end if;
    if jsonb_typeof(p_config) <> 'object' or nullif(p_config ->> 'id', '') is null then
        raise exception 'VALIDATION_ERROR: configuração inválida';
    end if;
    if jsonb_typeof(p_competences) <> 'array' or jsonb_array_length(p_competences) <> 12 then
        raise exception 'VALIDATION_ERROR: o exercício exige exatamente doze competências';
    end if;
    if not public.radar_jsonb_matches('compatibilityPayload', coalesce(p_config -> 'settings', '{}'::jsonb)) then
        raise exception 'VALIDATION_ERROR: settings incompatível';
    end if;

    insert into public.competences (
        id, label, exercise, starts_on, ends_on, bonus_deadline, closed_at
    )
    select
        item.id,
        coalesce(nullif(item.label, ''), item.id),
        item.exercise,
        item.starts_on,
        item.ends_on,
        item.bonus_deadline,
        item.closed_at
    from jsonb_to_recordset(p_competences) as item(
        id text,
        label text,
        exercise integer,
        starts_on date,
        ends_on date,
        bonus_deadline date,
        closed_at timestamptz
    )
    on conflict (id) do update set
        label = excluded.label,
        exercise = excluded.exercise,
        starts_on = excluded.starts_on,
        ends_on = excluded.ends_on,
        bonus_deadline = excluded.bonus_deadline,
        closed_at = excluded.closed_at;

    get diagnostics v_competence_count = row_count;

    insert into public.app_config (
        id, exercises, closing_competence, bonus_deadline_extended, settings
    ) values (
        p_config ->> 'id',
        coalesce(p_config -> 'exercises', '[]'::jsonb),
        nullif(p_config ->> 'closing_competence', ''),
        nullif(p_config ->> 'bonus_deadline_extended', '')::date,
        coalesce(p_config -> 'settings', '{}'::jsonb)
    )
    on conflict (id) do update set
        exercises = excluded.exercises,
        closing_competence = excluded.closing_competence,
        bonus_deadline_extended = excluded.bonus_deadline_extended,
        settings = excluded.settings
    returning * into v_config;

    if p_administrative_log is not null then
        if nullif(p_administrative_log ->> 'id', '') is null
            or nullif(p_administrative_log ->> 'action', '') is null
            or not public.radar_jsonb_matches('auditDetails', coalesce(p_administrative_log -> 'details', '{}'::jsonb)) then
            raise exception 'VALIDATION_ERROR: log administrativo inválido';
        end if;
        insert into public.administrative_logs (
            id, school_id, actor_user_id, user_identifier, profile_name, action, details, event_at
        ) values (
            p_administrative_log ->> 'id',
            nullif(p_administrative_log ->> 'school_id', ''),
            auth.uid(),
            coalesce(p_administrative_log ->> 'user_identifier', ''),
            coalesce(p_administrative_log ->> 'profile_name', public.current_app_role(), ''),
            p_administrative_log ->> 'action',
            coalesce(p_administrative_log -> 'details', '{}'::jsonb),
            coalesce(nullif(p_administrative_log ->> 'event_at', '')::timestamptz, now())
        );
    end if;

    return jsonb_build_object(
        'config', to_jsonb(v_config),
        'competence_count', v_competence_count
    );
end
$$;

revoke all on function public.save_exercise_with_competences(jsonb, jsonb, jsonb) from public;
grant execute on function public.save_exercise_with_competences(jsonb, jsonb, jsonb) to authenticated;

create or replace function public.save_school_with_programs(
    p_school jsonb,
    p_programs jsonb,
    p_expected_school_version integer default null,
    p_administrative_log jsonb default null
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_school public.schools%rowtype;
    v_existing public.schools%rowtype;
    v_school_id text := nullif(p_school ->> 'id', '');
    v_program_count integer;
begin
    if jsonb_typeof(p_school) <> 'object' or v_school_id is null then
        raise exception 'VALIDATION_ERROR: escola inválida';
    end if;
    if jsonb_typeof(p_programs) <> 'array' then
        raise exception 'VALIDATION_ERROR: programas da escola devem formar uma coleção';
    end if;

    select * into v_existing from public.schools where id = v_school_id for update;
    if found then
        if not public.can_write_school(v_school_id) then
            raise exception 'AUTHORIZATION_DENIED: usuário sem escrita para a escola %', v_school_id;
        end if;
        if p_expected_school_version is null or v_existing.row_version <> p_expected_school_version then
            raise exception 'OPTIMISTIC_CONFLICT: schools/%', v_school_id;
        end if;
        update public.schools set
            designation = coalesce(nullif(p_school ->> 'designation', ''), designation),
            denomination = coalesce(nullif(p_school ->> 'denomination', ''), denomination),
            phone = coalesce(p_school ->> 'phone', phone),
            institutional_mobile = coalesce(p_school ->> 'institutional_mobile', institutional_mobile),
            email = coalesce(p_school ->> 'email', email),
            director_name = coalesce(p_school ->> 'director_name', director_name),
            director_phone = coalesce(p_school ->> 'director_phone', director_phone),
            deputy_director_name = coalesce(p_school ->> 'deputy_director_name', deputy_director_name),
            deputy_director_phone = coalesce(p_school ->> 'deputy_director_phone', deputy_director_phone),
            inep = coalesce(p_school ->> 'inep', inep),
            cnpj = coalesce(p_school ->> 'cnpj', cnpj),
            cre = coalesce(nullif(p_school ->> 'cre', ''), cre),
            ra = coalesce(p_school ->> 'ra', ra),
            sici = coalesce(p_school ->> 'sici', sici),
            controller_id = nullif(p_school ->> 'controller_id', ''),
            inventory_process = coalesce(p_school ->> 'inventory_process', inventory_process),
            initial_competence = nullif(p_school ->> 'initial_competence', ''),
            active = coalesce((p_school ->> 'active')::boolean, active)
        where id = v_school_id and row_version = p_expected_school_version
        returning * into v_school;
        if not found then raise exception 'OPTIMISTIC_CONFLICT: schools/%', v_school_id; end if;
    else
        if public.current_app_role() not in ('technical_admin', 'federal_assistant') then
            raise exception 'AUTHORIZATION_DENIED: perfil sem permissão para cadastrar escola';
        end if;
        insert into public.schools (
            id, designation, denomination, phone, institutional_mobile, email,
            director_name, director_phone, deputy_director_name, deputy_director_phone,
            inep, cnpj, cre, ra, sici, controller_id, inventory_process,
            initial_competence, active
        ) values (
            v_school_id,
            p_school ->> 'designation',
            p_school ->> 'denomination',
            coalesce(p_school ->> 'phone', ''),
            coalesce(p_school ->> 'institutional_mobile', ''),
            coalesce(p_school ->> 'email', ''),
            coalesce(p_school ->> 'director_name', ''),
            coalesce(p_school ->> 'director_phone', ''),
            coalesce(p_school ->> 'deputy_director_name', ''),
            coalesce(p_school ->> 'deputy_director_phone', ''),
            coalesce(p_school ->> 'inep', ''),
            coalesce(p_school ->> 'cnpj', ''),
            p_school ->> 'cre',
            coalesce(p_school ->> 'ra', ''),
            coalesce(p_school ->> 'sici', ''),
            nullif(p_school ->> 'controller_id', ''),
            coalesce(p_school ->> 'inventory_process', ''),
            nullif(p_school ->> 'initial_competence', ''),
            coalesce((p_school ->> 'active')::boolean, true)
        ) returning * into v_school;
    end if;

    insert into public.school_programs (id, school_id, program_id, active, starts_on, ends_on)
    select
        item.id,
        v_school_id,
        item.program_id,
        coalesce(item.active, true),
        item.starts_on,
        item.ends_on
    from jsonb_to_recordset(p_programs) as item(
        id text, school_id text, program_id text, active boolean, starts_on date, ends_on date
    )
    where item.id is not null and item.program_id is not null
    on conflict (id) do update set
        school_id = excluded.school_id,
        program_id = excluded.program_id,
        active = excluded.active,
        starts_on = excluded.starts_on,
        ends_on = excluded.ends_on;

    update public.school_programs existing
    set active = false
    where existing.school_id = v_school_id
      and not exists (
          select 1 from jsonb_to_recordset(p_programs) as requested(id text)
          where requested.id = existing.id
      );

    select count(*)::integer into v_program_count
    from public.school_programs where school_id = v_school_id and active;

    if p_administrative_log is not null then
        if nullif(p_administrative_log ->> 'id', '') is null
            or nullif(p_administrative_log ->> 'action', '') is null
            or not public.radar_jsonb_matches('auditDetails', coalesce(p_administrative_log -> 'details', '{}'::jsonb)) then
            raise exception 'VALIDATION_ERROR: log administrativo inválido';
        end if;
        insert into public.administrative_logs (
            id, school_id, actor_user_id, user_identifier, profile_name, action, details, event_at
        ) values (
            p_administrative_log ->> 'id',
            v_school_id,
            auth.uid(),
            coalesce(p_administrative_log ->> 'user_identifier', ''),
            coalesce(p_administrative_log ->> 'profile_name', public.current_app_role(), ''),
            p_administrative_log ->> 'action',
            coalesce(p_administrative_log -> 'details', '{}'::jsonb),
            coalesce(nullif(p_administrative_log ->> 'event_at', '')::timestamptz, now())
        );
    end if;

    return jsonb_build_object('school', to_jsonb(v_school), 'active_program_count', v_program_count);
end
$$;

revoke all on function public.save_school_with_programs(jsonb, jsonb, integer, jsonb) from public;
grant execute on function public.save_school_with_programs(jsonb, jsonb, integer, jsonb) to authenticated;

create or replace function public.reanalyze_pendency_with_verification(
    p_pendency jsonb,
    p_attempt jsonb,
    p_verification_patch jsonb,
    p_expected_pendency_version integer,
    p_expected_verification_version integer,
    p_administrative_log jsonb default null
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_pendency public.pendencies%rowtype;
    v_existing_pendency public.pendencies%rowtype;
    v_verification public.verifications%rowtype;
    v_attempt public.pendency_attempts%rowtype;
    v_pendency_id text := nullif(p_pendency ->> 'id', '');
    v_verification_id text := nullif(p_verification_patch ->> 'id', '');
begin
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

    if p_administrative_log is not null then
        if nullif(p_administrative_log ->> 'id', '') is null
            or nullif(p_administrative_log ->> 'action', '') is null
            or not public.radar_jsonb_matches('auditDetails', coalesce(p_administrative_log -> 'details', '{}'::jsonb)) then
            raise exception 'VALIDATION_ERROR: log administrativo inválido';
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
    end if;

    return jsonb_build_object(
        'pendency', to_jsonb(v_pendency),
        'attempt', case when v_attempt.id is null then null else to_jsonb(v_attempt) end,
        'verification', to_jsonb(v_verification)
    );
end
$$;

revoke all on function public.reanalyze_pendency_with_verification(jsonb, jsonb, jsonb, integer, integer, jsonb) from public;
grant execute on function public.reanalyze_pendency_with_verification(jsonb, jsonb, jsonb, integer, integer, jsonb) to authenticated;

comment on function public.radar_jsonb_matches(text, jsonb) is
    'Valida JSONB contra os contratos canônicos também usados pelo frontend Ajv.';
