-- Caracterização #410. Somente metadados e contagens; nenhum dado operacional individual.
-- Projeto verificado: scnryinorqeucbfkioxo. Não executar DDL ou testes destrutivos aqui.
select jsonb_build_object(
'observed_at', now(),
'migrations', (select jsonb_build_object('count', count(*), 'latest', max(version)) from supabase_migrations.schema_migrations),
'rpc', (select jsonb_build_object('signature', p.oid::regprocedure::text, 'body_md5', md5(p.prosrc), 'security_definer', p.prosecdef, 'settings', p.proconfig) from pg_proc p where p.oid=to_regprocedure('public.read_operational_context(text,text[])')),
'links', jsonb_build_object(
'invoice_asset', (select jsonb_build_object('total',count(*),'cross_school',count(*) filter(where i.school_id is distinct from a.school_id)) from public.registered_invoices i join public.assets a on a.id=i.linked_asset_id),
'invoice_verification', (select jsonb_build_object('total',count(*),'cross_school',count(*) filter(where i.school_id is distinct from v.school_id),'different_context',count(*) filter(where (i.school_id,i.competence_id,i.program_id) is distinct from (v.school_id,v.competence_id,v.program_id))) from public.registered_invoices i join public.verifications v on v.id=i.verification_id),
'pendency_invoice', (select jsonb_build_object('total',count(*),'cross_school',count(*) filter(where p.school_id is distinct from i.school_id)) from public.pendencies p join public.registered_invoices i on i.id=p.registered_invoice_id),
'contact_parent', (select jsonb_build_object('total',count(*),'cross_school',count(*) filter(where c.school_id is distinct from p.school_id)) from public.pendency_contacts c join public.pendencies p on p.id=c.pendency_id),
'contacts_without_parent', (select count(*) from public.pendency_contacts where pendency_id is null)
),
'relation_foreign_keys',(select jsonb_agg(jsonb_build_object('relation', c.conrelid::regclass::text, 'name',c.conname,'definition',pg_get_constraintdef(c.oid)) order by c.conrelid::regclass::text,c.conname) from pg_constraint c where c.contype='f' and c.conrelid in ('public.verifications'::regclass,'public.registered_invoices'::regclass,'public.pendencies'::regclass,'public.pendency_attempts'::regclass,'public.pendency_contacts'::regclass,'public.assets'::regclass) and c.confrelid in ('public.schools'::regclass,'public.verifications'::regclass,'public.registered_invoices'::regclass,'public.pendencies'::regclass,'public.assets'::regclass))
) as characterization;
