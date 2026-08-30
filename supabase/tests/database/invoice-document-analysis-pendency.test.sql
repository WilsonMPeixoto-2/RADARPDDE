begin;
set local role postgres;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(31);

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
insert into public.verifications (
    id, school_id, competence_id, program_id, bonification, analysis, bonus_result, payload
) values (
    '04.99.211::2029-01::INVOICE_DOC_ATOMIC',
    '04.99.211', '2029-01', 'INVOICE_DOC_ATOMIC',
    '{"notaFiscal":"Sim","consAssessoria":"Não se aplica","consEnviada":false}'::jsonb,
    '{"notaFiscal":"Não analisado","consAssessoria":"Correto"}'::jsonb,
    'apta',
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
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000211', true);

select lives_ok($$
    select public.save_invoice_document_with_pendency(
        jsonb_set(
            jsonb_set(
                (select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at' from public.registered_invoices i where id='invoice-doc-a'),
                '{payload,rowVersion}',
                (select to_jsonb(row_version) from public.registered_invoices where id='invoice-doc-a'),
                true
            ),
            '{payload,analiseDocumentoFiscal}',
            to_jsonb('Incorreto'::text),
            true
        ),
        (select row_version from public.registered_invoices where id='invoice-doc-a'),
        jsonb_set(
            jsonb_set(
                (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at' from public.verifications v where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
                '{payload,rowVersion}',
                (select to_jsonb(row_version) from public.verifications where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
                true
            ),
            '{analysis,notaFiscal}',
            to_jsonb('Incorreto'::text),
            true
        ),
        (select row_version from public.verifications where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        '{"id":"pendency-doc-a","school_id":"04.99.211","competence_origin":"2029-01","program_id":"INVOICE_DOC_ATOMIC","document_key":"notaFiscal","registered_invoice_id":"invoice-doc-a","status":"Aberta","responsible_area":"Escola","next_actor":"Escola","reason":"Dados divergentes","notes":"Corrigir NF A","opened_at":"2029-01-20T12:00:00Z","payload":{"registeredInvoiceId":"invoice-doc-a"}}'::jsonb,
        '{"id":"log-doc-a-open","school_id":"04.99.211","action":"Análise incorreta e pendência individual aberta","details":{}}'::jsonb
    )
$$, 'abre Pendência individual da NF A na mesma transação');
select is((select payload ->> 'analiseDocumentoFiscal' from public.registered_invoices where id='invoice-doc-a'), 'Incorreto', 'NF A fica Incorreta');
select is((select registered_invoice_id from public.pendencies where id='pendency-doc-a'), 'invoice-doc-a', 'Pendência A aponta para NF A');

select throws_like($$
    select public.save_invoice_document_with_pendency(
        jsonb_set(jsonb_set((select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at' from public.registered_invoices i where id='invoice-doc-b'), '{amount}', '999'::jsonb, true), '{payload,analiseDocumentoFiscal}', to_jsonb('Incorreto'::text), true),
        (select row_version from public.registered_invoices where id='invoice-doc-b'),
        (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at' from public.verifications v where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        (select row_version from public.verifications where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        '{"id":"pendency-doc-b-invalid","school_id":"04.99.211","competence_origin":"2029-01","program_id":"INVOICE_DOC_ATOMIC","document_key":"notaFiscal","registered_invoice_id":"invoice-doc-b","status":"Aberta","responsible_area":"Escola","next_actor":"Escola","reason":"Tentativa indevida","notes":"Não deve alterar valor","opened_at":"2029-01-20T12:03:00Z","payload":{"registeredInvoiceId":"invoice-doc-b"}}'::jsonb,
        '{"id":"log-doc-b-invalid","school_id":"04.99.211","action":"Abertura fiscal inválida","details":{}}'::jsonb
    )
$$, 'VALIDATION_ERROR: abertura fiscal não pode alterar os dados da despesa%', 'primeira abertura não pode alterar valor nem dados da despesa');
select is((select amount from public.registered_invoices where id='invoice-doc-b'), 100.00::numeric, 'tentativa de abertura preserva o valor original da despesa');

select lives_ok($$
    select public.save_invoice_document_with_pendency(
        jsonb_set((select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at' from public.registered_invoices i where id='invoice-doc-b'), '{payload,analiseDocumentoFiscal}', to_jsonb('Incorreto'::text), true),
        (select row_version from public.registered_invoices where id='invoice-doc-b'),
        (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at' from public.verifications v where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        (select row_version from public.verifications where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        '{"id":"pendency-doc-b","school_id":"04.99.211","competence_origin":"2029-01","program_id":"INVOICE_DOC_ATOMIC","document_key":"notaFiscal","registered_invoice_id":"invoice-doc-b","status":"Aberta","responsible_area":"Escola","next_actor":"Escola","reason":"Documento incompleto","notes":"Corrigir NF B","opened_at":"2029-01-20T12:05:00Z","payload":{"registeredInvoiceId":"invoice-doc-b"}}'::jsonb,
        '{"id":"log-doc-b-open","school_id":"04.99.211","action":"Segunda pendência fiscal","details":{}}'::jsonb
    )
$$, 'permite Pendência simultânea para outra despesa');
select is((select count(*)::integer from public.pendencies where document_key='notaFiscal' and status='Aberta' and school_id='04.99.211'), 2, 'duas Pendências fiscais distintas coexistem');

select throws_ok($$
    select public.save_pendency_command(
        'open',
        '{"id":"pendency-generica","school_id":"04.99.211","competence_origin":"2029-01","program_id":"INVOICE_DOC_ATOMIC","document_key":"notaFiscal","status":"Aberta","responsible_area":"Escola","next_actor":"Escola","reason":"Genérica","notes":"Não deve existir","opened_at":"2029-01-20T13:00:00Z","payload":{}}'::jsonb,
        null, null, null, null,
        '{"id":"log-generica","school_id":"04.99.211","action":"Inválida","details":{}}'::jsonb
    )
$$, 'P0001', 'VALIDATION_ERROR: nova Pendência de Notas Fiscais exige registered_invoice_id', 'rota genérica do banco não abre nova Pendência fiscal');

select throws_ok($$
    select public.save_invoice_document_with_pendency(
        (select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at' from public.registered_invoices i where id='invoice-doc-a'),
        (select row_version from public.registered_invoices where id='invoice-doc-a'),
        (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at' from public.verifications v where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        (select row_version from public.verifications where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        '{"id":"pendency-doc-a-dup","school_id":"04.99.211","competence_origin":"2029-01","program_id":"INVOICE_DOC_ATOMIC","document_key":"notaFiscal","registered_invoice_id":"invoice-doc-a","status":"Aberta","responsible_area":"Escola","next_actor":"Escola","reason":"Duplicada","notes":"Duplicada","opened_at":"2029-01-21T12:00:00Z","payload":{"registeredInvoiceId":"invoice-doc-a"}}'::jsonb,
        '{"id":"log-doc-a-dup","school_id":"04.99.211","action":"Duplicada","details":{}}'::jsonb
    )
$$, '23505', null, 'mesma NF não aceita segunda Pendência ativa');
select is((select description from public.registered_invoices where id='invoice-doc-a'), 'Serviço A', 'falha ao abrir duplicata preserva a despesa');

select lives_ok($$
    select public.save_unidentified_expense_with_pendency(
        '{"id":"invoice-doc-u","school_id":"04.99.211","competence_id":"2029-01","program_id":"INVOICE_DOC_ATOMIC","verification_id":"04.99.211::2029-01::INVOICE_DOC_ATOMIC","source_context_key":"2029-01_INVOICE_DOC_ATOMIC","description":"Débito sem documento","expense_type":"a_identificar","invoice_number":"","amount":850,"payload":{"analiseDocumentoFiscal":"Incorreto"},"registered_at":"2029-01-21T13:00:00Z"}'::jsonb,
        (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at' from public.verifications v where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        (select row_version from public.verifications where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        '{"id":"pendency-doc-u","school_id":"04.99.211","competence_origin":"2029-01","program_id":"INVOICE_DOC_ATOMIC","document_key":"notaFiscal","registered_invoice_id":"invoice-doc-u","status":"Aberta","responsible_area":"Escola","next_actor":"Escola","reason":"Documento ausente","notes":"Débito sem comprovação","opened_at":"2029-01-21T13:00:00Z","payload":{"registeredInvoiceId":"invoice-doc-u"}}'::jsonb,
        '{"id":"log-doc-u-open","school_id":"04.99.211","action":"Despesa a identificar com pendência","details":{}}'::jsonb
    )
$$, 'cria Despesa a identificar e Pendência na mesma operação');
select is((select payload ->> 'analiseDocumentoFiscal' from public.registered_invoices where id='invoice-doc-u'), 'Incorreto', 'Despesa a identificar nasce Incorreta');
select is((select registered_invoice_id from public.pendencies where id='pendency-doc-u'), 'invoice-doc-u', 'Despesa a identificar nasce vinculada à Pendência');

set local role postgres;
insert into public.assets (
    id, school_id, competence_id, description, expense_type, invoice_number, amount, status
) values (
    'asset-existing-u', '04.99.211', '2029-01', 'Patrimônio anterior', 'permanente', 'NF-ANTIGA', 850, 'Não encaminhada'
);
set local role authenticated;

select throws_like($$
    select public.register_invoice_document_attempt(
        ((select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at' from public.registered_invoices i where id='invoice-doc-u')
            || jsonb_build_object('description','Projetor multimídia','expense_type','permanente','invoice_number','NF-U-IDENT','amount',850,'linked_asset_id','asset-existing-u','payload',jsonb_build_object('analiseDocumentoFiscal','Não analisado'))),
        (select row_version from public.registered_invoices where id='invoice-doc-u'),
        '{"id":"asset-existing-u","school_id":"04.99.211","competence_id":"2029-01","description":"Projetor multimídia","expense_type":"permanente","invoice_number":"NF-U-IDENT","amount":850,"status":"Não encaminhada","inventory_process":"","notes":"","payload":{}}'::jsonb,
        (select row_version from public.assets where id='asset-existing-u'),
        jsonb_set((select to_jsonb(p) - 'row_version' - 'created_at' - 'updated_at' from public.pendencies p where id='pendency-doc-u'), '{status}', to_jsonb('Aguardando reanálise'::text), true),
        (select row_version from public.pendencies where id='pendency-doc-u'),
        '{"id":"attempt-doc-u-reuse","pendency_id":"pendency-doc-u","attempt_number":1,"available_at":"2029-01-22T09:00:00Z","submitted_at":"2029-01-22T09:00:00Z","result":null,"observation":"Tentativa de reaproveitar bem","drive_url":"","errors":[],"payload":{}}'::jsonb,
        (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at' from public.verifications v where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        (select row_version from public.verifications where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        '{"id":"log-doc-u-reuse","school_id":"04.99.211","action":"Reuso patrimonial inválido","details":{}}'::jsonb
    )
$$, 'VALIDATION_ERROR: identificação como bem permanente deve criar patrimônio novo%', 'identificação não pode reaproveitar patrimônio já existente');

select throws_like($$
    select public.register_invoice_document_attempt(
        ((select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at' from public.registered_invoices i where id='invoice-doc-u')
            || jsonb_build_object('description','Material de consumo','expense_type','consumo','invoice_number','NF-U-CONS','amount',850,'linked_asset_id','asset-existing-u','payload',jsonb_build_object('analiseDocumentoFiscal','Não analisado'))),
        (select row_version from public.registered_invoices where id='invoice-doc-u'),
        null,
        null,
        jsonb_set((select to_jsonb(p) - 'row_version' - 'created_at' - 'updated_at' from public.pendencies p where id='pendency-doc-u'), '{status}', to_jsonb('Aguardando reanálise'::text), true),
        (select row_version from public.pendencies where id='pendency-doc-u'),
        '{"id":"attempt-doc-u-hidden-asset","pendency_id":"pendency-doc-u","attempt_number":1,"available_at":"2029-01-22T09:30:00Z","submitted_at":"2029-01-22T09:30:00Z","result":null,"observation":"Vínculo oculto","drive_url":"","errors":[],"payload":{}}'::jsonb,
        (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at' from public.verifications v where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        (select row_version from public.verifications where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        '{"id":"log-doc-u-hidden-asset","school_id":"04.99.211","action":"Vínculo patrimonial inválido","details":{}}'::jsonb
    )
$$, 'VALIDATION_ERROR: somente bem permanente pode criar ou manter vínculo patrimonial%', 'tipo não permanente não aceita vínculo patrimonial oculto');

select lives_ok($$
    select public.register_invoice_document_attempt(
        ((select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at' from public.registered_invoices i where id='invoice-doc-u')
            || jsonb_build_object('description','Projetor multimídia','expense_type','permanente','invoice_number','NF-U-IDENT','amount',850,'linked_asset_id','asset-doc-u','payload',jsonb_build_object('analiseDocumentoFiscal','Não analisado'))),
        (select row_version from public.registered_invoices where id='invoice-doc-u'),
        '{"id":"asset-doc-u","school_id":"04.99.211","competence_id":"2029-01","description":"Projetor multimídia","expense_type":"permanente","invoice_number":"NF-U-IDENT","amount":850,"status":"Não encaminhada","inventory_process":"","notes":"","payload":{}}'::jsonb,
        null,
        jsonb_set((select to_jsonb(p) - 'row_version' - 'created_at' - 'updated_at' from public.pendencies p where id='pendency-doc-u'), '{status}', to_jsonb('Aguardando reanálise'::text), true),
        (select row_version from public.pendencies where id='pendency-doc-u'),
        '{"id":"attempt-doc-u","pendency_id":"pendency-doc-u","attempt_number":1,"available_at":"2029-01-22T10:00:00Z","submitted_at":"2029-01-22T10:00:00Z","result":null,"observation":"NF apresentada","drive_url":"","errors":[],"payload":{}}'::jsonb,
        (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at' from public.verifications v where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        (select row_version from public.verifications where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        '{"id":"log-doc-u-attempt","school_id":"04.99.211","action":"Despesa identificada em novo envio","details":{}}'::jsonb
    )
$$, 'novo envio identifica a despesa e cria o bem permanente na mesma transação');
select is((select id from public.registered_invoices where id='invoice-doc-u'), 'invoice-doc-u', 'identificação preserva o mesmo ID');
select is((select expense_type from public.registered_invoices where id='invoice-doc-u'), 'permanente', 'despesa passa a bem permanente');
select is((select linked_asset_id from public.registered_invoices where id='invoice-doc-u'), 'asset-doc-u', 'Nota Fiscal fica vinculada ao bem criado');
select is((select count(*)::integer from public.assets where id='asset-doc-u'), 1, 'bem permanente é efetivamente gravado');
select is((select status from public.pendencies where id='pendency-doc-u'), 'Aguardando reanálise', 'mesma Pendência passa a Aguardando reanálise');
select is((select count(*)::integer from public.pendency_attempts where pendency_id='pendency-doc-u' and result is null), 1, 'novo envio registra uma tentativa aguardando');

select throws_ok($$
    select public.reanalyze_invoice_document_pendency(
        (select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at' from public.registered_invoices i where id='invoice-doc-a'),
        (select row_version from public.registered_invoices where id='invoice-doc-a'),
        (select to_jsonb(p) - 'row_version' - 'created_at' - 'updated_at' from public.pendencies p where id='pendency-doc-a'),
        null,
        (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at' from public.verifications v where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        (select row_version from public.pendencies where id='pendency-doc-a'),
        (select row_version from public.verifications where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        '{"id":"log-invalid-reanalysis","school_id":"04.99.211","action":"Inválida","details":{}}'::jsonb
    )
$$, 'P0001', 'VALIDATION_ERROR: reanálise exige documento, Pendência e tentativa vinculados', 'não reanalisa Pendência ainda Aberta e sem novo envio');

select throws_like($$
    select public.reanalyze_invoice_document_pendency(
        jsonb_set((select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at' from public.registered_invoices i where id='invoice-doc-u'), '{payload,analiseDocumentoFiscal}', to_jsonb('Correto'::text), true),
        (select row_version from public.registered_invoices where id='invoice-doc-u'),
        jsonb_set((select to_jsonb(p) - 'row_version' - 'created_at' - 'updated_at' from public.pendencies p where id='pendency-doc-u'), '{status}', to_jsonb('Resolvida'::text), true),
        ((select to_jsonb(a) - 'row_version' - 'created_at' - 'updated_at' from public.pendency_attempts a where id='attempt-doc-u')
            || jsonb_build_object('result','correto','analyzed_at','2029-01-22T10:45:00Z','observation','Conteúdo reescrito indevidamente','errors','[]'::jsonb)),
        (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at' from public.verifications v where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        (select row_version from public.pendencies where id='pendency-doc-u'),
        (select row_version from public.verifications where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        '{"id":"log-doc-u-rewrite","school_id":"04.99.211","action":"Reanálise fiscal inválida","details":{}}'::jsonb
    )
$$, 'VALIDATION_ERROR: reanálise fiscal não pode reescrever o novo envio%', 'reanálise não pode alterar observação apresentada no novo envio');
select is((select observation from public.pendency_attempts where id='attempt-doc-u'), 'NF apresentada', 'tentativa mantém a observação original após reanálise rejeitada');

select lives_ok($$
    select public.reanalyze_invoice_document_pendency(
        jsonb_set((select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at' from public.registered_invoices i where id='invoice-doc-u'), '{payload,analiseDocumentoFiscal}', to_jsonb('Correto'::text), true),
        (select row_version from public.registered_invoices where id='invoice-doc-u'),
        jsonb_set((select to_jsonb(p) - 'row_version' - 'created_at' - 'updated_at' from public.pendencies p where id='pendency-doc-u'), '{status}', to_jsonb('Resolvida'::text), true),
        ((select to_jsonb(a) - 'row_version' - 'created_at' - 'updated_at' from public.pendency_attempts a where id='attempt-doc-u')
            || jsonb_build_object('result','correto','analyzed_at','2029-01-22T11:00:00Z','errors','[]'::jsonb)),
        (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at' from public.verifications v where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        (select row_version from public.pendencies where id='pendency-doc-u'),
        (select row_version from public.verifications where id='04.99.211::2029-01::INVOICE_DOC_ATOMIC'),
        '{"id":"log-doc-u-resolve","school_id":"04.99.211","action":"Reanálise registrada","details":{}}'::jsonb
    )
$$, 'reanálise válida consome o novo envio e resolve a mesma Pendência');
select is((select payload ->> 'analiseDocumentoFiscal' from public.registered_invoices where id='invoice-doc-u'), 'Correto', 'documento identificado torna-se Correto');
select is((select status from public.pendencies where id='pendency-doc-u'), 'Resolvida', 'Pendência vinculada é resolvida');
select is((select payload ->> 'analiseDocumentoFiscal' from public.registered_invoices where id='invoice-doc-b'), 'Incorreto', 'reanálise de uma despesa não altera outra');

select throws_like($$
    update public.registered_invoices
       set competence_id = '2029-02',
           source_context_key = '2029-02_INVOICE_DOC_ATOMIC'
     where id = 'invoice-doc-a'
$$, 'INTEGRITY_CONFLICT: Nota Fiscal possui histórico de pendência individual e não pode alterar escola, competência ou programa%', 'histórico bloqueia deslocamento estrutural da despesa');

select throws_like($$
    delete from public.registered_invoices where id='invoice-doc-a'
$$, 'INTEGRITY_CONFLICT: Nota Fiscal possui histórico de pendência individual e não pode ser excluída%', 'histórico bloqueia exclusão física da despesa');

select * from finish();
rollback;
