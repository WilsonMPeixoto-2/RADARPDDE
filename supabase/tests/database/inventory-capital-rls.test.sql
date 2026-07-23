begin;
set local role postgres;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(12);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000091', 'inventory-capital@example.test');

insert into public.inventory_team_members (id, name, email)
values ('inventory-capital-test', 'Inventário Capital Teste', 'inventory-capital@example.test');

insert into public.user_profiles (
    user_id,
    profile_id,
    inventory_member_id,
    cre_scope
) values (
    '00000000-0000-0000-0000-000000000091',
    'inventory',
    'inventory-capital-test',
    '4ª CRE'
);

insert into public.competences (id, label, exercise)
values ('2099-01', 'Janeiro de 2099', 2099);

insert into public.programs (id, name)
values ('INV-CAPITAL-TEST', 'Programa patrimonial de teste');

insert into public.schools (
    id,
    designation,
    denomination,
    cre,
    initial_competence,
    inventory_process
) values
(
    '04.INV.001',
    '04.INV.001',
    'Escola patrimonial com bem',
    '4ª CRE',
    '2099-01',
    'PROC-INV-001'
),
(
    '04.INV.002',
    '04.INV.002',
    'Escola patrimonial ainda sem bem',
    '4ª CRE',
    '2099-01',
    'PROC-INV-002'
),
(
    '05.INV.001',
    '05.INV.001',
    'Escola patrimonial de outra CRE',
    '5ª CRE',
    '2099-01',
    'PROC-INV-003'
);

insert into public.school_programs (id, school_id, program_id)
values
    ('04.INV.001::INV-CAPITAL-TEST', '04.INV.001', 'INV-CAPITAL-TEST'),
    ('04.INV.002::INV-CAPITAL-TEST', '04.INV.002', 'INV-CAPITAL-TEST'),
    ('05.INV.001::INV-CAPITAL-TEST', '05.INV.001', 'INV-CAPITAL-TEST');

insert into public.assets (
    id,
    school_id,
    competence_id,
    description,
    expense_type,
    invoice_number,
    amount,
    status,
    notes
) values
(
    'asset-inventory-same-cre',
    '04.INV.001',
    '2099-01',
    'Bem da própria CRE',
    'permanente',
    'NF-INV-001',
    100,
    'Encaminhada',
    ''
),
(
    'asset-inventory-other-cre',
    '05.INV.001',
    '2099-01',
    'Bem de outra CRE',
    'permanente',
    'NF-INV-002',
    200,
    'Encaminhada',
    ''
);

set local role authenticated;
select set_config(
    'request.jwt.claim.sub',
    '00000000-0000-0000-0000-000000000091',
    true
);

select is(public.current_app_role(), 'inventory', 'perfil Inventário é resolvido');
select is((select count(*) from public.schools where id like '%.INV.%'), 2::bigint, 'Inventário lê todas as escolas da própria CRE');
select is((select count(*) from public.schools where id = '04.INV.002'), 1::bigint, 'escola sem bem também integra Capital e Inventário');
select is((select count(*) from public.schools where id = '05.INV.001'), 0::bigint, 'escola de outra CRE permanece bloqueada');
select is((select count(*) from public.school_programs where id like '%.INV.%'), 2::bigint, 'vínculos de programas da própria CRE são carregados');
select is((select count(*) from public.assets where id like 'asset-inventory-%'), 1::bigint, 'somente bens da própria CRE são carregados');
select is(public.can_write_school('04.INV.001'), false, 'Inventário não recebe escrita cadastral na escola');
select lives_ok(
    $$update public.assets set notes = 'Inventariado em teste' where id = 'asset-inventory-same-cre'$$,
    'Inventário atualiza bem patrimonial da própria CRE'
);
select is(
    (select notes from public.assets where id = 'asset-inventory-same-cre'),
    'Inventariado em teste',
    'alteração patrimonial autorizada foi persistida na transação'
);
select lives_ok(
    $$update public.schools set denomination = 'Alteração indevida' where id = '04.INV.001'$$,
    'tentativa de alteração cadastral é filtrada pela RLS sem erro de transporte'
);
select is(
    (select denomination from public.schools where id = '04.INV.001'),
    'Escola patrimonial com bem',
    'cadastro da escola permaneceu inalterado'
);
select ok(
    to_regprocedure('public.inventory_can_access_cre_school(text)') is null,
    'helper transitória não compõe a API pública final'
);

select * from finish();
rollback;
