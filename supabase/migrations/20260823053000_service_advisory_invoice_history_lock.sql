-- Preserva a identidade estrutural da NF depois que ela passa a compor o
-- histórico de uma pendência individual de Consulta à Assessoria.
-- Campos ordinários continuam editáveis; escola, competência, programa,
-- natureza e exclusão física ficam protegidos para manter a rastreabilidade.

begin;

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
        return case when tg_op = 'DELETE' then old else new end;
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
