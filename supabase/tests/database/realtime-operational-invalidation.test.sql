begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(20);

select ok(
    to_regprocedure('radar_private.broadcast_operational_invalidation()') is not null,
    'função privada de invalidação Realtime existe'
);

select ok(
    (select prosecdef
       from pg_proc
      where oid = 'radar_private.broadcast_operational_invalidation()'::regprocedure),
    'função de trigger executa como security definer'
);

select ok(
    not has_function_privilege('authenticated', 'radar_private.broadcast_operational_invalidation()', 'EXECUTE'),
    'cliente autenticado não executa diretamente a função de trigger'
);

select ok(
    exists (
        select 1
          from pg_policies
         where schemaname = 'realtime'
           and tablename = 'messages'
           and policyname = 'radar_operational_invalidations_receive'
           and cmd = 'SELECT'
           and roles @> array['authenticated']::name[]
           and coalesce(qual, '') ilike '%radar:operational%'
           and coalesce(qual, '') ilike '%extension%'
           and coalesce(qual, '') ilike '%current_app_role%'
    ),
    'canal privado possui policy de recepção restrita a usuário institucional ativo'
);

select ok(
    not exists (
        select 1
          from pg_policies
         where schemaname = 'realtime'
           and tablename = 'messages'
           and policyname like 'radar_operational_invalidations%'
           and cmd = 'INSERT'
    ),
    'cliente não recebe policy para publicar invalidações'
);

select ok(
    pg_get_functiondef('radar_private.broadcast_operational_invalidation()'::regprocedure)
        ilike '%realtime.send%'
    and pg_get_functiondef('radar_private.broadcast_operational_invalidation()'::regprocedure)
        ilike '%radar:operational%'
    and pg_get_functiondef('radar_private.broadcast_operational_invalidation()'::regprocedure)
        ilike '%operational-change%',
    'função emite Broadcast privado no tópico/evento canônicos'
);

select ok(
    pg_get_functiondef('radar_private.broadcast_operational_invalidation()'::regprocedure)
        ilike '%schoolId%',
    'Broadcast informa a escola afetada quando ela é determinável'
);

select ok(
    pg_get_functiondef('radar_private.broadcast_operational_invalidation()'::regprocedure)
        ilike '%pendency_attempts%'
    and pg_get_functiondef('radar_private.broadcast_operational_invalidation()'::regprocedure)
        ilike '%pendency_id%'
    and pg_get_functiondef('radar_private.broadcast_operational_invalidation()'::regprocedure)
        ilike '%public.pendencies%',
    'tentativas de Pendência derivam a escola pela Pendência de origem quando possível'
);

select has_trigger('public', 'verifications', 'verifications_operational_invalidation',
    'verificações invalidam outras sessões');
select has_trigger('public', 'registered_invoices', 'registered_invoices_operational_invalidation',
    'notas fiscais invalidam outras sessões');
select has_trigger('public', 'pendencies', 'pendencies_operational_invalidation',
    'pendências invalidam outras sessões');
select has_trigger('public', 'pendency_attempts', 'pendency_attempts_operational_invalidation',
    'tentativas invalidam outras sessões');
select has_trigger('public', 'pendency_contacts', 'pendency_contacts_operational_invalidation',
    'contatos invalidam outras sessões');
select has_trigger('public', 'assets', 'assets_operational_invalidation',
    'bens invalidam outras sessões');

-- Execute a função real e o realtime.send real, sem substituir funções do
-- schema gerenciado. Tudo, inclusive mensagens, é revertido no final do pgTAP.
create temporary table pr409_relevance_rows (school_id text, business_detail text);
create trigger pr409_relevance_test after insert or update or delete on pr409_relevance_rows
for each row execute function radar_private.broadcast_operational_invalidation();
insert into pr409_relevance_rows values ('PR409-SCHOOL', 'nao-transmitir');
update pr409_relevance_rows set business_detail = 'alterado';
delete from pr409_relevance_rows;

select ok(exists (select 1 from realtime.messages where topic = 'radar:operational'
    and event = 'operational-change' and private and payload @>
    '{"entity":"pr409_relevance_rows","operation":"insert","schoolId":"PR409-SCHOOL"}'::jsonb),
    'INSERT emite escola no Broadcast privado real');
select ok(exists (select 1 from realtime.messages where payload @>
    '{"entity":"pr409_relevance_rows","operation":"update","schoolId":"PR409-SCHOOL"}'::jsonb),
    'UPDATE emite escola no Broadcast real');
select ok(exists (select 1 from realtime.messages where payload @>
    '{"entity":"pr409_relevance_rows","operation":"delete","schoolId":"PR409-SCHOOL"}'::jsonb),
    'DELETE usa OLD e preserva escola no Broadcast real');
select ok(not exists (select 1 from realtime.messages where payload->>'entity' = 'pr409_relevance_rows'
    and (payload ? 'business_detail' or payload::text like '%nao-transmitir%')),
    'metadado de relevância não transporta o registro de negócio');

insert into public.competences(id,label,exercise) values ('2026-11','Novembro',2026) on conflict(id) do nothing;
insert into public.programs(id,name) values ('PR409_TEST','Programa teste relevância');
insert into public.schools(id,designation,denomination,cre,initial_competence)
values ('PR409-SCHOOL','04.99.409','Escola teste relevância','4ª CRE','2026-11');
insert into public.pendencies(id,school_id,competence_origin,program_id,document_key,status,
    responsible_area,next_actor,reason,notes,payload)
values ('pr409-pendency','PR409-SCHOOL','2026-11','PR409_TEST','extCC','Aberta',
    'GAD','Escola','Teste relevância','','{}'::jsonb);
-- A tabela temporária isola o contrato do trigger da criação de tentativa pela
-- RPC. O lookup deve continuar usando public.pendencies, nunca o search_path.
create temporary table pendency_attempts (pendency_id text);
create trigger pr409_attempt_test after insert on pg_temp.pendency_attempts
for each row execute function radar_private.broadcast_operational_invalidation();
insert into pg_temp.pendency_attempts values ('pr409-pendency');
select ok(exists (select 1 from realtime.messages where payload @>
    '{"entity":"pendency_attempts","operation":"insert","schoolId":"PR409-SCHOOL"}'::jsonb),
    'tentativa sem school_id deriva escola da Pendência canônica');
create temporary table pr409_unknown_before as select count(*) as n from realtime.messages
where payload @> '{"entity":"pendency_attempts","operation":"insert"}'::jsonb and not payload ? 'schoolId';
insert into pg_temp.pendency_attempts values ('pr409-parent-already-deleted');
select is((select count(*) from realtime.messages where payload @>
    '{"entity":"pendency_attempts","operation":"insert"}'::jsonb and not payload ? 'schoolId'),
    (select n + 1 from pr409_unknown_before),
    'pai ausente emite invalidação global conservadora, sem escola inventada');

select * from finish();
rollback;