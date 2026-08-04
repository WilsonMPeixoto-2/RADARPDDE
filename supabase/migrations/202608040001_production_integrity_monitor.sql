create or replace function radar_private.production_integrity_check()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public, auth, radar_private
as $$
    with checks as (
        select 'active_controllers_without_user_id'::text as check_code, count(*)::bigint as issue_count
        from public.controllers
        where active is true and user_id is null

        union all
        select 'active_inventory_without_user_id', count(*)::bigint
        from public.inventory_team_members
        where active is true and user_id is null

        union all
        select 'active_schools_without_active_controller', count(*)::bigint
        from public.schools s
        left join public.controllers c on c.id = s.controller_id
        where s.active is true
          and (s.controller_id is null or c.id is null or c.active is not true)

        union all
        select 'active_user_profiles_without_auth_user', count(*)::bigint
        from public.user_profiles up
        left join auth.users au on au.id = up.user_id
        where up.active is true and au.id is null

        union all
        select 'active_user_profiles_with_inactive_profile', count(*)::bigint
        from public.user_profiles up
        left join public.profiles p on p.id = up.profile_id
        where up.active is true and (p.id is null or p.active is not true)

        union all
        select 'controller_profiles_without_valid_controller', count(*)::bigint
        from public.user_profiles up
        left join public.controllers c on c.id = up.controller_id
        where up.active is true
          and up.profile_id = 'controller'
          and (up.controller_id is null or c.id is null or c.active is not true)

        union all
        select 'inventory_profiles_without_valid_member', count(*)::bigint
        from public.user_profiles up
        left join public.inventory_team_members m on m.id = up.inventory_member_id
        where up.active is true
          and up.profile_id = 'inventory'
          and (up.inventory_member_id is null or m.id is null or m.active is not true)

        union all
        select 'controller_profile_user_id_mismatch', count(*)::bigint
        from public.user_profiles up
        join public.controllers c on c.id = up.controller_id
        where up.active is true
          and up.profile_id = 'controller'
          and c.user_id is distinct from up.user_id

        union all
        select 'inventory_profile_user_id_mismatch', count(*)::bigint
        from public.user_profiles up
        join public.inventory_team_members m on m.id = up.inventory_member_id
        where up.active is true
          and up.profile_id = 'inventory'
          and m.user_id is distinct from up.user_id

        union all
        select 'users_with_multiple_active_profiles', count(*)::bigint
        from (
            select user_id
            from public.user_profiles
            where active is true
            group by user_id
            having count(*) > 1
        ) duplicates

        union all
        select 'active_controllers_sharing_user_id', count(*)::bigint
        from (
            select user_id
            from public.controllers
            where active is true and user_id is not null
            group by user_id
            having count(*) > 1
        ) duplicates

        union all
        select 'active_inventory_members_sharing_user_id', count(*)::bigint
        from (
            select user_id
            from public.inventory_team_members
            where active is true and user_id is not null
            group by user_id
            having count(*) > 1
        ) duplicates

        union all
        select 'active_school_programs_with_inactive_endpoint', count(*)::bigint
        from public.school_programs sp
        left join public.schools s on s.id = sp.school_id
        left join public.programs p on p.id = sp.program_id
        where sp.active is true
          and (s.id is null or s.active is not true or p.id is null or p.active is not true)

        union all
        select 'resolved_pendencies_without_resolved_at', count(*)::bigint
        from public.pendencies
        where status = 'Resolvida' and resolved_at is null

        union all
        select 'canceled_pendencies_without_canceled_at', count(*)::bigint
        from public.pendencies
        where status = 'Cancelada' and canceled_at is null

        union all
        select 'open_pendencies_on_inactive_school_or_program', count(*)::bigint
        from public.pendencies pe
        left join public.schools s on s.id = pe.school_id
        left join public.programs p on p.id = pe.program_id
        where pe.status in ('Aberta', 'Aguardando reanálise')
          and (
              s.id is null
              or s.active is not true
              or (pe.program_id is not null and (p.id is null or p.active is not true))
          )

        union all
        select 'inventoried_assets_missing_inventory_metadata', count(*)::bigint
        from public.assets
        where status = 'Inventariada'
          and (inventoried_at is null or inventoried_by_member_id is null)

        union all
        select 'non_inventoried_assets_with_inventory_metadata', count(*)::bigint
        from public.assets
        where status <> 'Inventariada'
          and (inventoried_at is not null or inventoried_by_member_id is not null)

        union all
        select 'permanent_invoices_without_linked_asset', count(*)::bigint
        from public.registered_invoices
        where expense_type = 'permanente' and linked_asset_id is null

        union all
        select 'linked_invoice_asset_context_mismatch', count(*)::bigint
        from public.registered_invoices ri
        join public.assets a on a.id = ri.linked_asset_id
        where ri.school_id is distinct from a.school_id
           or ri.competence_id is distinct from a.competence_id
           or ri.invoice_number is distinct from a.invoice_number
    ), totals as (
        select coalesce(sum(issue_count), 0)::bigint as total_issues,
               jsonb_object_agg(check_code, issue_count order by check_code) as check_counts
        from checks
    )
    select jsonb_build_object(
        'schemaVersion', 1,
        'status', case when total_issues = 0 then 'healthy' else 'issues_detected' end,
        'totalIssues', total_issues,
        'checks', check_counts
    )
    from totals;
$$;

create or replace function public.production_integrity_check()
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public, radar_private
as $$
    select radar_private.production_integrity_check();
$$;

revoke all on function radar_private.production_integrity_check() from public;
revoke all on function radar_private.production_integrity_check() from anon;
revoke all on function radar_private.production_integrity_check() from authenticated;
revoke all on function public.production_integrity_check() from public;
revoke all on function public.production_integrity_check() from anon;
revoke all on function public.production_integrity_check() from authenticated;

grant execute on function radar_private.production_integrity_check() to service_role;
grant execute on function public.production_integrity_check() to service_role;

comment on function public.production_integrity_check() is
'Auditoria agregada e somente leitura da integridade operacional do RADAR PDDE, restrita a service_role.';
