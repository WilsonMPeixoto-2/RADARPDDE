-- One SELECT, executed by CLI 3.2.0 in BEGIN READ ONLY / ROLLBACK via Session pooler.
-- Only catalog metadata, aggregate integrity counts and opaque fingerprints leave the DB.
with expected(signature) as (
  values
    ('public.apply_operational_change(jsonb,text,uuid)'),
    ('radar_private.apply_operational_change_impl(jsonb,text,uuid)'),
    ('radar_private.apply_operational_change_impl_r4(jsonb,text,uuid)'),
    ('radar_private.operational_correction_build_plan_r2(jsonb)')
), routines as (
  select e.signature, p.oid is not null as present,
    pg_get_userbyid(p.proowner) as owner,
    p.prosecdef as security_definer, p.provolatile::text as volatility,
    pg_get_function_result(p.oid) as result_type,
    p.proconfig as settings,
    encode(sha256(convert_to(p.prosrc, 'UTF8')), 'hex') as body_sha256,
    has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
    has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_execute,
    exists (
      select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
      where a.grantee = 0 and a.privilege_type = 'EXECUTE'
    ) as public_execute
  from expected e
  left join pg_proc p on p.oid = to_regprocedure(e.signature)
)
select jsonb_build_object(
  'schemaVersion', 1,
  'database', current_database(),
  'transactionReadOnly', current_setting('transaction_read_only') = 'on',
  'serverVersionNum', current_setting('server_version_num')::integer,
  'migrations', (
    select jsonb_agg(jsonb_build_object('version', version, 'name', name) order by version)
    from supabase_migrations.schema_migrations
  ),
  'functions', (select jsonb_agg(to_jsonb(r) order by signature) from routines r),
  'integrity', public.production_integrity_check(),
  'baselineIssueIdsSha256', (
    select encode(sha256(convert_to(coalesce(string_agg(id::text, ',' order by id::text), ''), 'UTF8')), 'hex')
    from public.registered_invoices
    where expense_type = 'permanente' and linked_asset_id is null
  )
) as contract;
