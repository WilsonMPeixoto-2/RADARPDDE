begin;
set local role postgres;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(15);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000995', 'operational-context@example.test');

insert into public.user_profiles (user_id, profile_id)
values ('00000000-0000-0000-0000-000000000995', 'federal_assistant');

insert into public.competences (id, label, exercise, bonus_deadline)
values
    ('2026-02', 'Fevereiro de 2026', 2026, '2026-03-15'),
    ('2026-03', 'Março de 2026', 2026, '2026-04-15'),
    ('2026-09', 'Setembro de 2026', 2026, '2026-10-15');

insert into public.programs (id, name)
values
    ('CTX_BASIC', 'Programa contexto'),
    ('CTX_OTHER', 'Programa alheio');

insert into public.schools (
    id, designation, denomination, cre, initial_competence, inep, cnpj, sici
) values
    ('04.99.995', '04.99.995', 'Escola Contexto', '4ª CRE', '2026-02', '33999995', '99.999.995/0001-95', 'SICI-CTX-995'),
    ('04.99.996', '04.99.996', 'Escola Alheia', '4ª CRE', '2026-02', '33999996', '99.999.996/0001-96', 'SICI-CTX-996');

insert into public.verifications (
    id, school_id, competence_id, program_id, bonification, analysis, payload
) values
    ('v-sep', '04.99.995', '2026-09', 'CTX_BASIC', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb),
    ('v-mar', '04.99.995', '2026-03', 'CTX_BASIC', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb),
    ('v-feb', '04.99.995', '2026-02', 'CTX_BASIC', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb),
    ('v-other-school', '04.99.996', '2026-03', 'CTX_BASIC', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb),
    ('v-other-program', '04.99.995', '2026-03', 'CTX_OTHER', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb);

insert into public.assets (
    id, school_id, competence_id, description, expense_type, invoice_number, amount, status, payload
) values
    ('asset-feb-active', '04.99.995', '2026-02', 'Bem ativo', 'permanente', 'NF-ASSET-A', 100, 'Encaminhada', '{}'::jsonb),
    ('asset-feb-done', '04.99.995', '2026-02', 'Bem irmão terminal', 'permanente', 'NF-ASSET-B', 200, 'Inventariada', '{}'::jsonb),
    ('asset-sep-done', '04.99.995', '2026-09', 'Bem mensal terminal', 'permanente', 'NF-ASSET-C', 300, 'Inventariada', '{}'::jsonb),
    ('asset-other-school', '04.99.996', '2026-02', 'Bem terminal alheio', 'permanente', 'NF-ASSET-X', 400, 'Inventariada', '{}'::jsonb);

insert into public.registered_invoices (
    id, school_id, competence_id, program_id, verification_id, source_context_key,
    linked_asset_id, description, expense_type, invoice_number, amount, payload
) values
    ('invoice-sep', '04.99.995', '2026-09', 'CTX_BASIC', 'v-sep', '2026-09_CTX_BASIC',
        null, 'Nota mensal', 'consumo', 'NF-SEP', 50, '{}'::jsonb),
    ('invoice-mar-linked', '04.99.995', '2026-03', 'CTX_BASIC', 'v-mar', '2026-03_CTX_BASIC',
        null, 'Nota ligada à pendência', 'consumo', 'NF-MAR-LINK', 60, '{}'::jsonb),
    ('invoice-mar-sibling', '04.99.995', '2026-03', 'CTX_BASIC', 'v-mar', '2026-03_CTX_BASIC',
        null, 'Nota irmã do agregado', 'consumo', 'NF-MAR-SIB', 70, '{}'::jsonb),
    ('invoice-feb-active', '04.99.995', '2026-02', 'CTX_BASIC', 'v-feb', '2026-02_CTX_BASIC',
        'asset-feb-active', 'Nota do bem ativo', 'permanente', 'NF-FEB-A', 100, '{}'::jsonb),
    ('invoice-feb-done', '04.99.995', '2026-02', 'CTX_BASIC', 'v-feb', '2026-02_CTX_BASIC',
        'asset-feb-done', 'Nota irmã do bem', 'permanente', 'NF-FEB-B', 200, '{}'::jsonb),
    ('invoice-other-school', '04.99.996', '2026-03', 'CTX_BASIC', 'v-other-school', '2026-03_CTX_BASIC',
        'asset-other-school', 'Nota alheia', 'permanente', 'NF-X', 400, '{}'::jsonb),
    ('invoice-other-program', '04.99.995', '2026-03', 'CTX_OTHER', 'v-other-program', '2026-03_CTX_OTHER',
        null, 'Nota de outro programa', 'consumo', 'NF-OTHER-PROG', 80, '{}'::jsonb);

insert into public.pendencies (
    id, school_id, competence_origin, program_id, document_key, registered_invoice_id,
    status, responsible_area, next_actor, reason, notes, payload
) values
    ('pendency-old-open', '04.99.995', '2026-03', 'CTX_BASIC', 'notaFiscal', 'invoice-mar-linked',
        'Aberta', 'GAD', 'Escola', 'Correção necessária', '', '{}'::jsonb),
    ('pendency-old-resolved', '04.99.995', '2026-03', 'CTX_BASIC', 'notaFiscal', 'invoice-mar-sibling',
        'Resolvida', 'GAD', 'Escola', 'Histórico encerrado', '', '{}'::jsonb),
    ('pendency-sep-resolved', '04.99.995', '2026-09', 'CTX_BASIC', 'notaFiscal', 'invoice-sep',
        'Resolvida', 'GAD', 'Escola', 'Encerrada no mês', '', '{}'::jsonb);

insert into public.pendency_attempts (
    id, pendency_id, attempt_number, observation, drive_url, errors, payload
) values
    ('attempt-open', 'pendency-old-open', 1, '', '', '[]'::jsonb, '{}'::jsonb),
    ('attempt-old-resolved', 'pendency-old-resolved', 1, '', '', '[]'::jsonb, '{}'::jsonb),
    ('attempt-sep', 'pendency-sep-resolved', 1, '', '', '[]'::jsonb, '{}'::jsonb);

insert into public.pendency_contacts (
    id, school_id, pendency_id, contact_type, contact_date, description, payload
) values
    ('contact-open', '04.99.995', 'pendency-old-open', 'E-mail', '2026-03-20', 'Contato aberto', '{}'::jsonb),
    ('contact-old-resolved', '04.99.995', 'pendency-old-resolved', 'E-mail', '2026-03-21', 'Contato histórico', '{}'::jsonb),
    ('contact-sep', '04.99.995', 'pendency-sep-resolved', 'E-mail', '2026-09-20', 'Contato mensal', '{}'::jsonb);

select ok(
    to_regprocedure('public.read_operational_context(text,text[])') is not null,
    'RPC set-based de contexto operacional existe'
);

select is(
    (select prosecdef
       from pg_proc
      where oid = to_regprocedure('public.read_operational_context(text,text[])')),
    false,
    'RPC de contexto é SECURITY INVOKER'
);

select ok(
    has_function_privilege(
        'authenticated',
        'public.read_operational_context(text,text[])',
        'EXECUTE'
    ),
    'authenticated pode executar a leitura contextual'
);

select ok(
    not has_function_privilege(
        'anon',
        'public.read_operational_context(text,text[])',
        'EXECUTE'
    ),
    'anon não pode executar a leitura contextual'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000995', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

create temporary table operational_context_regular as
select public.read_operational_context('2026-09', array[]::text[]) as value;

create temporary table operational_context_history as
select public.read_operational_context('2026-09', array['Resolvida']::text[]) as value;

reset role;

select is(
    (select value ->> 'competenceId' from operational_context_regular),
    '2026-09',
    'contexto devolve a competência solicitada'
);

select is(
    (
        select array_agg(item ->> 'id' order by item ->> 'id')
        from operational_context_regular,
             jsonb_array_elements(value -> 'entities' -> 'verifications') item
    ),
    array['v-feb','v-mar','v-sep']::text[],
    'verificações mensais e dependências históricas mínimas são preservadas'
);

select is(
    (
        select array_agg(item ->> 'id' order by item ->> 'id')
        from operational_context_regular,
             jsonb_array_elements(value -> 'entities' -> 'registeredInvoices') item
    ),
    array['invoice-feb-active','invoice-feb-done','invoice-mar-linked','invoice-mar-sibling','invoice-sep']::text[],
    'notas mensais, ligadas e irmãs necessárias ao agregado são preservadas'
);

select is(
    (
        select array_agg(item ->> 'id' order by item ->> 'id')
        from operational_context_regular,
             jsonb_array_elements(value -> 'entities' -> 'pendencies') item
    ),
    array['pendency-old-open','pendency-sep-resolved']::text[],
    'contexto regular inclui pendências ativas históricas e pendências do mês'
);

select is(
    (
        select array_agg(item ->> 'id' order by item ->> 'id')
        from operational_context_regular,
             jsonb_array_elements(value -> 'entities' -> 'pendencyAttempts') item
    ),
    array['attempt-open','attempt-sep']::text[],
    'tentativas são limitadas às pendências incluídas'
);

select is(
    (
        select array_agg(item ->> 'id' order by item ->> 'id')
        from operational_context_regular,
             jsonb_array_elements(value -> 'entities' -> 'pendencyContacts') item
    ),
    array['contact-open','contact-sep']::text[],
    'contatos são limitados às pendências incluídas'
);

select is(
    (
        select array_agg(item ->> 'id' order by item ->> 'id')
        from operational_context_regular,
             jsonb_array_elements(value -> 'entities' -> 'assets') item
    ),
    array['asset-feb-active','asset-feb-done','asset-sep-done']::text[],
    'bem ativo histórico, irmão vinculado e bem mensal são preservados'
);

select is(
    (
        select array_agg(item ->> 'id' order by item ->> 'id')
        from operational_context_history,
             jsonb_array_elements(value -> 'entities' -> 'pendencies') item
    ),
    array['pendency-old-open','pendency-old-resolved','pendency-sep-resolved']::text[],
    'histórico encerrado só entra quando solicitado'
);

select is(
    (
        select array_agg(item ->> 'id' order by item ->> 'id')
        from operational_context_history,
             jsonb_array_elements(value -> 'entities' -> 'pendencyAttempts') item
    ),
    array['attempt-old-resolved','attempt-open','attempt-sep']::text[],
    'tentativas históricas acompanham o histórico solicitado'
);

select is(
    (
        select array_agg(item ->> 'id' order by item ->> 'id')
        from operational_context_history,
             jsonb_array_elements(value -> 'entities' -> 'pendencyContacts') item
    ),
    array['contact-old-resolved','contact-open','contact-sep']::text[],
    'contatos históricos acompanham o histórico solicitado'
);

select throws_ok(
    $$ select public.read_operational_context('2026-09', array['all']::text[]) $$,
    'P0001',
    'INVALID_OPERATIONAL_CONTEXT: estado histórico de Pendência inválido',
    'estado histórico inválido é rejeitado no banco'
);

select * from finish();
rollback;
