begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(14);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000991', 'evaluation-retification@example.test');
insert into public.user_profiles (user_id, profile_id)
values ('00000000-0000-0000-0000-000000000991', 'technical_admin');

insert into public.programs (id, name)
values ('RETIF_BASIC', 'Programa Retificação');
insert into public.competences (id, label, exercise)
values ('2039-05', 'Maio 2039', 2039);
insert into public.schools (id, designation, denomination, cre, inep, cnpj, sici)
values (
    'RETIF-SCHOOL', '04.99.991', 'Escola Retificação', '4ª CRE',
    '33991991', '99.991.991/0001-91', 'SICI-RETIF-991'
);

insert into public.verifications (
    id, school_id, competence_id, program_id, bonification, analysis, bonus_result, payload
) values (
    'RETIF-SCHOOL::2039-05::RETIF_BASIC',
    'RETIF-SCHOOL',
    '2039-05',
    'RETIF_BASIC',
    '{"extCC":"Sim"}'::jsonb,
    '{"extCC":"Incorreto"}'::jsonb,
    null,
    '{}'::jsonb
);

insert into public.pendencies (
    id, school_id, competence_origin, program_id, document_key, status,
    responsible_area, next_actor, reason, notes, opened_at, payload
) values (
    'RETIF-PEND-1',
    'RETIF-SCHOOL',
    '2039-05',
    'RETIF_BASIC',
    'extCC',
    'Aberta',
    'Escola',
    'Escola',
    'Documento incorreto',
    'Pendência originada da avaliação lançada por engano.',
    '2039-05-10T12:00:00Z',
    '{"historico":[{"id":"RETIF-EVENT-OPEN","tipo":"abertura","detalhe":"Pendência aberta originalmente."}],"tentativas":[]}'::jsonb
);

select ok(
    to_regprocedure('public.retify_verification_with_pendency_cancel(jsonb,integer,jsonb,integer,jsonb,jsonb)') is not null,
    'RPC atômica de retificação formal de avaliação com anulação de Pendência existe'
);

select ok(
    to_regprocedure('public.retify_verification_with_pendency_cancel(jsonb,integer,jsonb,integer,jsonb)') is null,
    'não existe assinatura antiga capaz de contornar confirmação e justificativa da retificação'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000991', true);

select throws_ok($$
    select public.retify_verification_with_pendency_cancel(
        '{"id":"RETIF-SCHOOL::2039-05::RETIF_BASIC","school_id":"RETIF-SCHOOL","competence_id":"2039-05","program_id":"RETIF_BASIC","bonification":{"extCC":"Sim"},"analysis":{"extCC":"Correto"},"bonus_result":null,"payload":{}}'::jsonb,
        1,
        '{"id":"RETIF-PEND-1","school_id":"RETIF-SCHOOL","competence_origin":"2039-05","program_id":"RETIF_BASIC","document_key":"extCC","status":"Cancelada","responsible_area":"Escola","reason":"Documento incorreto","notes":"Pendência originada da avaliação lançada por engano.","payload":{}}'::jsonb,
        1,
        '{"id":"RETIF-LOG-BAD","school_id":"RETIF-SCHOOL","action":"Avaliação técnica retificada","details":{"documentKey":"extCC"}}'::jsonb,
        '{"kind":"retificacao_avaliacao","origin":"avaliacao_tecnica","previousAnalysis":"Incorreto","newAnalysis":"Correto","justification":"","confirmed":true}'::jsonb
    )
$$, 'P0001', 'RETIFICATION_JUSTIFICATION_REQUIRED: justificativa da retificação é obrigatória', 'servidor rejeita confirmação sem justificativa');

select is(
    (select analysis ->> 'extCC' from public.verifications where id = 'RETIF-SCHOOL::2039-05::RETIF_BASIC'),
    'Incorreto',
    'falha de validação preserva a avaliação anterior'
);
select is(
    (select status from public.pendencies where id = 'RETIF-PEND-1'),
    'Aberta',
    'falha de validação preserva a Pendência ativa'
);

select lives_ok($$
    select public.retify_verification_with_pendency_cancel(
        '{"id":"RETIF-SCHOOL::2039-05::RETIF_BASIC","school_id":"RETIF-SCHOOL","competence_id":"2039-05","program_id":"RETIF_BASIC","bonification":{"extCC":"Sim"},"analysis":{"extCC":"Correto"},"bonus_result":null,"payload":{}}'::jsonb,
        1,
        '{"id":"RETIF-PEND-1","school_id":"RETIF-SCHOOL","competence_origin":"2039-05","program_id":"RETIF_BASIC","document_key":"extCC","status":"Cancelada","responsible_area":"Escola","reason":"Documento incorreto","notes":"Pendência originada da avaliação lançada por engano.","payload":{}}'::jsonb,
        1,
        '{"id":"RETIF-LOG-OK","school_id":"RETIF-SCHOOL","action":"Avaliação técnica retificada","details":{"documentKey":"extCC","previousValue":"Incorreto","newValue":"Correto"}}'::jsonb,
        '{"kind":"retificacao_avaliacao","origin":"avaliacao_tecnica","previousAnalysis":"Incorreto","newAnalysis":"Correto","justification":"Avaliação marcada como Incorreto por engano após conferência do documento.","confirmed":true}'::jsonb
    )
$$, 'retificação confirmada grava avaliação, anulação especial e auditoria na mesma transação');

select is(
    (select analysis ->> 'extCC' from public.verifications where id = 'RETIF-SCHOOL::2039-05::RETIF_BASIC'),
    'Correto',
    'avaliação técnica foi retificada'
);
select is(
    (select status from public.pendencies where id = 'RETIF-PEND-1'),
    'Cancelada',
    'estado técnico da Pendência passa a Cancelada'
);
select is(
    (select payload -> 'cancelamento' ->> 'tipo' from public.pendencies where id = 'RETIF-PEND-1'),
    'retificacao_avaliacao',
    'causa do encerramento identifica retificação da avaliação'
);
select is(
    (select payload -> 'cancelamento' ->> 'rotulo' from public.pendencies where id = 'RETIF-PEND-1'),
    'Anulada por edição da avaliação',
    'registro persistido contém o rótulo operacional específico'
);
select is(
    (select payload -> 'cancelamento' ->> 'justificativa' from public.pendencies where id = 'RETIF-PEND-1'),
    'Avaliação marcada como Incorreto por engano após conferência do documento.',
    'justificativa informada pelo usuário é preservada'
);
select is(
    (select jsonb_array_length(payload -> 'historico') from public.pendencies where id = 'RETIF-PEND-1'),
    2,
    'histórico anterior é preservado e recebe um evento de retificação'
);
select is(
    (select payload -> 'historico' -> 0 ->> 'id' from public.pendencies where id = 'RETIF-PEND-1'),
    'RETIF-EVENT-OPEN',
    'evento histórico original não é reescrito'
);
select is(
    (select count(*)::integer from public.administrative_logs where id = 'RETIF-LOG-OK'),
    1,
    'log administrativo da retificação é gravado'
);

select * from finish();
rollback;
