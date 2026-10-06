begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(8);

select ok(
    pg_get_functiondef('radar_private.broadcast_operational_invalidation()'::regprocedure)
        ilike '%schoolId%',
    'Broadcast operacional declara schoolId quando a escola afetada é determinável'
);

-- Exercita a função real com realtime.send real. A tabela temporária comprova
-- INSERT/UPDATE/DELETE sem depender de uma entidade de negócio específica.
create temporary table pr410_relevance_rows (
    school_id text,
    business_detail text
);
create trigger pr410_relevance_test
after insert or update or delete on pr410_relevance_rows
for each row execute function radar_private.broadcast_operational_invalidation();

insert into pr410_relevance_rows values ('PR410-SCHOOL', 'nao-transmitir');
update pr410_relevance_rows set business_detail = 'alterado';
delete from pr410_relevance_rows;

select ok(
    exists (
        select 1 from realtime.messages
         where topic = 'radar:operational'
           and event = 'operational-change'
           and private
           and payload @> '{"entity":"pr410_relevance_rows","operation":"insert","schoolId":"PR410-SCHOOL"}'::jsonb
    ),
    'INSERT envia a escola afetada no Broadcast privado'
);

select ok(
    exists (
        select 1 from realtime.messages
         where payload @> '{"entity":"pr410_relevance_rows","operation":"update","schoolId":"PR410-SCHOOL"}'::jsonb
    ),
    'UPDATE envia a escola afetada no Broadcast privado'
);

select ok(
    exists (
        select 1 from realtime.messages
         where payload @> '{"entity":"pr410_relevance_rows","operation":"delete","schoolId":"PR410-SCHOOL"}'::jsonb
    ),
    'DELETE usa OLD e preserva a escola afetada no Broadcast privado'
);

select ok(
    not exists (
        select 1 from realtime.messages
         where payload->>'entity' = 'pr410_relevance_rows'
           and (payload ? 'business_detail' or payload::text like '%nao-transmitir%')
    ),
    'Broadcast continua transportando apenas metadados de invalidação, sem dados de negócio'
);

-- pendency_attempts não tem school_id. O contrato deve derivar a escola pela
-- Pendência canônica e, se o pai já não existir, omitir schoolId para que o
-- cliente use o caminho global conservador.
insert into public.competences(id, label, exercise)
values ('2026-11', 'Novembro', 2026)
on conflict(id) do nothing;

insert into public.programs(id, name)
values ('PR410_RT_TEST', 'Programa teste Realtime #410');

insert into public.schools(
    id, designation, denomination, cre, initial_competence, inep, cnpj, sici
) values (
    'PR410-SCHOOL', '04.99.410', 'Escola teste Realtime #410', '4ª CRE',
    '2026-11', '33999410', '99.999.410/0001-10', 'SICI-PR410'
);

insert into public.pendencies(
    id, school_id, competence_origin, program_id, document_key, status,
    responsible_area, next_actor, reason, notes, payload
) values (
    'pr410-pendency', 'PR410-SCHOOL', '2026-11', 'PR410_RT_TEST', 'extCC', 'Aberta',
    'GAD', 'Escola', 'Teste Realtime #410', '', '{}'::jsonb
);

create temporary table pendency_attempts (pendency_id text);
create trigger pr410_attempt_test
after insert on pg_temp.pendency_attempts
for each row execute function radar_private.broadcast_operational_invalidation();

insert into pg_temp.pendency_attempts values ('pr410-pendency');

select ok(
    exists (
        select 1 from realtime.messages
         where payload @> '{"entity":"pendency_attempts","operation":"insert","schoolId":"PR410-SCHOOL"}'::jsonb
    ),
    'tentativa sem school_id deriva a escola pela Pendência canônica'
);

select ok(
    pg_get_functiondef('radar_private.broadcast_operational_invalidation()'::regprocedure)
        ilike '%public.pendencies%'
    and pg_get_functiondef('radar_private.broadcast_operational_invalidation()'::regprocedure)
        ilike '%pendency_id%',
    'derivação de tentativa consulta explicitamente a Pendência canônica'
);

create temporary table pr410_unknown_before as
select count(*) as n
  from realtime.messages
 where payload @> '{"entity":"pendency_attempts","operation":"insert"}'::jsonb
   and not payload ? 'schoolId';

insert into pg_temp.pendency_attempts values ('pr410-parent-already-deleted');

select is(
    (
        select count(*) from realtime.messages
         where payload @> '{"entity":"pendency_attempts","operation":"insert"}'::jsonb
           and not payload ? 'schoolId'
    ),
    (select n + 1 from pr410_unknown_before),
    'pai ausente emite invalidação conservadora sem inventar escola'
);

select * from finish();
rollback;
