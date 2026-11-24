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
  legacy_context_conflict boolean := false;
begin
  if req->>'action' is distinct from 'clear_item_history' then
    return radar_private.operational_correction_build_plan_r3(p_request);
  end if;

  if jsonb_typeof(req) is distinct from 'object'
      or req->'contractVersion' is distinct from '1'::jsonb
      or jsonb_typeof(tgt) is distinct from 'object'
      or tgt->>'kind' is distinct from 'analysis'
      or school is null or competence is null or program is null or document is null
      or document not in ('extCC','extINV','notaFiscal','consAssessoria',
          'boletoInternet','declBBAgil','encampInventario')
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
  legacy_context_conflict := item_id is not null and exists(
      select 1 from public.pendencies p
      where p.registered_invoice_id=item_id and p.document_key=document
        and (p.school_id is distinct from school
          or p.competence_origin is distinct from competence
          or p.program_id is distinct from program)
  );

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
  if jsonb_array_length(blockers)=0 and not legacy_context_conflict
    and cardinality(affected_pendencies)=0
    and not exists(select 1 from jsonb_array_elements(original_update) as item(value)
      where item.value->>'before' is distinct from item.value->>'after'
        and (item.value->>'before') is distinct from 'Não analisado')
  then
    blockers:=jsonb_build_array(jsonb_build_object('code','NO_EFFECT',
      'message','Este item já está sem avaliação e não possui histórico a excluir.'));
  end if;

  if legacy_context_conflict then
    blockers:=blockers || jsonb_build_array(jsonb_build_object(
      'code','LEGACY_PENDENCY_CONTEXT_CONFLICT',
      'message','Há Pendência vinculada à nota com contexto incompleto ou divergente. Confira a Pendência individualmente antes de retomar a limpeza.'));
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

-- T4: escritores de Pendências cooperam com a exclusão do contexto.
-- A chave de contexto já usada na migration 66 serializa exclusões e novas
-- Pendências. Escritores comuns compartilham a trava, sem conflito entre si.
-- Não aguardar advisory lock dentro de trigger de linha:
-- UPDATE pode já deter uma row lock.
create function radar_private.t4_try_pendency_context_lock(
  p_school text,p_competence text,p_program text
) returns void language plpgsql security definer
set search_path=pg_catalog,public,radar_private as $$
begin
  if p_school is not null and p_competence is not null and p_program is not null then
    if not pg_catalog.pg_try_advisory_xact_lock_shared(
      pg_catalog.hashtextextended(concat_ws('::',p_school,p_competence,p_program),20261123)
    ) then
      raise exception 'OPTIMISTIC_CONFLICT: contexto em correção concorrente; tente novamente';
    end if;
  end if;
end $$;
revoke all on function radar_private.t4_try_pendency_context_lock(text,text,text) from public,anon,authenticated;

-- A Pendência legada vinculada a NF também coopera com o contexto real da NF,
-- mesmo quando a sua própria identificação de programa está incompleta.
create function radar_private.t4_try_pendency_invoice_lock(p_invoice text)
returns void language plpgsql security definer
set search_path=pg_catalog,public,radar_private as $$
begin
  if p_invoice is not null then
    perform radar_private.t4_try_pendency_context_lock(i.school_id,i.competence_id,i.program_id)
      from public.registered_invoices i where i.id=p_invoice;
  end if;
end $$;
revoke all on function radar_private.t4_try_pendency_invoice_lock(text) from public,anon,authenticated;

create function radar_private.t4_pendency_context_trigger()
returns trigger language plpgsql security definer
set search_path=pg_catalog,public,radar_private as $$
begin
  if tg_op='UPDATE' then
    if (old.school_id,old.competence_origin,old.program_id,old.document_key,old.registered_invoice_id)
       is not distinct from
       (new.school_id,new.competence_origin,new.program_id,new.document_key,new.registered_invoice_id) then
      return new;
    end if;
    perform radar_private.t4_try_pendency_context_lock(old.school_id,old.competence_origin,old.program_id);
    perform radar_private.t4_try_pendency_invoice_lock(old.registered_invoice_id);
  end if;
  perform radar_private.t4_try_pendency_context_lock(new.school_id,new.competence_origin,new.program_id);
  perform radar_private.t4_try_pendency_invoice_lock(new.registered_invoice_id);
  return new;
end $$;
revoke all on function radar_private.t4_pendency_context_trigger() from public,anon,authenticated;
create trigger pendencies_t4_context_lock
before insert or update of school_id,competence_origin,program_id,document_key,registered_invoice_id
on public.pendencies for each row
execute function radar_private.t4_pendency_context_trigger();

create or replace function radar_private.operational_correction_lock(p_plan jsonb)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, radar_private
as $$
declare
    v_action text := p_plan ->> 'action';
    v_pendency_id text := p_plan #>> '{effects,delete,pendencies,0}';
    v_invoice_id text := p_plan #>> '{target,id}';
begin
    -- A reanálise começa pela Pendência. Só aguardamos a primeira linha;
    -- aguardar outra depois dela poderia formar um ciclo com um comando concorrente.
    if v_action in ('delete_context','clear_item_history') then
        -- Context lock already held: every row acquisition below is NOWAIT.
        null;
    elsif v_pendency_id is not null then
        perform 1 from public.pendencies where id = v_pendency_id for update;
    elsif (p_plan #> '{versions,registered_invoices}') ? v_invoice_id then
        perform 1 from public.registered_invoices where id = v_invoice_id for update;
    else
        perform 1 from public.verifications
         where id in (select jsonb_object_keys(p_plan #> '{versions,verifications}'))
         order by id limit 1 for update;
    end if;

    perform 1 from public.registered_invoices
     where id in (select jsonb_object_keys(coalesce(p_plan -> 'versions' -> 'registered_invoices', '{}'::jsonb)))
     order by id for update nowait;
    perform 1 from public.verifications
     where id in (select jsonb_object_keys(coalesce(p_plan -> 'versions' -> 'verifications', '{}'::jsonb)))
     order by id for update nowait;
    perform 1 from public.pendencies
     where id in (select jsonb_object_keys(coalesce(p_plan -> 'versions' -> 'pendencies', '{}'::jsonb)))
     order by id for update nowait;
    perform 1 from public.pendency_attempts
     where id in (select jsonb_object_keys(coalesce(p_plan -> 'versions' -> 'pendency_attempts', '{}'::jsonb)))
     order by id for update nowait;
    perform 1 from public.pendency_contacts
     where id in (select jsonb_object_keys(coalesce(p_plan -> 'versions' -> 'pendency_contacts', '{}'::jsonb)))
     order by id for update nowait;
    perform 1 from public.assets
     where id in (select jsonb_object_keys(coalesce(p_plan -> 'versions' -> 'assets', '{}'::jsonb)))
     order by id for update nowait;
    perform 1 from public.quality_provisional_movements
     where id::text in (select jsonb_object_keys(coalesce(p_plan -> 'versions' -> 'quality_provisional_movements', '{}'::jsonb)))
     order by id for update nowait;
exception when lock_not_available then
    raise exception 'OPTIMISTIC_CONFLICT: registro em atualização concorrente; gere nova prévia';
end
$$;
revoke all on function radar_private.operational_correction_lock(jsonb) from public,anon,authenticated;

alter function radar_private.apply_operational_change_impl(jsonb,text,uuid) rename to apply_operational_change_impl_r3;
revoke all on function radar_private.apply_operational_change_impl_r3(jsonb,text,uuid) from public,anon,authenticated;
create function radar_private.apply_operational_change_impl(
  p_request jsonb,p_plan_digest text,p_operation_key uuid
) returns jsonb language plpgsql volatile security definer
set search_path=pg_catalog,public,radar_private as $$
declare
  tgt jsonb := coalesce(p_request->'target','{}'::jsonb);
  school text := nullif(btrim(tgt->>'schoolId'),'');
  competence text := nullif(btrim(tgt->>'competence'),'');
  program text := nullif(btrim(tgt->>'programId'),'');
  document text := nullif(btrim(tgt->>'documentKey'),'');
  item_id text := nullif(btrim(tgt->>'id'),'');
  receipt jsonb;
begin
  if p_request->>'action' is distinct from 'clear_item_history' then
    return radar_private.apply_operational_change_impl_r3(p_request,p_plan_digest,p_operation_key);
  end if;
  perform radar_private.operational_correction_capability(school);
  if school is not null and competence is not null and program is not null then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(concat_ws('::',school,competence,program),20261123)
    );
  end if;
  receipt:=radar_private.apply_operational_change_impl_r3(p_request,p_plan_digest,p_operation_key);
  if coalesce((receipt->>'replayed')::boolean,false) then return receipt; end if;
  if exists(select 1 from public.pendencies p
    where p.school_id=school and p.competence_origin=competence and p.program_id=program
      and p.document_key=document and p.registered_invoice_id is not distinct from item_id)
  then raise exception 'OPTIMISTIC_CONFLICT: novas Pendências surgiram; gere nova prévia'; end if;
  return receipt;
end $$;
revoke all on function radar_private.apply_operational_change_impl(jsonb,text,uuid) from public,anon,authenticated;
grant execute on function radar_private.apply_operational_change_impl(jsonb,text,uuid) to authenticated,service_role;
create or replace function public.apply_operational_change(
  p_request jsonb,p_plan_digest text,p_operation_key uuid
) returns jsonb language sql volatile security invoker
set search_path=pg_catalog,radar_private as $$
  select radar_private.apply_operational_change_impl(p_request,p_plan_digest,p_operation_key)
$$;
revoke all on function public.apply_operational_change(jsonb,text,uuid) from public,anon;
grant execute on function public.apply_operational_change(jsonb,text,uuid) to authenticated,service_role;

commit;
