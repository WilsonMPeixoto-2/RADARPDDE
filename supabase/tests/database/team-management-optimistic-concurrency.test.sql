begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(10);

insert into auth.users (id, email) values
('00000000-0000-0000-0000-000000000951', 'assistant-cas@example.test'),
('00000000-0000-0000-0000-000000000952', 'controller-cas@example.test'),
('00000000-0000-0000-0000-000000000953', 'inventory-cas@example.test');

insert into public.user_profiles (user_id, profile_id, cre_scope)
values ('00000000-0000-0000-0000-000000000951', 'federal_assistant', '4ª CRE');

insert into public.controllers (id, name, email)
values ('CTRL-CAS', 'Controlador original', 'controller-cas@example.test');
insert into public.inventory_team_members (id, name, email)
values ('INV-CAS', 'Inventário original', 'inventory-cas@example.test');

set local role service_role;
select lives_ok($$
    select public.upsert_team_member_account(
        '{"id":"CTRL-CAS","name":"Controlador vencedor","email":"controller-cas@example.test","cre_scope":"4ª CRE","row_version":1}'::jsonb,
        '00000000-0000-0000-0000-000000000952',
        'controller',
        '00000000-0000-0000-0000-000000000951',
        '{"id":"log-cas-controller-win","action":"Gestão de Equipe"}'::jsonb
    )
$$, 'primeira edição de controlador com versão corrente vence');
set local role postgres;

select is((select name from public.controllers where id = 'CTRL-CAS'),
    'Controlador vencedor', 'controlador recebe a primeira edição');
select is((select row_version from public.controllers where id = 'CTRL-CAS'),
    2, 'edição vencedora incrementa row_version');
select is((select count(*)::integer from public.administrative_logs where id = 'log-cas-controller-win'),
    1, 'edição vencedora registra exatamente um log');

set local role service_role;
select throws_like($$
    select public.upsert_team_member_account(
        '{"id":"CTRL-CAS","name":"Controlador obsoleto","email":"controller-cas@example.test","cre_scope":"4ª CRE","row_version":1}'::jsonb,
        '00000000-0000-0000-0000-000000000952',
        'controller',
        '00000000-0000-0000-0000-000000000951',
        '{"id":"log-cas-controller-stale","action":"Gestão de Equipe"}'::jsonb
    )
$$, 'OPTIMISTIC_CONFLICT:%', 'segunda edição com a mesma versão é rejeitada');
set local role postgres;

select is((select name from public.controllers where id = 'CTRL-CAS'),
    'Controlador vencedor', 'edição obsoleta não sobrescreve a vencedora');
select is((select count(*)::integer from public.administrative_logs where id = 'log-cas-controller-stale'),
    0, 'edição obsoleta não registra falso log de sucesso');

set local role service_role;
select lives_ok($$
    select public.upsert_team_member_account(
        '{"id":"INV-CAS","name":"Inventário vencedor","email":"inventory-cas@example.test","cre_scope":"4ª CRE","row_version":1}'::jsonb,
        '00000000-0000-0000-0000-000000000953',
        'inventory',
        '00000000-0000-0000-0000-000000000951',
        '{"id":"log-cas-inventory-win","action":"Gestão de Equipe"}'::jsonb
    )
$$, 'primeira edição do Inventário com versão corrente vence');
select throws_like($$
    select public.upsert_team_member_account(
        '{"id":"INV-CAS","name":"Inventário obsoleto","email":"inventory-cas@example.test","cre_scope":"4ª CRE","row_version":1}'::jsonb,
        '00000000-0000-0000-0000-000000000953',
        'inventory',
        '00000000-0000-0000-0000-000000000951',
        '{"id":"log-cas-inventory-stale","action":"Gestão de Equipe"}'::jsonb
    )
$$, 'OPTIMISTIC_CONFLICT:%', 'Inventário também rejeita edição obsoleta');
set local role postgres;

select is((select name from public.inventory_team_members where id = 'INV-CAS'),
    'Inventário vencedor', 'Inventário preserva a edição vencedora');

select * from finish();
rollback;
