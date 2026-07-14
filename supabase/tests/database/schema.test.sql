begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(19);

select has_table('public', 'schools', 'schools existe');
select has_table('public', 'registered_invoices', 'registered_invoices existe');
select has_table('public', 'assets', 'assets existe');
select has_table('public', 'verifications', 'verifications existe');
select has_table('public', 'audit_events', 'audit_events existe');
select has_column('public', 'registered_invoices', 'linked_asset_id', 'nota possui vínculo com bem');
select has_column('public', 'registered_invoices', 'row_version', 'nota possui controle de versão');
select has_column('public', 'assets', 'inventoried_by_member_id', 'bem possui inventariador');
select has_column('public', 'competences', 'bonus_deadline', 'competência possui prazo de bonificação');
select has_column('public', 'verifications', 'payload', 'verificação preserva extensões auditáveis');
select ok(
    to_regprocedure('public.save_invoice_with_effects(jsonb,jsonb,jsonb,integer,integer,integer,jsonb)') is not null,
    'RPC atômica de salvamento existe'
);
select ok(
    to_regprocedure('public.delete_invoice_with_effects(text,integer,boolean,integer,jsonb,integer,jsonb)') is not null,
    'RPC atômica de remoção existe'
);
select has_table('public', 'data_import_staging', 'staging de importação existe');
select ok(to_regprocedure('public.save_exercise_with_competences(jsonb,jsonb,jsonb)') is not null, 'RPC de exercício existe');
select ok(to_regprocedure('public.save_school_with_programs(jsonb,jsonb,integer,jsonb)') is not null, 'RPC de escola existe');
select ok(to_regprocedure('public.reanalyze_pendency_with_verification(jsonb,jsonb,jsonb,integer,integer,jsonb)') is not null, 'RPC de reanálise existe');
select ok(to_regprocedure('public.promote_data_import(text,text,jsonb,jsonb)') is not null, 'RPC de promoção existe');
select ok(to_regprocedure('public.rollback_data_import(text)') is not null, 'RPC de rollback existe');
select ok(
    (select count(*) = 12 from supabase_migrations.schema_migrations),
    'doze migrations foram registradas'
);

select * from finish();
rollback;
