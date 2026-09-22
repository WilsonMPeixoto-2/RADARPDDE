-- Correção operacional auditável — Processo de Inventário da E.M. João Marques dos Reis (04.11.012)
-- Escopo autorizado em 22/09/2026.
-- Fail-closed: não sobrescreve valor divergente e aborta se a identidade escolar não for única/coerente.

do $$
declare
    v_count integer;
    v_denomination text;
    v_current_process text;
begin
    select
        count(*),
        max(denomination),
        max(inventory_process)
    into
        v_count,
        v_denomination,
        v_current_process
    from public.schools
    where designation = '04.11.012';

    if v_count <> 1 then
        raise exception 'SCHOOL_IDENTITY_MISMATCH: esperado exatamente 1 registro para 04.11.012; encontrado %', v_count;
    end if;

    if lower(coalesce(v_denomination, '')) not like '%joão marques dos reis%' then
        raise exception 'SCHOOL_NAME_MISMATCH: denominação inesperada para 04.11.012: %', v_denomination;
    end if;

    if trim(coalesce(v_current_process, '')) = '000704.008168/2026-83' then
        raise notice 'NOOP: Processo de Inventário já está correto para 04.11.012.';
        return;
    end if;

    if trim(coalesce(v_current_process, '')) <> '' then
        raise exception 'INVENTORY_PROCESS_CONFLICT: 04.11.012 já possui processo diferente: %', v_current_process;
    end if;

    update public.schools
    set inventory_process = '000704.008168/2026-83'
    where designation = '04.11.012'
      and trim(coalesce(inventory_process, '')) = '';

    if not found then
        raise exception 'UPDATE_NOT_APPLIED: nenhuma linha atualizada para 04.11.012.';
    end if;
end
$$;

select
    designation,
    denomination,
    inventory_process,
    row_version,
    updated_at
from public.schools
where designation = '04.11.012'
  and inventory_process = '000704.008168/2026-83';
