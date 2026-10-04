begin;
set local role postgres;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(35);

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

-- Caracterização #410: cobertura histórica não equivale a todos os registros
-- da escola. Estas contraprovas exercitam a RPC existente, sem criar a nova RPC.
insert into public.pendencies (
    id, school_id, competence_origin, program_id, document_key,
    status, responsible_area, next_actor, reason, notes, payload
) values (
    'pendency-all-programs', '04.99.995', '2026-03', null, 'extCC',
    'Aberta', 'GAD', 'Escola', 'Escopo sem programa', '', '{}'::jsonb
);

set local role authenticated;
create temporary table context_all_programs as
select public.read_operational_context('2026-09') as value;
reset role;

select ok(
    exists (select 1 from context_all_programs,
        jsonb_array_elements(value -> 'entities' -> 'verifications') item
        where item ->> 'id' = 'v-other-program'),
    'Pendência histórica sem programa inclui avaliações de todos os programas do contexto'
);
select ok(
    exists (select 1 from context_all_programs,
        jsonb_array_elements(value -> 'entities' -> 'registeredInvoices') item
        where item ->> 'id' = 'invoice-other-program'),
    'Pendência histórica sem programa inclui NFs de todos os programas do contexto'
);
delete from public.pendencies where id = 'pendency-all-programs';

insert into public.pendency_contacts (
    id, school_id, pendency_id, contact_type, contact_date, description, payload
) values ('contact-general', '04.99.995', null, 'E-mail', '2026-09-21', 'Contato da escola', '{}'::jsonb);

set local role authenticated;
create temporary table context_general_contact as
select public.read_operational_context('2026-09') as value;
create temporary table school_all_contacts as
select id from public.pendency_contacts where school_id = '04.99.995';
reset role;

select ok(
    not exists (select 1 from context_general_contact,
        jsonb_array_elements(value -> 'entities' -> 'pendencyContacts') item
        where item ->> 'id' = 'contact-general'),
    'RPC operacional não inclui contato geral sem Pendência'
);
select ok(
    exists (select 1 from school_all_contacts where id = 'contact-general'),
    'consulta escolar de contatos inclui contato geral autorizado'
);

update public.pendencies set status = 'Resolvida' where id = 'pendency-old-open';
set local role authenticated;
create temporary table context_after_resolution as
select public.read_operational_context('2026-09') as value;
reset role;

select ok(
    not exists (
        select 1 from context_after_resolution,
            jsonb_each(value -> 'entities') entity,
            jsonb_array_elements(entity.value) item
        where item ->> 'id' = any(array['pendency-old-open', 'attempt-open', 'contact-open'])
    ),
    'resolver Pendência histórica remove pai, tentativa e contato da cobertura regular'
);
select is(
    (select count(*) from public.pendencies p
        join public.pendency_attempts a on a.pendency_id = p.id
        join public.pendency_contacts c on c.pendency_id = p.id
        where p.id = 'pendency-old-open'),
    1::bigint,
    'saída da cobertura não apaga os três registros do banco'
);

update public.assets set status = 'Inventariada' where id = 'asset-feb-active';
set local role authenticated;
create temporary table context_after_inventory as
select public.read_operational_context('2026-09') as value;
create temporary table context_resolved_history as
select public.read_operational_context('2026-09', array['Resolvida']::text[]) as value;
reset role;

select ok(
    not exists (
        select 1 from context_after_inventory,
            jsonb_each(value -> 'entities') entity,
            jsonb_array_elements(entity.value) item
        where item ->> 'id' = any(array[
            'v-feb', 'invoice-feb-active', 'invoice-feb-done', 'asset-feb-active', 'asset-feb-done'
        ])
    ),
    'inventariar o último bem ativo histórico retira todo o fechamento dependente de fevereiro'
);
select is(
    (select count(*) from public.assets where id = 'asset-feb-active')
        + (select count(*) from public.registered_invoices where competence_id = '2026-02'),
    3::bigint,
    'bem e NFs históricas continuam persistidos depois de sair da cobertura'
);
select ok(
    exists (select 1 from context_resolved_history,
        jsonb_array_elements(value -> 'entities' -> 'pendencyAttempts') item
        where item ->> 'id' = 'attempt-open'),
    'solicitar histórico Resolvida recupera tentativa que saiu da cobertura regular'
);

delete from public.pendencies where id = 'pendency-old-open';
select is(
    (select count(*) from public.pendency_attempts where id = 'attempt-open'),
    0::bigint,
    'exclusão de pai apaga tentativa por CASCADE'
);
select ok(
    exists (select 1 from public.pendency_contacts where id = 'contact-open' and pendency_id is null),
    'exclusão de pai preserva contato escolar e põe vínculo em NULL'
);
set local role authenticated;
create temporary table context_after_parent_delete as
select public.read_operational_context('2026-09', array['Resolvida']::text[]) as value;
reset role;
select ok(
    not exists (select 1 from context_after_parent_delete,
        jsonb_array_elements(value -> 'entities' -> 'pendencyContacts') item
        where item ->> 'id' = 'contact-open'),
    'contato preservado sem pai sai da RPC mesmo com histórico solicitado'
);

-- Dados inconsistentes construídos somente na transação descartável. A FK por ID
-- não prova escola comum; aceitar a fixture não legitima o vínculo no produto.
update public.registered_invoices set linked_asset_id = 'asset-other-school' where id = 'invoice-sep';
select is(
    (select count(*) from public.registered_invoices i join public.assets a on a.id = i.linked_asset_id
        where i.id = 'invoice-sep' and i.school_id <> a.school_id),
    1::bigint,
    'schema permite vínculo NF/bem entre escolas sem constraint composta'
);
set local role authenticated;
create temporary table context_cross_school_link as
select public.read_operational_context('2026-09') as value;
reset role;
select ok(
    exists (select 1 from context_cross_school_link,
        jsonb_array_elements(value -> 'entities' -> 'assets') item
        where item ->> 'id' = 'asset-other-school'),
    'RPC global segue bem de outra escola quando ambos os registros são autorizados'
);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000997', 'context-controller@example.test');
insert into public.controllers (id, name, user_id)
values ('CTX-CONTROLLER', 'Controlador contexto', '00000000-0000-0000-0000-000000000997');
insert into public.user_profiles (user_id, profile_id, controller_id, cre_scope)
values ('00000000-0000-0000-0000-000000000997', 'controller', 'CTX-CONTROLLER', '4ª CRE');
update public.schools set cre = '5ª CRE' where id = '04.99.996';
insert into public.pendencies (
    id, school_id, competence_origin, program_id, document_key,
    status, responsible_area, next_actor, reason, notes, payload
) values ('pendency-forbidden', '04.99.996', '2026-03', 'CTX_BASIC', 'extCC',
    'Aberta', 'GAD', 'Escola', 'Escola fora do escopo', '', '{}'::jsonb);
insert into public.pendency_attempts (id, pendency_id, attempt_number, observation, drive_url, errors, payload)
values ('attempt-forbidden', 'pendency-forbidden', 1, '', '', '[]'::jsonb, '{}'::jsonb);
insert into public.pendency_contacts (id, school_id, pendency_id, contact_type, contact_date, description, payload)
values ('contact-forbidden', '04.99.996', 'pendency-forbidden', 'E-mail', '2026-03-20', 'Contato fora do escopo', '{}'::jsonb);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000997', true);
create temporary table context_restricted as
select public.read_operational_context('2026-09', array['Resolvida']::text[]) as value;
reset role;
select ok(
    not exists (
        select 1 from context_restricted,
            jsonb_each(value -> 'entities') entity,
            jsonb_array_elements(entity.value) item
        where item ->> 'school_id' = '04.99.996'
            or item ->> 'id' = 'attempt-forbidden'
    ),
    'RLS exclui todas as linhas da escola proibida, inclusive tentativa sem school_id'
);
select ok(
    exists (select 1 from context_restricted,
        jsonb_array_elements(value -> 'entities' -> 'registeredInvoices') item
        where item ->> 'id' = 'invoice-sep' and item ->> 'linked_asset_id' = 'asset-other-school'),
    'RLS não torna íntegro o vínculo: NF autorizada pode referenciar bem que foi ocultado'
);

update public.user_profiles set active = false
where user_id = '00000000-0000-0000-0000-000000000997';
set local role authenticated;
create temporary table context_inactive as
select public.read_operational_context('2026-09', array['Resolvida']::text[]) as value;
reset role;
select is(
    (select sum(jsonb_array_length(entity.value)) from context_inactive, jsonb_each(value -> 'entities') entity),
    0::bigint,
    'perfil inativo sem escopos explícitos não recebe dados das seis coleções'
);

-- DELETE técnico da fixture caracteriza remoção da última linha; não substitui
-- os contratos próprios das RPCs de exclusão de NF com histórico/efeitos derivados.
delete from public.pendencies where id = 'pendency-sep-resolved';
delete from public.registered_invoices where id = 'invoice-sep';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000995', true);
create temporary table context_after_last_invoice_delete as
select public.read_operational_context('2026-09') as value;
reset role;
select is(
    (select coalesce(jsonb_agg(item), '[]'::jsonb)
        from context_after_last_invoice_delete,
            jsonb_array_elements(value -> 'entities' -> 'registeredInvoices') item
        where item ->> 'school_id' = '04.99.995'),
    '[]'::jsonb,
    'apagar última NF coberta da escola deixa sua fatia vazia'
);
select ok(
    exists (select 1 from context_after_last_invoice_delete,
        jsonb_array_elements(value -> 'entities' -> 'verifications') item
        where item ->> 'id' = 'v-sep')
    and exists (select 1 from context_after_last_invoice_delete,
        jsonb_array_elements(value -> 'entities' -> 'assets') item
        where item ->> 'id' = 'asset-sep-done'),
    'remoção da última NF mantém avaliação e bem mensal que continuam cobertos'
);
select ok(
    exists (select 1 from context_after_last_invoice_delete,
        jsonb_array_elements(value -> 'entities' -> 'registeredInvoices') item
        where item ->> 'id' = 'invoice-other-school'),
    'fatia vazia da escola não apaga a NF coberta de outra escola'
);

select * from finish();
rollback;
