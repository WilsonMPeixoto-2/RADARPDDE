begin;
set local role postgres;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(4);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000193', 'invoice-bonus-clear@example.test');

insert into public.competences (id, label, exercise, bonus_deadline)
values ('2028-09', 'Setembro de 2028', 2028, '2028-10-15');

insert into public.programs (id, name)
values ('BONUS_CLEAR', 'Programa teste limpeza consolidação');

insert into public.schools (id, designation, denomination, cre, initial_competence, inep, cnpj, sici)
values (
    '04.99.193',
    '04.99.193',
    'Escola teste limpeza consolidação',
    '4ª CRE',
    '2028-09',
    '33990193',
    '90.019.300/0001-93',
    'SICI-BONUS-CLEAR'
);

insert into public.verifications (
    id,
    school_id,
    competence_id,
    program_id,
    bonification,
    analysis,
    bonus_result
) values (
    '04.99.193::2028-09::BONUS_CLEAR',
    '04.99.193',
    '2028-09',
    'BONUS_CLEAR',
    '{"notaFiscal":"Sim"}'::jsonb,
    '{"notaFiscal":"Correto"}'::jsonb,
    'apta'
);

insert into public.user_profiles (user_id, profile_id)
values ('00000000-0000-0000-0000-000000000193', 'federal_assistant');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000193', true);

select lives_ok(
    $$
    select public.save_invoice_with_effects(
        p_invoice => jsonb_build_object(
            'id', 'invoice-bonus-clear',
            'school_id', '04.99.193',
            'competence_id', '2028-09',
            'program_id', 'BONUS_CLEAR',
            'verification_id', '04.99.193::2028-09::BONUS_CLEAR',
            'source_context_key', '2028-09_BONUS_CLEAR',
            'description', 'Despesa de teste',
            'expense_type', 'consumo',
            'invoice_number', 'NF-CLEAR-1',
            'amount', 100
        ),
        p_verification_patch => jsonb_build_object(
            'id', '04.99.193::2028-09::BONUS_CLEAR',
            'analysis', jsonb_build_object('notaFiscal', 'Correto')
        ),
        p_expected_verification_version => 1
    )
    $$,
    'patch sem bonus_result preserva a consolidação'
);

select is(
    (select bonus_result from public.verifications where id = '04.99.193::2028-09::BONUS_CLEAR'),
    'apta',
    'campo bonus_result ausente preserva o valor existente'
);

select lives_ok(
    $$
    select public.save_invoice_with_effects(
        p_invoice => jsonb_build_object(
            'id', 'invoice-bonus-clear',
            'school_id', '04.99.193',
            'competence_id', '2028-09',
            'program_id', 'BONUS_CLEAR',
            'verification_id', '04.99.193::2028-09::BONUS_CLEAR',
            'source_context_key', '2028-09_BONUS_CLEAR',
            'description', 'Despesa de teste alterada',
            'expense_type', 'consumo',
            'invoice_number', 'NF-CLEAR-1',
            'amount', 100
        ),
        p_verification_patch => jsonb_build_object(
            'id', '04.99.193::2028-09::BONUS_CLEAR',
            'analysis', jsonb_build_object('notaFiscal', 'Correto'),
            'bonus_result', ''
        ),
        p_expected_invoice_version => 1,
        p_expected_verification_version => 2
    )
    $$,
    'patch com bonus_result vazio representa reabertura explícita'
);

select is(
    (select bonus_result from public.verifications where id = '04.99.193::2028-09::BONUS_CLEAR'),
    null,
    'campo bonus_result presente e vazio limpa a consolidação'
);

select * from finish();
rollback;
