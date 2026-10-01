-- Exclusivo da pilha descartável de CI. Não executar em Production.
-- Contextos exclusivos do PR397: a primeira escola não tem verification;
-- a segunda começa consolidada. As despesas serão gravadas pelos controles UI.
insert into public.schools(id,designation,denomination,inep,cnpj,sici,cre,controller_id,initial_competence)
values ('ESC-INDEP','04.00.397','Escola Despesa Independente','33900397','90.039.700/0001-97','SICI-INDEP-397','4ª CRE','controller-local','2026-05'),
       ('ESC-INDEP-CONS','04.00.398','Escola Bonificação Consolidada','33900398','90.039.800/0001-98','SICI-INDEP-398','4ª CRE','controller-local','2026-05');
insert into public.school_programs(id,school_id,program_id)
values ('ESC-INDEP_BASIC','ESC-INDEP','BASIC'), ('ESC-INDEP-CONS_BASIC','ESC-INDEP-CONS','BASIC');
insert into public.verifications(id,school_id,competence_id,program_id,bonification,analysis,bonus_result)
values ('ESC-INDEP-CONS::2026-05::BASIC','ESC-INDEP-CONS','2026-05','BASIC',
    '{"extCC":"Sim","extINV":"Sim","notaFiscal":"Não","consAssessoria":"Não se aplica","declBBAgil":"Sim","encampInventario":"Não se aplica"}',
    '{"extCC":"Correto","extINV":"Correto","notaFiscal":"Não analisado","consAssessoria":"Correto","declBBAgil":"Correto","encampInventario":"Correto"}','inapta');
insert into public.competences (id, label, exercise, starts_on, ends_on, bonus_deadline)
values ('2026-06', 'Junho 2026', 2026, '2026-06-01', '2026-06-30', '2026-07-15')
on conflict (id) do nothing;
insert into public.programs (id, name, description)
values ('CONECTADA', 'Educação Conectada', 'Fixture de UAT operacional')
on conflict (id) do nothing;
insert into public.school_programs(id,school_id,program_id)
values ('ESC-INDEP_CONECTADA','ESC-INDEP','CONECTADA');
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

-- Fase 2: contexto exclusivo descartável. NF A ativa não bloqueia NF B,
-- cujo histórico fiscal contém encerramento e cancelamento.
insert into public.schools (id, designation, denomination, inep, cnpj, sici, controller_id, cre, initial_competence, inventory_process)
select 'ESC-TYPE', '04.00.405', 'Escola Retificação de Classificação', '33900405', '90.040.500/0001-05', 'SICI-TYPE-405', controller_id, cre, initial_competence, inventory_process
from public.schools where id = 'ESC-UAT';
insert into public.school_programs (id, school_id, program_id)
values ('ESC-TYPE_BASIC', 'ESC-TYPE', 'BASIC');
insert into public.verifications (id, school_id, competence_id, program_id, bonification, analysis, bonus_result)
values ('ESC-TYPE::2026-05::BASIC', 'ESC-TYPE', '2026-05', 'BASIC',
    '{"extCC":"Sim","notaFiscal":"Não","consAssessoria":"Não","encampInventario":"Não se aplica"}',
    '{"notaFiscal":"Incorreto","consAssessoria":"Não analisado","encampInventario":"Correto"}', 'inapta');
insert into public.registered_invoices (id, school_id, competence_id, program_id, verification_id, source_context_key, description, expense_type, invoice_number, amount, payload)
values ('TYPE-REMOTE', 'ESC-TYPE', '2026-05', 'BASIC', 'ESC-TYPE::2026-05::BASIC', '2026-05_BASIC',
        'Documento com ciclo fiscal encerrado', 'consumo', 'NF-TYPE', 150, '{"analiseDocumentoFiscal":"Correto"}'),
       ('TYPE-ACTIVE', 'ESC-TYPE', '2026-05', 'BASIC', 'ESC-TYPE::2026-05::BASIC', '2026-05_BASIC',
        'Documento com Pendência ativa', 'consumo', 'NF-ACTIVE', 200, '{"analiseDocumentoFiscal":"Incorreto"}'),
       ('TYPE-ADVISORY', 'ESC-TYPE', '2026-05', 'BASIC', 'ESC-TYPE::2026-05::BASIC', '2026-05_BASIC',
        'Serviço com histórico de Assessoria', 'servico', 'NF-ADVISORY', 250,
        '{"analiseDocumentoFiscal":"Correto","consultaAssessoriaEnviada":false,"analiseConsultaAssessoria":"Não analisado"}');
insert into public.pendencies (id, school_id, competence_origin, program_id, document_key, registered_invoice_id, status, reason, payload)
values ('TYPE-HISTORY-R', 'ESC-TYPE', '2026-05', 'BASIC', 'notaFiscal', 'TYPE-REMOTE', 'Resolvida', 'Dados divergentes',
        '{"documentSnapshot":{"tipo":"consumo","numero":"NF-TYPE","valor":150},"historico":[]}'),
       ('TYPE-HISTORY-C', 'ESC-TYPE', '2026-05', 'BASIC', 'notaFiscal', 'TYPE-REMOTE', 'Cancelada', 'Dados divergentes',
        '{"documentSnapshot":{"tipo":"consumo","numero":"NF-TYPE","valor":150},"historico":[]}'),
       ('TYPE-HISTORY-ACTIVE', 'ESC-TYPE', '2026-05', 'BASIC', 'notaFiscal', 'TYPE-ACTIVE', 'Aberta', 'Dados divergentes', '{}'),
       ('TYPE-HISTORY-ADVISORY', 'ESC-TYPE', '2026-05', 'BASIC', 'consAssessoria', 'TYPE-ADVISORY', 'Cancelada', 'Documento ausente', '{}');
