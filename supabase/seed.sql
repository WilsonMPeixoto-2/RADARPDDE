-- Dados funcionais locais, sem credenciais. As identidades Auth são criadas
-- separadamente pela API Admin local, com senha efêmera fornecida em runtime.

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
    ('controller-local', 'Controlador Local', 'controller@radar.local', null),
    ('controller-other', 'Outro Controlador', 'other@radar.local', null)
on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    user_id = excluded.user_id;

insert into public.inventory_team_members (id, name, email, user_id)
values ('inventory-local', 'Inventário Local', 'inventory@radar.local', null)
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
