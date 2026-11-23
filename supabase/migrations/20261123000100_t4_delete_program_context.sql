-- T4 Release 2: exclusão de lançamentos por escola × competência × programa.
-- Branch de homologação apenas; nunca aplicar ao Supabase institucional antes dos gates.
begin;
alter function radar_private.operational_correction_build_plan(jsonb)
  rename to operational_correction_build_plan_r2;

create function radar_private.operational_correction_build_plan(p_request jsonb)
returns jsonb language plpgsql stable security definer
set search_path=pg_catalog,public,radar_private as $$
declare
  req jsonb:=coalesce(p_request,'{}'::jsonb);
  tgt jsonb:=coalesce(p_request->'target','{}'::jsonb);
  school text:=nullif(btrim(tgt->>'schoolId'),'');
  competence text:=nullif(btrim(tgt->>'competence'),'');
  program text:=nullif(btrim(tgt->>'programId'),'');
  ver public.verifications%rowtype;
  invoices text[]:=array[]::text[];
  pendencies text[]:=array[]::text[];
  attempts text[]:=array[]::text[];
  contacts text[]:=array[]::text[];
  assets text[]:=array[]::text[];
  updates jsonb:='[]'::jsonb;
  versions jsonb:='{}'::jsonb;
  warnings jsonb:='[]'::jsonb;
  blockers jsonb:='[]'::jsonb;
  preserved jsonb:='{}'::jsonb;
  mapped jsonb;
  plan jsonb;
  movement record;
begin
  if req->>'action' is distinct from 'delete_context' then
    return radar_private.operational_correction_build_plan_r2(p_request);
  end if;
  if req->'contractVersion' is distinct from '1'::jsonb
    or jsonb_typeof(req) is distinct from 'object'
    or jsonb_typeof(tgt) is distinct from 'object'
    or tgt->>'kind' is distinct from 'program_context'
    or school is null or competence is null or program is null
    or exists(select 1 from jsonb_object_keys(req) as keys(key)
      where keys.key not in ('contractVersion','action','target','note'))
    or exists(select 1 from jsonb_object_keys(tgt) as keys(key)
      where keys.key not in ('kind','schoolId','competence','programId')) then
    raise exception 'VALIDATION_ERROR: informe somente escola, competência, programa e observação opcional';
  end if;
  select * into ver from public.verifications
    where school_id=school and competence_id=competence and program_id=program;
  if not found then
    raise exception 'NOT_FOUND: verificação do programa/mês selecionado';
  end if;
  select coalesce(array_agg(i.id order by i.id),array[]::text[])
    into invoices from public.registered_invoices i
    where i.school_id=school and i.competence_id=competence and i.program_id=program;

  -- Identidade de contexto divergente nunca autoriza eliminação por aproximação.
  if exists(select 1 from public.registered_invoices i where
      (i.id=any(invoices) and i.verification_id is not null and i.verification_id<>ver.id)
      or (i.verification_id=ver.id and
          (i.school_id<>school or i.competence_id is distinct from competence
          or i.program_id is distinct from program))) then
    blockers:=blockers||jsonb_build_array(jsonb_build_object('code','CONTEXT_INCONSISTENT',
      'message','Uma nota possui contexto divergente do vínculo de verificação.'));
  end if;

  select coalesce(array_agg(p.id order by p.id),array[]::text[])
    into pendencies from public.pendencies p
    where (p.school_id=school and p.competence_origin=competence and p.program_id=program)
       or p.registered_invoice_id=any(invoices);
  if exists(select 1 from public.pendencies p where p.id=any(pendencies)
    and (p.school_id<>school or p.competence_origin<>competence
      or p.program_id is distinct from program
      or (p.registered_invoice_id is not null and not(p.registered_invoice_id=any(invoices))))) then
    blockers:=blockers||jsonb_build_array(jsonb_build_object('code','CROSS_CONTEXT_DEPENDENCY',
      'message','Uma Pendência está vinculada a um contexto diferente.'));
  end if;
  select coalesce(array_agg(a.id order by a.id),array[]::text[])
    into attempts from public.pendency_attempts a where a.pendency_id=any(pendencies);
  select coalesce(array_agg(c.id order by c.id),array[]::text[])
    into contacts from public.pendency_contacts c where c.pendency_id=any(pendencies);
  if exists(select 1 from public.pendency_contacts c where c.id=any(contacts) and c.school_id<>school) then
    blockers:=blockers||jsonb_build_array(jsonb_build_object('code','CROSS_SCHOOL_CONTACT',
      'message','Um contato vinculado pertence a outra escola.'));
  end if;

  -- Bem exclusivo é dependente; compartilhado e patrimônio manual são preservados.
  select coalesce(array_agg(a.id order by a.id),array[]::text[])
    into assets from public.assets a where
    a.id in (select distinct i.linked_asset_id from public.registered_invoices i
       where i.id=any(invoices) and i.linked_asset_id is not null)
    and not exists(select 1 from public.registered_invoices neighbor
       where neighbor.linked_asset_id=a.id and not(neighbor.id=any(invoices)));
  if exists(select 1 from public.assets a where a.id=any(assets) and a.school_id<>school) then
    blockers:=blockers||jsonb_build_array(jsonb_build_object('code','CROSS_SCHOOL_ASSET',
      'message','Um bem vinculado pertence a outra escola.'));
  end if;
  select coalesce(jsonb_agg(s.id order by s.id),'[]'::jsonb)
    into mapped from (
      select distinct i.linked_asset_id id from public.registered_invoices i
      where i.id=any(invoices) and i.linked_asset_id is not null
        and not(i.linked_asset_id=any(assets))
    ) s;
  preserved:=jsonb_build_object('sharedAssetIds',mapped,'otherContexts',true,
     'generalContacts',true,'unlinkedQualityMovements',true,'automaticTransfer',false);
  if jsonb_array_length(mapped)>0 then
    warnings:=warnings||jsonb_build_array(jsonb_build_object('code','SHARED_ASSETS_PRESERVED',
      'message','Bens compartilhados com outras notas serão preservados.'));
  end if;
  if exists(select 1 from public.assets a where a.id=any(assets) and a.status='Inventariada') then
    warnings:=warnings||jsonb_build_array(jsonb_build_object('code','ASSET_INVENTORIED_DELETED',
      'message','Bem Inventariado exclusivo será excluído no RADAR; atos externos não serão desfeitos.'));
  end if;
  if exists(select 1 from public.pendencies p where p.school_id=school
       and p.competence_origin=competence and p.program_id is null
       and p.registered_invoice_id is null) then
    warnings:=warnings||jsonb_build_array(jsonb_build_object('code','LEGACY_PENDENCY_PRESERVED',
      'message','Pendências sem programa identificado serão preservadas.'));
  end if;

  -- Identificada por NF do pacote: desfazer identificação sem destruir a saída.
  for movement in select m.id,m.row_version,m.status,m.school_id,m.competence_id
      from public.quality_provisional_movements m where m.registered_invoice_id=any(invoices)
      order by m.id loop
    if movement.status<>'identified' or movement.school_id<>school or movement.competence_id<>competence then
      blockers:=blockers||jsonb_build_array(jsonb_build_object('code','QUALITY_MOVEMENT_INCONSISTENT',
        'message','Saída provisória vinculada não corresponde ao contexto.'));
    else
      updates:=updates||jsonb_build_array(jsonb_build_object('entity','quality_provisional_movements',
        'id',movement.id::text,'field','status','before','identified','after','open'));
      versions:=jsonb_set(versions,'{quality_provisional_movements}',
        coalesce(versions->'quality_provisional_movements','{}'::jsonb)
        ||jsonb_build_object(movement.id::text,movement.row_version));
    end if;
  end loop;
  versions:=versions||jsonb_build_object('verifications',jsonb_build_object(ver.id,ver.row_version));
  select coalesce(jsonb_object_agg(i.id,i.row_version),'{}'::jsonb) into mapped
    from public.registered_invoices i where i.id=any(invoices);
  versions:=versions||jsonb_build_object('registered_invoices',mapped);
  select coalesce(jsonb_object_agg(p.id,p.row_version),'{}'::jsonb) into mapped
    from public.pendencies p where p.id=any(pendencies);
  versions:=versions||jsonb_build_object('pendencies',mapped);
  select coalesce(jsonb_object_agg(a.id,a.row_version),'{}'::jsonb) into mapped
    from public.pendency_attempts a where a.id=any(attempts);
  versions:=versions||jsonb_build_object('pendency_attempts',mapped);
  select coalesce(jsonb_object_agg(c.id,c.row_version),'{}'::jsonb) into mapped
    from public.pendency_contacts c where c.id=any(contacts);
  versions:=versions||jsonb_build_object('pendency_contacts',mapped);
  select coalesce(jsonb_object_agg(a.id,a.row_version),'{}'::jsonb) into mapped
    from public.assets a where a.id=any(assets);
  versions:=versions||jsonb_build_object('assets',mapped);

  plan:=jsonb_build_object('contractVersion',1,'action','delete_context',
    'target',jsonb_build_object('kind','program_context','schoolId',school,
      'competence',competence,'programId',program),
    'changes','{}'::jsonb,'selectedPendencyIds',null,
    'effects',jsonb_build_object('delete',jsonb_build_object(
      'verifications',jsonb_build_array(ver.id),
      'registered_invoices',to_jsonb(invoices),'pendencies',to_jsonb(pendencies),
      'pendency_attempts',to_jsonb(attempts),'pendency_contacts',to_jsonb(contacts),
      'assets',to_jsonb(assets)),'update',updates),
    'counts',jsonb_build_object('verifications',1,'invoices',cardinality(invoices),
      'pendencies',cardinality(pendencies),'attempts',cardinality(attempts),
      'contacts',cardinality(contacts),'assets',cardinality(assets),
      'updates',jsonb_array_length(updates)),
    'versions',versions,'preserved',preserved,'warnings',warnings,'blockers',blockers);
  return plan||jsonb_build_object('planDigest',encode(sha256(convert_to(plan::text,'UTF8')),'hex'));
end $$;
revoke all on function radar_private.operational_correction_build_plan(jsonb)
  from public,anon,authenticated;

-- Log institucional específico. O log não é o dado operacional a excluir.
alter function radar_private.operational_correction_log(jsonb,uuid,text,text)
  rename to operational_correction_log_r2;
create function radar_private.operational_correction_log(
  p_plan jsonb,p_operation_key uuid,p_role text,p_note text
) returns void language plpgsql security definer
set search_path=pg_catalog,public,radar_private as $$
declare actor text; profile text; program_name text;
begin
  if p_plan->>'action' is distinct from 'delete_context' then
    perform radar_private.operational_correction_log_r2(p_plan,p_operation_key,p_role,p_note);
    return;
  end if;
  select coalesce(nullif(c.name,''),nullif(u.email,''),u.id::text)
    into actor from auth.users u left join public.controllers c on c.user_id=u.id
    where u.id=auth.uid();
  select name into program_name from public.programs where id=p_plan #>> '{target,programId}';
  select label into strict profile from public.profiles where id=p_role;
  insert into public.administrative_logs
    (id,school_id,actor_user_id,user_identifier,profile_name,action,details)
  values ('correcao-operacional-'||p_operation_key,p_plan #>> '{target,schoolId}',
    auth.uid(),actor,profile,'Lançamentos do contexto excluídos',
    jsonb_build_object('operationKey',p_operation_key,'target',p_plan->'target',
      'counts',p_plan->'counts','preserved',p_plan->'preserved',
      'text',concat_ws(' · ',p_plan #>> '{target,competence}',program_name,
        'Exclusão dos lançamentos do programa/mês',p_note)));
end $$;
revoke all on function radar_private.operational_correction_log(jsonb,uuid,text,text)
  from public,anon,authenticated;

-- Tudo abaixo acontece dentro da MESMA transação do RPC público.
-- A aplicação R2 executa ledger, locks, versões, exclusões dependentes e receipt;
-- depois elimina a verificação raiz. Em falha, o PostgreSQL reverte o conjunto.
alter function radar_private.apply_operational_change_impl(jsonb,text,uuid)
  rename to apply_operational_change_impl_r2;
-- Impede chamada direta da implementação antiga: ela não remove a raiz T4.
revoke all on function radar_private.apply_operational_change_impl_r2(jsonb,text,uuid)
  from public,anon,authenticated;
create function radar_private.apply_operational_change_impl(
  p_request jsonb,p_plan_digest text,p_operation_key uuid
) returns jsonb language plpgsql volatile security definer
set search_path=pg_catalog,public,radar_private as $$
declare receipt jsonb; plan jsonb; row_id text; version integer; deleted integer;
begin
  if p_request->>'action' is distinct from 'delete_context' then
    return radar_private.apply_operational_change_impl_r2(p_request,p_plan_digest,p_operation_key);
  end if;
  receipt:=radar_private.apply_operational_change_impl_r2(p_request,p_plan_digest,p_operation_key);
  if coalesce((receipt->>'replayed')::boolean,false) then
    return receipt;
  end if;
  select l.plan into strict plan from radar_private.operational_change_ledger l
    where l.operation_key=p_operation_key and l.status='committed';
  for row_id in select value from jsonb_array_elements_text(plan #> '{effects,delete,verifications}') loop
    version:=(plan->'versions'->'verifications'->>row_id)::integer;
    delete from public.verifications where id=row_id and row_version=version;
    get diagnostics deleted=row_count;
    if deleted<>1 then raise exception 'OPTIMISTIC_CONFLICT: verifications/%',row_id; end if;
  end loop;
  return receipt;
end $$;
revoke all on function radar_private.apply_operational_change_impl(jsonb,text,uuid)
  from public,anon,authenticated;
grant execute on function radar_private.apply_operational_change_impl(jsonb,text,uuid)
  to authenticated,service_role;

-- Atualização explícita do wrapper público, evitando ligar ao OID renomeado.
create or replace function public.apply_operational_change(
  p_request jsonb,p_plan_digest text,p_operation_key uuid
) returns jsonb language sql volatile security invoker
set search_path=pg_catalog,radar_private as $$
  select radar_private.apply_operational_change_impl(p_request,p_plan_digest,p_operation_key)
$$;
revoke all on function public.apply_operational_change(jsonb,text,uuid) from public,anon;
grant execute on function public.apply_operational_change(jsonb,text,uuid) to authenticated,service_role;
commit;
