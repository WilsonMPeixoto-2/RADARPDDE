-- Correção integrada da bonificação: critérios manuais e projeções verificáveis.
-- Reusa o planner privado R2 e a autoridade existente de preview/apply/ledger/RLS.
begin;
create or replace function radar_private.operational_correction_build_plan_r2(p_request jsonb)
returns jsonb
language plpgsql stable security definer
set search_path = pg_catalog, public, radar_private
as $$
declare
    v_target jsonb := p_request -> 'target';
    v_changes jsonb := p_request -> 'changes';
    v_mark text;
    v_doc text := v_target ->> 'documentKey';
    v_derived boolean;
    v_service jsonb;
    v_versions jsonb := '{}'::jsonb;
    v_next_analysis text;
    v_extra jsonb := '[]'::jsonb;
    v_before text;
    v_verification public.verifications%rowtype;
    v_updates jsonb;
    v_blockers jsonb := '[]';
    v_plan jsonb;
begin
    if (p_request ->> 'action') is distinct from 'correct_bonification' then
        return radar_private.operational_correction_build_plan_r1(p_request);
    end if;
    if (p_request -> 'contractVersion') is distinct from '1'::jsonb
        or (v_target ->> 'kind') is distinct from 'verification'
        or nullif(btrim(v_target ->> 'schoolId'),'') is null
        or nullif(btrim(v_target ->> 'competence'),'') is null
        or nullif(btrim(v_target ->> 'programId'),'') is null then
        raise exception 'VALIDATION_ERROR: informe a verificação, escola, competência e programa';
    end if;
    if v_doc is null or v_doc not in ('extCC','extINV','notaFiscal','declBBAgil','consAssessoria','encampInventario') then
        raise exception 'ACTION_NOT_AVAILABLE: critério de bonificação inválido';
    end if;
    v_derived := v_doc in ('consAssessoria','encampInventario');
    if jsonb_typeof(v_changes) is distinct from 'object' or not (v_changes ? 'bonificacao')
       or (v_changes - 'bonificacao') <> '{}'::jsonb
       or jsonb_typeof(v_changes -> 'bonificacao') not in ('string','null')
       or (p_request ? 'selectedPendencyIds' and p_request -> 'selectedPendencyIds' not in ('null'::jsonb, '[]'::jsonb)) then
        raise exception 'VALIDATION_ERROR: informe somente a marca de bonificação a corrigir';
    end if;
    v_mark := nullif(btrim(v_changes ->> 'bonificacao'),'');
    if v_mark is not null and v_mark not in ('Sim','Não','Não se aplica') then
        raise exception 'VALIDATION_ERROR: marca de bonificação inválida';
    end if;

    if v_doc in ('extCC','extINV') and v_mark = 'Não se aplica' then
        raise exception 'VALIDATION_ERROR: extratos não admitem Não se aplica';
    end if;
    if v_derived and v_mark is not null then
        raise exception 'VALIDATION_ERROR: critério derivado exige conferência dos registros de origem, não escolha manual';
    end if;

    select * into v_verification from public.verifications
     where school_id = v_target ->> 'schoolId' and competence_id = v_target ->> 'competence'
       and program_id = v_target ->> 'programId';
    if not found then
        raise exception 'NOT_FOUND: verificação do programa e competência';
    end if;
    if v_target ->> 'id' is not null and v_target ->> 'id' <> v_verification.id then
        raise exception 'VALIDATION_ERROR: a verificação não pertence ao contexto informado';
    end if;
    v_before := nullif(btrim(v_verification.bonification ->> v_doc),'');
    if v_derived then
        select jsonb_build_object('registered_invoices',coalesce(jsonb_object_agg(i.id,i.row_version),'{}'::jsonb))
        into v_versions from radar_private.operational_correction_context_invoices(v_verification.id) i;
        if v_doc = 'consAssessoria' then
            if exists(select 1 from radar_private.operational_correction_context_invoices(v_verification.id) i
                where lower(i.expense_type)='servico' and jsonb_typeof(i.payload->'consultaAssessoriaEnviada') is distinct from 'boolean') then
                v_blockers := v_blockers || jsonb_build_array(jsonb_build_object('code','AMBIGUOUS_ADVISORY_DELIVERY',
                    'message','Confira o envio de cada nota de serviço na seção Consulta à Assessoria. Há registro sem indicação individual de envio; nenhuma entrega será presumida.'));
            end if;
            v_service := radar_private.operational_correction_service_projection(v_verification.id);
            v_mark := v_service->>'delivery';
            if v_verification.bonification->'consEnviada' is distinct from v_service->'sent' then
                v_extra := v_extra || jsonb_build_array(jsonb_build_object('entity','verifications','id',v_verification.id,
                    'field','bonification.consEnviada','before',v_verification.bonification->'consEnviada','after',v_service->'sent'));
            end if;
        else
            v_mark := radar_private.operational_correction_inventory_projection(v_verification.id);
            select v_versions || jsonb_build_object('assets',coalesce(jsonb_object_agg(a.id,a.row_version),'{}'::jsonb))
            into v_versions from public.assets a where a.id in (
                select i.linked_asset_id from radar_private.operational_correction_context_invoices(v_verification.id) i
                where i.linked_asset_id is not null);
        end if;
    end if;
    if v_doc = 'declBBAgil' and (v_mark = 'Não se aplica' or v_before = 'Não se aplica') and v_before is distinct from v_mark then
        if exists(select 1 from public.pendencies p
             where p.school_id=v_verification.school_id and p.competence_origin=v_verification.competence_id
             and (p.program_id=v_verification.program_id or nullif(btrim(p.program_id),'') is null)
             and p.document_key='declBBAgil' and p.status in ('Aberta','Aguardando reanálise')) then
            v_blockers := v_blockers || jsonb_build_array(jsonb_build_object('code','ACTIVE_PENDENCY',
                'message','A Declaração BB Ágil tem pendência ativa. Confira ou corrija a pendência antes de alterar Não se aplica.'));
        end if;
        v_next_analysis := case when v_mark = 'Não se aplica' then 'Correto' else 'Não analisado' end;
        if coalesce(v_verification.analysis->>v_doc,'Não analisado') is distinct from v_next_analysis then
            v_extra := v_extra || jsonb_build_array(jsonb_build_object('entity','verifications','id',v_verification.id,
                'field','analysis.'||v_doc,'before',coalesce(v_verification.analysis->>v_doc,'Não analisado'),'after',v_next_analysis));
        end if;
    end if;
    if v_before is not distinct from v_mark and jsonb_array_length(v_extra)=0 then
        v_blockers := v_blockers || jsonb_build_array(jsonb_build_object('code','NO_EFFECT','message','A avaliação já corresponde aos registros. Nenhuma alteração é necessária.'));
    end if;

    v_updates := jsonb_build_array(jsonb_build_object(
        'entity','verifications','id',v_verification.id,'field','bonification.'||v_doc,
        'before',v_before,'after',v_mark));
    if v_verification.bonus_result in ('apta','inapta') then
        v_updates := v_updates || jsonb_build_array(jsonb_build_object(
            'entity','verifications','id',v_verification.id,'field','bonus_result',
            'before',v_verification.bonus_result,'after',null));
    end if;
    v_updates := v_updates || v_extra;
    v_plan := jsonb_build_object(
        'contractVersion',1,'action','correct_bonification',
        'target',jsonb_build_object('kind','verification','id',v_verification.id,
            'schoolId',v_verification.school_id,'competence',v_verification.competence_id,
            'programId',v_verification.program_id,'documentKey',v_doc),
        'changes',jsonb_build_object('bonificacao',v_mark),'selectedPendencyIds',null,
        'effects',jsonb_build_object('update',v_updates,'delete',jsonb_build_object(
            'registered_invoices','[]'::jsonb,'pendencies','[]'::jsonb,'pendency_attempts','[]'::jsonb,
            'pendency_contacts','[]'::jsonb,'assets','[]'::jsonb)),
        'counts',jsonb_build_object('invoices',0,'pendencies',0,'attempts',0,'contacts',0,'assets',0,'updates',jsonb_array_length(v_updates)),
        'versions',v_versions || jsonb_build_object('verifications',jsonb_build_object(v_verification.id,v_verification.row_version)),
        'preserved',jsonb_build_object('analysis',case when v_doc='declBBAgil' and v_next_analysis is not null
            then coalesce(v_verification.analysis,'{}'::jsonb) - 'declBBAgil' else v_verification.analysis end),
        'warnings','[]'::jsonb,'blockers',v_blockers);
    return v_plan || jsonb_build_object('planDigest', encode(sha256(convert_to(v_plan::text,'UTF8')),'hex'));
end
$$;
revoke all on function radar_private.operational_correction_build_plan_r2(jsonb) from public, anon, authenticated;


alter function radar_private.apply_operational_change_impl(jsonb,text,uuid)
  rename to apply_operational_change_impl_r4;
revoke all on function radar_private.apply_operational_change_impl_r4(jsonb,text,uuid) from public,anon,authenticated;
create function radar_private.apply_operational_change_impl(p_request jsonb,p_plan_digest text,p_operation_key uuid)
returns jsonb language plpgsql volatile security definer
set search_path=pg_catalog,public,radar_private as $$
declare
  tgt jsonb := coalesce(p_request->'target','{}'::jsonb);
  school text := nullif(btrim(tgt->>'schoolId'),'');
  competence text := nullif(btrim(tgt->>'competence'),'');
  program text := nullif(btrim(tgt->>'programId'),'');
begin
  if p_request->>'action' = 'correct_bonification' and tgt->>'documentKey' in ('extCC','extINV','declBBAgil','consAssessoria','encampInventario') then
    perform radar_private.operational_correction_capability(school);
    if school is not null and competence is not null and program is not null then
      perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(concat_ws('::',school,competence,program),20261123));
    end if;
  end if;
  return radar_private.apply_operational_change_impl_r4(p_request,p_plan_digest,p_operation_key);
end $$;
revoke all on function radar_private.apply_operational_change_impl(jsonb,text,uuid) from public,anon,authenticated;
grant execute on function radar_private.apply_operational_change_impl(jsonb,text,uuid) to authenticated,service_role;
create or replace function public.apply_operational_change(p_request jsonb,p_plan_digest text,p_operation_key uuid)
returns jsonb language sql volatile security invoker set search_path=pg_catalog,radar_private as $$
  select radar_private.apply_operational_change_impl(p_request,p_plan_digest,p_operation_key)
$$;
revoke all on function public.apply_operational_change(jsonb,text,uuid) from public,anon;
grant execute on function public.apply_operational_change(jsonb,text,uuid) to authenticated,service_role;
commit;
