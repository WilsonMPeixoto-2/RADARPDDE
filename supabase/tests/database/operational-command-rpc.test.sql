begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(42);

-- Contratos implantados pela migration operacional.
select ok(to_regprocedure('public.save_pendency_contact_with_log(jsonb,text,jsonb)') is not null, 'RPC de contato existe');
select ok(to_regprocedure('public.save_pendency_command(text,jsonb,integer,jsonb,jsonb,integer,jsonb)') is not null, 'RPC de pendência existe');
select ok(to_regprocedure('public.save_asset_with_log(jsonb,integer,jsonb)') is not null, 'RPC de patrimônio existe');
select ok(to_regprocedure('public.save_program_with_log(jsonb,integer,jsonb)') is not null, 'RPC de programa existe');
select ok(to_regprocedure('public.save_calendar_with_log(jsonb,integer,jsonb)') is not null, 'RPC de calendário existe');
select ok(to_regprocedure('public.assign_controller_with_log(jsonb,jsonb)') is not null, 'RPC de redistribuição existe');
select ok(to_regprocedure('public.save_exercise_with_competences(jsonb,jsonb,jsonb)') is not null, 'RPC endurecida de exercício existe');
select ok(to_regprocedure('public.save_school_with_programs(jsonb,jsonb,integer,jsonb)') is not null, 'RPC endurecida de escola existe');
select ok(to_regprocedure('public.reanalyze_pendency_with_verification(jsonb,jsonb,jsonb,integer,integer,jsonb)') is not null, 'RPC endurecida de reanálise existe');
select ok(
    (select bool_and(not p.prosecdef)
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname in (
            'save_pendency_contact_with_log', 'save_pendency_command',
            'save_asset_with_log', 'save_program_with_log',
            'save_calendar_with_log', 'assign_controller_with_log',
            'save_exercise_with_competences', 'save_school_with_programs',
            'reanalyze_pendency_with_verification'
        )),
    'todas as RPCs operacionais usam SECURITY INVOKER'
);

-- Identidades e massa efêmera.
insert into auth.users (id, email) values
('00000000-0000-0000-0000-000000000941', 'ops-controller@example.test'),
('00000000-0000-0000-0000-000000000942', 'ops-admin@example.test'),
('00000000-0000-0000-0000-000000000943', 'ops-inventory@example.test');
insert into public.controllers (id, name, email, user_id) values
('OPS-CTRL', 'Controlador Operacional', 'ops-controller@example.test', '00000000-0000-0000-0000-000000000941'),
('OPS-CTRL-2', 'Controlador Destino', 'ops-controller-2@example.test', null);
insert into public.inventory_team_members (id, name, email, user_id) values
('OPS-INV', 'Inventário Operacional', 'ops-inventory@example.test', '00000000-0000-0000-0000-000000000943');
insert into public.user_profiles (user_id, profile_id, controller_id, inventory_member_id, cre_scope) values
('00000000-0000-0000-0000-000000000941', 'controller', 'OPS-CTRL', null, '4ª CRE'),
('00000000-0000-0000-0000-000000000942', 'technical_admin', null, null, null),
('00000000-0000-0000-0000-000000000943', 'inventory', null, 'OPS-INV', '4ª CRE');
insert into public.competences (id, label, exercise) values
('2034-01', 'Janeiro 2034', 2034),
('2034-02', 'Fevereiro 2034', 2034);
insert into public.programs (id, name) values ('OPS_BASIC', 'Programa Operacional');
insert into public.schools (id, designation, denomination, cre, initial_competence, controller_id, inventory_process) values
('OPS-SCHOOL-1', '04.99.941', 'Escola Operacional 1', '4ª CRE', '2034-01', 'OPS-CTRL', '07/941/2034'),
('OPS-SCHOOL-2', '04.99.942', 'Escola Operacional 2', '4ª CRE', '2034-01', 'OPS-CTRL', '07/942/2034');
insert into public.verifications (id, school_id, competence_id, program_id, bonification, analysis, payload)
values ('OPS-SCHOOL-1::2034-01::OPS_BASIC', 'OPS-SCHOOL-1', '2034-01', 'OPS_BASIC', '{"extCC":"Sim"}', '{"extCC":"Incorreto"}', '{}');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000941', true);

-- Contato + log: idempotência e autoria.
select lives_ok($$
    select public.save_pendency_contact_with_log(
        '{"id":"OPS-CONTACT-1","school_id":"OPS-SCHOOL-1","pendency_id":null,"contact_type":"Telefone","contact_date":"2034-01-10","description":"Orientação registrada","official_charge":false,"payload":{}}'::jsonb,
        'OPS-CONTACT-OP-1',
        '{"id":"OPS-LOG-CONTACT-1","school_id":"OPS-SCHOOL-1","action":"Contato Registrado","details":{}}'::jsonb
    )
$$, 'contato e log são inseridos atomicamente');
select is((select count(*)::integer from public.pendency_contacts where operation_id = 'OPS-CONTACT-OP-1'), 1, 'contato foi inserido uma vez');
select is((select created_by::text from public.pendency_contacts where operation_id = 'OPS-CONTACT-OP-1'), '00000000-0000-0000-0000-000000000941', 'autoria do contato vem de auth.uid');
select lives_ok($$
    select public.save_pendency_contact_with_log(
        '{"id":"OPS-CONTACT-1","school_id":"OPS-SCHOOL-1","pendency_id":null,"contact_type":"Telefone","contact_date":"2034-01-10","description":"Orientação registrada","official_charge":false,"payload":{}}'::jsonb,
        'OPS-CONTACT-OP-1',
        '{"id":"OPS-LOG-CONTACT-1","school_id":"OPS-SCHOOL-1","action":"Contato Registrado","details":{}}'::jsonb
    )
$$, 'repetição idempotente não falha');
select is((select count(*)::integer from public.pendency_contacts where operation_id = 'OPS-CONTACT-OP-1'), 1, 'repetição mantém uma única linha');
select throws_ok($$
    select public.save_pendency_contact_with_log(
        '{"id":"OPS-CONTACT-2","school_id":"OPS-SCHOOL-1","pendency_id":null,"contact_type":"E-mail","contact_date":"2034-01-11","description":"Deve reverter","official_charge":false,"payload":{}}'::jsonb,
        'OPS-CONTACT-OP-2',
        '{"id":"OPS-LOG-CONTACT-1","school_id":"OPS-SCHOOL-1","action":"Contato Registrado","details":{}}'::jsonb
    )
$$, '23505', null, 'falha do log aborta o contato');
select is((select count(*)::integer from public.pendency_contacts where operation_id = 'OPS-CONTACT-OP-2'), 0, 'contato parcial não permanece');

-- Pendência, tentativa, verificação e log.
select lives_ok($$
    select public.save_pendency_command(
        'open',
        '{"id":"OPS-PEND-1","school_id":"OPS-SCHOOL-1","competence_origin":"2034-01","program_id":"OPS_BASIC","document_key":"extCC","status":"Aberta","responsible_area":"Escola","next_actor":"Escola","reason":"Documento ilegível","notes":"Correção necessária","opened_at":"2034-01-10T12:00:00Z","resolved_at":null,"canceled_at":null,"payload":{}}'::jsonb,
        null, null, null, null,
        '{"id":"OPS-LOG-PEND-OPEN","school_id":"OPS-SCHOOL-1","action":"Pendência Aberta","details":{}}'::jsonb
    )
$$, 'abre pendência e log na mesma transação');
select is((select status from public.pendencies where id = 'OPS-PEND-1'), 'Aberta', 'pendência aberta foi persistida');
select is((select row_version from public.pendencies where id = 'OPS-PEND-1'), 1, 'pendência inicia na versão 1');
select throws_ok($$
    select public.save_pendency_command(
        'open',
        '{"id":"OPS-PEND-DUP","school_id":"OPS-SCHOOL-1","competence_origin":"2034-01","program_id":"OPS_BASIC","document_key":"extCC","status":"Aberta","responsible_area":"Escola","next_actor":"Escola","reason":"Duplicada","notes":"","opened_at":"2034-01-10T12:01:00Z","payload":{}}'::jsonb,
        null, null, null, null,
        '{"id":"OPS-LOG-PEND-DUP","school_id":"OPS-SCHOOL-1","action":"Pendência Aberta","details":{}}'::jsonb
    )
$$, '23505', null, 'índice parcial impede pendência documental ativa duplicada');
select lives_ok($$
    select public.save_pendency_command(
        'register_attempt',
        '{"id":"OPS-PEND-1","school_id":"OPS-SCHOOL-1","competence_origin":"2034-01","program_id":"OPS_BASIC","document_key":"extCC","status":"Aguardando reanálise","responsible_area":"Controlador","next_actor":"Controlador","reason":"Documento ilegível","notes":"Novo envio","opened_at":"2034-01-10T12:00:00Z","resolved_at":null,"canceled_at":null,"payload":{}}'::jsonb,
        1,
        '{"id":"OPS-ATTEMPT-1","pendency_id":"OPS-PEND-1","attempt_number":1,"submitted_at":"2034-01-11T12:00:00Z","analyzed_at":null,"result":null,"observation":"Arquivo substituído","drive_url":"https://drive.example/ops","errors":[],"payload":{}}'::jsonb,
        '{"id":"OPS-SCHOOL-1::2034-01::OPS_BASIC","school_id":"OPS-SCHOOL-1","competence_id":"2034-01","program_id":"OPS_BASIC","bonification":{"extCC":"Sim"},"analysis":{"extCC":"Não analisado"},"bonus_result":null,"payload":{}}'::jsonb,
        1,
        '{"id":"OPS-LOG-PEND-ATTEMPT","school_id":"OPS-SCHOOL-1","action":"Novo envio registrado","details":{}}'::jsonb
    )
$$, 'novo envio persiste o agregado completo');
select is((select row_version from public.pendencies where id = 'OPS-PEND-1'), 2, 'novo envio eleva a versão da pendência');
select is((select count(*)::integer from public.pendency_attempts where pendency_id = 'OPS-PEND-1'), 1, 'tentativa foi persistida uma vez');
select is((select analysis ->> 'extCC' from public.verifications where id = 'OPS-SCHOOL-1::2034-01::OPS_BASIC'), 'Não analisado', 'verificação foi atualizada no mesmo comando');

-- Bem e log com transição entre Controlador e Inventário.
select lives_ok($$
    select public.save_asset_with_log(
        '{"id":"OPS-ASSET-1","school_id":"OPS-SCHOOL-1","competence_id":"2034-01","description":"Notebook","expense_type":"permanente","invoice_number":"NF-OPS","amount":4500,"status":"Encaminhada","inventory_process":"07/941/2034","notes":"","inventoried_by_member_id":null,"inventoried_at":null,"payload":{}}'::jsonb,
        null,
        '{"id":"OPS-LOG-ASSET-1","school_id":"OPS-SCHOOL-1","action":"Bem Cadastrado","details":{}}'::jsonb
    )
$$, 'Controlador cadastra bem e log atomicamente');
select is((select row_version from public.assets where id = 'OPS-ASSET-1'), 1, 'bem inicia na versão 1');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000943', true);
select lives_ok($$
    select public.save_asset_with_log(
        '{"id":"OPS-ASSET-1","school_id":"OPS-SCHOOL-1","competence_id":"2034-01","description":"Notebook","expense_type":"permanente","invoice_number":"NF-OPS","amount":4500,"status":"Inventariada","inventory_process":"07/941/2034","notes":"Conferido","inventoried_by_member_id":"OPS-INV","inventoried_at":"2034-01-12T12:00:00Z","payload":{}}'::jsonb,
        1,
        '{"id":"OPS-LOG-ASSET-2","school_id":"OPS-SCHOOL-1","action":"Inventariação Concluída","details":{}}'::jsonb
    )
$$, 'Inventário da mesma CRE conclui o bem');
select is((select status from public.assets where id = 'OPS-ASSET-1'), 'Inventariada', 'status patrimonial foi atualizado');
select is((select row_version from public.assets where id = 'OPS-ASSET-1'), 2, 'inventariação eleva a versão do bem');

-- Administração global e redistribuição.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000942', true);
select lives_ok($$
    select public.save_program_with_log(
        '{"id":"OPS_PROGRAM","name":"Programa Atômico","description":"Teste","active":true}'::jsonb,
        null,
        '{"id":"OPS-LOG-PROGRAM-1","action":"Programa Cadastrado","details":{}}'::jsonb
    )
$$, 'programa e log são criados atomicamente');
select lives_ok($$
    select public.save_program_with_log(
        '{"id":"OPS_PROGRAM","name":"Programa Atômico","description":"Histórico preservado","active":false}'::jsonb,
        1,
        '{"id":"OPS-LOG-PROGRAM-2","action":"Programa Desativado","details":{}}'::jsonb
    )
$$, 'programa é desativado com versão esperada');
select is((select row_version from public.programs where id = 'OPS_PROGRAM'), 2, 'programa chegou à versão 2');
select is((select active from public.programs where id = 'OPS_PROGRAM'), false, 'programa desativado não foi apagado');
select lives_ok($$
    select public.save_calendar_with_log(
        jsonb_build_object(
            'id', 'global',
            'exercises', jsonb_build_array('2026', '2034'),
            'closing_competence', '2034-02',
            'bonus_deadline_extended', '2034-09-30',
            'settings', jsonb_build_object('prazoBonificacaoProrrogado', true)
        ),
        (select row_version from public.app_config where id = 'global'),
        '{"id":"OPS-LOG-CALENDAR","action":"Calendário Alterado","details":{}}'::jsonb
    )
$$, 'calendário e log são atualizados atomicamente');
select is((select closing_competence from public.app_config where id = 'global'), '2034-02', 'competência de fechamento foi alterada');
select lives_ok($$
    select public.assign_controller_with_log(
        '[{"id":"OPS-SCHOOL-1","controller_id":"OPS-CTRL-2","expected_version":1},{"id":"OPS-SCHOOL-2","controller_id":"OPS-CTRL-2","expected_version":1}]'::jsonb,
        '{"id":"OPS-LOG-ASSIGN","action":"Carteira Redistribuída","details":{}}'::jsonb
    )
$$, 'duas escolas são redistribuídas na mesma transação');
select is((select count(*)::integer from public.schools where id in ('OPS-SCHOOL-1','OPS-SCHOOL-2') and controller_id = 'OPS-CTRL-2'), 2, 'todas as escolas receberam o controlador de destino');
select is((select min(row_version) from public.schools where id in ('OPS-SCHOOL-1','OPS-SCHOOL-2')), 2, 'redistribuição atualizou as versões das escolas');

-- RPCs preexistentes agora exigem log correlacionado.
select throws_ok($$
    select public.save_exercise_with_competences(
        jsonb_build_object('id','global','exercises',jsonb_build_array('2026','2035'),'closing_competence','2034-02','settings','{}'::jsonb),
        (select jsonb_agg(jsonb_build_object('id', format('2035-%s', lpad(month::text,2,'0')), 'label', format('Mês %s',month), 'exercise',2035)) from generate_series(1,12) month),
        null
    )
$$, 'P0001', 'VALIDATION_ERROR: log administrativo obrigatório e inválido', 'criação de exercício recusa log ausente');
select throws_ok($$
    select public.save_school_with_programs(
        (select to_jsonb(s) from public.schools s where id='OPS-SCHOOL-2'),
        '[]'::jsonb,
        2,
        null
    )
$$, 'P0001', 'VALIDATION_ERROR: log administrativo obrigatório e inválido', 'gravação de escola recusa log ausente');
select is((select count(*)::integer from public.administrative_logs where id like 'OPS-LOG-%'), 9, 'quantidade final de logs corresponde aos comandos confirmados');

select * from finish();
rollback;
