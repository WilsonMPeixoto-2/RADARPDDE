-- Massa da jornada autenticada de correção na pilha descartável.
\ir quality-provisional.sql

-- A competência de fechamento continua em maio. Junho permite observar
-- uma Pendência de maio no Passivo da competência seguinte.
insert into public.competences (id, label, exercise, starts_on, ends_on, bonus_deadline)
values ('2026-06', 'Junho 2026', 2026, '2026-06-01', '2026-06-30', '2026-07-15')
on conflict (id) do nothing;

-- Mesma escola com uma NF antiga em maio e duas em junho, sem análise fiscal individual.
insert into public.schools(id, designation, denomination, cre, controller_id, initial_competence, inep, cnpj, sici)
values ('ESC-OCC-LEGACY', '04.00.537', 'Escola de Teste do Histórico', '4ª CRE', 'controller-local', '2026-05',
        '33900537', '90.053.700/0001-37', 'SICI-OCC-LEGACY');
insert into public.school_programs(id, school_id, program_id, active, starts_on)
values ('ESC-OCC-LEGACY_BASIC', 'ESC-OCC-LEGACY', 'BASIC', true, '2026-01-01');
insert into public.verifications(id, school_id, competence_id, program_id, bonification, analysis)
values ('ESC-OCC-LEGACY::2026-05::BASIC','ESC-OCC-LEGACY','2026-05','BASIC','{"notaFiscal":"Sim"}','{"notaFiscal":"Correto"}'),
       ('ESC-OCC-LEGACY::2026-06::BASIC','ESC-OCC-LEGACY','2026-06','BASIC','{"notaFiscal":"Sim"}','{"notaFiscal":"Correto"}');
insert into public.registered_invoices(id, school_id, competence_id, program_id,
    source_context_key, description, expense_type, invoice_number, amount)
values ('OCC-LEG-MAI','ESC-OCC-LEGACY','2026-05','BASIC','2026-05_BASIC','Nota de maio','consumo','LEG-MAI',20),
       ('OCC-LEG-JUN-A','ESC-OCC-LEGACY','2026-06','BASIC','2026-06_BASIC','Primeira nota de junho','consumo','LEG-JUN-A',30),
       ('OCC-LEG-JUN-B','ESC-OCC-LEGACY','2026-06','BASIC','2026-06_BASIC','Segunda nota de junho','consumo','LEG-JUN-B',40);
