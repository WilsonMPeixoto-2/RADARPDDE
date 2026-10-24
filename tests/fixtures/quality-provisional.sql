-- Exclusivo da pilha Supabase descartável. Carregar depois do full-contract,
-- que substitui a base. Não executar em Production.
insert into public.programs(id, name, description)
values ('CONECTADA', 'Educação Conectada', 'Fixture da jornada PDDE Qualidade')
on conflict (id) do nothing;

insert into public.schools(id, designation, denomination, inep, cnpj, sici,
                          cre, ra, controller_id, initial_competence, inventory_process)
values ('ESC-QUALITY', '04.00.494', 'Escola da Conta PDDE Qualidade',
        '33900494', '90.049.400/0001-94', 'SICI-QUALITY-494',
        '4ª CRE', '10', 'controller-local', '2026-05', 'PROC-QUALITY-494');

insert into public.school_programs(id, school_id, program_id, active, starts_on)
values ('ESC-QUALITY_CONECTADA', 'ESC-QUALITY', 'CONECTADA', true, '2026-01-01');
