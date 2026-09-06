-- RADAR PDDE — concorrência otimista na edição de integrantes da equipe.
-- Mantém a assinatura pública da RPC e transporta a versão esperada dentro de p_member.row_version.

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
    v_expected_version integer := nullif(p_member ->> 'row_version', '')::integer;
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
    if v_expected_version is not null and v_expected_version <= 0 then
        raise exception 'VALIDATION_ERROR: versão esperada inválida';
    end if;

    -- Um usuário possui somente um papel ativo. Papéis históricos são preservados inativos.
    -- Se qualquer CAS abaixo falhar, toda a transação, inclusive esta alteração, é revertida.
    update public.user_profiles
    set active = false
    where user_id = p_user_id
      and active = true
      and profile_id <> p_profile_id;

    if p_profile_id = 'controller' then
        select * into v_controller
        from public.controllers
        where id = v_id
        for update;

        if found then
            if v_expected_version is null or v_controller.row_version <> v_expected_version then
                raise exception 'OPTIMISTIC_CONFLICT: controlador foi alterado por outra sessão';
            end if;
            update public.controllers
            set name = v_name,
                email = v_email,
                active = true,
                user_id = p_user_id
            where id = v_id
              and row_version = v_expected_version
            returning * into v_controller;
            if not found then
                raise exception 'OPTIMISTIC_CONFLICT: controlador foi alterado por outra sessão';
            end if;
        else
            if v_expected_version is not null then
                raise exception 'OPTIMISTIC_CONFLICT: controlador esperado não existe mais';
            end if;
            insert into public.controllers (id, name, email, active, user_id)
            values (v_id, v_name, v_email, true, p_user_id)
            returning * into v_controller;
        end if;

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

    select * into v_inventory
    from public.inventory_team_members
    where id = v_id
    for update;

    if found then
        if v_expected_version is null or v_inventory.row_version <> v_expected_version then
            raise exception 'OPTIMISTIC_CONFLICT: integrante do Inventário foi alterado por outra sessão';
        end if;
        update public.inventory_team_members
        set name = v_name,
            email = v_email,
            active = true,
            user_id = p_user_id
        where id = v_id
          and row_version = v_expected_version
        returning * into v_inventory;
        if not found then
            raise exception 'OPTIMISTIC_CONFLICT: integrante do Inventário foi alterado por outra sessão';
        end if;
    else
        if v_expected_version is not null then
            raise exception 'OPTIMISTIC_CONFLICT: integrante do Inventário esperado não existe mais';
        end if;
        insert into public.inventory_team_members (id, name, email, active, user_id)
        values (v_id, v_name, v_email, true, p_user_id)
        returning * into v_inventory;
    end if;

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

revoke all on function public.upsert_team_member_account(jsonb, uuid, text, uuid, jsonb) from public;
grant execute on function public.upsert_team_member_account(jsonb, uuid, text, uuid, jsonb) to service_role;

comment on function public.upsert_team_member_account(jsonb, uuid, text, uuid, jsonb) is
    'Vincula Auth e perfil à equipe; edições existentes exigem p_member.row_version e usam CAS para rejeitar escrita obsoleta.';
