-- RADAR PDDE — aplica à exclusão atômica de NF a mesma semântica de
-- reabertura já usada no salvamento: campo bonus_result ausente preserva
-- a consolidação; campo presente com string vazia limpa para NULL.

begin;

create or replace function radar_private.delete_invoice_with_effects_impl(
    p_invoice_id text,
    p_expected_invoice_version integer,
    p_delete_linked_asset boolean default true,
    p_expected_asset_version integer default null,
    p_verification_patch jsonb default null,
    p_expected_verification_version integer default null,
    p_administrative_log jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_invoice public.registered_invoices%rowtype;
    v_asset public.assets%rowtype;
    v_verification public.verifications%rowtype;
begin
    select *
    into v_invoice
    from public.registered_invoices
    where id = p_invoice_id
    for update;

    if not found then
        raise exception 'NOT_FOUND: registered_invoices/%', p_invoice_id;
    end if;

    if not public.can_write_school(v_invoice.school_id) then
        raise exception 'AUTHORIZATION_DENIED: usuário sem permissão de escrita para a escola %', v_invoice.school_id;
    end if;

    if v_invoice.row_version <> p_expected_invoice_version then
        raise exception 'OPTIMISTIC_CONFLICT: registered_invoices/%', p_invoice_id;
    end if;

    if v_invoice.linked_asset_id is not null and p_delete_linked_asset then
        select *
        into v_asset
        from public.assets
        where id = v_invoice.linked_asset_id
        for update;

        if found and (p_expected_asset_version is null or v_asset.row_version <> p_expected_asset_version) then
            raise exception 'OPTIMISTIC_CONFLICT: assets/%', v_invoice.linked_asset_id;
        end if;
    end if;

    delete from public.registered_invoices
    where id = p_invoice_id
      and row_version = p_expected_invoice_version;

    if not found then
        raise exception 'OPTIMISTIC_CONFLICT: registered_invoices/%', p_invoice_id;
    end if;

    if v_asset.id is not null and p_delete_linked_asset then
        if exists (
            select 1
            from public.registered_invoices other_invoice
            where other_invoice.linked_asset_id = v_asset.id
        ) then
            raise exception 'VALIDATION_ERROR: bem ainda está vinculado a outra nota';
        end if;

        delete from public.assets
        where id = v_asset.id
          and row_version = p_expected_asset_version;

        if not found then
            raise exception 'OPTIMISTIC_CONFLICT: assets/%', v_asset.id;
        end if;
    end if;

    if p_verification_patch is not null then
        if v_invoice.verification_id is null then
            raise exception 'VALIDATION_ERROR: nota sem verificação vinculada';
        end if;

        update public.verifications
        set
            analysis = coalesce(p_verification_patch -> 'analysis', analysis),
            bonification = coalesce(p_verification_patch -> 'bonification', bonification),
            bonus_result = case
                when p_verification_patch ? 'bonus_result'
                    then nullif(p_verification_patch ->> 'bonus_result', '')
                else bonus_result
            end
        where id = v_invoice.verification_id
          and school_id = v_invoice.school_id
          and row_version = p_expected_verification_version
        returning * into v_verification;

        if not found then
            raise exception 'OPTIMISTIC_CONFLICT: verifications/%', v_invoice.verification_id;
        end if;
    end if;

    if p_administrative_log is not null then
        if nullif(p_administrative_log ->> 'id', '') is null
            or nullif(p_administrative_log ->> 'action', '') is null then
            raise exception 'VALIDATION_ERROR: log administrativo exige id e action';
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
            v_invoice.school_id,
            auth.uid(),
            coalesce(p_administrative_log ->> 'user_identifier', ''),
            coalesce(p_administrative_log ->> 'profile_name', public.current_app_role(), ''),
            p_administrative_log ->> 'action',
            coalesce(p_administrative_log -> 'details', '{}'::jsonb),
            coalesce(nullif(p_administrative_log ->> 'event_at', '')::timestamptz, now())
        );
    end if;

    return jsonb_build_object(
        'deleted_invoice_id', p_invoice_id,
        'deleted_asset_id', case when v_asset.id is null or not p_delete_linked_asset then null else v_asset.id end,
        'verification', case when v_verification.id is null then null else to_jsonb(v_verification) end
    );
end
$$;

revoke all on function radar_private.delete_invoice_with_effects_impl(text, integer, boolean, integer, jsonb, integer, jsonb)
    from public, anon;
grant execute on function radar_private.delete_invoice_with_effects_impl(text, integer, boolean, integer, jsonb, integer, jsonb)
    to authenticated, service_role;

commit;
