begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(13);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000922', 'verification-rpc@example.test');
insert into public.user_profiles (user_id, profile_id)
values ('00000000-0000-0000-0000-000000000922', 'technical_admin');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000922', true);

insert into public.programs (id, name) values ('VRPC_BASIC', 'Programa RPC Verificação');
insert into public.competences (id, label, exercise)
values ('2032-05', 'Maio 2032', 2032);
insert into public.schools (id, designation, denomination, cre)
values ('VRPC-SCHOOL', '04.99.922', 'Escola RPC Verificação', '4ª CRE');

select ok(
    to_regprocedure('public.save_verification_with_log(jsonb,integer,jsonb)') is not null,
    'RPC atômica de verificação existe'
);

select lives_ok($$
    select public.save_verification_with_log(
        '{
            "id":"VRPC-SCHOOL::2032-05::VRPC_BASIC",
            "school_id":"VRPC-SCHOOL",
            "competence_id":"2032-05",
            "program_id":"VRPC_BASIC",
            "bonification":{"extCC":"Sim"},
            "analysis":{"extCC":"Não analisado"},
            "bonus_result":null,
            "payload":{}
        }'::jsonb,
        null,
        '{
            "id":"VRPC-LOG-1",
            "school_id":"VRPC-SCHOOL",
            "action":"Bonificação Alterada",
            "details":{"document_key":"extCC"}
        }'::jsonb
    )
$$, 'insere verificação e log na mesma transação');

select is(
    (select bonification ->> 'extCC' from public.verifications where id = 'VRPC-SCHOOL::2032-05::VRPC_BASIC'),
    'Sim',
    'bonificação foi persistida'
);
select is(
    (select count(*)::integer from public.administrative_logs where id = 'VRPC-LOG-1'),
    1,
    'log administrativo foi persistido'
);
select is(
    (select actor_user_id::text from public.administrative_logs where id = 'VRPC-LOG-1'),
    '00000000-0000-0000-0000-000000000922',
    'autoria do log vem da sessão autenticada'
);
select is(
    (select row_version from public.verifications where id = 'VRPC-SCHOOL::2032-05::VRPC_BASIC'),
    1,
    'inserção inicia na versão 1'
);

select lives_ok($$
    select public.save_verification_with_log(
        '{
            "id":"VRPC-SCHOOL::2032-05::VRPC_BASIC",
            "school_id":"VRPC-SCHOOL",
            "competence_id":"2032-05",
            "program_id":"VRPC_BASIC",
            "bonification":{"extCC":"Não"},
            "analysis":{"extCC":"Não analisado"},
            "bonus_result":null,
            "payload":{}
        }'::jsonb,
        1,
        '{
            "id":"VRPC-LOG-2",
            "school_id":"VRPC-SCHOOL",
            "action":"Bonificação Alterada",
            "details":{"document_key":"extCC"}
        }'::jsonb
    )
$$, 'atualiza verificação com concorrência otimista');
select is(
    (select bonification ->> 'extCC' from public.verifications where id = 'VRPC-SCHOOL::2032-05::VRPC_BASIC'),
    'Não',
    'atualização altera a bonificação'
);
select is(
    (select row_version from public.verifications where id = 'VRPC-SCHOOL::2032-05::VRPC_BASIC'),
    2,
    'trigger eleva a versão após atualização'
);

select throws_ok($$
    select public.save_verification_with_log(
        '{
            "id":"VRPC-SCHOOL::2032-05::VRPC_BASIC",
            "school_id":"VRPC-SCHOOL",
            "competence_id":"2032-05",
            "program_id":"VRPC_BASIC",
            "bonification":{"extCC":"Sim"},
            "analysis":{},
            "payload":{}
        }'::jsonb,
        1,
        null
    )
$$, 'P0001', 'OPTIMISTIC_CONFLICT: verifications/VRPC-SCHOOL::2032-05::VRPC_BASIC', 'versão obsoleta é rejeitada');

select throws_ok($$
    select public.save_verification_with_log(
        '{
            "id":"VRPC-SCHOOL::2032-05::VRPC_BASIC-ROLLBACK",
            "school_id":"VRPC-SCHOOL",
            "competence_id":"2032-05",
            "program_id":"VRPC_BASIC",
            "bonification":{"extCC":"Sim"},
            "analysis":{},
            "payload":{}
        }'::jsonb,
        null,
        '{
            "id":"VRPC-BAD-LOG",
            "school_id":"OUTRA-ESCOLA",
            "action":"Bonificação Alterada",
            "details":{}
        }'::jsonb
    )
$$, 'P0001', 'VALIDATION_ERROR: log administrativo pertence a outra escola', 'log inválido aborta a transação completa');
select is(
    (select count(*)::integer from public.verifications where id = 'VRPC-SCHOOL::2032-05::VRPC_BASIC-ROLLBACK'),
    0,
    'verificação não fica gravada após rollback'
);
select is(
    (select count(*)::integer from public.administrative_logs where id = 'VRPC-BAD-LOG'),
    0,
    'log inválido também não fica gravado'
);

set local role anon;
select throws_ok($$
    select public.save_verification_with_log(
        '{
            "id":"VRPC-ANON",
            "school_id":"VRPC-SCHOOL",
            "competence_id":"2032-05",
            "program_id":"VRPC_BASIC",
            "bonification":{},
            "analysis":{},
            "payload":{}
        }'::jsonb,
        null,
        null
    )
$$, '42501', null, 'papel anônimo não executa a RPC');
reset role;

select * from finish();
rollback;
