-- RADAR PDDE — remediação de integridade funcional identificada na auditoria de 06/08/2026.
-- Corrige, de forma transacional:
-- 1. criação concorrente de exercício;
-- 2. exclusão do bem derivado ao desvincular uma nota permanente;
-- 3. sincronização do status das tentativas com o agregado de pendência.

begin;

-- ---------------------------------------------------------------------------
-- CFG-02 — exercício com controle otimista e contrato mensal estrito.
-- A assinatura pública é preservada; a versão esperada vem do row_version
-- canônico já presente em p_config.
-- ---------------------------------------------------------------------------
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
    v_existing public.app_config%rowtype;
    v_expected_version integer;
    v_exercise integer;
    v_competence_count integer;
    v_distinct_ids integer;
    v_distinct_exercises integer;
    v_missing_months integer;
begin
    if public.current_app_role() not in ('technical_admin', 'sme_management') then
        raise exception 'AUTHORIZATION_DENIED: perfil sem permissão para configurar exercícios';
    end if;
    if jsonb_typeof(p_config) <> 'object'
        or nullif(p_config ->> 'id', '') is null then
        raise exception 'VALIDATION_ERROR: configuração inválida';
    end if;
    begin
        v_expected_version := nullif(p_config ->> 'row_version', '')::integer;
    exception when others then
        raise exception 'VALIDATION_ERROR: row_version da configuração é inválido';
    end;
    if v_expected_version is null or v_expected_version <= 0 then
        raise exception 'VALIDATION_ERROR: criação de exercício exige row_version positivo';
    end if;
    if jsonb_typeof(p_competences) <> 'array'
        or jsonb_array_length(p_competences) <> 12 then
        raise exception 'VALIDATION_ERROR: o exercício exige exatamente doze competências';
    end if;
    if not public.radar_jsonb_matches(
        'compatibilityPayload',
        coalesce(p_config -> 'settings', '{}'::jsonb)
    ) then
        raise exception 'VALIDATION_ERROR: settings incompatível';
    end if;

    select
        min(item.exercise),
        count(*),
        count(distinct item.id),
        count(distinct item.exercise)
    into
        v_exercise,
        v_competence_count,
        v_distinct_ids,
        v_distinct_exercises
    from jsonb_to_recordset(p_competences) as item(
        id text,
        label text,
        exercise integer,
        starts_on date,
        ends_on date,
        bonus_deadline date,
        closed_at timestamptz
    );

    if v_competence_count <> 12
        or v_distinct_ids <> 12
        or v_distinct_exercises <> 1
        or v_exercise is null
        or v_exercise < 2000
        or v_exercise > 2100 then
        raise exception 'VALIDATION_ERROR: as competências devem representar um único exercício com doze meses distintos';
    end if;

    select count(*)
    into v_missing_months
    from generate_series(1, 12) as month_number
    where not exists (
        select 1
        from jsonb_to_recordset(p_competences) as item(
            id text,
            label text,
            exercise integer,
            starts_on date,
            ends_on date,
            bonus_deadline date,
            closed_at timestamptz
        )
        where item.exercise = v_exercise
          and item.id = format('%s-%s', v_exercise, lpad(month_number::text, 2, '0'))
    );

    if v_missing_months <> 0 then
        raise exception 'VALIDATION_ERROR: o exercício deve conter exatamente as competências de janeiro a dezembro';
    end if;
    if jsonb_typeof(p_config -> 'exercises') <> 'array'
        or not ((p_config -> 'exercises') @> jsonb_build_array(v_exercise::text)) then
        raise exception 'VALIDATION_ERROR: configuração não contém o exercício informado';
    end if;
    if nullif(p_config ->> 'closing_competence', '') !~ format('^%s-(0[1-9]|1[0-2])$', v_exercise) then
        raise exception 'VALIDATION_ERROR: competência inicial deve pertencer ao novo exercício';
    end if;

    select *
    into v_existing
    from public.app_config
    where id = p_config ->> 'id'
    for update;

    if not found then
        raise exception 'NOT_FOUND: app_config/%', p_config ->> 'id';
    end if;
    if v_existing.row_version <> v_expected_version then
        raise exception 'OPTIMISTIC_CONFLICT: app_config/%', p_config ->> 'id';
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

    update public.app_config
    set
        exercises = coalesce(p_config -> 'exercises', '[]'::jsonb),
        closing_competence = nullif(p_config ->> 'closing_competence', ''),
        bonus_deadline_extended = nullif(p_config ->> 'bonus_deadline_extended', '')::date,
        settings = coalesce(p_config -> 'settings', '{}'::jsonb)
    where id = p_config ->> 'id'
      and row_version = v_expected_version
    returning * into v_config;

    if not found then
        raise exception 'OPTIMISTIC_CONFLICT: app_config/%', p_config ->> 'id';
    end if;

    if p_administrative_log is null
        or jsonb_typeof(p_administrative_log) <> 'object'
        or nullif(p_administrative_log ->> 'id', '') is null
        or nullif(p_administrative_log ->> 'action', '') is null
        or not public.radar_jsonb_matches(
            'auditDetails',
            coalesce(p_administrative_log -> 'details', '{}'::jsonb)
        ) then
        raise exception 'VALIDATION_ERROR: log administrativo obrigatório e inválido';
    end if;
    if nullif(p_administrative_log ->> 'school_id', '') is not null then
        raise exception 'VALIDATION_ERROR: criação de exercício exige log global';
    end if;

    insert into public.administrative_logs (
        id, school_id, actor_user_id, user_identifier,
        profile_name, action, details, event_at
    ) values (
        p_administrative_log ->> 'id',
        null,
        auth.uid(),
        coalesce(p_administrative_log ->> 'user_identifier', ''),
        coalesce(nullif(p_administrative_log ->> 'profile_name', ''), public.current_app_role()),
        p_administrative_log ->> 'action',
        coalesce(p_administrative_log -> 'details', '{}'::jsonb),
        coalesce(nullif(p_administrative_log ->> 'event_at', '')::timestamptz, now())
    );

    return jsonb_build_object(
        'config', to_jsonb(v_config),
        'competence_count', v_competence_count
    );
end
$$;

revoke all on function public.save_exercise_with_competences(jsonb, jsonb, jsonb) from public;
grant execute on function public.save_exercise_with_competences(jsonb, jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- INV-01 — o bem derivado deixa de existir na mesma transação em que a nota
-- perde ou troca o vínculo. O gatilho também protege futuros percursos de
-- escrita que atualizem registered_invoices fora da RPC atual.
-- ---------------------------------------------------------------------------
create or replace function public.delete_unlinked_invoice_asset()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
    if old.linked_asset_id is null
        or old.linked_asset_id is not distinct from new.linked_asset_id then
        return new;
    end if;

    if exists (
        select 1
        from public.registered_invoices invoice
        where invoice.linked_asset_id = old.linked_asset_id
          and invoice.id <> new.id
    ) then
        raise exception 'INTEGRITY_CONFLICT: o bem % está vinculado a outra nota', old.linked_asset_id;
    end if;

    delete from public.assets
    where id = old.linked_asset_id
      and school_id = old.school_id;

    if not found then
        raise exception 'INTEGRITY_CONFLICT: bem derivado % não localizado para desvinculação', old.linked_asset_id;
    end if;

    return new;
end
$$;

revoke all on function public.delete_unlinked_invoice_asset() from public;

drop trigger if exists registered_invoices_delete_unlinked_asset on public.registered_invoices;
create trigger registered_invoices_delete_unlinked_asset
after update of linked_asset_id on public.registered_invoices
for each row
when (old.linked_asset_id is distinct from new.linked_asset_id)
execute function public.delete_unlinked_invoice_asset();

-- ---------------------------------------------------------------------------
-- PEND-02 — a tabela própria de tentativas passa a acompanhar a autoridade
-- do agregado persistido em pendencies.payload.tentativas.
-- ---------------------------------------------------------------------------
create or replace function public.sync_pendency_attempt_statuses()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
    if jsonb_typeof(coalesce(new.payload -> 'tentativas', '[]'::jsonb)) <> 'array' then
        raise exception 'VALIDATION_ERROR: tentativas da pendência devem ser um array';
    end if;

    update public.pendency_attempts attempt
    set payload = jsonb_set(
        coalesce(attempt.payload, '{}'::jsonb),
        '{status}',
        to_jsonb(source_attempt ->> 'status'),
        true
    )
    from jsonb_array_elements(coalesce(new.payload -> 'tentativas', '[]'::jsonb)) source_attempt
    where attempt.pendency_id = new.id
      and attempt.id = nullif(source_attempt ->> 'id', '')
      and nullif(source_attempt ->> 'status', '') is not null
      and coalesce(attempt.payload ->> 'status', '') is distinct from (source_attempt ->> 'status');

    return new;
end
$$;

revoke all on function public.sync_pendency_attempt_statuses() from public;

drop trigger if exists pendencies_sync_attempt_statuses on public.pendencies;
create trigger pendencies_sync_attempt_statuses
after insert or update of payload on public.pendencies
for each row
execute function public.sync_pendency_attempt_statuses();

-- Reconciliação idempotente dos registros existentes, sem apagar histórico.
update public.pendency_attempts attempt
set payload = jsonb_set(
    coalesce(attempt.payload, '{}'::jsonb),
    '{status}',
    to_jsonb(source_attempt ->> 'status'),
    true
)
from public.pendencies pendency
cross join lateral jsonb_array_elements(
    case
        when jsonb_typeof(coalesce(pendency.payload -> 'tentativas', '[]'::jsonb)) = 'array'
            then coalesce(pendency.payload -> 'tentativas', '[]'::jsonb)
        else '[]'::jsonb
    end
) source_attempt
where attempt.pendency_id = pendency.id
  and attempt.id = nullif(source_attempt ->> 'id', '')
  and nullif(source_attempt ->> 'status', '') is not null
  and coalesce(attempt.payload ->> 'status', '') is distinct from (source_attempt ->> 'status');

commit;
