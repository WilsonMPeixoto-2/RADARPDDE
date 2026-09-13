-- Exclusivo da pilha descartável de CI. Não executar em Production.
insert into public.competences (id, label, exercise, starts_on, ends_on, bonus_deadline)
values ('2026-06', 'Junho 2026', 2026, '2026-06-01', '2026-06-30', '2026-07-15')
on conflict (id) do nothing;
insert into public.programs (id, name, description)
values ('CONECTADA', 'Educação Conectada', 'Fixture de UAT operacional')
on conflict (id) do nothing;
insert into public.schools (id, designation, denomination, inep, cnpj, sici, cre, ra, controller_id, initial_competence, inventory_process)
values ('ESC-UAT', '04.00.003', 'Escola de Homologação Operacional', '33900003', '90.000.003/0001-03', 'SICI-UAT-003', '4ª CRE', '10', 'controller-local', '2026-05', 'PROC-UAT-003')
on conflict (id) do nothing;
insert into public.school_programs (id, school_id, program_id, active, starts_on)
values ('ESC-UAT_BASIC', 'ESC-UAT', 'BASIC', true, '2026-01-01'),
       ('ESC-UAT_CONECTADA', 'ESC-UAT', 'CONECTADA', true, '2026-01-01')
on conflict (id) do nothing;

-- Contexto exclusivo da restauração de edição (banco local descartável).
insert into public.schools (id, designation, denomination, inep, cnpj, sici, controller_id, cre, initial_competence, inventory_process)
select 'ESC-EDIT', '04.00.004', 'Escola de Edição Auditável', '33900004', '90.000.004/0001-04', 'SICI-EDIT-004', controller_id, cre, initial_competence, inventory_process
from public.schools where id = 'ESC-UAT'
on conflict (id) do nothing;
insert into public.school_programs (id, school_id, program_id)
values ('ESC-EDIT_BASIC', 'ESC-EDIT', 'BASIC') on conflict (id) do nothing;
