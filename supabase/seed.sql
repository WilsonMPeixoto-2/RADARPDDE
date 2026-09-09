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
    inep,
    cnpj,
    sici,
    cre,
    ra,
    controller_id,
    initial_competence,
    inventory_process
)
values
    (
        'ESC-LOCAL',
        '04.00.001',
        'Escola Local Autorizada',
        '33900001',
        '90.000.001/0001-01',
        'SICI-LOCAL-001',
        '4ª CRE',
        '10',
        'controller-local',
        '2026-05',
        'PROC-LOCAL-1'
    ),
    (
        'ESC-OTHER',
        '04.00.002',
        'Escola Local de Outro Controlador',
        '33900002',
        '90.000.002/0001-02',
        'SICI-LOCAL-002',
        '4ª CRE',
        '11',
        'controller-other',
        '2026-05',
        'PROC-LOCAL-2'
    )
on conflict (id) do nothing;

insert into public.school_programs (id, school_id, program_id, active, starts_on)
values
    ('ESC-LOCAL_BASIC', 'ESC-LOCAL', 'BASIC', true, '2026-01-01'),
    ('ESC-OTHER_BASIC', 'ESC-OTHER', 'BASIC', true, '2026-01-01')
on conflict (id) do nothing;

-- Registros sintéticos exclusivamente locais para a auditoria visual responsiva.
-- Exercitam as nove colunas reais de Pendências e o drawer sem tocar em Production.
insert into public.pendencies (
    id, school_id, competence_origin, program_id, document_key,
    status, responsible_area, next_actor, reason, notes, opened_at, payload
)
values
    (
        'PEND-VIS-001', 'ESC-LOCAL', '2026-05', 'BASIC', 'extCC',
        'Aberta', 'Escola', 'Escola', 'Documento ilegível',
        'Substituir o extrato da conta corrente por arquivo legível e completo para conferência documental.',
        now() - interval '18 days', '{"fixture":"visual-post-pr291"}'::jsonb
    ),
    (
        'PEND-VIS-002', 'ESC-LOCAL', '2026-05', 'BASIC', 'extINV',
        'Aguardando reanálise', 'Verbas Federais', 'Controlador', 'Extrato incompleto',
        'Novo envio disponibilizado para reanálise. Conferir todas as páginas e a competência antes de concluir.',
        now() - interval '9 days', '{"fixture":"visual-post-pr291"}'::jsonb
    ),
    (
        'PEND-VIS-003', 'ESC-OTHER', '2026-05', 'BASIC', 'extCC',
        'Aberta', 'Escola', 'Escola', 'Competência incorreta',
        'O documento enviado corresponde a competência distinta da selecionada no RADAR e precisa ser substituído.',
        now() - interval '31 days', '{"fixture":"visual-post-pr291"}'::jsonb
    ),
    (
        'PEND-VIS-004', 'ESC-OTHER', '2026-05', 'BASIC', 'extINV',
        'Aberta', 'Escola', 'Escola', 'Documento ausente',
        'Extrato de investimento ainda não localizado no conjunto documental apresentado pela unidade escolar.',
        now() - interval '5 days', '{"fixture":"visual-post-pr291"}'::jsonb
    )
on conflict (id) do nothing;

insert into public.pendency_attempts (
    id, pendency_id, attempt_number, submitted_at, analyzed_at,
    result, observation, drive_url, errors, payload
)
values
    (
        'ATT-VIS-001', 'PEND-VIS-001', 1, now() - interval '15 days', now() - interval '14 days',
        'incorreto', 'Arquivo permaneceu ilegível após o primeiro reenvio.', '', '["Documento ilegível"]'::jsonb,
        '{"fixture":"visual-post-pr291"}'::jsonb
    ),
    (
        'ATT-VIS-002', 'PEND-VIS-002', 1, now() - interval '1 day', null,
        null, 'Novo arquivo disponibilizado e aguardando reanálise.', '', '[]'::jsonb,
        '{"fixture":"visual-post-pr291"}'::jsonb
    )
on conflict (id) do nothing;
