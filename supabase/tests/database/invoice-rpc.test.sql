begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(15);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000101', 'rpc-user@example.test');

insert into public.competences (id, label, exercise, bonus_deadline)
values ('2028-01', 'Janeiro de 2028', 2028, '2028-02-15');

insert into public.programs (id, name)
values ('RPC_BASIC', 'Programa de teste RPC');

insert into public.schools (id, designation, denomination, cre, initial_competence)
values ('04.99.101', '04.99.101', 'Escola RPC', '4ª CRE', '2028-01');

insert into public.verifications (
    id,
    school_id,
    competence_id,
    program_id,
    bonification,
    analysis
) values (
    '04.99.101::2028-01::RPC_BASIC',
    '04.99.101',
    '2028-01',
    'RPC_BASIC',
    '{}'::jsonb,
    '{"notas":"Não analisado"}'::jsonb
);

insert into public.user_profiles (user_id, profile_id)
values ('00000000-0000-0000-0000-000000000101', 'federal_assistant');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);

select lives_ok(
    $$
    select public.save_invoice_with_effects(
        p_invoice => jsonb_build_object(
            'id', 'invoice-pgtap',
            'school_id', '04.99.101',
            'competence_id', '2028-01',
            'program_id', 'RPC_BASIC',
            'verification_id', '04.99.101::2028-01::RPC_BASIC',
            'source_context_key', '2028-01_RPC_BASIC',
            'description', 'Notebook',
            'expense_type', 'permanente',
            'invoice_number', 'NF-PGTAP-1',
            'amount', 5000,
            'registered_at', '2028-01-10T12:00:00Z'
        ),
        p_asset => jsonb_build_object(
            'id', 'asset-pgtap',
            'school_id', '04.99.101',
            'competence_id', '2028-01',
            'description', 'Notebook',
            'expense_type', 'permanente',
            'invoice_number', 'NF-PGTAP-1',
            'amount', 5000,
            'status', 'Não encaminhada'
        ),
        p_verification_patch => jsonb_build_object(
            'id', '04.99.101::2028-01::RPC_BASIC',
            'analysis', jsonb_build_object('notas', 'Correto')
        ),
        p_expected_verification_version => 1,
        p_administrative_log => jsonb_build_object(
            'id', 'log-invoice-create',
            'user_identifier', 'Assistente de teste',
            'profile_name', 'Assistente',
            'action', 'Gasto Permanente Cadastrado',
            'details', jsonb_build_object('invoice', 'invoice-pgtap'),
            'event_at', '2028-01-10T12:00:00Z'
        )
    )
    $$,
    'salvamento composto inicial conclui sem erro'
);

select is((select count(*)::integer from public.registered_invoices where id = 'invoice-pgtap'), 1, 'nota foi criada');
select is((select count(*)::integer from public.assets where id = 'asset-pgtap'), 1, 'bem foi criado');
select is((select linked_asset_id from public.registered_invoices where id = 'invoice-pgtap'), 'asset-pgtap', 'nota foi vinculada ao bem');
select is((select analysis ->> 'notas' from public.verifications where id = '04.99.101::2028-01::RPC_BASIC'), 'Correto', 'análise foi atualizada atomicamente');
select is((select count(*)::integer from public.administrative_logs where id = 'log-invoice-create'), 1, 'auditoria da criação foi gravada na mesma RPC');

select lives_ok(
    $$
    select public.save_invoice_with_effects(
        p_invoice => jsonb_build_object(
            'id', 'invoice-pgtap',
            'school_id', '04.99.101',
            'competence_id', '2028-01',
            'program_id', 'RPC_BASIC',
            'verification_id', '04.99.101::2028-01::RPC_BASIC',
            'source_context_key', '2028-01_RPC_BASIC',
            'description', 'Notebook atualizado',
            'expense_type', 'permanente',
            'invoice_number', 'NF-PGTAP-1',
            'amount', 5500
        ),
        p_asset => jsonb_build_object(
            'id', 'asset-pgtap',
            'school_id', '04.99.101',
            'competence_id', '2028-01',
            'description', 'Notebook atualizado',
            'expense_type', 'permanente',
            'invoice_number', 'NF-PGTAP-1',
            'amount', 5500,
            'status', 'Encaminhada'
        ),
        p_verification_patch => jsonb_build_object(
            'id', '04.99.101::2028-01::RPC_BASIC',
            'analysis', jsonb_build_object('notas', 'Correto após o prazo')
        ),
        p_expected_invoice_version => 1,
        p_expected_asset_version => 1,
        p_expected_verification_version => 2
    )
    $$,
    'atualização composta respeita versões atuais'
);

select is((select row_version from public.registered_invoices where id = 'invoice-pgtap'), 2, 'versão da nota foi incrementada');
select is((select row_version from public.assets where id = 'asset-pgtap'), 2, 'versão do bem foi incrementada');
select is((select row_version from public.verifications where id = '04.99.101::2028-01::RPC_BASIC'), 3, 'versão da verificação foi incrementada');

select throws_ok(
    $$
    select public.save_invoice_with_effects(
        p_invoice => jsonb_build_object(
            'id', 'invoice-pgtap',
            'school_id', '04.99.101',
            'description', 'Versão obsoleta',
            'expense_type', 'permanente',
            'invoice_number', 'NF-PGTAP-1',
            'amount', 5500
        ),
        p_expected_invoice_version => 1
    )
    $$,
    'P0001',
    'OPTIMISTIC_CONFLICT: registered_invoices/invoice-pgtap',
    'versão obsoleta é rejeitada'
);

select lives_ok(
    $$
    select public.delete_invoice_with_effects(
        p_invoice_id => 'invoice-pgtap',
        p_expected_invoice_version => 2,
        p_delete_linked_asset => true,
        p_expected_asset_version => 2,
        p_verification_patch => jsonb_build_object(
            'analysis', jsonb_build_object('notas', 'Não analisado')
        ),
        p_expected_verification_version => 3,
        p_administrative_log => jsonb_build_object(
            'id', 'log-invoice-delete',
            'user_identifier', 'Assistente de teste',
            'profile_name', 'Assistente',
            'action', 'Nota Fiscal Removida',
            'details', jsonb_build_object('invoice', 'invoice-pgtap'),
            'event_at', '2028-01-11T12:00:00Z'
        )
    )
    $$,
    'remoção composta conclui para perfil operacional com escrita na escola'
);

select is((select count(*)::integer from public.registered_invoices where id = 'invoice-pgtap'), 0, 'nota foi removida');
select is((select count(*)::integer from public.assets where id = 'asset-pgtap'), 0, 'bem vinculado foi removido');
select is((select count(*)::integer from public.administrative_logs where id = 'log-invoice-delete'), 1, 'auditoria da remoção foi gravada na mesma RPC');

select * from finish();
rollback;
