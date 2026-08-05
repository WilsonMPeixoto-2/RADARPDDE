-- RADAR PDDE — impede redistribuição de carteira por rotas cadastrais genéricas.
-- A alteração de controller_id permanece exclusiva do Assistente de Verbas
-- Federais e do Administrador técnico. Operações administrativas diretas
-- (postgres/service_role) continuam disponíveis para manutenção autorizada.

begin;

create or replace function public.enforce_school_controller_assignment_authorization()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
    v_role text := public.current_app_role();
begin
    if old.controller_id is distinct from new.controller_id
       and current_user = 'authenticated'
       and v_role not in ('federal_assistant', 'technical_admin') then
        raise exception 'AUTHORIZATION_DENIED: controlador sem permissão para redistribuir carteira pela edição cadastral';
    end if;
    return new;
end
$$;

revoke all on function public.enforce_school_controller_assignment_authorization() from public;
grant execute on function public.enforce_school_controller_assignment_authorization() to authenticated, service_role;

drop trigger if exists schools_controller_assignment_authorization on public.schools;
create trigger schools_controller_assignment_authorization
before update of controller_id on public.schools
for each row
execute function public.enforce_school_controller_assignment_authorization();

commit;
