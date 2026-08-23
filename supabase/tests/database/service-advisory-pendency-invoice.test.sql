begin;
set local role postgres;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(4);

insert into public.competences (id, label, exercise, bonus_deadline)
values ('2028-10', 'Outubro de 2028', 2028, '2028-11-15');

insert into public.programs (id, name)
values ('ADVISORY_INVOICE', 'Programa teste pendência por NF');

insert into public.schools (id, designation, denomination, cre, initial_competence, inep, cnpj, sici)
values (
    '04.99.194',
    '04.99.194',
    'Escola teste pendência por NF',
    '4ª CRE',
    '2028-10',
    '33990194',
    '90.019.400/0001-94',
    'SICI-ADVISORY-194'
);

insert into public.registered_invoices (
    id, school_id, competence_id, program_id, source_context_key,
    description, expense_type, invoice_number, amount
) values
(
    'invoice-advisory-a', '04.99.194', '2028-10', 'ADVISORY_INVOICE',
    '2028-10_ADVISORY_INVOICE', 'Serviço A', 'servico', 'NF-ADV-A', 100
),
(
    'invoice-advisory-b', '04.99.194', '2028-10', 'ADVISORY_INVOICE',
    '2028-10_ADVISORY_INVOICE', 'Serviço B', 'servico', 'NF-ADV-B', 200
);

select has_column(
    'public',
    'pendencies',
    'registered_invoice_id',
    'pendência canônica possui vínculo opcional com Nota Fiscal'
);

select lives_ok(
    $$
    insert into public.pendencies (
        id, school_id, competence_origin, program_id, document_key,
        registered_invoice_id, status, reason, notes
    ) values
    (
        'pendency-advisory-a', '04.99.194', '2028-10', 'ADVISORY_INVOICE',
        'consAssessoria', 'invoice-advisory-a', 'Aberta', 'Dados divergentes', 'NF A'
    ),
    (
        'pendency-advisory-b', '04.99.194', '2028-10', 'ADVISORY_INVOICE',
        'consAssessoria', 'invoice-advisory-b', 'Aberta', 'Dados divergentes', 'NF B'
    )
    $$,
    'NFs distintas podem possuir pendências de Assessoria ativas simultaneamente'
);

select is(
    (select count(*)::integer
       from public.pendencies
      where school_id = '04.99.194'
        and document_key = 'consAssessoria'
        and status in ('Aberta', 'Aguardando reanálise')),
    2,
    'as duas pendências permanecem ativas e independentes'
);

select throws_like(
    $$
    insert into public.pendencies (
        id, school_id, competence_origin, program_id, document_key,
        registered_invoice_id, status, reason, notes
    ) values (
        'pendency-advisory-a-duplicate', '04.99.194', '2028-10', 'ADVISORY_INVOICE',
        'consAssessoria', 'invoice-advisory-a', 'Aberta', 'Outro erro', 'duplicada'
    )
    $$,
    'duplicate key value violates unique constraint%',
    'a mesma NF não aceita duas pendências de Assessoria ativas'
);

select * from finish();
rollback;
