-- RADAR PDDE — staging retomável, promoção atômica, reconciliação e rollback de importações.

alter table public.data_import_runs
    drop constraint if exists data_import_runs_status_check;

alter table public.data_import_runs
    add column if not exists source_hash text not null default '',
    add column if not exists completed_batches jsonb not null default '[]'::jsonb,
    add column if not exists rollback_snapshot jsonb,
    add constraint data_import_runs_status_check
        check (status in (
            'pending', 'staging', 'staged', 'promoting', 'promoted',
            'reconciled', 'reconciliation_failed', 'failed', 'rolled_back'
        )),
    add constraint data_import_runs_completed_batches_json_contract
        check (jsonb_typeof(completed_batches) = 'array'),
    add constraint data_import_runs_rollback_json_contract
        check (rollback_snapshot is null or public.radar_jsonb_matches('compatibilityPayload', rollback_snapshot));

create table public.data_import_staging (
    import_id text not null references public.data_import_runs (import_id) on update cascade on delete cascade,
    entity text not null check (entity in (
        'appConfig', 'programs', 'controllers', 'inventoryTeamMembers', 'competences',
        'schools', 'schoolPrograms', 'verifications', 'pendencies', 'pendencyAttempts',
        'pendencyContacts', 'assets', 'registeredInvoices', 'administrativeLogs'
    )),
    record_id text not null,
    batch_index integer not null check (batch_index >= 0),
    payload jsonb not null,
    source_hash text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (import_id, entity, record_id),
    constraint data_import_staging_payload_json_contract
        check (public.radar_jsonb_matches('compatibilityPayload', payload))
);

create index data_import_staging_batch_idx
    on public.data_import_staging (import_id, entity, batch_index);

alter table public.data_import_staging enable row level security;

create policy data_import_staging_read on public.data_import_staging
for select to authenticated
using (public.current_app_role() in ('technical_admin', 'federal_assistant'));

create policy data_import_staging_insert on public.data_import_staging
for insert to authenticated
with check (public.current_app_role() in ('technical_admin', 'federal_assistant'));

create policy data_import_staging_update on public.data_import_staging
for update to authenticated
using (public.current_app_role() in ('technical_admin', 'federal_assistant'))
with check (public.current_app_role() in ('technical_admin', 'federal_assistant'));

create policy data_import_staging_delete on public.data_import_staging
for delete to authenticated
using (public.current_app_role() = 'technical_admin');

grant select, insert, update, delete on table public.data_import_staging to authenticated;

create or replace function public.begin_data_import(
    p_import_id text,
    p_snapshot_format text,
    p_snapshot_version text,
    p_source_hash text,
    p_entity_counts jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_existing public.data_import_runs%rowtype;
begin
    if public.current_app_role() not in ('technical_admin', 'federal_assistant') then
        raise exception 'AUTHORIZATION_DENIED: perfil sem permissão para preparar importação';
    end if;
    if nullif(p_import_id, '') is null or nullif(p_source_hash, '') is null
        or not public.radar_jsonb_matches('entityCounts', p_entity_counts) then
        raise exception 'VALIDATION_ERROR: metadados de importação inválidos';
    end if;

    select * into v_existing from public.data_import_runs where import_id = p_import_id for update;
    if found and v_existing.source_hash <> p_source_hash then
        raise exception 'IMPORT_ID_CONFLICT: importId já associado a outro hash';
    end if;

    insert into public.data_import_runs (
        import_id, snapshot_format, snapshot_version, source_label,
        status, entity_counts, source_hash, completed_batches, started_at
    ) values (
        p_import_id, p_snapshot_format, p_snapshot_version, 'localStorage',
        'staging', p_entity_counts, p_source_hash, '[]'::jsonb, now()
    )
    on conflict (import_id) do update set
        status = case
            when data_import_runs.status = 'reconciled' then data_import_runs.status
            else 'staging'
        end,
        entity_counts = excluded.entity_counts,
        source_hash = excluded.source_hash,
        error_message = '',
        updated_at = now();

    return (select to_jsonb(run) - 'rollback_snapshot'
            from public.data_import_runs run where run.import_id = p_import_id);
end
$$;

revoke all on function public.begin_data_import(text, text, text, text, jsonb) from public;
grant execute on function public.begin_data_import(text, text, text, text, jsonb) to authenticated;

create or replace function public.stage_data_import_batch(
    p_import_id text,
    p_entity text,
    p_batch_index integer,
    p_records jsonb,
    p_source_hash text
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_run public.data_import_runs%rowtype;
    v_batch_key text := p_entity || ':' || p_batch_index::text;
    v_count integer;
begin
    if public.current_app_role() not in ('technical_admin', 'federal_assistant') then
        raise exception 'AUTHORIZATION_DENIED: perfil sem permissão para staging';
    end if;
    if p_batch_index < 0 or jsonb_typeof(p_records) <> 'array' then
        raise exception 'VALIDATION_ERROR: lote de importação inválido';
    end if;
    select * into v_run from public.data_import_runs where import_id = p_import_id for update;
    if not found then raise exception 'NOT_FOUND: data_import_runs/%', p_import_id; end if;
    if v_run.source_hash <> p_source_hash then raise exception 'IMPORT_ID_CONFLICT: hash divergente'; end if;

    insert into public.data_import_staging (
        import_id, entity, record_id, batch_index, payload, source_hash
    )
    select
        p_import_id,
        p_entity,
        record ->> 'id',
        p_batch_index,
        record,
        p_source_hash
    from jsonb_array_elements(p_records) record
    where nullif(record ->> 'id', '') is not null
    on conflict (import_id, entity, record_id) do update set
        batch_index = excluded.batch_index,
        payload = excluded.payload,
        source_hash = excluded.source_hash,
        updated_at = now();

    get diagnostics v_count = row_count;

    update public.data_import_runs set
        status = 'staging',
        completed_batches = case
            when completed_batches ? v_batch_key then completed_batches
            else completed_batches || jsonb_build_array(v_batch_key)
        end,
        updated_at = now()
    where import_id = p_import_id;

    return jsonb_build_object(
        'importId', p_import_id,
        'entity', p_entity,
        'batchIndex', p_batch_index,
        'recordCount', v_count,
        'idempotent', true
    );
end
$$;

revoke all on function public.stage_data_import_batch(text, text, integer, jsonb, text) from public;
grant execute on function public.stage_data_import_batch(text, text, integer, jsonb, text) to authenticated;

create or replace function public.load_staged_import(p_import_id text)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
    select jsonb_build_object(
        'format', run.snapshot_format,
        'version', run.snapshot_version,
        'importId', run.import_id,
        'exportedAt', run.started_at,
        'entities', coalesce(staged.entities, '{}'::jsonb)
    )
    from public.data_import_runs run
    left join lateral (
        select jsonb_object_agg(entity, records) as entities
        from (
            select entity, jsonb_agg(payload order by record_id) as records
            from public.data_import_staging
            where import_id = p_import_id
            group by entity
        ) grouped
    ) staged on true
    where run.import_id = p_import_id
      and public.current_app_role() in ('technical_admin', 'federal_assistant')
$$;

revoke all on function public.load_staged_import(text) from public;
grant execute on function public.load_staged_import(text) to authenticated;

create or replace function public.capture_functional_snapshot(p_import_id text)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
    select jsonb_build_object(
        'format', 'radar-pdde-snapshot',
        'version', 'rollback-1',
        'importId', p_import_id || ':rollback',
        'exportedAt', now(),
        'entities', jsonb_build_object(
            'competences', coalesce((select jsonb_agg(to_jsonb(t) order by id) from public.competences t), '[]'::jsonb),
            'programs', coalesce((select jsonb_agg(to_jsonb(t) order by id) from public.programs t), '[]'::jsonb),
            'appConfig', coalesce((select jsonb_agg(to_jsonb(t) order by id) from public.app_config t), '[]'::jsonb),
            'controllers', coalesce((select jsonb_agg(to_jsonb(t) order by id) from public.controllers t), '[]'::jsonb),
            'inventoryTeamMembers', coalesce((select jsonb_agg(to_jsonb(t) order by id) from public.inventory_team_members t), '[]'::jsonb),
            'schools', coalesce((select jsonb_agg(to_jsonb(t) order by id) from public.schools t), '[]'::jsonb),
            'schoolPrograms', coalesce((select jsonb_agg(to_jsonb(t) order by id) from public.school_programs t), '[]'::jsonb),
            'verifications', coalesce((select jsonb_agg(to_jsonb(t) order by id) from public.verifications t), '[]'::jsonb),
            'pendencies', coalesce((select jsonb_agg(to_jsonb(t) order by id) from public.pendencies t), '[]'::jsonb),
            'pendencyAttempts', coalesce((select jsonb_agg(to_jsonb(t) order by id) from public.pendency_attempts t), '[]'::jsonb),
            'pendencyContacts', coalesce((select jsonb_agg(to_jsonb(t) order by id) from public.pendency_contacts t), '[]'::jsonb),
            'assets', coalesce((select jsonb_agg(to_jsonb(t) order by id) from public.assets t), '[]'::jsonb),
            'registeredInvoices', coalesce((select jsonb_agg(to_jsonb(t) order by id) from public.registered_invoices t), '[]'::jsonb),
            'administrativeLogs', coalesce((select jsonb_agg(to_jsonb(t) order by id) from public.administrative_logs t), '[]'::jsonb)
        )
    )
$$;

revoke all on function public.capture_functional_snapshot(text) from public;
grant execute on function public.capture_functional_snapshot(text) to authenticated;

create or replace function public.apply_functional_snapshot(p_snapshot jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_entities jsonb := coalesce(p_snapshot -> 'entities', '{}'::jsonb);
    v_entity text;
    v_table text;
    v_records jsonb;
    v_sql text;
    v_inserted integer := 0;
    v_count integer;
begin
    if public.current_app_role() <> 'technical_admin' then
        raise exception 'AUTHORIZATION_DENIED: promoção e rollback exigem Administrador técnico';
    end if;
    if p_snapshot ->> 'format' <> 'radar-pdde-snapshot' or jsonb_typeof(v_entities) <> 'object' then
        raise exception 'VALIDATION_ERROR: snapshot funcional inválido';
    end if;

    delete from public.administrative_logs;
    delete from public.registered_invoices;
    delete from public.assets;
    delete from public.pendency_contacts;
    delete from public.pendency_attempts;
    delete from public.pendencies;
    delete from public.verifications;
    delete from public.school_programs;
    delete from public.schools;
    delete from public.app_config;
    delete from public.competences;
    delete from public.programs;

    foreach v_entity in array array[
        'competences', 'programs', 'appConfig', 'schools', 'schoolPrograms',
        'verifications', 'pendencies', 'pendencyAttempts', 'pendencyContacts',
        'assets', 'registeredInvoices', 'administrativeLogs'
    ] loop
        v_table := case v_entity
            when 'appConfig' then 'app_config'
            when 'schoolPrograms' then 'school_programs'
            when 'pendencyAttempts' then 'pendency_attempts'
            when 'pendencyContacts' then 'pendency_contacts'
            when 'registeredInvoices' then 'registered_invoices'
            when 'administrativeLogs' then 'administrative_logs'
            else regexp_replace(v_entity, '([a-z])([A-Z])', '\1_\2', 'g')
        end;
        v_records := coalesce(v_entities -> v_entity, '[]'::jsonb);
        if jsonb_array_length(v_records) = 0 then continue; end if;
        select jsonb_agg(
            record
            || case when not (record ? 'row_version') then '{"row_version":1}'::jsonb else '{}'::jsonb end
            || case when not (record ? 'created_at') then jsonb_build_object('created_at', now()) else '{}'::jsonb end
            || case when not (record ? 'updated_at') then jsonb_build_object('updated_at', now()) else '{}'::jsonb end
            order by record ->> 'id'
        ) into v_records
        from jsonb_array_elements(v_records) record;
        v_sql := format(
            'insert into public.%I select * from jsonb_populate_recordset(null::public.%I, $1)',
            v_table, v_table
        );
        execute v_sql using v_records;
        get diagnostics v_count = row_count;
        v_inserted := v_inserted + v_count;
    end loop;

    -- Cadastros ligados ao Auth são preservados; registros locais adicionais são inseridos idempotentemente.
    select coalesce(jsonb_agg(
        record
        || case when not (record ? 'row_version') then '{"row_version":1}'::jsonb else '{}'::jsonb end
        || case when not (record ? 'created_at') then jsonb_build_object('created_at', now()) else '{}'::jsonb end
        || case when not (record ? 'updated_at') then jsonb_build_object('updated_at', now()) else '{}'::jsonb end
        order by record ->> 'id'
    ), '[]'::jsonb)
    into v_records
    from jsonb_array_elements(coalesce(v_entities -> 'controllers', '[]'::jsonb)) record;
    insert into public.controllers
    select * from jsonb_populate_recordset(null::public.controllers, v_records)
    on conflict (id) do nothing;

    select coalesce(jsonb_agg(
        record
        || case when not (record ? 'row_version') then '{"row_version":1}'::jsonb else '{}'::jsonb end
        || case when not (record ? 'created_at') then jsonb_build_object('created_at', now()) else '{}'::jsonb end
        || case when not (record ? 'updated_at') then jsonb_build_object('updated_at', now()) else '{}'::jsonb end
        order by record ->> 'id'
    ), '[]'::jsonb)
    into v_records
    from jsonb_array_elements(coalesce(v_entities -> 'inventoryTeamMembers', '[]'::jsonb)) record;
    insert into public.inventory_team_members
    select * from jsonb_populate_recordset(null::public.inventory_team_members, v_records)
    on conflict (id) do nothing;

    return jsonb_build_object('inserted', v_inserted, 'atomic', true);
end
$$;

revoke all on function public.apply_functional_snapshot(jsonb) from public;
grant execute on function public.apply_functional_snapshot(jsonb) to authenticated;

create or replace function public.promote_data_import(
    p_import_id text,
    p_source_hash text,
    p_entity_counts jsonb,
    p_snapshot jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_run public.data_import_runs%rowtype;
    v_rollback jsonb;
    v_result jsonb;
begin
    if public.current_app_role() <> 'technical_admin' then
        raise exception 'AUTHORIZATION_DENIED: promoção exige Administrador técnico';
    end if;
    select * into v_run from public.data_import_runs where import_id = p_import_id for update;
    if not found then raise exception 'NOT_FOUND: data_import_runs/%', p_import_id; end if;
    if v_run.source_hash <> p_source_hash then raise exception 'IMPORT_ID_CONFLICT: hash divergente'; end if;
    if not public.radar_jsonb_matches('entityCounts', p_entity_counts) then
        raise exception 'VALIDATION_ERROR: contagens inválidas';
    end if;

    v_rollback := public.capture_functional_snapshot(p_import_id);
    update public.data_import_runs set
        status = 'promoting',
        rollback_snapshot = v_rollback,
        entity_counts = p_entity_counts,
        updated_at = now()
    where import_id = p_import_id;

    v_result := public.apply_functional_snapshot(p_snapshot);

    update public.data_import_runs set status = 'promoted', updated_at = now()
    where import_id = p_import_id;

    return jsonb_build_object('importId', p_import_id, 'status', 'promoted', 'result', v_result);
end
$$;

revoke all on function public.promote_data_import(text, text, jsonb, jsonb) from public;
grant execute on function public.promote_data_import(text, text, jsonb, jsonb) to authenticated;

create or replace function public.complete_data_import(
    p_import_id text,
    p_source_hash text,
    p_reconciliation jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
    if public.current_app_role() <> 'technical_admin' then
        raise exception 'AUTHORIZATION_DENIED: conclusão exige Administrador técnico';
    end if;
    if not public.radar_jsonb_matches('reconciliationReport', p_reconciliation) then
        raise exception 'VALIDATION_ERROR: relatório de reconciliação inválido';
    end if;
    update public.data_import_runs set
        status = 'reconciled',
        reconciliation_report = p_reconciliation,
        completed_at = now(),
        updated_at = now()
    where import_id = p_import_id and source_hash = p_source_hash and status = 'promoted';
    if not found then raise exception 'IMPORT_STATE_CONFLICT: importação não está promovida'; end if;
    delete from public.data_import_staging where import_id = p_import_id;
    return jsonb_build_object('importId', p_import_id, 'status', 'reconciled');
end
$$;

revoke all on function public.complete_data_import(text, text, jsonb) from public;
grant execute on function public.complete_data_import(text, text, jsonb) to authenticated;

create or replace function public.rollback_data_import(p_import_id text)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_run public.data_import_runs%rowtype;
begin
    if public.current_app_role() <> 'technical_admin' then
        raise exception 'AUTHORIZATION_DENIED: rollback exige Administrador técnico';
    end if;
    select * into v_run from public.data_import_runs where import_id = p_import_id for update;
    if not found or v_run.rollback_snapshot is null then
        raise exception 'IMPORT_ROLLBACK_UNAVAILABLE: %', p_import_id;
    end if;
    perform public.apply_functional_snapshot(v_run.rollback_snapshot);
    update public.data_import_runs set
        status = 'rolled_back', completed_at = now(), updated_at = now()
    where import_id = p_import_id;
    delete from public.data_import_staging where import_id = p_import_id;
    return jsonb_build_object('importId', p_import_id, 'status', 'rolled_back');
end
$$;

revoke all on function public.rollback_data_import(text) from public;
grant execute on function public.rollback_data_import(text) to authenticated;
