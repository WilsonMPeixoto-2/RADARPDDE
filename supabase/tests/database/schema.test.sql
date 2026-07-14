begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(12);

select has_table('public', 'schools', 'schools existe');
select has_table('public', 'registered_invoices', 'registered_invoices existe');
select has_table('public', 'assets', 'assets existe');
select has_table('public', 'verifications', 'verifications existe');
select has_table('public', 'audit_events', 'audit_events existe');
select has_column('public', 'registered_invoices', 'linked_asset_id', 'nota possui vínculo com bem');
select has_column('public', 'registered_invoices', 'row_version', 'nota possui controle de versão');
select has_column('public', 'assets', 'inventoried_by_member_id', 'bem possui inventariador');
select has_column('public', 'competences', 'bonus_deadline', 'competência possui prazo de bonificação');
select ok(
    to_regprocedure('public.save_invoice_with_effects(jsonb,jsonb,jsonb,integer,integer,integer)') is not null,
    'RPC atômica de salvamento existe'
);
select ok(
    to_regprocedure('public.delete_invoice_with_effects(text,integer,boolean,integer,jsonb,integer)') is not null,
    'RPC atômica de remoção existe'
);
select ok(
    (select count(*) = 8 from supabase_migrations.schema_migrations),
    'oito migrations foram registradas'
);

select * from finish();
rollback;
