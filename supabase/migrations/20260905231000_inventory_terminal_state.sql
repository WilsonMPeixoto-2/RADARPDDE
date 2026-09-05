-- RADAR PDDE — protege o estado patrimonial terminal no próprio banco.
-- Um bem já Inventariado não pode voltar para Encaminhada (nem para outro
-- estado) por salvamento de NF, reencaminhamento ou outra rota de UPDATE.

begin;

create or replace function radar_private.protect_inventoried_asset_terminal_state()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public', 'radar_private'
as $$
begin
    if old.status = 'Inventariada'
        and new.status is distinct from old.status then
        raise exception 'ASSET_ALREADY_INVENTORIED: assets/%', old.id;
    end if;
    return new;
end
$$;

revoke all on function radar_private.protect_inventoried_asset_terminal_state() from public;
revoke all on function radar_private.protect_inventoried_asset_terminal_state() from anon;
revoke all on function radar_private.protect_inventoried_asset_terminal_state() from authenticated;

drop trigger if exists assets_protect_inventoried_terminal_state on public.assets;
create trigger assets_protect_inventoried_terminal_state
before update of status on public.assets
for each row
when (
    old.status = 'Inventariada'
    and new.status is distinct from old.status
)
execute function radar_private.protect_inventoried_asset_terminal_state();

commit;
