-- RADAR PDDE — contrato de correção operacional (T2/T3).
-- Testes de referência elaborados pela auditoria independente do agente Manus
-- (15/11/2026). Cobrem capacidade, escopo exato, preservação de vizinhos e de
-- bonificação, guardas terminais, digest com versões e idempotência.
begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(92);

-- --------------------------------------------------------------- massa
insert into auth.users (id, email) values
    ('00000000-0000-0000-0000-00000000c001', 'occ-controller@example.test'),
    ('00000000-0000-0000-0000-00000000c002', 'occ-controller-outra-cre@example.test'),
    ('00000000-0000-0000-0000-00000000c003', 'occ-gestao@example.test');
insert into public.controllers (id, name, email, user_id) values
    ('OCC-CTRL-A', 'Controlador Correção A', 'occ-controller@example.test', '00000000-0000-0000-0000-00000000c001'),
    ('OCC-CTRL-B', 'Controlador Correção B', 'occ-controller-outra-cre@example.test', '00000000-0000-0000-0000-00000000c002');
insert into public.user_profiles (user_id, profile_id, controller_id, cre_scope) values
    ('00000000-0000-0000-0000-00000000c001', 'controller', 'OCC-CTRL-A', 'OCC-CRE-A'),
    ('00000000-0000-0000-0000-00000000c002', 'controller', 'OCC-CTRL-B', 'OCC-CRE-B'),
    ('00000000-0000-0000-0000-00000000c003', 'sme_management', null, null);

insert into public.programs (id, name) values ('OCC_BASIC', 'Programa Correção Operacional');
insert into public.competences (id, label, exercise) values ('2041-03', 'Março 2041', 2041);
insert into public.schools (id, designation, denomination, cre, inep, cnpj, sici) values
    ('OCC-SCHOOL', '04.98.001', 'Escola Correção', 'OCC-CRE-A', '33980001', '98.001.001/0001-01', 'SICI-OCC-1');

insert into public.verifications (id, school_id, competence_id, program_id, bonification, analysis, bonus_result, payload)
values (
    'OCC-SCHOOL::2041-03::OCC_BASIC', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC',
    '{"notaFiscal":"Sim","extCC":"Sim","extINV":"Sim","declBBAgil":"Não"}'::jsonb,
    '{"notaFiscal":"Incorreto","extCC":"Incorreto","extINV":"Incorreto","declBBAgil":"Incorreto"}'::jsonb,
    'apta', '{}'::jsonb
);

insert into public.assets (id, school_id, competence_id, description, expense_type, invoice_number, amount, status)
values ('OCC-ASSET-3', 'OCC-SCHOOL', '2041-03', 'Projetor', 'permanente', 'OCC-3', 2400, 'Inventariada');

insert into public.registered_invoices (
    id, school_id, competence_id, program_id, verification_id, source_context_key,
    description, expense_type, invoice_number, amount, linked_asset_id, payload
) values
    ('OCC-NF-1', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'OCC-SCHOOL::2041-03::OCC_BASIC', '2041-03_OCC_BASIC',
     'Material lançado por engano', 'consumo', 'OCC-1', 480, null, '{"analiseDocumentoFiscal":"Incorreto"}'::jsonb),
    ('OCC-NF-2', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'OCC-SCHOOL::2041-03::OCC_BASIC', '2041-03_OCC_BASIC',
     'Material vizinho', 'consumo', 'OCC-2', 300, null, '{"analiseDocumentoFiscal":"Correto"}'::jsonb),
    ('OCC-NF-3', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'OCC-SCHOOL::2041-03::OCC_BASIC', '2041-03_OCC_BASIC',
     'Projetor', 'permanente', 'OCC-3', 2400, 'OCC-ASSET-3', '{"analiseDocumentoFiscal":"Correto"}'::jsonb),
    ('OCC-NF-4', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'OCC-SCHOOL::2041-03::OCC_BASIC', '2041-03_OCC_BASIC',
     'Despesa a identificar', 'a_identificar', null, 90, null, '{"analiseDocumentoFiscal":"Incorreto"}'::jsonb),
    ('OCC-NF-5', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'OCC-SCHOOL::2041-03::OCC_BASIC', '2041-03_OCC_BASIC',
     'Saída identificada do Qualidade', 'consumo', 'OCC-5', 150, null, '{"analiseDocumentoFiscal":"Correto"}'::jsonb);

insert into public.quality_provisional_movements (
    id, school_id, competence_id, debit_date, description, amount, status, registered_invoice_id, identification_operation_key, created_by, updated_by
) values (
    '00000000-0000-0000-0000-00000000c501', 'OCC-SCHOOL', '2041-03', '2041-03-05', 'Saída provisória', 150,
    'identified', 'OCC-NF-5', '00000000-0000-0000-0000-00000000c502', '00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000c001'
);

insert into public.pendencies (id, school_id, competence_origin, program_id, document_key, status, next_actor, registered_invoice_id, resolved_at)
values
    ('OCC-P-NF1', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'notaFiscal', 'Aberta', 'Escola', 'OCC-NF-1', null),
    ('OCC-P-NF1-OLD', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'notaFiscal', 'Resolvida', 'Escola', 'OCC-NF-1', now()),
    ('OCC-P-NF2', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'notaFiscal', 'Resolvida', 'Escola', 'OCC-NF-2', now()),
    ('OCC-P-NF4', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'notaFiscal', 'Aberta', 'Escola', 'OCC-NF-4', null),
    ('OCC-P-EXTCC', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'extCC', 'Aguardando reanálise', 'Controlador', null, null),
    ('OCC-P-EXTINV-1', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'extINV', 'Aberta', 'Escola', null, null),
    ('OCC-P-EXTINV-2', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'extINV', 'Cancelada', 'Escola', null, null),
    ('OCC-P-BB', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'declBBAgil', 'Aberta', 'Escola', null, null);

insert into public.pendency_attempts (id, pendency_id, attempt_number, submitted_at) values
    ('OCC-A-1', 'OCC-P-NF1', 1, now()),
    ('OCC-A-EXTCC', 'OCC-P-EXTCC', 1, now());

insert into public.pendency_contacts (id, school_id, pendency_id, contact_type, contact_date, description) values
    ('OCC-C-1', 'OCC-SCHOOL', 'OCC-P-NF1', 'email', current_date, 'Cobrança da NF 1'),
    ('OCC-C-2', 'OCC-SCHOOL', 'OCC-P-NF1-OLD', 'email', current_date, 'Cobrança antiga da NF 1'),
    ('OCC-C-3', 'OCC-SCHOOL', 'OCC-P-NF2', 'email', current_date, 'Cobrança da NF 2'),
    ('OCC-C-FREE', 'OCC-SCHOOL', null, 'telefone', current_date, 'Contato geral sem Pendência');

create temp table occ_plans (k text primary key, plan jsonb);
grant all on occ_plans to authenticated;

create function pg_temp.occ_req(p_action text, p_target jsonb, p_extra jsonb default '{}'::jsonb)
returns jsonb language sql immutable as $$
    select jsonb_build_object('contractVersion', 1, 'action', p_action,
        'target', jsonb_build_object('schoolId', 'OCC-SCHOOL', 'competence', '2041-03') || p_target) || p_extra
$$;

-- --------------------------------------------------------------- contrato e privilégios
select ok(to_regprocedure('public.preview_operational_change(jsonb)') is not null, 'preview_operational_change existe');
select ok(to_regprocedure('public.apply_operational_change(jsonb,text,uuid)') is not null, 'apply_operational_change existe');
select ok(not has_function_privilege('anon', 'public.preview_operational_change(jsonb)', 'EXECUTE'), 'anon não pré-visualiza correção');
select ok(not has_function_privilege('anon', 'public.apply_operational_change(jsonb,text,uuid)', 'EXECUTE'), 'anon não aplica correção');
select ok(not has_function_privilege('anon', 'radar_private.apply_operational_change_impl(jsonb,text,uuid)', 'EXECUTE'), 'anon não executa a implementação privada');
select ok(not has_table_privilege('authenticated', 'radar_private.operational_change_ledger', 'INSERT'), 'authenticated não grava no livro-razão');
select ok(not has_table_privilege('authenticated', 'radar_private.operational_change_ledger', 'SELECT'), 'authenticated não lê o livro-razão diretamente');
select is(
    (select proconfig from pg_proc where oid = 'radar_private.protect_inventoried_asset_terminal_state()'::regprocedure),
    array['search_path=pg_catalog, public, radar_private']::text[],
    'guarda terminal do bem preserva o search_path endurecido'
);

-- Guardas terminais continuam valendo fora da operação autorizada (mesma mensagem).
select throws_ok($$ delete from public.assets where id = 'OCC-ASSET-3' $$,
    'ASSET_ALREADY_INVENTORIED: assets/OCC-ASSET-3', 'exclusão ordinária de bem Inventariada continua bloqueada');
select throws_ok($$ delete from public.registered_invoices where id = 'OCC-NF-3' $$,
    'ASSET_ALREADY_INVENTORIED: assets/OCC-ASSET-3', 'exclusão ordinária de NF com bem Inventariada continua bloqueada');

-- --------------------------------------------------------------- capacidade
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c003","role":"authenticated"}', true);
set local role authenticated;
select throws_like(
    $$ select public.preview_operational_change(pg_temp.occ_req('delete_invoice', '{"kind":"invoice","id":"OCC-NF-1"}')) $$,
    'AUTHORIZATION_DENIED%', 'Gestão SME (somente leitura) não corrige lançamentos');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c002","role":"authenticated"}', true);
set local role authenticated;
select throws_like(
    $$ select public.preview_operational_change(pg_temp.occ_req('delete_invoice', '{"kind":"invoice","id":"OCC-NF-1"}')) $$,
    'AUTHORIZATION_DENIED%', 'Controlador de outra CRE não corrige a escola');
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c001","role":"authenticated"}', true);
set local role authenticated;

select throws_like(
    $$ select public.preview_operational_change(pg_temp.occ_req('acao_inventada', '{"kind":"invoice","id":"OCC-NF-1"}')) $$,
    'VALIDATION_ERROR%', 'ação desconhecida é rejeitada');
select throws_like(
    $$ select public.preview_operational_change(pg_temp.occ_req('correct_contact', '{"kind":"contact","id":"OCC-C-1"}')) $$,
    'ACTION_NOT_AVAILABLE%', 'ação de lote futuro falha explicitamente, sem falso sucesso');
select throws_like(
    $$ select public.preview_operational_change(pg_temp.occ_req('delete_invoice', '{"kind":"invoice","id":"OCC-NF-1","competence":"2041-04"}')) $$,
    'VALIDATION_ERROR%', 'alvo fora do contexto informado é rejeitado');

-- T2: a retificação de uma NF observa também todas as NFs irmãs do mesmo
-- contexto, evitando confirmar um agregado calculado sobre versões antigas.
select ok(
    (public.preview_operational_change(pg_temp.occ_req(
        'clear_analysis',
        '{"kind":"analysis","id":"OCC-NF-2","programId":"OCC_BASIC","documentKey":"notaFiscal"}'
    )) -> 'versions' -> 'registered_invoices') ?& array['OCC-NF-1', 'OCC-NF-3'],
    'T2: prévia da análise individual inclui versões das NFs irmãs do agregado'
);

-- --------------------------------------------------------------- T3 delete_invoice (escopo exato)
select is((select count(*)::int from public.administrative_logs where school_id = 'OCC-SCHOOL'), 0,
    'consultas e prévias não criam histórico administrativo');
insert into occ_plans values ('nf1', public.preview_operational_change(pg_temp.occ_req('delete_invoice', '{"kind":"invoice","id":"OCC-NF-1","programId":"OCC_BASIC"}')));
select is((select plan -> 'counts' from occ_plans where k = 'nf1'),
    '{"assets": 0, "updates": 0, "attempts": 1, "contacts": 2, "invoices": 1, "pendencies": 2}'::jsonb,
    'plano de exclusão da NF conta exatamente 2 Pendências, 1 envio e 2 contatos');
select is((select plan -> 'effects' -> 'delete' -> 'pendency_contacts' from occ_plans where k = 'nf1'),
    '["OCC-C-1", "OCC-C-2"]'::jsonb, 'contatos de outras NFs e contato geral ficam fora do plano');
select ok((select length(plan ->> 'planDigest') = 64 from occ_plans where k = 'nf1'), 'plano traz digest SHA-256');
select ok((select count(*) = 1 from public.registered_invoices where id = 'OCC-NF-1'), 'pré-visualização não escreve');

select is(
    public.apply_operational_change(
        pg_temp.occ_req('delete_invoice', '{"kind":"invoice","id":"OCC-NF-1","programId":"OCC_BASIC"}'),
        (select plan ->> 'planDigest' from occ_plans where k = 'nf1'),
        '00000000-0000-0000-0000-0000000000a1') ->> 'committed',
    'true', 'exclusão da despesa é aplicada');
select is((select count(*)::int from public.registered_invoices where id = 'OCC-NF-1'), 0, 'NF excluída');
select is((select count(*)::int from public.pendencies where id in ('OCC-P-NF1', 'OCC-P-NF1-OLD')), 0, 'Pendências da NF (inclusive resolvida) excluídas');
select is((select count(*)::int from public.pendency_attempts where id = 'OCC-A-1'), 0, 'envio da Pendência excluído');
select is((select count(*)::int from public.pendency_contacts where id in ('OCC-C-1', 'OCC-C-2')), 0, 'contatos vinculados excluídos');
select is((select count(*)::int from public.pendency_contacts where id in ('OCC-C-3', 'OCC-C-FREE')), 2, 'contatos de outra NF e geral preservados');
select is((select count(*)::int from public.registered_invoices where id = 'OCC-NF-2'), 1, 'NF vizinha preservada');
select is((select bonus_result || '|' || (bonification ->> 'notaFiscal') from public.verifications where id = 'OCC-SCHOOL::2041-03::OCC_BASIC'),
    'apta|Sim', 'bonificação consolidada e marca preservadas (ADR-055)');

select ok(
    (public.apply_operational_change(
        pg_temp.occ_req('delete_invoice', '{"kind":"invoice","id":"OCC-NF-1","programId":"OCC_BASIC"}'),
        (select plan ->> 'planDigest' from occ_plans where k = 'nf1'),
        '00000000-0000-0000-0000-0000000000a1') ->> 'replayed')::boolean,
    'repetição com a mesma operationKey devolve o recibo original');
select is((select count(*)::int from public.administrative_logs
            where school_id = 'OCC-SCHOOL' and actor_user_id = auth.uid()
              and action = 'Nota fiscal excluída' and details ->> 'text' like '%OCC-1%'
              and details ->> 'text' like '%2041-03%' and profile_name = 'Controlador'), 1,
    'a exclusão com vários efeitos e seu replay aparecem uma só vez nos Registros Internos');
select throws_like(
    $$ select public.apply_operational_change(
        pg_temp.occ_req('delete_invoice', '{"kind":"invoice","id":"OCC-NF-2","programId":"OCC_BASIC"}'),
        (select plan ->> 'planDigest' from occ_plans where k = 'nf1'),
        '00000000-0000-0000-0000-0000000000a1') $$,
    'IDEMPOTENCY_CONFLICT%', 'mesma operationKey com outro alvo é conflito');

-- Digest cobre versões: alteração concorrente invalida a prévia.
insert into occ_plans values ('nf2', public.preview_operational_change(pg_temp.occ_req('delete_invoice', '{"kind":"invoice","id":"OCC-NF-2"}')));
reset role;
update public.registered_invoices set amount = 310 where id = 'OCC-NF-2';
set local role authenticated;
select throws_like(
    $$ select public.apply_operational_change(
        pg_temp.occ_req('delete_invoice', '{"kind":"invoice","id":"OCC-NF-2"}'),
        (select plan ->> 'planDigest' from occ_plans where k = 'nf2'),
        '00000000-0000-0000-0000-0000000000a2') $$,
    'STALE_PLAN%', 'alteração entre prévia e aplicação gera STALE_PLAN');

-- Bem Inventariada exclusivo é excluído somente pela operação autorizada.
insert into occ_plans values ('nf3', public.preview_operational_change(pg_temp.occ_req('delete_invoice', '{"kind":"invoice","id":"OCC-NF-3"}')));
select ok((select plan -> 'warnings' @> '[{"code":"ASSET_INVENTORIED_DELETED"}]' from occ_plans where k = 'nf3'), 'prévia avisa que o bem Inventariado será excluído');
select lives_ok(
    $$ select public.apply_operational_change(
        pg_temp.occ_req('delete_invoice', '{"kind":"invoice","id":"OCC-NF-3"}'),
        (select plan ->> 'planDigest' from occ_plans where k = 'nf3'),
        '00000000-0000-0000-0000-0000000000a3') $$,
    'exclusão de despesa com bem Inventariada é permitida pelo comando autorizado');
select is((select (bonification ->> 'encampInventario') || '|' || (analysis ->> 'encampInventario')
    from public.verifications where id = 'OCC-SCHOOL::2041-03::OCC_BASIC'),
    'Não se aplica|Correto', 'T3: última NF permanente removida recompõe encaminhamento e análise patrimonial');
reset role;
select is((select count(*)::int from public.assets where id = 'OCC-ASSET-3'), 0, 'bem exclusivo Inventariada excluído junto com a NF');
insert into public.assets (id, school_id, competence_id, description, expense_type, invoice_number, amount, status)
values ('OCC-ASSET-9', 'OCC-SCHOOL', '2041-03', 'Bem não planejado', 'permanente', 'OCC-9', 10, 'Inventariada');
select throws_ok($$ delete from public.assets where id = 'OCC-ASSET-9' $$,
    'ASSET_ALREADY_INVENTORIED: assets/OCC-ASSET-9', 'após a operação, bem Inventariada fora do plano continua protegido');
set local role authenticated;

-- Despesa a identificar: Pendência obrigatória não é excluída sozinha.
insert into occ_plans values ('p-nf4', public.preview_operational_change(pg_temp.occ_req('delete_pendency', '{"kind":"pendency","id":"OCC-P-NF4"}')));
select ok((select plan -> 'blockers' @> '[{"code":"MANDATORY_PENDENCY"}]' from occ_plans where k = 'p-nf4'), 'Pendência obrigatória da despesa a identificar é bloqueada na prévia');
select throws_like(
    $$ select public.apply_operational_change(
        pg_temp.occ_req('delete_pendency', '{"kind":"pendency","id":"OCC-P-NF4"}'),
        (select plan ->> 'planDigest' from occ_plans where k = 'p-nf4'),
        '00000000-0000-0000-0000-0000000000a4') $$,
    'PLAN_BLOCKED: MANDATORY_PENDENCY%', 'apply respeita o bloqueio determinístico');

insert into occ_plans values ('nf4', public.preview_operational_change(pg_temp.occ_req('delete_invoice', '{"kind":"invoice","id":"OCC-NF-4"}')));
select is((select plan -> 'effects' -> 'update' -> 0 ->> 'after' from occ_plans where k = 'nf4'), 'Correto',
    'excluir a única NF Incorreta recalcula o agregado de Notas Fiscais');
select lives_ok(
    $$ select public.apply_operational_change(
        pg_temp.occ_req('delete_invoice', '{"kind":"invoice","id":"OCC-NF-4"}'),
        (select plan ->> 'planDigest' from occ_plans where k = 'nf4'),
        '00000000-0000-0000-0000-0000000000a5') $$,
    'despesa a identificar e sua Pendência obrigatória são excluídas juntas');
select is((select analysis ->> 'notaFiscal' || '|' || bonus_result from public.verifications where id = 'OCC-SCHOOL::2041-03::OCC_BASIC'),
    'Correto|apta', 'agregado atualizado sem reabrir bonificação');

-- Saída provisória identificada volta a aberta.
insert into occ_plans values ('nf5', public.preview_operational_change(pg_temp.occ_req('delete_invoice', '{"kind":"invoice","id":"OCC-NF-5"}')));
select lives_ok(
    $$ select public.apply_operational_change(
        pg_temp.occ_req('delete_invoice', '{"kind":"invoice","id":"OCC-NF-5"}'),
        (select plan ->> 'planDigest' from occ_plans where k = 'nf5'),
        '00000000-0000-0000-0000-0000000000a6') $$,
    'NF originada de saída provisória é excluída');
reset role;
select is((select status || '|' || coalesce(registered_invoice_id, '-') || '|' || coalesce(identification_operation_key::text, '-')
             from public.quality_provisional_movements where id = '00000000-0000-0000-0000-00000000c501'),
    'open|-|-', 'saída provisória do Qualidade volta a aberta sem vínculo inválido');
set local role authenticated;

-- --------------------------------------------------------------- T2 análise documental
insert into occ_plans values ('clear-extcc', public.preview_operational_change(pg_temp.occ_req('clear_analysis', '{"kind":"analysis","programId":"OCC_BASIC","documentKey":"extCC"}')));
select ok((select plan -> 'warnings' @> '[{"code":"PENDENCY_HAS_SUBMISSIONS"}]' from occ_plans where k = 'clear-extcc'), 'prévia avisa que a Pendência tem envio da escola');
select lives_ok(
    $$ select public.apply_operational_change(
        pg_temp.occ_req('clear_analysis', '{"kind":"analysis","programId":"OCC_BASIC","documentKey":"extCC"}'),
        (select plan ->> 'planDigest' from occ_plans where k = 'clear-extcc'),
        '00000000-0000-0000-0000-0000000000b1') $$,
    'limpar análise aplica sem justificativa obrigatória');
select is((select coalesce(analysis ->> 'extCC', 'Não analisado') || '|' || (bonification ->> 'extCC') from public.verifications where id = 'OCC-SCHOOL::2041-03::OCC_BASIC'),
    'Não analisado|Sim', 'análise volta a Não analisado e a marca de bonificação permanece');
select is((select count(*)::int from public.pendencies where id = 'OCC-P-EXTCC'), 0, 'Pendência consequência excluída com seus envios');

select throws_like(
    $$ select public.preview_operational_change(pg_temp.occ_req('correct_analysis', '{"kind":"analysis","programId":"OCC_BASIC","documentKey":"extINV"}', '{"changes":{"analysis":"Correto"},"selectedPendencyIds":["OCC-P-EXTINV-2"]}')) $$,
    'VALIDATION_ERROR%', 'seleção de Pendência fora da consequência (histórica) é rejeitada');
-- Um cliente não pode enviar seleção vazia e deixar Incorreto sem tratamento.
select ok(
    (public.preview_operational_change(pg_temp.occ_req(
        'correct_analysis',
        '{"kind":"analysis","programId":"OCC_BASIC","documentKey":"extINV"}',
        '{"changes":{"analysis":"Correto"},"selectedPendencyIds":[]}'
    )) -> 'blockers') @> '[{"code":"INCOMPLETE_PENDENCY_SELECTION"}]'::jsonb,
    'T2: seleção explícita vazia bloqueia análise correta com Pendência ativa remanescente'
);

insert into occ_plans values ('fix-extinv-sel', public.preview_operational_change(pg_temp.occ_req('correct_analysis', '{"kind":"analysis","programId":"OCC_BASIC","documentKey":"extINV"}', '{"changes":{"analysis":"Correto"},"selectedPendencyIds":["OCC-P-EXTINV-1"]}')));
select lives_ok(
    $$ select public.apply_operational_change(
        pg_temp.occ_req('correct_analysis', '{"kind":"analysis","programId":"OCC_BASIC","documentKey":"extINV"}', '{"changes":{"analysis":"Correto"},"selectedPendencyIds":["OCC-P-EXTINV-1"]}'),
        (select plan ->> 'planDigest' from occ_plans where k = 'fix-extinv-sel'),
        '00000000-0000-0000-0000-0000000000b2') $$,
    'correção com seleção explícita é aplicada');
select is((select string_agg(id, ',' order by id) from public.pendencies where id like 'OCC-P-EXTINV-%'), 'OCC-P-EXTINV-2',
    'somente a Pendência ativa consequência foi excluída; a histórica cancelada permanece');

insert into occ_plans values ('fix-bb', public.preview_operational_change(pg_temp.occ_req('correct_analysis', '{"kind":"analysis","programId":"OCC_BASIC","documentKey":"declBBAgil"}', '{"changes":{"analysis":"Correto"}}')));
select ok((select plan -> 'warnings' @> '[{"code":"LATE_ANALYSIS_NORMALIZED"}]' from occ_plans where k = 'fix-bb'), 'Correto após não entrega consolidada é normalizado de forma visível');
select lives_ok(
    $$ select public.apply_operational_change(
        pg_temp.occ_req('correct_analysis', '{"kind":"analysis","programId":"OCC_BASIC","documentKey":"declBBAgil"}', '{"changes":{"analysis":"Correto"}}'),
        (select plan ->> 'planDigest' from occ_plans where k = 'fix-bb'),
        '00000000-0000-0000-0000-0000000000b3') $$,
    'correção com normalização de atraso aplicada');
select is((select analysis ->> 'declBBAgil' from public.verifications where id = 'OCC-SCHOOL::2041-03::OCC_BASIC'),
    'Correto (Atrasado)', 'resultado gravado como Correto (Atrasado)');

insert into occ_plans values ('to-incorrect', public.preview_operational_change(pg_temp.occ_req('correct_analysis', '{"kind":"analysis","programId":"OCC_BASIC","documentKey":"extINV"}', '{"changes":{"analysis":"Incorreto"}}')));
select ok((select plan -> 'blockers' @> '[{"code":"OPEN_PENDENCY_FLOW_REQUIRED"}]' from occ_plans where k = 'to-incorrect'), 'Incorreto exige o fluxo próprio com apontamentos');

-- --------------------------------------------------------------- T2 análise individual da NF e Pendência resolvida
insert into occ_plans values ('clear-nf2', public.preview_operational_change(pg_temp.occ_req('clear_analysis', '{"kind":"analysis","id":"OCC-NF-2","programId":"OCC_BASIC","documentKey":"notaFiscal"}')));
select lives_ok(
    $$ select public.apply_operational_change(
        pg_temp.occ_req('clear_analysis', '{"kind":"analysis","id":"OCC-NF-2","programId":"OCC_BASIC","documentKey":"notaFiscal"}'),
        (select plan ->> 'planDigest' from occ_plans where k = 'clear-nf2'),
        '00000000-0000-0000-0000-0000000000b4') $$,
    'limpar a análise individual da NF é aplicado');
select is((select (payload ->> 'analiseDocumentoFiscal') from public.registered_invoices where id = 'OCC-NF-2')
          || '|' || (select analysis ->> 'notaFiscal' from public.verifications where id = 'OCC-SCHOOL::2041-03::OCC_BASIC'),
    'Não analisado|Não analisado', 'análise individual e agregado de Notas Fiscais voltam a Não analisado');

insert into occ_plans values ('del-p-nf2', public.preview_operational_change(pg_temp.occ_req('delete_pendency', '{"kind":"pendency","id":"OCC-P-NF2"}')));
select lives_ok(
    $$ select public.apply_operational_change(
        pg_temp.occ_req('delete_pendency', '{"kind":"pendency","id":"OCC-P-NF2"}', '{"note":"Lançada em duplicidade"}'),
        (select plan ->> 'planDigest' from occ_plans where k = 'del-p-nf2'),
        '00000000-0000-0000-0000-0000000000b5') $$,
    'Pendência resolvida pode ser excluída; nota opcional é aceita');
select throws_like(
    $$ select public.apply_operational_change(
        pg_temp.occ_req('delete_pendency', '{"kind":"pendency","id":"OCC-P-NF2"}', '{"note":"Nota diferente no retry"}'),
        (select plan ->> 'planDigest' from occ_plans where k = 'del-p-nf2'),
        '00000000-0000-0000-0000-0000000000b5') $$,
    'IDEMPOTENCY_CONFLICT%',
    'mesma chave com observacao divergente e rejeitada para proteger rastreabilidade');
select is(
    (public.apply_operational_change(
        pg_temp.occ_req('delete_pendency', '{"kind":"pendency","id":"OCC-P-NF2"}', '{"note":"Lançada em duplicidade"}'),
        (select plan ->> 'planDigest' from occ_plans where k = 'del-p-nf2'),
        '00000000-0000-0000-0000-0000000000b5') ->> 'replayed')::boolean,
    true,
    'mesma chave e observacao original retornam replay idempotente preservando a intencao');
select is((select count(*)::int from public.pendency_contacts where id = 'OCC-C-3'), 0, 'contato vinculado à Pendência excluída também é removido');

reset role;
select is((select count(*)::int from radar_private.operational_change_ledger where status = 'committed'
             and actor_id = '00000000-0000-0000-0000-00000000c001' and actor_role = 'controller'), 9,
    'livro-razão registra autoria e perfil de cada operação aplicada');
select is((select note from radar_private.operational_change_ledger where operation_key = '00000000-0000-0000-0000-0000000000b5'),
    'Lançada em duplicidade', 'nota opcional é preservada no livro-razão');
select is((select count(*)::int from radar_private.operational_change_ledger where status = 'applying'), 0,
    'nenhuma operação fica em estado intermediário');


-- --------------------------------------------------------------- T2/T3 projeções de Assessoria
-- Massa separada para não interferir nas contagens e efeitos do contrato básico.
insert into public.programs (id, name) values ('OCC_SERVICE', 'Serviço de correção');
insert into public.verifications (
    id, school_id, competence_id, program_id, bonification, analysis, bonus_result, payload
) values (
    'OCC-SCHOOL::2041-03::OCC_SERVICE', 'OCC-SCHOOL', '2041-03', 'OCC_SERVICE',
    '{"notaFiscal":"Sim","consAssessoria":"Sim","consEnviada":true}'::jsonb,
    '{"notaFiscal":"Correto","consAssessoria":"Incorreto"}'::jsonb, 'apta', '{}'::jsonb
);
insert into public.registered_invoices (
    id, school_id, competence_id, program_id, verification_id, source_context_key,
    description, expense_type, invoice_number, amount, payload
) values
    ('OCC-SVC-1', 'OCC-SCHOOL', '2041-03', 'OCC_SERVICE', 'OCC-SCHOOL::2041-03::OCC_SERVICE',
     '2041-03_OCC_SERVICE', 'Primeiro serviço', 'servico', 'SERV-1', 500,
     '{"consultaAssessoriaEnviada":true,"analiseConsultaAssessoria":"Incorreto","analiseDocumentoFiscal":"Correto"}'::jsonb),
    ('OCC-SVC-2', 'OCC-SCHOOL', '2041-03', 'OCC_SERVICE', 'OCC-SCHOOL::2041-03::OCC_SERVICE',
     '2041-03_OCC_SERVICE', 'Segundo serviço', 'servico', 'SERV-2', 400,
     '{"consultaAssessoriaEnviada":false,"analiseConsultaAssessoria":"Correto","analiseDocumentoFiscal":"Correto"}'::jsonb);
insert into public.pendencies (
    id, school_id, competence_origin, program_id, document_key, status,
    next_actor, registered_invoice_id
) values ('OCC-P-SVC-1', 'OCC-SCHOOL', '2041-03', 'OCC_SERVICE',
    'consAssessoria', 'Aberta', 'Escola', 'OCC-SVC-1');
set local role authenticated;

insert into occ_plans values ('svc-p', public.preview_operational_change(pg_temp.occ_req(
    'delete_pendency', '{"kind":"pendency","id":"OCC-P-SVC-1","programId":"OCC_SERVICE"}')));
select lives_ok(
    $$ select public.apply_operational_change(
        pg_temp.occ_req('delete_pendency', '{"kind":"pendency","id":"OCC-P-SVC-1","programId":"OCC_SERVICE"}'),
        (select plan ->> 'planDigest' from occ_plans where k = 'svc-p'),
        '00000000-0000-0000-0000-0000000000c1') $$,
    'T2: excluir Pendência ativa de Assessoria com outra NF de serviço é permitido');
select is(
    (select payload ->> 'analiseConsultaAssessoria' from public.registered_invoices where id='OCC-SVC-1')
    || '|' || (select analysis ->> 'consAssessoria' from public.verifications
        where id='OCC-SCHOOL::2041-03::OCC_SERVICE'),
    'Não analisado|Não analisado',
    'T2: análise individual e agregado de Assessoria são recompostos ao excluir Pendência');
insert into occ_plans values ('svc1', public.preview_operational_change(pg_temp.occ_req(
    'delete_invoice', '{"kind":"invoice","id":"OCC-SVC-1","programId":"OCC_SERVICE"}')));
select ok((select plan -> 'effects' -> 'update' @>
    '[{"field":"bonification.consAssessoria"},{"field":"bonification.consEnviada"},{"field":"analysis.consAssessoria"}]'::jsonb
    from occ_plans where k='svc1'),
    'T3: prévia contém as três projeções de Assessoria afetadas pela exclusão');
select lives_ok(
    $$ select public.apply_operational_change(
        pg_temp.occ_req('delete_invoice', '{"kind":"invoice","id":"OCC-SVC-1","programId":"OCC_SERVICE"}'),
        (select plan ->> 'planDigest' from occ_plans where k = 'svc1'),
        '00000000-0000-0000-0000-0000000000c2') $$,
    'T3: excluir a primeira NF de serviço recompõe projeções');
select is((select (bonification ->> 'consAssessoria') || '|' || (bonification ->> 'consEnviada')
      || '|' || (analysis ->> 'consAssessoria') || '|' || bonus_result
    from public.verifications where id='OCC-SCHOOL::2041-03::OCC_SERVICE'),
    'Não|false|Correto|apta',
    'T3: Assessoria deriva da NF restante e bonificação consolidada permanece');
select is((select count(*)::int from public.registered_invoices where id='OCC-SVC-2'), 1,
    'T3: NF vizinha de serviço permanece intacta');
-- A correção individual de serviço deve refletir o novo resumo após F5.
insert into occ_plans values ('svc2-clear', public.preview_operational_change(pg_temp.occ_req(
    'clear_analysis', '{"kind":"analysis","id":"OCC-SVC-2","programId":"OCC_SERVICE","documentKey":"consAssessoria"}')));
select lives_ok(
    $$ select public.apply_operational_change(
        pg_temp.occ_req('clear_analysis', '{"kind":"analysis","id":"OCC-SVC-2","programId":"OCC_SERVICE","documentKey":"consAssessoria"}'),
        (select plan ->> 'planDigest' from occ_plans where k='svc2-clear'),
        '00000000-0000-0000-0000-0000000000c4') $$,
    'T2: limpar análise individual de Assessoria aplica sem apagar NF');
select is(
    (select payload ->> 'analiseConsultaAssessoria' from public.registered_invoices where id='OCC-SVC-2')
      || '|' || (select analysis ->> 'consAssessoria' from public.verifications
          where id='OCC-SCHOOL::2041-03::OCC_SERVICE'),
    'Não analisado|Não analisado',
    'T2: limpeza individual também sincroniza resumo da Consulta Assessoria');
insert into occ_plans values ('svc2', public.preview_operational_change(pg_temp.occ_req(
    'delete_invoice', '{"kind":"invoice","id":"OCC-SVC-2","programId":"OCC_SERVICE"}')));
select lives_ok(
    $$ select public.apply_operational_change(
        pg_temp.occ_req('delete_invoice', '{"kind":"invoice","id":"OCC-SVC-2","programId":"OCC_SERVICE"}'),
        (select plan ->> 'planDigest' from occ_plans where k = 'svc2'),
        '00000000-0000-0000-0000-0000000000c3') $$,
    'T3: excluir última NF de serviço recompõe o contexto vazio');
select is((select (bonification ->> 'consAssessoria') || '|' || (bonification ->> 'consEnviada')
      || '|' || (analysis ->> 'consAssessoria') || '|' || bonus_result
    from public.verifications where id='OCC-SCHOOL::2041-03::OCC_SERVICE'),
    'Não se aplica|false|Correto|apta',
    'T3: sem notas de serviço Assessoria é N/A sem apagar resultado consolidado');
reset role;

-- --------------------------------------------------------------- T2 deduplicação de selectedPendencyIds
-- Garante que IDs repetidos em selectedPendencyIds não inflem a contagem nem
-- dupliquem o plano de exclusão causando OPTIMISTIC_CONFLICT na segunda deleção.
insert into public.programs (id, name) values ('OCC_DEDUP', 'Programa Deduplicação');
insert into public.verifications (
    id, school_id, competence_id, program_id, bonification, analysis, bonus_result, payload
) values (
    'OCC-SCHOOL::2041-03::OCC_DEDUP', 'OCC-SCHOOL', '2041-03', 'OCC_DEDUP',
    '{"extCC":"Sim"}'::jsonb, '{"extCC":"Incorreto"}'::jsonb, 'apta', '{}'::jsonb
);
insert into public.pendencies (
    id, school_id, competence_origin, program_id, document_key, status,
    next_actor, registered_invoice_id
) values
    ('OCC-P-DUP-1', 'OCC-SCHOOL', '2041-03', 'OCC_DEDUP', 'extCC', 'Aberta', 'Escola', null);
set local role authenticated;

insert into occ_plans values ('dedup-sel', public.preview_operational_change(pg_temp.occ_req(
    'correct_analysis',
    '{"kind":"analysis","programId":"OCC_DEDUP","documentKey":"extCC"}',
    '{"changes":{"analysis":"Correto"},"selectedPendencyIds":["OCC-P-DUP-1","OCC-P-DUP-1"]}'
)));
select is(
    (select jsonb_build_object(
        'count', plan -> 'counts' -> 'pendencies',
        'ids', plan -> 'effects' -> 'delete' -> 'pendencies'
    ) from occ_plans where k = 'dedup-sel'),
    '{"count":1,"ids":["OCC-P-DUP-1"]}'::jsonb,
    'T2: selectedPendencyIds duplicados são deduplicados no plano sem inflar contagem'
);
select lives_ok(
    $$ select public.apply_operational_change(
        pg_temp.occ_req(
            'correct_analysis',
            '{"kind":"analysis","programId":"OCC_DEDUP","documentKey":"extCC"}',
            '{"changes":{"analysis":"Correto"},"selectedPendencyIds":["OCC-P-DUP-1","OCC-P-DUP-1"]}'
        ),
        (select plan ->> 'planDigest' from occ_plans where k = 'dedup-sel'),
        '00000000-0000-0000-0000-0000000000d1') $$,
    'T2: apply com selectedPendencyIds duplicados executa sem OPTIMISTIC_CONFLICT'
);
select is(
    (select count(*)::int from public.pendencies where id = 'OCC-P-DUP-1'),
    0,
    'T2: Pendência deduplicada foi removida integralmente na transação'
);
reset role;

-- Duas NFs históricas podem apontar ao mesmo bem. A exclusão de apenas uma
-- delas deve manter o vínculo da vizinha e a inventariação já registrada.
insert into public.assets (id, school_id, competence_id, description, expense_type, invoice_number, amount, status)
values ('OCC-ASSET-SHARED', 'OCC-SCHOOL', '2041-03', 'Bem histórico compartilhado', 'permanente', 'OCC-SH-A', 400, 'Inventariada');
insert into public.registered_invoices
    (id, school_id, competence_id, program_id, verification_id, source_context_key, description, expense_type, invoice_number, amount, linked_asset_id)
select 'OCC-SH-' || label, 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'OCC-SCHOOL::2041-03::OCC_BASIC', '2041-03_OCC_BASIC',
       'Aquisição compartilhada ' || label, 'permanente', 'OCC-SH-' || label, 200, 'OCC-ASSET-SHARED'
from (values ('A'), ('B')) as suffix(label);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000c001","role":"authenticated"}', true);
set local role authenticated;
insert into occ_plans values ('shared-asset', public.preview_operational_change(
    pg_temp.occ_req('delete_invoice', '{"kind":"invoice","id":"OCC-SH-A","programId":"OCC_BASIC"}')));
select is((select plan -> 'preserved' ->> 'sharedAssetId' from occ_plans where k = 'shared-asset'),
    'OCC-ASSET-SHARED', 'T3: prévia informa o ID do bem compartilhado que será preservado');
select is((select plan -> 'effects' -> 'delete' -> 'assets' from occ_plans where k = 'shared-asset'),
    '[]'::jsonb, 'T3: o bem compartilhado não integra a exclusão');
select lives_ok($$
    select public.apply_operational_change(
        pg_temp.occ_req('delete_invoice', '{"kind":"invoice","id":"OCC-SH-A","programId":"OCC_BASIC"}'),
        (select plan ->> 'planDigest' from occ_plans where k = 'shared-asset'), '00000000-0000-0000-0000-0000000000e1')
$$, 'T3: excluir uma das NFs com bem compartilhado');
select is((
    select array[
        (select count(*)::text from public.registered_invoices where id = 'OCC-SH-A'),
        (select linked_asset_id from public.registered_invoices where id = 'OCC-SH-B'),
        (select status from public.assets where id = 'OCC-ASSET-SHARED'),
        (select bonus_result from public.verifications where id = 'OCC-SCHOOL::2041-03::OCC_BASIC')
    ]), array['0', 'OCC-ASSET-SHARED', 'Inventariada', 'apta'],
    'T3: NF alvo removida, NF vizinha vinculada, bem terminal e bonificação preservados');
reset role;

-- Só um resultado mensal inequívoco pode ser exibido para uma nota antiga.
insert into public.programs (id, name) values ('OCC_LEGACY', 'Programa legado');
insert into public.verifications (id, school_id, competence_id, program_id, analysis, bonus_result)
values ('OCC-LEGACY-V', 'OCC-SCHOOL', '2041-03', 'OCC_LEGACY',
        '{"notaFiscal":"Correto","consAssessoria":"Incorreto"}', 'apta');
insert into public.registered_invoices (id, school_id, competence_id, program_id, verification_id,
    source_context_key, description, expense_type, invoice_number, amount)
values ('OCC-LEGACY-SVC', 'OCC-SCHOOL', '2041-03', 'OCC_LEGACY', null,
        '2041-03_OCC_LEGACY', 'Serviço legado', 'servico', 'LEG-2', 90);

create function pg_temp.legacy_request(invoice_id text, document_key text)
returns jsonb language sql as $$
    select pg_temp.occ_req('clear_analysis', jsonb_build_object('kind','analysis','id',invoice_id,
        'programId','OCC_LEGACY','documentKey',document_key))
$$;

set local role authenticated;
insert into occ_plans values
    ('legacy-fiscal', public.preview_operational_change(pg_temp.legacy_request('OCC-LEGACY-SVC','notaFiscal'))),
    ('legacy-service', public.preview_operational_change(pg_temp.legacy_request('OCC-LEGACY-SVC','consAssessoria')));

select ok((select plan -> 'blockers' = '[]' and plan #>> '{effects,update,0,before}' = 'Correto'
                  and (plan #> '{versions,registered_invoices}') ? 'OCC-LEGACY-SVC'
             from occ_plans where k = 'legacy-fiscal'),
    'prévia usa o resumo fiscal para a única NF, mesmo sem verification_id');
select ok((select plan -> 'blockers' = '[]' and plan #>> '{effects,update,0,before}' = 'Incorreto'
             from occ_plans where k = 'legacy-service'),
    'a única nota de serviço pode usar a análise de Assessoria exibida');
select lives_ok($$ select public.apply_operational_change(pg_temp.legacy_request('OCC-LEGACY-SVC','notaFiscal'),
    (select plan ->> 'planDigest' from occ_plans where k = 'legacy-fiscal'),
    '00000000-0000-0000-0000-0000000000f1') $$, 'limpa a análise fiscal herdada pela RPC normal');
select is((select array[
    (select payload ->> 'analiseDocumentoFiscal' from public.registered_invoices where id = 'OCC-LEGACY-SVC'),
    (select analysis ->> 'notaFiscal' from public.verifications where id = 'OCC-LEGACY-V'),
    (select bonus_result from public.verifications where id = 'OCC-LEGACY-V')
]), array['Não analisado','Não analisado','apta'],
    'limpar altera nota e resumo e preserva a bonificação');
select lives_ok($$ select public.apply_operational_change(pg_temp.legacy_request('OCC-LEGACY-SVC','consAssessoria'),
    public.preview_operational_change(pg_temp.legacy_request('OCC-LEGACY-SVC','consAssessoria')) ->> 'planDigest',
    '00000000-0000-0000-0000-0000000000f2') $$, 'limpa a análise herdada da Assessoria');
select is((select analysis ->> 'consAssessoria' from public.verifications where id = 'OCC-LEGACY-V'),
    'Não analisado', 'a limpeza da Assessoria atualiza a projeção técnica');
reset role;

-- A presença de outra análise fiscal explícita ou de outro serviço impede a herança.
update public.verifications set analysis = '{"notaFiscal":"Incorreto","consAssessoria":"Correto"}'
 where id = 'OCC-LEGACY-V';
insert into public.registered_invoices (id, school_id, competence_id, program_id, verification_id,
    source_context_key, description, expense_type, invoice_number, amount)
values ('OCC-LEGACY-SVC2', 'OCC-SCHOOL', '2041-03', 'OCC_LEGACY', null,
        '2041-03_OCC_LEGACY', 'Outro serviço sem análise', 'servico', 'LEG-3', 45);
set local role authenticated;
select ok(public.preview_operational_change(pg_temp.legacy_request('OCC-LEGACY-SVC2','notaFiscal'))
    -> 'blockers' @> '[{"code":"NO_EFFECT"}]',
    'NF irmã com resultado explícito impede herdar o resumo fiscal');
select ok(public.preview_operational_change(pg_temp.legacy_request('OCC-LEGACY-SVC2','consAssessoria'))
    -> 'blockers' @> '[{"code":"NO_EFFECT"}]',
    'duas notas de serviço nunca recebem a análise de Assessoria do resumo');
reset role;
update public.registered_invoices set payload = payload - 'analiseDocumentoFiscal' where id = 'OCC-LEGACY-SVC';
set local role authenticated;
select ok(public.preview_operational_change(pg_temp.legacy_request('OCC-LEGACY-SVC2','notaFiscal'))
    -> 'blockers' @> '[{"code":"NO_EFFECT"}]',
    'nenhuma das duas NFs sem análise própria herda a conclusão mensal compartilhada');
reset role;

select * from finish();
rollback;
