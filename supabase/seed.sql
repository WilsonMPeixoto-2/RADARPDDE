-- Fixtures exclusivamente locais para homologação de Auth e RLS.
-- Nunca executar este arquivo em projeto remoto ou reutilizar suas credenciais.

insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
)
values
    ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'controller@radar.local', crypt('LocalOnly!Radar2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Controlador Local"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'assistant@radar.local', crypt('LocalOnly!Radar2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Assistente Local"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'inventory@radar.local', crypt('LocalOnly!Radar2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Inventário Local"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'sme@radar.local', crypt('LocalOnly!Radar2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Gestão SME Local"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '55555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'admin@radar.local', crypt('LocalOnly!Radar2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Administrador Local"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '66666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated', 'inactive@radar.local', crypt('LocalOnly!Radar2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Usuário Inativo"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '77777777-7777-4777-8777-777777777777', 'authenticated', 'authenticated', 'without-profile@radar.local', crypt('LocalOnly!Radar2026', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Usuário sem Perfil"}', now(), now(), '', '', '', '')
on conflict (id) do update set
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

insert into auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
)
values
    ('81111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', '{"sub":"11111111-1111-4111-8111-111111111111","email":"controller@radar.local"}', 'email', now(), now(), now()),
    ('82222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', '{"sub":"22222222-2222-4222-8222-222222222222","email":"assistant@radar.local"}', 'email', now(), now(), now()),
    ('83333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', '{"sub":"33333333-3333-4333-8333-333333333333","email":"inventory@radar.local"}', 'email', now(), now(), now()),
    ('84444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444', '{"sub":"44444444-4444-4444-8444-444444444444","email":"sme@radar.local"}', 'email', now(), now(), now()),
    ('85555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555', '{"sub":"55555555-5555-4555-8555-555555555555","email":"admin@radar.local"}', 'email', now(), now(), now()),
    ('86666666-6666-4666-8666-666666666666', '66666666-6666-4666-8666-666666666666', '66666666-6666-4666-8666-666666666666', '{"sub":"66666666-6666-4666-8666-666666666666","email":"inactive@radar.local"}', 'email', now(), now(), now()),
    ('87777777-7777-4777-8777-777777777777', '77777777-7777-4777-8777-777777777777', '77777777-7777-4777-8777-777777777777', '{"sub":"77777777-7777-4777-8777-777777777777","email":"without-profile@radar.local"}', 'email', now(), now(), now())
on conflict (provider_id, provider) do update set
    identity_data = excluded.identity_data,
    updated_at = now();

insert into public.competences (id, label, exercise, starts_on, ends_on, bonus_deadline)
values ('2026-05', 'Maio 2026', 2026, '2026-05-01', '2026-05-31', '2026-06-15')
on conflict (id) do nothing;

insert into public.app_config (id, exercises, closing_competence, settings)
values ('global', '[2026]', '2026-05', '{"fixture":"auth-local"}')
on conflict (id) do nothing;

insert into public.programs (id, name, description)
values ('BASIC', 'PDDE Básico', 'Programa local para testes de autorização.')
on conflict (id) do nothing;

insert into public.controllers (id, name, email, user_id)
values
    ('controller-local', 'Controlador Local', 'controller@radar.local', '11111111-1111-4111-8111-111111111111'),
    ('controller-other', 'Outro Controlador', 'other@radar.local', null)
on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    user_id = excluded.user_id;

insert into public.inventory_team_members (id, name, email, user_id)
values ('inventory-local', 'Inventário Local', 'inventory@radar.local', '33333333-3333-4333-8333-333333333333')
on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    user_id = excluded.user_id;

insert into public.schools (
    id,
    designation,
    denomination,
    cre,
    ra,
    controller_id,
    initial_competence,
    inventory_process
)
values
    ('ESC-LOCAL', '04.00.001', 'Escola Local Autorizada', '4ª CRE', '10', 'controller-local', '2026-05', 'PROC-LOCAL-1'),
    ('ESC-OTHER', '04.00.002', 'Escola Local de Outro Controlador', '4ª CRE', '11', 'controller-other', '2026-05', 'PROC-LOCAL-2')
on conflict (id) do nothing;

insert into public.school_programs (id, school_id, program_id, active, starts_on)
values
    ('ESC-LOCAL_BASIC', 'ESC-LOCAL', 'BASIC', true, '2026-01-01'),
    ('ESC-OTHER_BASIC', 'ESC-OTHER', 'BASIC', true, '2026-01-01')
on conflict (id) do nothing;

insert into public.user_profiles (
    id,
    user_id,
    profile_id,
    controller_id,
    inventory_member_id,
    cre_scope,
    active
)
values
    ('91111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'controller', 'controller-local', null, '4ª CRE', true),
    ('92222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222', 'federal_assistant', null, null, '4ª CRE', true),
    ('93333333-3333-4333-8333-333333333333', '33333333-3333-4333-8333-333333333333', 'inventory', null, 'inventory-local', '4ª CRE', true),
    ('94444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444', 'sme_management', null, null, null, true),
    ('95555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555', 'technical_admin', null, null, null, true),
    ('96666666-6666-4666-8666-666666666666', '66666666-6666-4666-8666-666666666666', 'federal_assistant', null, null, '4ª CRE', false)
on conflict (id) do update set
    profile_id = excluded.profile_id,
    controller_id = excluded.controller_id,
    inventory_member_id = excluded.inventory_member_id,
    cre_scope = excluded.cre_scope,
    active = excluded.active;

insert into public.user_school_scopes (id, user_id, school_id, can_write)
values
    ('a1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111', 'ESC-OTHER', false),
    ('a3333333-3333-4333-8333-333333333331', '33333333-3333-4333-8333-333333333333', 'ESC-LOCAL', true),
    ('a3333333-3333-4333-8333-333333333332', '33333333-3333-4333-8333-333333333333', 'ESC-OTHER', true)
on conflict (id) do update set can_write = excluded.can_write;
