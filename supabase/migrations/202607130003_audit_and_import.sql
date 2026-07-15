-- RADAR PDDE — controle de importação, auditoria e versionamento operacional.

create table public.data_import_runs (
    id uuid primary key default gen_random_uuid(),
    import_id text not null unique,
    snapshot_format text not null,
    snapshot_version text not null,
    source_label text not null default 'localStorage',
    status text not null check (status in ('pending', 'running', 'reconciled', 'failed', 'rolled_back')),
    entity_counts jsonb not null default '{}'::jsonb,
    reconciliation_report jsonb not null default '{}'::jsonb,
    error_message text not null default '',
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    created_by uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (completed_at is null or completed_at >= started_at)
);

create table public.audit_events (
    id bigint generated always as identity primary key,
    table_name text not null,
    record_id text not null,
    action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
    old_record jsonb,
    new_record jsonb,
    changed_fields text[] not null default '{}',
    actor_user_id uuid references auth.users (id) on delete set null,
    request_id text,
    occurred_at timestamptz not null default now()
);

create index data_import_runs_status_idx on public.data_import_runs (status, started_at desc);
create index audit_events_record_idx on public.audit_events (table_name, record_id, occurred_at desc);
create index audit_events_actor_idx on public.audit_events (actor_user_id, occurred_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
    new.updated_at = now();
    if to_jsonb(new) ? 'row_version' then
        new := jsonb_populate_record(
            new,
            jsonb_build_object(
                'row_version',
                coalesce((to_jsonb(old)->>'row_version')::integer, 0) + 1
            )
        );
    end if;
    return new;
end
$$;

create or replace function public.capture_audit_event()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_record_id text;
    v_old jsonb;
    v_new jsonb;
    v_changed_fields text[] := '{}';
    v_headers jsonb;
begin
    if tg_op = 'DELETE' then
        v_record_id := coalesce(to_jsonb(old)->>'id', 'unknown');
        v_old := to_jsonb(old);
        v_new := null;
    elsif tg_op = 'INSERT' then
        v_record_id := coalesce(to_jsonb(new)->>'id', 'unknown');
        v_old := null;
        v_new := to_jsonb(new);
    else
        v_record_id := coalesce(to_jsonb(new)->>'id', 'unknown');
        v_old := to_jsonb(old);
        v_new := to_jsonb(new);
        select coalesce(array_agg(key order by key), '{}')
        into v_changed_fields
        from jsonb_each(v_new) current_value
        where (v_old -> current_value.key) is distinct from current_value.value;
    end if;

    v_headers := nullif(current_setting('request.headers', true), '')::jsonb;

    insert into public.audit_events (
        table_name,
        record_id,
        action,
        old_record,
        new_record,
        changed_fields,
        actor_user_id,
        request_id
    ) values (
        tg_table_name,
        v_record_id,
        tg_op,
        v_old,
        v_new,
        v_changed_fields,
        auth.uid(),
        v_headers ->> 'x-request-id'
    );

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end
$$;

create trigger app_config_touch_updated_at
before update on public.app_config
for each row execute function public.touch_updated_at();

create trigger programs_touch_updated_at
before update on public.programs
for each row execute function public.touch_updated_at();

create trigger controllers_touch_updated_at
before update on public.controllers
for each row execute function public.touch_updated_at();

create trigger inventory_team_members_touch_updated_at
before update on public.inventory_team_members
for each row execute function public.touch_updated_at();

create trigger competences_touch_updated_at
before update on public.competences
for each row execute function public.touch_updated_at();

create trigger schools_touch_updated_at
before update on public.schools
for each row execute function public.touch_updated_at();

create trigger school_programs_touch_updated_at
before update on public.school_programs
for each row execute function public.touch_updated_at();

create trigger verifications_touch_updated_at
before update on public.verifications
for each row execute function public.touch_updated_at();

create trigger pendencies_touch_updated_at
before update on public.pendencies
for each row execute function public.touch_updated_at();

create trigger pendency_attempts_touch_updated_at
before update on public.pendency_attempts
for each row execute function public.touch_updated_at();

create trigger pendency_contacts_touch_updated_at
before update on public.pendency_contacts
for each row execute function public.touch_updated_at();

create trigger assets_touch_updated_at
before update on public.assets
for each row execute function public.touch_updated_at();

create trigger registered_invoices_touch_updated_at
before update on public.registered_invoices
for each row execute function public.touch_updated_at();

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger user_profiles_touch_updated_at
before update on public.user_profiles
for each row execute function public.touch_updated_at();

create trigger user_school_scopes_touch_updated_at
before update on public.user_school_scopes
for each row execute function public.touch_updated_at();

create trigger data_import_runs_touch_updated_at
before update on public.data_import_runs
for each row execute function public.touch_updated_at();

create trigger schools_capture_audit
after insert or update or delete on public.schools
for each row execute function public.capture_audit_event();

create trigger verifications_capture_audit
after insert or update or delete on public.verifications
for each row execute function public.capture_audit_event();

create trigger pendencies_capture_audit
after insert or update or delete on public.pendencies
for each row execute function public.capture_audit_event();

create trigger pendency_attempts_capture_audit
after insert or update or delete on public.pendency_attempts
for each row execute function public.capture_audit_event();

create trigger pendency_contacts_capture_audit
after insert or update or delete on public.pendency_contacts
for each row execute function public.capture_audit_event();

create trigger assets_capture_audit
after insert or update or delete on public.assets
for each row execute function public.capture_audit_event();

create trigger registered_invoices_capture_audit
after insert or update or delete on public.registered_invoices
for each row execute function public.capture_audit_event();

create trigger profiles_capture_audit
after insert or update or delete on public.profiles
for each row execute function public.capture_audit_event();

create trigger user_profiles_capture_audit
after insert or update or delete on public.user_profiles
for each row execute function public.capture_audit_event();

create trigger user_school_scopes_capture_audit
after insert or update or delete on public.user_school_scopes
for each row execute function public.capture_audit_event();

create trigger data_import_runs_capture_audit
after insert or update or delete on public.data_import_runs
for each row execute function public.capture_audit_event();

alter table public.data_import_runs enable row level security;
alter table public.audit_events enable row level security;

create policy data_import_runs_read on public.data_import_runs
for select to authenticated
using (public.current_app_role() in ('technical_admin', 'sme_management', 'federal_assistant'));

create policy data_import_runs_insert on public.data_import_runs
for insert to authenticated
with check (public.current_app_role() in ('technical_admin', 'federal_assistant'));

create policy data_import_runs_update on public.data_import_runs
for update to authenticated
using (public.current_app_role() in ('technical_admin', 'federal_assistant'))
with check (public.current_app_role() in ('technical_admin', 'federal_assistant'));

create policy data_import_runs_delete on public.data_import_runs
for delete to authenticated
using (public.current_app_role() = 'technical_admin');

create policy audit_events_read on public.audit_events
for select to authenticated
using (public.current_app_role() in ('technical_admin', 'sme_management'));

revoke insert, update, delete on public.audit_events from authenticated;
