-- RADAR PDDE — otimizações de desempenho e consolidação das políticas de gestão.
-- Mantém as permissões funcionais existentes e reduz avaliações repetidas por linha.

create index if not exists administrative_logs_actor_user_id_idx
    on public.administrative_logs (actor_user_id)
    where actor_user_id is not null;

create index if not exists app_config_closing_competence_idx
    on public.app_config (closing_competence)
    where closing_competence is not null;

create index if not exists assets_competence_id_idx
    on public.assets (competence_id)
    where competence_id is not null;

create index if not exists data_import_runs_created_by_idx
    on public.data_import_runs (created_by)
    where created_by is not null;

create index if not exists pendencies_program_id_idx
    on public.pendencies (program_id)
    where program_id is not null;

create index if not exists pendency_attempts_created_by_idx
    on public.pendency_attempts (created_by)
    where created_by is not null;

create index if not exists pendency_contacts_created_by_idx
    on public.pendency_contacts (created_by)
    where created_by is not null;

create index if not exists pendency_contacts_pendency_id_idx
    on public.pendency_contacts (pendency_id);

create index if not exists registered_invoices_competence_id_idx
    on public.registered_invoices (competence_id)
    where competence_id is not null;

create index if not exists schools_initial_competence_idx
    on public.schools (initial_competence)
    where initial_competence is not null;

create index if not exists user_profiles_inventory_member_id_idx
    on public.user_profiles (inventory_member_id)
    where inventory_member_id is not null;

create index if not exists verifications_competence_id_idx
    on public.verifications (competence_id)
    where competence_id is not null;

-- Evita duas políticas permissivas de SELECT para os mesmos papéis.
drop policy if exists profiles_manage on public.profiles;

create policy profiles_insert_admin on public.profiles
for insert to authenticated
with check (public.current_app_role() = 'technical_admin');

create policy profiles_update_admin on public.profiles
for update to authenticated
using (public.current_app_role() = 'technical_admin')
with check (public.current_app_role() = 'technical_admin');

create policy profiles_delete_admin on public.profiles
for delete to authenticated
using (public.current_app_role() = 'technical_admin');

-- O administrador continua lendo todas as linhas pela política self_read.
drop policy if exists user_profiles_manage on public.user_profiles;
drop policy if exists user_profiles_self_read on public.user_profiles;

create policy user_profiles_self_read on public.user_profiles
for select to authenticated
using (
    user_id = (select auth.uid())
    or public.current_app_role() = 'technical_admin'
);

create policy user_profiles_insert_admin on public.user_profiles
for insert to authenticated
with check (public.current_app_role() = 'technical_admin');

create policy user_profiles_update_admin on public.user_profiles
for update to authenticated
using (public.current_app_role() = 'technical_admin')
with check (public.current_app_role() = 'technical_admin');

create policy user_profiles_delete_admin on public.user_profiles
for delete to authenticated
using (public.current_app_role() = 'technical_admin');

drop policy if exists user_school_scopes_manage on public.user_school_scopes;
drop policy if exists user_school_scopes_self_read on public.user_school_scopes;

create policy user_school_scopes_self_read on public.user_school_scopes
for select to authenticated
using (
    user_id = (select auth.uid())
    or public.current_app_role() = 'technical_admin'
);

create policy user_school_scopes_insert_admin on public.user_school_scopes
for insert to authenticated
with check (public.current_app_role() = 'technical_admin');

create policy user_school_scopes_update_admin on public.user_school_scopes
for update to authenticated
using (public.current_app_role() = 'technical_admin')
with check (public.current_app_role() = 'technical_admin');

create policy user_school_scopes_delete_admin on public.user_school_scopes
for delete to authenticated
using (public.current_app_role() = 'technical_admin');
