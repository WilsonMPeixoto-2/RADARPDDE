begin;
set local role postgres;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(19);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000253', 'corrective-submission-hotfix@example.test');
insert into public.user_profiles (user_id, profile_id, cre_scope)
values ('00000000-0000-0000-0000-000000000253', 'technical_admin', null);

insert into public.competences (id, label, exercise, bonus_deadline)
values ('2029-09', 'Setembro de 2029', 2029, '2029-10-15');

insert into public.programs (id, name)
values
    ('HOTFIX_ADVISORY', 'Hotfix Assessoria com múltiplas NFs'),
    ('HOTFIX_FISCAL', 'Hotfix substituição fiscal');

insert into public.schools (
    id, designation, denomination, cre, initial_competence, inep, cnpj, sici
) values (
    '04.99.253', '04.99.253', 'Escola Hotfix Novo Envio',
    '4ª CRE', '2029-09', '33990253', '90.025.300/0001-53', 'SICI-HOTFIX-253'
);

insert into public.verifications (
    id, school_id, competence_id, program_id, bonification, analysis, payload
) values
(
    '04.99.253::2029-09::HOTFIX_ADVISORY',
    '04.99.253', '2029-09', 'HOTFIX_ADVISORY',
    '{"consAssessoria":"Sim","consEnviada":true}'::jsonb,
    '{"consAssessoria":"Incorreto"}'::jsonb,
    '{}'::jsonb
),
(
    '04.99.253::2029-09::HOTFIX_FISCAL',
    '04.99.253', '2029-09', 'HOTFIX_FISCAL',
    '{"notaFiscal":"Sim","consAssessoria":"Não se aplica","consEnviada":false}'::jsonb,
    '{"notaFiscal":"Incorreto","consAssessoria":"Correto"}'::jsonb,
    '{}'::jsonb
);

insert into public.registered_invoices (
    id, school_id, competence_id, program_id, verification_id, source_context_key,
    description, expense_type, invoice_number, amount, payload
) values
(
    'hotfix-advisory-a', '04.99.253', '2029-09', 'HOTFIX_ADVISORY',
    '04.99.253::2029-09::HOTFIX_ADVISORY', '2029-09_HOTFIX_ADVISORY',
    'Serviço A', 'servico', 'ADV-A', 100,
    '{"consultaAssessoriaEnviada":false,"analiseConsultaAssessoria":"Incorreto"}'::jsonb
),
(
    'hotfix-advisory-b', '04.99.253', '2029-09', 'HOTFIX_ADVISORY',
    '04.99.253::2029-09::HOTFIX_ADVISORY', '2029-09_HOTFIX_ADVISORY',
    'Serviço B', 'servico', 'ADV-B', 200,
    '{"consultaAssessoriaEnviada":true,"analiseConsultaAssessoria":"Incorreto"}'::jsonb
),
(
    'hotfix-fiscal-a', '04.99.253', '2029-09', 'HOTFIX_FISCAL',
    '04.99.253::2029-09::HOTFIX_FISCAL', '2029-09_HOTFIX_FISCAL',
    'Material fiscal A', 'consumo', 'FISC-A', 300,
    '{"analiseDocumentoFiscal":"Incorreto"}'::jsonb
);

insert into public.pendencies (
    id, school_id, competence_origin, program_id, document_key, registered_invoice_id,
    status, responsible_area, next_actor, reason, notes, opened_at, payload
) values
(
    'hotfix-pendency-advisory', '04.99.253', '2029-09', 'HOTFIX_ADVISORY',
    'consAssessoria', 'hotfix-advisory-a', 'Aberta', 'Escola', 'Escola',
    'Dados divergentes', 'Corrigir consulta A', '2029-09-10T12:00:00Z',
    '{"registeredInvoiceId":"hotfix-advisory-a","tentativas":[]}'::jsonb
),
(
    'hotfix-pendency-fiscal', '04.99.253', '2029-09', 'HOTFIX_FISCAL',
    'notaFiscal', 'hotfix-fiscal-a', 'Aberta', 'Escola', 'Escola',
    'Documento incompleto', 'Corrigir documento fiscal A', '2029-09-10T12:05:00Z',
    '{"registeredInvoiceId":"hotfix-fiscal-a","tentativas":[]}'::jsonb
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000253', true);

-- Assessoria: a NF-alvo volta a Não analisado, mas a irmã Incorreta mantém
-- o agregado mensal Incorreto.
select lives_ok($$
    select public.register_service_advisory_attempt(
        jsonb_set(
            (select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at'
               from public.registered_invoices i where id='hotfix-advisory-a'),
            '{payload,analiseConsultaAssessoria}',
            to_jsonb('Não analisado'::text),
            true
        ),
        (select row_version from public.registered_invoices where id='hotfix-advisory-a'),
        (
            (select to_jsonb(p) - 'row_version' - 'created_at' - 'updated_at'
               from public.pendencies p where id='hotfix-pendency-advisory')
            || jsonb_build_object(
                'status','Aguardando reanálise',
                'responsible_area','Controlador',
                'next_actor','Controlador',
                'payload',jsonb_build_object(
                    'registeredInvoiceId','hotfix-advisory-a',
                    'tentativas',jsonb_build_array(
                        jsonb_build_object('id','hotfix-advisory-attempt-1','numero',1,'status','aguardando')
                    )
                )
            )
        ),
        (select row_version from public.pendencies where id='hotfix-pendency-advisory'),
        '{"id":"hotfix-advisory-attempt-1","pendency_id":"hotfix-pendency-advisory","attempt_number":1,"available_at":"2029-09-11T09:00:00Z","submitted_at":"2029-09-11T10:00:00Z","analyzed_at":null,"result":null,"observation":"Consulta A corrigida","drive_url":"https://drive.example/hotfix/advisory-1","errors":[],"payload":{"status":"aguardando"}}'::jsonb,
        jsonb_set(
            (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at'
               from public.verifications v where id='04.99.253::2029-09::HOTFIX_ADVISORY'),
            '{analysis,consAssessoria}',
            to_jsonb('Incorreto'::text),
            true
        ),
        (select row_version from public.verifications where id='04.99.253::2029-09::HOTFIX_ADVISORY'),
        '{"id":"hotfix-log-advisory-1","school_id":"04.99.253","action":"Novo envio Assessoria","details":{}}'::jsonb
    )
$$, 'novo envio da Assessoria aceita agregado Incorreto quando NF irmã permanece Incorreta');

select is(
    (select payload ->> 'analiseConsultaAssessoria' from public.registered_invoices where id='hotfix-advisory-a'),
    'Não analisado',
    'NF-alvo da Assessoria volta a Não analisado'
);
select is(
    (select payload ->> 'analiseConsultaAssessoria' from public.registered_invoices where id='hotfix-advisory-b'),
    'Incorreto',
    'NF irmã da Assessoria permanece Incorreta'
);
select is(
    (select analysis ->> 'consAssessoria' from public.verifications where id='04.99.253::2029-09::HOTFIX_ADVISORY'),
    'Incorreto',
    'agregado mensal da Assessoria permanece Incorreto'
);
select is(
    (select status from public.pendencies where id='hotfix-pendency-advisory'),
    'Aguardando reanálise',
    'Pendência de Assessoria passa a Aguardando reanálise'
);
select is(
    (select available_at::text from public.pendency_attempts where id='hotfix-advisory-attempt-1'),
    '2029-09-11 09:00:00+00',
    'data de disponibilização da Assessoria é persistida'
);
select is(
    (select observation from public.pendency_attempts where id='hotfix-advisory-attempt-1'),
    'Consulta A corrigida',
    'observação da Assessoria é persistida'
);
select is(
    (select drive_url from public.pendency_attempts where id='hotfix-advisory-attempt-1'),
    'https://drive.example/hotfix/advisory-1',
    'link da Assessoria é persistido'
);
select is(
    (select count(*)::integer from public.administrative_logs where id='hotfix-log-advisory-1'),
    1,
    'log administrativo do novo envio da Assessoria é persistido'
);

-- Substituição: a UI permite substituir o envio mais recente enquanto já
-- aguarda reanálise. A RPC precisa aceitar o mesmo contrato.
select lives_ok($$
    select public.register_service_advisory_attempt(
        (select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at'
           from public.registered_invoices i where id='hotfix-advisory-a'),
        (select row_version from public.registered_invoices where id='hotfix-advisory-a'),
        (
            (select to_jsonb(p) - 'row_version' - 'created_at' - 'updated_at'
               from public.pendencies p where id='hotfix-pendency-advisory')
            || jsonb_build_object(
                'status','Aguardando reanálise',
                'responsible_area','Controlador',
                'next_actor','Controlador',
                'payload',jsonb_build_object(
                    'registeredInvoiceId','hotfix-advisory-a',
                    'tentativas',jsonb_build_array(
                        jsonb_build_object('id','hotfix-advisory-attempt-1','numero',1,'status','substituida_antes_da_analise'),
                        jsonb_build_object('id','hotfix-advisory-attempt-2','numero',2,'status','aguardando')
                    )
                )
            )
        ),
        (select row_version from public.pendencies where id='hotfix-pendency-advisory'),
        '{"id":"hotfix-advisory-attempt-2","pendency_id":"hotfix-pendency-advisory","attempt_number":2,"available_at":"2029-09-12T09:00:00Z","submitted_at":"2029-09-12T10:00:00Z","analyzed_at":null,"result":null,"observation":"Consulta A substituída","drive_url":"https://drive.example/hotfix/advisory-2","errors":[],"payload":{"status":"aguardando"}}'::jsonb,
        (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at'
           from public.verifications v where id='04.99.253::2029-09::HOTFIX_ADVISORY'),
        (select row_version from public.verifications where id='04.99.253::2029-09::HOTFIX_ADVISORY'),
        '{"id":"hotfix-log-advisory-2","school_id":"04.99.253","action":"Substituição Assessoria","details":{}}'::jsonb
    )
$$, 'substituição da Assessoria é aceita enquanto a Pendência aguarda reanálise');

select is(
    (select payload ->> 'status' from public.pendency_attempts where id='hotfix-advisory-attempt-1'),
    'substituida_antes_da_analise',
    'tentativa anterior da Assessoria é marcada como substituída'
);
select is(
    (select payload ->> 'status' from public.pendency_attempts where id='hotfix-advisory-attempt-2'),
    'aguardando',
    'substituição mais recente da Assessoria fica aguardando'
);
select is(
    (select count(*)::integer from public.pendency_attempts where pendency_id='hotfix-pendency-advisory'),
    2,
    'histórico da Assessoria preserva as duas tentativas'
);

-- Documento fiscal individual já identificado: primeira tentativa e
-- substituição devem compartilhar o mesmo contrato de estado.
select lives_ok($$
    select public.register_invoice_document_attempt(
        jsonb_set(
            (select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at'
               from public.registered_invoices i where id='hotfix-fiscal-a'),
            '{payload,analiseDocumentoFiscal}',
            to_jsonb('Não analisado'::text),
            true
        ),
        (select row_version from public.registered_invoices where id='hotfix-fiscal-a'),
        null,
        null,
        (
            (select to_jsonb(p) - 'row_version' - 'created_at' - 'updated_at'
               from public.pendencies p where id='hotfix-pendency-fiscal')
            || jsonb_build_object(
                'status','Aguardando reanálise',
                'responsible_area','Controlador',
                'next_actor','Controlador',
                'payload',jsonb_build_object(
                    'registeredInvoiceId','hotfix-fiscal-a',
                    'tentativas',jsonb_build_array(
                        jsonb_build_object('id','hotfix-fiscal-attempt-1','numero',1,'status','aguardando')
                    )
                )
            )
        ),
        (select row_version from public.pendencies where id='hotfix-pendency-fiscal'),
        '{"id":"hotfix-fiscal-attempt-1","pendency_id":"hotfix-pendency-fiscal","attempt_number":1,"available_at":"2029-09-11T11:00:00Z","submitted_at":"2029-09-11T12:00:00Z","analyzed_at":null,"result":null,"observation":"Documento fiscal corrigido","drive_url":"https://drive.example/hotfix/fiscal-1","errors":[],"payload":{"status":"aguardando"}}'::jsonb,
        jsonb_set(
            (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at'
               from public.verifications v where id='04.99.253::2029-09::HOTFIX_FISCAL'),
            '{analysis,notaFiscal}',
            to_jsonb('Não analisado'::text),
            true
        ),
        (select row_version from public.verifications where id='04.99.253::2029-09::HOTFIX_FISCAL'),
        '{"id":"hotfix-log-fiscal-1","school_id":"04.99.253","action":"Novo envio fiscal","details":{}}'::jsonb
    )
$$, 'primeiro novo envio fiscal individual é persistido');

select is(
    (select status from public.pendencies where id='hotfix-pendency-fiscal'),
    'Aguardando reanálise',
    'Pendência fiscal passa a Aguardando reanálise'
);

select lives_ok($$
    select public.register_invoice_document_attempt(
        (select to_jsonb(i) - 'row_version' - 'created_at' - 'updated_at'
           from public.registered_invoices i where id='hotfix-fiscal-a'),
        (select row_version from public.registered_invoices where id='hotfix-fiscal-a'),
        null,
        null,
        (
            (select to_jsonb(p) - 'row_version' - 'created_at' - 'updated_at'
               from public.pendencies p where id='hotfix-pendency-fiscal')
            || jsonb_build_object(
                'status','Aguardando reanálise',
                'responsible_area','Controlador',
                'next_actor','Controlador',
                'payload',jsonb_build_object(
                    'registeredInvoiceId','hotfix-fiscal-a',
                    'tentativas',jsonb_build_array(
                        jsonb_build_object('id','hotfix-fiscal-attempt-1','numero',1,'status','substituida_antes_da_analise'),
                        jsonb_build_object('id','hotfix-fiscal-attempt-2','numero',2,'status','aguardando')
                    )
                )
            )
        ),
        (select row_version from public.pendencies where id='hotfix-pendency-fiscal'),
        '{"id":"hotfix-fiscal-attempt-2","pendency_id":"hotfix-pendency-fiscal","attempt_number":2,"available_at":"2029-09-12T11:00:00Z","submitted_at":"2029-09-12T12:00:00Z","analyzed_at":null,"result":null,"observation":"Documento fiscal substituído","drive_url":"https://drive.example/hotfix/fiscal-2","errors":[],"payload":{"status":"aguardando"}}'::jsonb,
        (select to_jsonb(v) - 'row_version' - 'created_at' - 'updated_at'
           from public.verifications v where id='04.99.253::2029-09::HOTFIX_FISCAL'),
        (select row_version from public.verifications where id='04.99.253::2029-09::HOTFIX_FISCAL'),
        '{"id":"hotfix-log-fiscal-2","school_id":"04.99.253","action":"Substituição fiscal","details":{}}'::jsonb
    )
$$, 'substituição fiscal individual é aceita enquanto aguarda reanálise');

select is(
    (select payload ->> 'status' from public.pendency_attempts where id='hotfix-fiscal-attempt-1'),
    'substituida_antes_da_analise',
    'tentativa fiscal anterior é marcada como substituída'
);
select is(
    (select payload ->> 'status' from public.pendency_attempts where id='hotfix-fiscal-attempt-2'),
    'aguardando',
    'substituição fiscal mais recente fica aguardando'
);
select is(
    (select count(*)::integer from public.pendency_attempts where pendency_id='hotfix-pendency-fiscal'),
    2,
    'histórico fiscal preserva as duas tentativas'
);

select * from finish();
rollback;
