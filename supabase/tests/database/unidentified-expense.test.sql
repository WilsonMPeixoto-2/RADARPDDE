begin;
set local role postgres;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(5);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000179', 'unidentified-expense@example.test');

insert into public.competences (id, label, exercise, bonus_deadline)
values ('2028-08', 'Agosto de 2028', 2028, '2028-09-15');

insert into public.programs (id, name)
values ('UNIDENTIFIED_BASIC', 'Programa teste despesa a identificar');

insert into public.schools (id, designation, denomination, cre, initial_competence, inep, cnpj, sici)
values ('04.99.179', '04.99.179', 'Escola Despesa a Identificar', '4ª CRE', '2028-08', '33008179', '90.008.179/0001-31', 'SICI-UNIDENTIFIED-179');

insert into public.user_profiles (user_id, profile_id)
values ('00000000-0000-0000-0000-000000000179', 'federal_assistant');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000179', true);

select lives_ok(
    $$
    select public.save_invoice_with_effects(
        p_invoice => jsonb_build_object(
            'id', 'expense-unidentified-pgtap',
            'school_id', '04.99.179',
            'competence_id', '2028-08',
            'program_id', 'UNIDENTIFIED_BASIC',
            'source_context_key', '2028-08_UNIDENTIFIED_BASIC',
            'description', 'Saída observada no extrato',
            'expense_type', 'a_identificar',
            'invoice_number', '',
            'amount', 850,
            'registered_at', '2028-08-10T12:00:00Z'
        )
    )
    $$,
    'RPC aceita despesa a identificar sem número da Nota Fiscal'
);

select is(
    (select expense_type from public.registered_invoices where id = 'expense-unidentified-pgtap'),
    'a_identificar',
    'tipo provisório é preservado'
);

select is(
    (select invoice_number from public.registered_invoices where id = 'expense-unidentified-pgtap'),
    null,
    'ausência de Nota Fiscal é persistida como NULL'
);

select throws_like(
    $$
    insert into public.registered_invoices (
        id, school_id, competence_id, program_id, description, expense_type, invoice_number, amount
    ) values (
        'expense-invalid-pgtap', '04.99.179', '2028-08', 'UNIDENTIFIED_BASIC',
        'Consumo sem NF', 'consumo', null, 100
    )
    $$,
    'VALIDATION_ERROR:%',
    'tipo definitivo continua exigindo número da Nota Fiscal'
);

select throws_like(
    $$
    insert into public.registered_invoices (
        id, school_id, competence_id, program_id, description, expense_type, invoice_number, amount
    ) values (
        'expense-placeholder-pgtap', '04.99.179', '2028-08', 'UNIDENTIFIED_BASIC',
        'Consumo com placeholder', 'consumo', 'SEM-NÚMERO', 100
    )
    $$,
    'VALIDATION_ERROR:%',
    'placeholder legado não é aceito como número real'
);

select * from finish();
rollback;
