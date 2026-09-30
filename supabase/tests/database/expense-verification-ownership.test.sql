begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(18);

insert into auth.users(id,email) values
('00000000-0000-0000-0000-000000000731','ownership@example.test');
insert into public.user_profiles(user_id,profile_id) values
('00000000-0000-0000-0000-000000000731','federal_assistant');
insert into public.competences(id,label,exercise) values('2033-03','Março 2033',2033);
insert into public.programs(id,name) values('EXP_OWNER','Propriedade despesa');
insert into public.schools(id,designation,denomination,cre,initial_competence,inep,cnpj,sici)
values('04.99.731','04.99.731','Escola Propriedade','4ª CRE','2033-03','33990731','90.073.100/0001-31','SICI-EXP-731');
insert into public.verifications(id,school_id,competence_id,program_id,bonification,analysis,bonus_result)
values('04.99.731::2033-03::EXP_OWNER','04.99.731','2033-03','EXP_OWNER',
'{"notaFiscal":"Sim","extCC":"Sim","extINV":"Sim","declBBAgil":"Sim","consAssessoria":"Não se aplica","consEnviada":false,"encampInventario":"Não se aplica"}',
'{"extCC":"Correto","extINV":"Correto","declBBAgil":"Correto","notaFiscal":"Não analisado","consAssessoria":"Correto","encampInventario":"Correto"}','apta');

-- A função temporária usa o mesmo RPC e versões reais; não escreve diretamente a NF.
create function pg_temp.save_expense(p_id text, p_bonus jsonb, p_version integer default null)
returns jsonb language sql security invoker as $fn$
select public.save_invoice_with_effects(
    p_invoice => jsonb_build_object('id',p_id,'school_id','04.99.731','competence_id','2033-03',
        'program_id','EXP_OWNER','verification_id','04.99.731::2033-03::EXP_OWNER',
        'source_context_key','2033-03_EXP_OWNER','description','Material','expense_type','consumo',
        'invoice_number',p_id,'amount',125,'payload','{}'::jsonb),
    p_verification_patch => jsonb_build_object('id','04.99.731::2033-03::EXP_OWNER',
        'bonification','{"notaFiscal":"Não","consAssessoria":"Não se aplica","consEnviada":true,"encampInventario":"Não se aplica"}'::jsonb,
        'analysis','{"notaFiscal":"Correto","consAssessoria":"Correto"}'::jsonb) || p_bonus,
    p_expected_verification_version => coalesce(p_version,(select row_version from public.verifications where id='04.99.731::2033-03::EXP_OWNER'))
);
$fn$;
grant execute on function pg_temp.save_expense(text,jsonb,integer) to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000731',true);
select lives_ok($$select pg_temp.save_expense('ownership-nf-absent','{}')$$,'Assistente real cadastra com NF Sim e bonificação consolidada');
select is((select bonus_result from public.verifications where id='04.99.731::2033-03::EXP_OWNER'),'apta','chave ausente preserva resultado');
select lives_ok($$select pg_temp.save_expense('ownership-nf-null','{"bonus_result":null}')$$,'null no patch não pertence à despesa');
select is((select bonus_result from public.verifications where id='04.99.731::2033-03::EXP_OWNER'),'apta','null não apaga resultado');
select lives_ok($$select pg_temp.save_expense('ownership-nf-empty','{"bonus_result":""}')$$,'vazio no patch não pertence à despesa');
select is((select bonus_result from public.verifications where id='04.99.731::2033-03::EXP_OWNER'),'apta','vazio não reabre resultado');
select lives_ok($$select pg_temp.save_expense('ownership-nf-other','{"bonus_result":"inapta"}')$$,'valor divergente no patch não pertence à despesa');
select is((select bonus_result from public.verifications where id='04.99.731::2033-03::EXP_OWNER'),'apta','resultado diferente não substitui consolidação');
select is((select bonification->>'notaFiscal' from public.verifications where id='04.99.731::2033-03::EXP_OWNER'),'Sim','NF manual preservada mesmo com snapshot divergente');
select is((select bonification->>'extCC' from public.verifications where id='04.99.731::2033-03::EXP_OWNER'),'Sim','snapshot parcial não apaga outro lançamento manual');
select is((select analysis->>'extCC' from public.verifications where id='04.99.731::2033-03::EXP_OWNER'),'Correto','análise de outro documento não pertence à despesa');
select throws_like($$select pg_temp.save_expense('ownership-stale','{}',1)$$,'%OPTIMISTIC_CONFLICT%','versão antiga produz conflito explícito');
select is((select count(*)::integer from public.registered_invoices where id='ownership-stale'),0,'conflito reverte a despesa');
select lives_ok($$
select public.delete_invoice_with_effects(
    p_invoice_id=>'ownership-nf-null',
    p_expected_invoice_version=>(select row_version from public.registered_invoices where id='ownership-nf-null'),
    p_verification_patch=>' {"bonification":{"notaFiscal":"Não"},"bonus_result":null}'::jsonb,
    p_expected_verification_version=>(select row_version from public.verifications where id='04.99.731::2033-03::EXP_OWNER')
)$$,'exclusão elegível não depende da consolidação');
select is((select jsonb_build_object('notaFiscal',bonification->>'notaFiscal','extCC',bonification->>'extCC','bonus_result',bonus_result) from public.verifications where id='04.99.731::2033-03::EXP_OWNER'),
'{"notaFiscal":"Sim","extCC":"Sim","bonus_result":"apta"}'::jsonb,'exclusão preserva decisões manuais e resultado');
-- Reanalysis is an expense operation even through the existing generic authority.
-- Seed only the waiting attempt/context; the transition is performed by the RPC.
set local role postgres;
insert into public.pendencies(id,school_id,competence_origin,program_id,document_key,registered_invoice_id,status,payload)
values('ownership-pend','04.99.731','2033-03','EXP_OWNER','notaFiscal','ownership-nf-absent','Aguardando reanálise','{}');
insert into public.pendency_attempts(id,pendency_id,attempt_number,submitted_at,observation,drive_url,errors,payload)
values('ownership-attempt','ownership-pend',1,'2033-03-10T12:00:00Z','Documento enviado','https://drive.example/owner','[]','{}');
set local role authenticated;
select lives_ok($$
select public.reanalyze_pendency_with_verification(
    '{"id":"ownership-pend","status":"Resolvida","payload":{}}',
    '{"id":"ownership-attempt","pendency_id":"ownership-pend","attempt_number":1,"analyzed_at":"2033-03-11T12:00:00Z","result":"correto","errors":[],"payload":{}}',
    '{"id":"04.99.731::2033-03::EXP_OWNER","bonus_result":null,"bonification":{"notaFiscal":"Não"},"analysis":{"notaFiscal":"Correto"},"payload":{}}',
    (select row_version from public.pendencies where id='ownership-pend'),
    (select row_version from public.verifications where id='04.99.731::2033-03::EXP_OWNER'),
    '{"id":"ownership-reanalysis-log","school_id":"04.99.731","action":"Reanálise registrada","details":{}}'
)$$,'reanálise vinculada mantém a própria autoridade e aceita análise legítima');
select is((select jsonb_build_object('notaFiscal',bonification->>'notaFiscal','extCC',bonification->>'extCC','bonus_result',bonus_result) from public.verifications where id='04.99.731::2033-03::EXP_OWNER'),
'{"notaFiscal":"Sim","extCC":"Sim","bonus_result":"apta"}'::jsonb,'reanálise vinculada não troca NF manual, campos irmãos ou consolidação');
select ok((select status='Resolvida' from public.pendencies where id='ownership-pend')
    and (select result='correto' from public.pendency_attempts where id='ownership-attempt'), 'tentativa e resolução reais confirmadas sem alterar a bonificação');
select * from finish();
rollback;
