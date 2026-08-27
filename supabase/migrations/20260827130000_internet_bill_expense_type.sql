begin;

alter table public.registered_invoices
drop constraint if exists registered_invoices_expense_type_check;

alter table public.registered_invoices
add constraint registered_invoices_expense_type_check
check (expense_type = any (array[
    'consumo'::text,
    'permanente'::text,
    'servico'::text,
    'a_identificar'::text,
    'boleto_internet'::text
]));

alter table public.registered_invoices
drop constraint if exists registered_invoices_internet_bill_program_check;

alter table public.registered_invoices
add constraint registered_invoices_internet_bill_program_check
check (
    expense_type <> 'boleto_internet'
    or coalesce(program_id, '') = 'CONECTADA'
);

create or replace function public.enforce_internet_bill_expense_program()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
    if new.expense_type <> 'boleto_internet' then
        return new;
    end if;

    if coalesce(new.program_id, '') <> 'CONECTADA' then
        raise exception 'DOCUMENT_NOT_APPLICABLE: boleto_internet exige programa CONECTADA';
    end if;

    if not exists (
        select 1
        from public.school_programs sp
        where sp.school_id = new.school_id
          and sp.program_id = 'CONECTADA'
          and sp.active = true
    ) then
        raise exception 'DOCUMENT_NOT_APPLICABLE: escola sem Educação Conectada ativa';
    end if;

    return new;
end;
$$;

drop trigger if exists registered_invoices_internet_bill_program_guard
on public.registered_invoices;

create trigger registered_invoices_internet_bill_program_guard
before insert or update of school_id, program_id, expense_type
on public.registered_invoices
for each row
execute function public.enforce_internet_bill_expense_program();

commit;
