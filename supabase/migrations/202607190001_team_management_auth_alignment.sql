-- RADAR PDDE — alinhamento final de Gestão de Equipe, Auth e RLS.
-- A Assistente de Verbas Federais administra controladores e Inventário da CRE.
-- A Gestão SME mantém leitura gerencial; exclusão física permanece técnica.

-- Corrige a matriz de manutenção dos diretórios organizacionais.
drop policy if exists controllers_insert on public.controllers;
create policy controllers_insert on public.controllers
for insert to authenticated
with check (public.current_app_role() in ('technical_admin', 'federal_assistant'));

drop policy if exists controllers_update on public.controllers;
create policy controllers_update on public.controllers
for update to authenticated
using (public.current_app_role() in ('technical_admin', 'federal_assistant'))
with check (public.current_app_role() in ('technical_admin', 'federal_assistant'));

drop policy if exists inventory_members_insert on public.inventory_team_members;
create policy inventory_members_insert on public.inventory_team_members
for insert to authenticated
with check (public.current_app_role() in ('technical_admin', 'federal_assistant'));

drop policy if exists inventory_members_update on public.inventory_team_members;
create policy inventory_members_update on public.inventory_team_members
for update to authenticated
using (public.current_app_role() in ('technical_admin', 'federal_assistant'))
with check (public.current_app_role() in ('technical_admin', 'federal_assistant'));

create or replace function public.insert_team_management_log(
    p_log jsonb,
    p_actor_user_id uuid,
    p_profile_name text
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_id text := coalesce(
        nullif(p_log ->> 'id', ''),
        'team-log-' || gen_random_uuid()::text
    );
    v_action text := coalesce(
        nullif(p_log ->> 'action', ''),
        nullif(p_log ->> 'acao', ''),
        'Gestão de Equipe'
    );
    v_details jsonb;
    v_event_at timestamptz;
begin
    if jsonb_typeof(p_log) <> 'object' then
        raise exception 'VALIDATION_ERROR: log administrativo inválido';
    end if;

    v_details := case
        when jsonb_typeof(p_log -> 'details') = 'object' then p_log -> 'details'
        when jsonb_typeof(p_log -> 'detalhes') = 'object' then p_log -> 'detalhes'
        else jsonb_build_object(
            'text',
            coalesce(p_log ->> 'details', p_log ->> 'detalhes', '')
        )
    end;
    v_event_at := coalesce(
        nullif(p_log ->> 'event_at', '')::timestamptz,
        nullif(p_log ->> 'eventAt', '')::timestamptz,
        nullif(p_log ->> 'dataHora', '')::timestamptz,
        now()
    );

    insert into public.administrative_logs (
        id,
        actor_user_id,
        user_identifier,
        profile_name,
        action,
        details,
        event_at
    ) values (
        v_id,
        p_actor_user_id,
        coalesce(p_log ->> 'user_identifier', p_log ->> 'usuario', ''),
        coalesce(nullif(p_profile_name, ''), p_log ->> 'profile_name', p_log ->> 'perfil', ''),
        v_action,
        v_details,
        v_event_at
    )
    on conflict (id) do nothing;

    return v_id;
end
$$;

create or replace function public.upsert_team_member_account(
    p_member jsonb,
    p_user_id uuid,
    p_profile_id text,
    p_actor_user_id uuid,
    p_administrative_log jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_id text := nullif(p_member ->> 'id', '');
    v_name text := nullif(btrim(p_member ->> 'name'), '');
    v_email text := lower(nullif(btrim(p_member ->> 'email'), ''));
    v_cre_scope text := coalesce(nullif(p_member ->> 'cre_scope', ''), '4ª CRE');
    v_controller public.controllers%rowtype;
    v_inventory public.inventory_team_members%rowtype;
begin
    if p_profile_id not in ('controller', 'inventory') then
        raise exception 'VALIDATION_ERROR: perfil de integrante inválido';
    end if;
    if v_id is null or v_name is null or v_email is null or p_user_id is null then
        raise exception 'VALIDATION_ERROR: integrante, e-mail e usuário são obrigatórios';
    end if;
    if v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
        raise exception 'VALIDATION_ERROR: e-mail inválido';
    end if;

    -- Um usuário possui somente um papel ativo. Papéis históricos são preservados inativos.
    update public.user_profiles
    set active = false
    where user_id = p_user_id
      and active = true
      and profile_id <> p_profile_id;

    if p_profile_id = 'controller' then
        insert into public.controllers (id, name, email, active, user_id)
        values (v_id, v_name, v_email, true, p_user_id)
        on conflict (id) do update set
            name = excluded.name,
            email = excluded.email,
            active = true,
            user_id = excluded.user_id
        returning * into v_controller;

        insert into public.user_profiles (
            user_id,
            profile_id,
            controller_id,
            inventory_member_id,
            cre_scope,
            active
        ) values (
            p_user_id,
            'controller',
            v_id,
            null,
            v_cre_scope,
            true
        )
        on conflict (user_id, profile_id) do update set
            controller_id = excluded.controller_id,
            inventory_member_id = null,
            cre_scope = excluded.cre_scope,
            active = true;

        perform public.insert_team_management_log(
            p_administrative_log,
            p_actor_user_id,
            'federal_assistant'
        );
        return jsonb_build_object(
            'profile_id', 'controller',
            'entity', to_jsonb(v_controller),
            'user_id', p_user_id
        );
    end if;

    insert into public.inventory_team_members (id, name, email, active, user_id)
    values (v_id, v_name, v_email, true, p_user_id)
    on conflict (id) do update set
        name = excluded.name,
        email = excluded.email,
        active = true,
        user_id = excluded.user_id
    returning * into v_inventory;

    insert into public.user_profiles (
        user_id,
        profile_id,
        controller_id,
        inventory_member_id,
        cre_scope,
        active
    ) values (
        p_user_id,
        'inventory',
        null,
        v_id,
        v_cre_scope,
        true
    )
    on conflict (user_id, profile_id) do update set
        controller_id = null,
        inventory_member_id = excluded.inventory_member_id,
        cre_scope = excluded.cre_scope,
        active = true;

    perform public.insert_team_management_log(
        p_administrative_log,
        p_actor_user_id,
        'federal_assistant'
    );
    return jsonb_build_object(
        'profile_id', 'inventory',
        'entity', to_jsonb(v_inventory),
        'user_id', p_user_id
    );
end
$$;

create or replace function public.deactivate_controller_account(
    p_controller_id text,
    p_fallback_controller_id text,
    p_actor_user_id uuid,
    p_administrative_log jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_controller public.controllers%rowtype;
    v_fallback public.controllers%rowtype;
    v_reassigned integer := 0;
begin
    select * into v_controller
    from public.controllers
    where id = p_controller_id and active = true
    for update;
    if not found then
        raise exception 'NOT_FOUND: controlador ativo não localizado';
    end if;
    if (select count(*) from public.controllers where active = true) <= 1 then
        raise exception 'VALIDATION_ERROR: não é possível desativar o único controlador ativo';
    end if;

    select * into v_fallback
    from public.controllers
    where id = p_fallback_controller_id
      and id <> p_controller_id
      and active = true
    for update;

    if exists(select 1 from public.schools where controller_id = p_controller_id)
       and not found then
        raise exception 'VALIDATION_ERROR: controlador substituto ativo é obrigatório';
    end if;

    if v_fallback.id is not null then
        update public.schools
        set controller_id = v_fallback.id
        where controller_id = p_controller_id;
        get diagnostics v_reassigned = row_count;
    end if;

    update public.controllers
    set active = false
    where id = p_controller_id;

    update public.user_profiles
    set active = false
    where controller_id = p_controller_id
      and profile_id = 'controller'
      and active = true;

    perform public.insert_team_management_log(
        p_administrative_log,
        p_actor_user_id,
        'federal_assistant'
    );

    return jsonb_build_object(
        'controller_id', p_controller_id,
        'fallback_controller_id', v_fallback.id,
        'reassigned_count', v_reassigned,
        'user_id', v_controller.user_id
    );
end
$$;

create or replace function public.deactivate_inventory_member_account(
    p_member_id text,
    p_actor_user_id uuid,
    p_administrative_log jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_member public.inventory_team_members%rowtype;
begin
    select * into v_member
    from public.inventory_team_members
    where id = p_member_id and active = true
    for update;
    if not found then
        raise exception 'NOT_FOUND: integrante ativo do Inventário não localizado';
    end if;
    if (select count(*) from public.inventory_team_members where active = true) <= 1 then
        raise exception 'VALIDATION_ERROR: não é possível desativar o único integrante ativo do Inventário';
    end if;

    update public.inventory_team_members
    set active = false
    where id = p_member_id;

    update public.user_profiles
    set active = false
    where inventory_member_id = p_member_id
      and profile_id = 'inventory'
      and active = true;

    perform public.insert_team_management_log(
        p_administrative_log,
        p_actor_user_id,
        'federal_assistant'
    );

    return jsonb_build_object(
        'member_id', p_member_id,
        'user_id', v_member.user_id
    );
end
$$;

revoke all on function public.insert_team_management_log(jsonb, uuid, text) from public;
revoke all on function public.upsert_team_member_account(jsonb, uuid, text, uuid, jsonb) from public;
revoke all on function public.deactivate_controller_account(text, text, uuid, jsonb) from public;
revoke all on function public.deactivate_inventory_member_account(text, uuid, jsonb) from public;

grant execute on function public.upsert_team_member_account(jsonb, uuid, text, uuid, jsonb) to service_role;
grant execute on function public.deactivate_controller_account(text, text, uuid, jsonb) to service_role;
grant execute on function public.deactivate_inventory_member_account(text, uuid, jsonb) to service_role;

comment on function public.upsert_team_member_account(jsonb, uuid, text, uuid, jsonb) is
    'Vincula conta Auth e perfil a controlador ou integrante do Inventário; uso exclusivo da função administrativa protegida.';
comment on function public.deactivate_controller_account(text, text, uuid, jsonb) is
    'Redistribui a carteira, desativa controlador e perfil de acesso sem apagar histórico.';
comment on function public.deactivate_inventory_member_account(text, uuid, jsonb) is
    'Desativa integrante do Inventário e perfil de acesso sem apagar histórico.';
