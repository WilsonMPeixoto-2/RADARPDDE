-- T4 clear_item_history: dados inteiramente sintéticos, somente Supabase local descartável.
-- Escolas e programas separados da fixture de delete_context, para evitar interferência.
insert into public.schools
  (id,designation,denomination,cre,controller_id,initial_competence,inep,cnpj,sici)
values ('ESC-T4-HISTORY','04.00.558','Escola Fictícia de Histórico do Item',
        '4ª CRE','controller-local','2026-05','33900558','90.055.800/0001-58','SICI-T4-HISTORY');
insert into public.school_programs(id,school_id,program_id,active,starts_on)
select 'ESC-T4-HISTORY_' || id,'ESC-T4-HISTORY',id,true,'2026-01-01'
  from public.programs where id in ('BASIC','CONECTADA');
insert into public.verifications
  (id,school_id,competence_id,program_id,bonification,analysis,bonus_result)
values
  ('ESC-T4-HISTORY::2026-05::BASIC','ESC-T4-HISTORY','2026-05','BASIC',
   '{"notaFiscal":"Sim","consAssessoria":"Sim","consEnviada":true}','{"extCC":"Incorreto","extINV":"Correto","notaFiscal":"Incorreto","consAssessoria":"Incorreto"}','apta'),
  ('ESC-T4-HISTORY::2026-05::CONECTADA','ESC-T4-HISTORY','2026-05','CONECTADA',
   '{"notaFiscal":"Sim"}','{"extCC":"Correto"}','apta'),
  ('ESC-T4-HISTORY::2026-06::BASIC','ESC-T4-HISTORY','2026-06','BASIC',
   '{"notaFiscal":"Sim"}','{"extCC":"Correto"}','apta');
insert into public.registered_invoices
  (id,school_id,competence_id,program_id,verification_id,source_context_key,
   description,expense_type,invoice_number,amount,payload)
values
 ('T4H-NF-1','ESC-T4-HISTORY','2026-05','BASIC',
  'ESC-T4-HISTORY::2026-05::BASIC','2026-05_BASIC',
  'Material de consumo mantido após limpeza do histórico','consumo','T4H-001',115,'{"analiseDocumentoFiscal":"Correto"}'),
 ('T4H-NF-SVC','ESC-T4-HISTORY','2026-05','BASIC','ESC-T4-HISTORY::2026-05::BASIC','2026-05_BASIC',
 'Serviço de manutenção','servico','T4H-SVC-1',420,'{"analiseDocumentoFiscal":"Correto","consultaAssessoriaEnviada":true,"analiseConsultaAssessoria":"Incorreto"}'),
 ('T4H-NF-SVC-2','ESC-T4-HISTORY','2026-05','BASIC','ESC-T4-HISTORY::2026-05::BASIC','2026-05_BASIC',
 'Serviço vizinho','servico','T4H-SVC-2',310,'{"analiseDocumentoFiscal":"Correto","consultaAssessoriaEnviada":true,"analiseConsultaAssessoria":"Correto"}'),
 ('T4H-NF-AID','ESC-T4-HISTORY','2026-05','BASIC','ESC-T4-HISTORY::2026-05::BASIC','2026-05_BASIC',
 'Saída bancária provisória a identificar T4','a_identificar',null,195,'{"analiseDocumentoFiscal":"Incorreto"}');
insert into public.pendencies
  (id,school_id,competence_origin,program_id,document_key,status,next_actor,
   registered_invoice_id,resolved_at,canceled_at)
values
 ('T4H-P-ACT','ESC-T4-HISTORY','2026-05','BASIC','extCC','Aberta','Escola',null,null,null),
 ('T4H-P-RES','ESC-T4-HISTORY','2026-05','BASIC','extCC','Resolvida','Controlador',null,now(),null),
 ('T4H-P-CAN','ESC-T4-HISTORY','2026-05','BASIC','extCC','Cancelada','Controlador',null,null,now()),
 ('T4H-P-OTHER-DOC','ESC-T4-HISTORY','2026-05','BASIC','extINV','Aberta','Escola',null,null,null),
 ('T4H-P-OTHER-PROG','ESC-T4-HISTORY','2026-05','CONECTADA','extCC','Aberta','Escola',null,null,null),
 ('T4H-P-OTHER-MONTH','ESC-T4-HISTORY','2026-06','BASIC','extCC','Aberta','Escola',null,null,null),
 ('T4H-P-LEGACY','ESC-T4-HISTORY','2026-05',null,'extCC','Resolvida','Controlador',null,now(),null),
 ('T4H-P-INVOICE','ESC-T4-HISTORY','2026-05','BASIC','notaFiscal','Resolvida','Controlador','T4H-NF-1',now(),null),
 ('T4H-P-SVC-ACT','ESC-T4-HISTORY','2026-05','BASIC','consAssessoria','Aberta','Escola','T4H-NF-SVC',null,null),
 ('T4H-P-SVC-RES','ESC-T4-HISTORY','2026-05','BASIC','consAssessoria','Resolvida','Controlador','T4H-NF-SVC',now(),null),
 ('T4H-P-AID','ESC-T4-HISTORY','2026-05','BASIC','notaFiscal','Aberta','Escola','T4H-NF-AID',null,null);
insert into public.pendency_attempts(id,pendency_id,attempt_number)
values ('T4H-ATT-1','T4H-P-RES',1),('T4H-ATT-SVC-1','T4H-P-SVC-RES',1);
insert into public.pendency_contacts(id,school_id,pendency_id,contact_type,contact_date,description)
values
 ('T4H-CONTACT-1','ESC-T4-HISTORY','T4H-P-RES','email',current_date,'Complemento recebido'),
 ('T4H-CONTACT-SVC-1','ESC-T4-HISTORY','T4H-P-SVC-RES','email',current_date,'Consulta à Assessoria reenviada'),
 ('T4H-GENERAL','ESC-T4-HISTORY',null,'telefone',current_date,'Contato geral preservado');
