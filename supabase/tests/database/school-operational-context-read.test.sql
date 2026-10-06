begin;
set local role postgres;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(81);

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

-- Oráculo independente: particiona a leitura global vigente; tentativas pertencem
-- à escola do pai. Não é a implementação da nova RPC nem uma função do produto.
create function pg_temp.school_partition(p_value jsonb, p_school text)
returns jsonb language sql stable as $$
    select jsonb_object_agg(e.key, (
        select coalesce(jsonb_agg(item order by item ->> 'id'), '[]'::jsonb)
        from jsonb_array_elements(e.value) item
        where item ->> 'school_id' = p_school
           or (e.key = 'pendencyAttempts' and item ->> 'pendency_id' in (
               select p ->> 'id'
               from jsonb_array_elements(p_value -> 'entities' -> 'pendencies') p
               where p ->> 'school_id' = p_school
           ))
    )) from jsonb_each(p_value -> 'entities') e;
$$;
create temporary table school_reads(label text primary key, actual jsonb, expected jsonb);
grant insert on school_reads to authenticated;
create function pg_temp.capture_school(
    p_label text, p_school text default '04.99.995',
    p_history text[] default array[]::text[], p_competence text default '2026-09'
) returns void language plpgsql as $$
begin
    insert into school_reads(label, actual, expected)
    select p_label,
        public.read_school_operational_context(p_school, p_competence, p_history),
        pg_temp.school_partition(public.read_operational_context(p_competence, p_history), btrim(p_school));
end;
$$;

select ok(to_regprocedure('public.read_school_operational_context(text,text,text[])') is not null,
    'RPC escolar existe antes de qualquer integração frontend');
select is((select prosecdef from pg_proc where oid =
    to_regprocedure('public.read_school_operational_context(text,text,text[])')), false,
    'RPC escolar é SECURITY INVOKER');
select is((select provolatile::text from pg_proc where oid =
    to_regprocedure('public.read_school_operational_context(text,text,text[])')), 's',
    'guard e fechamento usam o snapshot de uma leitura STABLE');
select is((select proconfig from pg_proc where oid =
    to_regprocedure('public.read_school_operational_context(text,text,text[])')),
    array['search_path=pg_catalog, public']::text[], 'search_path explícito e restrito');
select ok(has_function_privilege('authenticated',
    'public.read_school_operational_context(text,text,text[])', 'EXECUTE'), 'authenticated executa sob RLS');
select ok(has_function_privilege('service_role',
    'public.read_school_operational_context(text,text,text[])', 'EXECUTE'), 'service_role preserva acesso administrativo');
select ok(not has_function_privilege('anon',
    'public.read_school_operational_context(text,text,text[])', 'EXECUTE'), 'anon não executa a RPC escolar');
select ok(not exists (select 1 from pg_proc p, lateral aclexplode(p.proacl) a
    where p.oid = to_regprocedure('public.read_school_operational_context(text,text,text[])')
        and a.grantee = 0 and a.privilege_type = 'EXECUTE'), 'PUBLIC não possui EXECUTE');

select throws_ok($$select public.read_school_operational_context(null, '2026-09')$$,
    'P0001', 'INVALID_SCHOOL_OPERATIONAL_CONTEXT: informe uma escola', 'escola NULL é rejeitada');
select throws_ok($$select public.read_school_operational_context('  ', '2026-09')$$,
    'P0001', 'INVALID_SCHOOL_OPERATIONAL_CONTEXT: informe uma escola', 'escola vazia é rejeitada');
select throws_ok($$select public.read_school_operational_context('04.99.995', '2026-13')$$,
    'P0001', 'INVALID_SCHOOL_OPERATIONAL_CONTEXT: informe uma competência mensal válida', 'competência inválida é rejeitada');
select throws_ok($$select public.read_school_operational_context('04.99.995', '2026-09', array['Aberta'])$$,
    'P0001', 'INVALID_SCHOOL_OPERATIONAL_CONTEXT: estado histórico de Pendência inválido', 'histórico ativo não é aceito como histórico encerrado');
select throws_ok($$select public.read_school_operational_context('04.99.995', '2026-09', array[null]::text[])$$,
    'P0001', 'INVALID_SCHOOL_OPERATIONAL_CONTEXT: estado histórico de Pendência inválido', 'elemento NULL de histórico é rejeitado');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000995', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select pg_temp.capture_school('regular');
select pg_temp.capture_school('history', '04.99.995', array['Resolvida', 'Cancelada']);
select pg_temp.capture_school('normalized', ' 04.99.995 ', array['Resolvida', 'Cancelada', 'Resolvida']);
select pg_temp.capture_school('null-history', '04.99.995', null);
select pg_temp.capture_school('other-school', '04.99.996');
select pg_temp.capture_school('nonexistent', 'ESCOLA-INEXISTENTE');
reset role;

select is((select actual ->> 'schemaVersion' from school_reads where label = 'regular'), '1', 'envelope versionado');
select is((select actual ->> 'schoolId' from school_reads where label = 'normalized'), '04.99.995', 'escola é normalizada sem pressupor formato institucional');
select is((select actual ->> 'competenceId' from school_reads where label = 'regular'), '2026-09', 'competência explícita');
select is((select actual -> 'historyStatuses' from school_reads where label = 'normalized'),
    '["Cancelada","Resolvida"]'::jsonb, 'histórico explícito, ordenado e sem duplicatas');
select is((select actual -> 'coverage' from school_reads where label = 'regular'),
    '{"kind":"competence-and-dependencies","complete":true,"contacts":"selected-pendencies","collections":["verifications","registeredInvoices","pendencies","pendencyAttempts","pendencyContacts","assets"]}'::jsonb,
    'completude delimita as seis coleções e não promete todos os contatos ou todo o histórico');
select is((select actual -> 'fallback' from school_reads where label = 'regular'), 'null'::jsonb,
    'fechamento isolável não exige fallback');
select is(r.actual -> 'entities' -> e.name, r.expected -> e.name,
    r.label || ': equivalência integral de ' || e.name)
from school_reads r cross join (values ('verifications'), ('registeredInvoices'), ('pendencies'),
    ('pendencyAttempts'), ('pendencyContacts'), ('assets')) e(name)
where r.label in ('regular', 'history') order by r.label, e.name;
select is(actual -> 'entities', expected, label || ': partição completa da leitura global')
from school_reads where label in ('normalized', 'null-history', 'other-school', 'nonexistent') order by label;
select is((select actual -> 'entities' -> 'registeredInvoices' from school_reads where label = 'nonexistent'),
    '[]'::jsonb, 'array completo vazio é distinto de cobertura desconhecida');
select ok(not exists (select 1 from school_reads r, jsonb_each(r.actual -> 'entities') e,
    jsonb_array_elements(e.value) item where r.label = 'regular' and item ->> 'school_id' = '04.99.996'),
    'fechamento da escola não transporta linhas isoláveis da outra escola');

-- Um programa NULL cobre todas as NFs/verificações irmãs daquele mês.
savepoint wildcard;
update public.pendencies set program_id = null where id = 'pendency-old-open';
set local role authenticated;
select pg_temp.capture_school('program-wildcard');
reset role;
select is((select actual -> 'entities' from school_reads where label = 'program-wildcard'),
    (select expected from school_reads where label = 'program-wildcard'), 'programa NULL preserva fechamento de todos os programas');
select ok(exists (select 1 from school_reads, jsonb_array_elements(actual -> 'entities' -> 'registeredInvoices') i
    where label = 'program-wildcard' and i ->> 'id' = 'invoice-other-program'), 'NF irmã de outro programa é incluída quando necessário');
rollback to wildcard;

update public.pendencies set status = 'Resolvida' where id = 'pendency-old-open';
update public.assets set status = 'Inventariada' where id = 'asset-feb-active';
set local role authenticated;
select pg_temp.capture_school('coverage-withdrawal');
select pg_temp.capture_school('resolved-history', '04.99.995', array['Resolvida']);
reset role;
select is((select actual -> 'entities' from school_reads where label = 'coverage-withdrawal'),
    (select expected from school_reads where label = 'coverage-withdrawal'), 'saída por status retira todas as dependências como na leitura global');
select ok(not exists (select 1 from school_reads, jsonb_each(actual -> 'entities') e, jsonb_array_elements(e.value) i
    where label = 'coverage-withdrawal' and i ->> 'id' = any(array['v-feb','invoice-feb-active','invoice-feb-done','asset-feb-active','asset-feb-done','attempt-open','contact-open'])),
    'linhas fora da cobertura não ficam numa estratégia de upsert implícita');
select is((select actual -> 'entities' from school_reads where label = 'resolved-history'),
    (select expected from school_reads where label = 'resolved-history'), 'pedido de histórico recupera fechamento correto');
select is((select count(*) from public.pendency_attempts where id = 'attempt-open'), 1::bigint,
    'retirar da cobertura não apaga o banco');

delete from public.pendencies where id = 'pendency-old-open';
set local role authenticated;
select pg_temp.capture_school('parent-deleted', '04.99.995', array['Resolvida']);
reset role;
select is((select actual -> 'entities' from school_reads where label = 'parent-deleted'),
    (select expected from school_reads where label = 'parent-deleted'), 'DELETE de pai elimina tentativa e contato vinculado da cobertura');
select ok(exists(select 1 from public.pendency_contacts where id = 'contact-open' and pendency_id is null),
    'contato SET NULL continua existindo fora da RPC operacional');
delete from public.pendencies where id = 'pendency-sep-resolved';
delete from public.registered_invoices where id = 'invoice-sep';
set local role authenticated;
select pg_temp.capture_school('last-invoice-deleted');
reset role;
select is((select actual -> 'entities' -> 'registeredInvoices' from school_reads where label = 'last-invoice-deleted'),
    '[]'::jsonb, 'exclusão da última NF coberta produz array completo vazio');
select is((select actual -> 'entities' from school_reads where label = 'last-invoice-deleted'),
    (select expected from school_reads where label = 'last-invoice-deleted'), 'exclusão da última NF preserva demais entidades mensais');

-- Vínculos inconsistentes aceitos pelas FKs por ID. Não legitimam fluxo de negócio.
-- As relações são provadas nos dois sentidos, inclusive uma entrada estrangeira
-- que a leitura global segue sem qualquer raiz local na cobertura corrente.
insert into public.competences(id, label, exercise, bonus_deadline)
values ('2026-01', 'Janeiro de 2026', 2026, '2026-02-15');
insert into public.registered_invoices(id, school_id, competence_id, program_id, description, expense_type, invoice_number, amount, payload)
values ('invoice-incoming', '04.99.995', '2026-01', 'CTX_BASIC', 'Dependência recebida', 'consumo', 'NF-INCOMING', 90, '{}'::jsonb);
insert into public.pendencies(id, school_id, competence_origin, program_id, document_key, status, responsible_area, next_actor, reason, notes, payload)
values ('foreign-parent', '04.99.996', '2026-01', 'CTX_BASIC', 'extCC', 'Aberta', 'GAD', 'Escola', 'Raiz estrangeira', '', '{}'::jsonb);

savepoint relation_case;
update public.registered_invoices set linked_asset_id = 'asset-other-school' where id = 'invoice-mar-linked';
set local role authenticated;
select pg_temp.capture_school('outgoing-asset');
reset role;
select is((select actual -> 'coverage' -> 'complete' from school_reads where label = 'outgoing-asset'), 'false'::jsonb, 'outgoing-asset: não afirma completude isolada');
select is((select actual -> 'entities' from school_reads where label = 'outgoing-asset'), 'null'::jsonb, 'outgoing-asset: não devolve arrays aplicáveis nem DELETEs implícitos');
select is((select actual -> 'fallback' from school_reads where label = 'outgoing-asset'), '{"kind":"global","reason":"NON_ISOLATABLE_RELATION"}'::jsonb, 'outgoing-asset: exige caminho conservador sem expor IDs estrangeiros');
rollback to relation_case;

savepoint relation_case;
insert into public.assets(id, school_id, competence_id, description, expense_type, invoice_number, amount, status, payload)
values ('asset-foreign-active', '04.99.996', '2026-02', 'Raiz patrimonial estrangeira', 'permanente', 'NF-INCOMING', 90, 'Encaminhada', '{}'::jsonb);
update public.registered_invoices set linked_asset_id = 'asset-foreign-active' where id = 'invoice-incoming';
set local role authenticated;
select pg_temp.capture_school('incoming-asset');
reset role;
select ok(exists (select 1 from school_reads, jsonb_array_elements(expected -> 'registeredInvoices') i where label = 'incoming-asset' and i ->> 'id' = 'invoice-incoming'), 'incoming-asset: global segue NF local histórica a partir da raiz estrangeira');
select is((select actual -> 'coverage' -> 'complete' from school_reads where label = 'incoming-asset'), 'false'::jsonb, 'incoming-asset: não afirma completude isolada');
select is((select actual -> 'entities' from school_reads where label = 'incoming-asset'), 'null'::jsonb, 'incoming-asset: não devolve arrays aplicáveis nem DELETEs implícitos');
select is((select actual -> 'fallback' from school_reads where label = 'incoming-asset'), '{"kind":"global","reason":"NON_ISOLATABLE_RELATION"}'::jsonb, 'incoming-asset: exige caminho conservador sem expor IDs estrangeiros');
rollback to relation_case;

savepoint relation_case;
update public.registered_invoices set verification_id = 'v-other-school' where id = 'invoice-mar-linked';
set local role authenticated;
select pg_temp.capture_school('outgoing-verification');
reset role;
select is((select actual -> 'coverage' -> 'complete' from school_reads where label = 'outgoing-verification'), 'false'::jsonb, 'outgoing-verification: não afirma completude isolada');
select is((select actual -> 'entities' from school_reads where label = 'outgoing-verification'), 'null'::jsonb, 'outgoing-verification: não devolve arrays aplicáveis nem DELETEs implícitos');
select is((select actual -> 'fallback' from school_reads where label = 'outgoing-verification'), '{"kind":"global","reason":"NON_ISOLATABLE_RELATION"}'::jsonb, 'outgoing-verification: exige caminho conservador sem expor IDs estrangeiros');
rollback to relation_case;

savepoint relation_case;
update public.registered_invoices set verification_id = 'v-mar' where id = 'invoice-other-school';
set local role authenticated;
select pg_temp.capture_school('incoming-verification');
reset role;
select is((select actual -> 'coverage' -> 'complete' from school_reads where label = 'incoming-verification'), 'false'::jsonb, 'incoming-verification: não afirma completude isolada');
select is((select actual -> 'entities' from school_reads where label = 'incoming-verification'), 'null'::jsonb, 'incoming-verification: não devolve arrays aplicáveis nem DELETEs implícitos');
select is((select actual -> 'fallback' from school_reads where label = 'incoming-verification'), '{"kind":"global","reason":"NON_ISOLATABLE_RELATION"}'::jsonb, 'incoming-verification: exige caminho conservador sem expor IDs estrangeiros');
rollback to relation_case;

savepoint relation_case;
update public.pendencies set registered_invoice_id = 'invoice-other-school' where id = 'pendency-old-resolved';
set local role authenticated;
select pg_temp.capture_school('outgoing-pendency');
reset role;
select is((select actual -> 'coverage' -> 'complete' from school_reads where label = 'outgoing-pendency'), 'false'::jsonb, 'outgoing-pendency: não afirma completude isolada');
select is((select actual -> 'entities' from school_reads where label = 'outgoing-pendency'), 'null'::jsonb, 'outgoing-pendency: não devolve arrays aplicáveis nem DELETEs implícitos');
select is((select actual -> 'fallback' from school_reads where label = 'outgoing-pendency'), '{"kind":"global","reason":"NON_ISOLATABLE_RELATION"}'::jsonb, 'outgoing-pendency: exige caminho conservador sem expor IDs estrangeiros');
rollback to relation_case;

savepoint relation_case;
update public.pendencies set document_key = 'notaFiscal', registered_invoice_id = 'invoice-incoming' where id = 'foreign-parent';
set local role authenticated;
select pg_temp.capture_school('incoming-pendency');
reset role;
select ok(exists (select 1 from school_reads, jsonb_array_elements(expected -> 'registeredInvoices') i where label = 'incoming-pendency' and i ->> 'id' = 'invoice-incoming'), 'incoming-pendency: global segue NF local histórica a partir da raiz estrangeira');
select is((select actual -> 'coverage' -> 'complete' from school_reads where label = 'incoming-pendency'), 'false'::jsonb, 'incoming-pendency: não afirma completude isolada');
select is((select actual -> 'entities' from school_reads where label = 'incoming-pendency'), 'null'::jsonb, 'incoming-pendency: não devolve arrays aplicáveis nem DELETEs implícitos');
select is((select actual -> 'fallback' from school_reads where label = 'incoming-pendency'), '{"kind":"global","reason":"NON_ISOLATABLE_RELATION"}'::jsonb, 'incoming-pendency: exige caminho conservador sem expor IDs estrangeiros');
rollback to relation_case;

savepoint relation_case;
update public.pendency_contacts set pendency_id = 'foreign-parent' where id = 'contact-old-resolved';
set local role authenticated;
select pg_temp.capture_school('outgoing-contact');
reset role;
select is((select actual -> 'coverage' -> 'complete' from school_reads where label = 'outgoing-contact'), 'false'::jsonb, 'outgoing-contact: não afirma completude isolada');
select is((select actual -> 'entities' from school_reads where label = 'outgoing-contact'), 'null'::jsonb, 'outgoing-contact: não devolve arrays aplicáveis nem DELETEs implícitos');
select is((select actual -> 'fallback' from school_reads where label = 'outgoing-contact'), '{"kind":"global","reason":"NON_ISOLATABLE_RELATION"}'::jsonb, 'outgoing-contact: exige caminho conservador sem expor IDs estrangeiros');
rollback to relation_case;

savepoint relation_case;
insert into public.pendency_contacts(id, school_id, pendency_id, contact_type, contact_date, description, payload) values ('foreign-contact', '04.99.996', 'pendency-old-resolved', 'E-mail', '2026-03-21', 'Vínculo cruzado', '{}'::jsonb);
set local role authenticated;
select pg_temp.capture_school('incoming-contact');
reset role;
select is((select actual -> 'coverage' -> 'complete' from school_reads where label = 'incoming-contact'), 'false'::jsonb, 'incoming-contact: não afirma completude isolada');
select is((select actual -> 'entities' from school_reads where label = 'incoming-contact'), 'null'::jsonb, 'incoming-contact: não devolve arrays aplicáveis nem DELETEs implícitos');
select is((select actual -> 'fallback' from school_reads where label = 'incoming-contact'), '{"kind":"global","reason":"NON_ISOLATABLE_RELATION"}'::jsonb, 'incoming-contact: exige caminho conservador sem expor IDs estrangeiros');
rollback to relation_case;

insert into auth.users(id, email) values ('00000000-0000-0000-0000-000000000997', 'school-rpc-controller@example.test');
insert into public.controllers(id, name, user_id) values ('CTX-CONTROLLER', 'Controlador contexto', '00000000-0000-0000-0000-000000000997');
insert into public.user_profiles(user_id, profile_id, controller_id, cre_scope)
values ('00000000-0000-0000-0000-000000000997', 'controller', 'CTX-CONTROLLER', '4ª CRE');
update public.schools set cre = '5ª CRE' where id = '04.99.996';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000997', true);
select pg_temp.capture_school('controller-authorized', '04.99.995', array['Resolvida']);
select pg_temp.capture_school('controller-forbidden', '04.99.996', array['Resolvida']);
reset role;
select is(actual -> 'entities', expected, label || ': RLS coincide com a leitura global')
from school_reads where label in ('controller-authorized', 'controller-forbidden') order by label;
select is((select sum(jsonb_array_length(e.value)) from school_reads, jsonb_each(actual -> 'entities') e
    where label = 'controller-forbidden'), 0::bigint, 'escola fora da CRE não vaza entidades, inclusive filhos');

update public.registered_invoices set linked_asset_id = 'asset-other-school' where id = 'invoice-incoming';
set local role authenticated;
select pg_temp.capture_school('hidden-reference');
reset role;
select is((select actual -> 'entities' from school_reads where label = 'hidden-reference'), 'null'::jsonb,
    'FK não nulo com destino oculto por RLS não vira fatia completa');
select is((select actual -> 'fallback' from school_reads where label = 'hidden-reference'),
    '{"kind":"global","reason":"NON_ISOLATABLE_RELATION"}'::jsonb,
    'fallback de referência oculta não consulta usando SECURITY DEFINER');
select ok(not exists (select 1 from school_reads, jsonb_each(actual) e
    where label = 'hidden-reference' and e.value::text like '%asset-other-school%'), 'metadados do fallback não expõem o destino oculto');

update public.user_profiles set active = false where user_id = '00000000-0000-0000-0000-000000000997';
set local role authenticated;
select pg_temp.capture_school('inactive', '04.99.995', array['Resolvida']);
reset role;
select is((select actual -> 'entities' from school_reads where label = 'inactive'),
    (select expected from school_reads where label = 'inactive'), 'perfil inativo equivale à leitura global vazia');
select is((select sum(jsonb_array_length(e.value)) from school_reads, jsonb_each(actual -> 'entities') e
    where label = 'inactive'), 0::bigint, 'perfil inativo não recebe linhas de nenhuma coleção');

select * from finish();
rollback;
