-- Corrige registros Auth legados incompatíveis com o GoTrue e impede que
-- uma conta malformada bloqueie toda a Gestão de Equipe.

update auth.users
set
    confirmation_token = coalesce(confirmation_token, ''),
    recovery_token = coalesce(recovery_token, ''),
    email_change_token_new = coalesce(email_change_token_new, '')
where confirmation_token is null
   or recovery_token is null
   or email_change_token_new is null;

create or replace function public.resolve_team_auth_user_id_by_email(p_email text)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, auth
as $$
declare
    v_email text := lower(btrim(coalesce(p_email, '')));
    v_ids uuid[];
begin
    if v_email = '' then
        raise exception 'VALIDATION_ERROR: e-mail obrigatório';
    end if;

    select array_agg(u.id order by u.created_at, u.id)
    into v_ids
    from auth.users u
    where lower(btrim(coalesce(u.email, ''))) = v_email;

    if coalesce(array_length(v_ids, 1), 0) > 1 then
        raise exception 'ACCOUNT_CONFLICT: mais de uma conta Auth encontrada para o mesmo e-mail';
    end if;

    return v_ids[1];
end
$$;

revoke all on function public.resolve_team_auth_user_id_by_email(text) from public;
revoke all on function public.resolve_team_auth_user_id_by_email(text) from anon;
revoke all on function public.resolve_team_auth_user_id_by_email(text) from authenticated;
grant execute on function public.resolve_team_auth_user_id_by_email(text) to service_role;

-- O conjunto abaixo é exclusivamente sintético, criado para homologação manual.
-- As guardas impedem exclusão se qualquer identificador tiver sido reaproveitado
-- ou se os usuários HML tiverem adquirido vínculos fora do cenário confirmado.
do $$
begin
    if exists (
        select 1
        from public.schools
        where id = 'HML-SCHOOL-manual-20260723112802'
          and not (
              cre = 'HML'
              and ra = 'HML'
              and designation = '04.11.HML-260723112802'
              and controller_id = 'hml_controller_20260723112802'
          )
    ) then
        raise exception 'VALIDATION_ERROR: escola HML não corresponde ao registro sintético esperado';
    end if;

    if exists (
        select 1
        from public.controllers
        where id = 'hml_controller_20260723112802'
          and lower(email) <> 'hml-manual-20260723112802-controller@radar.local'
    ) then
        raise exception 'VALIDATION_ERROR: controlador HML não corresponde ao registro sintético esperado';
    end if;

    if exists (
        select 1
        from public.schools
        where controller_id = 'hml_controller_20260723112802'
          and id <> 'HML-SCHOOL-manual-20260723112802'
    ) then
        raise exception 'VALIDATION_ERROR: controlador HML possui escola fora do cenário sintético';
    end if;

    if exists (
        select 1
        from public.inventory_team_members
        where id = 'hml_inventory_20260723112802'
          and lower(email) <> 'hml-manual-20260723112802-inventory@radar.local'
    ) then
        raise exception 'VALIDATION_ERROR: integrante HML não corresponde ao registro sintético esperado';
    end if;

    if exists (
        select 1
        from public.assets
        where inventoried_by_member_id = 'hml_inventory_20260723112802'
    ) then
        raise exception 'VALIDATION_ERROR: integrante HML possui bem patrimonial associado';
    end if;

    if exists (
        select 1
        from auth.users
        where id = 'fd288b37-90e2-40b8-a5cd-e563d6cd05eb'
          and lower(coalesce(email, '')) <> 'hml-manual-20260723112802-controller@radar.local'
    ) then
        raise exception 'VALIDATION_ERROR: conta Auth do controlador HML diverge do registro sintético';
    end if;

    if exists (
        select 1
        from auth.users
        where id = 'ee7d73d2-ff51-48f3-84af-061da3ac3c5e'
          and lower(coalesce(email, '')) <> 'hml-manual-20260723112802-inventory@radar.local'
    ) then
        raise exception 'VALIDATION_ERROR: conta Auth do Inventário HML diverge do registro sintético';
    end if;

    if exists (
        select 1
        from public.user_profiles
        where controller_id = 'hml_controller_20260723112802'
          and user_id <> 'fd288b37-90e2-40b8-a5cd-e563d6cd05eb'::uuid
    ) then
        raise exception 'VALIDATION_ERROR: controlador HML está vinculado a outra conta';
    end if;

    if exists (
        select 1
        from public.user_profiles
        where inventory_member_id = 'hml_inventory_20260723112802'
          and user_id <> 'ee7d73d2-ff51-48f3-84af-061da3ac3c5e'::uuid
    ) then
        raise exception 'VALIDATION_ERROR: integrante HML está vinculado a outra conta';
    end if;

    if exists (
        select 1
        from public.user_school_scopes
        where user_id in (
            'fd288b37-90e2-40b8-a5cd-e563d6cd05eb'::uuid,
            'ee7d73d2-ff51-48f3-84af-061da3ac3c5e'::uuid
        )
          and school_id <> 'HML-SCHOOL-manual-20260723112802'
    ) then
        raise exception 'VALIDATION_ERROR: conta HML possui escopo sobre escola real';
    end if;
end
$$;

delete from public.schools
where id = 'HML-SCHOOL-manual-20260723112802'
  and cre = 'HML'
  and ra = 'HML'
  and designation = '04.11.HML-260723112802'
  and controller_id = 'hml_controller_20260723112802';

delete from public.user_profiles
where user_id in (
    'fd288b37-90e2-40b8-a5cd-e563d6cd05eb'::uuid,
    'ee7d73d2-ff51-48f3-84af-061da3ac3c5e'::uuid
);

delete from public.controllers
where id = 'hml_controller_20260723112802'
  and lower(email) = 'hml-manual-20260723112802-controller@radar.local';

delete from public.inventory_team_members
where id = 'hml_inventory_20260723112802'
  and lower(email) = 'hml-manual-20260723112802-inventory@radar.local';

delete from auth.users
where (
    id = 'fd288b37-90e2-40b8-a5cd-e563d6cd05eb'
    and lower(coalesce(email, '')) = 'hml-manual-20260723112802-controller@radar.local'
) or (
    id = 'ee7d73d2-ff51-48f3-84af-061da3ac3c5e'
    and lower(coalesce(email, '')) = 'hml-manual-20260723112802-inventory@radar.local'
);
