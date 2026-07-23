begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(11);

select has_extension('pg_jsonschema', 'pg_jsonschema está disponível');
select ok(public.radar_jsonb_matches('bonification', '{"ata":true}'::jsonb), 'bonificação válida aceita');
select ok(not public.radar_jsonb_matches('bonification', '[]'::jsonb), 'bonificação inválida rejeitada');
select ok(public.radar_jsonb_matches('analysis', '{"ata":"Correto"}'::jsonb), 'análise válida aceita');
select ok(public.radar_jsonb_matches('errors', '["Assinatura", {"codigo":"VALOR"}]'::jsonb), 'lista de erros válida aceita');
select ok(not public.radar_jsonb_matches('errors', '{"codigo":"VALOR"}'::jsonb), 'erros fora de array rejeitados');

insert into public.competences (id, label, exercise) values ('2029-01', 'Janeiro 2029', 2029);
insert into public.programs (id, name) values ('JSON_BASIC', 'Programa JSON');
insert into public.schools (id, designation, denomination, cre) values ('JSON-SCHOOL', '04.99.901', 'Escola JSON', '4ª CRE');

select throws_ok(
    $$insert into public.verifications (id, school_id, competence_id, program_id, bonification, analysis)
      values ('json-invalid', 'JSON-SCHOOL', '2029-01', 'JSON_BASIC', '[]'::jsonb, '{}'::jsonb)$$,
    '23514', null, 'constraint rejeita bonificação inválida'
);
select lives_ok(
    $$insert into public.verifications (id, school_id, competence_id, program_id, bonification, analysis, payload)
      values ('json-valid', 'JSON-SCHOOL', '2029-01', 'JSON_BASIC', '{}'::jsonb, '{}'::jsonb, '{"legado":true}'::jsonb)$$,
    'registro legado extensível permanece válido'
);
insert into public.pendencies (id, school_id, competence_origin, program_id, document_key, status, payload)
values ('json-p', 'JSON-SCHOOL', '2029-01', 'JSON_BASIC', 'ata', 'Aberta', '{}');
select throws_ok(
    $$insert into public.pendency_attempts (id, pendency_id, attempt_number, errors, payload)
      values ('attempt-invalid', 'json-p', 1, '{}'::jsonb, '{}'::jsonb)$$,
    '23514', null, 'constraint rejeita coleção de erros inválida'
);
select ok(to_regprocedure('public.radar_jsonb_matches(text,jsonb)') is not null, 'função compartilhada existe');
select ok((select count(*) >= 8 from pg_constraint where conname like '%_json_contract'), 'conjunto de constraints JSON foi aplicado');
select * from finish();
rollback;
