-- ADR-055: ownership at the existing expense write authorities.
-- Corrective migration; the previous version is preserved because its shared
-- application history could not be verified. No new RPC or global patch policy.
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

    -- O contexto de verificação é estrutural para o vínculo da despesa, mas seu
    -- conteúdo de bonificação não é pré-requisito funcional. Se a primeira
    -- despesa nascer antes de qualquer ação de bonificação, materializa-se a
    -- linha mínima na mesma transação. A atualização canônica mais abaixo
    -- aplica o patch técnico sem inventar Sim/Não/N/A nem bonus_result.
    if v_verification_id is not null and p_verification_patch is not null then
        select *
          into v_verification
          from public.verifications
         where id = v_verification_id
         for update;

        if not found then
            -- Creating the structural context is a new expense boundary.
            -- Explicit school scope alone does not confer expense capability.
            if coalesce(public.current_app_role(), '') not in ('controller', 'federal_assistant', 'technical_admin') then
                raise exception 'AUTHORIZATION_DENIED: perfil sem capacidade de materializar contexto por despesa';
            end if;
            if p_expected_verification_version is not null then
                raise exception 'NOT_FOUND: verifications/%', v_verification_id;
            end if;

            if coalesce(jsonb_typeof(p_verification_patch), '') <> 'object'
                or v_verification_id is distinct from concat_ws('::', v_school_id,
                    nullif(p_invoice ->> 'competence_id', ''), nullif(p_invoice ->> 'program_id', ''))
                or nullif(p_verification_patch ->> 'id', '') is distinct from v_verification_id
                or nullif(p_verification_patch ->> 'school_id', '') is distinct from v_school_id
                or nullif(p_verification_patch ->> 'competence_id', '')
                    is distinct from nullif(p_invoice ->> 'competence_id', '')
                or nullif(p_verification_patch ->> 'program_id', '')
                    is distinct from nullif(p_invoice ->> 'program_id', '') then
                raise exception 'VALIDATION_ERROR: contexto mensal da primeira despesa é inválido';
            end if;

            if not public.radar_jsonb_matches(
                'bonification',
                coalesce(p_verification_patch -> 'bonification', '{}'::jsonb)
            ) or not public.radar_jsonb_matches(
                'analysis',
                coalesce(p_verification_patch -> 'analysis', '{}'::jsonb)
            ) then
                raise exception 'VALIDATION_ERROR: contexto mensal da primeira despesa é incompatível';
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
                v_verification_id,
                v_school_id,
                nullif(p_invoice ->> 'competence_id', ''),
                nullif(p_invoice ->> 'program_id', ''),
                '{"extCC":"","extINV":"","notaFiscal":"","consAssessoria":"","declBBAgil":"","encampInventario":""}'::jsonb,
                '{"extCC":"Não analisado","extINV":"Não analisado","notaFiscal":"Não analisado","consAssessoria":"Não analisado","declBBAgil":"Não analisado","encampInventario":"Não analisado"}'::jsonb,
                null,
                '{}'::jsonb
            )
            returning * into v_verification;

            p_expected_verification_version := v_verification.row_version;
        end if;
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
            if v_existing_asset.school_id is distinct from v_school_id then
                raise exception 'VALIDATION_ERROR: bem existente pertence a outra escola';
            end if;
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
        if p_asset is not null
            and v_existing_invoice.linked_asset_id is not null
            and v_existing_invoice.linked_asset_id is distinct from v_asset_id then
            raise exception 'VALIDATION_ERROR: o bem vinculado à nota não pode ser substituído implicitamente';
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
            if exists (
                select 1
                from public.assets
                where id = v_previous_asset_id
            ) then
                raise exception 'INTEGRITY_CONFLICT: bem derivado % não foi removido após a desvinculação', v_previous_asset_id;
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
            -- Merge only projections owned by the expense; preserve manual marks
            -- and bonus_result even when an old/incomplete client sends them.
            analysis = analysis || coalesce((
                select jsonb_object_agg(key, value)
                from jsonb_each(coalesce(p_verification_patch -> 'analysis', '{}'::jsonb))
                where key in ('notaFiscal', 'consAssessoria', 'encampInventario')
            ), '{}'::jsonb),
            bonification = bonification || coalesce((
                select jsonb_object_agg(key, value)
                from jsonb_each(coalesce(p_verification_patch -> 'bonification', '{}'::jsonb))
                where key in ('consAssessoria', 'consEnviada', 'encampInventario')
            ), '{}'::jsonb)
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
            -- Merge only projections owned by the expense; preserve manual marks
            -- and bonus_result even when an old/incomplete client sends them.
            analysis = analysis || coalesce((
                select jsonb_object_agg(key, value)
                from jsonb_each(coalesce(p_verification_patch -> 'analysis', '{}'::jsonb))
                where key in ('notaFiscal', 'consAssessoria', 'encampInventario')
            ), '{}'::jsonb),
            bonification = bonification || coalesce((
                select jsonb_object_agg(key, value)
                from jsonb_each(coalesce(p_verification_patch -> 'bonification', '{}'::jsonb))
                where key in ('consAssessoria', 'consEnviada', 'encampInventario')
            ), '{}'::jsonb)
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

-- Endurece a RPC genérica de reanálise para que a fronteira PostgreSQL aplique
-- as mesmas invariantes já exigidas pelo domínio da aplicação.
create or replace function public.reanalyze_pendency_with_verification(
    p_pendency jsonb,
    p_attempt jsonb,
    p_verification_patch jsonb,
    p_expected_pendency_version integer,
    p_expected_verification_version integer,
    p_administrative_log jsonb default null::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $function$
declare
    v_pendency public.pendencies%rowtype;
    v_existing_pendency public.pendencies%rowtype;
    v_verification public.verifications%rowtype;
    v_existing_verification public.verifications%rowtype;
    v_attempt public.pendency_attempts%rowtype;
    v_existing_attempt public.pendency_attempts%rowtype;
    v_pendency_id text := nullif(p_pendency ->> 'id', '');
    v_verification_id text := nullif(p_verification_patch ->> 'id', '');
    v_attempt_id text := nullif(p_attempt ->> 'id', '');
    v_result text := lower(btrim(coalesce(p_attempt ->> 'result', '')));
    v_role text := public.current_app_role();
    v_attempt_payload jsonb;
    v_key text;
begin
    if v_role is null or v_role not in ('technical_admin', 'federal_assistant', 'controller') then
        raise exception 'AUTHORIZATION_DENIED: perfil % não pode reanalisar pendências', coalesce(v_role, 'sem_perfil');
    end if;
    if v_pendency_id is null or v_verification_id is null then raise exception 'VALIDATION_ERROR: pendência e verificação são obrigatórias'; end if;
    if p_attempt is null or coalesce(jsonb_typeof(p_attempt), '') <> 'object' or v_attempt_id is null then
        raise exception 'VALIDATION_ERROR: reanálise exige a tentativa aguardando mais recente';
    end if;
    if not public.radar_jsonb_matches('compatibilityPayload', coalesce(p_pendency -> 'payload', '{}'::jsonb))
        or not public.radar_jsonb_matches('analysis', coalesce(p_verification_patch -> 'analysis', '{}'::jsonb))
        or not public.radar_jsonb_matches('bonification', coalesce(p_verification_patch -> 'bonification', '{}'::jsonb))
        or not public.radar_jsonb_matches('compatibilityPayload', coalesce(p_verification_patch -> 'payload', '{}'::jsonb))
        or not public.radar_jsonb_matches('attempt', p_attempt)
        or not public.radar_jsonb_matches('errors', coalesce(p_attempt -> 'errors', '[]'::jsonb))
        or not public.radar_jsonb_matches('compatibilityPayload', coalesce(p_attempt -> 'payload', '{}'::jsonb)) then
        raise exception 'VALIDATION_ERROR: payload de reanálise incompatível';
    end if;
    select * into v_existing_pendency from public.pendencies where id = v_pendency_id for update;
    if not found then raise exception 'NOT_FOUND: pendencies/%', v_pendency_id; end if;
    if not public.can_write_school(v_existing_pendency.school_id) then raise exception 'AUTHORIZATION_DENIED: usuário sem escrita para a escola %', v_existing_pendency.school_id; end if;
    if v_existing_pendency.row_version <> p_expected_pendency_version then raise exception 'OPTIMISTIC_CONFLICT: pendencies/%', v_pendency_id; end if;
    if v_existing_pendency.status <> 'Aguardando reanálise' then raise exception 'VALIDATION_ERROR: reanálise exige Pendência Aguardando reanálise'; end if;
    select * into v_existing_attempt from public.pendency_attempts where pendency_id = v_existing_pendency.id order by attempt_number desc limit 1 for update;
    if not found or v_existing_attempt.result is not null or v_existing_attempt.analyzed_at is not null then
        raise exception 'VALIDATION_ERROR: reanálise exige a tentativa aguardando mais recente';
    end if;
    if v_existing_attempt.id is distinct from v_attempt_id
        or v_existing_attempt.pendency_id is distinct from nullif(p_attempt ->> 'pendency_id', '')
        or v_existing_attempt.attempt_number is distinct from nullif(p_attempt ->> 'attempt_number', '')::integer then
        raise exception 'VALIDATION_ERROR: tentativa informada não é a tentativa aguardando mais recente';
    end if;
    if nullif(p_attempt ->> 'analyzed_at', '') is null then raise exception 'VALIDATION_ERROR: reanálise exige instante de análise'; end if;
    if v_result not in ('correto', 'incorreto', 'arquivo_indisponivel') then raise exception 'VALIDATION_ERROR: resultado de reanálise inválido'; end if;
    -- Callers especializados já determinam a transição para Resolvida/Aberta e podem
    -- omitir resolved_at. A fronteira genérica valida o estado e materializa o instante
    -- de resolução quando necessário, sem exigir que o cliente fabrique esse timestamp.
    if (v_result = 'correto' and (
            nullif(p_pendency ->> 'status', '') <> 'Resolvida'
            or nullif(p_pendency ->> 'canceled_at', '') is not null
        ))
       or (v_result in ('incorreto', 'arquivo_indisponivel') and (
            nullif(p_pendency ->> 'status', '') <> 'Aberta'
            or nullif(p_pendency ->> 'resolved_at', '') is not null
            or nullif(p_pendency ->> 'canceled_at', '') is not null
        )) then
        raise exception 'VALIDATION_ERROR: resultado e estado final da Pendência são incompatíveis';
    end if;
    select * into v_existing_verification from public.verifications
     where id = v_verification_id and school_id = v_existing_pendency.school_id
       and competence_id = v_existing_pendency.competence_origin and program_id is not distinct from v_existing_pendency.program_id for update;
    if not found then raise exception 'VALIDATION_ERROR: verificação não pertence ao contexto da Pendência'; end if;
    if v_existing_verification.row_version <> p_expected_verification_version then raise exception 'OPTIMISTIC_CONFLICT: verifications/%', v_verification_id; end if;
    update public.pendencies set
        status = p_pendency ->> 'status',
        responsible_area = coalesce(p_pendency ->> 'responsible_area', responsible_area),
        next_actor = coalesce(p_pendency ->> 'next_actor', next_actor),
        reason = coalesce(p_pendency ->> 'reason', reason),
        notes = coalesce(p_pendency ->> 'notes', notes),
        resolved_at = case
            when v_result = 'correto' then coalesce(
                nullif(p_pendency ->> 'resolved_at', '')::timestamptz,
                v_existing_pendency.resolved_at,
                now()
            )
            else null
        end,
        canceled_at = null,
        payload = coalesce(p_pendency -> 'payload', payload)
     where id = v_pendency_id and row_version = p_expected_pendency_version returning * into v_pendency;
    if not found then raise exception 'OPTIMISTIC_CONFLICT: pendencies/%', v_pendency_id; end if;
    v_attempt_payload := coalesce(v_existing_attempt.payload, '{}'::jsonb);
    foreach v_key in array array['status','dataAnalise','analisadoPor','analisadoPorId','authenticatedRoleAnalise','actingProfileAnalise','resultado','errosEncontrados','observacaoAnalise'] loop
        if coalesce(p_attempt -> 'payload', '{}'::jsonb) ? v_key then v_attempt_payload := jsonb_set(v_attempt_payload, array[v_key], p_attempt -> 'payload' -> v_key, true); end if;
    end loop;
    update public.pendency_attempts set
        analyzed_at = (p_attempt ->> 'analyzed_at')::timestamptz,
        result = v_result,
        errors = coalesce(p_attempt -> 'errors', errors),
        payload = v_attempt_payload
     where id = v_existing_attempt.id returning * into v_attempt;
    update public.verifications set
        -- Non-invoice documents retain their existing verification contract.
        -- Linked expense reanalysis owns technical fields, never consolidation.
        analysis = case when v_existing_pendency.registered_invoice_id is null
            then coalesce(p_verification_patch -> 'analysis', analysis)
            else analysis || coalesce((select jsonb_object_agg(key, value)
                from jsonb_each(coalesce(p_verification_patch -> 'analysis', '{}'::jsonb))
                where key in ('notaFiscal', 'consAssessoria', 'encampInventario')), '{}'::jsonb) end,
        bonification = case when v_existing_pendency.registered_invoice_id is null
            then coalesce(p_verification_patch -> 'bonification', bonification)
            else bonification || coalesce((select jsonb_object_agg(key, value)
                from jsonb_each(coalesce(p_verification_patch -> 'bonification', '{}'::jsonb))
                where key in ('consAssessoria', 'consEnviada', 'encampInventario')), '{}'::jsonb) end,
        bonus_result = case when v_existing_pendency.registered_invoice_id is null and p_verification_patch ? 'bonus_result'
            then nullif(p_verification_patch ->> 'bonus_result', '') else bonus_result end,
        payload = coalesce(p_verification_patch -> 'payload', payload)
     where id = v_existing_verification.id and row_version = p_expected_verification_version returning * into v_verification;
    if not found then raise exception 'OPTIMISTIC_CONFLICT: verifications/%', v_verification_id; end if;
    if p_administrative_log is null or nullif(p_administrative_log ->> 'id', '') is null or nullif(p_administrative_log ->> 'action', '') is null
       or not public.radar_jsonb_matches('auditDetails', coalesce(p_administrative_log -> 'details', '{}'::jsonb)) then
        raise exception 'VALIDATION_ERROR: log administrativo obrigatório e inválido';
    end if;
    if nullif(p_administrative_log ->> 'school_id', '') is not null and (p_administrative_log ->> 'school_id') is distinct from v_existing_pendency.school_id then
        raise exception 'VALIDATION_ERROR: log administrativo pertence a outra escola';
    end if;
    insert into public.administrative_logs (id, school_id, actor_user_id, user_identifier, profile_name, action, details, event_at)
    values (
        p_administrative_log ->> 'id',
        v_existing_pendency.school_id,
        auth.uid(),
        coalesce(p_administrative_log ->> 'user_identifier', ''),
        coalesce(p_administrative_log ->> 'profile_name', public.current_app_role(), ''),
        p_administrative_log ->> 'action',
        coalesce(p_administrative_log -> 'details', '{}'::jsonb),
        coalesce(nullif(p_administrative_log ->> 'event_at', '')::timestamptz, now())
    );
    return jsonb_build_object('pendency', to_jsonb(v_pendency), 'attempt', to_jsonb(v_attempt), 'verification', to_jsonb(v_verification));
end
$function$;
revoke all on function public.reanalyze_pendency_with_verification(jsonb,jsonb,jsonb,integer,integer,jsonb) from public, anon;
grant execute on function public.reanalyze_pendency_with_verification(jsonb,jsonb,jsonb,integer,integer,jsonb) to authenticated;

commit;
