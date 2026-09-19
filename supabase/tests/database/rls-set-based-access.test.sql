begin;
set local role postgres;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(26);

insert into auth.users (id, email) values
('00000000-0000-0000-0000-000000000971', 'rls-set-admin@example.test'),
('00000000-0000-0000-0000-000000000972', 'rls-set-assistant@example.test'),
('00000000-0000-0000-0000-000000000973', 'rls-set-sme@example.test'),
('00000000-0000-0000-0000-000000000974', 'rls-set-controller@example.test'),
('00000000-0000-0000-0000-000000000975', 'rls-set-inventory@example.test');

insert into public.controllers (id, name, email, user_id)
values (
    'RLSSET-CTRL',
    'Controlador RLS Set',
    'rls-set-controller@example.test',
    '00000000-0000-0000-0000-000000000974'
);

insert into public.inventory_team_members (id, name, email, user_id)
values (
    'RLSSET-INV',
    'Inventário RLS Set',
    'rls-set-inventory@example.test',
    '00000000-0000-0000-0000-000000000975'
);

insert into public.user_profiles (
    user_id,
    profile_id,
    controller_id,
    inventory_member_id,
    cre_scope
) values
('00000000-0000-0000-0000-000000000971', 'technical_admin', null, null, null),
('00000000-0000-0000-0000-000000000972', 'federal_assistant', null, null, null),
('00000000-0000-0000-0000-000000000973', 'sme_management', null, null, null),
('00000000-0000-0000-0000-000000000974', 'controller', 'RLSSET-CTRL', null, '4ª CRE'),
('00000000-0000-0000-0000-000000000975', 'inventory', null, 'RLSSET-INV', '4ª CRE');

insert into public.competences (id, label, exercise)
values ('2099-11', 'Novembro de 2099', 2099);

insert into public.schools (
    id, designation, denomination, cre, initial_competence, inep, cnpj, sici
) values
('RLSSET-4-A', '04.99.971', 'RLS Set 4 A', '4ª CRE', '2099-11', '33999971', '91.000.000/0971-00', 'RLSSET971'),
('RLSSET-4-B', '04.99.972', 'RLS Set 4 B', '4ª CRE', '2099-11', '33999972', '91.000.000/0972-00', 'RLSSET972'),
('RLSSET-5-A', '05.99.973', 'RLS Set 5 A', '5ª CRE', '2099-11', '33999973', '91.000.000/0973-00', 'RLSSET973'),
('RLSSET-6-R', '06.99.974', 'RLS Set 6 Read', '6ª CRE', '2099-11', '33999974', '91.000.000/0974-00', 'RLSSET974'),
('RLSSET-6-W', '06.99.975', 'RLS Set 6 Write', '6ª CRE', '2099-11', '33999975', '91.000.000/0975-00', 'RLSSET975');

insert into public.assets (
    id, school_id, competence_id, description, expense_type,
    invoice_number, amount, status, notes
) values (
    'RLSSET-ASSET-4-A',
    'RLSSET-4-A',
    '2099-11',
    'Bem que ativa a semântica histórica de can_access_school do Inventário',
    'permanente',
    'RLSSET-NF-1',
    10,
    'Encaminhada',
    ''
);

insert into public.user_school_scopes (user_id, school_id, can_write) values
('00000000-0000-0000-0000-000000000973', 'RLSSET-6-W', true),
('00000000-0000-0000-0000-000000000974', 'RLSSET-6-R', false),
('00000000-0000-0000-0000-000000000974', 'RLSSET-6-W', true),
('00000000-0000-0000-0000-000000000975', 'RLSSET-5-A', true);

select ok(
    to_regprocedure('radar_private.accessible_school_ids()') is not null,
    'helper privado de leitura por conjunto existe'
);
select ok(
    to_regprocedure('radar_private.writable_school_ids()') is not null,
    'helper privado de escrita por conjunto existe'
);
select ok(
    to_regprocedure('radar_private.inventory_cre_school_ids()') is not null,
    'helper privado da CRE de Inventário existe'
);
select ok(
    not has_function_privilege('anon', 'radar_private.accessible_school_ids()', 'EXECUTE'),
    'anon não executa helper privado de leitura'
);
select ok(
    has_function_privilege('authenticated', 'radar_private.accessible_school_ids()', 'EXECUTE'),
    'authenticated executa helper privado somente pelas regras RLS'
);
select is(
    (
        select count(*)::integer
        from pg_policies
        where schemaname = 'public'
          and (
            coalesce(qual, '') ilike '%can_access_school(%'
            or coalesce(qual, '') ilike '%can_write_school(%'
            or coalesce(with_check, '') ilike '%can_access_school(%'
            or coalesce(with_check, '') ilike '%can_write_school(%'
          )
    ),
    0,
    'policies não recalculam helpers booleanos escola a escola'
);
select ok(
    exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and (
            coalesce(qual, '') ilike '%accessible_school_ids%'
            or coalesce(with_check, '') ilike '%accessible_school_ids%'
          )
    ),
    'policies usam o conjunto de leitura calculado por statement'
);

set local role authenticated;

-- Administrador técnico: leitura e escrita globais.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000971', true);
select is(
    radar_private.accessible_school_ids(),
    array['RLSSET-4-A','RLSSET-4-B','RLSSET-5-A','RLSSET-6-R','RLSSET-6-W']::text[],
    'Administrador técnico preserva leitura global'
);
select is(
    radar_private.writable_school_ids(),
    array['RLSSET-4-A','RLSSET-4-B','RLSSET-5-A','RLSSET-6-R','RLSSET-6-W']::text[],
    'Administrador técnico preserva escrita global'
);
select is(
    radar_private.inventory_cre_school_ids(),
    array[]::text[],
    'Administrador técnico não recebe exceção de Inventário'
);

-- Assistente Federal: leitura e escrita globais.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000972', true);
select is(
    radar_private.accessible_school_ids(),
    array['RLSSET-4-A','RLSSET-4-B','RLSSET-5-A','RLSSET-6-R','RLSSET-6-W']::text[],
    'Assistente Federal preserva leitura global'
);
select is(
    radar_private.writable_school_ids(),
    array['RLSSET-4-A','RLSSET-4-B','RLSSET-5-A','RLSSET-6-R','RLSSET-6-W']::text[],
    'Assistente Federal preserva escrita global'
);
select is(
    radar_private.inventory_cre_school_ids(),
    array[]::text[],
    'Assistente Federal não recebe exceção de Inventário'
);

-- Gestão SME: leitura global, escrita somente por escopo explícito.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000973', true);
select is(
    radar_private.accessible_school_ids(),
    array['RLSSET-4-A','RLSSET-4-B','RLSSET-5-A','RLSSET-6-R','RLSSET-6-W']::text[],
    'Gestão SME preserva leitura global'
);
select is(
    radar_private.writable_school_ids(),
    array['RLSSET-6-W']::text[],
    'Gestão SME preserva escrita explicitamente concedida'
);
select is(
    radar_private.inventory_cre_school_ids(),
    array[]::text[],
    'Gestão SME não recebe exceção de Inventário'
);

-- Controlador: CRE colaborativa + escopos explícitos.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000974', true);
select is(
    radar_private.accessible_school_ids(),
    array['RLSSET-4-A','RLSSET-4-B','RLSSET-6-R','RLSSET-6-W']::text[],
    'Controlador lê a própria CRE e escopos explícitos'
);
select is(
    radar_private.writable_school_ids(),
    array['RLSSET-4-A','RLSSET-4-B','RLSSET-6-W']::text[],
    'Controlador escreve na própria CRE e no escopo explícito gravável'
);
select is(
    radar_private.inventory_cre_school_ids(),
    array[]::text[],
    'Controlador não recebe exceção de Inventário'
);

-- Inventário: can_access histórico depende de bem; tela de Capital usa a CRE inteira.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000975', true);
select is(
    radar_private.accessible_school_ids(),
    array['RLSSET-4-A','RLSSET-5-A']::text[],
    'Inventário preserva leitura genérica de escola com bem e escopo explícito'
);
select is(
    radar_private.writable_school_ids(),
    array['RLSSET-5-A']::text[],
    'Inventário preserva can_write explícito genérico fora da CRE'
);
select is(
    radar_private.inventory_cre_school_ids(),
    array['RLSSET-4-A','RLSSET-4-B']::text[],
    'Inventário preserva visão completa da própria CRE para Capital e Inventário'
);
select is(
    public.can_access_school('RLSSET-4-B'),
    false,
    'wrapper histórico não transforma escola sem bem em acesso genérico do Inventário'
);
select is(
    public.can_write_school('RLSSET-5-A'),
    true,
    'wrapper histórico preserva escrita explícita genérica'
);
select throws_ok(
    $$
        insert into public.assets (
            id, school_id, competence_id, description, expense_type,
            invoice_number, amount, status, notes
        ) values (
            'RLSSET-ASSET-OUTSIDE',
            'RLSSET-5-A',
            '2099-11',
            'Bem indevido fora da CRE',
            'permanente',
            'RLSSET-NF-OUT',
            20,
            'Encaminhada',
            ''
        )
    $$,
    '42501',
    null,
    'escopo explícito genérico não libera patrimônio do Inventário fora da CRE'
);

select ok(
    to_regprocedure('public.accessible_school_ids()') is null
    and to_regprocedure('public.writable_school_ids()') is null
    and to_regprocedure('public.inventory_cre_school_ids()') is null,
    'helpers set-based não ampliam a API pública'
);

select * from finish();
rollback;
