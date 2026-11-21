-- Correções T2/T3. Não há transformação de dados históricos.
-- Mantém as RPCs e o formato do recibo da migration 20261114000100.
create or replace function radar_private.operational_correction_context_invoices(p_verification_id text)
returns setof public.registered_invoices
language sql stable
set search_path = pg_catalog, public
as $$
    select i.* from public.verifications v
    join public.registered_invoices i on i.school_id = v.school_id
        and i.competence_id = v.competence_id and i.program_id = v.program_id
        and (i.verification_id = v.id or i.verification_id is null)
    where v.id = p_verification_id
$$;

create or replace function radar_private.operational_correction_context_verification(p_invoice public.registered_invoices)
returns public.verifications
language sql stable
set search_path = pg_catalog, public
as $$
    select v.* from public.verifications v
    where v.school_id = p_invoice.school_id and v.competence_id = p_invoice.competence_id
      and v.program_id = p_invoice.program_id
      and (p_invoice.verification_id is null or v.id = p_invoice.verification_id)
$$;

create or replace function radar_private.operational_correction_effective_analysis(
    p_invoice public.registered_invoices, p_field text, p_verification public.verifications
)
returns text
language plpgsql stable
set search_path = pg_catalog, public, radar_private
as $$
declare
    v_keys constant text[] := array['analiseDocumentoFiscal', 'documentAnalysis', 'document_analysis'];
    v_service text := btrim(p_invoice.payload ->> 'analiseConsultaAssessoria');
begin
    if p_field = 'analiseConsultaAssessoria' then
        if v_service in ('Não analisado','Correto','Correto (Atrasado)','Correto após o prazo','Incorreto') then
            return radar_private.operational_correction_normalize_analysis(v_service);
        end if;
        if not exists (
            select 1 from radar_private.operational_correction_context_invoices(p_verification.id) i
             where i.id <> p_invoice.id and lower(i.expense_type) = 'servico'
        ) then
            return radar_private.operational_correction_normalize_analysis(p_verification.analysis ->> 'consAssessoria');
        end if;
        return 'Não analisado';
    end if;

    if lower(p_invoice.expense_type) = 'a_identificar' or p_invoice.payload ?| v_keys or exists (
        select 1 from radar_private.operational_correction_context_invoices(p_verification.id) i
         where i.id <> p_invoice.id
    ) then
        return radar_private.operational_correction_invoice_analysis(p_invoice.expense_type, p_invoice.payload);
    end if;
    return radar_private.operational_correction_normalize_analysis(p_verification.analysis ->> 'notaFiscal');
end
$$;

revoke all on function radar_private.operational_correction_context_invoices(text) from public, anon, authenticated;
revoke all on function radar_private.operational_correction_context_verification(public.registered_invoices) from public, anon, authenticated;
revoke all on function radar_private.operational_correction_effective_analysis(public.registered_invoices,text,public.verifications) from public, anon, authenticated;

create or replace function radar_private.operational_correction_invoice_aggregate(
    p_verification_id text,
    p_excluded_ids text[],
    p_overrides jsonb
)
returns text
language plpgsql
stable
security definer
set search_path = pg_catalog, public, radar_private
as $$
declare
    v_states text[];
    v_has_explicit boolean;
begin
    select
        coalesce(array_agg(
            case
                when coalesce(p_overrides, '{}'::jsonb) ? invoice.id
                    then radar_private.operational_correction_normalize_analysis(p_overrides ->> invoice.id)
                else radar_private.operational_correction_invoice_analysis(invoice.expense_type, invoice.payload)
            end
        ), array[]::text[]),
        coalesce(bool_or(
            coalesce(p_overrides, '{}'::jsonb) ? invoice.id
            or coalesce(invoice.payload, '{}'::jsonb) ?| array['analiseDocumentoFiscal', 'documentAnalysis', 'document_analysis']
        ), false)
      into v_states, v_has_explicit
      from radar_private.operational_correction_context_invoices(p_verification_id) invoice
     where invoice.id <> all (coalesce(p_excluded_ids, array[]::text[]))
       and lower(invoice.expense_type) in ('consumo', 'permanente', 'servico', 'boleto_internet', 'a_identificar');

    if cardinality(v_states) = 0 then
        return null;
    end if;
    if not v_has_explicit then
        return 'KEEP';
    end if;
    if 'Incorreto' = any (v_states) then return 'Incorreto'; end if;
    if 'Não analisado' = any (v_states) then return 'Não analisado'; end if;
    if 'Correto (Atrasado)' = any (v_states) then return 'Correto (Atrasado)'; end if;
    return 'Correto';
end
$$;

create or replace function radar_private.operational_correction_service_projection(
    p_verification_id text,
    p_excluded_invoice_id text default null,
    p_override_invoice_id text default null,
    p_override_analysis text default null
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public, radar_private
as $$
    with notes as (
        select
            coalesce((i.payload ->> 'consultaAssessoriaEnviada')::boolean, false) as sent,
            case when i.id = p_override_invoice_id
                then p_override_analysis
                else radar_private.operational_correction_normalize_analysis(i.payload ->> 'analiseConsultaAssessoria')
            end as analysis
        from radar_private.operational_correction_context_invoices(p_verification_id) i
        where lower(i.expense_type) = 'servico'
          and (p_excluded_invoice_id is null or i.id <> p_excluded_invoice_id)
    )
    select jsonb_build_object(
        'delivery', case when count(*) = 0 then 'Não se aplica'
            when bool_or(sent) then 'Sim' else 'Não' end,
        'sent', coalesce(bool_or(sent), false),
        'analysis', case when count(*) = 0 then 'Correto'
            when bool_or(analysis = 'Incorreto') then 'Incorreto'
            when bool_or(analysis = 'Não analisado') then 'Não analisado'
            when bool_or(analysis = 'Correto (Atrasado)') then 'Correto (Atrasado)'
            else 'Correto' end
    )
    from notes
$$;

create or replace function radar_private.operational_correction_inventory_projection(
    p_verification_id text, p_excluded_invoice_id text default null
)
returns text
language sql
stable
security definer
set search_path = pg_catalog, public, radar_private
as $$
    with items as (
        select a.status
        from radar_private.operational_correction_context_invoices(p_verification_id) i
        left join public.assets a on a.id = i.linked_asset_id
        where lower(i.expense_type) = 'permanente'
          and (p_excluded_invoice_id is null or i.id <> p_excluded_invoice_id)
    )
    select case when count(*) = 0 then 'Não se aplica'
        when count(*) filter (where status in ('Encaminhada', 'Inventariada')) = count(*) then 'Sim'
        else 'Não' end
    from items
$$;

create or replace function radar_private.operational_correction_build_plan(p_request jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public, radar_private
as $$
declare
    c_supported constant text[] := array['delete_invoice', 'delete_pendency', 'clear_analysis', 'correct_analysis'];
    c_future constant text[] := array[
        'undo_quality_identification', 'delete_quality_movement', 'correct_bonification',
        'clear_item_history', 'delete_context', 'delete_attempt', 'delete_review', 'correct_attempt',
        'correct_review', 'delete_contact', 'correct_contact', 'correct_inventory', 'delete_asset'
    ];
    v_request jsonb := coalesce(p_request, '{}'::jsonb);
    v_action text := nullif(btrim(v_request ->> 'action'), '');
    v_target jsonb := coalesce(v_request -> 'target', '{}'::jsonb);
    v_kind text := nullif(btrim(v_target ->> 'kind'), '');
    v_id text := nullif(btrim(v_target ->> 'id'), '');
    v_school text := nullif(btrim(v_target ->> 'schoolId'), '');
    v_competence text := nullif(btrim(v_target ->> 'competence'), '');
    v_program text := nullif(btrim(v_target ->> 'programId'), '');
    v_document text := nullif(btrim(v_target ->> 'documentKey'), '');
    v_selected text[];
    v_has_selection boolean := v_request ? 'selectedPendencyIds';
    v_invoice public.registered_invoices%rowtype;
    v_verification public.verifications%rowtype;
    v_pendency public.pendencies%rowtype;
    v_asset public.assets%rowtype;
    v_candidates text[] := array[]::text[];
    v_pendency_ids text[] := array[]::text[];
    v_attempt_ids text[] := array[]::text[];
    v_contact_ids text[] := array[]::text[];
    v_invoice_ids text[] := array[]::text[];
    v_asset_ids text[] := array[]::text[];
    v_updates jsonb := '[]'::jsonb;
    v_versions jsonb := '{}'::jsonb;
    v_warnings jsonb := '[]'::jsonb;
    v_blockers jsonb := '[]'::jsonb;
    v_preserved jsonb := '{}'::jsonb;
    v_field text;
    v_current text;
    v_requested text;
    v_aggregate text;
    v_aggregate_before text;
    v_service_projection jsonb;
    v_inventory_delivery text;
    v_inventory_analysis text;
    v_overrides jsonb := '{}'::jsonb;
    v_is_invoice_level boolean := false;
    v_movement record;
    v_map jsonb;
    v_attempt_count integer := 0;
    v_plan jsonb;
begin
    if coalesce(v_request -> 'contractVersion', 'null'::jsonb) <> '1'::jsonb then
        raise exception 'VALIDATION_ERROR: contractVersion deve ser 1';
    end if;

    if v_action is null or not (v_action = any (c_supported)) then
        if v_action = any (c_future) then
            raise exception 'ACTION_NOT_AVAILABLE: a ação % ainda não foi implementada neste contrato', v_action;
        end if;
        raise exception 'VALIDATION_ERROR: ação desconhecida %', coalesce(v_action, '(vazia)');
    end if;

    if v_school is null or v_competence is null then
        raise exception 'VALIDATION_ERROR: target.schoolId e target.competence são obrigatórios';
    end if;

    if v_has_selection then
        if jsonb_typeof(v_request -> 'selectedPendencyIds') <> 'array' then
            raise exception 'VALIDATION_ERROR: selectedPendencyIds deve ser uma lista';
        end if;
        select coalesce(array_agg(distinct value order by value), array[]::text[])
          into v_selected
          from jsonb_array_elements_text(v_request -> 'selectedPendencyIds') as selected(value);
    end if;

    -- ---------------------------------------------------------------- T3
    if v_action = 'delete_invoice' then
        if v_kind is distinct from 'invoice' or v_id is null then
            raise exception 'VALIDATION_ERROR: delete_invoice exige target.kind = invoice e target.id';
        end if;

        select * into v_invoice from public.registered_invoices where id = v_id;
        if not found then
            raise exception 'NOT_FOUND: registered_invoices/%', v_id;
        end if;
        if v_invoice.school_id <> v_school
           or v_invoice.competence_id is distinct from v_competence
           or (v_program is not null and v_invoice.program_id is distinct from v_program) then
            raise exception 'VALIDATION_ERROR: a despesa não pertence ao contexto informado';
        end if;

        v_invoice_ids := array[v_invoice.id];
        v_versions := jsonb_set(v_versions, '{registered_invoices}', jsonb_build_object(v_invoice.id, v_invoice.row_version));

        -- Pendências fiscais e de Assessoria da própria NF, em qualquer estado.
        select coalesce(array_agg(p.id order by p.id), array[]::text[]),
               coalesce(jsonb_object_agg(p.id, p.row_version), '{}'::jsonb)
          into v_pendency_ids, v_map
          from public.pendencies p
         where p.registered_invoice_id = v_invoice.id;
        v_versions := v_versions || jsonb_build_object('pendencies', v_map);

        -- Bem derivado: exclusivo é excluído (inclusive Inventariada); compartilhado é preservado.
        if v_invoice.linked_asset_id is not null then
            select * into v_asset from public.assets where id = v_invoice.linked_asset_id;
            if found then
                if exists (
                    select 1 from public.registered_invoices other
                     where other.linked_asset_id = v_asset.id and other.id <> v_invoice.id
                ) then
                    v_preserved := v_preserved || jsonb_build_object('sharedAssetId', v_asset.id);
                    v_warnings := v_warnings || jsonb_build_array(jsonb_build_object(
                        'code', 'ASSET_SHARED_PRESERVED',
                        'message', 'O bem vinculado também pertence a outra nota e será preservado.'));
                else
                    v_asset_ids := array[v_asset.id];
                    v_versions := v_versions || jsonb_build_object('assets', jsonb_build_object(v_asset.id, v_asset.row_version));
                    if v_asset.status = 'Inventariada' then
                        v_warnings := v_warnings || jsonb_build_array(jsonb_build_object(
                            'code', 'ASSET_INVENTORIED_DELETED',
                            'message', 'O bem vinculado já está Inventariado e também será excluído.'));
                    end if;
                end if;
            end if;
        end if;

        -- Saída provisória do PDDE Qualidade identificada por esta NF volta a aberta (§7, regra padrão).
        for v_movement in
            select m.id, m.row_version
              from public.quality_provisional_movements m
             where m.registered_invoice_id = v_invoice.id
             order by m.id
        loop
            v_updates := v_updates || jsonb_build_array(jsonb_build_object(
                'entity', 'quality_provisional_movements', 'id', v_movement.id::text,
                'field', 'status', 'before', 'identified', 'after', 'open'));
            v_versions := jsonb_set(v_versions, '{quality_provisional_movements}',
                coalesce(v_versions -> 'quality_provisional_movements', '{}'::jsonb)
                || jsonb_build_object(v_movement.id::text, v_movement.row_version));
        end loop;

        -- Agregado de Notas Fiscais da verificação (bonificação preservada — ADR-055).
        v_verification := radar_private.operational_correction_context_verification(v_invoice);
        if v_verification.id is not null then
            v_aggregate_before := v_verification.analysis ->> 'notaFiscal';
            v_aggregate := radar_private.operational_correction_invoice_aggregate(
                v_verification.id, array[v_invoice.id], '{}'::jsonb);
            if v_aggregate is distinct from 'KEEP' and v_aggregate is distinct from v_aggregate_before then
                v_updates := v_updates || jsonb_build_array(jsonb_build_object(
                    'entity', 'verifications', 'id', v_verification.id,
                    'field', 'analysis.notaFiscal', 'before', v_aggregate_before, 'after', v_aggregate));
            end if;
            -- Dependências usadas nos agregados também participam do digest e do lock.
            -- Não bastaria observar apenas a NF excluída: outra NF pode mudar entre preview/apply.
            select coalesce(jsonb_object_agg(i.id, i.row_version), '{}'::jsonb) into v_map
              from radar_private.operational_correction_context_invoices(v_verification.id) i
             where i.id <> v_invoice.id;
            v_versions := jsonb_set(v_versions, '{registered_invoices}',
                coalesce(v_versions -> 'registered_invoices', '{}'::jsonb) || v_map);

            if lower(v_invoice.expense_type) = 'servico' then
                v_service_projection := radar_private.operational_correction_service_projection(
                    v_verification.id, v_invoice.id);
                if v_verification.bonification ->> 'consAssessoria'
                     is distinct from v_service_projection ->> 'delivery' then
                    v_updates := v_updates || jsonb_build_array(jsonb_build_object(
                        'entity', 'verifications', 'id', v_verification.id,
                        'field', 'bonification.consAssessoria',
                        'before', v_verification.bonification -> 'consAssessoria',
                        'after', v_service_projection -> 'delivery'));
                end if;
                if coalesce((v_verification.bonification ->> 'consEnviada')::boolean, false)
                     is distinct from (v_service_projection ->> 'sent')::boolean then
                    v_updates := v_updates || jsonb_build_array(jsonb_build_object(
                        'entity', 'verifications', 'id', v_verification.id,
                        'field', 'bonification.consEnviada',
                        'before', v_verification.bonification -> 'consEnviada',
                        'after', v_service_projection -> 'sent'));
                end if;
                if v_verification.analysis ->> 'consAssessoria'
                     is distinct from v_service_projection ->> 'analysis' then
                    v_updates := v_updates || jsonb_build_array(jsonb_build_object(
                        'entity', 'verifications', 'id', v_verification.id,
                        'field', 'analysis.consAssessoria',
                        'before', v_verification.analysis -> 'consAssessoria',
                        'after', v_service_projection -> 'analysis'));
                end if;
            end if;

            if lower(v_invoice.expense_type) = 'permanente' then
                v_inventory_delivery := radar_private.operational_correction_inventory_projection(
                    v_verification.id, v_invoice.id);
                v_inventory_analysis := case when v_inventory_delivery = 'Não se aplica'
                    then 'Correto' else 'Não analisado' end;
                -- A exclusão altera o universo de bens: preservar marca manual e
                -- recompor apenas a projeção patrimonial correspondente.
                if v_verification.bonification ->> 'encampInventario'
                     is distinct from v_inventory_delivery then
                    v_updates := v_updates || jsonb_build_array(jsonb_build_object(
                        'entity', 'verifications', 'id', v_verification.id,
                        'field', 'bonification.encampInventario',
                        'before', v_verification.bonification -> 'encampInventario',
                        'after', to_jsonb(v_inventory_delivery)));
                end if;
                if v_verification.analysis ->> 'encampInventario'
                     is distinct from v_inventory_analysis then
                    v_updates := v_updates || jsonb_build_array(jsonb_build_object(
                        'entity', 'verifications', 'id', v_verification.id,
                        'field', 'analysis.encampInventario',
                        'before', v_verification.analysis -> 'encampInventario',
                        'after', to_jsonb(v_inventory_analysis)));
                end if;
                select coalesce(jsonb_object_agg(a.id, a.row_version), '{}'::jsonb) into v_map
                  from public.assets a
                 where a.id in (
                     select i.linked_asset_id from radar_private.operational_correction_context_invoices(v_verification.id) i
                      where i.id <> v_invoice.id and i.linked_asset_id is not null
                 );
                v_versions := jsonb_set(v_versions, '{assets}',
                    coalesce(v_versions -> 'assets', '{}'::jsonb) || v_map);
            end if;

            v_versions := v_versions || jsonb_build_object('verifications', jsonb_build_object(v_verification.id, v_verification.row_version));
            v_preserved := v_preserved || jsonb_build_object(
                'manualBonification', coalesce(v_verification.bonification, '{}'::jsonb),
                'bonusResult', v_verification.bonus_result);
        end if;

    -- ---------------------------------------------------------------- T2
    elsif v_action = 'delete_pendency' then
        if v_kind is distinct from 'pendency' or v_id is null then
            raise exception 'VALIDATION_ERROR: delete_pendency exige target.kind = pendency e target.id';
        end if;

        select * into v_pendency from public.pendencies where id = v_id;
        if not found then
            raise exception 'NOT_FOUND: pendencies/%', v_id;
        end if;
        if v_pendency.school_id <> v_school
           or v_pendency.competence_origin <> v_competence
           or (v_program is not null and v_pendency.program_id is distinct from v_program) then
            raise exception 'VALIDATION_ERROR: a Pendência não pertence ao contexto informado';
        end if;

        v_pendency_ids := array[v_pendency.id];
        v_versions := jsonb_build_object('pendencies', jsonb_build_object(v_pendency.id, v_pendency.row_version));

        if v_pendency.status in ('Aberta', 'Aguardando reanálise') then
            if v_pendency.registered_invoice_id is not null then
                select * into v_invoice from public.registered_invoices where id = v_pendency.registered_invoice_id;
                if found then
                    if lower(v_invoice.expense_type) = 'a_identificar' and v_pendency.document_key = 'notaFiscal' then
                        v_blockers := v_blockers || jsonb_build_array(jsonb_build_object(
                            'code', 'MANDATORY_PENDENCY',
                            'message', 'A despesa a identificar exige esta Pendência. Para corrigir, exclua a despesa.'));
                    else
                        v_field := case v_pendency.document_key
                            when 'consAssessoria' then 'analiseConsultaAssessoria'
                            else 'analiseDocumentoFiscal' end;
                        v_verification := radar_private.operational_correction_context_verification(v_invoice);
                        v_current := radar_private.operational_correction_effective_analysis(v_invoice, v_field, v_verification);
                        if v_current = 'Incorreto' and not exists (
                            select 1 from public.pendencies other
                             where other.registered_invoice_id = v_invoice.id
                               and other.document_key = v_pendency.document_key
                               and other.status in ('Aberta', 'Aguardando reanálise')
                               and other.id <> v_pendency.id
                        ) then
                            v_updates := v_updates || jsonb_build_array(jsonb_build_object(
                                'entity', 'registered_invoices', 'id', v_invoice.id,
                                'field', 'payload.' || v_field, 'before', v_current, 'after', 'Não analisado'));
                            v_versions := v_versions || jsonb_build_object('registered_invoices', jsonb_build_object(v_invoice.id, v_invoice.row_version));
                            if v_field = 'analiseDocumentoFiscal' and v_verification.id is not null then
                                v_overrides := jsonb_build_object(v_invoice.id, 'Não analisado');
                                v_is_invoice_level := true;
                            elsif v_field = 'analiseConsultaAssessoria'
                                and v_verification.id is not null then
                                -- Excluir a única Pendência de Assessoria que sustentava
                                -- Incorreto altera também o resumo mensal da Assessoria.
                                v_service_projection := radar_private.operational_correction_service_projection(
                                    v_verification.id, null, v_invoice.id, 'Não analisado');
                                if v_verification.analysis ->> 'consAssessoria'
                                     is distinct from v_service_projection ->> 'analysis' then
                                    v_updates := v_updates || jsonb_build_array(jsonb_build_object(
                                        'entity', 'verifications', 'id', v_verification.id,
                                        'field', 'analysis.consAssessoria',
                                        'before', v_verification.analysis -> 'consAssessoria',
                                        'after', v_service_projection -> 'analysis'));
                                end if;
                                v_versions := v_versions || jsonb_build_object('verifications',
                                    jsonb_build_object(v_verification.id, v_verification.row_version));
                                select coalesce(jsonb_object_agg(i.id, i.row_version), '{}'::jsonb)
                                  into v_map from radar_private.operational_correction_context_invoices(v_verification.id) i
                                 where lower(i.expense_type) = 'servico'
                                   and i.id <> v_invoice.id;
                                v_versions := jsonb_set(v_versions, '{registered_invoices}',
                                    coalesce(v_versions -> 'registered_invoices', '{}'::jsonb) || v_map);
                            end if;
                        end if;
                    end if;
                end if;
            else
                select * into v_verification
                  from public.verifications
                 where school_id = v_pendency.school_id
                   and competence_id = v_pendency.competence_origin
                   and program_id = v_pendency.program_id;
                if found then
                    v_versions := v_versions || jsonb_build_object('verifications', jsonb_build_object(v_verification.id, v_verification.row_version));
                    if v_verification.analysis ->> v_pendency.document_key = 'Incorreto' and not exists (
                        select 1 from public.pendencies other
                         where other.school_id = v_pendency.school_id
                           and other.competence_origin = v_pendency.competence_origin
                           and other.program_id is not distinct from v_pendency.program_id
                           and other.document_key = v_pendency.document_key
                           and other.registered_invoice_id is null
                           and other.status in ('Aberta', 'Aguardando reanálise')
                           and other.id <> v_pendency.id
                    ) then
                        v_updates := v_updates || jsonb_build_array(jsonb_build_object(
                            'entity', 'verifications', 'id', v_verification.id,
                            'field', 'analysis.' || v_pendency.document_key, 'before', 'Incorreto', 'after', null));
                    end if;
                    v_preserved := v_preserved || jsonb_build_object(
                        'bonification', coalesce(v_verification.bonification, '{}'::jsonb),
                        'bonusResult', v_verification.bonus_result);
                end if;
            end if;
        else
            v_preserved := v_preserved || jsonb_build_object('analysis', 'A análise atual não é alterada ao excluir Pendência ' || lower(v_pendency.status) || '.');
        end if;

    else
        -- clear_analysis / correct_analysis
        if v_kind is distinct from 'analysis' or v_document is null or v_program is null then
            raise exception 'VALIDATION_ERROR: % exige target.kind = analysis, programId e documentKey', v_action;
        end if;

        if v_document in ('notaFiscal', 'consAssessoria') then
            if v_id is null then
                raise exception 'VALIDATION_ERROR: a análise de % é individual por nota; informe target.id', v_document;
            end if;
            v_is_invoice_level := true;
            select * into v_invoice from public.registered_invoices where id = v_id;
            if not found then
                raise exception 'NOT_FOUND: registered_invoices/%', v_id;
            end if;
            if v_invoice.school_id <> v_school
               or v_invoice.competence_id is distinct from v_competence
               or v_invoice.program_id is distinct from v_program then
                raise exception 'VALIDATION_ERROR: a despesa não pertence ao contexto informado';
            end if;
            if v_document = 'consAssessoria' and lower(v_invoice.expense_type) <> 'servico' then
                raise exception 'VALIDATION_ERROR: Consulta Assessoria só se aplica a nota de serviço';
            end if;
            v_field := case v_document when 'consAssessoria' then 'analiseConsultaAssessoria' else 'analiseDocumentoFiscal' end;
            v_verification := radar_private.operational_correction_context_verification(v_invoice);
            v_current := radar_private.operational_correction_effective_analysis(v_invoice, v_field, v_verification);
            v_versions := jsonb_build_object('registered_invoices', jsonb_build_object(v_invoice.id, v_invoice.row_version));

            select coalesce(array_agg(p.id order by p.id), array[]::text[])
              into v_candidates
              from public.pendencies p
             where p.registered_invoice_id = v_invoice.id
               and p.document_key = v_document
               and p.status in ('Aberta', 'Aguardando reanálise');

            if lower(v_invoice.expense_type) = 'a_identificar' and v_document = 'notaFiscal' then
                v_blockers := v_blockers || jsonb_build_array(jsonb_build_object(
                    'code', 'MANDATORY_ANALYSIS',
                    'message', 'A despesa a identificar nasce Incorreta com Pendência. Para corrigir, exclua a despesa.'));
            end if;

        else
            select * into v_verification
              from public.verifications
             where school_id = v_school and competence_id = v_competence and program_id = v_program;
            if not found then
                raise exception 'NOT_FOUND: verifications/%::%::%', v_school, v_competence, v_program;
            end if;
            v_current := case
                when v_verification.analysis ? v_document
                    then radar_private.operational_correction_normalize_analysis(v_verification.analysis ->> v_document)
                else 'Não analisado' end;
            v_versions := jsonb_build_object('verifications', jsonb_build_object(v_verification.id, v_verification.row_version));

            select coalesce(array_agg(p.id order by p.id), array[]::text[])
              into v_candidates
              from public.pendencies p
             where p.school_id = v_school
               and p.competence_origin = v_competence
               and p.program_id is not distinct from v_program
               and p.document_key = v_document
               and p.registered_invoice_id is null
               and p.status in ('Aberta', 'Aguardando reanálise');
        end if;

        if v_verification.id is not null then
            v_preserved := v_preserved || jsonb_build_object(
                'bonification', coalesce(v_verification.bonification, '{}'::jsonb),
                'bonusResult', v_verification.bonus_result);
        end if;

        if v_action = 'clear_analysis' then
            v_requested := 'Não analisado';
        else
            v_requested := btrim(coalesce(v_request -> 'changes' ->> 'analysis', ''));
            if v_requested not in ('Correto', 'Correto (Atrasado)', 'Incorreto') then
                raise exception 'VALIDATION_ERROR: changes.analysis deve ser Correto, Correto (Atrasado) ou Incorreto';
            end if;
            if v_requested = 'Correto'
               and lower(coalesce(v_verification.bonus_result, '')) in ('apta', 'inapta')
               and coalesce(v_verification.bonification ->> v_document, '') = 'Não' then
                v_requested := 'Correto (Atrasado)';
                v_warnings := v_warnings || jsonb_build_array(jsonb_build_object(
                    'code', 'LATE_ANALYSIS_NORMALIZED',
                    'message', 'Bonificação consolidada com entrega Não: o resultado será registrado como Correto (Atrasado).'));
            end if;
            if v_requested = 'Incorreto' then
                v_blockers := v_blockers || jsonb_build_array(jsonb_build_object(
                    'code', 'OPEN_PENDENCY_FLOW_REQUIRED',
                    'message', 'Para registrar Incorreto use Registrar análise incorreta, que abre a Pendência com os apontamentos.'));
            end if;
        end if;

        if v_requested = v_current then
            v_blockers := v_blockers || jsonb_build_array(jsonb_build_object(
                'code', 'NO_EFFECT', 'message', 'A análise já está com este resultado.'));
        end if;

        -- Consequência: somente Pendências ativas que sustentam o Incorreto atual.
        if v_current = 'Incorreto' then
            if v_has_selection then
                if not (v_selected <@ v_candidates) then
                    raise exception 'VALIDATION_ERROR: selectedPendencyIds contém Pendência fora da consequência desta análise';
                end if;
                -- Não permitir resultado correto/não analisado com uma Pendência ativa
                -- remanescente que sustenta o mesmo Incorreto.
                -- Exigir cobertura por conjunto, não apenas contagem:
                -- ["P1","P1"] não pode simular seleção de P1 e P2.
                if not (v_candidates <@ v_selected) then
                    v_blockers := v_blockers || jsonb_build_array(jsonb_build_object(
                        'code', 'INCOMPLETE_PENDENCY_SELECTION',
                        'message', 'Para corrigir esta análise, selecione todas as Pendências ativas relacionadas ou trate cada Pendência individualmente.',
                        'candidates', to_jsonb(v_candidates)));
                end if;
                v_pendency_ids := v_selected;
            elsif cardinality(v_candidates) > 1 then
                v_blockers := v_blockers || jsonb_build_array(jsonb_build_object(
                    'code', 'AMBIGUOUS_CONSEQUENCE',
                    'message', 'Há mais de uma Pendência ativa para esta análise; selecione quais serão excluídas.',
                    'candidates', to_jsonb(v_candidates)));
            else
                v_pendency_ids := v_candidates;
            end if;
        end if;

        if v_is_invoice_level then
            v_updates := v_updates || jsonb_build_array(jsonb_build_object(
                'entity', 'registered_invoices', 'id', v_invoice.id,
                'field', 'payload.' || v_field, 'before', v_current, 'after', v_requested));
            if v_field = 'analiseDocumentoFiscal' then
                v_overrides := jsonb_build_object(v_invoice.id, v_requested);
            else
                v_is_invoice_level := false;
            end if;
        else
            v_updates := v_updates || jsonb_build_array(jsonb_build_object(
                'entity', 'verifications', 'id', v_verification.id,
                'field', 'analysis.' || v_document, 'before', v_current,
                'after', case when v_requested = 'Não analisado' then null else v_requested end));
        end if;

        select coalesce(jsonb_object_agg(p.id, p.row_version), '{}'::jsonb)
          into v_map
          from public.pendencies p
         where p.id = any (v_pendency_ids);
        v_versions := v_versions || jsonb_build_object('pendencies', v_map);
    end if;

    -- Agregado de Notas Fiscais quando a análise individual de uma NF muda.
    if v_is_invoice_level and v_verification.id is not null and v_overrides <> '{}'::jsonb then
        v_aggregate_before := v_verification.analysis ->> 'notaFiscal';
        v_aggregate := radar_private.operational_correction_invoice_aggregate(v_verification.id, array[]::text[], v_overrides);
        if v_aggregate is distinct from 'KEEP' and v_aggregate is distinct from v_aggregate_before then
            v_updates := v_updates || jsonb_build_array(jsonb_build_object(
                'entity', 'verifications', 'id', v_verification.id,
                'field', 'analysis.notaFiscal', 'before', v_aggregate_before, 'after', v_aggregate));
        end if;
        v_versions := v_versions || jsonb_build_object('verifications', jsonb_build_object(v_verification.id, v_verification.row_version));
        select coalesce(jsonb_object_agg(i.id, i.row_version), '{}'::jsonb)
          into v_map from radar_private.operational_correction_context_invoices(v_verification.id) i
         where i.id <> v_invoice.id;
        v_versions := jsonb_set(v_versions, '{registered_invoices}',
            coalesce(v_versions -> 'registered_invoices', '{}'::jsonb) || v_map);
    end if;

    -- Análise individual da Assessoria: o agregado mensal deriva de TODAS as
    -- notas de serviço sobreviventes, inclusive quando se limpa a análise.
    if v_action in ('correct_analysis', 'clear_analysis')
       and v_document = 'consAssessoria' and v_verification.id is not null then
        v_service_projection := radar_private.operational_correction_service_projection(
            v_verification.id, null, v_invoice.id, v_requested);
        if v_verification.analysis ->> 'consAssessoria'
             is distinct from v_service_projection ->> 'analysis' then
            v_updates := v_updates || jsonb_build_array(jsonb_build_object(
                'entity', 'verifications', 'id', v_verification.id,
                'field', 'analysis.consAssessoria',
                'before', v_verification.analysis -> 'consAssessoria',
                'after', v_service_projection -> 'analysis'));
        end if;
        v_versions := v_versions || jsonb_build_object('verifications',
            jsonb_build_object(v_verification.id, v_verification.row_version));
        select coalesce(jsonb_object_agg(i.id, i.row_version), '{}'::jsonb)
          into v_map from radar_private.operational_correction_context_invoices(v_verification.id) i
         where lower(i.expense_type) = 'servico'
           and i.id <> v_invoice.id;
        v_versions := jsonb_set(v_versions, '{registered_invoices}',
            coalesce(v_versions -> 'registered_invoices', '{}'::jsonb) || v_map);
    end if;

    -- Dependentes comuns das Pendências planejadas.
    if cardinality(v_pendency_ids) > 0 then
        select coalesce(array_agg(a.id order by a.id), array[]::text[]), count(*)
          into v_attempt_ids, v_attempt_count
          from public.pendency_attempts a
         where a.pendency_id = any (v_pendency_ids);

        select coalesce(array_agg(c.id order by c.id), array[]::text[]),
               coalesce(jsonb_object_agg(c.id, c.row_version), '{}'::jsonb)
          into v_contact_ids, v_map
          from public.pendency_contacts c
         where c.pendency_id = any (v_pendency_ids);
        v_versions := v_versions || jsonb_build_object('pendency_contacts', v_map);

        select coalesce(jsonb_object_agg(a.id, a.row_version), '{}'::jsonb)
          into v_map
          from public.pendency_attempts a
         where a.pendency_id = any (v_pendency_ids);
        v_versions := v_versions || jsonb_build_object('pendency_attempts', v_map);

        if v_action in ('correct_analysis', 'clear_analysis') and v_attempt_count > 0 then
            v_warnings := v_warnings || jsonb_build_array(jsonb_build_object(
                'code', 'PENDENCY_HAS_SUBMISSIONS',
                'message', 'A Pendência possui envios da escola. Se o documento novo resolveu o problema, use Reanalisar em vez de corrigir o lançamento.'));
        end if;
    end if;

    v_plan := jsonb_build_object(
        'contractVersion', 1,
        'action', v_action,
        'target', jsonb_strip_nulls(jsonb_build_object(
            'kind', v_kind, 'id', v_id, 'schoolId', v_school, 'competence', v_competence,
            'programId', v_program, 'documentKey', v_document)),
        'changes', coalesce(v_request -> 'changes', '{}'::jsonb),
        'selectedPendencyIds', case when v_has_selection then to_jsonb(v_selected) else null end,
        'effects', jsonb_build_object(
            'delete', jsonb_build_object(
                'registered_invoices', to_jsonb(v_invoice_ids),
                'pendencies', to_jsonb(v_pendency_ids),
                'pendency_attempts', to_jsonb(v_attempt_ids),
                'pendency_contacts', to_jsonb(v_contact_ids),
                'assets', to_jsonb(v_asset_ids)),
            'update', v_updates),
        'counts', jsonb_build_object(
            'invoices', cardinality(v_invoice_ids),
            'pendencies', cardinality(v_pendency_ids),
            'attempts', cardinality(v_attempt_ids),
            'contacts', cardinality(v_contact_ids),
            'assets', cardinality(v_asset_ids),
            'updates', jsonb_array_length(v_updates)),
        'versions', v_versions,
        'preserved', v_preserved,
        'warnings', v_warnings,
        'blockers', v_blockers);

    return v_plan || jsonb_build_object(
        'planDigest', encode(sha256(convert_to(v_plan::text, 'UTF8')), 'hex'));
end
$$;

create or replace function radar_private.operational_correction_lock(p_plan jsonb)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, radar_private
as $$
declare
    v_pendency_id text := p_plan #>> '{effects,delete,pendencies,0}';
    v_invoice_id text := p_plan #>> '{target,id}';
begin
    -- A reanálise começa pela Pendência. Só aguardamos a primeira linha;
    -- aguardar outra depois dela poderia formar um ciclo com um comando concorrente.
    if v_pendency_id is not null then
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

create or replace function radar_private.operational_correction_log(
    p_plan jsonb, p_operation_key uuid, p_role text, p_note text
)
returns void
language plpgsql
set search_path = pg_catalog, public, radar_private
as $$
declare
    v_target jsonb := p_plan -> 'target';
    v_action text := p_plan ->> 'action';
    v_program text := v_target ->> 'programId';
    v_document text := case when v_action <> 'delete_invoice' then v_target ->> 'documentKey' end;
    v_invoice_id text := v_target ->> 'id';
    v_reference text;
    v_expense_type text;
    v_transition text;
    v_update jsonb;
    v_actor text;
    v_profile text;
    v_label text;
begin
    if v_action = 'delete_pendency' then
        select p.program_id, p.document_key, p.registered_invoice_id
          into v_program, v_document, v_invoice_id
          from public.pendencies p where p.id = v_target ->> 'id';
    end if;
    if v_invoice_id is not null then
        select i.program_id, i.expense_type,
               case when i.expense_type = 'a_identificar' then coalesce(nullif(i.description,''), i.id)
                    when nullif(i.invoice_number,'') is null then coalesce(nullif(i.description,''), i.id)
                    when i.expense_type = 'boleto_internet' then 'Boleto Internet ' || i.invoice_number
                    else 'NF ' || i.invoice_number end
          into v_program, v_expense_type, v_reference from public.registered_invoices i where i.id = v_invoice_id;
    end if;
    if v_action in ('correct_analysis','clear_analysis') then
        -- A primeira mudança da análise é a do alvo. Os agregados vêm depois.
        v_update := p_plan #> '{effects,update,0}';
        v_transition := coalesce(v_update ->> 'before','Não analisado') || ' → '
                     || coalesce(v_update ->> 'after','Não analisado');
    end if;
    select p.name into v_program from public.programs p where p.id = v_program;
    v_document := case v_document
        when 'extCC' then 'Extrato Conta Corrente' when 'extINV' then 'Extrato Investimento'
        when 'notaFiscal' then 'Notas Fiscais' when 'consAssessoria' then 'Consulta Assessoria'
        when 'boletoInternet' then 'Boleto de pagamento de Internet'
        when 'declBBAgil' then 'Declaração BB Ágil' when 'encampInventario' then 'Encaminhado para Inventariação'
        else v_document end;
    v_label := case v_action when 'delete_invoice' then
        case v_expense_type when 'a_identificar' then 'Despesa a identificar excluída'
            when 'boleto_internet' then 'Boleto Internet excluído' else 'Nota fiscal excluída' end
        when 'delete_pendency' then 'Pendência excluída' when 'correct_analysis' then 'Análise técnica corrigida'
        when 'clear_analysis' then 'Análise técnica limpa' end;

    select coalesce(nullif(c.name,''),nullif(u.email,''),u.id::text) into v_actor
      from auth.users u left join public.controllers c on c.user_id = u.id
     where u.id = auth.uid();
    select label into strict v_profile from public.profiles where id = p_role;

    insert into public.administrative_logs (id,school_id,actor_user_id,user_identifier,profile_name,action,details)
    values ('correcao-operacional-' || p_operation_key, v_target ->> 'schoolId', auth.uid(), v_actor, v_profile, v_label,
        jsonb_build_object('operationKey', p_operation_key, 'target', v_target, 'counts', p_plan -> 'counts',
            'text', concat_ws(' · ', v_target ->> 'competence', v_program, v_document, v_reference,
                case when v_action = 'delete_pendency' then 'Pendência ' || (v_target ->> 'id') end,
                v_transition, p_note)));
end
$$;

revoke all on function radar_private.operational_correction_log(jsonb,uuid,text,text) from public, anon, authenticated;

create or replace function radar_private.apply_operational_change_impl(
    p_request jsonb,
    p_plan_digest text,
    p_operation_key uuid
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, radar_private
as $$
declare
    v_role text;
    v_fingerprint text := encode(sha256(convert_to(coalesce(p_request, 'null'::jsonb)::text, 'UTF8')), 'hex');
    v_existing radar_private.operational_change_ledger%rowtype;
    v_plan jsonb;
    v_locked_digest text;
    v_blocker jsonb;
    v_item jsonb;
    v_id text;
    v_version integer;
    v_entity text;
    v_field text;
    v_receipt jsonb;
    v_count integer;
    v_note text := nullif(btrim(coalesce(p_request ->> 'note', '')), '');
begin
    if p_operation_key is null then
        raise exception 'VALIDATION_ERROR: operationKey é obrigatório';
    end if;
    if nullif(btrim(coalesce(p_plan_digest, '')), '') is null then
        raise exception 'VALIDATION_ERROR: planDigest é obrigatório';
    end if;

    v_role := radar_private.operational_correction_capability(nullif(btrim(p_request -> 'target' ->> 'schoolId'), ''));

    -- Serializa retries simultâneos ANTES de verificar ledger/entidades.
    -- Sem esta trava, o segundo pedido pode ler a NF já apagada e retornar
    -- NOT_FOUND em vez de recuperar o receipt da primeira confirmação.
    -- Chave derivada somente do UUID validado; não é fornecida pelo cliente.
    perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(p_operation_key::text, 20261114)
    );

    select * into v_existing from radar_private.operational_change_ledger where operation_key = p_operation_key;
    if found then
        if v_existing.request_fingerprint = v_fingerprint
           and v_existing.plan_digest = p_plan_digest
           and v_existing.actor_id is not distinct from auth.uid()
           and v_existing.status = 'committed' then
            return v_existing.receipt || jsonb_build_object('replayed', true);
        end if;
        raise exception 'IDEMPOTENCY_CONFLICT: operationKey já utilizada com outro pedido';
    end if;

    -- Duas passagens: planeja, trava todas as linhas do plano, replaneja.
    v_plan := radar_private.operational_correction_build_plan(p_request);
    v_locked_digest := v_plan ->> 'planDigest';
    perform radar_private.operational_correction_lock(v_plan);
    v_plan := radar_private.operational_correction_build_plan(p_request);

    if jsonb_array_length(v_plan -> 'blockers') > 0 then
        v_blocker := v_plan -> 'blockers' -> 0;
        raise exception 'PLAN_BLOCKED: % — %', v_blocker ->> 'code', v_blocker ->> 'message';
    end if;
    if v_plan ->> 'planDigest' <> p_plan_digest or v_locked_digest <> p_plan_digest then
        raise exception 'STALE_PLAN: o alcance da operação mudou desde a pré-visualização; gere nova prévia';
    end if;

    insert into radar_private.operational_change_ledger (
        operation_key, action, school_id, request, request_fingerprint, plan_digest, plan,
        note, status, xact_id, actor_id, actor_role
    ) values (
        p_operation_key, v_plan ->> 'action', v_plan -> 'target' ->> 'schoolId', p_request, v_fingerprint,
        p_plan_digest, v_plan, v_note, 'applying', txid_current(), auth.uid(), v_role
    );

    -- Capturar a referência legível antes das exclusões, na mesma transação.
    perform radar_private.operational_correction_log(v_plan, p_operation_key, v_role, v_note);

    -- 1. Saídas provisórias voltam a abertas antes da exclusão da NF (respeita o CHECK).
    for v_item in select value from jsonb_array_elements(v_plan -> 'effects' -> 'update')
    loop
        if v_item ->> 'entity' = 'quality_provisional_movements' then
            v_id := v_item ->> 'id';
            v_version := (v_plan -> 'versions' -> 'quality_provisional_movements' ->> v_id)::integer;
            update public.quality_provisional_movements
               set status = 'open', registered_invoice_id = null, identification_operation_key = null
             where id = v_id::uuid and row_version = v_version and status = 'identified';
            if not found then
                raise exception 'OPTIMISTIC_CONFLICT: quality_provisional_movements/%', v_id;
            end if;
        end if;
    end loop;

    -- 2. Exclusões, dos dependentes para a raiz.
    foreach v_entity in array array['pendency_contacts', 'pendencies', 'registered_invoices', 'assets']
    loop
        for v_id in select value from jsonb_array_elements_text(v_plan -> 'effects' -> 'delete' -> v_entity)
        loop
            v_version := (v_plan -> 'versions' -> v_entity ->> v_id)::integer;
            execute format('delete from public.%I where id = $1 and row_version = $2', v_entity)
              using v_id, v_version;
            get diagnostics v_count = row_count;
            if v_count <> 1 then
                raise exception 'OPTIMISTIC_CONFLICT: %/%', v_entity, v_id;
            end if;
        end loop;
    end loop;

    -- 3. Atualizações de análise (individual da NF e da verificação).
    for v_item in select value from jsonb_array_elements(v_plan -> 'effects' -> 'update')
    loop
        v_entity := v_item ->> 'entity';
        v_id := v_item ->> 'id';
        if v_entity = 'registered_invoices' then
            v_field := substr(v_item ->> 'field', length('payload.') + 1);
            update public.registered_invoices
               set payload = jsonb_set(coalesce(payload, '{}'::jsonb), array[v_field], to_jsonb(v_item ->> 'after'))
             where id = v_id;
            if not found then
                raise exception 'OPTIMISTIC_CONFLICT: registered_invoices/%', v_id;
            end if;
        elsif v_entity = 'verifications' then
            if left(v_item ->> 'field', length('bonification.')) = 'bonification.' then
                v_field := substr(v_item ->> 'field', length('bonification.') + 1);
                update public.verifications
                   set bonification = case
                        when v_item -> 'after' = 'null'::jsonb
                            then coalesce(bonification, '{}'::jsonb) - v_field
                        else jsonb_set(coalesce(bonification, '{}'::jsonb), array[v_field], v_item -> 'after')
                   end
                 where id = v_id;
            else
                v_field := substr(v_item ->> 'field', length('analysis.') + 1);
                update public.verifications
                   set analysis = case
                        when v_item -> 'after' = 'null'::jsonb or v_item ->> 'after' is null
                            then coalesce(analysis, '{}'::jsonb) - v_field
                        else jsonb_set(coalesce(analysis, '{}'::jsonb), array[v_field], v_item -> 'after')
                   end
                 where id = v_id;
            end if;
            if not found then
                raise exception 'OPTIMISTIC_CONFLICT: verifications/%', v_id;
            end if;
        end if;
    end loop;

    v_receipt := jsonb_build_object(
        'contractVersion', 1,
        'committed', true,
        'replayed', false,
        'operationKey', p_operation_key,
        'action', v_plan ->> 'action',
        'planDigest', p_plan_digest,
        'deletedIdsByEntity', v_plan -> 'effects' -> 'delete',
        'updated', v_plan -> 'effects' -> 'update',
        'counts', v_plan -> 'counts',
        'preserved', v_plan -> 'preserved',
        'warnings', v_plan -> 'warnings',
        'actorRole', v_role);

    update radar_private.operational_change_ledger
       set status = 'committed', receipt = v_receipt, committed_at = now()
     where operation_key = p_operation_key;

    return v_receipt;
end
$$;
