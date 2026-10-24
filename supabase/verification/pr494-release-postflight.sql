begin transaction read only;
do $$
begin
  if (select count(*) from supabase_migrations.schema_migrations) <> 62
     or not exists (select 1 from supabase_migrations.schema_migrations where version='20261024120000')
     or to_regclass('public.quality_provisional_movements') is null then
    raise exception 'PR494_MIGRATION_NOT_APPLIED';
  end if;
  if not (select relrowsecurity from pg_class where oid='public.quality_provisional_movements'::regclass)
     or (select count(*) from pg_policies where schemaname='public' and tablename='quality_provisional_movements') <> 4
     or has_table_privilege('anon','public.quality_provisional_movements','select')
     or has_column_privilege('authenticated','public.quality_provisional_movements','status','update')
     or has_column_privilege('authenticated','public.quality_provisional_movements','school_id','update') then
    raise exception 'PR494_PROVISIONAL_PERMISSIONS_INVALID';
  end if;
  if to_regprocedure('public.identify_quality_provisional_movement(uuid,integer,uuid,jsonb,jsonb,jsonb,integer,integer,integer,jsonb)') is null then
    raise exception 'PR494_IDENTIFICATION_RPC_MISSING';
  end if;
end $$;
select json_build_object(
  'migrationCount',(select count(*) from supabase_migrations.schema_migrations),
  'lastMigration',(select max(version) from supabase_migrations.schema_migrations),
  'provisionalRows',(select count(*) from public.quality_provisional_movements),
  'schools',(select count(*) from public.schools),
  'invoices',(select count(*) from public.registered_invoices),
  'assets',(select count(*) from public.assets),
  'pendencies',(select count(*) from public.pendencies),
  'integrity',public.production_integrity_check()
) as evidence;
rollback;
