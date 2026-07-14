-- RADAR PDDE — operações atômicas para notas fiscais e seus efeitos derivados.
-- As funções usam SECURITY INVOKER: RLS e privilégios do usuário autenticado continuam válidos.

create or replace function public.save_invoice_with_effects(
    p_invoice jsonb,
    p_asset jsonb default null,
    p_verification_patch jsonb default null,
    p_expected_invoice_version integer default null,
    p_expected_asset_version integer default null,
    p_expected_verification_version integer default null
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_invoice public.registered_invoices%rowtype;
    v_existing_invoice public.registered_invoices%rowtype;
    v_asset public.assets%rowtype;
    v_existing_asset public.assets%rowtype;
    v_verification public.verifications%rowtype;
    v_invoice_id text := nullif(p_invoice ->> 'id', '');
    v_school_id text := nullif(p_invoice ->> 'school_id', '');
    v_asset_id text := nullif(p_asset ->> 'id', '');
    v_verification_id text := coalesce(
        nullif(p_invoice ->> 'verification_id', ''),
        nullif(p_verification_patch ->> 'id', '')
    );
    v_amount numeric(14,2);
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
        if p_expected_invoice_version is null or v_existing_invoice.row_version <> p_expected_invoice_version then
            raise exception 'OPTIMISTIC_CONFLICT: registered_invoices/%', v_invoice_id;
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
            expense_type = coalesce(nullif(p_invoice ->> 'expense_type', ''), expense_type),
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
    else
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

    return jsonb_build_object(
        'invoice', to_jsonb(v_invoice),
        'asset', case when v_asset.id is null then null else to_jsonb(v_asset) end,
        'verification', case when v_verification.id is null then null else to_jsonb(v_verification) end
    );
end
$$;

create or replace function public.delete_invoice_with_effects(
    p_invoice_id text,
    p_expected_invoice_version integer,
    p_delete_linked_asset boolean default true,
    p_expected_asset_version integer default null,
    p_verification_patch jsonb default null,
    p_expected_verification_version integer default null
)
returns jsonb
language plpgsql
security invoker
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

    if public.current_app_role() <> 'technical_admin' then
        raise exception 'AUTHORIZATION_DENIED: exclusão física exige Administrador técnico';
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
            bonus_result = coalesce(nullif(p_verification_patch ->> 'bonus_result', ''), bonus_result)
        where id = v_invoice.verification_id
          and school_id = v_invoice.school_id
          and row_version = p_expected_verification_version
        returning * into v_verification;

        if not found then
            raise exception 'OPTIMISTIC_CONFLICT: verifications/%', v_invoice.verification_id;
        end if;
    end if;

    return jsonb_build_object(
        'deleted_invoice_id', p_invoice_id,
        'deleted_asset_id', case when v_asset.id is null or not p_delete_linked_asset then null else v_asset.id end,
        'verification', case when v_verification.id is null then null else to_jsonb(v_verification) end
    );
end
$$;

revoke all on function public.save_invoice_with_effects(jsonb, jsonb, jsonb, integer, integer, integer) from public;
revoke all on function public.delete_invoice_with_effects(text, integer, boolean, integer, jsonb, integer) from public;

grant execute on function public.save_invoice_with_effects(jsonb, jsonb, jsonb, integer, integer, integer) to authenticated;
grant execute on function public.delete_invoice_with_effects(text, integer, boolean, integer, jsonb, integer) to authenticated;
