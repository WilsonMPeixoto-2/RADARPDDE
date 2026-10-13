-- RADAR PDDE — exclusão ordinária não pode apagar patrimônio terminal.
-- Reutiliza a autoridade de estado terminal do bem e mantém intactas RPCs,
-- permissões, RLS, edição cadastral e exclusão de bens pré-terminais.

begin;

create or replace function radar_private.protect_inventoried_asset_terminal_state()
returns trigger
language plpgsql
set search_path = pg_catalog, public, radar_private
as $$
begin
    if old.status = 'Inventariada' then
        if tg_op = 'DELETE' then
            raise exception 'ASSET_ALREADY_INVENTORIED: assets/%', old.id;
        end if;
        if new.status is distinct from old.status then
            raise exception 'ASSET_ALREADY_INVENTORIED: assets/%', old.id;
        end if;
    end if;
    if tg_op = 'DELETE' then return old; end if;
    return new;
end
$$;

revoke all on function radar_private.protect_inventoried_asset_terminal_state()
    from public, anon, authenticated;

create trigger assets_protect_inventoried_terminal_delete
before delete on public.assets
for each row
when (old.status = 'Inventariada')
execute function radar_private.protect_inventoried_asset_terminal_state();

-- A proteção do próprio bem não basta quando a chamada preserva o bem mas
-- exclui sua NF. A checagem ocorre no DELETE, inclusive fora da RPC, e trava
-- a linha patrimonial antes de decidir para não concorrer com a inventariação.
create function radar_private.protect_inventoried_invoice_delete()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, radar_private
as $$
declare
    v_asset_status text;
begin
    select status into v_asset_status
    from public.assets
    where id = old.linked_asset_id
    for update;

    if v_asset_status = 'Inventariada' then
        raise exception 'ASSET_ALREADY_INVENTORIED: assets/%', old.linked_asset_id;
    end if;
    return old;
end
$$;

revoke all on function radar_private.protect_inventoried_invoice_delete()
    from public, anon, authenticated;

create trigger registered_invoices_protect_inventoried_delete
before delete on public.registered_invoices
for each row
when (old.linked_asset_id is not null)
execute function radar_private.protect_inventoried_invoice_delete();

comment on function radar_private.protect_inventoried_asset_terminal_state() is
    'Preserva patrimônio Inventariada contra rebaixamento de status e exclusão ordinária.';
comment on function radar_private.protect_inventoried_invoice_delete() is
    'Preserva NF vinculada a patrimônio Inventariada, inclusive DELETE sem remoção do bem; lock patrimonial serializa a decisão com a inventariação.';

commit;
