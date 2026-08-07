begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(18);

select ok(
    to_regprocedure('public.save_exercise_with_competences(jsonb,jsonb,jsonb)') is not null,
    'RPC versionada de criação de exercício existe'
);
select ok(
    to_regprocedure('public.delete_unlinked_invoice_asset()') is not null,
    'função de limpeza do bem derivado existe'
);
select ok(
    to_regprocedure('public.sync_pendency_attempt_statuses()') is not null,
    'função de sincronização das tentativas existe'
);
select ok(
    exists (
        select 1 from pg_trigger
        where tgname = 'registered_invoices_delete_unlinked_asset'
          and not tgisinternal
    ),
    'gatilho da nota fiscal está instalado'
);
select ok(
    exists (
        select 1 from pg_trigger
        where tgname = 'pendencies_sync_attempt_statuses'
          and not tgisinternal
    ),
    'gatilho da pendência está instalado'
);
select ok(
    (select not p.prosecdef
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = 'save_exercise_with_competences'),
    'RPC de exercício usa SECURITY INVOKER'
);
select ok(
    (select p.prosecdef
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = 'delete_unlinked_invoice_asset'),
    'gatilho de limpeza usa SECURITY DEFINER restrito'
);

insert into auth.users (id, email) values
('00000000-0000-0000-0000-000000000981', 'integrity-admin@example.test'),
('00000000-0000-0000-0000-000000000982', 'integrity-controller@example.test');
insert into public.controllers (id, name, email, user_id) values
('INT-CTRL', 'Controlador Integridade', 'integrity-controller@example.test', '00000000-0000-0000-0000-000000000982');
insert into public.user_profiles (user_id, profile_id, controller_id, cre_scope) values
('00000000-0000-0000-0000-000000000981', 'technical_admin', null, null),
('00000000-0000-0000-0000-000000000982', 'controller', 'INT-CTRL', '4ª CRE');
insert into public.competences (id, label, exercise) values
('2039-12', 'Dezembro 2039', 2039);
insert into public.programs (id, name) values
('INT_BASIC', 'Programa de Integridade');
insert into public.schools (
    id, designation, denomination, cre, initial_competence, controller_id, inventory_process,
    inep,
    cnpj,
    sici)
values(
    'INT-SCHOOL', '04.99.981', 'Escola Integridade', '4ª CRE', '2039-12', 'INT-CTRL', '07/981/2039'
, '33589650', '90.589.650/0001-08', 'SICI-TEST-97D92212378A');

-- As escritas operacionais são executadas como controlador real, sob RLS.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000982', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

-- INV-01: a nota deixa de apontar para o bem e o bem derivado é apagado na mesma transação.
insert into public.assets (
    id, school_id, competence_id, description, expense_type, invoice_number,
    amount, status, inventory_process, notes, payload
) values (
    'INT-ASSET', 'INT-SCHOOL', '2039-12', 'Notebook', 'permanente',
    'NF-INT', 4500, 'Não encaminhada', '07/981/2039', '', '{}'
);
insert into public.registered_invoices (
    id, school_id, competence_id, program_id, source_context_key, linked_asset_id,
    description, expense_type, invoice_number, amount, payload, registered_at
) values (
    'INT-INVOICE', 'INT-SCHOOL', '2039-12', 'INT_BASIC',
    '2039-12_INT_BASIC', 'INT-ASSET', 'Notebook', 'permanente',
    'NF-INT', 4500, '{}', now()
);
update public.registered_invoices
set linked_asset_id = null,
    expense_type = 'consumo'
where id = 'INT-INVOICE';
select is(
    (select count(*)::integer from public.assets where id = 'INT-ASSET'),
    0,
    'controlador desvincula nota permanente e o bem derivado é eliminado'
);
select is(
    (select linked_asset_id from public.registered_invoices where id = 'INT-INVOICE'),
    null,
    'nota convertida permanece sem vínculo patrimonial'
);

-- PEND-02: a autoridade do agregado atualiza a tabela própria sob o mesmo perfil.
insert into public.pendencies (
    id, school_id, competence_origin, program_id, document_key, status,
    responsible_area, next_actor, reason, notes, payload
) values (
    'INT-PEND', 'INT-SCHOOL', '2039-12', 'INT_BASIC', 'extCC', 'Aberta',
    'Escola', 'Escola', 'Documento', '',
    '{"tentativas":[{"id":"INT-ATTEMPT","status":"aguardando"}]}'
);
insert into public.pendency_attempts (
    id, pendency_id, attempt_number, submitted_at, result,
    observation, drive_url, errors, payload
) values (
    'INT-ATTEMPT', 'INT-PEND', 1, now(), null,
    '', '', '[]', '{"status":"aguardando"}'
);
update public.pendencies
set payload = '{"tentativas":[{"id":"INT-ATTEMPT","status":"substituida_antes_da_analise"}]}'
where id = 'INT-PEND';
select is(
    (select payload ->> 'status' from public.pendency_attempts where id = 'INT-ATTEMPT'),
    'substituida_antes_da_analise',
    'status da tentativa acompanha o agregado da pendência'
);
select is(
    (select count(*)::integer from public.pendency_attempts where pendency_id = 'INT-PEND'),
    1,
    'sincronização preserva a quantidade e o histórico de tentativas'
);

reset role;

-- CFG-02: criação válida, doze meses e conflito otimista como administrador técnico.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000981', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select lives_ok($test$
    select public.save_exercise_with_competences(
        (
            select jsonb_build_object(
                'id', id,
                'exercises', exercises || '["2040"]'::jsonb,
                'closing_competence', '2040-05',
                'bonus_deadline_extended', coalesce(bonus_deadline_extended::text, ''),
                'settings', settings,
                'row_version', row_version
            )
            from public.app_config
            where id = 'global'
        ),
        (
            select jsonb_agg(jsonb_build_object(
                'id', format('2040-%s', lpad(month_number::text, 2, '0')),
                'label', format('Competência %s/2040', lpad(month_number::text, 2, '0')),
                'exercise', 2040,
                'starts_on', make_date(2040, month_number, 1),
                'ends_on', (date_trunc('month', make_date(2040, month_number, 1)) + interval '1 month - 1 day')::date,
                'bonus_deadline', (make_date(2040, month_number, 1) + interval '1 month 14 days')::date,
                'closed_at', null
            ) order by month_number)
            from generate_series(1, 12) month_number
        ),
        '{"id":"INT-LOG-EXERCISE","action":"Exercício Criado","details":{}}'
    )
$test$, 'criação de exercício válida é atômica');
select is(
    (select count(*)::integer from public.competences where exercise = 2040),
    12,
    'exercício cria exatamente doze competências'
);
select ok(
    (select exercises @> '["2040"]'::jsonb from public.app_config where id = 'global'),
    'configuração global contém o exercício criado'
);
select is(
    (select closing_competence from public.app_config where id = 'global'),
    '2040-05',
    'competência inicial do exercício foi preservada'
);

select throws_like($test$
    select public.save_exercise_with_competences(
        jsonb_build_object(
            'id', 'global',
            'exercises', (select exercises || '["2041"]'::jsonb from public.app_config where id = 'global'),
            'closing_competence', '2041-05',
            'bonus_deadline_extended', '',
            'settings', (select settings from public.app_config where id = 'global'),
            'row_version', (select row_version - 1 from public.app_config where id = 'global')
        ),
        (
            select jsonb_agg(jsonb_build_object(
                'id', format('2041-%s', lpad(month_number::text, 2, '0')),
                'label', format('Competência %s/2041', lpad(month_number::text, 2, '0')),
                'exercise', 2041,
                'starts_on', make_date(2041, month_number, 1),
                'ends_on', (date_trunc('month', make_date(2041, month_number, 1)) + interval '1 month - 1 day')::date,
                'bonus_deadline', (make_date(2041, month_number, 1) + interval '1 month 14 days')::date,
                'closed_at', null
            ) order by month_number)
            from generate_series(1, 12) month_number
        ),
        '{"id":"INT-LOG-STALE","action":"Exercício Criado","details":{}}'
    )
$test$, '%OPTIMISTIC_CONFLICT:%', 'versão desatualizada é rejeitada');
select is(
    (select count(*)::integer from public.competences where exercise = 2041),
    0,
    'conflito não deixa competências parciais'
);
select throws_like($test$
    select public.save_exercise_with_competences(
        jsonb_build_object(
            'id', 'global',
            'exercises', (select exercises || '["2042"]'::jsonb from public.app_config where id='global'),
            'closing_competence', '2042-05',
            'bonus_deadline_extended', '',
            'settings', (select settings from public.app_config where id='global'),
            'row_version', (select row_version from public.app_config where id='global')
        ),
        (
            select jsonb_agg(jsonb_build_object(
                'id', '2042-01',
                'label', 'Duplicada',
                'exercise', 2042,
                'starts_on', '2042-01-01',
                'ends_on', '2042-01-31',
                'bonus_deadline', '2042-02-15',
                'closed_at', null
            ))
            from generate_series(1, 12)
        ),
        '{"id":"INT-LOG-DUPLICATE","action":"Exercício Criado","details":{}}'
    )
$test$, '%doze meses distintos%', 'meses duplicados são rejeitados');

reset role;
select * from finish();
rollback;
