begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(8);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000981', 'atomic-pendency-controller@example.test');

insert into public.controllers (id, name, email, user_id)
values (
    'ATOMIC-PEND-CTRL',
    'Controlador Pendência Atômica',
    'atomic-pendency-controller@example.test',
    '00000000-0000-0000-0000-000000000981'
);

insert into public.user_profiles (user_id, profile_id, controller_id, cre_scope)
values (
    '00000000-0000-0000-0000-000000000981',
    'controller',
    'ATOMIC-PEND-CTRL',
    '4ª CRE'
);

insert into public.competences (id, label, exercise)
values ('2038-01', 'Janeiro 2038', 2038);

insert into public.programs (id, name)
values ('ATOMIC_PEND_BASIC', 'Programa Pendência Atômica');

insert into public.schools (
    id, designation, denomination, cre, initial_competence, controller_id,
    inep, cnpj, sici
) values (
    'ATOMIC-PEND-SCHOOL', '04.99.981', 'Escola Pendência Atômica', '4ª CRE',
    '2038-01', 'ATOMIC-PEND-CTRL', '33981981', '98.981.981/0001-81', 'SICI-ATOMIC-981'
);

insert into public.verifications (
    id, school_id, competence_id, program_id, bonification, analysis, bonus_result, payload
) values (
    'ATOMIC-PEND-SCHOOL::2038-01::ATOMIC_PEND_BASIC',
    'ATOMIC-PEND-SCHOOL',
    '2038-01',
    'ATOMIC_PEND_BASIC',
    '{"extCC":"Sim","extINV":"Sim"}'::jsonb,
    '{"extCC":"Não analisado","extINV":"Não analisado"}'::jsonb,
    'apta',
    '{}'::jsonb
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000981', true);

select lives_ok($$
    select public.save_pendency_command(
        'open',
        '{"id":"ATOMIC-PEND-1","school_id":"ATOMIC-PEND-SCHOOL","competence_origin":"2038-01","program_id":"ATOMIC_PEND_BASIC","document_key":"extCC","status":"Aberta","responsible_area":"Escola","next_actor":"Escola","reason":"Documento incorreto","notes":"Abertura vinculada à análise","opened_at":"2038-01-10T12:00:00Z","resolved_at":null,"canceled_at":null,"payload":{}}'::jsonb,
        null,
        null,
        '{"id":"ATOMIC-PEND-SCHOOL::2038-01::ATOMIC_PEND_BASIC","school_id":"ATOMIC-PEND-SCHOOL","competence_id":"2038-01","program_id":"ATOMIC_PEND_BASIC","bonification":{"extCC":"Sim","extINV":"Sim"},"analysis":{"extCC":"Incorreto","extINV":"Não analisado"},"bonus_result":"apta","payload":{}}'::jsonb,
        1,
        '{"id":"ATOMIC-PEND-LOG-1","school_id":"ATOMIC-PEND-SCHOOL","action":"Análise incorreta e pendência aberta","details":{"documentKey":"extCC"}}'::jsonb
    )
$$, 'abertura e análise incorreta são persistidas em uma única transação');

select is(
    (select status from public.pendencies where id = 'ATOMIC-PEND-1'),
    'Aberta',
    'pendência documental foi criada'
);
select is(
    (select analysis ->> 'extCC' from public.verifications where id = 'ATOMIC-PEND-SCHOOL::2038-01::ATOMIC_PEND_BASIC'),
    'Incorreto',
    'análise técnica foi alterada no mesmo comando'
);
select is(
    (select bonification ->> 'extCC' from public.verifications where id = 'ATOMIC-PEND-SCHOOL::2038-01::ATOMIC_PEND_BASIC'),
    'Sim',
    'bonificação original foi preservada'
);
select is(
    (select bonus_result from public.verifications where id = 'ATOMIC-PEND-SCHOOL::2038-01::ATOMIC_PEND_BASIC'),
    'apta',
    'consolidação da bonificação foi preservada'
);
select is(
    (select actor_user_id::text from public.administrative_logs where id = 'ATOMIC-PEND-LOG-1'),
    '00000000-0000-0000-0000-000000000981',
    'log atômico preserva autoria autenticada'
);

select throws_ok($$
    select public.save_pendency_command(
        'open',
        '{"id":"ATOMIC-PEND-ROLLBACK","school_id":"ATOMIC-PEND-SCHOOL","competence_origin":"2038-01","program_id":"ATOMIC_PEND_BASIC","document_key":"extINV","status":"Aberta","responsible_area":"Escola","next_actor":"Escola","reason":"Deve reverter","notes":"Versão obsoleta","opened_at":"2038-01-10T13:00:00Z","resolved_at":null,"canceled_at":null,"payload":{}}'::jsonb,
        null,
        null,
        '{"id":"ATOMIC-PEND-SCHOOL::2038-01::ATOMIC_PEND_BASIC","school_id":"ATOMIC-PEND-SCHOOL","competence_id":"2038-01","program_id":"ATOMIC_PEND_BASIC","bonification":{"extCC":"Sim","extINV":"Sim"},"analysis":{"extCC":"Incorreto","extINV":"Incorreto"},"bonus_result":"apta","payload":{}}'::jsonb,
        1,
        '{"id":"ATOMIC-PEND-LOG-ROLLBACK","school_id":"ATOMIC-PEND-SCHOOL","action":"Não deve persistir","details":{}}'::jsonb
    )
$$, 'P0001', null, 'conflito otimista da verificação aborta toda a abertura');

select is(
    (select count(*)::integer from public.pendencies where id = 'ATOMIC-PEND-ROLLBACK'),
    0,
    'nenhuma pendência parcial permanece após conflito da verificação'
);

select * from finish();
rollback;
