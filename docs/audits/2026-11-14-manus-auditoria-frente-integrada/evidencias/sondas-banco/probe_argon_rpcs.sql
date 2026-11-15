-- Sondas comportamentais das RPCs preview_operational_change / apply_operational_change (commit 55001ccd)
-- Executadas SOMENTE em PostgreSQL 17 descartável local. Nenhum ambiente remoto é tocado.
\set ON_ERROR_STOP 0
\pset tuples_only on
\pset format unaligned
set client_min_messages = warning;

-- ===== Fixture (como postgres, padrão de supabase/tests/database/inventory-terminal-delete.test.sql)
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000a001', 'probe-admin@example.test');
insert into public.user_profiles (user_id, profile_id) values ('00000000-0000-0000-0000-00000000a001', 'technical_admin');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a001', false);
insert into public.competences (id, label, exercise, bonus_deadline) values ('2039-05', 'Maio de 2039', 2039, '2039-06-15');
insert into public.programs (id, name) values ('PROBE', 'Programa sonda');
insert into public.schools (id, designation, denomination, cre, initial_competence, inep, cnpj, sici, inventory_process)
values ('04.99.901', '04.99.901', 'Escola Sonda', '4ª CRE', '2039-05', '33009901', '90.009.901/0001-41', 'SICI-901', 'PROC-901');
insert into public.verifications (id, school_id, competence_id, program_id, bonification, analysis)
values ('04.99.901::2039-05::PROBE', '04.99.901', '2039-05', 'PROBE', '{"notaFiscal":"Sim"}', '{"notaFiscal":"Incorreto"}');

create or replace function pg_temp.mk_invoice(p_suffix text, p_with_asset boolean) returns void language plpgsql as $$
begin
  if p_with_asset then
    perform public.save_invoice_with_effects(
      p_invoice => jsonb_build_object('id','nf-'||p_suffix,'school_id','04.99.901','competence_id','2039-05','program_id','PROBE',
        'verification_id','04.99.901::2039-05::PROBE','source_context_key','2039-05_PROBE','description','Notebook '||p_suffix,
        'expense_type','permanente','invoice_number','NF-'||p_suffix,'amount',900),
      p_asset => jsonb_build_object('id','asset-'||p_suffix,'school_id','04.99.901','competence_id','2039-05','description','Notebook '||p_suffix,
        'expense_type','permanente','invoice_number','NF-'||p_suffix,'amount',900,'status','Encaminhada','inventory_process','PROC-901'));
  else
    perform public.save_invoice_with_effects(
      p_invoice => jsonb_build_object('id','nf-'||p_suffix,'school_id','04.99.901','competence_id','2039-05','program_id','PROBE',
        'verification_id','04.99.901::2039-05::PROBE','source_context_key','2039-05_PROBE','description','Material '||p_suffix,
        'expense_type','consumo','invoice_number','NF-'||p_suffix,'amount',100));
  end if;
end $$;

select 'FIXTURE nf-a (consumo)        -> ' || coalesce((select 'ok' from (select pg_temp.mk_invoice('a', false)) x), 'falhou');
select 'FIXTURE nf-b (consumo, vizinha)-> ' || coalesce((select 'ok' from (select pg_temp.mk_invoice('b', false)) x), 'falhou');
select 'FIXTURE nf-c (permanente)      -> ' || coalesce((select 'ok' from (select pg_temp.mk_invoice('c', true)) x), 'falhou');
select 'FIXTURE nf-d (permanente inv.) -> ' || coalesce((select 'ok' from (select pg_temp.mk_invoice('d', true)) x), 'falhou');
update public.assets set status = 'Inventariada', inventoried_at = now() where id = 'asset-d';

insert into public.pendencies (id, school_id, competence_origin, program_id, document_key, status, next_actor, registered_invoice_id)
values ('pend-a', '04.99.901', '2039-05', 'PROBE', 'notaFiscal', 'Aberta', 'Escola', 'nf-a'),
       ('pend-ctx', '04.99.901', '2039-05', 'PROBE', 'notaFiscal', 'Aberta', 'Escola', null);
insert into public.pendency_attempts (id, pendency_id, attempt_number, submitted_at) values ('att-a1', 'pend-a', 1, now());
insert into public.pendency_contacts (id, school_id, pendency_id, contact_type, contact_date, description)
values ('cont-a1', '04.99.901', 'pend-a', 'email', current_date, 'Contato sonda');
select 'FIXTURE contagens: NFs=' || (select count(*) from public.registered_invoices where school_id='04.99.901')
    || ' pendencias=' || (select count(*) from public.pendencies where school_id='04.99.901')
    || ' bens=' || (select count(*) from public.assets where school_id='04.99.901');

-- ===== P1: privilégios
select 'P1 EXECUTE anon apply='||has_function_privilege('anon','public.apply_operational_change(jsonb,text,uuid)','execute')
    ||' anon preview='||has_function_privilege('anon','public.preview_operational_change(jsonb)','execute')
    ||' secdef='||(select prosecdef from pg_proc where proname='apply_operational_change');

-- ===== P2: anon (sem login) lê o plano de outra escola e apaga NF + pendência + tentativa + contato
select set_config('request.jwt.claim.sub', '', false);
set role anon;
select 'P2 preview como anon -> ' || public.preview_operational_change(
  '{"action":"delete_invoice","target":{"kind":"invoice","id":"nf-a","schoolId":"04.99.901","competence":"2039-05","programId":"PROBE"}}')::text;
select 'P2 apply como anon -> ' || public.apply_operational_change(
  '{"action":"delete_invoice","target":{"kind":"invoice","id":"nf-a","schoolId":"04.99.901","competence":"2039-05","programId":"PROBE"}}',
  (public.preview_operational_change('{"action":"delete_invoice","target":{"kind":"invoice","id":"nf-a","schoolId":"04.99.901","competence":"2039-05","programId":"PROBE"}}')->>'planDigest'),
  '11111111-1111-1111-1111-111111111111')::text;
reset role;
select 'P2 depois: nf-a existe=' || exists(select 1 from public.registered_invoices where id='nf-a')
    || ' pend-a existe=' || exists(select 1 from public.pendencies where id='pend-a')
    || ' att-a1 existe=' || exists(select 1 from public.pendency_attempts where id='att-a1')
    || ' cont-a1 existe=' || exists(select 1 from public.pendency_contacts where id='cont-a1')
    || ' nf-b (vizinha) existe=' || exists(select 1 from public.registered_invoices where id='nf-b')
    || ' | analysis da verificação=' || (select analysis::text from public.verifications where id='04.99.901::2039-05::PROBE')
    || ' ledger.actor_id=' || coalesce((select actor_id::text from radar_private.operational_correction_intent_ledger where operation_key='11111111-1111-1111-1111-111111111111'),'NULL');

-- ===== P3: exclusão de NF cujo bem está Inventariada (meta aprovada do T3)
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000a001', false);
do $$ declare r jsonb; d text; begin
  d := public.preview_operational_change('{"action":"delete_invoice","target":{"kind":"invoice","id":"nf-d","schoolId":"04.99.901","competence":"2039-05","programId":"PROBE"}}')->>'planDigest';
  r := public.apply_operational_change('{"action":"delete_invoice","target":{"kind":"invoice","id":"nf-d","schoolId":"04.99.901","competence":"2039-05","programId":"PROBE"}}', d, '22222222-2222-2222-2222-222222222222');
  raise warning 'P3 apply nf-d inventariada -> SUCESSO %', r;
exception when others then raise warning 'P3 apply nf-d inventariada -> ERRO [%] %', sqlstate, sqlerrm; end $$;

-- ===== P4: clear_analysis por documentKey (T2)
do $$ declare r jsonb; begin
  r := public.preview_operational_change('{"action":"clear_analysis","target":{"kind":"verification","schoolId":"04.99.901","competence":"2039-05","programId":"PROBE","documentKey":"notaFiscal"}}');
  raise warning 'P4 preview clear_analysis -> %', r;
exception when others then raise warning 'P4 preview clear_analysis -> ERRO [%] %', sqlstate, sqlerrm; end $$;

-- ===== P5: delete_context (T4)
do $$ declare r jsonb; begin
  r := public.preview_operational_change('{"action":"delete_context","target":{"kind":"context","schoolId":"04.99.901","competence":"2039-05","programId":"PROBE"}}');
  raise warning 'P5 preview delete_context -> %', r;
exception when others then raise warning 'P5 preview delete_context -> ERRO [%] %', sqlstate, sqlerrm; end $$;

-- ===== P6: ação inexistente / não implementada é "aplicada" com sucesso
do $$ declare r jsonb; d text; begin
  d := public.preview_operational_change('{"action":"acao_inventada","target":{"schoolId":"04.99.901","competence":"2039-05"}}')->>'planDigest';
  r := public.apply_operational_change('{"action":"acao_inventada","target":{"schoolId":"04.99.901","competence":"2039-05"}}', d, '33333333-3333-3333-3333-333333333333');
  raise warning 'P6 apply acao_inventada -> committed=% (ledger=%)', r->>'committed', (select count(*) from radar_private.operational_correction_intent_ledger where operation_key='33333333-3333-3333-3333-333333333333');
exception when others then raise warning 'P6 -> ERRO [%] %', sqlstate, sqlerrm; end $$;
do $$ declare r jsonb; d text; begin
  d := public.preview_operational_change('{"action":"correct_contact","target":{"id":"cont-x","schoolId":"04.99.901","competence":"2039-05"},"changes":{"description":"novo"}}')->>'planDigest';
  r := public.apply_operational_change('{"action":"correct_contact","target":{"id":"cont-x","schoolId":"04.99.901","competence":"2039-05"},"changes":{"description":"novo"}}', d, '44444444-4444-4444-4444-444444444444');
  raise warning 'P6b apply correct_contact -> committed=% deleted=%', r->>'committed', r->'deletedIdsByEntity';
exception when others then raise warning 'P6b -> ERRO [%] %', sqlstate, sqlerrm; end $$;

-- ===== P7: mesma operation_key com pedido DIFERENTE devolve recibo antigo, sem conflito
do $$ declare r jsonb; begin
  r := public.apply_operational_change('{"action":"delete_invoice","target":{"kind":"invoice","id":"nf-b","schoolId":"04.99.901","competence":"2039-05","programId":"PROBE"}}', 'qualquer-digest', '11111111-1111-1111-1111-111111111111');
  raise warning 'P7 reuso de chave com outro alvo -> recibo action=% (nf-b ainda existe=%)', r->>'action', exists(select 1 from public.registered_invoices where id='nf-b');
exception when others then raise warning 'P7 -> ERRO [%] %', sqlstate, sqlerrm; end $$;

-- ===== P8: delete_pendency / correct_analysis por id: análise continua Incorreto sem Pendência
do $$ declare r jsonb; d text; begin
  d := public.preview_operational_change('{"action":"correct_analysis","target":{"kind":"pendency","id":"pend-ctx","schoolId":"04.99.901","competence":"2039-05","programId":"PROBE","documentKey":"notaFiscal"},"changes":{"analysis":"Correto"}}')->>'planDigest';
  r := public.apply_operational_change('{"action":"correct_analysis","target":{"kind":"pendency","id":"pend-ctx","schoolId":"04.99.901","competence":"2039-05","programId":"PROBE","documentKey":"notaFiscal"},"changes":{"analysis":"Correto"}}', d, '55555555-5555-5555-5555-555555555555');
  raise warning 'P8 correct_analysis(Correto) -> pend-ctx existe=% | analysis=%', exists(select 1 from public.pendencies where id='pend-ctx'), (select analysis::text from public.verifications where id='04.99.901::2039-05::PROBE');
exception when others then raise warning 'P8 -> ERRO [%] %', sqlstate, sqlerrm; end $$;

-- ===== P9: digest não muda quando o CONTEÚDO de um registro do escopo muda (só IDs entram no digest)
do $$ declare d1 text; d2 text; begin
  d1 := public.preview_operational_change('{"action":"delete_invoice","target":{"kind":"invoice","id":"nf-c","schoolId":"04.99.901","competence":"2039-05","programId":"PROBE"}}')->>'planDigest';
  update public.registered_invoices set amount = amount + 1 where id = 'nf-c';
  update public.assets set status = 'Inventariada', inventoried_at = now() where id = 'asset-c';
  d2 := public.preview_operational_change('{"action":"delete_invoice","target":{"kind":"invoice","id":"nf-c","schoolId":"04.99.901","competence":"2039-05","programId":"PROBE"}}')->>'planDigest';
  raise warning 'P9 digest antes=% depois(valor alterado + bem inventariado)=% iguais=%', d1, d2, d1 = d2;
  update public.assets set status = 'Encaminhada', inventoried_at = null where id = 'asset-c';
exception when others then raise warning 'P9 -> ERRO [%] %', sqlstate, sqlerrm; end $$;
