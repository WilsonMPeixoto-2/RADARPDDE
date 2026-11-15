-- Migration: 20261114000100_operational_correction_contract.sql
-- Contrato unificado de preview/apply para correção e exclusão causal no Prontuário (Lotes T2–T5)

create schema if not exists radar_private;

create table if not exists radar_private.operational_correction_intent_ledger (
    operation_key uuid primary key,
    action text not null,
    plan_digest text not null,
    request_payload jsonb not null,
    receipt_payload jsonb not null,
    actor_id uuid,
    created_at timestamptz not null default timezone('utc', now())
);

-- Atualiza a proteção terminal de inventário para permitir correção/exclusão explícita
-- quando autorizada dentro da transação de apply_operational_change.
create or replace function radar_private.protect_inventoried_asset_terminal_state()
returns trigger
language plpgsql
as $$
begin
    if current_setting('radar.allow_authorized_inventory_correction', true) = 'true' then
        if tg_op = 'DELETE' then
            return old;
        end if;
        return new;
    end if;

    if tg_op = 'DELETE' then
        if old.status = 'Inventariada' then
            raise exception 'ASSET_ALREADY_INVENTORIED: assets/% cannot be deleted after reaching terminal status Inventariada', old.id
                using errcode = 'P0001';
        end if;
        return old;
    end if;

    if old.status = 'Inventariada' and new.status is distinct from 'Inventariada' then
        raise exception 'ASSET_ALREADY_INVENTORIED: assets/% cannot leave terminal status Inventariada', old.id
            using errcode = 'P0001';
    end if;

    return new;
end;
$$;

create or replace function public.preview_operational_change(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, radar_private
as $$
declare
    v_action text := coalesce(trim(p_request->>'action'), '');
    v_target jsonb := coalesce(p_request->'target', '{}'::jsonb);
    v_school_id text := coalesce(trim(v_target->>'schoolId'), '');
    v_competence text := coalesce(trim(v_target->>'competence'), '');
    v_program_id text := nullif(trim(v_target->>'programId'), '');
    v_document_key text := nullif(trim(v_target->>'documentKey'), '');
    v_target_id text := nullif(trim(v_target->>'id'), '');
    v_invoice_ids text[] := array[]::text[];
    v_pendency_ids text[] := array[]::text[];
    v_attempt_ids text[] := array[]::text[];
    v_contact_ids text[] := array[]::text[];
    v_asset_ids text[] := array[]::text[];
    v_provisional_ids text[] := array[]::text[];
    v_reopen jsonb := '[]'::jsonb;
    v_plan_core jsonb;
    v_digest text;
begin
    if v_action = '' or v_school_id = '' or v_competence = '' then
        raise exception 'VALIDATION_ERROR: action, schoolId e competence são obrigatórios em preview_operational_change'
            using errcode = 'P0001';
    end if;

    if v_action = 'delete_invoice' and v_target_id is not null then
        select array_agg(i.id),
               array_remove(array_agg(i.linked_asset_id), null)
          into v_invoice_ids, v_asset_ids
          from public.registered_invoices i
         where i.id = v_target_id
           and i.school_id = v_school_id;

        if coalesce(array_length(v_invoice_ids, 1), 0) = 0 then
            raise exception 'NOT_FOUND: Nota Fiscal % não encontrada', v_target_id
                using errcode = 'P0002';
        end if;

        select coalesce(array_agg(p.id order by p.id), array[]::text[])
          into v_pendency_ids
          from public.pendencies p
         where p.registered_invoice_id = v_target_id;

        if coalesce(array_length(v_pendency_ids, 1), 0) > 0 then
            select coalesce(array_agg(a.id order by a.id), array[]::text[])
              into v_attempt_ids
              from public.pendency_attempts a
             where a.pendency_id = any(v_pendency_ids);

            select coalesce(array_agg(c.id order by c.id), array[]::text[])
              into v_contact_ids
              from public.pendency_contacts c
             where c.pendency_id = any(v_pendency_ids);
        end if;

        select coalesce(
                   jsonb_agg(jsonb_build_object('kind', 'quality_movement', 'id', q.id, 'status', 'open')),
                   '[]'::jsonb
               )
          into v_reopen
          from public.quality_provisional_movements q
         where q.registered_invoice_id = v_target_id;
    elsif v_action in ('clear_analysis', 'correct_analysis', 'delete_pendency') then
        if v_target_id is not null then
            select coalesce(array_agg(p.id order by p.id), array[]::text[])
              into v_pendency_ids
              from public.pendencies p
             where p.id = v_target_id
               and p.school_id = v_school_id;
        elsif v_document_key is not null then
            select coalesce(array_agg(p.id order by p.id), array[]::text[])
              into v_pendency_ids
              from public.pendencies p
             where p.school_id = v_school_id
               and p.competence_id = v_competence
               and (v_program_id is null or p.program_id = v_program_id)
               and p.document_key = v_document_key
               and p.status in ('Aberta', 'Aguardando reanálise');
        end if;
    elsif v_action = 'delete_context' and v_program_id is not null then
        select coalesce(array_agg(i.id order by i.id), array[]::text[]),
               coalesce(array_remove(array_agg(i.linked_asset_id order by i.id), null), array[]::text[])
          into v_invoice_ids, v_asset_ids
          from public.registered_invoices i
         where i.school_id = v_school_id
           and i.competence_id = v_competence
           and i.program_id = v_program_id;

        select coalesce(array_agg(p.id order by p.id), array[]::text[])
          into v_pendency_ids
          from public.pendencies p
         where p.school_id = v_school_id
           and p.competence_id = v_competence
           and p.program_id = v_program_id;
    end if;

    v_plan_core := jsonb_build_object(
        'contractVersion', 1,
        'action', v_action,
        'context', jsonb_build_object(
            'schoolId', v_school_id,
            'competence', v_competence,
            'programId', v_program_id,
            'documentKey', v_document_key
        ),
        'effects', jsonb_build_object(
            'delete', jsonb_build_object(
                'registeredInvoices', to_jsonb(coalesce(v_invoice_ids, array[]::text[])),
                'pendencies', to_jsonb(coalesce(v_pendency_ids, array[]::text[])),
                'pendencyAttempts', to_jsonb(coalesce(v_attempt_ids, array[]::text[])),
                'pendencyContacts', to_jsonb(coalesce(v_contact_ids, array[]::text[])),
                'assets', to_jsonb(coalesce(v_asset_ids, array[]::text[])),
                'qualityProvisionalMovements', to_jsonb(coalesce(v_provisional_ids, array[]::text[]))
            ),
            'reopen', v_reopen
        ),
        'counts', jsonb_build_object(
            'registeredInvoices', coalesce(array_length(v_invoice_ids, 1), 0),
            'pendencies', coalesce(array_length(v_pendency_ids, 1), 0),
            'pendencyAttempts', coalesce(array_length(v_attempt_ids, 1), 0),
            'pendencyContacts', coalesce(array_length(v_contact_ids, 1), 0),
            'assets', coalesce(array_length(v_asset_ids, 1), 0),
            'reopenedMovements', jsonb_array_length(v_reopen)
        )
    );

    v_digest := 'plan-v1-' || md5(v_plan_core::text);
    return v_plan_core || jsonb_build_object('planDigest', v_digest);
end;
$$;

create or replace function public.apply_operational_change(
    p_request jsonb,
    p_plan_digest text,
    p_operation_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, radar_private
as $$
declare
    v_existing_receipt jsonb;
    v_current_plan jsonb;
    v_current_digest text;
    v_action text := coalesce(trim(p_request->>'action'), '');
    v_delete jsonb;
    v_receipt jsonb;
begin
    if p_operation_key is null then
        raise exception 'VALIDATION_ERROR: p_operation_key é obrigatório'
            using errcode = 'P0001';
    end if;

    select l.receipt_payload
      into v_existing_receipt
      from radar_private.operational_correction_intent_ledger l
     where l.operation_key = p_operation_key;

    if v_existing_receipt is not null then
        return v_existing_receipt;
    end if;

    v_current_plan := public.preview_operational_change(p_request);
    v_current_digest := v_current_plan->>'planDigest';

    if coalesce(trim(p_plan_digest), '') = '' or v_current_digest is distinct from trim(p_plan_digest) then
        raise exception 'CONFLICT: CONCURRENT_SCOPE_CHANGED expected=% actual=%', p_plan_digest, v_current_digest
            using errcode = '40001';
    end if;

    perform set_config('radar.allow_authorized_inventory_correction', 'true', true);

    v_delete := v_current_plan #> '{effects,delete}';

    delete from public.pendency_contacts
     where id in (select jsonb_array_elements_text(coalesce(v_delete->'pendencyContacts', '[]'::jsonb)));

    delete from public.pendency_attempts
     where id in (select jsonb_array_elements_text(coalesce(v_delete->'pendencyAttempts', '[]'::jsonb)));

    delete from public.pendencies
     where id in (select jsonb_array_elements_text(coalesce(v_delete->'pendencies', '[]'::jsonb)));

    update public.quality_provisional_movements
       set status = 'open',
           registered_invoice_id = null,
           identification_operation_key = null
     where registered_invoice_id in (
           select jsonb_array_elements_text(coalesce(v_delete->'registeredInvoices', '[]'::jsonb))
     );

    delete from public.registered_invoices
     where id in (select jsonb_array_elements_text(coalesce(v_delete->'registeredInvoices', '[]'::jsonb)));

    delete from public.assets
     where id in (select jsonb_array_elements_text(coalesce(v_delete->'assets', '[]'::jsonb)));

    v_receipt := jsonb_build_object(
        'operationKey', p_operation_key,
        'committed', true,
        'contractVersion', 1,
        'action', v_action,
        'deletedIdsByEntity', v_delete,
        'reopenedEntities', coalesce(v_current_plan #> '{effects,reopen}', '[]'::jsonb),
        'changedEntities', jsonb_build_array(
            'verifications',
            'registeredInvoices',
            'pendencies',
            'pendencyAttempts',
            'assets',
            'qualityProvisionalMovements',
            'administrativeLogs'
        ),
        'affectedContexts', jsonb_build_array(v_current_plan->'context'),
        'auditId', 'audit-' || p_operation_key::text
    );

    insert into radar_private.operational_correction_intent_ledger (
        operation_key,
        action,
        plan_digest,
        request_payload,
        receipt_payload,
        actor_id
    ) values (
        p_operation_key,
        v_action,
        v_current_digest,
        p_request,
        v_receipt,
        auth.uid()
    );

    return v_receipt;
end;
$$;
