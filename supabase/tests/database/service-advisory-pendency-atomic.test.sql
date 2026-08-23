begin;
set local role postgres;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(9);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000196', 'advisory-atomic-admin@example.test');
insert into public.user_profiles (user_id, profile_id, cre_scope)
values ('00000000-0000-0000-0000-000000000196', 'technical_admin', null);
insert into public.competences (id, label, exercise, bonus_deadline)
values ('2028-12', 'Dezembro de 2028', 2028, '2029-01-15');
insert into public.programs (id, name)
values ('ADVISORY_ATOMIC', 'Programa teste Assessoria atômica');
insert into public.schools (id, designation, denomination, cre, initial_competence, inep, cnpj, sici)
values ('04.99.196', '04.99.196', 'Escola Assessoria Atômica', '4ª CRE', '2028-12', '33990196', '90.019.600/0001-96', 'SICI-ADVISORY-196');
insert into public.verifications (id, school_id, competence_id, program_id, bonification, analysis, payload)
values (
    '04.99.196::2028-12::ADVISORY_ATOMIC', '04.99.196', '2028-12', 'ADVISORY_ATOMIC',
    '{"consAssessoria":"Não","consEnviada":false}'::jsonb,
    '{"consAssessoria":"Não analisado"}'::jsonb,
    '{}'::jsonb
);
insert into public.registered_invoices (
    id, school_id, competence_id, program_id, verification_id, source_context_key,
    description, expense_type, invoice_number, amount, payload
) values
(
    'invoice-advisory-a', '04.99.196', '2028-12', 'ADVISORY_ATOMIC',
    '04.99.196::2028-12::ADVISORY_ATOMIC', '2028-12_ADVISORY_ATOMIC',
    'Serviço A', 'servico', 'NF-A', 300,
    '{"consultaAssessoriaEnviada":false,"analiseConsultaAssessoria":"Não analisado"}'::jsonb
),
(
    'invoice-advisory-b', '04.99.196', '2028-12', 'ADVISORY_ATOMIC',
    '04.99.196::2028-12::ADVISORY_ATOMIC', '2028-12_ADVISORY_ATOMIC',
    'Serviço B', 'servico', 'NF-B', 400,
    '{"consultaAssessoriaEnviada":false,"analiseConsultaAssessoria":"Não analisado"}'::jsonb
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000196', true);

select lives_ok($$
    select public.save_service_advisory_with_pendency(
        '{"id":"invoice-advisory-a","school_id":"04.99.196","competence_id":"2028-12","program_id":"ADVISORY_ATOMIC","verification_id":"04.99.196::2028-12::ADVISORY_ATOMIC","source_context_key":"2028-12_ADVISORY_ATOMIC","linked_asset_id":null,"description":"Serviço A","expense_type":"servico","invoice_number":"NF-A","amount":300,"payload":{"consultaAssessoriaEnviada":false,"analiseConsultaAssessoria":"Incorreto"}}'::jsonb,
        1,
        '{"id":"04.99.196::2028-12::ADVISORY_ATOMIC","school_id":"04.99.196","competence_id":"2028-12","program_id":"ADVISORY_ATOMIC","bonification":{"consAssessoria":"Não","consEnviada":false},"analysis":{"consAssessoria":"Incorreto"},"payload":{}}'::jsonb,
        1,
        '{"id":"pendency-advisory-a","school_id":"04.99.196","competence_origin":"2028-12","program_id":"ADVISORY_ATOMIC","document_key":"consAssessoria","registered_invoice_id":"invoice-advisory-a","status":"Aberta","responsible_area":"Escola","next_actor":"Escola","reason":"Dados divergentes","notes":"Correção da NF A","opened_at":"2028-12-20T12:00:00Z","payload":{"registeredInvoiceId":"invoice-advisory-a"}}'::jsonb,
        '{"id":"log-advisory-a-open","school_id":"04.99.196","action":"Análise incorreta e pendência aberta","details":{}}'::jsonb
    )
$$, 'confirmação grava NF, resumo e pendência na mesma RPC');

select is((select payload ->> 'analiseConsultaAssessoria' from public.registered_invoices where id='invoice-advisory-a'), 'Incorreto', 'NF A fica incorreta');
select is((select registered_invoice_id from public.pendencies where id='pendency-advisory-a'), 'invoice-advisory-a', 'pendência aponta para NF A');
select is((select analysis ->> 'consAssessoria' from public.verifications where id='04.99.196::2028-12::ADVISORY_ATOMIC'), 'Incorreto', 'resumo mensal reflete NF A incorreta');

select throws_ok($$
    select public.save_service_advisory_with_pendency(
        jsonb_set((select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at' from public.registered_invoices i where id='invoice-advisory-a'), '{payload,consultaAssessoriaEnviada}', 'true'::jsonb, true),
        2,
        (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at' from public.verifications v where id='04.99.196::2028-12::ADVISORY_ATOMIC'),
        2,
        '{"id":"pendency-advisory-a-duplicate","school_id":"04.99.196","competence_origin":"2028-12","program_id":"ADVISORY_ATOMIC","document_key":"consAssessoria","registered_invoice_id":"invoice-advisory-a","status":"Aberta","responsible_area":"Escola","next_actor":"Escola","reason":"Duplicada","notes":"","opened_at":"2028-12-21T12:00:00Z","payload":{"registeredInvoiceId":"invoice-advisory-a"}}'::jsonb,
        '{"id":"log-advisory-a-duplicate","school_id":"04.99.196","action":"Pendência duplicada","details":{}}'::jsonb
    )
$$, '23505', null, 'falha ao abrir duplicata reverte a alteração da NF');
select is((select (payload ->> 'consultaAssessoriaEnviada')::boolean from public.registered_invoices where id='invoice-advisory-a'), false, 'rollback atômico preserva NF quando pendência falha');

select lives_ok($$
    select public.reanalyze_service_advisory_pendency(
        jsonb_set((select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at' from public.registered_invoices i where id='invoice-advisory-a'), '{payload,analiseConsultaAssessoria}', to_jsonb('Correto'::text), true),
        2,
        jsonb_set((select to_jsonb(p) - 'row_version' - 'created_at' - 'updated_at' from public.pendencies p where id='pendency-advisory-a'), '{status}', to_jsonb('Resolvida'::text), true),
        null,
        jsonb_set((select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at' from public.verifications v where id='04.99.196::2028-12::ADVISORY_ATOMIC'), '{analysis,consAssessoria}', to_jsonb('Não analisado'::text), true),
        1,
        2,
        '{"id":"log-advisory-a-reanalysis","school_id":"04.99.196","action":"Reanálise registrada","details":{}}'::jsonb
    )
$$, 'reanálise atualiza apenas a NF vinculada e a projeção agregada');

select is((select payload ->> 'analiseConsultaAssessoria' from public.registered_invoices where id='invoice-advisory-b'), 'Não analisado', 'reanálise da NF A não altera a NF B');
select is((select analysis ->> 'consAssessoria' from public.verifications where id='04.99.196::2028-12::ADVISORY_ATOMIC'), 'Não analisado', 'resumo mensal volta a refletir a NF B ainda não analisada');

select * from finish();
rollback;