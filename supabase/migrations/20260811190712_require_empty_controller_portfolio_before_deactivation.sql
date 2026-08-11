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

    if p_fallback_controller_id is not null then
        raise exception 'VALIDATION_ERROR: transfira as escolas antes de solicitar a desativação';
    end if;

    if exists (
        select 1
        from public.schools
        where controller_id = p_controller_id
    ) then
        raise exception 'VALIDATION_ERROR: transfira todas as escolas antes de desativar o controlador';
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
        'fallback_controller_id', null,
        'reassigned_count', 0,
        'user_id', v_controller.user_id
    );
end
$$;

comment on function public.deactivate_controller_account(text, text, uuid, jsonb) is
    'Desativa controlador somente após sua carteira ser integralmente transferida e zerada.';
