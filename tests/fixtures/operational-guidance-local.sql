-- D022: dados sintéticos para navegação somente de leitura, depois das suítes
-- que substituem a base local. Não depende de pilotos T4/T5 ou banco institucional.
-- Dependências: seed BASIC/2026-05, controller-local e identidades Auth locais.
insert into public.programs(id,name,description)
values ('GUIDANCE_STABLE','Programa Sintético Consolidado','Contraprova de resultado já consolidado sem alteração pendente.');

insert into public.schools
  (id,designation,denomination,cre,controller_id,initial_competence,inep,cnpj,sici)
values ('ESC-GUIDANCE-LOCAL','04.90.890','Escola Sintética de Orientação','4ª CRE',
  'controller-local','2026-05','33900890','90.022.890/0001-90','SICI-GUIDANCE-LOCAL');

insert into public.school_programs(id,school_id,program_id,active,starts_on)
values ('ESC-GUIDANCE-LOCAL_BASIC','ESC-GUIDANCE-LOCAL','BASIC',true,'2026-01-01'),
  ('ESC-GUIDANCE-LOCAL_STABLE','ESC-GUIDANCE-LOCAL','GUIDANCE_STABLE',true,'2026-01-01');

insert into public.verifications
  (id,school_id,competence_id,program_id,bonification,analysis,bonus_result,payload)
values ('ESC-GUIDANCE-LOCAL::2026-05::BASIC','ESC-GUIDANCE-LOCAL','2026-05','BASIC',
  '{"extCC":"Sim","extINV":"Sim","notaFiscal":"Sim","declBBAgil":"Sim","consAssessoria":"Não se aplica","encampInventario":"Sim"}',
  '{"extCC":"Incorreto","extINV":"Correto","notaFiscal":"Correto"}','apta',
  '{"bonificacaoPendenteConsolidacao":true}'),
  ('ESC-GUIDANCE-LOCAL::2026-05::GUIDANCE_STABLE','ESC-GUIDANCE-LOCAL','2026-05','GUIDANCE_STABLE',
  '{"extCC":"Sim","extINV":"Sim","notaFiscal":"Sim","declBBAgil":"Sim","consAssessoria":"Não se aplica","encampInventario":"Não se aplica"}',
  '{"notaFiscal":"Correto"}','apta','{}');

-- Duas despesas no contexto impedem copiar a análise mensal para a nota sem
-- avaliação fiscal individual. A identificar continua sendo natureza distinta.
insert into public.registered_invoices
  (id,school_id,competence_id,program_id,verification_id,source_context_key,
   description,expense_type,invoice_number,amount,payload)
values ('GUIDANCE-FISCAL','ESC-GUIDANCE-LOCAL','2026-05','BASIC',
  'ESC-GUIDANCE-LOCAL::2026-05::BASIC','2026-05_BASIC','Papel para atividades sintéticas',
  'consumo','GUI-101',120,'{}'),
  ('GUIDANCE-IDENTIFY','ESC-GUIDANCE-LOCAL','2026-05','BASIC',
  'ESC-GUIDANCE-LOCAL::2026-05::BASIC','2026-05_BASIC','Despesa sintética a identificar',
  'a_identificar',null,75,'{}');

insert into public.pendencies
  (id,school_id,competence_origin,program_id,document_key,status,responsible_area,next_actor,
   reason,opened_at,payload)
values ('GUIDANCE-REVIEW','ESC-GUIDANCE-LOCAL','2026-05','BASIC','extCC',
  'Aguardando reanálise','Controlador','Controlador','Documento incompleto',now()-interval '40 days',
  '{"tipo":"documental","item":"Extrato Conta Corrente","errosAtuais":["Documento incompleto"]}');
insert into public.pendency_attempts
  (id,pendency_id,attempt_number,available_at,submitted_at,result,created_by,payload)
values ('GUIDANCE-ATTEMPT','GUIDANCE-REVIEW',1,current_date-2,now()-interval '2 days',null,
  '22222222-2222-4222-8222-222222222222','{"status":"aguardando"}');

insert into public.assets
  (id,school_id,competence_id,description,expense_type,invoice_number,amount,status,inventory_process,payload)
values ('GUIDANCE-ASSET','ESC-GUIDANCE-LOCAL','2026-05','Mesa sintética para conferência',
  'permanente','GUI-PAT-101',250,'Encaminhada','PROC-SINTETICO-GUIDANCE','{"programaId":"BASIC"}');
