begin;
set local role postgres;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(7);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000265', 'inventory-terminal@example.test');

insert into public.competences (id, label, exercise, bonus_deadline)
values ('2028-05', 'Maio de 2028', 2028, '2028-06-15');

insert into public.programs (id, name)
values ('TERM_BASIC', 'Programa estado terminal');

insert into public.schools (
    id, designation, denomination, cre, initial_competence, inep, cnpj, sici, inventory_process
) values (
    '04.99.265',
    '04.99.265',
    'Escola Estado Terminal',
    '4ª CRE',
    '2028-05',
    '33009265',
    '90.009.265/0001-41',
    'SICI-TERM-265',
    'PROC-TERM-001'
);

insert into public.verifications (
    id,
    school_id,
    competence_id,
    program_id,
    bonification,
    analysis
) values (
    '04.99.265::2028-05::TERM_BASIC',
    '04.99.265',
    '2028-05',
    'TERM_BASIC',
    '{"encampInventario":"Sim"}'::jsonb,
    '{"encampInventario":"Correto"}'::jsonb
);

insert into public.user_profiles (user_id, profile_id)
values ('00000000-0000-0000-0000-000000000265', 'federal_assistant');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000265', true);

select lives_ok(
    $$
    select public.save_invoice_with_effects(
        p_invoice => jsonb_build_object(
            'id', 'invoice-terminal-265',
            'school_id', '04.99.265',
            'competence_id', '2028-05',
            'program_id', 'TERM_BASIC',
            'verification_id', '04.99.265::2028-05::TERM_BASIC',
            'source_context_key', '2028-05_TERM_BASIC',
            'description', 'Notebook inventariado',
            'expense_type', 'permanente',
            'invoice_number', 'NF-TERM-265',
            'amount', 5000
        ),
        p_asset => jsonb_build_object(
            'id', 'asset-terminal-265',
            'school_id', '04.99.265',
            'competence_id', '2028-05',
            'description', 'Notebook inventariado',
            'expense_type', 'permanente',
            'invoice_number', 'NF-TERM-265',
            'amount', 5000,
            'status', 'Encaminhada',
            'inventory_process', 'PROC-TERM-001'
        )
    )
    $$,
    'fixture cria NF permanente e bem patrimonial vinculados'
);

update public.assets
set status = 'Inventariada',
    inventory_process = 'PROC-TERM-001'
where id = 'asset-terminal-265';

select throws_ok(
    $$
    select public.save_asset_with_verification_and_log(
        p_asset => jsonb_build_object(
            'id', 'asset-terminal-265',
            'school_id', '04.99.265',
            'status', 'Encaminhada',
            'inventory_process', 'PROC-TERM-001'
        ),
        p_expected_asset_version => (select row_version from public.assets where id = 'asset-terminal-265'),
        p_verification => jsonb_build_object(
            'id', '04.99.265::2028-05::TERM_BASIC',
            'school_id', '04.99.265',
            'competence_id', '2028-05',
            'program_id', 'TERM_BASIC',
            'bonification', jsonb_build_object('encampInventario', 'Sim'),
            'analysis', jsonb_build_object('encampInventario', 'Não analisado'),
            'payload', '{}'::jsonb
        ),
        p_expected_verification_version => (select row_version from public.verifications where id = '04.99.265::2028-05::TERM_BASIC'),
        p_administrative_log => jsonb_build_object(
            'id', 'log-terminal-reforward-265',
            'school_id', '04.99.265',
            'user_identifier', 'Assistente de teste',
            'profile_name', 'Assistente',
            'action', 'Capital Encaminhado',
            'details', jsonb_build_object('asset', 'asset-terminal-265'),
            'event_at', '2028-05-20T12:00:00Z'
        )
    )
    $$,
    'P0001',
    'ASSET_ALREADY_INVENTORIED: assets/asset-terminal-265',
    'RPC de encaminhamento recusa bem já Inventariado'
);

select is(
    (select status from public.assets where id = 'asset-terminal-265'),
    'Inventariada',
    'encaminhamento recusado preserva o estado patrimonial terminal'
);

select is(
    (select count(*)::integer from public.administrative_logs where id = 'log-terminal-reforward-265'),
    0,
    'encaminhamento recusado não cria histórico falso'
);

-- Restaura explicitamente a fixture para que o segundo cenário seja independente
-- mesmo durante a fase RED, em que a primeira RPC ainda aceita a regressão.
update public.assets
set status = 'Inventariada',
    inventory_process = 'PROC-TERM-001'
where id = 'asset-terminal-265';

select throws_ok(
    $$
    select public.save_invoice_with_effects(
        p_invoice => jsonb_build_object(
            'id', 'invoice-terminal-265',
            'school_id', '04.99.265',
            'competence_id', '2028-05',
            'program_id', 'TERM_BASIC',
            'verification_id', '04.99.265::2028-05::TERM_BASIC',
            'source_context_key', '2028-05_TERM_BASIC',
            'description', 'Notebook inventariado',
            'expense_type', 'permanente',
            'invoice_number', 'NF-TERM-265',
            'amount', 5000
        ),
        p_asset => jsonb_build_object(
            'id', 'asset-terminal-265',
            'school_id', '04.99.265',
            'competence_id', '2028-05',
            'description', 'Notebook inventariado',
            'expense_type', 'permanente',
            'invoice_number', 'NF-TERM-265',
            'amount', 5000,
            'status', 'Encaminhada',
            'inventory_process', 'PROC-TERM-001'
        ),
        p_expected_invoice_version => (select row_version from public.registered_invoices where id = 'invoice-terminal-265'),
        p_expected_asset_version => (select row_version from public.assets where id = 'asset-terminal-265'),
        p_administrative_log => jsonb_build_object(
            'id', 'log-terminal-invoice-265',
            'school_id', '04.99.265',
            'user_identifier', 'Assistente de teste',
            'profile_name', 'Assistente',
            'action', 'Gasto Permanente Atualizado',
            'details', jsonb_build_object('invoice', 'invoice-terminal-265'),
            'event_at', '2028-05-20T13:00:00Z'
        )
    )
    $$,
    'P0001',
    'ASSET_ALREADY_INVENTORIED: assets/asset-terminal-265',
    'RPC de Nota Fiscal também recusa rebaixar bem já Inventariado'
);

select is(
    (select status from public.assets where id = 'asset-terminal-265'),
    'Inventariada',
    'salvamento de NF recusado preserva o estado patrimonial terminal'
);

select is(
    (select count(*)::integer from public.administrative_logs where id = 'log-terminal-invoice-265'),
    0,
    'salvamento de NF recusado não cria histórico falso'
);

select * from finish();
rollback;
