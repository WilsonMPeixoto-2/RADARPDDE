-- RADAR PDDE / T4: exclusão EXPLÍCITA de avaliações e histórico de UM item.
-- Candidata: depende da migration 66 e permanece indisponível em Production.
-- Historico administrativo independente NÃO é eliminado. Nenhum "match" por texto.
begin;

alter function radar_private.operational_correction_build_plan(jsonb)
    rename to operational_correction_build_plan_r3;

create function radar_private.operational_correction_build_plan(p_request jsonb)
returns jsonb language plpgsql stable security definer
set search_path=pg_catalog,public,radar_private as $$
declare
  req jsonb := coalesce(p_request,'{}'::jsonb);
  tgt jsonb := coalesce(p_request->'target','{}'::jsonb);
  school text := nullif(btrim(tgt->>'schoolId'),'');
  competence text := nullif(btrim(tgt->>'competence'),'');
  program text := nullif(btrim(tgt->>'programId'),'');
  document text := nullif(btrim(tgt->>'documentKey'),'');
  item_id text := nullif(btrim(tgt->>'id'),'');
  affected_pendencies text[] := array[]::text[];
  active_pendencies text[] := array[]::text[];
  attempt_ids text[] := array[]::text[];
  contact_ids text[] := array[]::text[];
  p_versions jsonb := '{}'::jsonb;
  a_versions jsonb := '{}'::jsonb;
  c_versions jsonb := '{}'::jsonb;
  preview_pendencies jsonb := '[]'::jsonb;
  preview_attempts jsonb := '[]'::jsonb;
  preview_contacts jsonb := '[]'::jsonb;
  base_request jsonb;
  plan jsonb;
  blockers jsonb;
  effects jsonb;
  deleted jsonb;
  versions jsonb;
  counts jsonb;
  preserved jsonb;
  original_update jsonb;
begin
  if req->>'action' is distinct from 'clear_item_history' then
    return radar_private.operational_correction_build_plan_r3(p_request);
  end if;

  if jsonb_typeof(req) is distinct from 'object'
      or req->'contractVersion' is distinct from '1'::jsonb
      or jsonb_typeof(tgt) is distinct from 'object'
      or tgt->>'kind' is distinct from 'analysis'
      or school is null or competence is null or program is null or document is null
      or exists(select 1 from jsonb_object_keys(req) as k(key)
          where k.key not in ('contractVersion','action','target','note'))
      or exists(select 1 from jsonb_object_keys(tgt) as k(key)
          where k.key not in ('kind','id','schoolId','competence','programId','documentKey'))
      or (document in ('notaFiscal','consAssessoria') and item_id is null)
      or (document not in ('notaFiscal','consAssessoria') and item_id is not null)
  then
    raise exception 'VALIDATION_ERROR: identifique exclusivamente um item, sua escola, competência, programa e documento; seleção parcial não é permitida';
  end if;

  -- Não inferir que uma Pendência antiga sem programa pertence à análise
  -- somente pela escola/mês/documento. NF individual exige vínculo FK explícito.
  if item_id is not null and exists(
      select 1 from public.pendencies p
      where p.registered_invoice_id=item_id and p.document_key=document
        and (p.school_id is distinct from school
          or p.competence_origin is distinct from competence
          or p.program_id is distinct from program)
  ) then
    raise exception 'PLAN_BLOCKED: há Pendência de NF com contexto incompleto ou divergente. Exclua-a individualmente pelo ID, depois retome a limpeza';
  end if;

  select coalesce(array_agg(p.id order by p.id),array[]::text[]),
         coalesce(array_agg(p.id order by p.id) filter
           (where p.status in ('Aberta','Aguardando reanálise')),array[]::text[])
    into affected_pendencies,active_pendencies
    from public.pendencies p
   where p.school_id=school and p.competence_origin=competence
     and p.program_id=program and p.document_key=document
     and ((item_id is not null and p.registered_invoice_id=item_id)
       or (item_id is null and p.registered_invoice_id is null));

  -- Reutiliza o cálculo canônico de limpar análise (incluindo agregados fiscais)
  -- e lhe fornece TODAS as Pendências ativas explicitamente vinculadas.
  base_request:=jsonb_build_object('contractVersion',1,'action','clear_analysis',
    'target',tgt,'selectedPendencyIds',to_jsonb(active_pendencies));
  plan:=radar_private.operational_correction_build_plan_r3(base_request);

  blockers:=coalesce(plan->'blockers','[]'::jsonb);
  select coalesce(jsonb_agg(b.item),'[]'::jsonb) into blockers
    from jsonb_array_elements(blockers) as b(item)
    where b.item->>'code'<>'NO_EFFECT';

  deleted:=coalesce(plan #> '{effects,delete}','{}'::jsonb);
  if jsonb_array_length(coalesce(deleted->'registered_invoices','[]'::jsonb))>0
    or jsonb_array_length(coalesce(deleted->'assets','[]'::jsonb))>0
    or jsonb_array_length(coalesce(deleted->'verifications','[]'::jsonb))>0
  then
    raise exception 'PLAN_BLOCKED: a operação de histórico não pode excluir documento, despesa ou bem patrimonial';
  end if;

  -- Exatamente os filhos das Pendências do mesmo item, inclusive resolvidas
  -- e canceladas. Nunca remover contatos sem pendency_id.
  select coalesce(array_agg(a.id order by a.id),array[]::text[]),
         coalesce(jsonb_object_agg(a.id,a.row_version),'{}'::jsonb),
         coalesce(jsonb_agg(jsonb_build_object(
           'id',a.id,'pendencyId',a.pendency_id,'attemptNumber',a.attempt_number)
           order by a.id),'[]'::jsonb)
    into attempt_ids,a_versions,preview_attempts
    from public.pendency_attempts a
   where a.pendency_id=any(affected_pendencies);

  select coalesce(array_agg(c.id order by c.id),array[]::text[]),
         coalesce(jsonb_object_agg(c.id,c.row_version),'{}'::jsonb),
         coalesce(jsonb_agg(jsonb_build_object(
           'id',c.id,'pendencyId',c.pendency_id,
           'description',c.description,'contactType',c.contact_type)
           order by c.id),'[]'::jsonb)
    into contact_ids,c_versions,preview_contacts
    from public.pendency_contacts c
   where c.pendency_id=any(affected_pendencies);

  select coalesce(jsonb_object_agg(p.id,p.row_version),'{}'::jsonb),
         coalesce(jsonb_agg(jsonb_build_object(
           'id',p.id,'documentKey',p.document_key,'status',p.status,
           'item',p.id) order by p.id),'[]'::jsonb)
    into p_versions,preview_pendencies
    from public.pendencies p where p.id=any(affected_pendencies);

  original_update:=coalesce(plan #> '{effects,update}','[]'::jsonb);
  if cardinality(affected_pendencies)=0
    and not exists(select 1 from jsonb_array_elements(original_update) as item(value)
      where item.value->>'before' is distinct from item.value->>'after'
        and (item.value->>'before') is distinct from 'Não analisado')
  then
    blockers:=jsonb_build_array(jsonb_build_object('code','NO_EFFECT',
      'message','Este item já está sem avaliação e não possui histórico a excluir.'));
  end if;

  deleted:=deleted || jsonb_build_object(
    'verifications','[]'::jsonb,
    'registered_invoices','[]'::jsonb,
    'assets','[]'::jsonb,
    'pendencies',to_jsonb(affected_pendencies),
    'pendency_attempts',to_jsonb(attempt_ids),
    'pendency_contacts',to_jsonb(contact_ids));
  effects:=jsonb_build_object('delete',deleted,'update',original_update);
  versions:=coalesce(plan->'versions','{}'::jsonb)
    || jsonb_build_object('pendencies',p_versions,
      'pendency_attempts',a_versions,'pendency_contacts',c_versions);
  counts:=coalesce(plan->'counts','{}'::jsonb)
    || jsonb_build_object('invoices',0,'assets',0,
      'pendencies',cardinality(affected_pendencies),
      'attempts',cardinality(attempt_ids),
      'contacts',cardinality(contact_ids));
  preserved:=coalesce(plan->'preserved','{}'::jsonb)
    || jsonb_build_object('originalDocument',true,'registeredInvoices',true,
      'otherItems',true,'otherContexts',true,'generalContacts',true,
      'administrativeAudit',true);

  plan:=(plan-'planDigest') || jsonb_build_object(
    'action','clear_item_history','selectedPendencyIds',null,
    'effects',effects,'versions',versions,'counts',counts,
    'preserved',preserved,'blockers',blockers,
    'affectedRecords',jsonb_build_object(
      'pendencies',preview_pendencies,
      'attempts',preview_attempts,
      'contacts',preview_contacts));
  return plan || jsonb_build_object('planDigest',
    encode(sha256(convert_to(plan::text,'UTF8')),'hex'));
end $$;
revoke all on function radar_private.operational_correction_build_plan(jsonb)
 from public,anon,authenticated;

-- Log específico: o histórico operativo é excluído, mas a trilha administrativa
-- permanece e identifica as Pendências, tentativas e contatos envolvidos.
alter function radar_private.operational_correction_log(jsonb,uuid,text,text)
  rename to operational_correction_log_r3;

create function radar_private.operational_correction_log(
  p_plan jsonb,p_operation_key uuid,p_role text,p_note text
) returns void language plpgsql security definer
set search_path=pg_catalog,public,radar_private as $$
declare actor text; profile text;
begin
  if p_plan->>'action' is distinct from 'clear_item_history' then
    perform radar_private.operational_correction_log_r3(p_plan,p_operation_key,p_role,p_note);
    return;
  end if;
  select coalesce(nullif(c.name,''),nullif(u.email,''),u.id::text)
    into actor from auth.users u left join public.controllers c on c.user_id=u.id
    where u.id=auth.uid();
  select label into strict profile from public.profiles where id=p_role;
  insert into public.administrative_logs
    (id,school_id,actor_user_id,user_identifier,profile_name,action,details)
  values ('correcao-operacional-'||p_operation_key,p_plan #>> '{target,schoolId}',
    auth.uid(),actor,profile,'Histórico do item excluído',
    jsonb_build_object('operationKey',p_operation_key,'target',p_plan->'target',
      'counts',p_plan->'counts','preserved',p_plan->'preserved',
      'affectedRecords',p_plan->'affectedRecords',
      'text',concat_ws(' · ',p_plan #>> '{target,competence}',
        p_plan #>> '{target,programId}',p_plan #>> '{target,documentKey}',
        'Histórico completo do item removido',p_note)));
end $$;
revoke all on function radar_private.operational_correction_log(jsonb,uuid,text,text)
  from public,anon,authenticated;

comment on function radar_private.operational_correction_build_plan(jsonb) is
  'T4: planeja a limpeza completa do histórico de um item; não apaga notas, bens ou programas';
commit;
