begin;
set local role postgres;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(4);

insert into public.competences (id, label, exercise, bonus_deadline)
values
    ('2028-11', 'Novembro de 2028', 2028, '2028-12-15'),
    ('2028-12', 'Dezembro de 2028', 2028, '2029-01-15');

insert into public.programs (id, name)
values ('ADVISORY_HISTORY_LOCK', 'Programa teste trava histórica da Assessoria');

insert into public.schools (id, designation, denomination, cre, initial_competence, inep, cnpj, sici)
values (
    '04.99.195',
    '04.99.195',
    'Escola teste trava histórica',
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
    'invoice-advisory-history-lock',
    '04.99.195',
    '2028-11',
    'ADVISORY_HISTORY_LOCK',
    '2028-11_ADVISORY_HISTORY_LOCK',
    'Serviço original',
    'servico',
    'NF-HISTORY-LOCK',
    100
);

insert into public.pendencies (
    id, school_id, competence_origin, program_id, document_key,
    registered_invoice_id, status, reason, notes
) values (
    'pendency-advisory-history-lock',
    '04.99.195',
    '2028-11',
    'ADVISORY_HISTORY_LOCK',
    'consAssessoria',
    'invoice-advisory-history-lock',
    'Resolvida',
    'Teste de rastreabilidade',
    'Histórico encerrado, vínculo preservado'
);

select lives_ok(
    $$
    update public.registered_invoices
       set description = 'Serviço corrigido',
           invoice_number = 'NF-HISTORY-LOCK-A',
           amount = 125
     where id = 'invoice-advisory-history-lock'
    $$,
    'campos não estruturais continuam editáveis após existir histórico de pendência'
);

select throws_like(
    $$
    update public.registered_invoices
       set expense_type = 'consumo'
     where id = 'invoice-advisory-history-lock'
    $$,
    'INTEGRITY_CONFLICT: Nota Fiscal possui histórico de pendência individual e não pode alterar escola, competência, programa ou natureza%',
    'natureza da NF fica protegida depois do vínculo histórico'
);

select throws_like(
    $$
    update public.registered_invoices
       set competence_id = '2028-12',
           source_context_key = '2028-12_ADVISORY_HISTORY_LOCK'
     where id = 'invoice-advisory-history-lock'
    $$,
    'INTEGRITY_CONFLICT: Nota Fiscal possui histórico de pendência individual e não pode alterar escola, competência, programa ou natureza%',
    'competência da NF fica protegida depois do vínculo histórico'
);

select throws_like(
    $$
    delete from public.registered_invoices
     where id = 'invoice-advisory-history-lock'
    $$,
    'INTEGRITY_CONFLICT: Nota Fiscal possui histórico de pendência individual e não pode ser excluída%',
    'NF com histórico de pendência não pode ser excluída fisicamente'
);

select * from finish();
rollback;
