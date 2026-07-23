begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(16);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000808', 'ops@example.test');
insert into public.user_profiles (user_id, profile_id) values ('00000000-0000-0000-0000-000000000808', 'technical_admin');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000808', true);

select lives_ok($$
    select public.save_exercise_with_competences(
        '{"id":"global","exercises":["2030"],"closing_competence":"2030-01","settings":{}}'::jsonb,
        (select jsonb_agg(jsonb_build_object('id', format('2030-%s', lpad(month::text, 2, '0')), 'label', month::text, 'exercise', 2030)) from generate_series(1,12) month),
        '{"id":"log-exercise","action":"Exercício Criado","details":{"year":2030}}'::jsonb
    )
$$, 'exercício e doze competências são gravados atomicamente');
select is((select count(*)::integer from public.competences where exercise = 2030), 12, 'doze competências criadas');
select is((select closing_competence from public.app_config where id='global'), '2030-01', 'configuração atualizada');
select is((select count(*)::integer from public.administrative_logs where id='log-exercise'), 1, 'log do exercício criado');

insert into public.controllers (id, name) values ('CTRL-OPS', 'Controlador RPC');
insert into public.programs (id, name) values ('OPS_BASIC', 'Programa RPC');
select lives_ok($$
    select public.save_school_with_programs(
        '{"id":"OPS-SCHOOL","designation":"04.99.808","denomination":"Escola Operações","cre":"4ª CRE","controller_id":"CTRL-OPS","initial_competence":"2030-01","active":true}'::jsonb,
        '[{"id":"OPS-SCHOOL::OPS_BASIC","school_id":"OPS-SCHOOL","program_id":"OPS_BASIC","active":true}]'::jsonb,
        null,
        '{"id":"log-school","school_id":"OPS-SCHOOL","action":"Escola Cadastrada","details":{}}'::jsonb
    )
$$, 'escola e programas são gravados atomicamente');
select is((select count(*)::integer from public.schools where id='OPS-SCHOOL'), 1, 'escola criada');
select is((select count(*)::integer from public.school_programs where school_id='OPS-SCHOOL' and active), 1, 'programa vinculado');

insert into public.verifications (id, school_id, competence_id, program_id, bonification, analysis)
values ('OPS-V', 'OPS-SCHOOL', '2030-01', 'OPS_BASIC', '{}', '{"ata":"Não analisado"}');
insert into public.pendencies (id, school_id, competence_origin, program_id, document_key, status, payload)
values ('OPS-P', 'OPS-SCHOOL', '2030-01', 'OPS_BASIC', 'ata', 'Aguardando reanálise', '{}');

select lives_ok($$
    select public.reanalyze_pendency_with_verification(
        '{"id":"OPS-P","status":"Resolvida","notes":"Regularizada","payload":{"status":"Resolvida"}}'::jsonb,
        '{"id":"OPS-A","pendency_id":"OPS-P","attempt_number":1,"result":"correto","errors":[],"payload":{"numero":1}}'::jsonb,
        '{"id":"OPS-V","analysis":{"ata":"Correto"},"payload":{}}'::jsonb,
        1, 1,
        '{"id":"log-reanalysis","school_id":"OPS-SCHOOL","action":"Reanálise registrada","details":{}}'::jsonb
    )
$$, 'reanálise atualiza pendência, tentativa e verificação na mesma transação');
select is((select status from public.pendencies where id='OPS-P'), 'Resolvida', 'pendência resolvida');
select is((select result from public.pendency_attempts where id='OPS-A'), 'correto', 'tentativa registrada');
select is((select analysis->>'ata' from public.verifications where id='OPS-V'), 'Correto', 'verificação atualizada');
select is((select count(*)::integer from public.administrative_logs where id='log-reanalysis'), 1, 'log da reanálise criado');

select throws_ok($$
    select public.reanalyze_pendency_with_verification(
        '{"id":"OPS-P","status":"Resolvida","payload":{}}'::jsonb,
        null,
        '{"id":"OPS-V","analysis":{},"payload":{}}'::jsonb,
        1, 2, null
    )
$$, 'P0001', 'OPTIMISTIC_CONFLICT: pendencies/OPS-P', 'versão obsoleta é rejeitada');
select ok(to_regprocedure('public.save_exercise_with_competences(jsonb,jsonb,jsonb)') is not null, 'RPC de exercício existe');
select ok(to_regprocedure('public.save_school_with_programs(jsonb,jsonb,integer,jsonb)') is not null, 'RPC de escola existe');
select ok(to_regprocedure('public.reanalyze_pendency_with_verification(jsonb,jsonb,jsonb,integer,integer,jsonb)') is not null, 'RPC de reanálise existe');
select * from finish();
rollback;
