begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(9);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000701', 'invoice-idempotency@example.test');
insert into public.user_profiles (user_id, profile_id)
values ('00000000-0000-0000-0000-000000000701', 'federal_assistant');
insert into public.competences (id, label, exercise, bonus_deadline)
values ('2032-01', 'Janeiro de 2032', 2032, '2032-02-15');
insert into public.programs (id, name)
values ('IDEMP_BASIC', 'Programa Idempotência');
insert into public.schools (id, designation, denomination, cre, initial_competence, inep, cnpj, sici)
values ('04.99.701', '04.99.701', 'Escola Idempotência', '4ª CRE', '2032-01', '33007701', '90.007.701/0001-00', 'SICI-IDEMP-701');
insert into public.verifications (id, school_id, competence_id, program_id, bonification, analysis)
values ('04.99.701::2032-01::IDEMP_BASIC', '04.99.701', '2032-01', 'IDEMP_BASIC', '{}'::jsonb, '{}'::jsonb);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000701', true);

create temporary table first_result(value jsonb);
insert into first_result
select public.save_invoice_with_effects_v2(
    p_operation_key => '11111111-2222-4333-8444-555555555555'::uuid,
    p_invoice => jsonb_build_object(
        'id', 'invoice-idempotent-a',
        'school_id', '04.99.701',
        'competence_id', '2032-01',
        'program_id', 'IDEMP_BASIC',
        'verification_id', '04.99.701::2032-01::IDEMP_BASIC',
        'source_context_key', '2032-01_IDEMP_BASIC',
        'description', 'Material idempotente',
        'expense_type', 'consumo',
        'invoice_number', 'NF-IDEMP-1',
        'amount', 250,
        'registered_at', '2032-01-10T12:00:00Z'
    ),
    p_verification_patch => jsonb_build_object(
        'id', '04.99.701::2032-01::IDEMP_BASIC',
        'analysis', '{}'::jsonb
    ),
    p_expected_verification_version => 1,
    p_administrative_log => jsonb_build_object(
        'id', 'log-idempotent-a',
        'action', 'Gasto Consumo Cadastrado',
        'details', jsonb_build_object('invoice', 'invoice-idempotent-a'),
        'event_at', '2032-01-10T12:00:00Z'
    )
);

create temporary table retry_result(value jsonb);
insert into retry_result
select public.save_invoice_with_effects_v2(
    p_operation_key => '11111111-2222-4333-8444-555555555555'::uuid,
    p_invoice => jsonb_build_object(
        'id', 'invoice-idempotent-a',
        'school_id', '04.99.701',
        'competence_id', '2032-01',
        'program_id', 'IDEMP_BASIC',
        'verification_id', '04.99.701::2032-01::IDEMP_BASIC',
        'source_context_key', '2032-01_IDEMP_BASIC',
        'description', 'Material idempotente',
        'expense_type', 'consumo',
        'invoice_number', 'NF-IDEMP-1',
        'amount', 250,
        'registered_at', '2032-01-10T12:00:00Z'
    ),
    p_verification_patch => jsonb_build_object(
        'id', '04.99.701::2032-01::IDEMP_BASIC',
        'analysis', '{}'::jsonb
    ),
    p_expected_verification_version => 1,
    p_administrative_log => jsonb_build_object(
        'id', 'log-idempotent-a',
        'action', 'Gasto Consumo Cadastrado',
        'details', jsonb_build_object('invoice', 'invoice-idempotent-a'),
        'event_at', '2032-01-10T12:00:00Z'
    )
);

select is((select count(*)::integer from public.registered_invoices where id = 'invoice-idempotent-a'), 1, 'retry não cria segunda Nota Fiscal');
select is((select count(*)::integer from public.administrative_logs where id = 'log-idempotent-a'), 1, 'retry não cria segundo log');
select is((select value from first_result), (select value from retry_result), 'retry devolve exatamente o resultado persistido');
select ok((select value ? 'administrative_log' from first_result), 'resultado v2 inclui log persistido');
select ok((select value ? 'changed_entities' from first_result), 'resultado v2 informa entidades para reconciliação');

select throws_like(
    $$select public.save_invoice_with_effects_v2(
        p_operation_key => '11111111-2222-4333-8444-555555555555'::uuid,
        p_invoice => jsonb_build_object(
            'id', 'invoice-idempotent-a',
            'school_id', '04.99.701',
            'description', 'PAYLOAD DIFERENTE',
            'expense_type', 'consumo',
            'invoice_number', 'NF-IDEMP-1',
            'amount', 999
        )
    )$$,
    'IDEMPOTENCY_CONFLICT:%',
    'mesma chave com payload diferente é rejeitada'
);

select lives_ok(
    $$select public.save_invoice_with_effects_v2(
        p_operation_key => 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'::uuid,
        p_invoice => jsonb_build_object(
            'id', 'invoice-idempotent-b',
            'school_id', '04.99.701',
            'competence_id', '2032-01',
            'program_id', 'IDEMP_BASIC',
            'source_context_key', '2032-01_IDEMP_BASIC',
            'description', 'Material idempotente',
            'expense_type', 'consumo',
            'invoice_number', 'NF-IDEMP-1',
            'amount', 250,
            'registered_at', '2032-01-10T12:00:00Z'
        ),
        p_administrative_log => jsonb_build_object(
            'id', 'log-idempotent-b',
            'action', 'Gasto Consumo Cadastrado',
            'details', jsonb_build_object('invoice', 'invoice-idempotent-b'),
            'event_at', '2032-01-10T12:00:00Z'
        )
    )$$,
    'outra intenção com conteúdo equivalente continua permitida'
);
select is((select count(*)::integer from public.registered_invoices where id in ('invoice-idempotent-a','invoice-idempotent-b')), 2, 'duas intenções distintas preservam duas despesas legítimas');
select is((select count(*)::integer from radar_private.invoice_operation_idempotency where actor_user_id = '00000000-0000-0000-0000-000000000701'), 2, 'storage privado registra uma linha por intenção do ator');

select * from finish();
rollback;
