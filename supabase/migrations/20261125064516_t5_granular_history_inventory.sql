-- T5: correção granular de fatos operacionais, com prévia, causalidade e recibo.
-- Não transforma registros existentes. Todas as mutações dependem do contrato
-- autenticado preview/apply e do livro-razão privado da própria transação.
begin;

create function radar_private.t5_correction_capability(p_action text,p_school text)
returns text language plpgsql stable security definer
set search_path=pg_catalog,public,radar_private as $$
declare actor_role text := radar_private.current_app_role();
begin
  if auth.uid() is null or p_school is null then
    raise exception 'AUTHORIZATION_DENIED: autenticação e escola são obrigatórias';
  end if;
  if p_action in ('correct_inventory','delete_asset') and actor_role='inventory'
     and p_school=any(radar_private.inventory_cre_school_ids()) then
    return actor_role;
  end if;
  return radar_private.operational_correction_capability(p_school);
end $$;
revoke all on function radar_private.t5_correction_capability(text,text) from public,anon,authenticated;

-- Somente diferenças reais entram na prévia. O executor aplica cada linha uma
-- única vez, mesmo quando vários campos mudam, preservando row_version.
create function radar_private.t5_row_changes(p_entity text,p_id text,p_before jsonb,p_after jsonb,p_fields text[])
returns jsonb language sql immutable set search_path=pg_catalog as $$
  select coalesce(jsonb_agg(jsonb_build_object('entity',p_entity,'id',p_id,
    'field',f,'before',p_before->f,'after',p_after->f) order by n),'[]'::jsonb)
  from unnest(p_fields) with ordinality as fields(f,n)
  where p_before->f is distinct from p_after->f
$$;
revoke all on function radar_private.t5_row_changes(text,text,jsonb,jsonb,text[]) from public,anon,authenticated;

create function radar_private.t5_attempt_status(p_attempt jsonb)
returns text language sql immutable set search_path=pg_catalog as $$
 select case
   when p_attempt #>> '{payload,status}'='substituida_antes_da_analise'
     and p_attempt->>'result' is null and p_attempt->>'analyzed_at' is null
     then 'substituida_antes_da_analise'
   when p_attempt->>'result' in ('correto','incorreto','arquivo_indisponivel')
     and p_attempt->>'analyzed_at' is not null then 'analisada'
   when p_attempt->>'result' is null and p_attempt->>'analyzed_at' is null
     and coalesce(p_attempt #>> '{payload,status}','aguardando')='aguardando' then 'aguardando'
 end
$$;
revoke all on function radar_private.t5_attempt_status(jsonb) from public,anon,authenticated;

-- Projeção pura sobre as linhas persistidas. Nunca renumera tentativas, muda
-- submitted_at/created_by, fabrica autores ou escolhe exclusões mais amplas.
create function radar_private.t5_rebuild_pendency(
 p_pendency jsonb,p_attempts jsonb,p_action text,p_target text,p_changes jsonb,
 p_verification jsonb,p_deadline date
) returns jsonb language plpgsql stable set search_path=pg_catalog,radar_private as $$
declare
 target_attempt jsonb; changed_attempt jsonb; next_attempts jsonb;
 latest_before jsonb; latest_after jsonb; previous_review jsonb;
 next_pendency jsonb := p_pendency; payload jsonb := coalesce(p_pendency->'payload','{}');
 next_payload jsonb; history jsonb := coalesce(payload->'historico','[]');
 next_history jsonb := '[]'; event jsonb; next_event jsonb; attempt jsonb;
 errors jsonb := '[]'; result_value text; status_value text; analysis_value text;
 semantic_change boolean := p_action in ('delete_attempt','delete_review');
 preserve_projection boolean := false; ambiguous boolean := false;
 latest_time timestamptz; event_time timestamptz; state_time timestamptz;
 state_type text; state_event jsonb; analysis_time text; is_late boolean := false;
 reopening_dominates boolean := false; remaining_time timestamptz;
 review_types text[] := array['reanalise_correta','reanalise_incorreta','arquivo_indisponivel'];
begin
 select a into target_attempt from jsonb_array_elements(p_attempts) a where a->>'id'=p_target;
 if target_attempt is null then raise exception 'NOT_FOUND: pendency_attempts/%',p_target; end if;
 changed_attempt:=target_attempt;
 if p_action in ('delete_review','correct_review')
    and radar_private.t5_attempt_status(target_attempt) is distinct from 'analisada' then
   raise exception 'VALIDATION_ERROR: a tentativa selecionada não possui reanálise concluída';
 end if;
 if p_action='delete_review' then
   changed_attempt:=changed_attempt||jsonb_build_object('result',null,'analyzed_at',null,'errors','[]'::jsonb,
     'payload',(coalesce(changed_attempt->'payload','{}')-array[
       'analisadoPor','analisadoPorId','authenticatedRoleAnalise','actingProfileAnalise'])
       ||jsonb_build_object('status','aguardando','dataAnalise',null,'resultado',null,
          'errosEncontrados','[]'::jsonb,'observacaoAnalise',''));
 elsif p_action='correct_review' then
   if p_changes ? 'result' then changed_attempt:=changed_attempt||jsonb_build_object('result',p_changes->'result'); end if;
   if p_changes ? 'analyzedAt' then
     changed_attempt:=changed_attempt||jsonb_build_object('analyzed_at',(p_changes->>'analyzedAt')::timestamptz);
   end if;
   if p_changes ? 'errors' then changed_attempt:=changed_attempt||jsonb_build_object('errors',p_changes->'errors'); end if;
   if (p_changes ? 'result' or p_changes ? 'errors') and changed_attempt->>'result'='correto' then
     changed_attempt:=changed_attempt||jsonb_build_object('errors','[]'::jsonb);
   end if;
   if (p_changes ? 'result' or p_changes ? 'errors') and changed_attempt->>'result'='arquivo_indisponivel' then
     changed_attempt:=changed_attempt||jsonb_build_object('errors',jsonb_build_array('Arquivo não localizado ou inacessível'));
   end if;
   if (p_changes ? 'result' or p_changes ? 'errors') and changed_attempt->>'result'='incorreto'
      and jsonb_array_length(coalesce(changed_attempt->'errors','[]'))=0 then
     raise exception 'VALIDATION_ERROR: reanálise incorreta exige ao menos um erro documental';
   end if;
   semantic_change:=(changed_attempt->'result',changed_attempt->'analyzed_at',changed_attempt->'errors')
      is distinct from (target_attempt->'result',target_attempt->'analyzed_at',target_attempt->'errors');
   next_payload:=coalesce(changed_attempt->'payload','{}')||jsonb_build_object(
     'status','analisada','dataAnalise',changed_attempt->'analyzed_at',
     'resultado',changed_attempt->'result','errosEncontrados',changed_attempt->'errors');
   if p_changes ? 'observation' then next_payload:=next_payload||jsonb_build_object('observacaoAnalise',p_changes->'observation'); end if;
   changed_attempt:=changed_attempt||jsonb_build_object('payload',next_payload);
 elsif p_action='correct_attempt' then
   if p_changes ? 'availableAt' then
     changed_attempt:=changed_attempt||jsonb_build_object('available_at',(p_changes->>'availableAt')::timestamptz);
     semantic_change:=radar_private.t5_attempt_status(target_attempt)='analisada'
       and changed_attempt->'available_at' is distinct from target_attempt->'available_at';
   end if;
   if p_changes ? 'driveUrl' then changed_attempt:=changed_attempt||jsonb_build_object('drive_url',p_changes->'driveUrl'); end if;
   if p_changes ? 'observation' then changed_attempt:=changed_attempt||jsonb_build_object('observation',p_changes->'observation'); end if;
   next_payload:=coalesce(changed_attempt->'payload','{}');
   if p_changes ? 'availableAt' then next_payload:=next_payload||jsonb_build_object('dataDisponibilizacao',left(changed_attempt->>'available_at',10)); end if;
   if p_changes ? 'driveUrl' then next_payload:=next_payload||jsonb_build_object('link',p_changes->'driveUrl'); end if;
   if p_changes ? 'observation' then
     next_payload:=next_payload||jsonb_build_object('observacao',p_changes->'observation');
     if next_payload ? 'observacaoEscola' then next_payload:=next_payload||jsonb_build_object('observacaoEscola',p_changes->'observation'); end if;
   end if;
   changed_attempt:=changed_attempt||jsonb_build_object('payload',next_payload);
 end if;

 select coalesce(jsonb_agg(case when a->>'id'=p_target then changed_attempt else a end
     order by (a->>'attempt_number')::int),'[]') into next_attempts
 from jsonb_array_elements(p_attempts) a where p_action<>'delete_attempt' or a->>'id'<>p_target;

 -- Histórico operativo usa identidade causal, nunca texto livre ou posição.
 for event in select value from jsonb_array_elements(history) loop
   next_event:=event;
   if event->>'tentativaId'=p_target then
     if p_action='delete_attempt' then continue; end if;
     if p_action='delete_review' and event->>'tipo'=any(review_types) then continue; end if;
     if p_action='correct_review' and event->>'tipo'=any(review_types) then
       if p_changes ? 'analyzedAt' then next_event:=next_event||jsonb_build_object('dataHora',changed_attempt->'analyzed_at'); end if;
       if p_changes ? 'observation' then next_event:=next_event||jsonb_build_object('observacao',p_changes->'observation'); end if;
       if p_changes ? 'result' or p_changes ? 'errors' then
         next_event:=next_event||jsonb_build_object('erros',changed_attempt->'errors','tipo',case changed_attempt->>'result'
           when 'correto' then 'reanalise_correta' when 'incorreto' then 'reanalise_incorreta' else 'arquivo_indisponivel' end,
         'detalhe',case changed_attempt->>'result' when 'correto' then 'Reanálise confirmou a correção do documento.'
           when 'incorreto' then 'Reanálise identificou erros no documento corrigido.'
           else 'Reanálise não localizou um arquivo acessível.' end);
       end if;
     end if;
     if p_action='correct_attempt' and event->>'tipo'='novo_envio' then
       if p_changes ? 'availableAt' then next_event:=next_event||jsonb_build_object('dataDisponibilizacao',left(changed_attempt->>'available_at',10)); end if;
       if p_changes ? 'driveUrl' then next_event:=next_event||jsonb_build_object('link',p_changes->'driveUrl'); end if;
       if p_changes ? 'observation' then next_event:=next_event||jsonb_build_object('observacao',p_changes->'observation'); end if;
     end if;
   end if;
   next_history:=next_history||jsonb_build_array(next_event);
 end loop;
 next_payload:=payload||jsonb_build_object('historico',next_history);
 -- O payload legado é espelho, nunca uma segunda fonte de tentativas antigas.
 select next_payload||jsonb_build_object('tentativas',coalesce(jsonb_agg(
   coalesce(a->'payload','{}')||jsonb_build_object('id',a->'id','numero',a->'attempt_number',
     'dataRegistro',a->'submitted_at','dataDisponibilizacao',left(coalesce(a->>'available_at',a->>'submitted_at'),10),
     'dataAnalise',a->'analyzed_at','resultado',a->'result','observacao',a->'observation',
     'link',a->'drive_url','errosEncontrados',a->'errors','createdBy',a->'created_by',
     'status',a #> '{payload,status}')
   order by (a->>'attempt_number')::int),'[]')) into next_payload
 from jsonb_array_elements(next_attempts) a;

 if semantic_change then
   if exists(select 1 from jsonb_array_elements(p_attempts) a where radar_private.t5_attempt_status(a) is null) then ambiguous:=true; end if;
   select a into latest_before from jsonb_array_elements(p_attempts) a
    where radar_private.t5_attempt_status(a)<>'substituida_antes_da_analise'
    order by (a->>'attempt_number')::int desc limit 1;
   if p_pendency->>'status'='Cancelada' then preserve_projection:=true;
   elsif latest_before is null then preserve_projection:=true;
   elsif latest_before->>'id'<>p_target then
     preserve_projection:=true;
     if radar_private.t5_attempt_status(latest_before)='aguardando'
       and radar_private.t5_attempt_status(target_attempt)='analisada' then ambiguous:=true; end if;
   else
     latest_time:=coalesce(latest_before->>'analyzed_at',latest_before->>'submitted_at')::timestamptz;
     for event in select value from jsonb_array_elements(history) where value->>'tipo' in ('cancelamento','reabertura') loop
       begin event_time:=(event->>'dataHora')::timestamptz;
       exception when invalid_datetime_format or datetime_field_overflow then event_time:=null; end;
       if event_time is null or latest_time is null or event_time=latest_time then ambiguous:=true;
       elsif state_time is null or event_time>state_time then
         state_time:=event_time; state_type:=event->>'tipo'; state_event:=event;
       end if;
     end loop;
     if state_time>latest_time then preserve_projection:=true; end if;
     status_value:=case radar_private.t5_attempt_status(latest_before)
       when 'aguardando' then 'Aguardando reanálise'
       when 'analisada' then case latest_before->>'result' when 'correto' then 'Resolvida' else 'Aberta' end end;
     if not preserve_projection and p_pendency->>'status' is distinct from status_value then ambiguous:=true; end if;
     if p_action='correct_review' and p_changes ? 'analyzedAt' and state_time is not null
       and ((changed_attempt->>'analyzed_at')::timestamptz>=state_time) is distinct from (latest_time>=state_time) then ambiguous:=true; end if;
   end if;
 end if;
 if ambiguous then return jsonb_build_object('ambiguity',jsonb_build_object('code','AMBIGUOUS_PENDENCY_HISTORY',
   'message','A sequência não comprova quais estados dependem desta avaliação. Escolha explicitamente o alcance da correção.'),
   'affectedAnalysis',null); end if;

 if semantic_change and not preserve_projection then
   select a into latest_after from jsonb_array_elements(next_attempts) a
     where radar_private.t5_attempt_status(a)<>'substituida_antes_da_analise'
     order by (a->>'attempt_number')::int desc limit 1;
   select a into previous_review from jsonb_array_elements(next_attempts) a
     where radar_private.t5_attempt_status(a)='analisada'
     order by (a->>'attempt_number')::int desc limit 1;
   remaining_time:=coalesce(latest_after->>'analyzed_at',latest_after->>'submitted_at')::timestamptz;
   if state_time is not null and (latest_after is null or state_time>=remaining_time) then
     if state_time=remaining_time or state_type is distinct from 'reabertura'
        or jsonb_typeof(state_event->'erros') is distinct from 'array' then
       return jsonb_build_object('ambiguity',jsonb_build_object('code','AMBIGUOUS_PENDENCY_HISTORY',
         'message','Um evento independente permanece depois do último envio ou análise preservado. Escolha explicitamente o alcance da correção.'),
         'affectedAnalysis',null);
     end if;
     if jsonb_array_length(state_event->'erros')=0 or exists(select 1 from jsonb_array_elements(state_event->'erros') e
         where jsonb_typeof(e)<>'string' or btrim(e#>>'{}')='') then
       return jsonb_build_object('ambiguity',jsonb_build_object('code','AMBIGUOUS_PENDENCY_HISTORY',
         'message','A reabertura remanescente não identifica os apontamentos que devem continuar. Escolha explicitamente o alcance da correção.'),
         'affectedAnalysis',null);
     end if;
     reopening_dominates:=true;
   end if;
   if latest_after is null then status_value:='Aberta';
   elsif radar_private.t5_attempt_status(latest_after)='aguardando' then status_value:='Aguardando reanálise';
   else status_value:=case latest_after->>'result' when 'correto' then 'Resolvida' else 'Aberta' end; end if;
   analysis_value:='Não analisado';
   if previous_review is not null then
     errors:=coalesce(previous_review->'errors','[]');
     if previous_review->>'result'='correto' then
       errors:='[]';
       is_late:=(p_deadline is not null and left(coalesce(previous_review->>'available_at',previous_review->>'submitted_at'),10)::date>p_deadline)
         or (p_verification->>'bonus_result' in ('apta','inapta')
          and p_verification #>> array['bonification',p_pendency->>'document_key']='Não');
       analysis_value:=case when coalesce(is_late,false) then 'Correto (Atrasado)' else 'Correto' end;
     else analysis_value:='Incorreto'; end if;
   elsif latest_after is null and (select count(*) from jsonb_array_elements(next_history) e
       where e->>'tipo'='abertura' and jsonb_typeof(e->'erros')='array')=1 then
     select e->'erros' into errors from jsonb_array_elements(next_history) e
       where e->>'tipo'='abertura' and jsonb_typeof(e->'erros')='array';
   end if;
   if reopening_dominates then status_value:='Aberta'; errors:=state_event->'erros'; end if;
   analysis_time:=case when status_value='Resolvida' then latest_after->>'analyzed_at' end;
   next_pendency:=next_pendency||jsonb_build_object('status',status_value,
     'responsible_area',case status_value when 'Resolvida' then '' when 'Aguardando reanálise' then 'Controlador' else 'Escola' end,
     'next_actor',case status_value when 'Resolvida' then '' when 'Aguardando reanálise' then 'Controlador' else 'Escola' end,
     'resolved_at',analysis_time,'canceled_at',null,'reason',coalesce(errors->>0,''));
   next_payload:=next_payload||jsonb_build_object('status',status_value,
     'responsavel',next_pendency->'responsible_area','proximoAtor',next_pendency->'next_actor',
     'dataResolucao',analysis_time,'cancelamento',null,'errosAtuais',errors,'motivo',coalesce(errors->>0,''),
     'responsible_area',next_pendency->'responsible_area','next_actor',next_pendency->'next_actor',
     'resolved_at',next_pendency->'resolved_at','canceled_at',next_pendency->'canceled_at',
     'reason',next_pendency->'reason');
 end if;
 next_pendency:=next_pendency||jsonb_build_object('payload',next_payload);
 return jsonb_build_object('pendency',next_pendency,'attempt',changed_attempt,'attempts',next_attempts,
   'affectedAnalysis',analysis_value,'ambiguity',null);
end $$;
revoke all on function radar_private.t5_rebuild_pendency(jsonb,jsonb,text,text,jsonb,jsonb,date) from public,anon,authenticated;

alter function radar_private.operational_correction_build_plan(jsonb) rename to operational_correction_build_plan_r5;
revoke all on function radar_private.operational_correction_build_plan_r5(jsonb) from public,anon,authenticated;

create function radar_private.operational_correction_build_plan(p_request jsonb)
returns jsonb language plpgsql stable security definer
set search_path=pg_catalog,public,radar_private as $$
declare
 req jsonb:=coalesce(p_request,'{}'); tgt jsonb:=coalesce(req->'target','{}');
 action_name text:=req->>'action'; changes jsonb:=coalesce(req->'changes','{}');
 school text:=nullif(btrim(tgt->>'schoolId'),''); item_id text:=nullif(btrim(tgt->>'id'),'');
 role_name text; expected_kind text; actual_target jsonb; allowed_fields text[]; k text;
 p public.pendencies%rowtype; a public.pendency_attempts%rowtype;
 c public.pendency_contacts%rowtype; asset public.assets%rowtype;
 invoice public.registered_invoices%rowtype; verification public.verifications%rowtype;
 attempts jsonb; projection jsonb; after_row jsonb; versions jsonb:='{}'; map jsonb;
 updates jsonb:='[]'; deletes jsonb:=jsonb_build_object('registered_invoices','[]'::jsonb,
  'pendencies','[]'::jsonb,'pendency_attempts','[]'::jsonb,'pendency_contacts','[]'::jsonb,'assets','[]'::jsonb);
 blockers jsonb:='[]'; warnings jsonb:='[]'; alternatives jsonb:='[]'; records jsonb:='{}';
 preserved jsonb:=jsonb_build_object('bonusResult',true,'fiscalBonification',true,
  'unrelatedRecords',true,'administrativeAudit',true,'originalAuthorship',true);
 deadline date; dependent_analysis text; field_name text; aggregate_value text;
 next_payload jsonb; before_value jsonb; delivery text; inventory_analysis text;
 next_status text; linked_invoices jsonb:='[]'; plan jsonb; linked_p public.pendencies%rowtype;
 rec record;
begin
 if action_name is null or action_name not in ('delete_attempt','delete_review','correct_attempt','correct_review',
   'delete_contact','correct_contact','correct_inventory','delete_asset') then
   return radar_private.operational_correction_build_plan_r5(p_request);
 end if;
 expected_kind:=case when action_name in ('delete_attempt','correct_attempt') then 'attempt'
  when action_name in ('delete_review','correct_review') then 'review'
  when action_name in ('delete_contact','correct_contact') then 'contact' else 'asset' end;
 if jsonb_typeof(req)<>'object' or req->'contractVersion' is distinct from '1'::jsonb
   or jsonb_typeof(tgt)<>'object' or tgt->>'kind' is distinct from expected_kind
   or item_id is null or school is null
   or exists(select 1 from jsonb_object_keys(req) x where x not in ('contractVersion','action','target','changes','note'))
   or exists(select 1 from jsonb_object_keys(tgt) x where x not in ('kind','id','schoolId','pendencyId','competence','programId','documentKey'))
   or (req ? 'note' and (jsonb_typeof(req->'note') not in ('string','null') or char_length(req->>'note')>2000)) then
   raise exception 'VALIDATION_ERROR: informe a ação, a identidade persistida e a escola do alvo';
 end if;
 role_name:=radar_private.t5_correction_capability(action_name,school);
 if jsonb_typeof(changes)<>'object' then raise exception 'VALIDATION_ERROR: changes deve ser um objeto'; end if;
 allowed_fields:=case action_name
   when 'correct_attempt' then array['availableAt','driveUrl','observation']
   when 'correct_review' then array['result','analyzedAt','errors','observation']
   when 'correct_contact' then array['contactType','contactDate','description','officialCharge','pendencyId']
   when 'correct_inventory' then array['status','inventoryProcess','inventoriedAt','inventoriedByMemberId','notes']
   else array[]::text[] end;
 if exists(select 1 from jsonb_object_keys(changes) x where not x=any(allowed_fields)) then
   raise exception 'VALIDATION_ERROR: changes contém campo fora do alcance da ação';
 end if;
 foreach k in array array['availableAt','driveUrl','observation','result','analyzedAt','contactType','contactDate','description','status','inventoryProcess','notes'] loop
   if changes ? k and jsonb_typeof(changes->k)<>'string' then raise exception 'VALIDATION_ERROR: campo % deve ser texto',k; end if;
 end loop;
 if changes ? 'officialCharge' and jsonb_typeof(changes->'officialCharge')<>'boolean' then raise exception 'VALIDATION_ERROR: cobrança oficial deve ser booleana'; end if;
 foreach k in array array['pendencyId','inventoriedAt','inventoriedByMemberId'] loop
   if changes ? k and jsonb_typeof(changes->k) not in ('string','null') then raise exception 'VALIDATION_ERROR: campo % inválido',k; end if;
 end loop;
 if changes ? 'result' and changes->>'result' not in ('correto','incorreto','arquivo_indisponivel') then raise exception 'VALIDATION_ERROR: resultado de reanálise inválido'; end if;
 if changes ? 'errors' then
   if jsonb_typeof(changes->'errors')<>'array' then raise exception 'VALIDATION_ERROR: erros devem ser uma lista'; end if;
   if exists(select 1 from jsonb_array_elements(changes->'errors') e where jsonb_typeof(e)<>'string' or btrim(e#>>'{}')='') then
     raise exception 'VALIDATION_ERROR: erros devem ser textos não vazios';
   end if;
   if changes->'errors' ? 'Documento ausente' and jsonb_array_length(changes->'errors')>1 then raise exception 'VALIDATION_ERROR: Documento ausente deve estar isolado'; end if;
 end if;
 foreach k in array array['availableAt','analyzedAt'] loop
   if changes ? k then
     if nullif(changes->>k,'') is null or not isfinite((changes->>k)::timestamptz) then raise exception 'VALIDATION_ERROR: data % inválida',k; end if;
   end if;
 end loop;

 if expected_kind in ('attempt','review') then
   select * into a from public.pendency_attempts where id=item_id;
   if not found then raise exception 'NOT_FOUND: pendency_attempts/%',item_id; end if;
   select * into strict p from public.pendencies where id=a.pendency_id;
   if p.school_id<>school then raise exception 'AUTHORIZATION_DENIED: tentativa não pertence à escola'; end if;
   actual_target:=jsonb_strip_nulls(jsonb_build_object('kind',expected_kind,'id',a.id,'schoolId',p.school_id,
     'pendencyId',p.id,'competence',p.competence_origin,'programId',p.program_id,'documentKey',p.document_key));
   versions:=jsonb_build_object('pendencies',jsonb_build_object(p.id,p.row_version));
   select coalesce(jsonb_agg(to_jsonb(t) order by t.attempt_number),'[]'),
     coalesce(jsonb_object_agg(t.id,t.row_version),'{}') into attempts,map
    from public.pendency_attempts t where t.pendency_id=p.id;
   versions:=versions||jsonb_build_object('pendency_attempts',map);
   select * into verification from public.verifications
    where school_id=p.school_id and competence_id=p.competence_origin and program_id is not distinct from p.program_id;
   if found then versions:=versions||jsonb_build_object('verifications',jsonb_build_object(verification.id,verification.row_version)); end if;
   select bonus_deadline into deadline from public.competences where id=p.competence_origin;
   select jsonb_build_object(p.competence_origin,row_version) into map from public.competences where id=p.competence_origin;
   versions:=versions||jsonb_build_object('competences',map);
   records:=jsonb_build_object('attempts',jsonb_build_array(jsonb_build_object('id',a.id,'pendencyId',p.id,
     'attemptNumber',a.attempt_number,'availableAt',a.available_at,'submittedAt',a.submitted_at,
     'result',a.result,'analyzedAt',a.analyzed_at,'observation',a.observation,'driveUrl',a.drive_url,
     'reviewObservation',a.payload->'observacaoAnalise')),
     'pendencies',jsonb_build_array(jsonb_build_object('id',p.id,'schoolId',p.school_id,'documentKey',p.document_key,
       'status',p.status,'competence',p.competence_origin,'programId',p.program_id)));
   projection:=radar_private.t5_rebuild_pendency(to_jsonb(p),attempts,action_name,item_id,changes,to_jsonb(verification),deadline);
   if projection->'ambiguity'<>'null'::jsonb then blockers:=blockers||jsonb_build_array(projection->'ambiguity');
   else
     if action_name='delete_attempt' then deletes:=jsonb_set(deletes,'{pendency_attempts}',jsonb_build_array(a.id));
     else updates:=updates||radar_private.t5_row_changes('pendency_attempts',a.id,to_jsonb(a),projection->'attempt',
       array['available_at','drive_url','observation','analyzed_at','result','errors','payload']); end if;
     updates:=updates||radar_private.t5_row_changes('pendencies',p.id,to_jsonb(p),projection->'pendency',
       array['status','responsible_area','next_actor','resolved_at','canceled_at','reason','payload']);
     dependent_analysis:=projection->>'affectedAnalysis';
     if dependent_analysis is not null then
       if verification.id is null then
         blockers:=blockers||jsonb_build_array(jsonb_build_object('code','AMBIGUOUS_PENDENCY_HISTORY',
           'message','A avaliação dependente não possui uma verificação mensal identificada. Escolha o histórico que será removido.'));
       elsif p.document_key in ('notaFiscal','consAssessoria') then
         select * into invoice from public.registered_invoices where id=p.registered_invoice_id;
         if invoice.id is null or (invoice.school_id,invoice.competence_id,invoice.program_id)
           is distinct from (p.school_id,p.competence_origin,p.program_id) then
           blockers:=blockers||jsonb_build_array(jsonb_build_object('code','AMBIGUOUS_PENDENCY_HISTORY',
             'message','O histórico não comprova a despesa individual desta avaliação. Escolha o registro pelo seu contexto.'));
         elsif invoice.expense_type='a_identificar' and dependent_analysis<>'Incorreto' then
           blockers:=blockers||jsonb_build_array(jsonb_build_object('code','MANDATORY_ANALYSIS',
             'message','A despesa ainda não identificada depende deste apontamento. Para remover o conjunto, exclua a própria despesa.'));
         else
           select coalesce(jsonb_object_agg(i.id,i.row_version),'{}') into map
             from radar_private.operational_correction_context_invoices(verification.id) i;
           versions:=versions||jsonb_build_object('registered_invoices',map);
           field_name:=case p.document_key when 'notaFiscal' then 'analiseDocumentoFiscal' else 'analiseConsultaAssessoria' end;
           if invoice.payload->>field_name is distinct from dependent_analysis then
             updates:=updates||jsonb_build_array(jsonb_build_object('entity','registered_invoices','id',invoice.id,
               'field','payload.'||field_name,'before',invoice.payload->field_name,'after',dependent_analysis));
           end if;
           if p.document_key='notaFiscal' then
             aggregate_value:=radar_private.operational_correction_invoice_aggregate(verification.id,array[]::text[],jsonb_build_object(invoice.id,dependent_analysis));
           else
             select case when bool_or(result='Incorreto') then 'Incorreto'
               when bool_or(result='Não analisado') then 'Não analisado'
               when bool_or(result='Correto (Atrasado)') then 'Correto (Atrasado)' else 'Correto' end into aggregate_value
             from (select case when i.id=invoice.id then dependent_analysis else
               radar_private.operational_correction_effective_analysis(i,'analiseConsultaAssessoria',verification) end result
               from radar_private.operational_correction_context_invoices(verification.id) i where i.expense_type='servico') q;
           end if;
           if verification.analysis->>p.document_key is distinct from aggregate_value then
             updates:=updates||jsonb_build_array(jsonb_build_object('entity','verifications','id',verification.id,
               'field','analysis.'||p.document_key,'before',verification.analysis->p.document_key,'after',aggregate_value));
           end if;
         end if;
       elsif p.document_key in ('extCC','extINV','boletoInternet','declBBAgil','encampInventario') then
         if verification.analysis->>p.document_key is distinct from dependent_analysis then
           updates:=updates||jsonb_build_array(jsonb_build_object('entity','verifications','id',verification.id,
             'field','analysis.'||p.document_key,'before',verification.analysis->p.document_key,'after',dependent_analysis));
         end if;
       end if;
       -- Outro histórico independente pode ser a origem da avaliação atual.
       if exists(select 1 from public.pendencies sibling where sibling.id<>p.id
         and sibling.school_id=p.school_id and sibling.competence_origin=p.competence_origin
         and sibling.program_id is not distinct from p.program_id and sibling.document_key=p.document_key
         and sibling.registered_invoice_id is not distinct from p.registered_invoice_id
         and (sibling.status in ('Aberta','Aguardando reanálise')
           or (sibling.status='Resolvida' and exists(select 1 from jsonb_array_elements(updates) u
             where u->>'entity' in ('verifications','registered_invoices'))))) then
         blockers:=blockers||jsonb_build_array(jsonb_build_object('code','AMBIGUOUS_PENDENCY_HISTORY',
           'message','Há outro histórico ativo deste mesmo item. Escolha explicitamente qual conjunto será removido.'));
       end if;
     end if;
   end if;
   if jsonb_array_length(blockers)>0 then
     alternatives:=jsonb_build_array(jsonb_build_object('action','delete_pendency','label','Excluir esta pendência e seu histórico vinculado',
       'target',jsonb_strip_nulls(jsonb_build_object('kind','pendency','id',p.id,'schoolId',p.school_id,
         'competence',p.competence_origin,'programId',p.program_id,'documentKey',p.document_key))));
     if p.program_id is not null and (p.document_key not in ('notaFiscal','consAssessoria') or p.registered_invoice_id is not null) then
       alternatives:=alternatives||jsonb_build_array(jsonb_build_object('action','clear_item_history','label','Excluir todo o histórico deste item',
         'target',jsonb_strip_nulls(jsonb_build_object('kind','analysis','id',p.registered_invoice_id,'schoolId',p.school_id,
           'competence',p.competence_origin,'programId',p.program_id,'documentKey',p.document_key))));
     end if;
     if invoice.id is not null and invoice.expense_type='a_identificar' then
       alternatives:=jsonb_build_array(jsonb_build_object('action','delete_invoice','label','Excluir a despesa não identificada e seus dependentes',
         'target',jsonb_build_object('kind','invoice','id',invoice.id,'schoolId',invoice.school_id,
           'competence',invoice.competence_id,'programId',invoice.program_id)));
     end if;
     updates:='[]'; deletes:=jsonb_set(deletes,'{pendency_attempts}','[]');
   end if;
 elsif expected_kind='contact' then
   select * into c from public.pendency_contacts where id=item_id;
   if not found then raise exception 'NOT_FOUND: pendency_contacts/%',item_id; end if;
   if c.school_id<>school then raise exception 'AUTHORIZATION_DENIED: contato não pertence à escola'; end if;
   if c.pendency_id is not null then select * into p from public.pendencies where id=c.pendency_id; end if;
   actual_target:=jsonb_strip_nulls(jsonb_build_object('kind','contact','id',c.id,'schoolId',c.school_id,
     'pendencyId',c.pendency_id,'competence',p.competence_origin,'programId',p.program_id,'documentKey',p.document_key));
   versions:=jsonb_build_object('pendency_contacts',jsonb_build_object(c.id,c.row_version));
   if p.id is not null then versions:=versions||jsonb_build_object('pendencies',jsonb_build_object(p.id,p.row_version)); end if;
   records:=jsonb_build_object('contacts',jsonb_build_array(jsonb_build_object('id',c.id,'pendencyId',c.pendency_id,
     'contactType',c.contact_type,'contactDate',c.contact_date,'description',c.description,'officialCharge',c.official_charge)));
   if action_name='delete_contact' then deletes:=jsonb_set(deletes,'{pendency_contacts}',jsonb_build_array(c.id));
   else
     after_row:=to_jsonb(c);
     if changes ? 'contactType' then
       if btrim(changes->>'contactType')='' then raise exception 'VALIDATION_ERROR: tipo de contato é obrigatório'; end if;
       after_row:=after_row||jsonb_build_object('contact_type',changes->'contactType');
     end if;
     if changes ? 'contactDate' then
       if changes->>'contactDate' !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'VALIDATION_ERROR: data do contato inválida'; end if;
       after_row:=after_row||jsonb_build_object('contact_date',(changes->>'contactDate')::date);
     end if;
     if changes ? 'description' then after_row:=after_row||jsonb_build_object('description',changes->'description'); end if;
     if changes ? 'officialCharge' then after_row:=after_row||jsonb_build_object('official_charge',changes->'officialCharge'); end if;
     if changes ? 'pendencyId' then
       if nullif(btrim(changes->>'pendencyId'),'') is not null then
         select * into linked_p from public.pendencies where id=changes->>'pendencyId';
         if linked_p.id is null or linked_p.school_id<>school then raise exception 'VALIDATION_ERROR: vínculo de contato deve pertencer à mesma escola'; end if;
         versions:=jsonb_set(versions,'{pendencies}',coalesce(versions->'pendencies','{}')||jsonb_build_object(linked_p.id,linked_p.row_version));
       end if;
       after_row:=after_row||jsonb_build_object('pendency_id',nullif(btrim(changes->>'pendencyId'),''));
     end if;
     after_row:=after_row||jsonb_build_object('payload',c.payload||jsonb_build_object(
       'tipo',after_row->'contact_type','dataAtendimento',after_row->'contact_date',
       'descricao',after_row->'description','desc',after_row->'description',
       'cobrancaOficial',after_row->'official_charge','cobrancaEnvioRegistro',after_row->'official_charge',
       'pendenciaId',after_row->'pendency_id',
       'contact_type',after_row->'contact_type','contact_date',after_row->'contact_date',
       'description',after_row->'description','official_charge',after_row->'official_charge',
       'pendency_id',after_row->'pendency_id'));
     updates:=updates||radar_private.t5_row_changes('pendency_contacts',c.id,to_jsonb(c),after_row,
       array['contact_type','contact_date','description','official_charge','pendency_id','payload']);
   end if;
   warnings:=jsonb_build_array(jsonb_build_object('code','EXTERNAL_MESSAGES_PRESERVED',
     'message','A correção afeta o registro do contato no RADAR. Mensagens já enviadas permanecem em seus canais.'));
 else
   select * into asset from public.assets where id=item_id;
   if not found then raise exception 'NOT_FOUND: assets/%',item_id; end if;
   if asset.school_id<>school then raise exception 'AUTHORIZATION_DENIED: bem não pertence à escola'; end if;
   actual_target:=jsonb_strip_nulls(jsonb_build_object('kind','asset','id',asset.id,'schoolId',asset.school_id,
     'competence',asset.competence_id,'programId',coalesce(asset.payload->>'programaId',asset.payload->>'programId'),'documentKey','encampInventario'));
   versions:=jsonb_build_object('assets',jsonb_build_object(asset.id,asset.row_version));
   records:=jsonb_build_object('assets',jsonb_build_array(jsonb_build_object('id',asset.id,'description',asset.description,
     'status',asset.status,'inventoryProcess',asset.inventory_process,'inventoriedAt',asset.inventoried_at,
     'inventoriedByMemberId',asset.inventoried_by_member_id,'notes',asset.notes)));
   select coalesce(jsonb_agg(to_jsonb(i) order by i.id),'[]'),coalesce(jsonb_object_agg(i.id,i.row_version),'{}')
     into linked_invoices,map from public.registered_invoices i where i.linked_asset_id=asset.id
       or i.payload->>'bemId'=asset.id or i.payload->>'linkedAssetId'=asset.id or i.payload->>'linked_asset_id'=asset.id;
   versions:=versions||jsonb_build_object('registered_invoices',map);
   if jsonb_array_length(linked_invoices)>0
     and (select count(distinct i->>'program_id') from jsonb_array_elements(linked_invoices) i)=1 then
     actual_target:=actual_target||jsonb_build_object('programId',linked_invoices #>> '{0,program_id}');
   end if;
   if exists(select 1 from jsonb_array_elements(linked_invoices) i where i->>'school_id'<>school) then
     blockers:=blockers||jsonb_build_array(jsonb_build_object('code','ASSET_CONTEXT_CONFLICT',
       'message','O vínculo patrimonial aponta para outra escola e precisa ser corrigido antes desta operação.'));
   end if;
   if action_name='correct_inventory' and exists(select 1 from jsonb_array_elements(linked_invoices) i
       where i->>'linked_asset_id' is distinct from asset.id) then
     blockers:=blockers||jsonb_build_array(jsonb_build_object('code','ASSET_LEGACY_LINK_CONFLICT',
       'message','A despesa referencia este bem somente no histórico legado. Corrija o vínculo individual da despesa antes de alterar a projeção patrimonial.'));
   end if;
   if action_name='delete_asset' then
     if jsonb_array_length(linked_invoices)>0 then
       blockers:=blockers||jsonb_build_array(jsonb_build_object('code','ASSET_LINKED_TO_INVOICE',
         'message','Este bem pertence a uma despesa. Corrija o inventário ou exclua a despesa com seus dependentes.'));
       alternatives:=jsonb_build_array(jsonb_build_object('action','correct_inventory','label','Corrigir o registro de inventário','target',actual_target));
       if role_name<>'inventory' then
         for rec in select i from jsonb_array_elements(linked_invoices) i where i->>'school_id'=school loop
           alternatives:=alternatives||jsonb_build_array(jsonb_build_object('action','delete_invoice','label','Excluir a despesa e seus dependentes',
             'target',jsonb_build_object('kind','invoice','id',rec.i->>'id','schoolId',school,
               'competence',rec.i->>'competence_id','programId',rec.i->>'program_id')));
         end loop;
       end if;
     else deletes:=jsonb_set(deletes,'{assets}',jsonb_build_array(asset.id)); end if;
   else
     after_row:=to_jsonb(asset); next_status:=coalesce(changes->>'status',asset.status);
     if next_status not in ('Não encaminhada','Encaminhada','Inventariada') then raise exception 'VALIDATION_ERROR: status patrimonial inválido'; end if;
     after_row:=after_row||jsonb_build_object('status',next_status);
     if changes ? 'inventoryProcess' then after_row:=after_row||jsonb_build_object('inventory_process',changes->'inventoryProcess'); end if;
     if changes ? 'notes' then after_row:=after_row||jsonb_build_object('notes',changes->'notes'); end if;
     if changes ? 'inventoriedAt' then
       after_row:=after_row||jsonb_build_object('inventoried_at',nullif(changes->>'inventoriedAt','')::timestamptz);
     end if;
     if changes ? 'inventoriedByMemberId' then
       after_row:=after_row||jsonb_build_object('inventoried_by_member_id',nullif(changes->>'inventoriedByMemberId',''));
     end if;
     if next_status<>'Inventariada' then after_row:=after_row||jsonb_build_object('inventoried_at',null,'inventoried_by_member_id',null);
     elsif (asset.status<>'Inventariada' or changes ? 'inventoriedAt' or changes ? 'inventoriedByMemberId')
       and (after_row->>'inventoried_at' is null or after_row->>'inventoried_by_member_id' is null) then
       raise exception 'VALIDATION_ERROR: registro Inventariada exige data e membro da equipe';
     end if;
     if after_row->>'inventoried_by_member_id' is not null then
       select jsonb_build_object(id,row_version) into map from public.inventory_team_members
         where id=after_row->>'inventoried_by_member_id' and (active or id=asset.inventoried_by_member_id);
       if map is null then raise exception 'VALIDATION_ERROR: membro de inventário não localizado ou inativo'; end if;
       versions:=versions||jsonb_build_object('inventory_team_members',map);
     end if;
     after_row:=after_row||jsonb_build_object('payload',asset.payload||jsonb_build_object('status',next_status,
       'processoInventario',after_row->'inventory_process','observacoes',after_row->'notes',
       'dataInventariacao',after_row->'inventoried_at','inventariadorId',after_row->'inventoried_by_member_id',
       'inventory_process',after_row->'inventory_process','notes',after_row->'notes','observacao',after_row->'notes',
       'inventoried_at',after_row->'inventoried_at','inventoried_by_member_id',after_row->'inventoried_by_member_id'));
     updates:=updates||radar_private.t5_row_changes('assets',asset.id,to_jsonb(asset),after_row,
       array['status','inventory_process','inventoried_at','inventoried_by_member_id','notes','payload']);
     for verification in select distinct v.* from public.verifications v
       join public.registered_invoices i on i.school_id=v.school_id and i.competence_id=v.competence_id
         and i.program_id=v.program_id and (i.verification_id is null or i.verification_id=v.id)
       where i.linked_asset_id=asset.id and v.school_id=school order by v.id
     loop
       records:=jsonb_set(records,'{verifications}',coalesce(records->'verifications','[]')||jsonb_build_array(
         jsonb_build_object('id',verification.id,'schoolId',verification.school_id,
           'competence',verification.competence_id,'programId',verification.program_id,
           'programName',(select name from public.programs where id=verification.program_id))));
       versions:=jsonb_set(versions,'{verifications}',coalesce(versions->'verifications','{}')||jsonb_build_object(verification.id,verification.row_version));
       select coalesce(jsonb_object_agg(i.id,i.row_version),'{}') into map from radar_private.operational_correction_context_invoices(verification.id) i;
       versions:=jsonb_set(versions,'{registered_invoices}',coalesce(versions->'registered_invoices','{}')||map);
       select coalesce(jsonb_object_agg(s.id,s.row_version),'{}') into map from public.assets s
         where s.id in (select i.linked_asset_id from radar_private.operational_correction_context_invoices(verification.id) i);
       versions:=jsonb_set(versions,'{assets}',coalesce(versions->'assets','{}')||map);
       select case when count(*)=0 then 'Não se aplica'
          when bool_and(case when i.linked_asset_id=asset.id then next_status else s.status end in ('Encaminhada','Inventariada'))
            and count(s.id)=count(*) then 'Sim' else 'Não' end into delivery
         from radar_private.operational_correction_context_invoices(verification.id) i
         left join public.assets s on s.id=i.linked_asset_id where i.expense_type='permanente';
       inventory_analysis:=case when delivery='Não se aplica' then 'Correto'
         when verification.bonification->>'encampInventario' is distinct from delivery
           or nullif(verification.analysis->>'encampInventario','') is null then 'Não analisado'
         else verification.analysis->>'encampInventario' end;
       if verification.bonification->>'encampInventario' is distinct from delivery then
         updates:=updates||jsonb_build_array(jsonb_build_object('entity','verifications','id',verification.id,
           'field','bonification.encampInventario','before',verification.bonification->'encampInventario','after',delivery));
       end if;
       if verification.analysis->>'encampInventario' is distinct from inventory_analysis then
         updates:=updates||jsonb_build_array(jsonb_build_object('entity','verifications','id',verification.id,
           'field','analysis.encampInventario','before',verification.analysis->'encampInventario','after',inventory_analysis));
       end if;
     end loop;
     if jsonb_array_length(coalesce(records->'verifications','[]'))>1 then
       warnings:=warnings||jsonb_build_array(jsonb_build_object('code','MULTIPLE_INVENTORY_CONTEXTS',
         'message','Este bem participa de mais de um contexto. O encaminhamento será conferido em todos: '||
           (select string_agg(coalesce(v->>'programName',v->>'programId')||' ('||(v->>'competence')||')',', '
             order by v->>'competence',v->>'programName') from jsonb_array_elements(records->'verifications') v)||'.'));
     end if;
   end if;
   if asset.status='Inventariada' or changes->>'status'='Inventariada' then
     warnings:=warnings||jsonb_build_array(jsonb_build_object('code','INVENTORY_RECORD_ONLY',
       'message','Esta operação corrige o lançamento no RADAR. Não realiza baixa física nem altera o registro nos sistemas patrimoniais externos.'));
   end if;
 end if;
 for k in select jsonb_object_keys(tgt) loop
   if tgt->k is distinct from actual_target->k then raise exception 'VALIDATION_ERROR: o contexto % não corresponde ao registro persistido',k; end if;
 end loop;
 if jsonb_array_length(updates)=0 and jsonb_array_length(deletes->'pendency_attempts')=0
   and jsonb_array_length(deletes->'pendency_contacts')=0 and jsonb_array_length(deletes->'assets')=0
   and jsonb_array_length(blockers)=0 then
   blockers:=jsonb_build_array(jsonb_build_object('code','NO_EFFECT','message','Nenhum campo foi alterado.'));
 end if;
 plan:=jsonb_build_object('contractVersion',1,'action',action_name,'target',actual_target,'changes',changes,
   'effects',jsonb_build_object('delete',deletes,'update',updates),'versions',versions,
   'counts',jsonb_build_object('invoices',0,'pendencies',0,'attempts',jsonb_array_length(deletes->'pendency_attempts'),
     'reviews',case when action_name='delete_review' and jsonb_array_length(blockers)=0 then 1 else 0 end,
     'contacts',jsonb_array_length(deletes->'pendency_contacts'),'assets',jsonb_array_length(deletes->'assets'),'updates',jsonb_array_length(updates)),
   'preserved',preserved,'warnings',warnings,'blockers',blockers,'alternatives',alternatives,'affectedRecords',records);
 return plan||jsonb_build_object('planDigest',encode(sha256(convert_to(plan::text,'UTF8')),'hex'));
end $$;
revoke all on function radar_private.operational_correction_build_plan(jsonb) from public,anon,authenticated;

-- Escritores comuns cooperam com a correção sem esperar por locks dentro de
-- triggers: a transação que perder a corrida recebe conflito e pode recarregar.
create function radar_private.t5_try_entity_lock(p_entity text,p_id text)
returns void language plpgsql security definer set search_path=pg_catalog as $$
begin
 if p_id is not null and not pg_try_advisory_xact_lock_shared(hashtextextended('t5:'||p_entity||':'||p_id,20261125)) then
   raise exception 'OPTIMISTIC_CONFLICT: histórico em correção concorrente; recarregue o registro';
 end if;
end $$;
revoke all on function radar_private.t5_try_entity_lock(text,text) from public,anon,authenticated;

create function radar_private.t5_history_writer_lock()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,radar_private as $$
declare old_id text; new_id text;
begin
 if tg_table_name='assets' then
   if tg_op<>'INSERT' then perform radar_private.t5_try_entity_lock('assets',old.id); end if;
   if tg_op<>'DELETE' then perform radar_private.t5_try_entity_lock('assets',new.id); end if;
 elsif tg_table_name='registered_invoices' then
   if tg_op<>'INSERT' then
     perform radar_private.t4_try_pendency_context_lock(old.school_id,old.competence_id,old.program_id);
     perform radar_private.t5_try_entity_lock('assets',old.linked_asset_id);
     perform radar_private.t5_try_entity_lock('assets',nullif(old.payload->>'bemId',''));
     perform radar_private.t5_try_entity_lock('assets',nullif(old.payload->>'linkedAssetId',''));
     perform radar_private.t5_try_entity_lock('assets',nullif(old.payload->>'linked_asset_id',''));
   end if;
   if tg_op<>'DELETE' then
     perform radar_private.t4_try_pendency_context_lock(new.school_id,new.competence_id,new.program_id);
     perform radar_private.t5_try_entity_lock('assets',new.linked_asset_id);
     perform radar_private.t5_try_entity_lock('assets',nullif(new.payload->>'bemId',''));
     perform radar_private.t5_try_entity_lock('assets',nullif(new.payload->>'linkedAssetId',''));
     perform radar_private.t5_try_entity_lock('assets',nullif(new.payload->>'linked_asset_id',''));
   end if;
 elsif tg_table_name='pendencies' then
   if tg_op<>'INSERT' then old_id:=old.id; end if;
   if tg_op<>'DELETE' then new_id:=new.id; end if;
   perform radar_private.t5_try_entity_lock('pendencies',old_id);
   perform radar_private.t5_try_entity_lock('pendencies',new_id);
 else
   if tg_op<>'INSERT' then old_id:=old.pendency_id; end if;
   if tg_op<>'DELETE' then new_id:=new.pendency_id; end if;
   perform radar_private.t5_try_entity_lock('pendencies',old_id);
   perform radar_private.t5_try_entity_lock('pendencies',new_id);
 end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
revoke all on function radar_private.t5_history_writer_lock() from public,anon,authenticated;
create trigger pendency_attempts_t5_lock before insert or update or delete on public.pendency_attempts
 for each row execute function radar_private.t5_history_writer_lock();
create trigger pendency_contacts_t5_lock before insert or update or delete on public.pendency_contacts
 for each row execute function radar_private.t5_history_writer_lock();
create trigger pendencies_t5_lock before update or delete on public.pendencies
 for each row execute function radar_private.t5_history_writer_lock();
create trigger assets_t5_lock before insert or update or delete on public.assets
 for each row execute function radar_private.t5_history_writer_lock();
create trigger registered_invoices_t5_asset_lock before insert or update or delete on public.registered_invoices
 for each row execute function radar_private.t5_history_writer_lock();

create function radar_private.t5_lock_plan(p_plan jsonb)
returns void language plpgsql security definer set search_path=pg_catalog,public,radar_private as $$
declare rec record; entity text;
begin
 -- Contextos já usados por T4 impedem novos registros fantasma em agregados.
 for rec in
   select distinct s,c,p from (
     select school_id s,competence_id c,program_id p from public.verifications
      where id in (select jsonb_object_keys(coalesce(p_plan #> '{versions,verifications}','{}')))
     union all
     select school_id,competence_origin,program_id from public.pendencies
      where id in (select jsonb_object_keys(coalesce(p_plan #> '{versions,pendencies}','{}')))
   ) contexts where s is not null and c is not null and p is not null order by s,c,p
 loop
   if not pg_try_advisory_xact_lock(hashtextextended(concat_ws('::',rec.s,rec.c,rec.p),20261123)) then
     raise exception 'OPTIMISTIC_CONFLICT: contexto em atualização concorrente; gere nova prévia';
   end if;
 end loop;
 foreach entity in array array['pendencies','assets'] loop
   for rec in select value as entity_id from jsonb_object_keys(coalesce(p_plan->'versions'->entity,'{}')) as x(value) order by value loop
     if not pg_try_advisory_xact_lock(hashtextextended('t5:'||entity||':'||rec.entity_id,20261125)) then
       raise exception 'OPTIMISTIC_CONFLICT: registro em atualização concorrente; gere nova prévia';
     end if;
   end loop;
 end loop;
 foreach entity in array array['pendencies','pendency_attempts','pendency_contacts','registered_invoices','assets','verifications','competences','inventory_team_members'] loop
   execute format('select 1 from public.%I where id in (select jsonb_object_keys($1)) order by id for update nowait',entity)
     using coalesce(p_plan->'versions'->entity,'{}');
 end loop;
exception when lock_not_available then
 raise exception 'OPTIMISTIC_CONFLICT: registro em atualização concorrente; gere nova prévia';
end $$;
revoke all on function radar_private.t5_lock_plan(jsonb) from public,anon,authenticated;

create function radar_private.t5_asset_status_allowed(p_id text,p_status text)
returns boolean language sql stable security definer set search_path=pg_catalog,radar_private as $$
 select exists(select 1 from radar_private.operational_change_ledger l,
   lateral jsonb_array_elements(l.plan #> '{effects,update}') u
  where l.status='applying' and l.xact_id=txid_current_if_assigned() and l.action='correct_inventory'
    and u->>'entity'='assets' and u->>'id'=p_id and u->>'field'='status' and u->>'after'=p_status)
$$;
revoke all on function radar_private.t5_asset_status_allowed(text,text) from public,anon;
grant execute on function radar_private.t5_asset_status_allowed(text,text) to authenticated,service_role;

create or replace function radar_private.protect_inventoried_asset_terminal_state()
returns trigger language plpgsql set search_path=pg_catalog,public,radar_private as $$
begin
 if old.status='Inventariada' then
   if tg_op='DELETE' then
     if radar_private.operational_correction_allows('assets',old.id) then return old; end if;
     raise exception 'ASSET_ALREADY_INVENTORIED: assets/%',old.id;
   end if;
   if new.status is distinct from old.status
      and not radar_private.t5_asset_status_allowed(old.id,new.status) then
     raise exception 'ASSET_ALREADY_INVENTORIED: assets/%',old.id;
   end if;
 end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
revoke all on function radar_private.protect_inventoried_asset_terminal_state() from public,anon,authenticated;

create or replace function radar_private.preview_operational_change_impl(p_request jsonb)
returns jsonb language plpgsql stable security definer set search_path=pg_catalog,public,radar_private as $$
begin
 perform radar_private.t5_correction_capability(p_request->>'action',nullif(btrim(p_request #>> '{target,schoolId}'),''));
 return radar_private.operational_correction_build_plan(p_request);
end $$;
revoke all on function radar_private.preview_operational_change_impl(jsonb) from public,anon;
grant execute on function radar_private.preview_operational_change_impl(jsonb) to authenticated,service_role;

alter function radar_private.apply_operational_change_impl(jsonb,text,uuid) rename to apply_operational_change_impl_r5;
revoke all on function radar_private.apply_operational_change_impl_r5(jsonb,text,uuid) from public,anon,authenticated;

create function radar_private.apply_operational_change_impl(p_request jsonb,p_plan_digest text,p_operation_key uuid)
returns jsonb language plpgsql volatile security definer set search_path=pg_catalog,public,radar_private as $$
declare
 action_name text:=p_request->>'action'; actor_role text;
 fingerprint text:=encode(sha256(convert_to(coalesce(p_request,'null')::text,'UTF8')),'hex');
 existing radar_private.operational_change_ledger%rowtype; plan jsonb; initial_digest text;
 entity text; item_id text; expected_version int; affected int; patch jsonb;
 current_row jsonb; after_row jsonb; rec record; change jsonb;
 actor_name text; profile_name text; action_label text; v_receipt jsonb;
begin
 if action_name is null or action_name not in ('delete_attempt','delete_review','correct_attempt','correct_review',
   'delete_contact','correct_contact','correct_inventory','delete_asset') then
   return radar_private.apply_operational_change_impl_r5(p_request,p_plan_digest,p_operation_key);
 end if;
 actor_role:=radar_private.t5_correction_capability(action_name,nullif(btrim(p_request #>> '{target,schoolId}'),''));
 if p_operation_key is null or nullif(btrim(p_plan_digest),'') is null then
   raise exception 'VALIDATION_ERROR: operationKey e planDigest são obrigatórios';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(p_operation_key::text,20261114));
 select * into existing from radar_private.operational_change_ledger where operation_key=p_operation_key;
 if found then
   if existing.status='committed' and existing.request_fingerprint=fingerprint
      and existing.plan_digest=p_plan_digest and existing.actor_id=auth.uid() then
     return existing.receipt||jsonb_build_object('replayed',true);
   end if;
   raise exception 'IDEMPOTENCY_CONFLICT: operationKey já foi utilizado por outra confirmação';
 end if;
 plan:=radar_private.operational_correction_build_plan(p_request); initial_digest:=plan->>'planDigest';
 perform radar_private.t5_lock_plan(plan);
 plan:=radar_private.operational_correction_build_plan(p_request);
 if jsonb_array_length(plan->'blockers')>0 then
   raise exception 'PLAN_BLOCKED: %: %',plan #>> '{blockers,0,code}',plan #>> '{blockers,0,message}';
 end if;
 if plan->>'planDigest'<>p_plan_digest or initial_digest<>p_plan_digest then
   raise exception 'STALE_PLAN: os registros mudaram; gere nova prévia antes de confirmar';
 end if;
 insert into radar_private.operational_change_ledger(operation_key,action,school_id,request,request_fingerprint,
   plan_digest,plan,note,status,xact_id,actor_id,actor_role)
 values(p_operation_key,action_name,p_request #>> '{target,schoolId}',p_request,fingerprint,p_plan_digest,
   plan,nullif(btrim(p_request->>'note'),''),'applying',txid_current(),auth.uid(),actor_role);

 select coalesce(nullif(c.name,''),nullif(u.email,''),u.id::text) into actor_name
   from auth.users u left join public.controllers c on c.user_id=u.id where u.id=auth.uid();
 select label into strict profile_name from public.profiles where id=actor_role;
 action_label:=case action_name when 'delete_attempt' then 'Envio corretivo excluído'
   when 'delete_review' then 'Reanálise excluída' when 'correct_attempt' then 'Envio corretivo corrigido'
   when 'correct_review' then 'Reanálise corrigida' when 'delete_contact' then 'Registro de contato excluído'
   when 'correct_contact' then 'Registro de contato corrigido' when 'correct_inventory' then 'Registro de inventário corrigido'
   else 'Registro patrimonial independente excluído' end;
 insert into public.administrative_logs(id,school_id,actor_user_id,user_identifier,profile_name,action,details)
 values('correcao-operacional-'||p_operation_key,plan #>> '{target,schoolId}',auth.uid(),actor_name,profile_name,action_label,
   jsonb_build_object('operationKey',p_operation_key,'target',plan->'target','counts',plan->'counts',
     'effects',plan->'effects','affectedRecords',plan->'affectedRecords','preserved',plan->'preserved',
     'text',concat_ws(' · ',action_label,plan #>> '{target,competence}',plan #>> '{target,programId}',
       plan #>> '{target,documentKey}',nullif(btrim(p_request->>'note'),''))));

 foreach entity in array array['pendency_attempts','pendency_contacts','assets'] loop
   for item_id in select jsonb_array_elements_text(plan->'effects'->'delete'->entity) loop
     expected_version:=(plan->'versions'->entity->>item_id)::int;
     execute format('delete from public.%I where id=$1 and row_version=$2',entity) using item_id,expected_version;
     get diagnostics affected=row_count;
     if affected<>1 then raise exception 'OPTIMISTIC_CONFLICT: %/%',entity,item_id; end if;
   end loop;
 end loop;
 -- Campos e tabelas vêm exclusivamente do planner do servidor. Uma atualização
 -- por linha mantém versões, validações JSON e invalidadores ordinários ativos.
 for rec in select * from (select distinct u->>'entity' entity_name,u->>'id' record_id
   from jsonb_array_elements(plan #> '{effects,update}') u) rows_to_update
   order by case entity_name when 'pendency_attempts' then 0 when 'pendencies' then 1
     when 'pendency_contacts' then 2 when 'assets' then 3 when 'registered_invoices' then 4 else 5 end,record_id loop
   entity:=rec.entity_name; item_id:=rec.record_id;
   if entity not in ('pendency_attempts','pendencies','pendency_contacts','assets','registered_invoices','verifications') then
     raise exception 'PLAN_BLOCKED: entidade de atualização inesperada';
   end if;
   expected_version:=(plan->'versions'->entity->>item_id)::int;
   execute format('select to_jsonb(t) from public.%I t where id=$1',entity) into current_row using item_id;
   after_row:=current_row;
   for change in select u from jsonb_array_elements(plan #> '{effects,update}') u
     where u->>'entity'=entity and u->>'id'=item_id loop
     if position('.' in (change->>'field'))>0 then
       after_row:=jsonb_set(after_row,string_to_array(change->>'field','.'),change->'after',true);
     else after_row:=jsonb_set(after_row,array[change->>'field'],change->'after',true); end if;
   end loop;
   if entity='pendency_attempts' then
     update public.pendency_attempts set available_at=(after_row->>'available_at')::timestamptz,
       drive_url=after_row->>'drive_url',observation=after_row->>'observation',
       analyzed_at=(after_row->>'analyzed_at')::timestamptz,result=after_row->>'result',
       errors=after_row->'errors',payload=after_row->'payload'
       where id=item_id and row_version=expected_version;
   elsif entity='pendencies' then
     update public.pendencies set status=after_row->>'status',responsible_area=after_row->>'responsible_area',
       next_actor=after_row->>'next_actor',resolved_at=(after_row->>'resolved_at')::timestamptz,
       canceled_at=(after_row->>'canceled_at')::timestamptz,reason=after_row->>'reason',payload=after_row->'payload'
       where id=item_id and row_version=expected_version;
   elsif entity='pendency_contacts' then
     update public.pendency_contacts set contact_type=after_row->>'contact_type',contact_date=(after_row->>'contact_date')::date,
       description=after_row->>'description',official_charge=(after_row->>'official_charge')::boolean,
       pendency_id=after_row->>'pendency_id',payload=after_row->'payload' where id=item_id and row_version=expected_version;
   elsif entity='assets' then
     update public.assets set status=after_row->>'status',inventory_process=after_row->>'inventory_process',
       inventoried_at=(after_row->>'inventoried_at')::timestamptz,inventoried_by_member_id=after_row->>'inventoried_by_member_id',
       notes=after_row->>'notes',payload=after_row->'payload' where id=item_id and row_version=expected_version;
   elsif entity='registered_invoices' then
     update public.registered_invoices set payload=after_row->'payload' where id=item_id and row_version=expected_version;
   else
     update public.verifications set analysis=after_row->'analysis',bonification=after_row->'bonification'
       where id=item_id and row_version=expected_version;
   end if;
   get diagnostics affected=row_count;
   if affected<>1 then raise exception 'OPTIMISTIC_CONFLICT: %/%',entity,item_id; end if;
 end loop;
 v_receipt:=jsonb_build_object('contractVersion',1,'committed',true,'replayed',false,
   'operationKey',p_operation_key,'action',action_name,'planDigest',p_plan_digest,
   'auditId','correcao-operacional-'||p_operation_key,
   'deletedIdsByEntity',plan #> '{effects,delete}','updated',plan #> '{effects,update}',
   'counts',plan->'counts','preserved',plan->'preserved','warnings',plan->'warnings','actorRole',actor_role,
   'target',plan->'target','affectedRecords',plan->'affectedRecords');
 update radar_private.operational_change_ledger set status='committed',receipt=v_receipt,committed_at=now()
   where operation_key=p_operation_key;
 return v_receipt;
end $$;
revoke all on function radar_private.apply_operational_change_impl(jsonb,text,uuid) from public,anon;
grant execute on function radar_private.apply_operational_change_impl(jsonb,text,uuid) to authenticated,service_role;
create or replace function public.apply_operational_change(p_request jsonb,p_plan_digest text,p_operation_key uuid)
returns jsonb language sql volatile security invoker set search_path=pg_catalog,radar_private as $$
 select radar_private.apply_operational_change_impl(p_request,p_plan_digest,p_operation_key)
$$;
revoke all on function public.apply_operational_change(jsonb,text,uuid) from public,anon;
grant execute on function public.apply_operational_change(jsonb,text,uuid) to authenticated,service_role;
commit;
