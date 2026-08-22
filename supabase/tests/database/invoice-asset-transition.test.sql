begin;
set local role postgres;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(9);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000122', 'invoice-transition@example.test');

insert into public.competences (id, label, exercise, bonus_deadline)
values ('2028-02', 'Fevereiro de 2028', 2028, '2028-03-15');

insert into public.programs (id, name)
values ('TRANS_BASIC', 'Programa transição patrimonial');

insert into public.schools (id, designation, denomination, cre, initial_competence, inep, cnpj, sici)
values (
    '04.99.122',
    '04.99.122',
    'Escola Transição Patrimonial',
    '4ª CRE',
    '2028-02',
    '33009922',
    '90.009.922/0001-41',
    'SICI-TRANSITION-122'
);

insert into public.user_profiles (user_id, profile_id)
values ('00000000-0000-0000-0000-000000000122', 'federal_assistant');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000122', true);

select lives_ok(
    $$
    select public.save_invoice_with_effects(
        p_invoice => jsonb_build_object(
            'id', 'invoice-transition-122',
            'school_id', '04.99.122',
            'competence_id', '2028-02',
            'program_id', 'TRANS_BASIC',
            'source_context_key', '2028-02_TRANS_BASIC',
            'description', 'Notebook',
            'expense_type', 'permanente',
            'invoice_number', 'NF-TRANS-122',
            'amount', 4200
        ),
        p_asset => jsonb_build_object(
            'id', 'asset-transition-122',
            'school_id', '04.99.122',
            'competence_id', '2028-02',
            'description', 'Notebook',
            'expense_type', 'permanente',
            'invoice_number', 'NF-TRANS-122',
            'amount', 4200,
            'status', 'Não encaminhada'
        )
    )
    $$,
    'criação permanente inicial conclui sem erro'
);

select is(
    (select count(*)::integer from public.assets where id = 'asset-transition-122'),
    1,
    'bem patrimonial foi criado'
);

select is(
    (select linked_asset_id from public.registered_invoices where id = 'invoice-transition-122'),
    'asset-transition-122',
    'nota foi vinculada ao bem'
);

select lives_ok(
    $$
    select public.save_invoice_with_effects(
        p_invoice => jsonb_build_object(
            'id', 'invoice-transition-122',
            'school_id', '04.99.122',
            'competence_id', '2028-02',
            'program_id', 'TRANS_BASIC',
            'source_context_key', '2028-02_TRANS_BASIC',
            'description', 'Manutenção elétrica',
            'expense_type', 'servico',
            'invoice_number', 'NF-TRANS-122',
            'amount', 800,
            'linked_asset_id', null
        ),
        p_asset => null,
        p_expected_invoice_version => 1,
        p_expected_asset_version => 1
    )
    $$,
    'mudança de permanente para serviço remove efeito patrimonial atomicamente'
);

select is(
    (select count(*)::integer from public.assets where id = 'asset-transition-122'),
    0,
    'bem derivado foi removido'
);

select is(
    (select linked_asset_id from public.registered_invoices where id = 'invoice-transition-122'),
    null,
    'nota deixou de apontar para o bem removido'
);

select is(
    (select expense_type from public.registered_invoices where id = 'invoice-transition-122'),
    'servico',
    'natureza da nota foi atualizada'
);

select is(
    (select row_version from public.registered_invoices where id = 'invoice-transition-122'),
    2,
    'nota recebeu exatamente um incremento de versão'
);

select throws_ok(
    $$
    select public.save_invoice_with_effects(
        p_invoice => jsonb_build_object(
            'id', 'invoice-transition-122',
            'school_id', '04.99.122',
            'competence_id', '2028-02',
            'program_id', 'TRANS_BASIC',
            'source_context_key', '2028-02_TRANS_BASIC',
            'description', 'Tentativa obsoleta',
            'expense_type', 'consumo',
            'invoice_number', 'NF-TRANS-122',
            'amount', 700
        ),
        p_expected_invoice_version => 1
    )
    $$,
    'P0001',
    'OPTIMISTIC_CONFLICT: registered_invoices/invoice-transition-122',
    'versão obsoleta da nota continua sendo rejeitada'
);

select * from finish();
rollback;
