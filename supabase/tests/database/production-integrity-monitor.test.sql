begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(16);

select has_function(
    'radar_private',
    'production_integrity_check',
    array[]::text[],
    'implementação interna da auditoria existe'
);
select has_function(
    'public',
    'production_integrity_check',
    array[]::text[],
    'RPC pública da auditoria existe'
);
select is(
    (select prosecdef from pg_proc where oid = 'radar_private.production_integrity_check()'::regprocedure),
    true,
    'implementação interna usa SECURITY DEFINER'
);
select is(
    (select prosecdef from pg_proc where oid = 'public.production_integrity_check()'::regprocedure),
    false,
    'wrapper público usa SECURITY INVOKER'
);
select ok(
    not has_function_privilege('anon', 'public.production_integrity_check()', 'EXECUTE'),
    'anon não executa auditoria'
);
select ok(
    not has_function_privilege('authenticated', 'public.production_integrity_check()', 'EXECUTE'),
    'authenticated não executa auditoria privilegiada'
);
select ok(
    has_function_privilege('service_role', 'public.production_integrity_check()', 'EXECUTE'),
    'service_role executa auditoria agregada'
);

select is(
    (public.production_integrity_check()->>'schemaVersion')::integer,
    1,
    'payload usa schemaVersion 1'
);
select is(
    (public.production_integrity_check()->'checks'->>'active_controllers_without_user_id')::integer,
    2,
    'seed local evidencia dois controladores ainda sem identidade Auth'
);
select is(
    (public.production_integrity_check()->'checks'->>'active_inventory_without_user_id')::integer,
    1,
    'seed local evidencia um integrante do Inventário ainda sem identidade Auth'
);
select is(
    (public.production_integrity_check()->>'totalIssues')::integer,
    3,
    'auditoria soma as três inconsistências intencionais do seed pré-Auth'
);
select is(
    public.production_integrity_check()->>'status',
    'issues_detected',
    'auditoria classifica seed pré-Auth como inconsistente'
);

insert into auth.users (id, email) values
    ('00000000-0000-0000-0000-000000000971', 'integrity-controller-local@example.test'),
    ('00000000-0000-0000-0000-000000000972', 'integrity-controller-other@example.test'),
    ('00000000-0000-0000-0000-000000000973', 'integrity-inventory@example.test');

update public.controllers
set user_id = case id
    when 'controller-local' then '00000000-0000-0000-0000-000000000971'::uuid
    when 'controller-other' then '00000000-0000-0000-0000-000000000972'::uuid
end
where id in ('controller-local', 'controller-other');

update public.inventory_team_members
set user_id = '00000000-0000-0000-0000-000000000973'::uuid
where id = 'inventory-local';

select is(
    (public.production_integrity_check()->>'totalIssues')::integer,
    0,
    'diretório local torna-se íntegro após vincular as identidades'
);
select is(
    public.production_integrity_check()->>'status',
    'healthy',
    'auditoria classifica o estado reconciliado como saudável'
);

update public.controllers set user_id = null where id = 'controller-local';
select is(
    (public.production_integrity_check()->'checks'->>'active_controllers_without_user_id')::integer,
    1,
    'auditoria detecta regressão de vínculo no controlador'
);
select is(
    public.production_integrity_check()->>'status',
    'issues_detected',
    'regressão isolada volta a reprovar a integridade'
);

select * from finish();
rollback;
