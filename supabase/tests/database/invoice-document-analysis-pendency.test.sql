begin;
set local role postgres;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(17);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000211', 'invoice-document-hotfix@example.test');
insert into public.user_profiles (user_id, profile_id, cre_scope)
values ('00000000-0000-0000-0000-000000000211', 'technical_admin', null);
insert into public.competences (id, label, exercise, bonus_deadline)
values ('2029-01', 'Janeiro de 2029', 2029, '2029-02-15');
insert into public.programs (id, name)
values ('INVOICE_DOC_ATOMIC', 'Programa teste análise fiscal individual');
insert into public.schools (id, designation, denomination, cre, initial_competence, inep, cnpj, sici)
values ('04.99.211', '04.99.211', 'Escola Documento Fiscal', '4ª CRE', '2029-01', '33990211', '90.021.100/0001-11', 'SICI-INV-211');
insert into public.verifications (id, school_id, competence_id, program_id, bonification, analysis, payload)
values (
    '04.99.211::2029-01::INVOICE_DOC_ATOMIC', '04.99.211', '2029-01', 'INVOICE_DOC_ATOMIC',
    '{"notaFiscal":"Sim"}'::jsonb,
    '{"notaFiscal":"Não analisado"}'::jsonb,
    '{}'::jsonb
);
insert into public.registered_invoices (
    id, school_id, competence_id, program_id, verification_id, source_context_key,
    description, expense_type, invoice_number, amount, payload
) values
(
    'invoice-doc-a', '04.99.211', '2029-01', 'INVOICE_DOC_ATOMIC',
    '04.99.211::2029-01::INVOICE_DOC_ATOMIC', '2029-01_INVOICE_DOC_ATOMIC',
    'Serviço A', 'servico', 'NF-A', 500,
    '{"analiseDocumentoFiscal":"Não analisado","consultaAssessoriaEnviada":false,"analiseConsultaAssessoria":"Não analisado"}'::jsonb
),
(
    'invoice-doc-b', '04.99.211', '2029-01', 'INVOICE_DOC_ATOMIC',
    '04.99.211::2029-01::INVOICE_DOC_ATOMIC', '2029-01_INVOICE_DOC_ATOMIC',
    'Material B', 'consumo', 'NF-B', 100,
    '{"analiseDocumentoFiscal":"Não analisado"}'::jsonb
),
(
    'invoice-doc-u', '04.99.211', '2029-01', 'INVOICE_DOC_ATOMIC',
    '04.99.211::2029-01::INVOICE_DOC_ATOMIC', '2029-01_INVOICE_DOC_ATOMIC',
    'Débito sem documento', 'a_identificar', null, 850,
    '{"analiseDocumentoFiscal":"Incorreto"}'::jsonb
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000211', true);

select lives_ok($$
    select public.save_invoice_document_with_pendency(
        jsonb_set((select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at' from public.registered_invoices i where id='invoice-doc-a'), '{payload,analiseDocumentoFiscal}', to_jsonb('Incorreto'::text), true),
        1,
        jsonb_set((select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at' from public.verifications v where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'), '{analysis,notaFiscal}', to_jsonb('Incorreto'::text), true),
        1,
        '{"id":"pendency-doc-a","school_id":"04.99.211","competence_origin":"2029-01","program_id":"INVOICE_DOC_ATOMIC","document_key":"notaFiscal","registered_invoice_id":"invoice-doc-a","status":"Aberta","responsible_area":"Escola","next_actor":"Escola","reason":"Dados divergentes","notes":"Corrigir NF A","opened_at":"2029-01-20T12:00:00Z","payload":{"registeredInvoiceId":"invoice-doc-a","documentSnapshot":{"numero":"NF-A","valor":500}}}'::jsonb,
        '{"id":"log-doc-a-open","school_id":"04.99.211","action":"Análise incorreta e pendência individual aberta","details":{}}'::jsonb
    )
$$, 'abre atomicamente Pendência individual da NF A');

select is((select payload ->> 'analiseDocumentoFiscal' from public.registered_invoices where id='invoice-doc-a'), 'Incorreto', 'NF A fica Incorreta');
select is((select registered_invoice_id from public.pendencies where id='pendency-doc-a'), 'invoice-doc-a', 'Pendência A aponta para NF A');

select lives_ok($$
    select public.save_invoice_document_with_pendency(
        jsonb_set((select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at' from public.registered_invoices i where id='invoice-doc-b'), '{payload,analiseDocumentoFiscal}', to_jsonb('Incorreto'::text), true),
        1,
        (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at' from public.verifications v where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        2,
        '{"id":"pendency-doc-b","school_id":"04.99.211","competence_origin":"2029-01","program_id":"INVOICE_DOC_ATOMIC","document_key":"notaFiscal","registered_invoice_id":"invoice-doc-b","status":"Aberta","responsible_area":"Escola","next_actor":"Escola","reason":"Pagamento irregular","notes":"Corrigir boleto","opened_at":"2029-01-20T12:05:00Z","payload":{"registeredInvoiceId":"invoice-doc-b"}}'::jsonb,
        '{"id":"log-doc-b-open","school_id":"04.99.211","action":"Análise incorreta e pendência individual aberta","details":{}}'::jsonb
    )
$$, 'permite segunda Pendência notaFiscal para outro documento');

select is((select count(*)::integer from public.pendencies where document_key='notaFiscal' and status='Aberta' and school_id='04.99.211'), 2, 'duas Pendências fiscais distintas coexistem');

select throws_ok($$
    select public.save_invoice_document_with_pendency(
        jsonb_set(
            jsonb_set((select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at' from public.registered_invoices i where id='invoice-doc-a'), '{description}', to_jsonb('ALTERAÇÃO QUE DEVE REVERTER'::text), true),
            '{payload,analiseDocumentoFiscal}', to_jsonb('Incorreto'::text), true
        ),
        2,
        (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at' from public.verifications v where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        3,
        '{"id":"pendency-doc-a-dup","school_id":"04.99.211","competence_origin":"2029-01","program_id":"INVOICE_DOC_ATOMIC","document_key":"notaFiscal","registered_invoice_id":"invoice-doc-a","status":"Aberta","responsible_area":"Escola","next_actor":"Escola","reason":"Duplicada","notes":"Duplicada","opened_at":"2029-01-21T12:00:00Z","payload":{"registeredInvoiceId":"invoice-doc-a"}}'::jsonb,
        '{"id":"log-doc-a-dup","school_id":"04.99.211","action":"Duplicada","details":{}}'::jsonb
    )
$$, '23505', null, 'mesma NF não aceita segunda Pendência ativa');

select is((select description from public.registered_invoices where id='invoice-doc-a'), 'Serviço A', 'falha de duplicidade reverte alteração da NF');

select lives_ok($$
    select public.save_invoice_document_with_pendency(
        (select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at' from public.registered_invoices i where id='invoice-doc-u'),
        1,
        (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at' from public.verifications v where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        3,
        '{"id":"pendency-doc-u","school_id":"04.99.211","competence_origin":"2029-01","program_id":"INVOICE_DOC_ATOMIC","document_key":"notaFiscal","registered_invoice_id":"invoice-doc-u","status":"Aberta","responsible_area":"Escola","next_actor":"Escola","reason":"Documento ausente","notes":"Débito sem comprovação","opened_at":"2029-01-21T13:00:00Z","payload":{"registeredInvoiceId":"invoice-doc-u"}}'::jsonb,
        '{"id":"log-doc-u-open","school_id":"04.99.211","action":"Despesa a identificar com pendência","details":{}}'::jsonb
    )
$$, 'despesa a identificar pode nascer Incorreta com Pendência individual');

select is((select payload ->> 'analiseDocumentoFiscal' from public.registered_invoices where id='invoice-doc-u'), 'Incorreto', 'despesa a identificar permanece Incorreta');

select throws_ok($$
    select public.register_invoice_document_attempt(
        (select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at' from public.registered_invoices i where id='invoice-doc-u'),
        2,
        jsonb_set((select to_jsonb(p) - 'row_version' - 'created_at' - 'updated_at' from public.pendencies p where id='pendency-doc-u'), '{status}', to_jsonb('Aguardando reanálise'::text), true),
        1,
        '{"id":"attempt-doc-u","pendency_id":"pendency-doc-u","attempt_number":1,"available_at":"2029-01-22T10:00:00Z","submitted_at":"2029-01-22T10:00:00Z","result":null,"observation":"Ainda sem identificação","drive_url":"","errors":[],"payload":{}}'::jsonb,
        (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at' from public.verifications v where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        4,
        '{"id":"log-doc-u-attempt","school_id":"04.99.211","action":"Novo envio","details":{}}'::jsonb
    )
$$, 'P0001', 'VALIDATION_ERROR: despesa precisa ser identificada antes do novo envio', 'despesa a identificar não avança sem identificação');

select lives_ok($$
    select public.reanalyze_invoice_document_pendency(
        jsonb_set((select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at' from public.registered_invoices i where id='invoice-doc-a'), '{payload,analiseDocumentoFiscal}', to_jsonb('Correto'::text), true),
        2,
        jsonb_set((select to_jsonb(p) - 'row_version' - 'created_at' - 'updated_at' from public.pendencies p where id='pendency-doc-a'), '{status}', to_jsonb('Resolvida'::text), true),
        null,
        (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at' from public.verifications v where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        1,
        4,
        '{"id":"log-doc-a-resolve","school_id":"04.99.211","action":"Reanálise registrada","details":{}}'::jsonb
    )
$$, 'reanálise resolve somente a NF vinculada');

select is((select payload ->> 'analiseDocumentoFiscal' from public.registered_invoices where id='invoice-doc-a'), 'Correto', 'NF A torna-se Correta');
select is((select payload ->> 'analiseDocumentoFiscal' from public.registered_invoices where id='invoice-doc-b'), 'Incorreto', 'NF B permanece Incorreta');

select throws_like($$
    update public.registered_invoices
       set competence_id = '2029-02',
           source_context_key = '2029-02_INVOICE_DOC_ATOMIC'
     where id = 'invoice-doc-a'
$$, 'INTEGRITY_CONFLICT: Nota Fiscal possui histórico de pendência individual e não pode alterar escola, competência ou programa%', 'histórico notaFiscal bloqueia deslocamento estrutural da despesa');

select throws_like($$
    delete from public.registered_invoices
     where id = 'invoice-doc-a'
$$, 'INTEGRITY_CONFLICT: Nota Fiscal possui histórico de pendência individual e não pode ser excluída%', 'histórico notaFiscal bloqueia exclusão física da despesa');

select lives_ok($$
    update public.registered_invoices
       set expense_type = 'consumo',
           invoice_number = 'NF-U-IDENTIFICADA',
           description = 'Despesa identificada'
     where id = 'invoice-doc-u'
$$, 'histórico notaFiscal permite identificar a_identificar preservando o mesmo registro');

select throws_ok($$
    insert into public.pendencies (
        id, school_id, competence_origin, program_id, document_key, registered_invoice_id,
        status, responsible_area, next_actor, reason, notes, opened_at, payload
    ) values (
        'pendency-boleto-legado', '04.99.211', '2029-01', 'INVOICE_DOC_ATOMIC',
        'boletoInternet', 'invoice-doc-b', 'Aberta', 'Escola', 'Escola',
        'Inválida', 'Não deve existir', now(), '{}'::jsonb
    )
$$, '23514', null, 'boletoInternet não volta a existir como documento individual vinculado');

select * from finish();
rollback;
