begin;
set local role postgres;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(7);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000197', 'advisory-attempt-admin@example.test');
insert into public.user_profiles (user_id, profile_id, cre_scope)
values ('00000000-0000-0000-0000-000000000197', 'technical_admin', null);
insert into public.competences (id, label, exercise, bonus_deadline)
values ('2029-01', 'Janeiro de 2029', 2029, '2029-02-15');
insert into public.programs (id, name)
values ('ADVISORY_ATTEMPT', 'Programa teste novo envio Assessoria');
insert into public.schools (id, designation, denomination, cre, initial_competence, inep, cnpj, sici)
values ('04.99.197', '04.99.197', 'Escola Novo Envio Assessoria', '4ª CRE', '2029-01', '33990197', '90.019.700/0001-97', 'SICI-ADVISORY-197');
insert into public.verifications (id, school_id, competence_id, program_id, bonification, analysis, payload)
values (
    '04.99.197::2029-01::ADVISORY_ATTEMPT', '04.99.197', '2029-01', 'ADVISORY_ATTEMPT',
    '{"consAssessoria":"Não","consEnviada":false}'::jsonb,
    '{"consAssessoria":"Incorreto"}'::jsonb,
    '{}'::jsonb
);
insert into public.registered_invoices (
    id, school_id, competence_id, program_id, verification_id, source_context_key,
    description, expense_type, invoice_number, amount, payload
) values (
    'invoice-advisory-attempt', '04.99.197', '2029-01', 'ADVISORY_ATTEMPT',
    '04.99.197::2029-01::ADVISORY_ATTEMPT', '2029-01_ADVISORY_ATTEMPT',
    'Serviço com correção', 'servico', 'NF-ATTEMPT', 500,
    '{"consultaAssessoriaEnviada":false,"analiseConsultaAssessoria":"Incorreto"}'::jsonb
);
insert into public.pendencies (
    id, school_id, competence_origin, program_id, document_key, registered_invoice_id,
    status, responsible_area, next_actor, reason, notes, opened_at, payload
) values (
    'pendency-advisory-attempt', '04.99.197', '2029-01', 'ADVISORY_ATTEMPT', 'consAssessoria',
    'invoice-advisory-attempt', 'Aberta', 'Escola', 'Escola', 'Dados divergentes',
    'Corrigir consulta', '2029-01-10T12:00:00Z', '{"registeredInvoiceId":"invoice-advisory-attempt"}'::jsonb
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000197', true);

select lives_ok($$
    select public.register_service_advisory_attempt(
        '{"id":"invoice-advisory-attempt","school_id":"04.99.197","competence_id":"2029-01","program_id":"ADVISORY_ATTEMPT","verification_id":"04.99.197::2029-01::ADVISORY_ATTEMPT","source_context_key":"2029-01_ADVISORY_ATTEMPT","linked_asset_id":null,"description":"Serviço com correção","expense_type":"servico","invoice_number":"NF-ATTEMPT","amount":500,"payload":{"consultaAssessoriaEnviada":false,"analiseConsultaAssessoria":"Não analisado"}}'::jsonb,
        1,
        '{"id":"pendency-advisory-attempt","school_id":"04.99.197","competence_origin":"2029-01","program_id":"ADVISORY_ATTEMPT","document_key":"consAssessoria","registered_invoice_id":"invoice-advisory-attempt","status":"Aguardando reanálise","responsible_area":"Controlador","next_actor":"Controlador","reason":"Dados divergentes","notes":"Novo arquivo","opened_at":"2029-01-10T12:00:00Z","payload":{"registeredInvoiceId":"invoice-advisory-attempt"}}'::jsonb,
        1,
        '{"id":"attempt-advisory-1","pendency_id":"pendency-advisory-attempt","attempt_number":1,"available_at":"2029-01-12T09:00:00Z","submitted_at":"2029-01-12T10:00:00Z","analyzed_at":null,"result":null,"observation":"Arquivo corrigido","drive_url":"https://drive.example/attempt","errors":[],"payload":{}}'::jsonb,
        '{"id":"04.99.197::2029-01::ADVISORY_ATTEMPT","school_id":"04.99.197","competence_id":"2029-01","program_id":"ADVISORY_ATTEMPT","bonification":{"consAssessoria":"Não","consEnviada":false},"analysis":{"consAssessoria":"Não analisado"},"bonus_result":null,"payload":{}}'::jsonb,
        1,
        '{"id":"log-advisory-attempt-1","school_id":"04.99.197","action":"Novo envio registrado","details":{}}'::jsonb
    )
$$, 'novo envio da Assessoria é persistido atomicamente por NF');

select is((select payload ->> 'analiseConsultaAssessoria' from public.registered_invoices where id='invoice-advisory-attempt'), 'Não analisado', 'NF volta a Não analisado');
select is((select status from public.pendencies where id='pendency-advisory-attempt'), 'Aguardando reanálise', 'pendência passa a aguardar reanálise');
select is((select available_at::text from public.pendency_attempts where id='attempt-advisory-1'), '2029-01-12 09:00:00+00', 'data de disponibilização é preservada');
select is((select analysis ->> 'consAssessoria' from public.verifications where id='04.99.197::2029-01::ADVISORY_ATTEMPT'), 'Não analisado', 'resumo mensal volta a Não analisado');

select throws_ok($$
    select public.register_service_advisory_attempt(
        jsonb_set((select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at' from public.registered_invoices i where id='invoice-advisory-attempt'), '{payload,consultaAssessoriaEnviada}', 'true'::jsonb, true),
        2,
        (select to_jsonb(p) - 'row_version' - 'created_at' - 'updated_at' from public.pendencies p where id='pendency-advisory-attempt'),
        2,
        '{"id":"attempt-advisory-2","pendency_id":"pendency-advisory-attempt","attempt_number":2,"available_at":"2029-01-13T09:00:00Z","submitted_at":"2029-01-13T10:00:00Z","analyzed_at":null,"result":null,"observation":"Nova substituição","drive_url":"https://drive.example/attempt2","errors":[],"payload":{}}'::jsonb,
        (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at' from public.verifications v where id='04.99.197::2029-01::ADVISORY_ATTEMPT'),
        2,
        '{"id":"log-advisory-attempt-1","school_id":"04.99.197","action":"Novo envio duplicado","details":{}}'::jsonb
    )
$$, '23505', null, 'falha no histórico reverte todo o novo envio');
select is((select (payload ->> 'consultaAssessoriaEnviada')::boolean from public.registered_invoices where id='invoice-advisory-attempt'), false, 'rollback preserva NF quando a transação falha');

select * from finish();
rollback;