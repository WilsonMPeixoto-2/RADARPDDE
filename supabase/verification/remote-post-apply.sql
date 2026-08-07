-- Contrato pós-aplicação para um projeto ou branch Supabase descartável.
do $$
declare
    v_expected text[] := array[
        '202607130001',
        '202607130002',
        '202607130003',
        '202607130004',
        '202607130005',
        '202607130006',
        '202607130007',
        '202607130008',
        '202607140009',
        '20260714180621',
        '20260714220136',
        '20260714220146',
        '202607190001',
        '20260720030046',
        '20260720193000',
        '20260721090000',
        '20260721152515',
        '20260721152634',
        '20260721153758',
        '20260721160056',
        '202607220001',
        '202607220002',
        '202607230001',
        '20260723043129',
        '20260728182226',
        '202608040001',
        '202608050001',
        '202608060001',
        '202608060002',
        '202608060003'
    ];
    v_actual text[];
    v_missing_extensions text[];
    v_version text;
    v_access_definition text;
begin
    select coalesce(array_agg(version order by version), array[]::text[])
      into v_actual
      from supabase_migrations.schema_migrations;

    if v_actual is distinct from v_expected then
        raise exception 'MIGRATION_HISTORY_MISMATCH: esperado %, recebido %', v_expected, v_actual;
    end if;

    select array_agg(required.name order by required.name)
      into v_missing_extensions
      from (values ('pgcrypto'), ('pg_jsonschema'), ('pgtap')) as required(name)
     where not exists (
        select 1 from pg_extension installed where installed.extname = required.name
     );

    if v_missing_extensions is not null then
        raise exception 'EXTENSION_NOT_INSTALLED: %', array_to_string(v_missing_extensions, ', ');
    end if;

    if to_regprocedure('public.save_verification_with_log(jsonb,integer,jsonb)') is null
       or to_regprocedure('public.save_pendency_contact_with_log(jsonb,text,jsonb)') is null
       or to_regprocedure('public.save_pendency_command(text,jsonb,integer,jsonb,jsonb,integer,jsonb)') is null
       or to_regprocedure('public.save_asset_with_log(jsonb,integer,jsonb)') is null
       or to_regprocedure('public.save_program_with_log(jsonb,integer,jsonb)') is null
       or to_regprocedure('public.save_calendar_with_log(jsonb,integer,jsonb)') is null
       or to_regprocedure('public.assign_controller_with_log(jsonb,jsonb)') is null then
        raise exception 'ATOMIC_OPERATIONAL_RPC_MISSING';
    end if;

    if to_regprocedure('public.upsert_team_member_account(jsonb,uuid,text,uuid,jsonb)') is null
       or to_regprocedure('public.deactivate_controller_account(text,text,uuid,jsonb)') is null
       or to_regprocedure('public.deactivate_inventory_member_account(text,uuid,jsonb)') is null
       or to_regprocedure('public.resolve_team_auth_user_id_by_email(text)') is null then
        raise exception 'TEAM_ACCOUNT_CONTRACT_MISSING';
    end if;

    if has_function_privilege('authenticated', 'public.upsert_team_member_account(jsonb,uuid,text,uuid,jsonb)', 'EXECUTE')
       or has_function_privilege('authenticated', 'public.resolve_team_auth_user_id_by_email(text)', 'EXECUTE')
       or not has_function_privilege('service_role', 'public.resolve_team_auth_user_id_by_email(text)', 'EXECUTE') then
        raise exception 'TEAM_ACCOUNT_RPC_PRIVILEGES_INVALID';
    end if;

    if to_regprocedure('radar_private.production_integrity_check()') is null
       or to_regprocedure('public.production_integrity_check()') is null then
        raise exception 'PRODUCTION_INTEGRITY_CONTRACT_MISSING';
    end if;

    if has_function_privilege('anon', 'public.production_integrity_check()', 'EXECUTE')
       or has_function_privilege('authenticated', 'public.production_integrity_check()', 'EXECUTE')
       or not has_function_privilege('service_role', 'public.production_integrity_check()', 'EXECUTE') then
        raise exception 'PRODUCTION_INTEGRITY_PRIVILEGES_INVALID';
    end if;

    if to_regprocedure('public.enforce_school_controller_assignment_authorization()') is null then
        raise exception 'SCHOOL_ASSIGNMENT_AUTHORIZATION_FUNCTION_MISSING';
    end if;

    if not exists (
        select 1
          from pg_trigger trigger_definition
          join pg_class relation on relation.oid = trigger_definition.tgrelid
          join pg_namespace relation_schema on relation_schema.oid = relation.relnamespace
         where relation_schema.nspname = 'public'
           and relation.relname = 'schools'
           and trigger_definition.tgname = 'schools_controller_assignment_authorization'
           and not trigger_definition.tgisinternal
    ) then
        raise exception 'SCHOOL_ASSIGNMENT_AUTHORIZATION_TRIGGER_MISSING';
    end if;

    if not exists (
        select 1
          from pg_trigger trigger_definition
          join pg_class relation on relation.oid = trigger_definition.tgrelid
          join pg_namespace relation_schema on relation_schema.oid = relation.relnamespace
         where relation_schema.nspname = 'public'
           and relation.relname = 'registered_invoices'
           and trigger_definition.tgname = 'registered_invoices_delete_unlinked_asset'
           and not trigger_definition.tgisinternal
    ) then
        raise exception 'INVOICE_UNLINKED_ASSET_TRIGGER_MISSING';
    end if;

    if not exists (
        select 1
          from pg_trigger trigger_definition
          join pg_class relation on relation.oid = trigger_definition.tgrelid
          join pg_namespace relation_schema on relation_schema.oid = relation.relnamespace
         where relation_schema.nspname = 'public'
           and relation.relname = 'pendencies'
           and trigger_definition.tgname = 'pendencies_sync_attempt_statuses'
           and not trigger_definition.tgisinternal
    ) then
        raise exception 'PENDENCY_ATTEMPT_SYNC_TRIGGER_MISSING';
    end if;

    if not exists (
        select 1
          from pg_indexes
         where schemaname = 'public'
           and tablename = 'schools'
           and indexname = 'schools_inep_normalized_unique'
    )
       or not exists (
        select 1
          from pg_indexes
         where schemaname = 'public'
           and tablename = 'schools'
           and indexname = 'schools_cnpj_normalized_unique'
    )
       or not exists (
        select 1
          from pg_indexes
         where schemaname = 'public'
           and tablename = 'schools'
           and indexname = 'schools_sici_normalized_unique'
    ) then
        raise exception 'SCHOOL_INSTITUTIONAL_IDENTITY_INDEX_MISSING';
    end if;

    if has_function_privilege('anon', 'public.enforce_school_controller_assignment_authorization()', 'EXECUTE')
       or not has_function_privilege('authenticated', 'public.enforce_school_controller_assignment_authorization()', 'EXECUTE')
       or not has_function_privilege('service_role', 'public.enforce_school_controller_assignment_authorization()', 'EXECUTE') then
        raise exception 'SCHOOL_ASSIGNMENT_AUTHORIZATION_PRIVILEGES_INVALID';
    end if;

    if (select prosecdef from pg_proc where oid = 'public.current_app_role()'::regprocedure)
       or (select prosecdef from pg_proc where oid = 'public.can_access_school(text)'::regprocedure)
       or (select prosecdef from pg_proc where oid = 'public.can_write_school(text)'::regprocedure)
       or (select prosecdef from pg_proc where oid = 'public.delete_invoice_with_effects(text,integer,boolean,integer,jsonb,integer,jsonb)'::regprocedure)
       or (select prosecdef from pg_proc where oid = 'public.production_integrity_check()'::regprocedure)
       or (select prosecdef from pg_proc where oid = 'public.enforce_school_controller_assignment_authorization()'::regprocedure) then
        raise exception 'PUBLIC_SECURITY_DEFINER_STILL_EXPOSED';
    end if;

    if to_regprocedure('radar_private.current_app_role()') is null
       or to_regprocedure('radar_private.can_access_school(text)') is null
       or to_regprocedure('radar_private.can_write_school(text)') is null
       or to_regprocedure('radar_private.delete_invoice_with_effects_impl(text,integer,boolean,integer,jsonb,integer,jsonb)') is null then
        raise exception 'PRIVATE_SECURITY_HELPER_MISSING';
    end if;

    if to_regprocedure('public.inventory_can_access_cre_school(text)') is not null then
        raise exception 'INVENTORY_TRANSIENT_HELPER_STILL_EXPOSED';
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'schools'
          and policyname = 'schools_read'
          and qual ilike '%profile_id = ''inventory''%'
          and qual ilike '%cre_scope%'
    ) then
        raise exception 'INVENTORY_SCHOOL_READ_SCOPE_MISSING';
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'assets'
          and policyname = 'assets_update'
          and coalesce(qual, '') ilike '%inventory%'
          and coalesce(with_check, '') ilike '%inventory%'
    ) then
        raise exception 'INVENTORY_ASSET_UPDATE_SCOPE_MISSING';
    end if;

    if not exists (
        select 1
          from pg_policies
         where schemaname = 'public'
           and tablename = 'administrative_logs'
           and policyname = 'administrative_logs_read'
           and coalesce(qual, '') ilike '%sme_management%'
           and coalesce(qual, '') ilike '%actor_user_id%'
           and coalesce(qual, '') ilike '%auth.uid%'
           and coalesce(qual, '') ilike '%technical_admin%'
    ) then
        raise exception 'SME_OWN_ADMINISTRATIVE_LOG_SCOPE_MISSING';
    end if;

    if not exists (
        select 1
          from pg_policies
         where schemaname = 'public'
           and tablename = 'administrative_logs'
           and policyname = 'administrative_logs_insert'
           and coalesce(with_check, '') ilike '%actor_user_id%'
           and coalesce(with_check, '') ilike '%auth.uid%'
    ) then
        raise exception 'ADMINISTRATIVE_LOG_AUTHORSHIP_POLICY_MISSING';
    end if;

    select pg_get_functiondef('radar_private.can_access_school(text)'::regprocedure)
      into v_access_definition;

    if v_access_definition not ilike '%profile_id = ''inventory''%'
       or v_access_definition not ilike '%join public.assets%'
       or v_access_definition not ilike '%s.cre = up.cre_scope%' then
        raise exception 'INVENTORY_GENERIC_ACCESS_NOT_SCOPED_BY_CRE';
    end if;

    foreach v_version in array v_actual
    loop
        raise notice 'MIGRATION_OK: %', v_version;
    end loop;
end
$$;
