-- RADAR PDDE — comandos operacionais atômicos.
-- Cada função representa um agregado de negócio e grava o histórico na mesma transação.

begin;

alter table public.pendency_contacts
    add column if not exists operation_id text;

create unique index if not exists pendency_contacts_operation_id_uidx
    on public.pendency_contacts (operation_id)
    where operation_id is not null;

create or replace function public.save_pendency_contact_with_log(
    p_contact jsonb,
    p_operation_id text,
    p_administrative_log jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_role text := public.current_app_role();
    v_contact public.pendency_contacts%rowtype;
    v_existing public.pendency_contacts%rowtype;
    v_log public.administrative_logs%rowtype;
    v_id text := nullif(p_contact ->> 'id', '');
    v_school_id text := nullif(p_contact ->> 'school_id', '');
    v_operation_id text := nullif(btrim(p_operation_id), '');
begin
    if v_role not in ('controller', 'federal_assistant', 'technical_admin') then
        raise exception 'AUTHORIZATION_DENIED: perfil sem permissão para registrar contatos';
    end if;
    if jsonb_typeof(p_contact) <> 'object'
        or v_id is null
        or v_school_id is null
        or nullif(p_contact ->> 'contact_type', '') is null
        or nullif(p_contact ->> 'contact_date', '') is null
        or nullif(p_contact ->> 'description', '') is null
        or v_operation_id is null then
        raise exception 'VALIDATION_ERROR: contato ou identificador de operação inválido';
    end if;
    if not public.can_write_school(v_school_id) then
        raise exception 'AUTHORIZATION_DENIED: usuário sem escrita para a escola %', v_school_id;
    end if;
    if not public.radar_jsonb_matches(
        'compatibilityPayload',
        coalesce(p_contact -> 'payload', '{}'::jsonb)
    ) then
        raise exception 'VALIDATION_ERROR: payload do contato incompatível';
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
    if nullif(p_administrative_log ->> 'school_id', '') is not null
        and (p_administrative_log ->> 'school_id') is distinct from v_school_id then
        raise exception 'VALIDATION_ERROR: log administrativo pertence a outra escola';
    end if;

    select * into v_existing
    from public.pendency_contacts
    where operation_id = v_operation_id;

    if found then
        if v_existing.id is distinct from v_id
            or v_existing.school_id is distinct from v_school_id
            or v_existing.pendency_id is distinct from nullif(p_contact ->> 'pendency_id', '')
            or v_existing.contact_type is distinct from (p_contact ->> 'contact_type')
            or v_existing.contact_date is distinct from (p_contact ->> 'contact_date')::date
            or v_existing.description is distinct from (p_contact ->> 'description') then
            raise exception 'IDEMPOTENCY_CONFLICT: contato/%', v_operation_id;
        end if;
        select * into v_log
        from public.administrative_logs
        where id = p_administrative_log ->> 'id';
        if not found then
            raise exception 'IDEMPOTENCY_INCONSISTENT: log ausente para contato/%', v_operation_id;
        end if;
        return jsonb_build_object(
            'contact', to_jsonb(v_existing),
            'administrative_log', to_jsonb(v_log),
            'idempotent', true
        );
    end if;

    insert into public.pendency_contacts (
        id,
        school_id,
        pendency_id,
        contact_type,
        contact_date,
        description,
        official_charge,
        payload,
        created_by,
        operation_id
    ) values (
        v_id,
        v_school_id,
        nullif(p_contact ->> 'pendency_id', ''),
        p_contact ->> 'contact_type',
        (p_contact ->> 'contact_date')::date,
        p_contact ->> 'description',
        coalesce((p_contact ->> 'official_charge')::boolean, false),
        coalesce(p_contact -> 'payload', '{}'::jsonb),
        auth.uid(),
        v_operation_id
    )
    returning * into v_contact;

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
    )
    returning * into v_log;

    return jsonb_build_object(
        'contact', to_jsonb(v_contact),
        'administrative_log', to_jsonb(v_log),
        'idempotent', false
    );
end
$$;

revoke all on function public.save_pendency_contact_with_log(jsonb, text, jsonb) from public;
grant execute on function public.save_pendency_contact_with_log(jsonb, text, jsonb) to authenticated;


create unique index if not exists pendencies_active_document_uidx
    on public.pendencies (school_id, competence_origin, program_id, document_key)
    where status in ('Aberta', 'Aguardando reanálise')
      and program_id is not null
      and btrim(document_key) <> '';

create or replace function public.save_pendency_command(
    p_operation text,
    p_pendency jsonb,
    p_expected_pendency_version integer,
    p_attempt jsonb,
    p_verification jsonb,
    p_expected_verification_version integer,
    p_administrative_log jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_role text := public.current_app_role();
    v_operation text := lower(btrim(coalesce(p_operation, '')));
    v_id text := nullif(p_pendency ->> 'id', '');
    v_school_id text := nullif(p_pendency ->> 'school_id', '');
    v_existing public.pendencies%rowtype;
    v_saved public.pendencies%rowtype;
    v_attempt public.pendency_attempts%rowtype;
    v_verification public.verifications%rowtype;
    v_log public.administrative_logs%rowtype;
begin
    if v_operation not in ('open', 'register_attempt', 'update_status') then
        raise exception 'VALIDATION_ERROR: operação de pendência inválida';
    end if;
    if v_role not in ('controller', 'federal_assistant', 'technical_admin') then
        raise exception 'AUTHORIZATION_DENIED: perfil sem permissão para alterar pendências';
    end if;
    if jsonb_typeof(p_pendency) <> 'object'
        or v_id is null
        or v_school_id is null
        or nullif(p_pendency ->> 'competence_origin', '') is null
        or nullif(p_pendency ->> 'document_key', '') is null
        or nullif(p_pendency ->> 'status', '') is null then
        raise exception 'VALIDATION_ERROR: pendência canônica inválida';
    end if;
    if not public.can_write_school(v_school_id) then
        raise exception 'AUTHORIZATION_DENIED: usuário sem escrita para a escola %', v_school_id;
    end if;
    if not public.radar_jsonb_matches(
        'compatibilityPayload', coalesce(p_pendency -> 'payload', '{}'::jsonb)
    ) then
        raise exception 'VALIDATION_ERROR: payload da pendência incompatível';
    end if;
    if p_administrative_log is null
        or jsonb_typeof(p_administrative_log) <> 'object'
        or nullif(p_administrative_log ->> 'id', '') is null
        or nullif(p_administrative_log ->> 'action', '') is null
        or not public.radar_jsonb_matches(
            'auditDetails', coalesce(p_administrative_log -> 'details', '{}'::jsonb)
        ) then
        raise exception 'VALIDATION_ERROR: log administrativo obrigatório e inválido';
    end if;
    if nullif(p_administrative_log ->> 'school_id', '') is not null
        and (p_administrative_log ->> 'school_id') is distinct from v_school_id then
        raise exception 'VALIDATION_ERROR: log administrativo pertence a outra escola';
    end if;

    if v_operation = 'open' then
        if p_expected_pendency_version is not null then
            raise exception 'VALIDATION_ERROR: abertura não aceita versão esperada';
        end if;
        insert into public.pendencies (
            id, school_id, competence_origin, program_id, document_key,
            status, responsible_area, next_actor, reason, notes,
            opened_at, resolved_at, canceled_at, payload
        ) values (
            v_id,
            v_school_id,
            p_pendency ->> 'competence_origin',
            nullif(p_pendency ->> 'program_id', ''),
            p_pendency ->> 'document_key',
            p_pendency ->> 'status',
            coalesce(p_pendency ->> 'responsible_area', ''),
            coalesce(p_pendency ->> 'next_actor', ''),
            coalesce(p_pendency ->> 'reason', ''),
            coalesce(p_pendency ->> 'notes', ''),
            coalesce(nullif(p_pendency ->> 'opened_at', '')::timestamptz, now()),
            nullif(p_pendency ->> 'resolved_at', '')::timestamptz,
            nullif(p_pendency ->> 'canceled_at', '')::timestamptz,
            coalesce(p_pendency -> 'payload', '{}'::jsonb)
        )
        returning * into v_saved;
    else
        select * into v_existing
        from public.pendencies
        where id = v_id
        for update;
        if not found then raise exception 'NOT_FOUND: pendencies/%', v_id; end if;
        if v_existing.school_id is distinct from v_school_id
            or v_existing.competence_origin is distinct from (p_pendency ->> 'competence_origin')
            or v_existing.program_id is distinct from nullif(p_pendency ->> 'program_id', '')
            or v_existing.document_key is distinct from (p_pendency ->> 'document_key') then
            raise exception 'VALIDATION_ERROR: contexto da pendência não pode ser alterado';
        end if;
        if p_expected_pendency_version is null
            or v_existing.row_version <> p_expected_pendency_version then
            raise exception 'OPTIMISTIC_CONFLICT: pendencies/%', v_id;
        end if;
        update public.pendencies set
            status = p_pendency ->> 'status',
            responsible_area = coalesce(p_pendency ->> 'responsible_area', ''),
            next_actor = coalesce(p_pendency ->> 'next_actor', ''),
            reason = coalesce(p_pendency ->> 'reason', ''),
            notes = coalesce(p_pendency ->> 'notes', ''),
            resolved_at = nullif(p_pendency ->> 'resolved_at', '')::timestamptz,
            canceled_at = nullif(p_pendency ->> 'canceled_at', '')::timestamptz,
            payload = coalesce(p_pendency -> 'payload', '{}'::jsonb)
        where id = v_id and row_version = p_expected_pendency_version
        returning * into v_saved;
        if not found then raise exception 'OPTIMISTIC_CONFLICT: pendencies/%', v_id; end if;
    end if;

    if v_operation = 'register_attempt' then
        if p_attempt is null
            or p_verification is null
            or p_expected_verification_version is null then
            raise exception 'VALIDATION_ERROR: novo envio exige tentativa e verificação versionada';
        end if;
        if not public.radar_jsonb_matches('attempt', p_attempt)
            or not public.radar_jsonb_matches('errors', coalesce(p_attempt -> 'errors', '[]'::jsonb))
            or not public.radar_jsonb_matches('compatibilityPayload', coalesce(p_attempt -> 'payload', '{}'::jsonb)) then
            raise exception 'VALIDATION_ERROR: tentativa incompatível';
        end if;
        if not public.radar_jsonb_matches('analysis', coalesce(p_verification -> 'analysis', '{}'::jsonb))
            or not public.radar_jsonb_matches('bonification', coalesce(p_verification -> 'bonification', '{}'::jsonb))
            or not public.radar_jsonb_matches('compatibilityPayload', coalesce(p_verification -> 'payload', '{}'::jsonb)) then
            raise exception 'VALIDATION_ERROR: verificação do novo envio incompatível';
        end if;
        insert into public.pendency_attempts (
            id, pendency_id, attempt_number, submitted_at, analyzed_at,
            result, observation, drive_url, errors, payload, created_by
        ) values (
            p_attempt ->> 'id',
            v_id,
            (p_attempt ->> 'attempt_number')::integer,
            coalesce(nullif(p_attempt ->> 'submitted_at', '')::timestamptz, now()),
            nullif(p_attempt ->> 'analyzed_at', '')::timestamptz,
            nullif(p_attempt ->> 'result', ''),
            coalesce(p_attempt ->> 'observation', ''),
            coalesce(p_attempt ->> 'drive_url', ''),
            coalesce(p_attempt -> 'errors', '[]'::jsonb),
            coalesce(p_attempt -> 'payload', '{}'::jsonb),
            auth.uid()
        )
        returning * into v_attempt;

        update public.verifications set
            analysis = coalesce(p_verification -> 'analysis', analysis),
            bonification = coalesce(p_verification -> 'bonification', bonification),
            bonus_result = case
                when p_verification ? 'bonus_result'
                    then nullif(p_verification ->> 'bonus_result', '')
                else bonus_result
            end,
            payload = coalesce(p_verification -> 'payload', payload)
        where id = p_verification ->> 'id'
          and school_id = v_school_id
          and row_version = p_expected_verification_version
        returning * into v_verification;
        if not found then
            raise exception 'OPTIMISTIC_CONFLICT: verifications/%', p_verification ->> 'id';
        end if;
    end if;

    insert into public.administrative_logs (
        id, school_id, actor_user_id, user_identifier,
        profile_name, action, details, event_at
    ) values (
        p_administrative_log ->> 'id',
        v_school_id,
        auth.uid(),
        coalesce(p_administrative_log ->> 'user_identifier', ''),
        coalesce(nullif(p_administrative_log ->> 'profile_name', ''), v_role),
        p_administrative_log ->> 'action',
        coalesce(p_administrative_log -> 'details', '{}'::jsonb),
        coalesce(nullif(p_administrative_log ->> 'event_at', '')::timestamptz, now())
    )
    returning * into v_log;

    return jsonb_build_object(
        'pendency', to_jsonb(v_saved),
        'attempt', case when v_attempt.id is null then null else to_jsonb(v_attempt) end,
        'verification', case when v_verification.id is null then null else to_jsonb(v_verification) end,
        'administrative_log', to_jsonb(v_log)
    );
end
$$;

revoke all on function public.save_pendency_command(text, jsonb, integer, jsonb, jsonb, integer, jsonb) from public;
grant execute on function public.save_pendency_command(text, jsonb, integer, jsonb, jsonb, integer, jsonb) to authenticated;


drop policy if exists assets_insert on public.assets;
create policy assets_insert
on public.assets
for insert
to authenticated
with check (
    (
        public.current_app_role() in ('technical_admin', 'federal_assistant', 'controller')
        and public.can_write_school(school_id)
    )
    or (
        public.current_app_role() = 'inventory'
        and exists (
            select 1
            from public.schools s
            join public.user_profiles up
              on up.user_id = auth.uid()
             and up.profile_id = 'inventory'
             and up.active = true
            join public.profiles p
              on p.id = up.profile_id
             and p.active = true
            where s.id = assets.school_id
              and up.cre_scope is not null
              and btrim(up.cre_scope) <> ''
              and s.cre = up.cre_scope
        )
    )
);

drop policy if exists assets_update on public.assets;
create policy assets_update
on public.assets
for update
to authenticated
using (
    (
        public.current_app_role() in ('technical_admin', 'federal_assistant', 'controller')
        and public.can_write_school(school_id)
    )
    or (
        public.current_app_role() = 'inventory'
        and exists (
            select 1
            from public.schools s
            join public.user_profiles up
              on up.user_id = auth.uid()
             and up.profile_id = 'inventory'
             and up.active = true
            join public.profiles p
              on p.id = up.profile_id
             and p.active = true
            where s.id = assets.school_id
              and up.cre_scope is not null
              and btrim(up.cre_scope) <> ''
              and s.cre = up.cre_scope
        )
    )
)
with check (
    (
        public.current_app_role() in ('technical_admin', 'federal_assistant', 'controller')
        and public.can_write_school(school_id)
    )
    or (
        public.current_app_role() = 'inventory'
        and exists (
            select 1
            from public.schools s
            join public.user_profiles up
              on up.user_id = auth.uid()
             and up.profile_id = 'inventory'
             and up.active = true
            join public.profiles p
              on p.id = up.profile_id
             and p.active = true
            where s.id = assets.school_id
              and up.cre_scope is not null
              and btrim(up.cre_scope) <> ''
              and s.cre = up.cre_scope
        )
    )
);

create or replace function public.save_asset_with_log(
    p_asset jsonb,
    p_expected_version integer,
    p_administrative_log jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_role text := public.current_app_role();
    v_id text := nullif(p_asset ->> 'id', '');
    v_school_id text := nullif(p_asset ->> 'school_id', '');
    v_existing public.assets%rowtype;
    v_asset public.assets%rowtype;
    v_log public.administrative_logs%rowtype;
    v_inventory_scope boolean := false;
begin
    if v_role not in ('controller', 'federal_assistant', 'technical_admin', 'inventory') then
        raise exception 'AUTHORIZATION_DENIED: perfil sem permissão patrimonial';
    end if;
    if jsonb_typeof(p_asset) <> 'object'
        or v_id is null
        or v_school_id is null
        or nullif(p_asset ->> 'description', '') is null
        or nullif(p_asset ->> 'expense_type', '') is null
        or nullif(p_asset ->> 'status', '') is null then
        raise exception 'VALIDATION_ERROR: bem canônico inválido';
    end if;
    if not public.radar_jsonb_matches(
        'compatibilityPayload', coalesce(p_asset -> 'payload', '{}'::jsonb)
    ) then
        raise exception 'VALIDATION_ERROR: payload patrimonial incompatível';
    end if;
    if p_administrative_log is null
        or jsonb_typeof(p_administrative_log) <> 'object'
        or nullif(p_administrative_log ->> 'id', '') is null
        or nullif(p_administrative_log ->> 'action', '') is null
        or not public.radar_jsonb_matches(
            'auditDetails', coalesce(p_administrative_log -> 'details', '{}'::jsonb)
        ) then
        raise exception 'VALIDATION_ERROR: log administrativo obrigatório e inválido';
    end if;
    if nullif(p_administrative_log ->> 'school_id', '') is not null
        and (p_administrative_log ->> 'school_id') is distinct from v_school_id then
        raise exception 'VALIDATION_ERROR: log administrativo pertence a outra escola';
    end if;

    if v_role = 'inventory' then
        select exists (
            select 1
            from public.schools s
            join public.user_profiles up
              on up.user_id = auth.uid()
             and up.profile_id = 'inventory'
             and up.active = true
            join public.profiles p
              on p.id = up.profile_id
             and p.active = true
            where s.id = v_school_id
              and up.cre_scope is not null
              and btrim(up.cre_scope) <> ''
              and s.cre = up.cre_scope
        ) into v_inventory_scope;
        if not v_inventory_scope then
            raise exception 'AUTHORIZATION_DENIED: Inventário sem escopo para a escola %', v_school_id;
        end if;
    elsif not public.can_write_school(v_school_id) then
        raise exception 'AUTHORIZATION_DENIED: usuário sem escrita para a escola %', v_school_id;
    end if;

    select * into v_existing from public.assets where id = v_id for update;
    if found then
        if v_existing.school_id is distinct from v_school_id then
            raise exception 'VALIDATION_ERROR: escola do bem não pode ser alterada';
        end if;
        if p_expected_version is null or v_existing.row_version <> p_expected_version then
            raise exception 'OPTIMISTIC_CONFLICT: assets/%', v_id;
        end if;
        update public.assets set
            competence_id = nullif(p_asset ->> 'competence_id', ''),
            description = p_asset ->> 'description',
            expense_type = p_asset ->> 'expense_type',
            invoice_number = coalesce(p_asset ->> 'invoice_number', ''),
            amount = coalesce((p_asset ->> 'amount')::numeric, 0),
            status = p_asset ->> 'status',
            inventory_process = coalesce(p_asset ->> 'inventory_process', ''),
            notes = coalesce(p_asset ->> 'notes', ''),
            inventoried_by_member_id = nullif(p_asset ->> 'inventoried_by_member_id', ''),
            inventoried_at = nullif(p_asset ->> 'inventoried_at', '')::timestamptz,
            payload = coalesce(p_asset -> 'payload', '{}'::jsonb)
        where id = v_id and row_version = p_expected_version
        returning * into v_asset;
        if not found then raise exception 'OPTIMISTIC_CONFLICT: assets/%', v_id; end if;
    else
        if p_expected_version is not null then raise exception 'NOT_FOUND: assets/%', v_id; end if;
        if v_role = 'inventory' then
            raise exception 'AUTHORIZATION_DENIED: Inventário não pode cadastrar aquisição operacional';
        end if;
        insert into public.assets (
            id, school_id, competence_id, description, expense_type,
            invoice_number, amount, status, inventory_process, notes,
            inventoried_by_member_id, inventoried_at, payload
        ) values (
            v_id, v_school_id, nullif(p_asset ->> 'competence_id', ''),
            p_asset ->> 'description', p_asset ->> 'expense_type',
            coalesce(p_asset ->> 'invoice_number', ''),
            coalesce((p_asset ->> 'amount')::numeric, 0), p_asset ->> 'status',
            coalesce(p_asset ->> 'inventory_process', ''), coalesce(p_asset ->> 'notes', ''),
            nullif(p_asset ->> 'inventoried_by_member_id', ''),
            nullif(p_asset ->> 'inventoried_at', '')::timestamptz,
            coalesce(p_asset -> 'payload', '{}'::jsonb)
        ) returning * into v_asset;
    end if;

    insert into public.administrative_logs (
        id, school_id, actor_user_id, user_identifier,
        profile_name, action, details, event_at
    ) values (
        p_administrative_log ->> 'id', v_school_id, auth.uid(),
        coalesce(p_administrative_log ->> 'user_identifier', ''),
        coalesce(nullif(p_administrative_log ->> 'profile_name', ''), v_role),
        p_administrative_log ->> 'action',
        coalesce(p_administrative_log -> 'details', '{}'::jsonb),
        coalesce(nullif(p_administrative_log ->> 'event_at', '')::timestamptz, now())
    ) returning * into v_log;

    return jsonb_build_object(
        'asset', to_jsonb(v_asset),
        'administrative_log', to_jsonb(v_log)
    );
end
$$;

revoke all on function public.save_asset_with_log(jsonb, integer, jsonb) from public;
grant execute on function public.save_asset_with_log(jsonb, integer, jsonb) to authenticated;


create or replace function public.save_program_with_log(
    p_program jsonb,
    p_expected_version integer,
    p_administrative_log jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_role text := public.current_app_role();
    v_id text := nullif(p_program ->> 'id', '');
    v_existing public.programs%rowtype;
    v_program public.programs%rowtype;
    v_log public.administrative_logs%rowtype;
begin
    if v_role not in ('technical_admin', 'sme_management') then
        raise exception 'AUTHORIZATION_DENIED: perfil sem permissão para programas';
    end if;
    if jsonb_typeof(p_program) <> 'object'
        or v_id is null
        or nullif(p_program ->> 'name', '') is null then
        raise exception 'VALIDATION_ERROR: programa canônico inválido';
    end if;
    if v_id = 'BASIC' and coalesce((p_program ->> 'active')::boolean, true) = false then
        raise exception 'VALIDATION_ERROR: programa BASIC protegido';
    end if;
    if p_administrative_log is null
        or jsonb_typeof(p_administrative_log) <> 'object'
        or nullif(p_administrative_log ->> 'id', '') is null
        or nullif(p_administrative_log ->> 'action', '') is null
        or nullif(p_administrative_log ->> 'school_id', '') is not null
        or not public.radar_jsonb_matches(
            'auditDetails', coalesce(p_administrative_log -> 'details', '{}'::jsonb)
        ) then
        raise exception 'VALIDATION_ERROR: log administrativo global inválido';
    end if;

    select * into v_existing from public.programs where id = v_id for update;
    if found then
        if p_expected_version is null or v_existing.row_version <> p_expected_version then
            raise exception 'OPTIMISTIC_CONFLICT: programs/%', v_id;
        end if;
        update public.programs set
            name = p_program ->> 'name',
            description = coalesce(p_program ->> 'description', ''),
            active = coalesce((p_program ->> 'active')::boolean, true)
        where id = v_id and row_version = p_expected_version
        returning * into v_program;
        if not found then raise exception 'OPTIMISTIC_CONFLICT: programs/%', v_id; end if;
    else
        if p_expected_version is not null then raise exception 'NOT_FOUND: programs/%', v_id; end if;
        insert into public.programs (id, name, description, active)
        values (
            v_id,
            p_program ->> 'name',
            coalesce(p_program ->> 'description', ''),
            coalesce((p_program ->> 'active')::boolean, true)
        )
        returning * into v_program;
    end if;

    insert into public.administrative_logs (
        id, school_id, actor_user_id, user_identifier,
        profile_name, action, details, event_at
    ) values (
        p_administrative_log ->> 'id',
        null,
        auth.uid(),
        coalesce(p_administrative_log ->> 'user_identifier', ''),
        coalesce(nullif(p_administrative_log ->> 'profile_name', ''), v_role),
        p_administrative_log ->> 'action',
        coalesce(p_administrative_log -> 'details', '{}'::jsonb),
        coalesce(nullif(p_administrative_log ->> 'event_at', '')::timestamptz, now())
    )
    returning * into v_log;

    return jsonb_build_object(
        'program', to_jsonb(v_program),
        'administrative_log', to_jsonb(v_log)
    );
end
$$;

revoke all on function public.save_program_with_log(jsonb, integer, jsonb) from public;
grant execute on function public.save_program_with_log(jsonb, integer, jsonb) to authenticated;

create or replace function public.save_calendar_with_log(
    p_config jsonb,
    p_expected_version integer,
    p_administrative_log jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_role text := public.current_app_role();
    v_id text := nullif(p_config ->> 'id', '');
    v_existing public.app_config%rowtype;
    v_config public.app_config%rowtype;
    v_log public.administrative_logs%rowtype;
begin
    if v_role not in ('technical_admin', 'sme_management') then
        raise exception 'AUTHORIZATION_DENIED: perfil sem permissão para calendário';
    end if;
    if jsonb_typeof(p_config) <> 'object' or v_id is null then
        raise exception 'VALIDATION_ERROR: configuração canônica inválida';
    end if;
    if not public.radar_jsonb_matches(
        'compatibilityPayload', coalesce(p_config -> 'settings', '{}'::jsonb)
    ) then
        raise exception 'VALIDATION_ERROR: settings do calendário incompatíveis';
    end if;
    if nullif(p_config ->> 'closing_competence', '') is not null
        and not exists (
            select 1 from public.competences
            where id = p_config ->> 'closing_competence'
        ) then
        raise exception 'VALIDATION_ERROR: competência de fechamento inexistente';
    end if;
    if p_administrative_log is null
        or jsonb_typeof(p_administrative_log) <> 'object'
        or nullif(p_administrative_log ->> 'id', '') is null
        or nullif(p_administrative_log ->> 'action', '') is null
        or nullif(p_administrative_log ->> 'school_id', '') is not null
        or not public.radar_jsonb_matches(
            'auditDetails', coalesce(p_administrative_log -> 'details', '{}'::jsonb)
        ) then
        raise exception 'VALIDATION_ERROR: log administrativo global inválido';
    end if;

    select * into v_existing from public.app_config where id = v_id for update;
    if found then
        if p_expected_version is null or v_existing.row_version <> p_expected_version then
            raise exception 'OPTIMISTIC_CONFLICT: app_config/%', v_id;
        end if;
        update public.app_config set
            exercises = coalesce(p_config -> 'exercises', exercises),
            closing_competence = nullif(p_config ->> 'closing_competence', ''),
            bonus_deadline_extended = nullif(p_config ->> 'bonus_deadline_extended', '')::date,
            settings = coalesce(p_config -> 'settings', settings)
        where id = v_id and row_version = p_expected_version
        returning * into v_config;
        if not found then raise exception 'OPTIMISTIC_CONFLICT: app_config/%', v_id; end if;
    else
        if p_expected_version is not null then raise exception 'NOT_FOUND: app_config/%', v_id; end if;
        insert into public.app_config (
            id, exercises, closing_competence, bonus_deadline_extended, settings
        ) values (
            v_id,
            coalesce(p_config -> 'exercises', '[]'::jsonb),
            nullif(p_config ->> 'closing_competence', ''),
            nullif(p_config ->> 'bonus_deadline_extended', '')::date,
            coalesce(p_config -> 'settings', '{}'::jsonb)
        )
        returning * into v_config;
    end if;

    insert into public.administrative_logs (
        id, school_id, actor_user_id, user_identifier,
        profile_name, action, details, event_at
    ) values (
        p_administrative_log ->> 'id', null, auth.uid(),
        coalesce(p_administrative_log ->> 'user_identifier', ''),
        coalesce(nullif(p_administrative_log ->> 'profile_name', ''), v_role),
        p_administrative_log ->> 'action',
        coalesce(p_administrative_log -> 'details', '{}'::jsonb),
        coalesce(nullif(p_administrative_log ->> 'event_at', '')::timestamptz, now())
    )
    returning * into v_log;

    return jsonb_build_object(
        'app_config', to_jsonb(v_config),
        'administrative_log', to_jsonb(v_log)
    );
end
$$;

revoke all on function public.save_calendar_with_log(jsonb, integer, jsonb) from public;
grant execute on function public.save_calendar_with_log(jsonb, integer, jsonb) to authenticated;

create or replace function public.assign_controller_with_log(
    p_schools jsonb,
    p_administrative_log jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_role text := public.current_app_role();
    v_item jsonb;
    v_school public.schools%rowtype;
    v_updated jsonb := '[]'::jsonb;
    v_log public.administrative_logs%rowtype;
    v_school_ids text[] := array[]::text[];
begin
    if v_role not in ('technical_admin', 'federal_assistant', 'sme_management') then
        raise exception 'AUTHORIZATION_DENIED: perfil sem permissão para redistribuir carteira';
    end if;
    if jsonb_typeof(p_schools) <> 'array' or jsonb_array_length(p_schools) = 0 then
        raise exception 'VALIDATION_ERROR: redistribuição exige escolas';
    end if;
    if p_administrative_log is null
        or jsonb_typeof(p_administrative_log) <> 'object'
        or nullif(p_administrative_log ->> 'id', '') is null
        or nullif(p_administrative_log ->> 'action', '') is null
        or not public.radar_jsonb_matches(
            'auditDetails', coalesce(p_administrative_log -> 'details', '{}'::jsonb)
        ) then
        raise exception 'VALIDATION_ERROR: log administrativo obrigatório e inválido';
    end if;

    for v_item in select value from jsonb_array_elements(p_schools)
    loop
        if nullif(v_item ->> 'id', '') is null
            or nullif(v_item ->> 'controller_id', '') is null
            or nullif(v_item ->> 'expected_version', '') is null then
            raise exception 'VALIDATION_ERROR: item de redistribuição inválido';
        end if;
        if not exists (
            select 1 from public.controllers
            where id = v_item ->> 'controller_id' and active = true
        ) then
            raise exception 'VALIDATION_ERROR: controlador ativo inexistente';
        end if;
        select * into v_school
        from public.schools
        where id = v_item ->> 'id'
        for update;
        if not found then raise exception 'NOT_FOUND: schools/%', v_item ->> 'id'; end if;
        if not public.can_write_school(v_school.id) then
            raise exception 'AUTHORIZATION_DENIED: usuário sem escrita para a escola %', v_school.id;
        end if;
        if v_school.row_version <> (v_item ->> 'expected_version')::integer then
            raise exception 'OPTIMISTIC_CONFLICT: schools/%', v_school.id;
        end if;
        update public.schools
        set controller_id = v_item ->> 'controller_id'
        where id = v_school.id
          and row_version = (v_item ->> 'expected_version')::integer
        returning * into v_school;
        if not found then raise exception 'OPTIMISTIC_CONFLICT: schools/%', v_item ->> 'id'; end if;
        v_school_ids := array_append(v_school_ids, v_school.id);
        v_updated := v_updated || jsonb_build_array(to_jsonb(v_school));
    end loop;

    if nullif(p_administrative_log ->> 'school_id', '') is not null
        and not ((p_administrative_log ->> 'school_id') = any(v_school_ids)) then
        raise exception 'VALIDATION_ERROR: escola do log fora da redistribuição';
    end if;

    insert into public.administrative_logs (
        id, school_id, actor_user_id, user_identifier,
        profile_name, action, details, event_at
    ) values (
        p_administrative_log ->> 'id',
        nullif(p_administrative_log ->> 'school_id', ''),
        auth.uid(),
        coalesce(p_administrative_log ->> 'user_identifier', ''),
        coalesce(nullif(p_administrative_log ->> 'profile_name', ''), v_role),
        p_administrative_log ->> 'action',
        coalesce(p_administrative_log -> 'details', '{}'::jsonb),
        coalesce(nullif(p_administrative_log ->> 'event_at', '')::timestamptz, now())
    )
    returning * into v_log;

    return jsonb_build_object(
        'schools', v_updated,
        'administrative_log', to_jsonb(v_log)
    );
end
$$;

revoke all on function public.assign_controller_with_log(jsonb, jsonb) from public;
grant execute on function public.assign_controller_with_log(jsonb, jsonb) to authenticated;


-- Endurecimento de RPCs transacionais preexistentes: log obrigatório e correlacionado.

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

    if p_administrative_log is null
        or nullif(p_administrative_log ->> 'id', '') is null
        or nullif(p_administrative_log ->> 'action', '') is null
        or not public.radar_jsonb_matches('auditDetails', coalesce(p_administrative_log -> 'details', '{}'::jsonb)) then
        raise exception 'VALIDATION_ERROR: log administrativo obrigatório e inválido';
    end if;
    if nullif(p_administrative_log ->> 'school_id', '') is not null then
        raise exception 'VALIDATION_ERROR: criação de exercício exige log global';
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

    if p_administrative_log is null
        or nullif(p_administrative_log ->> 'id', '') is null
        or nullif(p_administrative_log ->> 'action', '') is null
        or not public.radar_jsonb_matches('auditDetails', coalesce(p_administrative_log -> 'details', '{}'::jsonb)) then
        raise exception 'VALIDATION_ERROR: log administrativo obrigatório e inválido';
    end if;
    if nullif(p_administrative_log ->> 'school_id', '') is not null
        and (p_administrative_log ->> 'school_id') is distinct from v_school_id then
        raise exception 'VALIDATION_ERROR: log administrativo pertence a outra escola';
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

    if p_administrative_log is null
        or nullif(p_administrative_log ->> 'id', '') is null
        or nullif(p_administrative_log ->> 'action', '') is null
        or not public.radar_jsonb_matches('auditDetails', coalesce(p_administrative_log -> 'details', '{}'::jsonb)) then
        raise exception 'VALIDATION_ERROR: log administrativo obrigatório e inválido';
    end if;
    if nullif(p_administrative_log ->> 'school_id', '') is not null
        and (p_administrative_log ->> 'school_id') is distinct from v_existing_pendency.school_id then
        raise exception 'VALIDATION_ERROR: log administrativo pertence a outra escola';
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

    return jsonb_build_object(
        'pendency', to_jsonb(v_pendency),
        'attempt', case when v_attempt.id is null then null else to_jsonb(v_attempt) end,
        'verification', to_jsonb(v_verification)
    );
end
$$;

revoke all on function public.reanalyze_pendency_with_verification(jsonb, jsonb, jsonb, integer, integer, jsonb) from public;
grant execute on function public.reanalyze_pendency_with_verification(jsonb, jsonb, jsonb, integer, integer, jsonb) to authenticated;


commit;
