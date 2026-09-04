begin;

create or replace function radar_private.strip_verification_payload_versions()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public'
as $$
begin
    new.payload := coalesce(new.payload, '{}'::jsonb) - 'rowVersion' - 'row_version';
    return new;
end;
$$;

drop trigger if exists verifications_strip_payload_versions on public.verifications;
create trigger verifications_strip_payload_versions
before insert or update of payload on public.verifications
for each row execute function radar_private.strip_verification_payload_versions();

update public.verifications
set payload = coalesce(payload, '{}'::jsonb) - 'rowVersion' - 'row_version'
where coalesce(payload, '{}'::jsonb) ?| array['rowVersion', 'row_version'];

create or replace function public.save_asset_with_verification_and_log(
    p_asset jsonb,
    p_expected_asset_version integer,
    p_verification jsonb,
    p_expected_verification_version integer,
    p_administrative_log jsonb
)
returns jsonb
language plpgsql
set search_path to 'pg_catalog', 'public'
as $$
declare
    v_role text := public.current_app_role();
    v_asset_id text := nullif(p_asset ->> 'id', '');
    v_school_id text := nullif(p_asset ->> 'school_id', '');
    v_verification_id text := nullif(p_verification ->> 'id', '');
    v_asset public.assets%rowtype;
    v_verification public.verifications%rowtype;
    v_log public.administrative_logs%rowtype;
begin
    if v_role not in ('controller', 'federal_assistant', 'technical_admin') then
        raise exception 'AUTHORIZATION_DENIED: perfil sem permissão para encaminhar patrimônio';
    end if;

    if jsonb_typeof(p_asset) <> 'object'
        or v_asset_id is null
        or v_school_id is null
        or nullif(p_asset ->> 'status', '') <> 'Encaminhada'
        or nullif(p_asset ->> 'inventory_process', '') is null then
        raise exception 'VALIDATION_ERROR: bem encaminhado inválido';
    end if;

    if jsonb_typeof(p_verification) <> 'object'
        or v_verification_id is null
        or nullif(p_verification ->> 'school_id', '') is distinct from v_school_id
        or nullif(p_verification ->> 'competence_id', '') is null
        or nullif(p_verification ->> 'program_id', '') is null then
        raise exception 'VALIDATION_ERROR: verificação patrimonial inválida';
    end if;

    if not public.can_write_school(v_school_id) then
        raise exception 'AUTHORIZATION_DENIED: usuário sem escrita para a escola %', v_school_id;
    end if;

    if not exists (
        select 1
        from public.registered_invoices ri
        where ri.linked_asset_id = v_asset_id
          and ri.school_id = v_school_id
          and ri.verification_id = v_verification_id
          and ri.expense_type = 'permanente'
    ) then
        raise exception 'VALIDATION_ERROR: bem e verificação não pertencem à mesma Nota Fiscal permanente';
    end if;

    if p_administrative_log is null
        or jsonb_typeof(p_administrative_log) <> 'object'
        or nullif(p_administrative_log ->> 'id', '') is null
        or nullif(p_administrative_log ->> 'action', '') is null then
        raise exception 'VALIDATION_ERROR: log administrativo obrigatório e inválido';
    end if;

    if nullif(p_administrative_log ->> 'school_id', '') is not null
        and (p_administrative_log ->> 'school_id') is distinct from v_school_id then
        raise exception 'VALIDATION_ERROR: log administrativo pertence a outra escola';
    end if;

    update public.assets
    set status = 'Encaminhada',
        inventory_process = p_asset ->> 'inventory_process'
    where id = v_asset_id
      and school_id = v_school_id
      and row_version = p_expected_asset_version
    returning * into v_asset;

    if not found then
        raise exception 'OPTIMISTIC_CONFLICT: assets/%', v_asset_id;
    end if;

    update public.verifications
    set bonification = coalesce(p_verification -> 'bonification', bonification),
        analysis = coalesce(p_verification -> 'analysis', analysis),
        bonus_result = case
            when p_verification ? 'bonus_result'
                then nullif(p_verification ->> 'bonus_result', '')
            else bonus_result
        end,
        payload = coalesce(p_verification -> 'payload', payload) - 'rowVersion' - 'row_version'
    where id = v_verification_id
      and school_id = v_school_id
      and row_version = p_expected_verification_version
    returning * into v_verification;

    if not found then
        raise exception 'OPTIMISTIC_CONFLICT: verifications/%', v_verification_id;
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
        coalesce(nullif(p_administrative_log ->> 'profile_name', ''), v_role),
        p_administrative_log ->> 'action',
        coalesce(p_administrative_log -> 'details', '{}'::jsonb),
        coalesce(nullif(p_administrative_log ->> 'event_at', '')::timestamptz, now())
    ) returning * into v_log;

    return jsonb_build_object(
        'asset', to_jsonb(v_asset),
        'verification', to_jsonb(v_verification),
        'administrative_log', to_jsonb(v_log)
    );
end
$$;

revoke all on function public.save_asset_with_verification_and_log(jsonb, integer, jsonb, integer, jsonb) from public;
revoke all on function public.save_asset_with_verification_and_log(jsonb, integer, jsonb, integer, jsonb) from anon;
grant execute on function public.save_asset_with_verification_and_log(jsonb, integer, jsonb, integer, jsonb) to authenticated;

commit;
