begin;
set local role postgres;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(13);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000729', 'expense-bonification-independence@example.test');
insert into public.user_profiles (user_id, profile_id, cre_scope)
values ('00000000-0000-0000-0000-000000000729', 'technical_admin', null);

insert into public.competences (id, label, exercise, bonus_deadline)
values ('2033-01', 'Janeiro de 2033', 2033, '2033-02-15');

insert into public.programs (id, name)
values
    ('EXPENSE_INDEPENDENT_A', 'Programa despesa independente A'),
    ('EXPENSE_INDEPENDENT_B', 'Programa despesa independente B');

insert into public.schools (id, designation, denomination, cre, initial_competence, inep, cnpj, sici)
values
    ('04.99.729', '04.99.729', 'Escola Independência A', '4ª CRE', '2033-01', '33990729', '90.072.900/0001-29', 'SICI-EXP-729'),
    ('04.99.730', '04.99.730', 'Escola Independência B', '4ª CRE', '2033-01', '33990730', '90.073.000/0001-30', 'SICI-EXP-730');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000729', true);

select lives_ok($$
    select public.save_invoice_with_effects_v2(
        p_operation_key => '72900000-0000-4000-8000-000000000001'::uuid,
        p_invoice => '{
            "id":"invoice-independent-first",
            "school_id":"04.99.729",
            "competence_id":"2033-01",
            "program_id":"EXPENSE_INDEPENDENT_A",
            "verification_id":"04.99.729::2033-01::EXPENSE_INDEPENDENT_A",
            "source_context_key":"2033-01_EXPENSE_INDEPENDENT_A",
            "description":"Material antes da bonificação",
            "expense_type":"consumo",
            "invoice_number":"NF-INDEP-1",
            "amount":125,
            "payload":{"analiseDocumentoFiscal":"Não analisado"},
            "registered_at":"2033-01-10T12:00:00Z"
        }'::jsonb,
        p_verification_patch => '{
            "id":"04.99.729::2033-01::EXPENSE_INDEPENDENT_A",
            "school_id":"04.99.729",
            "competence_id":"2033-01",
            "program_id":"EXPENSE_INDEPENDENT_A",
            "bonification":{"extCC":"","extINV":"","notaFiscal":"","consAssessoria":"","declBBAgil":"","encampInventario":""},
            "analysis":{"extCC":"Não analisado","extINV":"Não analisado","notaFiscal":"Não analisado","consAssessoria":"Não analisado","declBBAgil":"Não analisado","encampInventario":"Não analisado"},
            "bonus_result":null,
            "payload":{}
        }'::jsonb,
        p_administrative_log => '{
            "id":"log-independent-first",
            "school_id":"04.99.729",
            "action":"Gasto Consumo Cadastrado",
            "details":{"invoice":"invoice-independent-first"},
            "event_at":"2033-01-10T12:00:00Z"
        }'::jsonb
    )
$$, 'primeira despesa identificada nasce sem lançamento prévio de bonificação');

select is(
    (select count(*)::integer from public.verifications where id='04.99.729::2033-01::EXPENSE_INDEPENDENT_A'),
    1,
    'primeira despesa materializa uma única verificação mensal'
);
select is(
    (select verification_id from public.registered_invoices where id='invoice-independent-first'),
    '04.99.729::2033-01::EXPENSE_INDEPENDENT_A',
    'despesa fica vinculada ao contexto materializado'
);
select is(
    (select bonus_result from public.verifications where id='04.99.729::2033-01::EXPENSE_INDEPENDENT_A'),
    null,
    'primeira despesa não consolida a bonificação'
);
select is(
    (select bonification ->> 'notaFiscal' from public.verifications where id='04.99.729::2033-01::EXPENSE_INDEPENDENT_A'),
    '',
    'primeira despesa não inventa Sim, Não ou N/A para Notas Fiscais'
);

select lives_ok($$
    select public.save_invoice_with_effects_v2(
        p_operation_key => '72900000-0000-4000-8000-000000000001'::uuid,
        p_invoice => '{
            "id":"invoice-independent-first",
            "school_id":"04.99.729",
            "competence_id":"2033-01",
            "program_id":"EXPENSE_INDEPENDENT_A",
            "verification_id":"04.99.729::2033-01::EXPENSE_INDEPENDENT_A",
            "source_context_key":"2033-01_EXPENSE_INDEPENDENT_A",
            "description":"Material antes da bonificação",
            "expense_type":"consumo",
            "invoice_number":"NF-INDEP-1",
            "amount":125,
            "payload":{"analiseDocumentoFiscal":"Não analisado"},
            "registered_at":"2033-01-10T12:00:00Z"
        }'::jsonb,
        p_verification_patch => '{
            "id":"04.99.729::2033-01::EXPENSE_INDEPENDENT_A",
            "school_id":"04.99.729",
            "competence_id":"2033-01",
            "program_id":"EXPENSE_INDEPENDENT_A",
            "bonification":{"extCC":"","extINV":"","notaFiscal":"","consAssessoria":"","declBBAgil":"","encampInventario":""},
            "analysis":{"extCC":"Não analisado","extINV":"Não analisado","notaFiscal":"Não analisado","consAssessoria":"Não analisado","declBBAgil":"Não analisado","encampInventario":"Não analisado"},
            "bonus_result":null,
            "payload":{}
        }'::jsonb,
        p_administrative_log => '{
            "id":"log-independent-first",
            "school_id":"04.99.729",
            "action":"Gasto Consumo Cadastrado",
            "details":{"invoice":"invoice-independent-first"},
            "event_at":"2033-01-10T12:00:00Z"
        }'::jsonb
    )
$$, 'retry da primeira despesa continua idempotente');

select is(
    (select count(*)::integer from public.registered_invoices where id='invoice-independent-first'),
    1,
    'retry não duplica a despesa'
);
select is(
    (select count(*)::integer from public.verifications where id='04.99.729::2033-01::EXPENSE_INDEPENDENT_A'),
    1,
    'retry não duplica o contexto mensal'
);

select lives_ok($$
    select public.save_unidentified_expense_with_pendency(
        '{
            "id":"invoice-independent-unidentified",
            "school_id":"04.99.730",
            "competence_id":"2033-01",
            "program_id":"EXPENSE_INDEPENDENT_B",
            "verification_id":"04.99.730::2033-01::EXPENSE_INDEPENDENT_B",
            "source_context_key":"2033-01_EXPENSE_INDEPENDENT_B",
            "description":"Débito ainda sem documento",
            "expense_type":"a_identificar",
            "invoice_number":"",
            "amount":850,
            "payload":{"analiseDocumentoFiscal":"Incorreto"},
            "registered_at":"2033-01-11T12:00:00Z"
        }'::jsonb,
        '{
            "id":"04.99.730::2033-01::EXPENSE_INDEPENDENT_B",
            "school_id":"04.99.730",
            "competence_id":"2033-01",
            "program_id":"EXPENSE_INDEPENDENT_B",
            "bonification":{"extCC":"","extINV":"","notaFiscal":"","consAssessoria":"","declBBAgil":"","encampInventario":""},
            "analysis":{"extCC":"Não analisado","extINV":"Não analisado","notaFiscal":"Incorreto","consAssessoria":"Não analisado","declBBAgil":"Não analisado","encampInventario":"Não analisado"},
            "bonus_result":null,
            "payload":{}
        }'::jsonb,
        null,
        '{
            "id":"pendency-independent-unidentified",
            "school_id":"04.99.730",
            "competence_origin":"2033-01",
            "program_id":"EXPENSE_INDEPENDENT_B",
            "document_key":"notaFiscal",
            "registered_invoice_id":"invoice-independent-unidentified",
            "status":"Aberta",
            "responsible_area":"Escola",
            "next_actor":"Escola",
            "reason":"Documento ausente",
            "notes":"Aguardando identificação",
            "opened_at":"2033-01-11T12:00:00Z",
            "payload":{"registeredInvoiceId":"invoice-independent-unidentified"}
        }'::jsonb,
        '{
            "id":"log-independent-unidentified",
            "school_id":"04.99.730",
            "action":"Despesa a identificar com pendência",
            "details":{}
        }'::jsonb
    )
$$, 'despesa a identificar também nasce antes de qualquer bonificação');

select is(
    (select count(*)::integer from public.verifications where id='04.99.730::2033-01::EXPENSE_INDEPENDENT_B'),
    1,
    'despesa a identificar materializa o próprio contexto mensal'
);
select is(
    (select bonus_result from public.verifications where id='04.99.730::2033-01::EXPENSE_INDEPENDENT_B'),
    null,
    'despesa a identificar não altera resultado de bonificação'
);
select is(
    (select registered_invoice_id from public.pendencies where id='pendency-independent-unidentified'),
    'invoice-independent-unidentified',
    'despesa a identificar continua vinculada à Pendência obrigatória'
);
select is(
    (select payload ->> 'analiseDocumentoFiscal' from public.registered_invoices where id='invoice-independent-unidentified'),
    'Incorreto',
    'despesa a identificar preserva sua regra técnica própria'
);

select * from finish();
rollback;
