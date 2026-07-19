begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(22);

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

insert into auth.users (id, email) values
('00000000-0000-0000-0000-000000000901', 'assistant-team@example.test'),
('00000000-0000-0000-0000-000000000902', 'controller-team@example.test'),
('00000000-0000-0000-0000-000000000903', 'inventory-team@example.test');
insert into public.user_profiles (user_id, profile_id, cre_scope)
values ('00000000-0000-0000-0000-000000000901', 'federal_assistant', '4ª CRE');

insert into public.controllers (id, name, email) values
('CTRL-TEAM-A', 'Controlador A', 'a@example.test'),
('CTRL-TEAM-B', 'Controlador B', 'b@example.test');
insert into public.inventory_team_members (id, name, email) values
('INV-TEAM-A', 'Inventário A', 'inva@example.test'),
('INV-TEAM-B', 'Inventário B', 'invb@example.test');
insert into public.competences (id, label, exercise)
values ('2031-01', 'Janeiro de 2031', 2031);
insert into public.schools (id, designation, denomination, cre, controller_id, initial_competence)
values ('TEAM-SCHOOL', '04.31.901', 'Escola Gestão de Equipe', '4ª CRE', 'CTRL-TEAM-A', '2031-01');

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
reset role;

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
reset role;

select is((select user_id from public.inventory_team_members where id = 'INV-TEAM-C'),
    '00000000-0000-0000-0000-000000000903'::uuid,
    'integrante do Inventário é vinculado ao Auth');
select is((select profile_id from public.user_profiles where user_id = '00000000-0000-0000-0000-000000000903' and active),
    'inventory',
    'perfil inventory é criado e ativado');

set local role service_role;
select lives_ok($$
    select public.deactivate_controller_account(
        'CTRL-TEAM-A',
        'CTRL-TEAM-B',
        '00000000-0000-0000-0000-000000000901',
        '{"id":"log-team-controller-off","action":"Gestão de Equipe","details":{"effect":"deactivate"}}'::jsonb
    )
$$, 'desativação de controlador redistribui carteira atomicamente');
reset role;

select is((select controller_id from public.schools where id = 'TEAM-SCHOOL'),
    'CTRL-TEAM-B',
    'escola é transferida para o substituto escolhido');
select is((select active from public.controllers where id = 'CTRL-TEAM-A'),
    false,
    'controlador é desativado logicamente');
select is((select count(*)::integer from public.administrative_logs where id = 'log-team-controller-off'),
    1,
    'desativação do controlador é auditada');

set local role service_role;
select lives_ok($$
    select public.deactivate_inventory_member_account(
        'INV-TEAM-A',
        '00000000-0000-0000-0000-000000000901',
        '{"id":"log-team-inventory-off","action":"Gestão de Equipe","details":{"effect":"deactivate"}}'::jsonb
    )
$$, 'desativação de Inventário preserva o histórico');
reset role;

select is((select active from public.inventory_team_members where id = 'INV-TEAM-A'),
    false,
    'integrante do Inventário é desativado logicamente');
select is((select count(*)::integer from public.administrative_logs where id = 'log-team-inventory-off'),
    1,
    'desativação do Inventário é auditada');

select is(
    (select with_check from pg_policies where schemaname = 'public' and tablename = 'controllers' and policyname = 'controllers_insert'),
    '(current_app_role() = ANY (ARRAY[''technical_admin''::text, ''federal_assistant''::text]))',
    'RLS de controlador atribui escrita à Assistente e ao papel técnico'
);
select unlike(
    (select with_check from pg_policies where schemaname = 'public' and tablename = 'controllers' and policyname = 'controllers_insert'),
    '%sme_management%',
    'Gestão SME não mantém controladores'
);
select is(
    (select with_check from pg_policies where schemaname = 'public' and tablename = 'inventory_team_members' and policyname = 'inventory_members_insert'),
    '(current_app_role() = ANY (ARRAY[''technical_admin''::text, ''federal_assistant''::text]))',
    'RLS de Inventário atribui escrita à Assistente e ao papel técnico'
);
select unlike(
    (select with_check from pg_policies where schemaname = 'public' and tablename = 'inventory_team_members' and policyname = 'inventory_members_insert'),
    '%sme_management%',
    'Gestão SME não mantém o diretório de Inventário'
);

select * from finish();
rollback;
