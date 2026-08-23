-- Mantém o novo envio corretivo da Assessoria coerente com a granularidade por NF.
-- A NF vinculada volta a "Não analisado", o resumo mensal é recalculado pelo
-- serviço e a pendência/tentativa/verificação/histórico são persistidos na
-- mesma transação.
-- Depois que uma NF passa a compor esse histórico, sua identidade estrutural
-- fica preservada: escola, competência, programa, natureza e existência física
-- não podem ser alterados, mas os demais dados da NF continuam corrigíveis.

begin;

create or replace function public.register_service_advisory_attempt(
    p_invoice jsonb,
    p_expected_invoice_version integer,
    p_pendency jsonb,
    p_expected_pendency_version integer,
    p_attempt jsonb,
    p_verification_patch jsonb,
    p_expected_verification_version integer,
    p_administrative_log jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_invoice_id text := nullif(p_invoice ->> 'id', '');
    v_pendency_invoice_id text := nullif(p_pendency ->> 'registered_invoice_id', '');
    v_invoice_result jsonb;
    v_pendency_result jsonb;
begin
    if v_invoice_id is null
        or v_pendency_invoice_id is distinct from v_invoice_id
        or nullif(p_pendency ->> 'document_key', '') <> 'consAssessoria' then
        raise exception 'VALIDATION_ERROR: novo envio da Assessoria deve apontar para a NF vinculada';
    end if;

    if nullif(p_invoice ->> 'expense_type', '') <> 'servico'
        or p_invoice #>> '{payload,analiseConsultaAssessoria}' <> 'Não analisado' then
        raise exception 'VALIDATION_ERROR: novo envio deve recolocar a NF de serviço em Não analisado';
    end if;

    if nullif(p_invoice ->> 'school_id', '') is distinct from nullif(p_pendency ->> 'school_id', '')
        or nullif(p_invoice ->> 'competence_id', '') is distinct from nullif(p_pendency ->> 'competence_origin', '')
        or nullif(p_invoice ->> 'program_id', '') is distinct from nullif(p_pendency ->> 'program_id', '') then
        raise exception 'VALIDATION_ERROR: NF e pendência pertencem a contextos diferentes';
    end if;

    select public.save_invoice_with_effects(
        p_invoice,
        null,
        null,
        p_expected_invoice_version,
        null,
        null,
        null
    ) into v_invoice_result;

    select public.save_pendency_command(
        'register_attempt',
        p_pendency,
        p_expected_pendency_version,
        p_attempt,
        p_verification_patch,
        p_expected_verification_version,
        p_administrative_log
    ) into v_pendency_result;

    return jsonb_build_object(
        'invoice', v_invoice_result -> 'invoice',
        'pendency', v_pendency_result -> 'pendency',
        'attempt', v_pendency_result -> 'attempt',
        'verification', v_pendency_result -> 'verification',
        'administrative_log', v_pendency_result -> 'administrative_log'
    );
end
$$;

revoke all on function public.register_service_advisory_attempt(jsonb, integer, jsonb, integer, jsonb, jsonb, integer, jsonb) from public, anon;
grant execute on function public.register_service_advisory_attempt(jsonb, integer, jsonb, integer, jsonb, jsonb, integer, jsonb) to authenticated;

create or replace function public.protect_service_advisory_invoice_history()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
    if not exists (
        select 1
          from public.pendencies
         where registered_invoice_id = old.id
           and document_key = 'consAssessoria'
    ) then
        if tg_op = 'DELETE' then return old; end if;
        return new;
    end if;

    if tg_op = 'DELETE' then
        raise exception 'INTEGRITY_CONFLICT: Nota Fiscal possui histórico de pendência da Assessoria e não pode ser excluída';
    end if;

    if new.school_id is distinct from old.school_id
        or new.competence_id is distinct from old.competence_id
        or new.program_id is distinct from old.program_id
        or new.expense_type is distinct from old.expense_type then
        raise exception 'INTEGRITY_CONFLICT: Nota Fiscal possui histórico de pendência da Assessoria e não pode alterar escola, competência, programa ou natureza';
    end if;

    return new;
end
$$;

drop trigger if exists registered_invoices_protect_advisory_history_update
    on public.registered_invoices;
create trigger registered_invoices_protect_advisory_history_update
before update of school_id, competence_id, program_id, expense_type
on public.registered_invoices
for each row
execute function public.protect_service_advisory_invoice_history();

drop trigger if exists registered_invoices_protect_advisory_history_delete
    on public.registered_invoices;
create trigger registered_invoices_protect_advisory_history_delete
before delete
on public.registered_invoices
for each row
execute function public.protect_service_advisory_invoice_history();

comment on function public.protect_service_advisory_invoice_history() is
    'Impede apagar ou deslocar estruturalmente NF que já compõe histórico de pendência individual de Assessoria.';

commit;
