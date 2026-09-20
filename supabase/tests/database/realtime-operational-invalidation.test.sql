begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(12);

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

select * from finish();
rollback;
