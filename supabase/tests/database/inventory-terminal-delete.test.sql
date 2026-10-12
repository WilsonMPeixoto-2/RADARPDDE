begin;
set local role postgres;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(18);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000438', 'inventory-delete-terminal@example.test');
insert into public.user_profiles (user_id, profile_id)
values ('00000000-0000-0000-0000-000000000438', 'technical_admin');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000438', true);

insert into public.competences (id, label, exercise, bonus_deadline)
values ('2038-05', 'Maio de 2038', 2038, '2038-06-15');
insert into public.programs (id, name)
values ('TERM_DELETE', 'Programa proteção de exclusão terminal');
insert into public.schools (
    id, designation, denomination, cre, initial_competence, inep, cnpj, sici, inventory_process
) values (
    '04.99.438', '04.99.438', 'Escola Exclusão Terminal', '4ª CRE', '2038-05',
    '33009438', '90.009.438/0001-41', 'SICI-TERM-438', 'PROC-TERM-438'
);
insert into public.verifications (
    id, school_id, competence_id, program_id, bonification, analysis
) values (
    '04.99.438::2038-05::TERM_DELETE', '04.99.438', '2038-05', 'TERM_DELETE',
    '{"encampInventario":"Sim","notaFiscal":"Sim"}',
    '{"encampInventario":"Correto","notaFiscal":"Correto"}'
);

create function pg_temp.create_terminal_delete_fixture(p_suffix text)
returns void language plpgsql as $$
begin
    perform public.save_invoice_with_effects(
        p_invoice => jsonb_build_object(
            'id', 'invoice-term-delete-' || p_suffix, 'school_id', '04.99.438',
            'competence_id', '2038-05', 'program_id', 'TERM_DELETE',
            'verification_id', '04.99.438::2038-05::TERM_DELETE',
            'source_context_key', '2038-05_TERM_DELETE', 'description', 'Notebook ' || p_suffix,
            'expense_type', 'permanente', 'invoice_number', 'NF-TERM-' || p_suffix, 'amount', 900
        ),
        p_asset => jsonb_build_object(
            'id', 'asset-term-delete-' || p_suffix, 'school_id', '04.99.438',
            'competence_id', '2038-05', 'description', 'Notebook ' || p_suffix,
            'expense_type', 'permanente', 'invoice_number', 'NF-TERM-' || p_suffix,
            'amount', 900, 'status', 'Encaminhada', 'inventory_process', 'PROC-TERM-438'
        )
    );
end
$$;

select lives_ok(
    $$select pg_temp.create_terminal_delete_fixture('inventoried')$$,
    'cria documento e bem que serão inventariados'
);
select lives_ok(
    $$select pg_temp.create_terminal_delete_fixture('eligible')$$,
    'cria documento e bem ainda elegíveis à exclusão ordinária'
);
update public.assets
set status = 'Inventariada', inventoried_at = '2038-05-20T17:00:00Z'
where id = 'asset-term-delete-inventoried';

create temp table terminal_delete_before as
select
    (select to_jsonb(i) from public.registered_invoices i where id = 'invoice-term-delete-inventoried') as invoice,
    (select to_jsonb(a) from public.assets a where id = 'asset-term-delete-inventoried') as asset,
    (select to_jsonb(v) from public.verifications v where id = '04.99.438::2038-05::TERM_DELETE') as verification,
    (select count(*) from public.audit_events where record_id in (
        'invoice-term-delete-inventoried', 'asset-term-delete-inventoried'
    )) as audit_count;
grant select on terminal_delete_before to authenticated;

-- An accepted deletion deliberately throws a different SQLSTATE. pgTAP catches
-- it in its subtransaction, so even the RED cannot destroy the fixture and make
-- later cases accidentally test NOT_FOUND instead of the terminal invariant.
create function pg_temp.attempt_terminal_delete(p_route text)
returns void language plpgsql as $$
begin
    if p_route in ('rpc-with-asset', 'rpc-without-asset') then
        perform public.delete_invoice_with_effects(
            p_invoice_id => 'invoice-term-delete-inventoried',
            p_expected_invoice_version => (
                select row_version from public.registered_invoices where id = 'invoice-term-delete-inventoried'
            ),
            p_delete_linked_asset => p_route = 'rpc-with-asset',
            p_expected_asset_version => (
                select row_version from public.assets where id = 'asset-term-delete-inventoried'
            ),
            p_verification_patch => '{"analysis":{"encampInventario":"Correto"},"bonification":{"encampInventario":"Não se aplica"}}',
            p_expected_verification_version => (
                select row_version from public.verifications where id = '04.99.438::2038-05::TERM_DELETE'
            ),
            p_administrative_log => jsonb_build_object(
                'id', 'log-term-delete-' || p_route, 'action', 'Nota Fiscal Removida',
                'details', '{}'::jsonb, 'event_at', '2038-05-20T18:00:00Z'
            )
        );
    elsif p_route = 'direct-invoice' then
        delete from public.registered_invoices where id = 'invoice-term-delete-inventoried';
    elsif p_route = 'direct-asset' then
        delete from public.assets where id = 'asset-term-delete-inventoried';
    else
        raise exception 'INVALID_TEST_ROUTE';
    end if;
    raise exception using errcode = 'PZ001', message = 'TERMINAL_DELETE_UNEXPECTEDLY_ACCEPTED';
end
$$;

set local role authenticated;
select throws_ok(
    $$select pg_temp.attempt_terminal_delete('rpc-with-asset')$$,
    'P0001', 'ASSET_ALREADY_INVENTORIED: assets/asset-term-delete-inventoried',
    'RPC não exclui NF e bem já inventariado'
);
select throws_ok(
    $$select pg_temp.attempt_terminal_delete('rpc-without-asset')$$,
    'P0001', 'ASSET_ALREADY_INVENTORIED: assets/asset-term-delete-inventoried',
    'opção de preservar bem não permite apagar sua NF terminal'
);
select throws_ok(
    $$select pg_temp.attempt_terminal_delete('direct-invoice')$$,
    'P0001', 'ASSET_ALREADY_INVENTORIED: assets/asset-term-delete-inventoried',
    'DELETE direto de NF respeita patrimônio terminal'
);
select throws_ok(
    $$select pg_temp.attempt_terminal_delete('direct-asset')$$,
    'P0001', 'ASSET_ALREADY_INVENTORIED: assets/asset-term-delete-inventoried',
    'DELETE direto de bem respeita patrimônio terminal'
);
select is(
    (select to_jsonb(i) from public.registered_invoices i where id = 'invoice-term-delete-inventoried'),
    (select invoice from terminal_delete_before), 'recusa preserva NF completa e sua versão'
);
select is(
    (select to_jsonb(a) from public.assets a where id = 'asset-term-delete-inventoried'),
    (select asset from terminal_delete_before), 'recusa preserva bem, metadados terminais e versão'
);
select is(
    (select to_jsonb(v) from public.verifications v where id = '04.99.438::2038-05::TERM_DELETE'),
    (select verification from terminal_delete_before), 'recusa preserva projeção e versão da verificação'
);
select is(
    (select count(*)::integer from public.administrative_logs where id like 'log-term-delete-%'),
    0, 'recusa não registra exclusão fictícia'
);
select is(
    (select count(*) from public.audit_events where record_id in (
        'invoice-term-delete-inventoried', 'asset-term-delete-inventoried'
    )),
    (select audit_count from terminal_delete_before), 'recusa não altera trilha transacional'
);

select lives_ok(
    $$update public.registered_invoices set description = 'Notebook cadastral corrigido', amount = 950
      where id = 'invoice-term-delete-inventoried'$$,
    'proteção de exclusão não proíbe edição cadastral permitida da NF'
);
select is(
    (select status from public.assets where id = 'asset-term-delete-inventoried'),
    'Inventariada', 'edição cadastral conserva estado terminal'
);
select lives_ok(
    $$select public.delete_invoice_with_effects(
        p_invoice_id => 'invoice-term-delete-eligible',
        p_expected_invoice_version => (
            select row_version from public.registered_invoices where id = 'invoice-term-delete-eligible'
        ),
        p_delete_linked_asset => true,
        p_expected_asset_version => (
            select row_version from public.assets where id = 'asset-term-delete-eligible'
        )
    )$$,
    'NF sem histórico e bem pré-terminal continuam elegíveis à exclusão'
);
select is(
    (select count(*)::integer from public.registered_invoices where id = 'invoice-term-delete-eligible'),
    0, 'exclusão elegível remove NF'
);
select is(
    (select count(*)::integer from public.assets where id = 'asset-term-delete-eligible'),
    0, 'exclusão elegível remove bem pré-terminal'
);
select is(
    (select count(*)::integer from public.registered_invoices where id = 'invoice-term-delete-inventoried'),
    1, 'outro documento excluído não remove NF terminal'
);
select is(
    (select count(*)::integer from public.assets where id = 'asset-term-delete-inventoried'),
    1, 'outro documento excluído não remove bem terminal'
);

select * from finish();
rollback;
