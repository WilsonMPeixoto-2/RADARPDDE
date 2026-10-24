begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;
select plan(13);

insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000009936', 'quality-provisional@example.test');
insert into public.user_profiles (user_id, profile_id)
values ('00000000-0000-0000-0000-000000009936', 'federal_assistant');
insert into public.competences (id, label, exercise, bonus_deadline)
values ('2038-04', 'Abril de 2038', 2038, '2038-05-15');
insert into public.programs (id, name)
values ('CONECTADA', 'Educação Conectada')
on conflict (id) do nothing;
insert into public.schools (id, designation, denomination, cre, initial_competence, inep, cnpj, sici)
values ('04.99.936', '04.99.936', 'Escola Qualidade', '4ª CRE', '2038-04',
        '33009936', '90.009.936/0001-01', 'SICI-QUAL-936');
insert into public.school_programs (id, school_id, program_id, active)
values ('quality-school-program-936', '04.99.936', 'CONECTADA', true);
insert into public.verifications (id, school_id, competence_id, program_id, bonification, analysis)
values ('04.99.936::2038-04::CONECTADA', '04.99.936', '2038-04', 'CONECTADA',
        '{}'::jsonb, '{}'::jsonb);

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000009936',true);

insert into public.quality_provisional_movements(id, school_id, competence_id)
values ('f0000000-0000-4000-8000-000000000936','04.99.936','2038-04');

select is((select status from public.quality_provisional_movements where school_id='04.99.936'),
          'open','movimentacao sem campos opcionais pode ser registrada');
select is((select count(*)::int from public.registered_invoices where school_id='04.99.936'),0,
          'cadastro provisório nao cria NF');
select is((select count(*)::int from public.pendencies where school_id='04.99.936'),0,
          'cadastro provisório nao cria Pendencia');
select is((select bonification from public.verifications where school_id='04.99.936'),
          '{}'::jsonb,'bonificacao continua vazia');

update public.quality_provisional_movements
set description='Debito do extrato', amount=150
where school_id='04.99.936';
select is((select row_version from public.quality_provisional_movements where school_id='04.99.936'),2,
          'edicao atualiza a versao do provisório');

create temporary table identified_result(value jsonb);
insert into identified_result
select public.identify_quality_provisional_movement(
  p_provisional_id => 'f0000000-0000-4000-8000-000000000936'::uuid,
  p_expected_provisional_version => 2,
  p_operation_key => '11111111-2222-4333-8444-555555559936'::uuid,
  p_invoice => jsonb_build_object(
      'id','quality-invoice-936',
      'school_id','04.99.936',
      'competence_id','2038-04',
      'program_id','CONECTADA',
      'verification_id','04.99.936::2038-04::CONECTADA',
      'source_context_key','2038-04_CONECTADA',
      'description','Material confirmado',
      'expense_type','consumo',
      'invoice_number','NF-936',
      'amount',150,
      'registered_at','2038-04-15T12:00:00Z'
  ),
  p_verification_patch => jsonb_build_object(
      'id','04.99.936::2038-04::CONECTADA',
      'analysis','{}'::jsonb
  ),
  p_expected_verification_version => 1,
  p_administrative_log => jsonb_build_object(
      'id','quality-log-936',
      'action','Gasto Consumo Cadastrado',
      'details',jsonb_build_object('invoice','quality-invoice-936'),
      'event_at','2038-04-15T12:00:00Z'
  )
);

select is((select status from public.quality_provisional_movements where school_id='04.99.936'),
          'identified','provisorio foi identificado');
select is((select registered_invoice_id from public.quality_provisional_movements where school_id='04.99.936'),
          'quality-invoice-936','identificacao vinculada a NF no mesmo registro');
select is((select count(*)::int from public.registered_invoices where school_id='04.99.936'),1,
          'identificacao cria exatamente uma NF');
select is((select count(*)::int from public.pendencies where school_id='04.99.936'),0,
          'identificacao nao cria Pendencia artificial');
select is((select bonification from public.verifications where school_id='04.99.936'),
          '{}'::jsonb,'identificacao nao preenche bonificacao manual');
select is((select value ->> 'quality_provisional_status' from identified_result),'identified',
          'comando confirma identificacao');

select throws_like(
  $$select public.identify_quality_provisional_movement(
    p_provisional_id => 'f0000000-0000-4000-8000-000000000936'::uuid,
    p_expected_provisional_version => 2,
    p_operation_key => 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeee9936'::uuid,
    p_invoice => '{"id":"quality-invoice-other","school_id":"04.99.936","competence_id":"2038-04","program_id":"CONECTADA","expense_type":"consumo"}'::jsonb
  )$$,
  'OPTIMISTIC_CONFLICT:%',
  'segunda identificacao com outra chave e rejeitada');

select is((select count(*)::int from public.registered_invoices where school_id='04.99.936'),1,
          'rejeicao nao duplica a NF');
select * from finish();
rollback;
