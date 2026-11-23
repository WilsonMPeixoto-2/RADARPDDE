-- Release 2 / T4: exclusão de contexto exato, nunca transposição automática.
-- RED até existir planner/apply para delete_context. Dados sintéticos em rollback.
begin;
set local role postgres;
set local search_path = extensions, public, pg_catalog;
select plan(22);

insert into auth.users(id,email) values
  ('00000000-0000-0000-0000-00000000a601','r2-context-controller@example.test');
insert into public.controllers(id,name,user_id)
values ('R2C-CTRL','Controlador Contexto','00000000-0000-0000-0000-00000000a601');
insert into public.user_profiles(user_id,profile_id,controller_id,cre_scope,active)
values ('00000000-0000-0000-0000-00000000a601','controller','R2C-CTRL','R2C-CRE',true);
insert into public.schools(id,designation,denomination,cre,inep,cnpj,sici)
values ('R2C-S','04.98.601','Escola T4 Contexto','R2C-CRE','33980601','98.601.001/0001-01','SICI-R2C');
insert into public.competences(id,label,exercise) values
  ('2043-09','Setembro 2043',2043),('2043-10','Outubro 2043',2043);
insert into public.programs(id,name) values
  ('R2C-A','Programa A'),('R2C-B','Programa B');
insert into public.verifications(id,school_id,competence_id,program_id,bonification,analysis,bonus_result)
values
  ('R2C-V-A09','R2C-S','2043-09','R2C-A','{"notaFiscal":"Sim"}','{"notaFiscal":"Correto"}','apta'),
  ('R2C-V-A10','R2C-S','2043-10','R2C-A','{"notaFiscal":"Sim"}','{"notaFiscal":"Correto"}','apta'),
  ('R2C-V-B09','R2C-S','2043-09','R2C-B','{"notaFiscal":"Sim"}','{"notaFiscal":"Correto"}','apta');
insert into public.assets(id,school_id,competence_id,description,expense_type,invoice_number,amount,status)
values ('R2C-AS-1','R2C-S','2043-09','Patrimônio lançado no mês errado','permanente','R2C-001',1800,'Inventariada');
insert into public.registered_invoices
  (id,school_id,competence_id,program_id,verification_id,source_context_key,description,expense_type,invoice_number,amount,linked_asset_id,payload)
values
  ('R2C-NF-1','R2C-S','2043-09','R2C-A','R2C-V-A09','2043-09_R2C-A','NF permanente incorreta','permanente','R2C-001',1800,'R2C-AS-1','{}'),
  ('R2C-NF-2','R2C-S','2043-09','R2C-A','R2C-V-A09','2043-09_R2C-A','NF consumo incorreta','consumo','R2C-002',120,null,'{}'),
  ('R2C-NF-OUT-MONTH','R2C-S','2043-10','R2C-A','R2C-V-A10','2043-10_R2C-A','NF mês vizinho','consumo','R2C-003',210,null,'{}'),
  ('R2C-NF-OUT-PROG','R2C-S','2043-09','R2C-B','R2C-V-B09','2043-09_R2C-B','NF programa vizinho','consumo','R2C-004',310,null,'{}');
insert into public.pendencies
  (id,school_id,competence_origin,program_id,document_key,status,next_actor,registered_invoice_id,resolved_at)
values
  ('R2C-P-NF','R2C-S','2043-09','R2C-A','notaFiscal','Aberta','Escola','R2C-NF-1',null),
  ('R2C-P-MANUAL','R2C-S','2043-09','R2C-A','extCC','Aguardando reanálise','Controlador',null,null),
  ('R2C-P-OUT','R2C-S','2043-10','R2C-A','extCC','Resolvida','Controlador',null,now());
insert into public.pendency_attempts(id,pendency_id,attempt_number)
values ('R2C-ATT-1','R2C-P-NF',1);
insert into public.pendency_contacts(id,school_id,pendency_id,contact_type,contact_date,description)
values
  ('R2C-C-LINK','R2C-S','R2C-P-NF','email',current_date,'Contato da Pendência'),
  ('R2C-C-MANUAL','R2C-S','R2C-P-MANUAL','telefone',current_date,'Contato manual'),
  ('R2C-C-GENERAL','R2C-S',null,'telefone',current_date,'Contato geral independente');
insert into public.quality_provisional_movements
  (id,school_id,competence_id,debit_date,description,amount,status,registered_invoice_id,identification_operation_key,created_by,updated_by)
values
  ('00000000-0000-0000-0000-00000000a651','R2C-S','2043-09','2043-09-05','Provisória identificada',120,'identified','R2C-NF-2','00000000-0000-0000-0000-00000000a650','00000000-0000-0000-0000-00000000a601','00000000-0000-0000-0000-00000000a601'),
  ('00000000-0000-0000-0000-00000000a652','R2C-S','2043-09','2043-09-06','Provisória aberta',75,'open',null,null,'00000000-0000-0000-0000-00000000a601','00000000-0000-0000-0000-00000000a601');

create function pg_temp.r2c_request(p_competence text default '2043-09',p_program text default 'R2C-A')
returns jsonb language sql as $$
 select jsonb_build_object('contractVersion',1,'action','delete_context',
   'target',jsonb_build_object('kind','program_context','schoolId','R2C-S','competence',p_competence,'programId',p_program))
$$;
create temp table r2c_plan(plan jsonb);
grant all on r2c_plan to authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000a601","role":"authenticated"}',true);
set local role authenticated;

select ok(not has_function_privilege('authenticated',
  'radar_private.apply_operational_change_impl_r2(jsonb,text,uuid)','EXECUTE'),
  'a aplicação pré-T4 não pode ser invocada diretamente para deixar a verificação órfã');
select lives_ok($$ insert into r2c_plan values(public.preview_operational_change(pg_temp.r2c_request())) $$,
  'prévia autenticada do pacote completo de escola/mês/programa');
select is((select plan #>> '{target,kind}' from r2c_plan),'program_context','contexto tem tipo semântico explícito');
select is((select plan #>> '{target,competence}' from r2c_plan),'2043-09','prévia mantém a competência exata');
select is((select plan #> '{effects,delete,verifications}' from r2c_plan),'["R2C-V-A09"]'::jsonb,
  'apenas a verificação do contexto exato será removida');
select is((select plan #> '{effects,delete,registered_invoices}' from r2c_plan),'["R2C-NF-1","R2C-NF-2"]'::jsonb,
  'não inclui a NF do outro mês nem a de outro programa');
select is((select plan #> '{effects,delete,pendencies}' from r2c_plan),'["R2C-P-MANUAL","R2C-P-NF"]'::jsonb,
  'seleciona Pendências do programa, incluindo a manual explícita');
select is((select plan #> '{effects,delete,pendency_attempts}' from r2c_plan),'["R2C-ATT-1"]'::jsonb,
  'conta tentativa vinculada antes de excluir');
select is((select plan #> '{effects,delete,pendency_contacts}' from r2c_plan),'["R2C-C-LINK","R2C-C-MANUAL"]'::jsonb,
  'não elimina contato geral independente');
select is((select plan #> '{effects,delete,assets}' from r2c_plan),'["R2C-AS-1"]'::jsonb,
  'bem exclusivo do pacote aparece na prévia');
select is((select plan #>> '{effects,update,0,entity}' from r2c_plan),'quality_provisional_movements',
  'provisória identificada será reaberta, não eliminada');
select is((select count(*)::int from public.verifications where id='R2C-V-A09'),1,
  'prévia é somente leitura');
select lives_ok($$ select public.apply_operational_change(pg_temp.r2c_request(),
    (select plan->>'planDigest' from r2c_plan),'00000000-0000-0000-0000-00000000a661') $$,
  'aplicação única transacional confirma exclusão do contexto errado');
select is((select count(*)::int from public.verifications where id='R2C-V-A09'),0,'verificação alvo excluída');
select is((select count(*)::int from public.registered_invoices where id in ('R2C-NF-1','R2C-NF-2')),0,
  'as duas NFs alvo são excluídas');
select is((select count(*)::int from public.pendencies where id in ('R2C-P-NF','R2C-P-MANUAL')),0,
  'Pendências dependentes excluídas');
select is((select count(*)::int from public.assets where id='R2C-AS-1'),0,
  'bem inventariado exclusivo excluído sob guarda transacional');
select is((select count(*)::int from public.verifications where id in ('R2C-V-A10','R2C-V-B09')),2,
  'verificações de outro mês/programa preservadas');
select is((select count(*)::int from public.registered_invoices where id in ('R2C-NF-OUT-MONTH','R2C-NF-OUT-PROG')),2,
  'notas vizinhas preservadas');
select is((select count(*)::int from public.pendency_contacts where id='R2C-C-GENERAL'),1,
  'contato geral permanece');
select is((select status from public.quality_provisional_movements where id='00000000-0000-0000-0000-00000000a651'),'open',
  'provisória identificada reabre sem ficar órfã');
select is(public.apply_operational_change(pg_temp.r2c_request(),
    (select plan->>'planDigest' from r2c_plan),'00000000-0000-0000-0000-00000000a661')->>'replayed',
  'true','mesma operationKey devolve o recibo anterior sem nova exclusão');
select * from finish();
rollback;
