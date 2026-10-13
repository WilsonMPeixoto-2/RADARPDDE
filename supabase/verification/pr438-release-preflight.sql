-- Read-only preflight and backup of affected definitions; no user records exported.
do $$ declare actual text[]; begin
 select array_agg(version order by version) into actual from supabase_migrations.schema_migrations;
 if actual is distinct from array['202607130001','202607130002','202607130003','202607130004','202607130005','202607130006','202607130007','202607130008','202607140009','20260714180621','20260714220136','20260714220146','202607190001','20260720030046','20260720193000','20260721090000','20260721152515','20260721152634','20260721153758','20260721160056','202607220001','202607220002','202607230001','20260723043129','20260728182226','202608040001','202608050001','202608060001','202608060002','202608060003','20260809165500','20260811181312','20260811190712','20260816205046','20260816214535','20260822040642','20260823003500','20260823010000','20260823032000','20260823045000','20260823050000','20260827130000','20260828023000','20260830223000','20260903175000','20260904040000','20260905231000','20260906062000','20260906065000','20260906072000','20260910201500','20260917011723','20260919234500','20260920013656','20260922234500','20260929143215','20260929213000','20260930003000','20261004132755','20261004210000']::text[] then raise exception 'PR438_PRE_MIGRATION_HISTORY_MISMATCH'; end if;
 if exists(select 1 from pg_trigger where tgname in ('assets_protect_inventoried_terminal_delete','registered_invoices_protect_inventoried_delete'))
 or to_regprocedure('radar_private.protect_inventoried_invoice_delete()') is not null then raise exception 'PR438_ALREADY_APPLIED_OR_DRIFT'; end if;
 if exists(select 1 from pg_class where oid in ('public.assets'::regclass,'public.registered_invoices'::regclass) and not relrowsecurity) then raise exception 'PR438_RLS_DISABLED'; end if;
end $$;
select jsonb_build_object(
 'kind','affected_schema_backup_no_operational_data',
 'captured_at',now(),
 'old_function',pg_get_functiondef('radar_private.protect_inventoried_asset_terminal_state()'::regprocedure),
 'old_function_acl',(select proacl::text from pg_proc where oid='radar_private.protect_inventoried_asset_terminal_state()'::regprocedure),
 'triggers',(select jsonb_agg(jsonb_build_object('table',tgrelid::regclass::text,'name',tgname,'enabled',tgenabled,'definition',pg_get_triggerdef(oid))) from pg_trigger where tgrelid in ('public.assets'::regclass,'public.registered_invoices'::regclass) and not tgisinternal),
 'policy_fingerprint',(select md5(string_agg(row_to_json(p)::text,'' order by tablename,policyname)) from pg_policies p where schemaname='public' and tablename in ('assets','registered_invoices')),
 'assets',(select count(*) from public.assets),
 'invoices',(select count(*) from public.registered_invoices),
 'inventoried',(select count(*) from public.assets where status='Inventariada')
) as backup;
