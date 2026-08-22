-- RADAR PDDE — integridade patrimonial na mudança de natureza de uma Nota Fiscal.
-- A implementação privilegiada permanece no schema interno e valida autorização,
-- escola e row_version antes de qualquer efeito derivado.

begin;

create or replace function radar_private.save_invoice_with_effects_impl(
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
set search_path = pg_catalog, public
as $$
declare
    v_invoice public.registered_invoices%rowtype;
    v_existing_invoice public.registered_invoices%rowtype;
    v_asset public.assets%rowtype;
    v_existing_asset public.assets%rowtype;
    v_asset_to_remove public.assets%rowtype;
    v_verification public.verifications%rowtype;
    v_invoice_id text := nullif(p_invoice ->> 'id', '');
    v_school_id text := nullif(p_invoice ->> 'school_id', '');
    v_asset_id text := nullif(p_asset ->> 'id', '');
    v_previous_asset_id text := null;
    v_removed_asset_id text := null;
    v_verification_id text := coalesce(
        nullif(p_invoice ->> 'verification_id', ''),
        nullif(p_verification_patch ->> 'id', '')
    );
    v_amount numeric(14,2);
    v_target_expense_type text;
    v_remove_previous_asset boolean := false;
begin
    if v_invoice_id is null or v_school_id is null then
        raise exception 'VALIDATION_ERROR: invoice id e school_id são obrigatórios';
    end if;

    if not public.can_write_school(v_school_id) then
        raise exception 'AUTHORIZATION_DENIED: usuário sem permissão de escrita para a escola %', v_school_id;
    end if;

    begin
        v_amount := (p_invoice ->> 'amount')::numeric;
    exception when others then
        raise exception 'VALIDATION_ERROR: amount inválido';
    end;

    if v_amount < 0 then
        raise exception 'VALIDATION_ERROR: amount não pode ser negativo';
    end if;

    if p_asset is not null then
        if v_asset_id is null then
            raise exception 'VALIDATION_ERROR: asset id é obrigatório quando p_asset é informado';
        end if;
        if nullif(p_asset ->> 'school_id', '') is distinct from v_school_id then
            raise exception 'VALIDATION_ERROR: nota e bem devem pertencer à mesma escola';
        end if;

        select *
        into v_existing_asset
        from public.assets
        where id = v_asset_id
        for update;

        if found then
            if p_expected_asset_version is null or v_existing_asset.row_version <> p_expected_asset_version then
                raise exception 'OPTIMISTIC_CONFLICT: assets/%', v_asset_id;
            end if;

            update public.assets
            set
                school_id = v_school_id,
                competence_id = nullif(p_asset ->> 'competence_id', ''),
                description = coalesce(nullif(p_asset ->> 'description', ''), description),
                expense_type = coalesce(nullif(p_asset ->> 'expense_type', ''), expense_type),
                invoice_number = coalesce(p_asset ->> 'invoice_number', invoice_number),
                amount = coalesce((p_asset ->> 'amount')::numeric, amount),
                status = coalesce(nullif(p_asset ->> 'status', ''), status),
                inventory_process = coalesce(p_asset ->> 'inventory_process', inventory_process),
                notes = coalesce(p_asset ->> 'notes', notes),
                payload = coalesce(p_asset -> 'payload', payload),
                inventoried_by_member_id = nullif(p_asset ->> 'inventoried_by_member_id', ''),
                inventoried_at = nullif(p_asset ->> 'inventoried_at', '')::timestamptz
            where id = v_asset_id
              and row_version = p_expected_asset_version
            returning * into v_asset;

            if not found then
                raise exception 'OPTIMISTIC_CONFLICT: assets/%', v_asset_id;
            end if;
        else
            if p_expected_asset_version is not null then
                raise exception 'NOT_FOUND: assets/%', v_asset_id;
            end if;
            insert into public.assets (
                id,
                school_id,
                competence_id,
                description,
                expense_type,
                invoice_number,
                amount,
                status,
                inventory_process,
                notes,
                payload,
                inventoried_by_member_id,
                inventoried_at
            ) values (
                v_asset_id,
                v_school_id,
                nullif(p_asset ->> 'competence_id', ''),
                coalesce(nullif(p_asset ->> 'description', ''), nullif(p_invoice ->> 'description', ''), 'Bem sem descrição'),
                coalesce(nullif(p_asset ->> 'expense_type', ''), 'permanente'),
                coalesce(p_asset ->> 'invoice_number', p_invoice ->> 'invoice_number', ''),
                coalesce((p_asset ->> 'amount')::numeric, v_amount),
                coalesce(nullif(p_asset ->> 'status', ''), 'Não encaminhada'),
                coalesce(p_asset ->> 'inventory_process', ''),
                coalesce(p_asset ->> 'notes', ''),
                coalesce(p_asset -> 'payload', '{}'::jsonb),
                nullif(p_asset ->> 'inventoried_by_member_id', ''),
                nullif(p_asset ->> 'inventoried_at', '')::timestamptz
            )
            returning * into v_asset;
        end if;
    end if;

    select *
    into v_existing_invoice
    from public.registered_invoices
    where id = v_invoice_id
    for update;

    if found then
        if v_existing_invoice.school_id is distinct from v_school_id then
            raise exception 'VALIDATION_ERROR: escola da nota não pode ser alterada';
        end if;
        if p_expected_invoice_version is null or v_existing_invoice.row_version <> p_expected_invoice_version then
            raise exception 'OPTIMISTIC_CONFLICT: registered_invoices/%', v_invoice_id;
        end if;

        v_target_expense_type := coalesce(
            nullif(p_invoice ->> 'expense_type', ''),
            v_existing_invoice.expense_type
        );
        v_previous_asset_id := v_existing_invoice.linked_asset_id;

        if p_asset is null
            and v_previous_asset_id is not null
            and nullif(p_invoice ->> 'linked_asset_id', '') is null
            and v_target_expense_type <> 'permanente' then
            select *
            into v_asset_to_remove
            from public.assets
            where id = v_previous_asset_id
            for update;

            if not found then
                raise exception 'NOT_FOUND: assets/%', v_previous_asset_id;
            end if;
            if p_expected_asset_version is null
                or p_expected_asset_version <= 0
                or v_asset_to_remove.row_version <> p_expected_asset_version then
                raise exception 'OPTIMISTIC_CONFLICT: assets/%', v_previous_asset_id;
            end if;
            if v_asset_to_remove.school_id is distinct from v_school_id then
                raise exception 'VALIDATION_ERROR: bem e nota pertencem a escolas diferentes';
            end if;
            if exists (
                select 1
                from public.registered_invoices other_invoice
                where other_invoice.linked_asset_id = v_previous_asset_id
                  and other_invoice.id <> v_invoice_id
            ) then
                raise exception 'VALIDATION_ERROR: bem ainda está vinculado a outra nota';
            end if;
            v_remove_previous_asset := true;
        end if;

        update public.registered_invoices
        set
            school_id = v_school_id,
            competence_id = nullif(p_invoice ->> 'competence_id', ''),
            program_id = nullif(p_invoice ->> 'program_id', ''),
            verification_id = v_verification_id,
            source_context_key = coalesce(p_invoice ->> 'source_context_key', source_context_key),
            linked_asset_id = case when p_asset is null then nullif(p_invoice ->> 'linked_asset_id', '') else v_asset_id end,
            description = coalesce(nullif(p_invoice ->> 'description', ''), description),
            expense_type = v_target_expense_type,
            invoice_number = coalesce(nullif(p_invoice ->> 'invoice_number', ''), invoice_number),
            amount = v_amount,
            payload = coalesce(p_invoice -> 'payload', payload),
            registered_at = coalesce(nullif(p_invoice ->> 'registered_at', '')::timestamptz, registered_at)
        where id = v_invoice_id
          and row_version = p_expected_invoice_version
        returning * into v_invoice;

        if not found then
            raise exception 'OPTIMISTIC_CONFLICT: registered_invoices/%', v_invoice_id;
        end if;

        if v_remove_previous_asset then
            delete from public.assets
            where id = v_previous_asset_id
              and row_version = p_expected_asset_version;

            if not found then
                raise exception 'OPTIMISTIC_CONFLICT: assets/%', v_previous_asset_id;
            end if;
            v_removed_asset_id := v_previous_asset_id;
        end if;
    else
        if p_expected_invoice_version is not null then
            raise exception 'NOT_FOUND: registered_invoices/%', v_invoice_id;
        end if;
        insert into public.registered_invoices (
            id,
            school_id,
            competence_id,
            program_id,
            verification_id,
            source_context_key,
            linked_asset_id,
            description,
            expense_type,
            invoice_number,
            amount,
            payload,
            registered_at
        ) values (
            v_invoice_id,
            v_school_id,
            nullif(p_invoice ->> 'competence_id', ''),
            nullif(p_invoice ->> 'program_id', ''),
            v_verification_id,
            coalesce(p_invoice ->> 'source_context_key', ''),
            case when p_asset is null then nullif(p_invoice ->> 'linked_asset_id', '') else v_asset_id end,
            coalesce(nullif(p_invoice ->> 'description', ''), 'Despesa sem descrição'),
            coalesce(nullif(p_invoice ->> 'expense_type', ''), 'consumo'),
            coalesce(nullif(p_invoice ->> 'invoice_number', ''), 'SEM-NÚMERO'),
            v_amount,
            coalesce(p_invoice -> 'payload', '{}'::jsonb),
            coalesce(nullif(p_invoice ->> 'registered_at', '')::timestamptz, now())
        )
        returning * into v_invoice;
    end if;

    if p_verification_patch is not null then
        if v_verification_id is null then
            raise exception 'VALIDATION_ERROR: verification id é obrigatório quando há patch de verificação';
        end if;

        update public.verifications
        set
            analysis = coalesce(p_verification_patch -> 'analysis', analysis),
            bonification = coalesce(p_verification_patch -> 'bonification', bonification),
            bonus_result = coalesce(nullif(p_verification_patch ->> 'bonus_result', ''), bonus_result)
        where id = v_verification_id
          and school_id = v_school_id
          and row_version = p_expected_verification_version
        returning * into v_verification;

        if not found then
            raise exception 'OPTIMISTIC_CONFLICT: verifications/%', v_verification_id;
        end if;
    elsif v_verification_id is not null then
        select * into v_verification
        from public.verifications
        where id = v_verification_id;
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
            v_school_id,
            auth.uid(),
            coalesce(p_administrative_log ->> 'user_identifier', ''),
            coalesce(p_administrative_log ->> 'profile_name', public.current_app_role(), ''),
            p_administrative_log ->> 'action',
            coalesce(p_administrative_log -> 'details', '{}'::jsonb),
            coalesce(nullif(p_administrative_log ->> 'event_at', '')::timestamptz, now())
        );
    end if;

    return jsonb_build_object(
        'invoice', to_jsonb(v_invoice),
        'asset', case when v_asset.id is null then null else to_jsonb(v_asset) end,
        'deleted_asset_id', v_removed_asset_id,
        'verification', case when v_verification.id is null then null else to_jsonb(v_verification) end
    );
end
$$;

revoke all on function radar_private.save_invoice_with_effects_impl(jsonb, jsonb, jsonb, integer, integer, integer, jsonb)
    from public, anon;
grant execute on function radar_private.save_invoice_with_effects_impl(jsonb, jsonb, jsonb, integer, integer, integer, jsonb)
    to authenticated, service_role;

create or replace function public.save_invoice_with_effects(
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
    select radar_private.save_invoice_with_effects_impl(
        p_invoice,
        p_asset,
        p_verification_patch,
        p_expected_invoice_version,
        p_expected_asset_version,
        p_expected_verification_version,
        p_administrative_log
    )
$$;

revoke all on function public.save_invoice_with_effects(jsonb, jsonb, jsonb, integer, integer, integer, jsonb)
    from public, anon;
grant execute on function public.save_invoice_with_effects(jsonb, jsonb, jsonb, integer, integer, integer, jsonb)
    to authenticated, service_role;

commit;
