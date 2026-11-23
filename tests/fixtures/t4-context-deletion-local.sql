-- T4: exclusivamente escola fictícia de exclusão contextual, no Supabase local.
-- Não reutilizar dados de escolas ou usuários institucionais.
insert into public.schools
  (id,designation,denomination,cre,controller_id,initial_competence,inep,cnpj,sici)
values
  ('ESC-T4-CONTEXT','04.00.546','Escola Fictícia de Correção de Contexto',
   '4ª CRE','controller-local','2026-05','33900546','90.054.600/0001-46','SICI-T4-CONTEXT');
insert into public.school_programs(id,school_id,program_id,active,starts_on)
select 'ESC-T4-CONTEXT_' || id,'ESC-T4-CONTEXT',id,true,'2026-01-01'
  from public.programs where id in ('BASIC','CONECTADA');
insert into public.verifications
  (id,school_id,competence_id,program_id,bonification,analysis,bonus_result)
values
  ('ESC-T4-CONTEXT::2026-05::BASIC','ESC-T4-CONTEXT','2026-05','BASIC',
   '{"notaFiscal":"Sim"}','{"notaFiscal":"Correto"}','apta'),
  ('ESC-T4-CONTEXT::2026-05::CONECTADA','ESC-T4-CONTEXT','2026-05','CONECTADA',
   '{"notaFiscal":"Sim"}','{"notaFiscal":"Correto"}','apta'),
  ('ESC-T4-CONTEXT::2026-06::BASIC','ESC-T4-CONTEXT','2026-06','BASIC',
   '{"notaFiscal":"Sim"}','{"notaFiscal":"Correto"}','apta');
insert into public.assets
  (id,school_id,competence_id,description,expense_type,invoice_number,amount,status)
values ('T4-CTX-AS-1','ESC-T4-CONTEXT','2026-05',
  'Bem fictício do programa errado','permanente','T4-CTX-001',1890,'Inventariada');
insert into public.registered_invoices
  (id,school_id,competence_id,program_id,verification_id,
   source_context_key,description,expense_type,invoice_number,amount,linked_asset_id,payload)
values
  ('T4-CTX-NF-A','ESC-T4-CONTEXT','2026-05','BASIC',
   'ESC-T4-CONTEXT::2026-05::BASIC','2026-05_BASIC',
   'Bem lançado no mês e programa errados','permanente','T4-CTX-001',1890,'T4-CTX-AS-1','{}'),
  ('T4-CTX-NF-B','ESC-T4-CONTEXT','2026-05','BASIC',
   'ESC-T4-CONTEXT::2026-05::BASIC','2026-05_BASIC',
   'Material de expediente no contexto errado','consumo','T4-CTX-002',45,null,'{}'),
  ('T4-CTX-NF-NEIGHBOR','ESC-T4-CONTEXT','2026-05','CONECTADA',
   'ESC-T4-CONTEXT::2026-05::CONECTADA','2026-05_CONECTADA',
   'Material no programa vizinho','consumo','T4-CTX-003',75,null,'{}'),
  ('T4-CTX-NF-JUNE','ESC-T4-CONTEXT','2026-06','BASIC',
   'ESC-T4-CONTEXT::2026-06::BASIC','2026-06_BASIC',
   'Material na competência seguinte','consumo','T4-CTX-004',105,null,'{}');
insert into public.pendencies
  (id,school_id,competence_origin,program_id,document_key,status,next_actor,registered_invoice_id)
values
  ('T4-CTX-P-NF','ESC-T4-CONTEXT','2026-05','BASIC','notaFiscal','Aberta','Escola','T4-CTX-NF-A'),
  ('T4-CTX-P-MAN','ESC-T4-CONTEXT','2026-05','BASIC','extCC','Aberta','Escola',null),
  ('T4-CTX-P-NEIGHBOR','ESC-T4-CONTEXT','2026-05','CONECTADA','extCC','Aberta','Escola',null);
insert into public.pendency_attempts(id,pendency_id,attempt_number)
values ('T4-CTX-ATT','T4-CTX-P-NF',1);
insert into public.pendency_contacts(id,school_id,pendency_id,contact_type,contact_date,description)
values
  ('T4-CTX-C-LINK','ESC-T4-CONTEXT','T4-CTX-P-NF','email',current_date,'Contato ligado ao alvo'),
  ('T4-CTX-C-GENERAL','ESC-T4-CONTEXT',null,'email',current_date,'Contato geral independente');
