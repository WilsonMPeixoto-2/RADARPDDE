begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(4);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000194', 'pendency-availability-controller@example.test');

insert into public.controllers (id, name, email, user_id)
values (
    'PEND-AVAIL-CTRL',
    'Controlador Disponibilização',
    'pendency-availability-controller@example.test',
    '00000000-0000-0000-0000-000000000194'
);

insert into public.user_profiles (user_id, profile_id, controller_id, cre_scope)
values (
    '00000000-0000-0000-0000-000000000194',
    'controller',
    'PEND-AVAIL-CTRL',
    '4ª CRE'
);

insert into public.competences (id, label, exercise)
values ('2040-03', 'Março 2040', 2040);

insert into public.programs (id, name)
values ('PEND_AVAIL_BASIC', 'Programa teste disponibilização');

insert into public.schools (
    id, designation, denomination, cre, initial_competence, controller_id,
    inep, cnpj, sici
) values (
    'PEND-AVAIL-SCHOOL', '04.99.194', 'Escola teste disponibilização', '4ª CRE',
    '2040-03', 'PEND-AVAIL-CTRL', '33990194', '90.019.400/0001-94', 'SICI-PEND-AVAIL'
);

insert into public.verifications (
    id, school_id, competence_id, program_id, bonification, analysis, payload
) values (
    'PEND-AVAIL-SCHOOL::2040-03::PEND_AVAIL_BASIC',
    'PEND-AVAIL-SCHOOL',
    '2040-03',
    'PEND_AVAIL_BASIC',
    '{"extCC":"Sim"}'::jsonb,
    '{"extCC":"Incorreto"}'::jsonb,
    '{}'::jsonb
);

insert into public.pendencies (
    id, school_id, competence_origin, program_id, document_key, status,
    responsible_area, next_actor, reason, notes, opened_at, payload
) values (
    'PEND-AVAIL-1',
    'PEND-AVAIL-SCHOOL',
    '2040-03',
    'PEND_AVAIL_BASIC',
    'extCC',
    'Aberta',
    'Escola',
    'Escola',
    'Documento incorreto',
    'Aguardando novo envio',
    '2040-03-10T12:00:00Z',
    '{}'::jsonb
);

select has_column(
    'public',
    'pendency_attempts',
    'available_at',
    'tentativa possui data canônica de disponibilização separada do registro'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000194', true);

select lives_ok($$
    select public.save_pendency_command(
        'register_attempt',
        '{"id":"PEND-AVAIL-1","school_id":"PEND-AVAIL-SCHOOL","competence_origin":"2040-03","program_id":"PEND_AVAIL_BASIC","document_key":"extCC","status":"Aguardando reanálise","responsible_area":"Controlador","next_actor":"Controlador","reason":"Documento incorreto","notes":"Novo arquivo recebido","opened_at":"2040-03-10T12:00:00Z","resolved_at":null,"canceled_at":null,"payload":{}}'::jsonb,
        1,
        '{"id":"PEND-AVAIL-ATTEMPT-1","pendency_id":"PEND-AVAIL-1","attempt_number":1,"available_at":"2040-03-20T00:00:00Z","submitted_at":"2040-03-22T18:45:00Z","analyzed_at":null,"result":null,"observation":"Arquivo disponibilizado antes do lançamento no RADAR.","drive_url":"https://drive.example.test/documento","errors":[],"payload":{"dataDisponibilizacao":"2040-03-20"}}'::jsonb,
        '{"id":"PEND-AVAIL-SCHOOL::2040-03::PEND_AVAIL_BASIC","school_id":"PEND-AVAIL-SCHOOL","competence_id":"2040-03","program_id":"PEND_AVAIL_BASIC","bonification":{"extCC":"Sim"},"analysis":{"extCC":"Não analisado"},"payload":{}}'::jsonb,
        1,
        '{"id":"PEND-AVAIL-LOG-1","school_id":"PEND-AVAIL-SCHOOL","action":"Novo envio registrado","details":{"availabilityDate":"2040-03-20"}}'::jsonb
    )
$$, 'RPC registra nova tentativa com datas de disponibilização e lançamento distintas');

set local role postgres;
select is(
    (select available_at::text from public.pendency_attempts where id = 'PEND-AVAIL-ATTEMPT-1'),
    '2040-03-20 00:00:00+00',
    'data de disponibilização é persistida sem virar a data de lançamento'
);

select is(
    (select submitted_at::text from public.pendency_attempts where id = 'PEND-AVAIL-ATTEMPT-1'),
    '2040-03-22 18:45:00+00',
    'data de lançamento no RADAR permanece independente'
);

select * from finish();
rollback;
