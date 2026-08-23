begin;
set local role postgres;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(2);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000195', 'advisory-rpc-admin@example.test');

insert into public.user_profiles (user_id, profile_id, cre_scope)
values ('00000000-0000-0000-0000-000000000195', 'technical_admin', null);

insert into public.competences (id, label, exercise, bonus_deadline)
values ('2028-11', 'Novembro de 2028', 2028, '2028-12-15');

insert into public.programs (id, name)
values ('ADVISORY_RPC', 'Programa teste RPC Assessoria');

insert into public.schools (id, designation, denomination, cre, initial_competence, inep, cnpj, sici)
values (
    '04.99.195',
    '04.99.195',
    'Escola teste RPC Assessoria',
    '4ª CRE',
    '2028-11',
    '33990195',
    '90.019.500/0001-95',
    'SICI-ADVISORY-195'
);

insert into public.registered_invoices (
    id, school_id, competence_id, program_id, source_context_key,
    description, expense_type, invoice_number, amount
) values (
    'invoice-advisory-rpc',
    '04.99.195',
    '2028-11',
    'ADVISORY_RPC',
    '2028-11_ADVISORY_RPC',
    'Serviço RPC',
    'servico',
    'NF-ADV-RPC',
    350
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000195', true);

select lives_ok($$
    select public.save_pendency_command(
        'open',
        '{
            "id":"pendency-advisory-rpc",
            "school_id":"04.99.195",
            "competence_origin":"2028-11",
            "program_id":"ADVISORY_RPC",
            "document_key":"consAssessoria",
            "registered_invoice_id":"invoice-advisory-rpc",
            "status":"Aberta",
            "responsible_area":"Escola",
            "next_actor":"Escola",
            "reason":"Dados divergentes",
            "notes":"Parecer da Assessoria requer correção",
            "opened_at":"2028-11-20T12:00:00Z",
            "payload":{"registeredInvoiceId":"invoice-advisory-rpc"}
        }'::jsonb,
        null,
        null,
        null,
        null,
        '{
            "id":"log-advisory-rpc",
            "school_id":"04.99.195",
            "action":"Pendência de Assessoria Aberta",
            "details":{}
        }'::jsonb
    )
$$, 'RPC abre pendência individual de Assessoria');

select is(
    (select registered_invoice_id
       from public.pendencies
      where id = 'pendency-advisory-rpc'),
    'invoice-advisory-rpc',
    'RPC persiste o vínculo canônico com a NF específica'
);

select * from finish();
rollback;
