-- Somente leitura; não aplica schema, fixtures ou correções de dados.
begin transaction read only;
do $$
begin
  if (select count(*) from supabase_migrations.schema_migrations) <> 61
     or (select max(version) from supabase_migrations.schema_migrations) <> '20261011193500'
     or to_regclass('public.quality_provisional_movements') is not null then
    raise exception 'PR494_BASELINE_MISMATCH';
  end if;
  if to_regprocedure('radar_private.save_invoice_with_effects_v2_impl(uuid,jsonb,jsonb,jsonb,integer,integer,integer,jsonb)') is null then
    raise exception 'PR494_CANONICAL_INVOICE_RPC_MISSING';
  end if;
end $$;
select json_build_object(
  'migrationCount',(select count(*) from supabase_migrations.schema_migrations),
  'lastMigration',(select max(version) from supabase_migrations.schema_migrations),
  'serverVersion',current_setting('server_version'),
  'schools',(select count(*) from public.schools),
  'invoices',(select count(*) from public.registered_invoices),
  'assets',(select count(*) from public.assets),
  'pendencies',(select count(*) from public.pendencies),
  'integrity',public.production_integrity_check()
) as evidence;
rollback;
