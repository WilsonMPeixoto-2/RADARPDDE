-- T4 / clear_item_history: excluir todas as avaliações do item, inclusive resolvidas,
-- sem apagar NF, bonificação, outros documentos, contatos gerais nem histórico sem vínculo.
-- Fixture sintética, sempre com ROLLBACK.
begin;
set local role postgres;
set local search_path = extensions, public, pg_catalog;
select no_plan();

insert into auth.users(id,email)
values ('00000000-0000-0000-0000-00000000b701','t4-history-controller@example.test');
insert into auth.users(id,email)
values ('00000000-0000-0000-0000-00000000b705','t4-history-sme-readonly@example.test');
insert into public.controllers(id,name,user_id)
values ('T4H-C','Controlador Histórico','00000000-0000-0000-0000-00000000b701');
insert into public.user_profiles(user_id,profile_id,controller_id,cre_scope,active)
values ('00000000-0000-0000-0000-00000000b701','controller','T4H-C','T4H-CRE',true);
insert into public.user_profiles(user_id,profile_id,controller_id,cre_scope,active)
values ('00000000-0000-0000-0000-00000000b705','sme_management',null,null,true);
insert into public.schools(id,designation,denomination,cre,inep,cnpj,sici)
values ('T4H-S','04.98.701','Escola Fictícia T4 histórico','T4H-CRE','33980701','98.701.001/0001-01','SICI-T4H');
insert into public.competences(id,label,exercise)
values ('2043-09','Setembro 2043',2043),('2043-10','Outubro 2043',2043);
insert into public.programs(id,name) values ('T4H-A','Programa A'),('T4H-B','Programa B');
insert into public.verifications(id,school_id,competence_id,program_id,bonification,analysis,bonus_result)
values
  ('T4H-V-A09','T4H-S','2043-09','T4H-A','{"notaFiscal":"Sim"}','{"extCC":"Incorreto","extINV":"Correto"}','apta'),
  ('T4H-V-A10','T4H-S','2043-10','T4H-A','{"notaFiscal":"Sim"}','{"extCC":"Correto"}','apta'),
  ('T4H-V-B09','T4H-S','2043-09','T4H-B','{"notaFiscal":"Não"}','{"extCC":"Correto"}','inapta');
insert into public.registered_invoices(id,school_id,competence_id,program_id,verification_id,source_context_key,description,expense_type,invoice_number,amount,payload)
values
  ('T4H-NF-1','T4H-S','2043-09','T4H-A','T4H-V-A09','2043-09_T4H-A','NF correta','consumo','T4H-001',60,'{"analiseDocumentoFiscal":"Correto"}'),
  ('T4H-NF-2','T4H-S','2043-09','T4H-A','T4H-V-A09','2043-09_T4H-A','NF irmã correta','consumo','T4H-002',80,'{"analiseDocumentoFiscal":"Correto"}');
insert into public.pendencies
  (id,school_id,competence_origin,program_id,document_key,status,next_actor,registered_invoice_id,resolved_at,canceled_at)
values
  ('T4H-P-ACT','T4H-S','2043-09','T4H-A','extCC','Aberta','Escola',null,null,null),
  ('T4H-P-RES','T4H-S','2043-09','T4H-A','extCC','Resolvida','Controlador',null,now(),null),
  ('T4H-P-CAN','T4H-S','2043-09','T4H-A','extCC','Cancelada','Controlador',null,null,now()),
  ('T4H-P-OTHER-DOC','T4H-S','2043-09','T4H-A','extINV','Aberta','Escola',null,null,null),
  ('T4H-P-OTHER-MONTH','T4H-S','2043-10','T4H-A','extCC','Aberta','Escola',null,null,null),
  ('T4H-P-OTHER-PROG','T4H-S','2043-09','T4H-B','extCC','Aberta','Escola',null,null,null),
  ('T4H-P-LEGACY','T4H-S','2043-09',null,'extCC','Resolvida','Controlador',null,now(),null),
  ('T4H-P-INVOICE','T4H-S','2043-09','T4H-A','notaFiscal','Resolvida','Controlador','T4H-NF-1',now(),null);
insert into public.pendency_attempts(id,pendency_id,attempt_number)
values ('T4H-A-RES','T4H-P-RES',1);
insert into public.pendency_contacts(id,school_id,pendency_id,contact_type,contact_date,description)
values
  ('T4H-C-RES','T4H-S','T4H-P-RES','email',current_date,'Contato de histórico'),
  ('T4H-C-GENERAL','T4H-S',null,'email',current_date,'Contato geral');

create function pg_temp.t4h_request(p_doc text default 'extCC',p_id text default null)
returns jsonb language sql as $$
select jsonb_build_object('contractVersion',1,'action','clear_item_history',
 'target', jsonb_strip_nulls(jsonb_build_object('kind','analysis','schoolId','T4H-S',
   'competence','2043-09','programId','T4H-A','documentKey',p_doc,'id',p_id)))
$$;
create temp table t4h_preview(plan jsonb);
grant all on t4h_preview to authenticated;

select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000b705","role":"authenticated"}',true);
set local role authenticated;
select throws_like($$ select public.preview_operational_change(pg_temp.t4h_request()) $$,
    'AUTHORIZATION_DENIED%', 'perfil SME somente leitura não pode limpar histórico');
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000b701","role":"authenticated"}',true);
set local role authenticated;

select throws_like($$ select public.preview_operational_change(pg_temp.t4h_request('internal_flags')) $$,
    'VALIDATION_ERROR%', 'campo não reconhecido não pode ser usado como histórico');
select lives_ok($$ insert into t4h_preview select public.preview_operational_change(pg_temp.t4h_request()) $$,
  'controlador pode visualizar limpeza explícita de todo histórico do documento');
select is((select plan #>> '{action}' from t4h_preview),'clear_item_history',
  'operação continua distinta de clear_analysis');
select is((select plan #> '{effects,delete,pendencies}' from t4h_preview),
  '["T4H-P-ACT","T4H-P-CAN","T4H-P-RES"]'::jsonb,
  'histórico inclui Aberta, Cancelada e Resolvida do mesmo item');
select is((select plan #> '{effects,delete,registered_invoices}' from t4h_preview),
  '[]'::jsonb,'não apaga notas fiscais da competência');
select is((select plan #> '{effects,delete,assets}' from t4h_preview),
  '[]'::jsonb,'não apaga patrimônio');
select is((select plan #> '{effects,delete,pendency_attempts}' from t4h_preview),
  '["T4H-A-RES"]'::jsonb,'inclui envios vinculados ao histórico eliminado');
select is((select plan #> '{effects,delete,pendency_contacts}' from t4h_preview),
  '["T4H-C-RES"]'::jsonb,'inclui contato vinculado e não contato geral');
select is((select jsonb_array_length(plan #> '{affectedRecords,pendencies}') from t4h_preview),
  3,'lista visível de histórico acompanha IDs do plano');
select is((select jsonb_array_length(plan #> '{affectedRecords,attempts}') from t4h_preview),
  1,'envio do histórico consta na prévia');
select is((select jsonb_array_length(plan #> '{affectedRecords,contacts}') from t4h_preview),
  1,'contato do histórico consta na prévia');
select is((select count(*)::int from public.pendencies where id='T4H-P-RES'),1,
  'a prévia não altera registros');

select throws_like($$ select public.apply_operational_change(pg_temp.t4h_request(),
  repeat('a',64),'00000000-0000-0000-0000-00000000b703') $$,
  '%STALE_PLAN%','não executa prévia desatualizada');
select is((select count(*)::int from public.pendencies where id='T4H-P-RES'),1,
  'conflito mantém o histórico');

select lives_ok($$ select public.apply_operational_change(pg_temp.t4h_request(),
  (select plan->>'planDigest' from t4h_preview),'00000000-0000-0000-0000-00000000b702') $$,
  'aplicação autenticada remove histórico de forma transacional');
select is((select count(*)::int from public.pendencies where id in ('T4H-P-ACT','T4H-P-RES','T4H-P-CAN')),0,
  'três Pendências do item desaparecem');
select is((select count(*)::int from public.pendencies where id in
  ('T4H-P-OTHER-DOC','T4H-P-OTHER-MONTH','T4H-P-OTHER-PROG','T4H-P-LEGACY','T4H-P-INVOICE')),5,
  'histórico independente, legado não atribuído e NF permanecem');
select is((select count(*)::int from public.registered_invoices where id in ('T4H-NF-1','T4H-NF-2')),2,
  'duas NFs permanecem intactas');
select is((select count(*)::int from public.pendency_contacts where id='T4H-C-GENERAL'),1,
  'contato geral permanece');
select is((select analysis ->> 'extINV' from public.verifications where id='T4H-V-A09'),'Correto',
  'outro documento da mesma verificação não muda');
select is((select bonus_result from public.verifications where id='T4H-V-A09'),'apta',
  'bonificação consolidada é preservada');
select ok((select not (analysis ? 'extCC') from public.verifications where id='T4H-V-A09'),
  'avaliação atual deste documento é limpa');
select ok((select details->>'operationKey'='00000000-0000-0000-0000-00000000b702'
 from public.administrative_logs where id='correcao-operacional-00000000-0000-0000-0000-00000000b702'),
  'log da correção tem operationKey');
select is(public.apply_operational_change(pg_temp.t4h_request(),
  (select plan->>'planDigest' from t4h_preview),'00000000-0000-0000-0000-00000000b702')->>'replayed',
  'true','retry da mesma operação devolve recibo sem excluir duas vezes');
-- NF individual: comprovar o bloqueio estruturado do legado e, depois,
-- a limpeza do histórico com preservação da despesa e da nota vizinha.
reset role;
insert into public.pendencies
  (id,school_id,competence_origin,program_id,document_key,status,next_actor,registered_invoice_id,resolved_at)
values ('T4H-P-NF-LEGACY','T4H-S','2043-09',null,'notaFiscal','Resolvida','Controlador','T4H-NF-1',now());
set local role authenticated;
create temp table t4h_nf_legacy as
select public.preview_operational_change(pg_temp.t4h_request('notaFiscal','T4H-NF-1')) as plan;
select ok((select plan->'blockers' @> '[{"code":"LEGACY_PENDENCY_CONTEXT_CONFLICT"}]'::jsonb from t4h_nf_legacy),
    'NF com Pendência legada devolve bloqueador estruturado na prévia');
select throws_like($$ select public.apply_operational_change(
    pg_temp.t4h_request('notaFiscal','T4H-NF-1'),
    (select plan->>'planDigest' from t4h_nf_legacy),
    '00000000-0000-0000-0000-00000000b706') $$,
    '%PLAN_BLOCKED%', 'bloqueador impede execução, mesmo com digest da prévia');
select is((select count(*)::int from public.pendencies where id in ('T4H-P-INVOICE','T4H-P-NF-LEGACY')),2,
    'bloqueio não remove registros');
reset role;
delete from public.pendencies where id='T4H-P-NF-LEGACY';
set local role authenticated;
create temp table t4h_nf_plan as
select public.preview_operational_change(pg_temp.t4h_request('notaFiscal','T4H-NF-1')) as plan;
select is((select plan #> '{effects,delete,pendencies}' from t4h_nf_plan),
    '["T4H-P-INVOICE"]'::jsonb,'prévia de NF inclui somente histórico da despesa selecionada');
select lives_ok($$ select public.apply_operational_change(
    pg_temp.t4h_request('notaFiscal','T4H-NF-1'),
    (select plan->>'planDigest' from t4h_nf_plan),
    '00000000-0000-0000-0000-00000000b707') $$,
    'limpeza autenticada do histórico fiscal executada');
select is((select count(*)::int from public.registered_invoices where id in ('T4H-NF-1','T4H-NF-2')),2,
    'limpeza fiscal preserva ambas as notas');
select is((select payload->>'analiseDocumentoFiscal' from public.registered_invoices where id='T4H-NF-2'),
    'Correto','preserva análise da nota vizinha');
select is((select count(*)::int from public.pendencies where id='T4H-P-INVOICE'),0,
    'remove histórico fiscal selecionado');
select is((select bonus_result from public.verifications where id='T4H-V-A09'),
    'apta','limpeza fiscal preserva bonificação consolidada');

-- Assessoria: limpar somente histórico da nota, preservar análise fiscal,
-- nota vizinha, contatos gerais e resultado da bonificação.
reset role;
update public.verifications
   set bonification = bonification || '{"consAssessoria":"Sim","consEnviada":true}'::jsonb,
       analysis = analysis || '{"consAssessoria":"Incorreto"}'::jsonb
 where id='T4H-V-A09';
insert into public.registered_invoices
  (id,school_id,competence_id,program_id,verification_id,source_context_key,description,expense_type,invoice_number,amount,payload)
values
 ('T4H-NF-SVC-1','T4H-S','2043-09','T4H-A','T4H-V-A09','2043-09_T4H-A','Serviço alvo','servico','T4H-SVC-01',420,
  '{"analiseDocumentoFiscal":"Correto","consultaAssessoriaEnviada":true,"analiseConsultaAssessoria":"Incorreto"}'),
 ('T4H-NF-SVC-2','T4H-S','2043-09','T4H-A','T4H-V-A09','2043-09_T4H-A','Serviço vizinho','servico','T4H-SVC-02',310,
  '{"analiseDocumentoFiscal":"Correto","consultaAssessoriaEnviada":true,"analiseConsultaAssessoria":"Correto"}');
insert into public.pendencies
 (id,school_id,competence_origin,program_id,document_key,status,next_actor,registered_invoice_id,resolved_at)
values
 ('T4H-P-SVC-ACT','T4H-S','2043-09','T4H-A','consAssessoria','Aberta','Escola','T4H-NF-SVC-1',null),
 ('T4H-P-SVC-RES','T4H-S','2043-09','T4H-A','consAssessoria','Resolvida','Controlador','T4H-NF-SVC-1',now());
insert into public.pendency_attempts(id,pendency_id,attempt_number) values ('T4H-A-SVC-RES','T4H-P-SVC-RES',1);
insert into public.pendency_contacts(id,school_id,pendency_id,contact_type,contact_date,description)
values ('T4H-C-SVC-RES','T4H-S','T4H-P-SVC-RES','email',current_date,'Contato Assessoria');
set local role authenticated;
create temp table t4h_svc_plan as
select public.preview_operational_change(pg_temp.t4h_request('consAssessoria','T4H-NF-SVC-1')) as plan;
select is((select plan #> '{effects,delete,pendencies}' from t4h_svc_plan),'["T4H-P-SVC-ACT","T4H-P-SVC-RES"]'::jsonb,'prévia exata de Assessoria');
select is((select plan #> '{effects,delete,pendency_attempts}' from t4h_svc_plan),'["T4H-A-SVC-RES"]'::jsonb,'prévia inclui envio');
select is((select plan #> '{effects,delete,pendency_contacts}' from t4h_svc_plan),'["T4H-C-SVC-RES"]'::jsonb,'prévia inclui contato');
select is((select plan #> '{effects,delete,registered_invoices}' from t4h_svc_plan),'[]'::jsonb,'preserva despesas');
select lives_ok($$ select public.apply_operational_change(
  pg_temp.t4h_request('consAssessoria','T4H-NF-SVC-1'),
  (select plan->>'planDigest' from t4h_svc_plan),'00000000-0000-0000-0000-00000000b708') $$,
  'limpeza autenticada de Assessoria');
select is((select count(*)::int from public.pendencies where id in ('T4H-P-SVC-ACT','T4H-P-SVC-RES')),0,'remove histórico da nota alvo');
select is((select count(*)::int from public.pendency_attempts where id='T4H-A-SVC-RES'),0,'remove envio vinculado');
select is((select count(*)::int from public.pendency_contacts where id='T4H-C-SVC-RES'),0,'remove contato vinculado');
select is((select count(*)::int from public.pendency_contacts where id='T4H-C-GENERAL'),1,'preserva contato geral');
select is((select count(*)::int from public.registered_invoices where id in ('T4H-NF-SVC-1','T4H-NF-SVC-2')),2,'preserva ambas as notas');
select is((select payload->>'analiseConsultaAssessoria' from public.registered_invoices where id='T4H-NF-SVC-1'),'Não analisado','limpa análise de Assessoria alvo');
select is((select payload->>'analiseDocumentoFiscal' from public.registered_invoices where id='T4H-NF-SVC-1'),'Correto','preserva análise fiscal');
select is((select payload->>'analiseConsultaAssessoria' from public.registered_invoices where id='T4H-NF-SVC-2'),'Correto','preserva nota vizinha');
select is((select analysis->>'consAssessoria' from public.verifications where id='T4H-V-A09'),'Não analisado','recomputa resumo mensal');
select is((select bonification->>'consAssessoria' from public.verifications where id='T4H-V-A09'),'Sim','preserva bonificação de Assessoria');
select is((select bonus_result from public.verifications where id='T4H-V-A09'),'apta','preserva resultado consolidado');

-- Despesa a identificar: bloqueio no servidor, não apenas ausência do botão.
reset role;
insert into public.registered_invoices
  (id,school_id,competence_id,program_id,verification_id,source_context_key,description,expense_type,invoice_number,amount,payload)
values ('T4H-NF-AID','T4H-S','2043-09','T4H-A','T4H-V-A09','2043-09_T4H-A','Saída a identificar','a_identificar',null,195,'{"analiseDocumentoFiscal":"Incorreto"}');
insert into public.pendencies
  (id,school_id,competence_origin,program_id,document_key,status,next_actor,registered_invoice_id)
values ('T4H-P-AID','T4H-S','2043-09','T4H-A','notaFiscal','Aberta','Escola','T4H-NF-AID');
set local role authenticated;
create temp table t4h_aid_plan as
select public.preview_operational_change(pg_temp.t4h_request('notaFiscal','T4H-NF-AID')) as plan;
select ok((select plan->'blockers' @> '[{"code":"MANDATORY_ANALYSIS"}]'::jsonb from t4h_aid_plan),'bloqueador MANDATORY_ANALYSIS na prévia');
select throws_like($$ select public.apply_operational_change(
  pg_temp.t4h_request('notaFiscal','T4H-NF-AID'),
  (select plan->>'planDigest' from t4h_aid_plan),'00000000-0000-0000-0000-00000000b709') $$,
  '%PLAN_BLOCKED%','recusa limpar histórico de despesa a identificar');
select is((select count(*)::int from public.registered_invoices where id='T4H-NF-AID'),1,'preserva despesa');
select is((select count(*)::int from public.pendencies where id='T4H-P-AID'),1,'preserva Pendência obrigatória');

select * from finish();
rollback;
