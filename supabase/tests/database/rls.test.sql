begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(12);

select ok(
    (select relrowsecurity from pg_class where oid = 'public.schools'::regclass),
    'RLS está ativa em schools'
);
select ok(
    (select relrowsecurity from pg_class where oid = 'public.registered_invoices'::regclass),
    'RLS está ativa em registered_invoices'
);
select ok(
    (select relrowsecurity from pg_class where oid = 'public.assets'::regclass),
    'RLS está ativa em assets'
);
select ok(
    exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'schools' and policyname = 'schools_read'),
    'política de leitura de escolas existe'
);
select ok(
    exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'registered_invoices' and policyname = 'registered_invoices_update'),
    'política de atualização de notas existe'
);
select ok(
    exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'assets' and policyname = 'assets_update'),
    'política de atualização de bens existe'
);
select ok(
    has_function_privilege(
        'authenticated',
        'public.save_invoice_with_effects(jsonb,jsonb,jsonb,integer,integer,integer,jsonb)',
        'EXECUTE'
    ),
    'authenticated executa a RPC de salvamento'
);
select ok(
    not has_function_privilege(
        'anon',
        'public.save_invoice_with_effects(jsonb,jsonb,jsonb,integer,integer,integer,jsonb)',
        'EXECUTE'
    ),
    'anon não executa a RPC de salvamento'
);
select ok(
    has_function_privilege(
        'authenticated',
        'public.delete_invoice_with_effects(text,integer,boolean,integer,jsonb,integer,jsonb)',
        'EXECUTE'
    ),
    'authenticated pode invocar a RPC de remoção, sujeita à autorização interna'
);
select ok(
    not has_function_privilege(
        'anon',
        'public.delete_invoice_with_effects(text,integer,boolean,integer,jsonb,integer,jsonb)',
        'EXECUTE'
    ),
    'anon não executa a RPC de remoção'
);
select is(
    (select prosecdef from pg_proc where oid = 'public.save_invoice_with_effects(jsonb,jsonb,jsonb,integer,integer,integer,jsonb)'::regprocedure),
    false,
    'RPC de salvamento é SECURITY INVOKER'
);
select is(
    (select prosecdef from pg_proc where oid = 'public.delete_invoice_with_effects(text,integer,boolean,integer,jsonb,integer,jsonb)'::regprocedure),
    true,
    'RPC de remoção é SECURITY DEFINER com autorização interna e escopo fixo'
);

select * from finish();
rollback;
