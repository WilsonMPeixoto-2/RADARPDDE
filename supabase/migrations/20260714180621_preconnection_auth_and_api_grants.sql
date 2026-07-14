-- RADAR PDDE — exposição explícita da Data API para usuários autenticados.
-- O papel anon não recebe acesso a dados institucionais. As operações concedidas
-- a authenticated continuam subordinadas às políticas RLS já versionadas.

revoke usage on schema public from anon;
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;

revoke all on all tables in schema public from authenticated;
revoke all on all sequences in schema public from authenticated;
revoke all on all functions in schema public from authenticated;

grant usage on schema public to authenticated;

grant select on table
    public.app_config,
    public.programs,
    public.controllers,
    public.inventory_team_members,
    public.competences,
    public.schools,
    public.school_programs,
    public.verifications,
    public.pendencies,
    public.pendency_attempts,
    public.pendency_contacts,
    public.assets,
    public.registered_invoices,
    public.administrative_logs,
    public.profiles,
    public.user_profiles,
    public.user_school_scopes,
    public.data_import_runs,
    public.audit_events
to authenticated;

grant select, insert, update, delete on table
    public.app_config,
    public.programs,
    public.controllers,
    public.inventory_team_members,
    public.competences,
    public.schools,
    public.school_programs,
    public.verifications,
    public.pendencies,
    public.pendency_attempts,
    public.pendency_contacts,
    public.assets,
    public.registered_invoices,
    public.administrative_logs,
    public.profiles,
    public.user_profiles,
    public.user_school_scopes,
    public.data_import_runs
to authenticated;

grant execute on function public.current_app_role() to authenticated;
grant execute on function public.current_controller_id() to authenticated;
grant execute on function public.can_access_school(text) to authenticated;
grant execute on function public.can_write_school(text) to authenticated;
grant execute on function public.save_invoice_with_effects(jsonb, jsonb, jsonb, integer, integer, integer, jsonb) to authenticated;
grant execute on function public.delete_invoice_with_effects(text, integer, boolean, integer, jsonb, integer, jsonb) to authenticated;

-- O bootstrap Auth é executado somente no ambiente local por um processo
-- administrativo. O papel recebe apenas os privilégios necessários para
-- vincular identidades já criadas; não recebe DELETE nem acesso amplo às
-- demais tabelas. A chave service_role nunca é enviada ao navegador.
grant usage on schema public to service_role;

grant select, update on table
    public.controllers,
    public.inventory_team_members
to service_role;

grant select, insert, update on table
    public.user_profiles,
    public.user_school_scopes
to service_role;

alter default privileges in schema public
    revoke all on tables from anon, authenticated;
alter default privileges in schema public
    revoke all on sequences from anon, authenticated;
alter default privileges in schema public
    revoke all on functions from anon, authenticated;

comment on schema public is
    'RADAR PDDE: Data API disponível somente por concessões explícitas e políticas RLS.';
