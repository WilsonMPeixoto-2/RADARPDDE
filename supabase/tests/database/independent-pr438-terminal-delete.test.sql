-- Contraprova independente do PR #438. Executar SOMENTE em Supabase descartável.
-- Não corrige produto: cada throws_ok demonstra uma rota de exclusão não protegida.
begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(16);

insert into auth.users(id,email) values
('00000000-0000-0000-0000-000000008438','independent-terminal-438@example.test');
insert into public.competences(id,label,exercise,bonus_deadline)
values ('2028-11','Novembro de 2028',2028,'2028-12-15');
insert into public.programs(id,name) values ('INDEP438','Teste independente de patrimônio');
insert into public.schools(id,designation,denomination,cre,initial_competence,inep,cnpj,sici)
values ('04.99.438','04.99.438','Escola sintética de auditoria','4ª CRE','2028-11','33009438','90.009.438/0001-41','SICI-INDEP-438');
insert into public.verifications(id,school_id,competence_id,program_id,bonification,analysis,bonus_result)
values ('04.99.438::2028-11::INDEP438','04.99.438','2028-11','INDEP438',
'{"notaFiscal":"Sim"}'::jsonb,'{"notaFiscal":"Correto"}'::jsonb,'inapta');
insert into public.user_profiles(user_id,profile_id)
values ('00000000-0000-0000-0000-000000008438','federal_assistant');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000008438',true);

insert into public.assets(id,school_id,competence_id,description,expense_type,invoice_number,amount,status,inventory_process)
select 'audit-ind438-asset-' || n,'04.99.438','2028-11',
       'Patrimônio sintético ' || n,'permanente','NF-AUD-438-' || n,100*n,
       case when n=5 then 'Não encaminhada' else 'Inventariada' end,
       case when n=5 then '' else 'PROC-AUD-438' end
from generate_series(1,5) as n;
insert into public.registered_invoices(
    id,school_id,competence_id,program_id,verification_id,source_context_key,
    description,expense_type,invoice_number,amount,linked_asset_id)
select 'audit-ind438-invoice-' || n,'04.99.438','2028-11','INDEP438',
       '04.99.438::2028-11::INDEP438','2028-11_INDEP438',
       'Despesa sintética ' || n,'permanente','NF-AUD-438-' || n,100*n,
       'audit-ind438-asset-' || n
from generate_series(1,5) as n;

-- 1. Operação canônica: exclusão da NF e do bem em estado terminal.
select throws_ok(
    $q$select public.delete_invoice_with_effects(
        p_invoice_id => 'audit-ind438-invoice-1',
        p_expected_invoice_version => (select row_version from public.registered_invoices where id='audit-ind438-invoice-1'),
        p_delete_linked_asset => true,
        p_expected_asset_version => (select row_version from public.assets where id='audit-ind438-asset-1')
    )$q$,
    'P0001','ASSET_ALREADY_INVENTORIED: assets/audit-ind438-asset-1',
    'RPC true deve rejeitar exclusão do patrimônio terminal'
);

-- 2. RPC false: não é permitido apagar a NF e deixar o inventariado sem vínculo.
select throws_ok(
    $q$select public.delete_invoice_with_effects(
        p_invoice_id => 'audit-ind438-invoice-2',
        p_expected_invoice_version => (select row_version from public.registered_invoices where id='audit-ind438-invoice-2'),
        p_delete_linked_asset => false
    )$q$,
    'P0001','ASSET_ALREADY_INVENTORIED: assets/audit-ind438-asset-2',
    'RPC false deve preservar a NF vinculada ao bem terminal'
);

-- 3. Rota lateral de DELETE direto da NF.
select throws_ok(
    $q$delete from public.registered_invoices where id='audit-ind438-invoice-3'$q$,
    'P0001','ASSET_ALREADY_INVENTORIED: assets/audit-ind438-asset-3',
    'DELETE direto da NF deve preservar seu patrimônio inventariado'
);

-- 4. Rota lateral DELETE direto do bem (FK SET NULL não protege histórico).
select throws_ok(
    $q$delete from public.assets where id='audit-ind438-asset-4'$q$,
    'P0001','ASSET_ALREADY_INVENTORIED: assets/audit-ind438-asset-4',
    'DELETE direto do bem inventariado deve ser recusado'
);

-- Após cada tentativa rejeitada, NF e bem devem permanecer vinculados e completos.
select is((select count(*)::int from public.registered_invoices where id='audit-ind438-invoice-1' and linked_asset_id='audit-ind438-asset-1'),1,'rota 1 mantém NF e vínculo');
select is((select count(*)::int from public.assets where id='audit-ind438-asset-1' and status='Inventariada'),1,'rota 1 mantém o bem terminal');
select is((select count(*)::int from public.registered_invoices where id='audit-ind438-invoice-2' and linked_asset_id='audit-ind438-asset-2'),1,'rota 2 mantém NF e vínculo');
select is((select count(*)::int from public.assets where id='audit-ind438-asset-2' and status='Inventariada'),1,'rota 2 mantém o bem terminal');
select is((select count(*)::int from public.registered_invoices where id='audit-ind438-invoice-3' and linked_asset_id='audit-ind438-asset-3'),1,'rota 3 mantém NF e vínculo');
select is((select count(*)::int from public.assets where id='audit-ind438-asset-3' and status='Inventariada'),1,'rota 3 mantém o bem terminal');
select is((select count(*)::int from public.registered_invoices where id='audit-ind438-invoice-4' and linked_asset_id='audit-ind438-asset-4'),1,'rota 4 mantém NF e vínculo');
select is((select count(*)::int from public.assets where id='audit-ind438-asset-4' and status='Inventariada'),1,'rota 4 mantém o bem terminal');

-- Contraprova de não regressão: excluir NF ainda não encaminhada deve continuar permitido.
select lives_ok(
    $q$select public.delete_invoice_with_effects(
        p_invoice_id => 'audit-ind438-invoice-5',
        p_expected_invoice_version => (select row_version from public.registered_invoices where id='audit-ind438-invoice-5'),
        p_delete_linked_asset => true,
        p_expected_asset_version => (select row_version from public.assets where id='audit-ind438-asset-5')
    )$q$,
    'bem ainda não encaminhado pode ser excluído ordinariamente'
);
select ok(
    not exists (select 1 from public.registered_invoices where id='audit-ind438-invoice-5')
    and not exists (select 1 from public.assets where id='audit-ind438-asset-5')
    and (select bonus_result from public.verifications where id='04.99.438::2028-11::INDEP438')='inapta',
    'remoção pré-terminal funciona e a bonificação consolidada não muda'
);

-- 5. Sem NF: a própria linha Inventariada deve resistir a DELETE direto.
-- Diferencia proteção patrimonial real de bloqueio indireto gerado pela FK.
insert into public.assets(id,school_id,competence_id,description,expense_type,invoice_number,amount,status,inventory_process)
values ('audit-ind438-asset-standalone','04.99.438','2028-11','Patrimônio terminal isolado',
'permanente','NF-LEGADO-AUD',650,'Inventariada','PROC-AUD-438');
select throws_ok(
    $q$delete from public.assets where id='audit-ind438-asset-standalone'$q$,
    'P0001','ASSET_ALREADY_INVENTORIED: assets/audit-ind438-asset-standalone',
    'DELETE direto de Inventariada sem NF também deve ser recusado'
);
select is(
    (select count(*)::int from public.assets where id='audit-ind438-asset-standalone' and status='Inventariada'),
    1,
    'bem terminal sem NF deve permanecer intacto'
);

select * from finish();
rollback;