begin;
set local role postgres;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(23);

select has_schema('radar_private', 'schema interno de autorização existe');
select ok(
    not has_schema_privilege('anon', 'radar_private', 'USAGE'),
    'anon não acessa o schema interno'
);
select ok(
    has_schema_privilege('authenticated', 'radar_private', 'USAGE'),
    'authenticated acessa somente os helpers internos concedidos'
);

select is(
    (select prosecdef from pg_proc where oid = 'public.current_app_role()'::regprocedure),
    false,
    'wrapper público de papel é SECURITY INVOKER'
);
select is(
    (select prosecdef from pg_proc where oid = 'public.current_controller_id()'::regprocedure),
    false,
    'wrapper público de controlador é SECURITY INVOKER'
);
select is(
    (select prosecdef from pg_proc where oid = 'public.can_access_school(text)'::regprocedure),
    false,
    'wrapper público de leitura escolar é SECURITY INVOKER'
);
select is(
    (select prosecdef from pg_proc where oid = 'public.can_write_school(text)'::regprocedure),
    false,
    'wrapper público de escrita escolar é SECURITY INVOKER'
);
select is(
    (select prosecdef from pg_proc where oid = 'public.delete_invoice_with_effects(text,integer,boolean,integer,jsonb,integer,jsonb)'::regprocedure),
    false,
    'wrapper público de exclusão composta é SECURITY INVOKER'
);

select is(
    (select prosecdef from pg_proc where oid = 'radar_private.current_app_role()'::regprocedure),
    true,
    'implementação interna de papel preserva SECURITY DEFINER'
);
select is(
    (select prosecdef from pg_proc where oid = 'radar_private.current_controller_id()'::regprocedure),
    true,
    'implementação interna de controlador preserva SECURITY DEFINER'
);
select is(
    (select prosecdef from pg_proc where oid = 'radar_private.can_access_school(text)'::regprocedure),
    true,
    'implementação interna de leitura preserva SECURITY DEFINER'
);
select is(
    (select prosecdef from pg_proc where oid = 'radar_private.can_write_school(text)'::regprocedure),
    true,
    'implementação interna de escrita preserva SECURITY DEFINER'
);
select is(
    (select prosecdef from pg_proc where oid = 'radar_private.delete_invoice_with_effects_impl(text,integer,boolean,integer,jsonb,integer,jsonb)'::regprocedure),
    true,
    'implementação interna de exclusão preserva SECURITY DEFINER'
);

select ok(not has_function_privilege('anon', 'public.current_app_role()', 'EXECUTE'), 'anon não consulta papel');
select ok(not has_function_privilege('anon', 'public.can_access_school(text)', 'EXECUTE'), 'anon não consulta acesso escolar');
select ok(not has_function_privilege('anon', 'public.can_write_school(text)', 'EXECUTE'), 'anon não consulta escrita escolar');
select ok(
    not has_function_privilege('anon', 'public.delete_invoice_with_effects(text,integer,boolean,integer,jsonb,integer,jsonb)', 'EXECUTE'),
    'anon não executa exclusão composta'
);

select set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-000000000099","role":"authenticated"}',
    true
);
select is(public.current_app_role(), null::text, 'usuário autenticado sem perfil não recebe papel');
select is(public.current_controller_id(), null::text, 'usuário sem perfil não recebe controlador');
select is(public.can_access_school('04.31.001'), false, 'usuário sem perfil não lê escola');
select is(public.can_write_school('04.31.001'), false, 'usuário sem perfil não escreve escola');

select ok(
    (select qual ilike '%SELECT current_app_role()%' and qual ilike '%SELECT auth.uid()%'
       from pg_policies where schemaname='public' and tablename='schools' and policyname='schools_read'),
    'schools_read usa init plans para identidade e papel'
);
select ok(
    (select with_check ilike '%SELECT current_app_role()%' and with_check ilike '%SELECT auth.uid()%'
       from pg_policies where schemaname='public' and tablename='assets' and policyname='assets_insert'),
    'assets_insert usa init plans para identidade e papel'
);

select * from finish();
rollback;
