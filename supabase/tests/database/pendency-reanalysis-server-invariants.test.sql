begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;

select plan(6);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000909', 'reanalyze-guard@example.test');
insert into public.user_profiles (user_id, profile_id)
values ('00000000-0000-0000-0000-000000000909', 'technical_admin');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000909', true);

insert into public.competences (id, label, exercise)
values ('2031-01', 'Janeiro 2031', 2031), ('2031-02', 'Fevereiro 2031', 2031);
insert into public.programs (id, name) values ('REANALYSIS_BASIC', 'Programa Reanálise');
insert into public.schools (id, designation, denomination, cre, initial_competence, inep, cnpj, sici)
values ('04.99.909', '04.99.909', 'Escola Reanálise', '4ª CRE', '2031-01', '33909909', '90.909.909/0001-09', 'SICI-REANALYSIS-909');

insert into public.verifications (id, school_id, competence_id, program_id, bonification, analysis)
values ('REANALYSIS-V1', '04.99.909', '2031-01', 'REANALYSIS_BASIC', '{}', '{"ata":"Não analisado"}');
insert into public.pendencies (id, school_id, competence_origin, program_id, document_key, status, payload)
values ('REANALYSIS-P1', '04.99.909', '2031-01', 'REANALYSIS_BASIC', 'ata', 'Aguardando reanálise', '{}');
select throws_ok($$
    select public.reanalyze_pendency_with_verification(
        '{"id":"REANALYSIS-P1","status":"Resolvida","resolved_at":"2031-01-20T12:00:00Z","notes":"Regularizada","payload":{}}'::jsonb,
        null,
        '{"id":"REANALYSIS-V1","analysis":{"ata":"Correto"},"payload":{}}'::jsonb,
        1, 1,
        '{"id":"log-reanalysis-null-attempt","school_id":"04.99.909","action":"Reanálise registrada","details":{}}'::jsonb
    )
$$, 'P0001', 'VALIDATION_ERROR: reanálise exige a tentativa aguardando mais recente', 'reanálise genérica rejeita chamada sem a tentativa aguardando mais recente');

insert into public.verifications (id, school_id, competence_id, program_id, bonification, analysis)
values ('REANALYSIS-V2', '04.99.909', '2031-01', 'REANALYSIS_BASIC', '{}', '{"ata":"Não analisado"}');
insert into public.pendencies (id, school_id, competence_origin, program_id, document_key, status, payload)
values ('REANALYSIS-P2', '04.99.909', '2031-01', 'REANALYSIS_BASIC', 'ata', 'Aguardando reanálise', '{}');
insert into public.pendency_attempts (id, pendency_id, attempt_number, submitted_at, observation, drive_url, errors, payload) values
('REANALYSIS-A2-OLD', 'REANALYSIS-P2', 1, '2031-01-10T12:00:00Z', 'Envio antigo', 'https://drive.example/old', '[]', '{}'),
('REANALYSIS-A2-LATEST', 'REANALYSIS-P2', 2, '2031-01-11T12:00:00Z', 'Envio atual', 'https://drive.example/latest', '[]', '{}');
select throws_ok($$
    select public.reanalyze_pendency_with_verification(
        '{"id":"REANALYSIS-P2","status":"Resolvida","resolved_at":"2031-01-20T12:00:00Z","payload":{}}'::jsonb,
        '{"id":"REANALYSIS-A2-OLD","pendency_id":"REANALYSIS-P2","attempt_number":1,"analyzed_at":"2031-01-20T12:00:00Z","result":"correto","errors":[],"payload":{}}'::jsonb,
        '{"id":"REANALYSIS-V2","analysis":{"ata":"Correto"},"payload":{}}'::jsonb,
        1, 1,
        '{"id":"log-reanalysis-old-attempt","school_id":"04.99.909","action":"Reanálise registrada","details":{}}'::jsonb
    )
$$, 'P0001', 'VALIDATION_ERROR: tentativa informada não é a tentativa aguardando mais recente', 'reanálise rejeita tentativa anterior quando há novo envio mais recente');

insert into public.verifications (id, school_id, competence_id, program_id, bonification, analysis) values
('REANALYSIS-V3', '04.99.909', '2031-01', 'REANALYSIS_BASIC', '{}', '{"ata":"Não analisado"}'),
('REANALYSIS-V3-WRONG', '04.99.909', '2031-02', 'REANALYSIS_BASIC', '{}', '{"ata":"Não analisado"}');
insert into public.pendencies (id, school_id, competence_origin, program_id, document_key, status, payload)
values ('REANALYSIS-P3', '04.99.909', '2031-01', 'REANALYSIS_BASIC', 'ata', 'Aguardando reanálise', '{}');
insert into public.pendency_attempts (id, pendency_id, attempt_number, submitted_at, observation, drive_url, errors, payload)
values ('REANALYSIS-A3', 'REANALYSIS-P3', 1, '2031-01-12T12:00:00Z', 'Envio atual', 'https://drive.example/context', '[]', '{}');
select throws_ok($$
    select public.reanalyze_pendency_with_verification(
        '{"id":"REANALYSIS-P3","status":"Resolvida","resolved_at":"2031-01-20T12:00:00Z","payload":{}}'::jsonb,
        '{"id":"REANALYSIS-A3","pendency_id":"REANALYSIS-P3","attempt_number":1,"analyzed_at":"2031-01-20T12:00:00Z","result":"correto","errors":[],"payload":{}}'::jsonb,
        '{"id":"REANALYSIS-V3-WRONG","analysis":{"ata":"Correto"},"payload":{}}'::jsonb,
        1, 1,
        '{"id":"log-reanalysis-wrong-context","school_id":"04.99.909","action":"Reanálise registrada","details":{}}'::jsonb
    )
$$, 'P0001', 'VALIDATION_ERROR: verificação não pertence ao contexto da Pendência', 'reanálise rejeita verificação de outra competência mesmo na mesma escola');

insert into public.verifications (id, school_id, competence_id, program_id, bonification, analysis)
values ('REANALYSIS-V4', '04.99.909', '2031-01', 'REANALYSIS_BASIC', '{}', '{"ata":"Não analisado"}');
insert into public.pendencies (id, school_id, competence_origin, program_id, document_key, status, payload)
values ('REANALYSIS-P4', '04.99.909', '2031-01', 'REANALYSIS_BASIC', 'ata', 'Aguardando reanálise', '{}');
insert into public.pendency_attempts (id, pendency_id, attempt_number, submitted_at, observation, drive_url, errors, payload)
values ('REANALYSIS-A4', 'REANALYSIS-P4', 1, '2031-01-13T12:00:00Z', 'Original da escola', 'https://drive.example/original', '[]', '{"origem":"escola"}');
select lives_ok($$
    select public.reanalyze_pendency_with_verification(
        '{"id":"REANALYSIS-P4","status":"Resolvida","resolved_at":"2031-01-20T12:00:00Z","notes":"Regularizada","payload":{}}'::jsonb,
        '{"id":"REANALYSIS-A4","pendency_id":"REANALYSIS-P4","attempt_number":1,"submitted_at":"2040-01-01T00:00:00Z","analyzed_at":"2031-01-20T12:00:00Z","result":"correto","observation":"tentativa de troca","drive_url":"https://evil.invalid/troca","errors":[],"payload":{"resultado":"correto","observacaoAnalise":"Conferido"}}'::jsonb,
        '{"id":"REANALYSIS-V4","analysis":{"ata":"Correto"},"payload":{}}'::jsonb,
        1, 1,
        '{"id":"log-reanalysis-happy","school_id":"04.99.909","action":"Reanálise registrada","details":{}}'::jsonb
    )
$$, 'reanálise válida conclui com a tentativa aguardando real');
select ok(
    (select status = 'Resolvida' from public.pendencies where id = 'REANALYSIS-P4')
    and (select result = 'correto' and observation = 'Original da escola' and drive_url = 'https://drive.example/original'
            and submitted_at = '2031-01-13T12:00:00Z'::timestamptz from public.pendency_attempts where id = 'REANALYSIS-A4')
    and (select analysis ->> 'ata' = 'Correto' from public.verifications where id = 'REANALYSIS-V4'),
    'reanálise válida preserva o envio da escola e atualiza somente análise e estado'
);

insert into public.verifications (id, school_id, competence_id, program_id, bonification, analysis)
values ('REANALYSIS-V5', '04.99.909', '2031-01', 'REANALYSIS_BASIC', '{}', '{"ata":"Não analisado"}');
insert into public.pendencies (id, school_id, competence_origin, program_id, document_key, status, payload)
values ('REANALYSIS-P5', '04.99.909', '2031-01', 'REANALYSIS_BASIC', 'ata', 'Aguardando reanálise', '{}');
insert into public.pendency_attempts (id, pendency_id, attempt_number, submitted_at, observation, drive_url, errors, payload)
values ('REANALYSIS-A5', 'REANALYSIS-P5', 1, '2031-01-14T12:00:00Z', 'Envio atual', 'https://drive.example/status', '[]', '{}');
select throws_ok($$
    select public.reanalyze_pendency_with_verification(
        '{"id":"REANALYSIS-P5","status":"Aberta","payload":{}}'::jsonb,
        '{"id":"REANALYSIS-A5","pendency_id":"REANALYSIS-P5","attempt_number":1,"analyzed_at":"2031-01-20T12:00:00Z","result":"correto","errors":[],"payload":{}}'::jsonb,
        '{"id":"REANALYSIS-V5","analysis":{"ata":"Correto"},"payload":{}}'::jsonb,
        1, 1,
        '{"id":"log-reanalysis-bad-status","school_id":"04.99.909","action":"Reanálise registrada","details":{}}'::jsonb
    )
$$, 'P0001', 'VALIDATION_ERROR: resultado e estado final da Pendência são incompatíveis', 'reanálise rejeita transição incompatível com o resultado');

select * from finish();
rollback;
