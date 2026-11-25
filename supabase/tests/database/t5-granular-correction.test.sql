-- T5: fatos persistidos, recomposição causal, autorizações e convergência.
-- Dados integralmente sintéticos; nada sobrevive ao ROLLBACK.
begin;
set local role postgres;
set local search_path=extensions,public,pg_catalog;
select no_plan();

insert into auth.users(id,email) values
 ('00000000-0000-0000-0000-00000000c501','t5-backend-controller@example.test'),
 ('00000000-0000-0000-0000-00000000c502','t5-backend-inventory@example.test'),
 ('00000000-0000-0000-0000-00000000c503','t5-backend-reader@example.test'),
 ('00000000-0000-0000-0000-00000000c504','t5-backend-original-author@example.test');
insert into public.controllers(id,name,user_id) values
 ('T5B-CTRL','Controlador colaborador T5','00000000-0000-0000-0000-00000000c501');
insert into public.inventory_team_members(id,name,user_id)
 values('T5B-MEMBER','Inventariador sintético','00000000-0000-0000-0000-00000000c502');
insert into public.user_profiles(user_id,profile_id,controller_id,inventory_member_id,cre_scope,active) values
 ('00000000-0000-0000-0000-00000000c501','controller','T5B-CTRL',null,'T5B-CRE',true),
 ('00000000-0000-0000-0000-00000000c502','inventory',null,'T5B-MEMBER','T5B-CRE',true),
 ('00000000-0000-0000-0000-00000000c503','sme_management',null,null,null,true);
insert into public.schools(id,designation,denomination,cre,inep,cnpj,sici) values
 ('T5B-S','04.99.501','Escola sintética correção granular','T5B-CRE','33999501','98.501.001/0001-01','T5B-SICI'),
 ('T5B-OTHER','04.99.502','Escola de outra CRE','T5B-OTHER-CRE','33999502','98.502.001/0001-01','T5B-OTHER');
insert into public.competences(id,label,exercise,bonus_deadline)
 values('2045-03','Março 2045',2045,'2045-03-10');
insert into public.programs(id,name) select 'T5B-'||x,'Programa sintético '||x
 from unnest(array['TEXT','DATE','REVIEW','DELETE','PREVIOUS','OLD','AMBIG','CANCEL','CONTACT','INV','OTHER',
  'TEXT-LEGACY-INC','TEXT-LEGACY-COR','REOPEN','REOPEN-AMBIG']) x;
insert into public.verifications(id,school_id,competence_id,program_id,bonification,analysis,bonus_result)
 select 'T5B-V-'||x,'T5B-S','2045-03','T5B-'||x,
  '{"extCC":"Sim","notaFiscal":"Não","encampInventario":"Sim"}',
  '{"extCC":"Correto","extINV":"Correto","notaFiscal":"Incorreto","encampInventario":"Correto"}','apta'
 from unnest(array['TEXT','DATE','REVIEW','DELETE','PREVIOUS','OLD','AMBIG','CANCEL','CONTACT','INV','OTHER',
  'TEXT-LEGACY-INC','TEXT-LEGACY-COR','REOPEN','REOPEN-AMBIG']) x;
insert into public.pendencies(id,school_id,competence_origin,program_id,document_key,status,resolved_at,canceled_at,payload)
 select 'T5B-P-'||x,'T5B-S','2045-03','T5B-'||x,'extCC',
  case when x in ('DELETE','AMBIG') then 'Aguardando reanálise' when x='CANCEL' then 'Cancelada' else 'Resolvida' end,
  case when x not in ('DELETE','AMBIG','CANCEL') then '2045-03-05T12:00:00Z'::timestamptz end,
  case when x='CANCEL' then '2045-03-06T12:00:00Z'::timestamptz end,
  jsonb_build_object('errosAtuais',jsonb_build_array('Erro inicial'),
   'historico',jsonb_build_array(jsonb_build_object('id','T5B-OPEN-'||x,'tipo','abertura',
    'dataHora','2045-03-01T12:00:00Z','usuario','Autor original','perfil','Controlador',
    'erros',jsonb_build_array('Erro inicial'))))
 from unnest(array['TEXT','DATE','REVIEW','DELETE','PREVIOUS','OLD','AMBIG','CANCEL','CONTACT',
  'TEXT-LEGACY-INC','TEXT-LEGACY-COR','REOPEN','REOPEN-AMBIG']) x;

create function pg_temp.t5b_attempt(p_case text,p_number int,p_result text,p_status text default null)
returns void language plpgsql as $$
declare pid text:='T5B-P-'||p_case; aid text:=pid||'-A'||p_number; analyzed timestamptz;
begin
 analyzed:=case when p_result is not null then ('2045-03-0'||(p_number+2)||'T12:00:00Z')::timestamptz end;
 insert into public.pendency_attempts(id,pendency_id,attempt_number,submitted_at,available_at,analyzed_at,
   result,observation,drive_url,errors,payload,created_by)
 values(aid,pid,p_number,'2045-03-02T12:00:00Z','2045-03-02T00:00:00Z',analyzed,p_result,
  'Observação original','https://example.test/documento',
  case when p_result='incorreto' then '["Erro da primeira revisão"]'::jsonb else '[]'::jsonb end,
  jsonb_build_object('status',coalesce(p_status,case when p_result is null then 'aguardando' else 'analisada' end),
   'registradoPor','Autor original','analisadoPor',case when p_result is not null then 'Revisor original' end,
   'analisadoPorId',case when p_result is not null then '00000000-0000-0000-0000-00000000c504' end,
   'authenticatedRoleAnalise',case when p_result is not null then 'controller' end,
   'actingProfileAnalise',case when p_result is not null then 'Controlador' end,
   'observacaoAnalise',case when p_result is not null then 'Texto da revisão' end),
  '00000000-0000-0000-0000-00000000c504');
 update public.pendencies set payload=jsonb_set(payload,'{historico}',payload->'historico'||
   jsonb_build_array(jsonb_build_object('id',aid||'-SEND','tipo','novo_envio','tentativaId',aid,
     'dataHora','2045-03-02T12:00:00Z','usuario','Autor original','perfil','Controlador','detalhe','Envio original'))||
   case when p_result is not null then jsonb_build_array(jsonb_build_object('id',aid||'-REVIEW',
     'tipo',case p_result when 'correto' then 'reanalise_correta' else 'reanalise_incorreta' end,
     'tentativaId',aid,'dataHora',analyzed,'usuario','Revisor original','perfil','Controlador',
     'detalhe','Detalhe original preservável')) else '[]'::jsonb end)
 where id=pid;
end $$;
select pg_temp.t5b_attempt('TEXT',1,'correto');
select pg_temp.t5b_attempt('DATE',1,'correto');
select pg_temp.t5b_attempt('REVIEW',1,'correto');
update public.pendencies set payload=payload||'{"resolved_at":"2045-03-05T12:00:00Z","responsible_area":"Escola","next_actor":"Escola","reason":"Motivo legado"}'::jsonb
 where id in ('T5B-P-REVIEW','T5B-P-DATE');
select pg_temp.t5b_attempt('DELETE',1,null,'substituida_antes_da_analise');
select pg_temp.t5b_attempt('DELETE',2,null);
select pg_temp.t5b_attempt('PREVIOUS',1,'incorreto');
select pg_temp.t5b_attempt('PREVIOUS',2,'correto');
select pg_temp.t5b_attempt('OLD',1,'incorreto');
select pg_temp.t5b_attempt('OLD',2,'correto');
select pg_temp.t5b_attempt('AMBIG',1,'incorreto');
select pg_temp.t5b_attempt('AMBIG',2,null);
select pg_temp.t5b_attempt('CANCEL',1,'incorreto');
select pg_temp.t5b_attempt('TEXT-LEGACY-INC',1,'incorreto');
select pg_temp.t5b_attempt('TEXT-LEGACY-COR',1,'correto');
update public.pendency_attempts set errors='[]' where id='T5B-P-TEXT-LEGACY-INC-A1';
update public.pendency_attempts set errors='["Erro legado independente"]' where id='T5B-P-TEXT-LEGACY-COR-A1';
select pg_temp.t5b_attempt('REOPEN',1,'correto');
select pg_temp.t5b_attempt('REOPEN',2,'correto');
select pg_temp.t5b_attempt('REOPEN-AMBIG',1,'correto');
select pg_temp.t5b_attempt('REOPEN-AMBIG',2,'correto');
update public.pendency_attempts set submitted_at='2045-03-04T09:00:00Z',available_at='2045-03-04T00:00:00Z'
 where id in ('T5B-P-REOPEN-A2','T5B-P-REOPEN-AMBIG-A2');
update public.pendencies p set payload=jsonb_set(payload,'{historico}',
 (select jsonb_agg(case when e->>'id'=p.id||'-A2-SEND' then e||'{"dataHora":"2045-03-04T09:00:00Z"}'::jsonb else e end order by n)
  from jsonb_array_elements(payload->'historico') with ordinality as history(e,n))||
 jsonb_build_array(jsonb_build_object('id',p.id||'-REOPEN','tipo','reabertura','dataHora','2045-03-03T18:00:00Z',
  'usuario','Operador da reabertura','perfil','Controlador')||case when p.id='T5B-P-REOPEN'
   then '{"erros":["Apontamento real da reabertura"]}'::jsonb else '{}'::jsonb end))
 where p.id in ('T5B-P-REOPEN','T5B-P-REOPEN-AMBIG');
update public.pendencies set payload=payload||jsonb_build_object('cancelamento',jsonb_build_object('dataHora',canceled_at),
 'historico',payload->'historico'||jsonb_build_array(jsonb_build_object('id','T5B-CANCEL-EVENT','tipo','cancelamento',
 'dataHora',canceled_at,'usuario','Outro operador','perfil','Controlador'))) where id='T5B-P-CANCEL';
insert into public.pendency_contacts(id,school_id,pendency_id,contact_type,contact_date,description,payload,created_by)
 values('T5B-C-GENERAL','T5B-S',null,'E-mail','2045-03-03','Contato geral independente','{}','00000000-0000-0000-0000-00000000c504'),
 ('T5B-C-LINKED','T5B-S','T5B-P-CONTACT','WhatsApp','2045-03-03','Contato vinculado',
  '{"pendency_id":"T5B-P-CONTACT","official_charge":true,"cobrancaEnvioRegistro":true,"description":"Texto legado"}',
  '00000000-0000-0000-0000-00000000c504'),
 ('T5B-C-STALE','T5B-S',null,'Telefone','2045-03-03','Contato concorrente','{}','00000000-0000-0000-0000-00000000c504');
insert into public.assets(id,school_id,competence_id,description,expense_type,status,inventory_process,inventoried_at,inventoried_by_member_id,payload)
 values('T5B-ASSET-MANUAL','T5B-S','2045-03','Bem manual independente','permanente','Inventariada','PROC-MANUAL',
  '2045-03-04T12:00:00Z','T5B-MEMBER','{}'),
 ('T5B-ASSET-LINKED','T5B-S','2045-03','Bem de despesa','permanente','Inventariada','PROC-NF',
  '2045-03-04T12:00:00Z','T5B-MEMBER','{"programaId":"T5B-INV","inventoried_at":"2045-03-04T12:00:00Z","inventoried_by_member_id":"T5B-MEMBER","notes":"Texto legado","observacao":"Texto antigo"}'),
 ('T5B-ASSET-LEGACY','T5B-S','2045-03','Bem terminal legado incompleto','permanente','Inventariada','',null,null,'{}'),
 ('T5B-ASSET-OTHER','T5B-OTHER','2045-03','Bem de outra CRE','permanente','Não encaminhada','',null,null,'{}');
insert into public.registered_invoices(id,school_id,competence_id,program_id,verification_id,source_context_key,
 description,expense_type,invoice_number,amount,linked_asset_id,payload)
 values('T5B-NF-LINKED','T5B-S','2045-03','T5B-INV','T5B-V-INV','2045-03_T5B-INV','Despesa patrimonial',
  'permanente','T5B-501',100,'T5B-ASSET-LINKED','{"analiseDocumentoFiscal":"Correto"}');

create function pg_temp.t5b_request(p_action text,p_id text,p_changes jsonb default '{}'::jsonb)
returns jsonb language sql as $$
 select jsonb_build_object('contractVersion',1,'action',p_action,'target',jsonb_build_object('kind',
  case when p_action in ('delete_attempt','correct_attempt') then 'attempt'
   when p_action in ('delete_review','correct_review') then 'review'
   when p_action in ('delete_contact','correct_contact') then 'contact' else 'asset' end,
  'id',p_id,'schoolId','T5B-S'),'changes',p_changes)
$$;
create function pg_temp.t5b_apply(p_action text,p_id text,p_changes jsonb default '{}'::jsonb)
returns jsonb language plpgsql as $$
declare req jsonb:=pg_temp.t5b_request(p_action,p_id,p_changes); preview jsonb;
begin
 preview:=public.preview_operational_change(req);
 return public.apply_operational_change(req,preview->>'planDigest',gen_random_uuid());
end $$;
create temp table t5b_saved(key text primary key,request jsonb,plan jsonb,operation_key uuid default gen_random_uuid(),receipt jsonb);
grant all on t5b_saved to authenticated;

select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000c503","role":"authenticated"}',true);
set local role authenticated;
select throws_like($$select public.preview_operational_change(pg_temp.t5b_request('delete_review','T5B-P-TEXT-A1'))$$,
 'AUTHORIZATION_DENIED%','SME somente leitura não pode corrigir histórico');
reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000c501","role":"authenticated"}',true);
set local role authenticated;
select throws_like($$select public.preview_operational_change(pg_temp.t5b_request('correct_attempt','T5B-P-TEXT-A1','{"created_by":"forged"}'))$$,
 'VALIDATION_ERROR%','autoria não é campo corrigível pelo cliente');
select throws_like($$select public.preview_operational_change(pg_temp.t5b_request('correct_review','T5B-P-TEXT-A1','{"result":"aprovado"}'))$$,
 'VALIDATION_ERROR%','resultado não canônico é rejeitado');
select throws_like($$select public.preview_operational_change(jsonb_set(pg_temp.t5b_request('delete_review','T5B-P-TEXT-A1'),'{target,competence}','"2045-04"'))$$,
 'VALIDATION_ERROR%','contexto opcional não pode identificar outro mês');

select lives_ok($$select pg_temp.t5b_apply('correct_attempt','T5B-P-TEXT-A1','{"observation":"","driveUrl":"https://example.test/corrigido"}')$$,
 'texto e link corrigidos sem resultado e sem justificativa obrigatória');
select is((select result from public.pendency_attempts where id='T5B-P-TEXT-A1'),'correto','texto não altera resultado');
select is((select created_by::text from public.pendency_attempts where id='T5B-P-TEXT-A1'),
 '00000000-0000-0000-0000-00000000c504','outro controlador colabora sem apropriar a autoria original');
select is((select submitted_at from public.pendency_attempts where id='T5B-P-TEXT-A1'),
 '2045-03-02T12:00:00Z'::timestamptz,'registro técnico do envio é imutável');
select is((select status from public.pendencies where id='T5B-P-TEXT'),'Resolvida','texto preserva resolução');
select lives_ok($$select pg_temp.t5b_apply('correct_review','T5B-P-TEXT-A1','{"observation":""}')$$,
 'observação da reanálise pode ser limpa sem reenviar resultado');
select is((select e->>'detalhe' from public.pendencies p,jsonb_array_elements(p.payload->'historico') e
 where p.id='T5B-P-TEXT' and e->>'id'='T5B-P-TEXT-A1-REVIEW'),'Detalhe original preservável',
 'correção textual não reescreve detalhe independente do evento');
select is((select payload->>'analisadoPor' from public.pendency_attempts where id='T5B-P-TEXT-A1'),
 'Revisor original','correção textual conserva autoria da revisão');
select lives_ok($$select pg_temp.t5b_apply('correct_review','T5B-P-TEXT-LEGACY-INC-A1','{"observation":"Texto corrigido"}')$$,
 'texto de revisão incorreta legada sem lista de erros continua corrigível');
select is((select errors from public.pendency_attempts where id='T5B-P-TEXT-LEGACY-INC-A1'),'[]'::jsonb,
 'correção textual não inventa erro ausente no legado');
select lives_ok($$select pg_temp.t5b_apply('correct_review','T5B-P-TEXT-LEGACY-COR-A1','{"observation":"Texto corrigido"}')$$,
 'texto de revisão correta com metadados legados não normaliza outros fatos');
select is((select errors from public.pendency_attempts where id='T5B-P-TEXT-LEGACY-COR-A1'),'["Erro legado independente"]'::jsonb,
 'correção textual preserva erros legados fora do campo escolhido');

select lives_ok($$select pg_temp.t5b_apply('correct_attempt','T5B-P-DATE-A1','{"availableAt":"2045-03-11"}')$$,
 'data de disponibilização corrige classificação de atraso');
select is((select analysis->>'extCC' from public.verifications where id='T5B-V-DATE'),'Correto (Atrasado)',
 'cruzar o prazo recalcula análise dependente');
select is((select bonification->>'extCC' from public.verifications where id='T5B-V-DATE'),'Sim','atraso não altera entrega histórica');
select is((select bonus_result from public.verifications where id='T5B-V-DATE'),'apta','atraso preserva resultado consolidado');
select is((select submitted_at from public.pendency_attempts where id='T5B-P-DATE-A1'),
 '2045-03-02T12:00:00Z'::timestamptz,'data corrigível não substitui submitted_at');
select ok((select payload->>'responsible_area'='' and payload->>'next_actor'='' and payload->>'reason'=''
 from public.pendencies where id='T5B-P-DATE'),'aliases legados não reatribuem responsável ou motivo depois de recompor resolução');

insert into t5b_saved(key,request,plan) select 'delete-review',req,public.preview_operational_change(req)
 from (select pg_temp.t5b_request('delete_review','T5B-P-REVIEW-A1') req) s;
select ok((select plan #> '{effects,delete,pendency_attempts}'='[]'::jsonb from t5b_saved where key='delete-review'),
 'excluir revisão mantém a linha do envio');
select lives_ok($$update t5b_saved set receipt=public.apply_operational_change(request,plan->>'planDigest',operation_key)
 where key='delete-review'$$,'exclusão de revisão com versão concorrente passa pelo executor e triggers');
select is((select status from public.pendencies where id='T5B-P-REVIEW'),'Aguardando reanálise','envio válido volta à reanálise');
select is((select analysis->>'extCC' from public.verifications where id='T5B-V-REVIEW'),'Não analisado','sem revisão restante não fabrica análise Incorreto');
select is((select payload->'errosAtuais' from public.pendencies where id='T5B-P-REVIEW'),'[]'::jsonb,'retira erros dependentes');
select ok((select payload->'resolved_at'='null'::jsonb and payload->'dataResolucao'='null'::jsonb
 and payload->'canceled_at'='null'::jsonb and payload->>'reason'=''
 and payload->>'responsible_area'='Controlador' and payload->>'next_actor'='Controlador'
 from public.pendencies where id='T5B-P-REVIEW'),'aliases não ressuscitam resolução ou erros no próximo save após excluir revisão');
select ok((select result is null and analyzed_at is null and not payload ? 'analisadoPor' and not payload ? 'analisadoPorId'
 and not payload ? 'authenticatedRoleAnalise' and not payload ? 'actingProfileAnalise'
 from public.pendency_attempts where id='T5B-P-REVIEW-A1'),'retira resultado e autoria operacional da revisão removida');
select is((select payload->>'registradoPor' from public.pendency_attempts where id='T5B-P-REVIEW-A1'),
 'Autor original','autoria do envio permanece');
select is((select row_version from public.pendency_attempts where id='T5B-P-REVIEW-A1'),
 (select (plan #>> '{versions,pendency_attempts,T5B-P-REVIEW-A1}')::int+1 from t5b_saved where key='delete-review'),
 'attempt é atualizado uma vez antes do espelho da pendência');
select is((select count(*)::int from public.pendencies p,jsonb_array_elements(p.payload->'historico') e
 where p.id='T5B-P-REVIEW' and e->>'id'='T5B-P-REVIEW-A1-REVIEW'),0,'histórico operativo não mostra a revisão apagada');
select is((select (public.apply_operational_change(request,plan->>'planDigest',operation_key)->>'replayed')::boolean
 from t5b_saved where key='delete-review'),true,'repetição devolve recibo sem reaplicar');
select is((select count(*)::int from public.administrative_logs where id=(select receipt->>'auditId' from t5b_saved where key='delete-review')),1,
 'recibo identifica uma única trilha administrativa');
select throws_like($$select public.apply_operational_change(pg_temp.t5b_request('delete_attempt','T5B-P-REVIEW-A1'),
 plan->>'planDigest',operation_key) from t5b_saved where key='delete-review'$$,'IDEMPOTENCY_CONFLICT%',
 'operationKey não pode confirmar outra ação');

select lives_ok($$select pg_temp.t5b_apply('delete_attempt','T5B-P-DELETE-A2')$$,'exclui somente envio atual aguardando');
select is((select status from public.pendencies where id='T5B-P-DELETE'),'Aberta','sem envio ativo a pendência volta a Aberta');
select is((select payload->>'status' from public.pendency_attempts where id='T5B-P-DELETE-A1'),
 'substituida_antes_da_analise','não reativa envio anteriormente substituído');
select is((select attempt_number from public.pendency_attempts where id='T5B-P-DELETE-A1'),1,'não renumera a tentativa preservada');
select is((select analysis->>'extCC' from public.verifications where id='T5B-V-DELETE'),'Não analisado','sem revisão válida remove resultado dependente');
select is((select payload->'errosAtuais' from public.pendencies where id='T5B-P-DELETE'),'["Erro inicial"]'::jsonb,
 'erro original com evento abertura inequívoco continua identificado');
select lives_ok($$select pg_temp.t5b_apply('delete_review','T5B-P-PREVIOUS-A2')$$,'última revisão pode ser removida mantendo revisão causal anterior');
select is((select analysis->>'extCC' from public.verifications where id='T5B-V-PREVIOUS'),'Incorreto','resta avaliação incorreta real, não inventada');
select is((select payload->'errosAtuais' from public.pendencies where id='T5B-P-PREVIOUS'),'["Erro da primeira revisão"]'::jsonb,
 'erros vêm da revisão anterior identificada');
select lives_ok($$select pg_temp.t5b_apply('delete_review','T5B-P-OLD-A1')$$,'revisão antiga é removível quando revisão posterior independente governa o estado');
select is((select status from public.pendencies where id='T5B-P-OLD'),'Resolvida','revisão posterior preserva resolução');
select is((select result from public.pendency_attempts where id='T5B-P-OLD-A2'),'correto','envio/revisão posterior permanece');
insert into t5b_saved(key,request,plan) select 'ambiguous',req,public.preview_operational_change(req)
 from (select pg_temp.t5b_request('delete_review','T5B-P-AMBIG-A1') req) s;
select ok((select plan->'blockers' @> '[{"code":"AMBIGUOUS_PENDENCY_HISTORY"}]' from t5b_saved where key='ambiguous'),
 'erro anterior possivelmente vigente exige escolha explícita');
select is((select plan #>> '{alternatives,0,target,id}' from t5b_saved where key='ambiguous'),'T5B-P-AMBIG','alternativa aponta para pendência exata');
select throws_like($$select public.apply_operational_change(request,plan->>'planDigest',operation_key) from t5b_saved where key='ambiguous'$$,
 'PLAN_BLOCKED%','ambiguidade não executa mutação parcial');
select is((select result from public.pendency_attempts where id='T5B-P-AMBIG-A1'),'incorreto','tentativa ambígua fica intacta');
select lives_ok($$select pg_temp.t5b_apply('correct_attempt','T5B-P-AMBIG-A2','{"availableAt":"2045-03-12"}')$$,
 'data de envio aguardando pode ser corrigida mesmo com revisão anterior');
select is((select analysis->>'extCC' from public.verifications where id='T5B-V-AMBIG'),'Correto',
 'data do envio sem revisão não restaura resultado anterior nem muda avaliação vigente');
select is((select status from public.pendencies where id='T5B-P-AMBIG'),'Aguardando reanálise','data aguardando não reabre nem resolve pendência');
select is((select payload->'errosAtuais' from public.pendencies where id='T5B-P-AMBIG'),'["Erro inicial"]'::jsonb,
 'data aguardando não troca erros por revisão anterior');
select lives_ok($$select pg_temp.t5b_apply('delete_review','T5B-P-CANCEL-A1')$$,'cancelamento posterior não impede corrigir fato antigo independente');
select is((select status from public.pendencies where id='T5B-P-CANCEL'),'Cancelada','cancelamento independente é preservado');
select is((select canceled_at from public.pendencies where id='T5B-P-CANCEL'),'2045-03-06T12:00:00Z'::timestamptz,'data do cancelamento permanece');
select lives_ok($$select pg_temp.t5b_apply('delete_attempt','T5B-P-REOPEN-A2')$$,
 'remover último envio respeita reabertura posterior à revisão anterior remanescente');
select is((select status from public.pendencies where id='T5B-P-REOPEN'),'Aberta',
 'revisão anterior não resolve novamente a pendência que foi reaberta depois');
select is((select payload->'errosAtuais' from public.pendencies where id='T5B-P-REOPEN'),'["Apontamento real da reabertura"]'::jsonb,
 'reabertura remanescente fornece seus erros comprovados');
select ok((select resolved_at is null and canceled_at is null and next_actor='Escola' from public.pendencies where id='T5B-P-REOPEN'),
 'estado da reabertura conserva próxima ação e retira resolução dependente');
select is((select result from public.pendency_attempts where id='T5B-P-REOPEN-A1'),'correto','revisão anterior continua sendo o fato original correto');
select ok((public.preview_operational_change(pg_temp.t5b_request('delete_attempt','T5B-P-REOPEN-AMBIG-A2'))->'blockers')
 @> '[{"code":"AMBIGUOUS_PENDENCY_HISTORY"}]','reabertura sem dados suficientes exige escolha de alcance');
select throws_like($$select pg_temp.t5b_apply('delete_attempt','T5B-P-REOPEN-AMBIG-A2')$$,'PLAN_BLOCKED%',
 'falta de prova na reabertura nunca resolve automaticamente pela análise antiga');

select lives_ok($$select pg_temp.t5b_apply('correct_contact','T5B-C-LINKED','{"description":"","pendencyId":null,"officialCharge":false}')$$,
 'contato pode limpar descrição e desvincular sem resolver a pendência');
select ok((select pendency_id is null and description='' from public.pendency_contacts where id='T5B-C-LINKED'),'desvinculação consciente persiste');
select ok((select payload->'pendency_id'='null'::jsonb and payload->'pendenciaId'='null'::jsonb
 and payload->'official_charge'='false'::jsonb and payload->'cobrancaOficial'='false'::jsonb
 and payload->'cobrancaEnvioRegistro'='false'::jsonb and payload->>'description'=''
 from public.pendency_contacts where id='T5B-C-LINKED'),'aliases legados não ressuscitam vínculo ou cobrança ao serializar novamente');
select is((select status from public.pendencies where id='T5B-P-CONTACT'),'Resolvida','contato não altera estado operacional');
select lives_ok($$select pg_temp.t5b_apply('delete_contact','T5B-C-GENERAL')$$,'contato geral pode ser excluído pelo ID');
select is((select count(*)::int from public.pendency_contacts where id='T5B-C-LINKED'),1,'outro contato permanece');
insert into t5b_saved(key,request,plan) select 'stale',req,public.preview_operational_change(req)
 from (select pg_temp.t5b_request('delete_contact','T5B-C-STALE') req) s;
update public.pendency_contacts set description='Outro operador alterou' where id='T5B-C-STALE';
select throws_like($$select public.apply_operational_change(request,plan->>'planDigest',operation_key) from t5b_saved where key='stale'$$,
 'STALE_PLAN%','mudança após prévia exige nova confirmação');
select is((select description from public.pendency_contacts where id='T5B-C-STALE'),'Outro operador alterou','conflito conserva dado mais recente');

reset role;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000c502","role":"authenticated"}',true);
set local role authenticated;
select throws_like($$select public.preview_operational_change(pg_temp.t5b_request('delete_attempt','T5B-P-TEXT-A1'))$$,
 'AUTHORIZATION_DENIED%','Inventário não recebe capacidade de envio/reanálise');
select throws_like($$select public.preview_operational_change(jsonb_set(pg_temp.t5b_request('delete_asset','T5B-ASSET-OTHER'),
 '{target,schoolId}','"T5B-OTHER"'))$$,'AUTHORIZATION_DENIED%','Inventário respeita CRE');
select throws_like($$update public.assets set status='Encaminhada' where id='T5B-ASSET-LINKED'$$,
 'ASSET_ALREADY_INVENTORIED%','fluxo ordinário continua protegendo estado terminal');
select lives_ok($$select pg_temp.t5b_apply('correct_inventory','T5B-ASSET-LINKED','{"status":"Encaminhada","inventoryProcess":"PROC-CORRIGIDO","notes":""}')$$,
 'Inventário corrige estado terminal em sua capacidade própria');
select ok((select status='Encaminhada' and inventoried_at is null and inventoried_by_member_id is null
 from public.assets where id='T5B-ASSET-LINKED'),'desfazer inventariação retira metadados terminais');
select ok((select payload->'inventoried_at'='null'::jsonb and payload->'inventoried_by_member_id'='null'::jsonb
 and payload->>'notes'='' and payload->>'observacao'='' from public.assets where id='T5B-ASSET-LINKED'),
 'aliases patrimoniais não restauram conclusão ou observação removida');
select lives_ok($$select pg_temp.t5b_apply('correct_inventory','T5B-ASSET-LEGACY','{"notes":"Detalhe corrigido","inventoryProcess":"PROC-LEGADO"}')$$,
 'bem Inventariada legado incompleto permite corrigir apenas texto/processo');
select ok((select status='Inventariada' and inventoried_at is null and inventoried_by_member_id is null
 from public.assets where id='T5B-ASSET-LEGACY'),'correção de texto não inventa data nem responsável da conclusão legada');
select lives_ok($$select pg_temp.t5b_apply('correct_inventory','T5B-ASSET-LINKED','{"status":"Não encaminhada"}')$$,
 'reverte encaminhamento e recompõe somente projeção patrimonial');
reset role;
select is((select bonification->>'encampInventario' from public.verifications where id='T5B-V-INV'),'Não','encaminhamento segue bem corrigido');
select is((select analysis->>'encampInventario' from public.verifications where id='T5B-V-INV'),'Não analisado','projeção alterada perde avaliação dependente');
select is((select bonification->>'notaFiscal' from public.verifications where id='T5B-V-INV'),'Não','Inventário não altera entrega fiscal');
select is((select bonus_result from public.verifications where id='T5B-V-INV'),'apta','Inventário preserva resultado de bonificação');
set local role authenticated;
select ok((public.preview_operational_change(pg_temp.t5b_request('delete_asset','T5B-ASSET-LINKED'))->'blockers')
 @> '[{"code":"ASSET_LINKED_TO_INVOICE"}]','bem causal oferece correção ou escopo fiscal explícito');
select is(jsonb_array_length(public.preview_operational_change(pg_temp.t5b_request('delete_asset','T5B-ASSET-LINKED'))->'alternatives'),1,
 'Inventário recebe só alternativa patrimonial autorizada');
select lives_ok($$select pg_temp.t5b_apply('delete_asset','T5B-ASSET-MANUAL')$$,'Inventário exclui lançamento manual terminal independente');
select is((select count(*)::int from public.assets where id='T5B-ASSET-MANUAL'),0,'bem manual selecionado removido');
select is((select count(*)::int from public.assets where id='T5B-ASSET-LINKED'),1,'bem de NF preservado');
reset role;
select is((select count(*)::int from public.registered_invoices where id='T5B-NF-LINKED'),1,'NF não é excluída pela capacidade Inventário');
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000c501","role":"authenticated"}',true);
set local role authenticated;
select ok((public.preview_operational_change(pg_temp.t5b_request('delete_asset','T5B-ASSET-LINKED'))->'alternatives')
 @> '[{"action":"delete_invoice","target":{"id":"T5B-NF-LINKED"}}]','perfil fiscal vê alternativa com NF exata');
reset role;
insert into public.registered_invoices(id,school_id,competence_id,program_id,verification_id,source_context_key,
 description,expense_type,invoice_number,amount,linked_asset_id,payload)
 values('T5B-NF-SHARED','T5B-S','2045-03','T5B-OTHER','T5B-V-OTHER','2045-03_T5B-OTHER','Segunda despesa do mesmo bem',
  'permanente','T5B-502',100,'T5B-ASSET-LINKED','{"analiseDocumentoFiscal":"Correto"}');
set local role authenticated;
insert into t5b_saved(key,request,plan) select 'shared-asset',req,public.preview_operational_change(req)
 from (select pg_temp.t5b_request('correct_inventory','T5B-ASSET-LINKED','{"status":"Encaminhada"}') req) s;
select is((select jsonb_array_length(plan #> '{affectedRecords,verifications}') from t5b_saved where key='shared-asset'),2,
 'bem compartilhado lista todos os contextos que serão conferidos');
select ok((select plan #> '{affectedRecords,verifications}' @> '[{"id":"T5B-V-INV","programId":"T5B-INV","programName":"Programa sintético INV","competence":"2045-03"},{"id":"T5B-V-OTHER","programId":"T5B-OTHER","programName":"Programa sintético OTHER","competence":"2045-03"}]'
 from t5b_saved where key='shared-asset'),'contextos incluem nomes de programas, mês e identidade exata para a prévia');
select ok((select plan->'warnings' @> '[{"code":"MULTIPLE_INVENTORY_CONTEXTS"}]' from t5b_saved where key='shared-asset'),
 'a prévia declara alcance em mais de um programa antes de confirmar');
select lives_ok($$select public.apply_operational_change(request,plan->>'planDigest',operation_key)
 from t5b_saved where key='shared-asset'$$,'correção compartilhada aplica somente o alcance apresentado');
reset role;
select is((select count(*)::int from public.verifications where id in ('T5B-V-INV','T5B-V-OTHER') and bonification->>'encampInventario'='Sim'),2,
 'ambos os contextos patrimoniais refletem o mesmo bem corrigido');
select is((select count(*)::int from radar_private.operational_change_ledger where operation_key=(select operation_key from t5b_saved where key='ambiguous')),0,
 'ambiguidade não deixa recibo applying nem committed');
select ok(not has_function_privilege('authenticated','radar_private.t5_rebuild_pendency(jsonb,jsonb,text,text,jsonb,jsonb,date)','EXECUTE'),
 'projeção privada não é endpoint público');
select ok(not has_function_privilege('anon','public.apply_operational_change(jsonb,text,uuid)','EXECUTE'),
 'aplicação exige sessão autenticada');
select * from finish();
rollback;
