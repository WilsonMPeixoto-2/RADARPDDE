-- Release 2, primeiro caso de D011/D014: marca de entrega das Notas Fiscais.
-- As RPCs, a autorização, o ledger e o bloqueio de T2/T3 são compartilhados.
begin;

alter function radar_private.operational_correction_build_plan(jsonb)
    rename to operational_correction_build_plan_r1;

create function radar_private.operational_correction_build_plan(p_request jsonb)
returns jsonb
language plpgsql stable security definer
set search_path = pg_catalog, public, radar_private
as $$
declare
    v_target jsonb := p_request -> 'target';
    v_changes jsonb := p_request -> 'changes';
    v_mark text;
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
    if (v_target ->> 'documentKey') is distinct from 'notaFiscal' then
        raise exception 'ACTION_NOT_AVAILABLE: esta correção de bonificação ainda não está disponível para o documento';
    end if;
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

    select * into v_verification from public.verifications
     where school_id = v_target ->> 'schoolId' and competence_id = v_target ->> 'competence'
       and program_id = v_target ->> 'programId';
    if not found then
        raise exception 'NOT_FOUND: verificação do programa e competência';
    end if;
    if v_target ->> 'id' is not null and v_target ->> 'id' <> v_verification.id then
        raise exception 'VALIDATION_ERROR: a verificação não pertence ao contexto informado';
    end if;
    v_before := nullif(btrim(v_verification.bonification ->> 'notaFiscal'),'');
    if v_before is not distinct from v_mark then
        v_blockers := jsonb_build_array(jsonb_build_object('code','NO_EFFECT','message','A bonificação já está com esta marca.'));
    end if;

    v_updates := jsonb_build_array(jsonb_build_object(
        'entity','verifications','id',v_verification.id,'field','bonification.notaFiscal',
        'before',v_before,'after',v_mark));
    if v_verification.bonus_result in ('apta','inapta') then
        v_updates := v_updates || jsonb_build_array(jsonb_build_object(
            'entity','verifications','id',v_verification.id,'field','bonus_result',
            'before',v_verification.bonus_result,'after',null));
    end if;
    v_plan := jsonb_build_object(
        'contractVersion',1,'action','correct_bonification',
        'target',jsonb_build_object('kind','verification','id',v_verification.id,
            'schoolId',v_verification.school_id,'competence',v_verification.competence_id,
            'programId',v_verification.program_id,'documentKey','notaFiscal'),
        'changes',jsonb_build_object('bonificacao',v_mark),'selectedPendencyIds',null,
        'effects',jsonb_build_object('update',v_updates,'delete',jsonb_build_object(
            'registered_invoices','[]'::jsonb,'pendencies','[]'::jsonb,'pendency_attempts','[]'::jsonb,
            'pendency_contacts','[]'::jsonb,'assets','[]'::jsonb)),
        'counts',jsonb_build_object('invoices',0,'pendencies',0,'attempts',0,'contacts',0,'assets',0,'updates',jsonb_array_length(v_updates)),
        'versions',jsonb_build_object('verifications',jsonb_build_object(v_verification.id,v_verification.row_version)),
        'preserved',jsonb_build_object('analysis',v_verification.analysis),
        'warnings','[]'::jsonb,'blockers',v_blockers);
    return v_plan || jsonb_build_object('planDigest', encode(sha256(convert_to(v_plan::text,'UTF8')),'hex'));
end
$$;
revoke all on function radar_private.operational_correction_build_plan(jsonb) from public, anon, authenticated;

-- O marcador sobrevive a clientes que substituem o payload e desaparece na
-- consolidação canônica. Não recalculamos bonificação em mudanças de despesa.
create function radar_private.keep_pending_bonus_until_consolidated()
returns trigger language plpgsql
set search_path = pg_catalog
as $$
begin
    if new.bonus_result is not null then
        new.payload := new.payload - 'bonificacaoPendenteConsolidacao';
    else
        new.payload := new.payload || '{"bonificacaoPendenteConsolidacao":true}'::jsonb;
    end if;
    return new;
end
$$;
revoke all on function radar_private.keep_pending_bonus_until_consolidated() from public, anon, authenticated;

create trigger keep_pending_bonus_until_consolidated
before update of bonus_result,payload on public.verifications
for each row when (old.payload -> 'bonificacaoPendenteConsolidacao' = 'true'::jsonb)
execute function radar_private.keep_pending_bonus_until_consolidated();

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
    if v_invoice_id is not null and v_action <> 'correct_bonification' then
        select i.program_id, i.expense_type,
               case when i.expense_type = 'a_identificar' then coalesce(nullif(i.description,''), i.id)
                    when nullif(i.invoice_number,'') is null then coalesce(nullif(i.description,''), i.id)
                    when i.expense_type = 'boleto_internet' then 'Boleto Internet ' || i.invoice_number
                    else 'NF ' || i.invoice_number end
          into v_program, v_expense_type, v_reference from public.registered_invoices i where i.id = v_invoice_id;
    end if;
    if v_action = 'correct_bonification' then
        v_update := p_plan #> '{effects,update,0}';
        v_transition := coalesce(v_update ->> 'before','Sem marca') || ' → ' || coalesce(v_update ->> 'after','Sem marca');
        if p_plan #>> '{effects,update,1,field}' = 'bonus_result' then
            v_transition := v_transition || ' · Resultado anterior ' || upper(p_plan #>> '{effects,update,1,before}')
                || ' · Alterações pendentes de consolidação';
        end if;
    elsif v_action in ('correct_analysis','clear_analysis') then
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
        when 'clear_analysis' then 'Análise técnica limpa'
        when 'correct_bonification' then 'Bonificação corrigida' end;

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
            if v_item ->> 'field' = 'bonus_result' and v_plan ->> 'action' = 'correct_bonification' then
                update public.verifications
                   set bonus_result = null,
                       payload = payload || '{"bonificacaoPendenteConsolidacao":true}'::jsonb
                 where id = v_id;
            elsif left(v_item ->> 'field', length('bonification.')) = 'bonification.' then
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

commit;
