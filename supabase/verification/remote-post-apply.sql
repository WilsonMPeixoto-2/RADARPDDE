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
        '20260720193000'
    ];
    v_actual text[];
    v_missing_extensions text[];
    v_version text;
begin
    select coalesce(array_agg(version order by version), array[]::text[])
      into v_actual
      from supabase_migrations.schema_migrations;

    if v_actual is distinct from v_expected then
        raise exception 'MIGRATION_HISTORY_MISMATCH: esperado %, recebido %', v_expected, v_actual;
    end if;

    select array_agg(required.name order by required.name)
      into v_missing_extensions
      from (values ('pgcrypto'), ('pg_jsonschema')) as required(name)
     where not exists (
        select 1
          from pg_extension installed
         where installed.extname = required.name
     );

    if v_missing_extensions is not null then
        raise exception 'EXTENSION_NOT_INSTALLED: %', array_to_string(v_missing_extensions, ', ');
    end if;

    if to_regprocedure('public.upsert_team_member_account(jsonb,uuid,text,uuid,jsonb)') is null
       or to_regprocedure('public.deactivate_controller_account(text,text,uuid,jsonb)') is null
       or to_regprocedure('public.deactivate_inventory_member_account(text,uuid,jsonb)') is null then
        raise exception 'TEAM_ACCOUNT_CONTRACT_MISSING';
    end if;

    if has_function_privilege(
        'authenticated',
        'public.upsert_team_member_account(jsonb,uuid,text,uuid,jsonb)',
        'EXECUTE'
    ) then
        raise exception 'TEAM_ACCOUNT_RPC_EXPOSED_TO_AUTHENTICATED';
    end if;

    foreach v_version in array v_actual
    loop
        raise notice 'MIGRATION_OK: %', v_version;
    end loop;
end
$$;
