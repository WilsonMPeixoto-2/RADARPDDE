begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(15);

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
'{"notaFiscal":"Não","extCC":"Sim","declBBAgil":"Não se aplica","consAssessoria":"Não","consEnviada":false,"encampInventario":"Não"}',
'{"extCC":"Correto","notaFiscal":"Não analisado","consAssessoria":"Não analisado"}','apta');

-- A função temporária usa o mesmo RPC e versões reais; não escreve diretamente a NF.
create function pg_temp.save_expense(p_id text, p_bonus jsonb, p_version integer default null)
returns jsonb language sql security invoker as $fn$
select public.save_invoice_with_effects(
    p_invoice => jsonb_build_object('id',p_id,'school_id','04.99.731','competence_id','2033-03',
        'program_id','EXP_OWNER','verification_id','04.99.731::2033-03::EXP_OWNER',
        'source_context_key','2033-03_EXP_OWNER','description','Material','expense_type','consumo',
        'invoice_number',p_id,'amount',125,'payload','{}'::jsonb),
    p_verification_patch => jsonb_build_object('id','04.99.731::2033-03::EXP_OWNER',
        'bonification','{"notaFiscal":"Sim","consAssessoria":"Não se aplica","consEnviada":true,"encampInventario":"Não se aplica"}'::jsonb,
        'analysis','{"notaFiscal":"Correto","consAssessoria":"Correto"}'::jsonb) || p_bonus,
    p_expected_verification_version => coalesce(p_version,(select row_version from public.verifications where id='04.99.731::2033-03::EXP_OWNER'))
);
$fn$;
grant execute on function pg_temp.save_expense(text,jsonb,integer) to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000731',true);
select lives_ok($$select pg_temp.save_expense('ownership-nf-absent','{}')$$,'Assistente real cadastra com NF Não e bonificação consolidada');
select is((select bonus_result from public.verifications where id='04.99.731::2033-03::EXP_OWNER'),'apta','chave ausente preserva resultado');
select lives_ok($$select pg_temp.save_expense('ownership-nf-null','{"bonus_result":null}')$$,'null no patch não pertence à despesa');
select is((select bonus_result from public.verifications where id='04.99.731::2033-03::EXP_OWNER'),'apta','null não apaga resultado');
select lives_ok($$select pg_temp.save_expense('ownership-nf-empty','{"bonus_result":""}')$$,'vazio no patch não pertence à despesa');
select is((select bonus_result from public.verifications where id='04.99.731::2033-03::EXP_OWNER'),'apta','vazio não reabre resultado');
select lives_ok($$select pg_temp.save_expense('ownership-nf-other','{"bonus_result":"inapta"}')$$,'valor divergente no patch não pertence à despesa');
select is((select bonus_result from public.verifications where id='04.99.731::2033-03::EXP_OWNER'),'apta','resultado diferente não substitui consolidação');
select is((select bonification->>'notaFiscal' from public.verifications where id='04.99.731::2033-03::EXP_OWNER'),'Não','NF manual preservada mesmo com snapshot divergente');
select is((select bonification->>'extCC' from public.verifications where id='04.99.731::2033-03::EXP_OWNER'),'Sim','snapshot parcial não apaga outro lançamento manual');
select is((select analysis->>'extCC' from public.verifications where id='04.99.731::2033-03::EXP_OWNER'),'Correto','análise de outro documento não pertence à despesa');
select throws_like($$select pg_temp.save_expense('ownership-stale','{}',1)$$,'%OPTIMISTIC_CONFLICT%','versão antiga produz conflito explícito');
select is((select count(*)::integer from public.registered_invoices where id='ownership-stale'),0,'conflito reverte a despesa');
select lives_ok($$
select public.delete_invoice_with_effects(
    p_invoice_id=>'ownership-nf-null',
    p_expected_invoice_version=>(select row_version from public.registered_invoices where id='ownership-nf-null'),
    p_verification_patch=>' {"bonification":{"notaFiscal":"Sim"},"bonus_result":null}'::jsonb,
    p_expected_verification_version=>(select row_version from public.verifications where id='04.99.731::2033-03::EXP_OWNER')
)$$,'exclusão elegível não depende da consolidação');
select is((select jsonb_build_object('notaFiscal',bonification->>'notaFiscal','extCC',bonification->>'extCC','bonus_result',bonus_result) from public.verifications where id='04.99.731::2033-03::EXP_OWNER'),
'{"notaFiscal":"Não","extCC":"Sim","bonus_result":"apta"}'::jsonb,'exclusão preserva decisões manuais e resultado');
select * from finish();
rollback;
