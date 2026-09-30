begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(14);
insert into auth.users(id,email) values
('00000000-0000-0000-0000-000000000732','first-controller@example.test'),
('00000000-0000-0000-0000-000000000733','first-inventory@example.test'),
('00000000-0000-0000-0000-000000000734','first-sme@example.test');
insert into public.controllers(id,name,user_id) values('FIRST-CTRL','Controlador','00000000-0000-0000-0000-000000000732');
insert into public.user_profiles(user_id,profile_id,controller_id,cre_scope) values
('00000000-0000-0000-0000-000000000732','controller','FIRST-CTRL','4ª CRE'),
('00000000-0000-0000-0000-000000000733','inventory',null,'4ª CRE'),
('00000000-0000-0000-0000-000000000734','sme_management',null,null);
insert into public.competences(id,label,exercise) values('2033-05','Maio 2033',2033),('2033-06','Junho 2033',2033);
insert into public.programs(id,name) values('FIRST_AUTH','Autoridade primeira despesa');
insert into public.schools(id,designation,denomination,cre,initial_competence,inep,cnpj,sici) values
('FIRST-AUTH','04.99.732','Escola Autoridade','4ª CRE','2033-05','33990732','90.073.200/0001-32','SICI-FIRST-732'),
('FIRST-OUT','05.99.732','Escola Fora do Escopo','5ª CRE','2033-05','33990735','90.073.500/0001-35','SICI-FIRST-735');
-- School write scope alone must not confer expense capability to other roles.
insert into public.user_school_scopes(user_id,school_id,can_write) values
('00000000-0000-0000-0000-000000000733','FIRST-AUTH',true),
('00000000-0000-0000-0000-000000000734','FIRST-AUTH',true);
create function pg_temp.first_expense(p_id text,p_school text default 'FIRST-AUTH',p_month text default '2033-05',p_context text default null,p_amount numeric default 100)
returns jsonb language sql security invoker as $fn$
select public.save_invoice_with_effects_v2(md5(p_id)::uuid,
    jsonb_build_object('id',p_id,'school_id',p_school,'competence_id',p_month,'program_id','FIRST_AUTH',
        'verification_id',coalesce(p_context,concat_ws('::',p_school,p_month,'FIRST_AUTH')),
        'source_context_key',p_month||'_FIRST_AUTH','description','Material','expense_type','consumo','invoice_number',p_id,'amount',p_amount),
    null,jsonb_build_object('id',coalesce(p_context,concat_ws('::',p_school,p_month,'FIRST_AUTH')),
        'school_id',p_school,'competence_id',p_month,'program_id','FIRST_AUTH',
        'bonification','{"notaFiscal":""}'::jsonb,'analysis','{}'::jsonb,'bonus_result',null),
    null,null,null,jsonb_build_object('id',p_id||'-log','school_id',p_school,'action','Gasto Consumo Cadastrado','details','{}'::jsonb));
$fn$;
grant execute on function pg_temp.first_expense(text,text,text,text,numeric) to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000733',true);
select throws_like($$select pg_temp.first_expense('first-inventory')$$,'%AUTHORIZATION_DENIED%','Inventário com escopo de escrita não ganha capacidade de criar contexto por despesa');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000734',true);
select throws_like($$select pg_temp.first_expense('first-sme')$$,'%AUTHORIZATION_DENIED%','SME com escopo de escrita não ganha capacidade de criar contexto por despesa');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000732',true);
select throws_like($$select pg_temp.first_expense('first-out','FIRST-OUT')$$,'%AUTHORIZATION_DENIED%','Controlador fora da CRE é negado');
select throws_like($$select pg_temp.first_expense('first-bad-context','FIRST-AUTH','2033-05','fabricated-context')$$,'%VALIDATION_ERROR%','primeiro contexto exige identidade canônica');
select throws_like($$select pg_temp.first_expense('first-negative','FIRST-AUTH','2033-06',null,-1)$$,'%VALIDATION_ERROR%','falha posterior ao INSERT estrutural aborta tudo');
select lives_ok($$select pg_temp.first_expense('first-controller')$$,'Controlador real cria primeira despesa sem bonificação');
select is((select bonification->>'notaFiscal' from public.verifications where id='FIRST-AUTH::2033-05::FIRST_AUTH'),'','primeira despesa não lança bonificação de NF');
select throws_like($$select pg_temp.first_expense('first-client-missing')$$,'%OPTIMISTIC_CONFLICT%','contexto já existente omitido pelo cliente exige reconvergência explícita');
set local role postgres;
select is((select count(*)::integer from public.verifications where school_id like 'FIRST-%'),1,'somente um contexto real, sem linha inválida/parcial');
select is((select count(*)::integer from public.registered_invoices where school_id like 'FIRST-%'),1,'nenhuma NF rejeitada foi gravada');
select is((select count(*)::integer from public.assets where school_id like 'FIRST-%'),0,'nenhum bem parcial');
select is((select count(*)::integer from public.pendencies where school_id like 'FIRST-%'),0,'nenhuma Pendência parcial');
select is((select count(*)::integer from public.administrative_logs where school_id like 'FIRST-%'),1,'somente log da operação aprovada');
select is((select count(*)::integer from radar_private.invoice_operation_idempotency where actor_user_id in
('00000000-0000-0000-0000-000000000732','00000000-0000-0000-0000-000000000733','00000000-0000-0000-0000-000000000734')),1,'sem intenção idempotente falsamente confirmada');
select * from finish();
rollback;
