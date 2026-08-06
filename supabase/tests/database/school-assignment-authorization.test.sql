begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(3);

insert into auth.users (id, email) values
('00000000-0000-0000-0000-000000000951', 'school-auth-controller@example.test'),
('00000000-0000-0000-0000-000000000952', 'school-auth-assistant@example.test');

insert into public.controllers (id, name, email, user_id) values
('SCHOOL-AUTH-CTRL-1', 'Controlador Atual', 'school-auth-controller@example.test', '00000000-0000-0000-0000-000000000951'),
('SCHOOL-AUTH-CTRL-2', 'Controlador Destino', 'school-auth-destination@example.test', null);

insert into public.user_profiles (user_id, profile_id, controller_id, cre_scope) values
('00000000-0000-0000-0000-000000000951', 'controller', 'SCHOOL-AUTH-CTRL-1', '4ª CRE'),
('00000000-0000-0000-0000-000000000952', 'federal_assistant', null, '4ª CRE');

insert into public.schools (
    id, designation, denomination, phone, institutional_mobile, email,
    director_name, director_phone, deputy_director_name, deputy_director_phone,
    inep, cnpj, cre, ra, sici, controller_id, inventory_process,
    initial_competence, active
) values (
    'SCHOOL-AUTH-1', '04.99.951', 'Escola Autorização', '', '',
    'school-auth@example.test', 'Direção', '', '', '', '33999951',
    '00.000.000/0951-00', '4ª CRE', '99ª R.A.', '99951',
    'SCHOOL-AUTH-CTRL-1', '', '2026-05', true
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000951', true);

select throws_like($$
    select public.save_school_with_programs(
        jsonb_build_object(
            'id', 'SCHOOL-AUTH-1',
            'designation', '04.99.951',
            'denomination', 'Escola Autorização',
            'phone', '',
            'institutional_mobile', '',
            'email', 'school-auth@example.test',
            'director_name', 'Direção Atualizada',
            'director_phone', '',
            'deputy_director_name', '',
            'deputy_director_phone', '',
            'inep', '33999951',
            'cnpj', '00.000.000/0951-00',
            'cre', '4ª CRE',
            'ra', '99ª R.A.',
            'sici', '99951',
            'controller_id', 'SCHOOL-AUTH-CTRL-2',
            'inventory_process', '',
            'initial_competence', '2026-05',
            'active', true
        ),
        '[]'::jsonb,
        1,
        '{"id":"SCHOOL-AUTH-LOG-1","school_id":"SCHOOL-AUTH-1","action":"Escola Atualizada","details":{}}'::jsonb
    )
$$, '%AUTHORIZATION_DENIED%controlador%', 'Controlador não altera a própria carteira pela edição cadastral');

select is(
    (select controller_id from public.schools where id = 'SCHOOL-AUTH-1'),
    'SCHOOL-AUTH-CTRL-1',
    'tentativa negada preserva o controlador atual'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000952', true);

select lives_ok($$
    select public.save_school_with_programs(
        jsonb_build_object(
            'id', 'SCHOOL-AUTH-1',
            'designation', '04.99.951',
            'denomination', 'Escola Autorização',
            'phone', '',
            'institutional_mobile', '',
            'email', 'school-auth@example.test',
            'director_name', 'Direção Atualizada',
            'director_phone', '',
            'deputy_director_name', '',
            'deputy_director_phone', '',
            'inep', '33999951',
            'cnpj', '00.000.000/0951-00',
            'cre', '4ª CRE',
            'ra', '99ª R.A.',
            'sici', '99951',
            'controller_id', 'SCHOOL-AUTH-CTRL-2',
            'inventory_process', '',
            'initial_competence', '2026-05',
            'active', true
        ),
        '[]'::jsonb,
        1,
        '{"id":"SCHOOL-AUTH-LOG-2","school_id":"SCHOOL-AUTH-1","action":"Escola Atualizada","details":{}}'::jsonb
    )
$$, 'Assistente mantém a redistribuição autorizada');

select * from finish();
rollback;
