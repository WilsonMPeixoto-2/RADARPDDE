-- Release 2, D011/D014. Toda a massa existe apenas nesta transação.
begin;
set local search_path = extensions, public, pg_catalog;
select plan(16);

insert into auth.users(id,email) values ('00000000-0000-0000-0000-00000000a401','r2-controlador@example.test');
insert into public.controllers(id,name,user_id) values ('R2-CTRL','Controlador T4','00000000-0000-0000-0000-00000000a401');
insert into public.user_profiles(user_id,profile_id,controller_id,cre_scope,active)
values ('00000000-0000-0000-0000-00000000a401','controller','R2-CTRL','R2-CRE',true);
insert into public.schools(id,designation,denomination,cre,inep,cnpj,sici) values
    ('R2-S','04.98.004','Escola sintética T4','R2-CRE','33980401','98.004.001/0001-01','SICI-R2');
insert into public.competences(id,label,exercise) values ('2042-06','Junho 2042',2042);
insert into public.programs(id,name) values ('R2-A','Programa alvo'), ('R2-B','Programa vizinho');
insert into public.verifications(id,school_id,competence_id,program_id,bonification,analysis,bonus_result)
select 'R2-V-'||id,'R2-S','2042-06',id,'{"notaFiscal":"Sim","declBBAgil":"Não se aplica"}','{"notaFiscal":"Incorreto","declBBAgil":"Correto"}','apta'
from public.programs where id in ('R2-A','R2-B');
insert into public.registered_invoices(id,school_id,competence_id,program_id,verification_id,source_context_key,description,expense_type,invoice_number,amount,payload)
values ('R2-NF1','R2-S','2042-06','R2-A','R2-V-R2-A','2042-06_R2-A','Material A','consumo','NF1',50,'{"analiseDocumentoFiscal":"Incorreto"}'),
       ('R2-NF2','R2-S','2042-06','R2-A','R2-V-R2-A','2042-06_R2-A','Material B','consumo','NF2',60,'{"analiseDocumentoFiscal":"Correto"}');
insert into public.pendencies(id,school_id,competence_origin,program_id,document_key,status,next_actor,registered_invoice_id)
values ('R2-P','R2-S','2042-06','R2-A','notaFiscal','Aberta','Escola','R2-NF1');

create function pg_temp.request(mark text) returns jsonb language sql as $$
    select jsonb_build_object('contractVersion',1,'action','correct_bonification',
        'target',jsonb_build_object('kind','verification','schoolId','R2-S','competence','2042-06','programId','R2-A','documentKey','notaFiscal'),
        'changes',jsonb_build_object('bonificacao',mark))
$$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-00000000a401","role":"authenticated"}',true);
set local role authenticated;
create temp table r2_before as select
    (select row_version from public.verifications where id='R2-V-R2-B') as neighbor_version,
    (select jsonb_agg(to_jsonb(i) order by id) from public.registered_invoices i where id in ('R2-NF1','R2-NF2')) as invoices,
    (select to_jsonb(p) from public.pendencies p where id='R2-P') as pendency;
create temp table r2_plan(plan jsonb);
select lives_ok($$insert into r2_plan values(public.preview_operational_change(pg_temp.request('Não se aplica')))$$,
    'Controlador obtém prévia de correção de uma marca consolidada com notas válidas');
select is((select bonification->>'notaFiscal' from public.verifications where id='R2-V-R2-A'),'Sim','prévia preserva a marca');
select lives_ok($$select public.apply_operational_change(pg_temp.request('Não se aplica'),
    (select plan->>'planDigest' from r2_plan),'00000000-0000-0000-0000-00000000a411')$$,
    'aplica sem justificativa e sem exigir completar os outros itens');
select is((select bonification->>'notaFiscal' from public.verifications where id='R2-V-R2-A'),'Não se aplica','marca corrigida no alvo');
select ok((select bonus_result is null and payload @> '{"bonificacaoPendenteConsolidacao":true}' and bonification->>'declBBAgil'='Não se aplica' and analysis->>'notaFiscal'='Incorreto' and analysis->>'declBBAgil'='Correto'
           from public.verifications where id='R2-V-R2-A'),'reabre apenas o resultado da bonificação e preserva as análises');
select is((select jsonb_agg(to_jsonb(i) order by id) from public.registered_invoices i where id in ('R2-NF1','R2-NF2')),
    (select invoices from r2_before),'as duas notas conservam identidade, valores e análises individuais');
select is((select to_jsonb(p) from public.pendencies p where id='R2-P'),(select pendency from r2_before),'Pendência fiscal permanece intacta');
select ok((select bonus_result='apta' and bonification->>'notaFiscal'='Sim' and row_version=(select neighbor_version from r2_before)
           from public.verifications where id='R2-V-R2-B'),'outro programa permanece consolidado e com a mesma versão');
select is(public.apply_operational_change(pg_temp.request('Não se aplica'),
    (select plan->>'planDigest' from r2_plan),'00000000-0000-0000-0000-00000000a411')->>'replayed',
    'true','repetir a confirmação devolve o mesmo recibo');
select is((select count(*)::int from public.administrative_logs where details->>'operationKey'='00000000-0000-0000-0000-00000000a411'),
    1,'correção tem uma entrada administrativa mesmo depois do reenvio');
select ok((select action='Bonificação corrigida' and details->>'text' like '%Sim → Não se aplica%APTA%'
    from public.administrative_logs where details->>'operationKey'='00000000-0000-0000-0000-00000000a411'),
    'histórico identifica a marca anterior e o resultado consolidado anterior');
select is(public.preview_operational_change(pg_temp.request('Não se aplica')) #>> '{blockers,0,code}',
    'NO_EFFECT','a mesma marca não gera outra correção');
select lives_ok($$select public.apply_operational_change(pg_temp.request(null),
    public.preview_operational_change(pg_temp.request(null))->>'planDigest','00000000-0000-0000-0000-00000000a412')$$,
    'Controlador pode limpar a marca mesmo enquanto a consolidação está pendente');
select ok((select not (bonification ? 'notaFiscal') and bonus_result is null
           and payload @> '{"bonificacaoPendenteConsolidacao":true}' from public.verifications where id='R2-V-R2-A'),
    'limpar a marca conserva o aviso de consolidação pendente');

-- Um cliente antigo pode substituir o payload inteiro em outra edição.
select public.save_verification_with_log(to_jsonb(v) || '{"payload":{}}'::jsonb,v.row_version,
    '{"id":"R2-LOG-EDICAO","action":"Edição"}') from public.verifications v where id='R2-V-R2-A';
select ok((select payload @> '{"bonificacaoPendenteConsolidacao":true}' from public.verifications where id='R2-V-R2-A'),
    'outra gravação canônica preserva o aviso da bonificação');
-- Exercita a persistência do resultado já calculado pelo serviço de consolidação.
select public.save_verification_with_log(to_jsonb(v) || '{"bonification":{"notaFiscal":"Sim","extCC":"Sim","extINV":"Sim","consAssessoria":"Sim","encampInventario":"Sim","boletoInternet":"Sim","declBBAgil":"Sim"},"bonus_result":"apta"}'::jsonb,
    v.row_version,'{"id":"R2-LOG-CONSOLIDACAO","action":"Bonificação consolidada"}') from public.verifications v where id='R2-V-R2-A';
select ok((select bonus_result='apta' and not (payload ? 'bonificacaoPendenteConsolidacao')
    from public.verifications where id='R2-V-R2-A'),'gravar o novo resultado pela RPC canônica encerra o aviso');
select * from finish();
rollback;
