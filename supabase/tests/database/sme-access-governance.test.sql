begin;
set local role postgres;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(7);

insert into auth.users (id, email) values
('00000000-0000-0000-0000-000000000961', 'sme-own@example.test'),
('00000000-0000-0000-0000-000000000962', 'sme-other@example.test'),
('00000000-0000-0000-0000-000000000963', 'sme-admin@example.test');

insert into public.user_profiles (
    user_id,
    profile_id,
    controller_id,
    inventory_member_id,
    cre_scope
) values
('00000000-0000-0000-0000-000000000961', 'sme_management', null, null, null),
('00000000-0000-0000-0000-000000000962', 'sme_management', null, null, null),
('00000000-0000-0000-0000-000000000963', 'technical_admin', null, null, null);

insert into public.administrative_logs (
    id,
    actor_user_id,
    user_identifier,
    profile_name,
    action,
    details
) values
(
    'SME-RLS-OWN',
    '00000000-0000-0000-0000-000000000961',
    'sme-own@example.test',
    'Gestão SME',
    'Registro próprio',
    '{}'::jsonb
),
(
    'SME-RLS-OTHER',
    '00000000-0000-0000-0000-000000000962',
    'sme-other@example.test',
    'Gestão SME',
    'Registro de outro login',
    '{}'::jsonb
),
(
    'SME-RLS-LEGACY',
    null,
    'registro-legado',
    'Gestão SME',
    'Registro sem UUID',
    '{}'::jsonb
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000961', true);

select is(
    (
        select count(*)::integer
        from public.administrative_logs
        where id like 'SME-RLS-%'
    ),
    1,
    'Gestão SME vê somente um registro produzido pelo próprio login'
);
select is(
    (
        select id
        from public.administrative_logs
        where id like 'SME-RLS-%'
    ),
    'SME-RLS-OWN',
    'o registro visível pertence ao auth.uid autenticado'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000962', true);
select is(
    (
        select id
        from public.administrative_logs
        where id like 'SME-RLS-%'
    ),
    'SME-RLS-OTHER',
    'a troca de login altera o registro visível sem usar nome ou e-mail'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000963', true);
select is(
    (
        select count(*)::integer
        from public.administrative_logs
        where id like 'SME-RLS-%'
    ),
    3,
    'administrador técnico mantém visão integral, inclusive do legado sem UUID'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000961', true);
select throws_ok(
    $$
        insert into public.administrative_logs (
            id,
            actor_user_id,
            action
        ) values (
            'SME-RLS-SPOOFED',
            '00000000-0000-0000-0000-000000000962',
            'Autoria indevida'
        )
    $$,
    '42501',
    null,
    'Gestão SME não pode atribuir um registro a outro UUID'
);
select lives_ok(
    $$
        insert into public.administrative_logs (
            id,
            actor_user_id,
            action
        ) values (
            'SME-RLS-OWN-INSERT',
            '00000000-0000-0000-0000-000000000961',
            'Autoria válida'
        )
    $$,
    'Gestão SME pode persistir um registro com o próprio UUID'
);
select is(
    (
        select count(*)::integer
        from public.administrative_logs
        where id like 'SME-RLS-%'
          and actor_user_id = auth.uid()
    ),
    2,
    'após a gravação, apenas os dois registros do próprio login ficam visíveis'
);

select * from finish();
rollback;
