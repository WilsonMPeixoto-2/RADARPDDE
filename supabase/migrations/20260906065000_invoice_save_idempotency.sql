-- RADAR PDDE — idempotência por intenção para gravação composta de Nota Fiscal.
-- A v1 permanece disponível para compatibilidade; o cliente operacional novo usa a v2.

begin;

create table if not exists radar_private.invoice_operation_idempotency (
    operation_name text not null,
    operation_key uuid not null,
    actor_user_id uuid not null,
    request_hash text not null,
    result jsonb,
    created_at timestamptz not null default now(),
    completed_at timestamptz,
    primary key (operation_name, operation_key, actor_user_id)
);

revoke all on table radar_private.invoice_operation_idempotency from public, anon, authenticated;

create or replace function radar_private.save_invoice_with_effects_v2_impl(
    p_operation_key uuid,
    p_invoice jsonb,
    p_asset jsonb default null,
    p_verification_patch jsonb default null,
    p_expected_invoice_version integer default null,
    p_expected_asset_version integer default null,
    p_expected_verification_version integer default null,
    p_administrative_log jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, radar_private
as $$
declare
    v_actor_user_id uuid := auth.uid();
    v_request jsonb;
    v_request_hash text;
    v_stored_hash text;
    v_stored_result jsonb;
    v_result jsonb;
    v_log jsonb;
begin
    if p_operation_key is null then
        raise exception 'VALIDATION_ERROR: operation key é obrigatória na gravação idempotente de Nota Fiscal';
    end if;
    if v_actor_user_id is null then
        raise exception 'AUTHORIZATION_DENIED: operação idempotente exige usuário autenticado';
    end if;

    v_request := jsonb_build_object(
        'invoice', p_invoice,
        'asset', p_asset,
        'verification_patch', p_verification_patch,
        'expected_invoice_version', p_expected_invoice_version,
        'expected_asset_version', p_expected_asset_version,
        'expected_verification_version', p_expected_verification_version,
        'administrative_log', p_administrative_log
    );
    v_request_hash := md5(v_request::text);

    insert into radar_private.invoice_operation_idempotency (
        operation_name,
        operation_key,
        actor_user_id,
        request_hash
    ) values (
        'invoice:save',
        p_operation_key,
        v_actor_user_id,
        v_request_hash
    )
    on conflict (operation_name, operation_key, actor_user_id) do nothing;

    select request_hash, result
    into v_stored_hash, v_stored_result
    from radar_private.invoice_operation_idempotency
    where operation_name = 'invoice:save'
      and operation_key = p_operation_key
      and actor_user_id = v_actor_user_id
    for update;

    if v_stored_hash is distinct from v_request_hash then
        raise exception 'IDEMPOTENCY_CONFLICT: a mesma chave de intenção foi reutilizada com outro payload';
    end if;

    if v_stored_result is not null then
        return v_stored_result;
    end if;

    v_result := radar_private.save_invoice_with_effects_impl(
        p_invoice,
        p_asset,
        p_verification_patch,
        p_expected_invoice_version,
        p_expected_asset_version,
        p_expected_verification_version,
        p_administrative_log
    );

    if p_administrative_log is not null and nullif(p_administrative_log ->> 'id', '') is not null then
        select to_jsonb(log_row)
        into v_log
        from public.administrative_logs log_row
        where log_row.id = p_administrative_log ->> 'id';
    end if;

    v_result := v_result || jsonb_build_object(
        'operation_key', p_operation_key,
        'administrative_log', v_log,
        'changed_entities', jsonb_build_array(
            'registeredInvoices',
            'assets',
            'verifications',
            'administrativeLogs'
        )
    );

    update radar_private.invoice_operation_idempotency
    set result = v_result,
        completed_at = now()
    where operation_name = 'invoice:save'
      and operation_key = p_operation_key
      and actor_user_id = v_actor_user_id;

    return v_result;
end
$$;

revoke all on function radar_private.save_invoice_with_effects_v2_impl(uuid, jsonb, jsonb, jsonb, integer, integer, integer, jsonb)
    from public, anon, authenticated;
grant execute on function radar_private.save_invoice_with_effects_v2_impl(uuid, jsonb, jsonb, jsonb, integer, integer, integer, jsonb)
    to authenticated, service_role;

create or replace function public.save_invoice_with_effects_v2(
    p_operation_key uuid,
    p_invoice jsonb,
    p_asset jsonb default null,
    p_verification_patch jsonb default null,
    p_expected_invoice_version integer default null,
    p_expected_asset_version integer default null,
    p_expected_verification_version integer default null,
    p_administrative_log jsonb default null
)
returns jsonb
language sql
security invoker
set search_path = pg_catalog, radar_private
as $$
    select radar_private.save_invoice_with_effects_v2_impl(
        p_operation_key,
        p_invoice,
        p_asset,
        p_verification_patch,
        p_expected_invoice_version,
        p_expected_asset_version,
        p_expected_verification_version,
        p_administrative_log
    )
$$;

revoke all on function public.save_invoice_with_effects_v2(uuid, jsonb, jsonb, jsonb, integer, integer, integer, jsonb)
    from public, anon;
grant execute on function public.save_invoice_with_effects_v2(uuid, jsonb, jsonb, jsonb, integer, integer, integer, jsonb)
    to authenticated, service_role;

comment on function public.save_invoice_with_effects_v2(uuid, jsonb, jsonb, jsonb, integer, integer, integer, jsonb) is
    'Grava Nota Fiscal e efeitos com idempotência por intenção. Retry da mesma chave/payload retorna o resultado já persistido.';

commit;
