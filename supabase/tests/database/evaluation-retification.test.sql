begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(1);

select ok(
    to_regprocedure('public.retify_verification_with_pendency_cancel(jsonb,integer,jsonb,integer,jsonb)') is not null,
    'RPC atômica de retificação de avaliação com cancelamento de Pendência existe'
);

select * from finish();
rollback;
