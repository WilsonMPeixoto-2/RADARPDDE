-- RADAR PDDE — despesa provisória ainda sem natureza/NF identificada.
-- Migration expansiva e retrocompatível com o frontend anterior.

alter table public.registered_invoices
    alter column invoice_number drop not null;

alter table public.registered_invoices
    drop constraint if exists registered_invoices_expense_type_check;

alter table public.registered_invoices
    add constraint registered_invoices_expense_type_check
    check (expense_type = any (array[
        'consumo'::text,
        'permanente'::text,
        'servico'::text,
        'a_identificar'::text
    ]));

alter table public.registered_invoices
    drop constraint if exists registered_invoices_invoice_number_contract;

alter table public.registered_invoices
    add constraint registered_invoices_invoice_number_contract
    check (
        case
            when expense_type = 'a_identificar' then
                invoice_number is null
                or (btrim(invoice_number) <> '' and invoice_number <> 'SEM-NÚMERO')
            else
                invoice_number is not null
                and btrim(invoice_number) <> ''
                and invoice_number <> 'SEM-NÚMERO'
        end
    );

create or replace function public.normalize_registered_invoice_number()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
    if new.expense_type = 'a_identificar' then
        if new.invoice_number is null
            or btrim(new.invoice_number) = ''
            or new.invoice_number = 'SEM-NÚMERO' then
            new.invoice_number := null;
        end if;
        return new;
    end if;

    if new.invoice_number is null
        or btrim(new.invoice_number) = ''
        or new.invoice_number = 'SEM-NÚMERO' then
        raise exception 'VALIDATION_ERROR: número da Nota Fiscal é obrigatório para despesa identificada';
    end if;

    return new;
end
$$;

revoke all on function public.normalize_registered_invoice_number() from public;

drop trigger if exists registered_invoices_normalize_number on public.registered_invoices;
create trigger registered_invoices_normalize_number
before insert or update of expense_type, invoice_number
on public.registered_invoices
for each row
execute function public.normalize_registered_invoice_number();
