begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(2);

select ok(
    to_regprocedure('public.retify_verification_with_pendency_cancel(jsonb,integer,jsonb,integer,jsonb,jsonb)') is not null,
    'RPC atômica de retificação formal de avaliação com anulação de Pendência existe'
);

select ok(
    to_regprocedure('public.retify_verification_with_pendency_cancel(jsonb,integer,jsonb,integer,jsonb)') is null,
    'não existe assinatura antiga capaz de contornar confirmação e justificativa da retificação'
);

select * from finish();
rollback;
