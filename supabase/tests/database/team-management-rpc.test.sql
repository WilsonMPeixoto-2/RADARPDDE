begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(33);

select ok(
    has_function_privilege(
        'service_role',
        'public.upsert_team_member_account(jsonb,uuid,text,uuid,jsonb)',
        'EXECUTE'
    ),
    'service_role executa provisionamento de integrante'
);
select ok(
    not has_function_privilege(
        'authenticated',
        'public.upsert_team_member_account(jsonb,uuid,text,uuid,jsonb)',
        'EXECUTE'
    ),
    'authenticated não executa RPC administrativa diretamente'
);
select ok(
    not has_function_privilege(
        'anon',
        'public.upsert_team_member_account(jsonb,uuid,text,uuid,jsonb)',
        'EXECUTE'
    ),
    'anon não executa RPC administrativa'
);
select ok(
    has_function_privilege(
        'service_role',
        'public.deactivate_controller_account(text,text,uuid,jsonb)',
        'EXECUTE'
    ),
    'service_role executa desativação de controlador'
);
select ok(
    has_function_privilege(
        'service_role',
        'public.deactivate_inventory_member_account(text,uuid,jsonb)',
        'EXECUTE'
    ),
    'service_role executa desativação de Inventário'
);

select ok(
    to_regprocedure('public.resolve_team_auth_user_id_by_email(text)') is not null,
    'lookup Auth administrativo por e-mail existe'
);
select ok(
    coalesce((
        select has_function_privilege('service_role', p.oid, 'EXECUTE')
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname = 'resolve_team_auth_user_id_by_email'
          and pg_get_function_identity_arguments(p.oid) = 'p_email text'
    ), false),
    'service_role executa lookup Auth por e-mail'
);
select ok(
    not coalesce((
        select has_function_privilege('authenticated', p.oid, 'EXECUTE')
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname = 'resolve_team_auth_user_id_by_email'
          and pg_get_function_identity_arguments(p.oid) = 'p_email text'
    ), false),
    'authenticated não executa lookup Auth administrativo'
);
select ok(
    not coalesce((
        select has_function_privilege('anon', p.oid, 'EXECUTE')
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname = 'resolve_team_auth_user_id_by_email'
          and pg_get_function_identity_arguments(p.oid) = 'p_email text'
    ), false),
    'anon não executa lookup Auth administrativo'
);

insert into auth.users (id, email) values
('00000000-0000-0000-0000-000000000901', 'assistant-team@example.test'),
('00000000-0000-0000-0000-000000000902', 'controller-team@example.test'),
('00000000-0000-0000-0000-000000000903', 'inventory-team@example.test');
insert into public.user_profiles (user_id, profile_id, cre_scope)
values ('00000000-0000-0000-0000-000000000901', 'federal_assistant', '4ª CRE');

set local role service_role;
select results_eq(
    $$select public.resolve_team_auth_user_id_by_email(' CONTROLLER-TEAM@EXAMPLE.TEST ')$$,
    $$values ('00000000-0000-0000-0000-000000000902'::uuid)$$,
    'lookup normaliza e-mail e retorna somente o usuário correspondente'
);
select results_eq(
    $$select public.resolve_team_auth_user_id_by_email('missing-team@example.test')$$,
    $$values (null::uuid)$$,
    'lookup retorna nulo quando a conta Auth ainda não existe'
);
set local role postgres;

insert into public.controllers (id, name, email) values
('CTRL-TEAM-A', 'Controlador A', 'a@example.test'),
('CTRL-TEAM-B', 'Controlador B', 'b@example.test');
insert into public.inventory_team_members (id, name, email) values
('INV-TEAM-A', 'Inventário A', 'inva@example.test'),
('INV-TEAM-B', 'Inventário B', 'invb@example.test');
insert into public.competences (id, label, exercise)
values ('2031-01', 'Janeiro de 2031', 2031);
insert into public.schools (id, designation, denomination, cre, controller_id, initial_competence, inep, cnpj, sici)
values('TEAM-SCHOOL', '04.31.901', 'Escola Gestão de Equipe', '4ª CRE', 'CTRL-TEAM-A', '2031-01', '33075847', '90.075.847/0001-43', 'SICI-TEST-74E3A487298E');

set local role service_role;
select lives_ok($$
    select public.upsert_team_member_account(
        '{"id":"CTRL-TEAM-C","name":"Controlador C","email":"c@example.test","cre_scope":"4ª CRE"}'::jsonb,
        '00000000-0000-0000-0000-000000000902',
        'controller',
        '00000000-0000-0000-0000-000000000901',
        '{"id":"log-team-controller","action":"Gestão de Equipe","details":{"effect":"invite"}}'::jsonb
    )
$$, 'provisionamento de controlador é atômico');
set local role postgres;

select is((select user_id from public.controllers where id = 'CTRL-TEAM-C'),
    '00000000-0000-0000-0000-000000000902'::uuid,
    'controlador é vinculado ao usuário Auth');
select is((select profile_id from public.user_profiles where user_id = '00000000-0000-0000-0000-000000000902' and active),
    'controller',
    'perfil controller é criado e ativado');
select is((select controller_id from public.user_profiles where user_id = '00000000-0000-0000-0000-000000000902' and active),
    'CTRL-TEAM-C',
    'perfil aponta para o controlador correto');
select is((select count(*)::integer from public.administrative_logs where id = 'log-team-controller'),
    1,
    'provisionamento registra log administrativo uma vez');

set local role service_role;
select lives_ok($$
    select public.upsert_team_member_account(
        '{"id":"INV-TEAM-C","name":"Inventário C","email":"invc@example.test","cre_scope":"4ª CRE"}'::jsonb,
        '00000000-0000-0000-0000-000000000903',
        'inventory',
        '00000000-0000-0000-0000-000000000901',
        '{"id":"log-team-inventory","action":"Gestão de Equipe","details":{"effect":"invite"}}'::jsonb
    )
$$, 'provisionamento de integrante do Inventário é atômico');
set local role postgres;

select is((select user_id from public.inventory_team_members where id = 'INV-TEAM-C'),
    '00000000-0000-0000-0000-000000000903'::uuid,
    'integrante do Inventário é vinculado ao Auth');
select is((select profile_id from public.user_profiles where user_id = '00000000-0000-0000-0000-000000000903' and active),
    'inventory',
    'perfil inventory é criado e ativado');

set local role service_role;
select throws_like($$
    select public.deactivate_controller_account(
        'CTRL-TEAM-A',
        'CTRL-TEAM-B',
        '00000000-0000-0000-0000-000000000901',
        '{"id":"log-team-controller-off","action":"Gestão de Equipe","details":{"effect":"deactivate"}}'::jsonb
    )
$$, 'VALIDATION_ERROR:%', 'desativação é recusada enquanto o controlador ainda possui escolas');
set local role postgres;

select is((select controller_id from public.schools where id = 'TEAM-SCHOOL'),
    'CTRL-TEAM-A',
    'desativação recusada não transfere a escola automaticamente');
select is((select active from public.controllers where id = 'CTRL-TEAM-A'),
    true,
    'controlador com carteira permanece ativo');
select is((select count(*)::integer from public.administrative_logs where id = 'log-team-controller-off'),
    0,
    'desativação recusada não registra log de conclusão');

set local role service_role;
select lives_ok($$
    select public.deactivate_controller_account(
        'CTRL-TEAM-C',
        null,
        '00000000-0000-0000-0000-000000000901',
        '{"id":"log-team-controller-empty-off","action":"Gestão de Equipe","details":{"effect":"deactivate_without_reassignment"}}'::jsonb
    )
$$, 'controlador sem escolas é desativado sem exigir substituto');
set local role postgres;

select is((select active from public.controllers where id = 'CTRL-TEAM-C'),
    false,
    'controlador sem carteira deixa de integrar o diretório ativo');
select is((select count(*)::integer from public.administrative_logs where id = 'log-team-controller-empty-off'),
    1,
    'desativação sem redistribuição também é auditada');

set local role service_role;
select lives_ok($$
    select public.deactivate_inventory_member_account(
        'INV-TEAM-A',
        '00000000-0000-0000-0000-000000000901',
        '{"id":"log-team-inventory-off","action":"Gestão de Equipe","details":{"effect":"deactivate"}}'::jsonb
    )
$$, 'desativação de Inventário preserva o histórico');
set local role postgres;

select is((select active from public.inventory_team_members where id = 'INV-TEAM-A'),
    false,
    'integrante do Inventário é desativado logicamente');
select is((select count(*)::integer from public.administrative_logs where id = 'log-team-inventory-off'),
    1,
    'desativação do Inventário é auditada');

select ok(
    (select with_check from pg_policies where schemaname = 'public' and tablename = 'controllers' and policyname = 'controllers_insert')
        like '%technical_admin%federal_assistant%',
    'RLS de controlador atribui escrita à Assistente e ao papel técnico'
);
select ok(
    (select with_check from pg_policies where schemaname = 'public' and tablename = 'controllers' and policyname = 'controllers_insert')
        not like '%sme_management%',
    'Gestão SME não mantém controladores'
);
select ok(
    (select with_check from pg_policies where schemaname = 'public' and tablename = 'inventory_team_members' and policyname = 'inventory_members_insert')
        like '%technical_admin%federal_assistant%',
    'RLS de Inventário atribui escrita à Assistente e ao papel técnico'
);
select ok(
    (select with_check from pg_policies where schemaname = 'public' and tablename = 'inventory_team_members' and policyname = 'inventory_members_insert')
        not like '%sme_management%',
    'Gestão SME não mantém o diretório de Inventário'
);

select * from finish();
rollback;