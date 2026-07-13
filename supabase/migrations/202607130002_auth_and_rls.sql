-- RADAR PDDE — modelo futuro de autenticação, perfis e Row Level Security.
-- A aplicação atual não ativa Supabase nem autenticação.

alter table public.controllers
    add column user_id uuid unique references auth.users (id) on delete set null;

alter table public.inventory_team_members
    add column user_id uuid unique references auth.users (id) on delete set null;

create table public.profiles (
    id text primary key,
    label text not null,
    priority integer not null default 100,
    description text not null default '',
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (id in ('controller', 'federal_assistant', 'inventory', 'sme_management', 'technical_admin'))
);

create table public.user_profiles (
    user_id uuid not null references auth.users (id) on delete cascade,
    profile_id text not null references public.profiles (id) on update cascade on delete restrict,
    controller_id text references public.controllers (id) on update cascade on delete set null,
    inventory_member_id text references public.inventory_team_members (id) on update cascade on delete set null,
    cre_scope text,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (user_id, profile_id),
    check (
        (profile_id = 'controller' and controller_id is not null)
        or (profile_id = 'inventory' and inventory_member_id is not null)
        or profile_id in ('federal_assistant', 'sme_management', 'technical_admin')
    )
);

create table public.user_school_scopes (
    user_id uuid not null references auth.users (id) on delete cascade,
    school_id text not null references public.schools (id) on update cascade on delete cascade,
    can_write boolean not null default false,
    created_at timestamptz not null default now(),
    primary key (user_id, school_id)
);

insert into public.profiles (id, label, priority, description)
values
    ('technical_admin', 'Administrador técnico', 10, 'Administração técnica e segurança do ambiente.'),
    ('sme_management', 'Gestão SME', 20, 'Leitura gerencial e administração institucional.'),
    ('federal_assistant', 'Assistente de Verbas Federais', 30, 'Operação transversal de verbas federais.'),
    ('controller', 'Controlador', 40, 'Operação da carteira de escolas vinculada.'),
    ('inventory', 'Equipe de Inventário', 50, 'Operação patrimonial e de inventariação.')
on conflict (id) do nothing;

create index user_profiles_profile_idx on public.user_profiles (profile_id, active);
create index user_profiles_controller_idx on public.user_profiles (controller_id) where controller_id is not null;
create index user_school_scopes_school_idx on public.user_school_scopes (school_id);

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
    select up.profile_id
    from public.user_profiles up
    join public.profiles p on p.id = up.profile_id
    where up.user_id = auth.uid()
      and up.active = true
      and p.active = true
    order by p.priority asc
    limit 1
$$;

create or replace function public.current_controller_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
    select up.controller_id
    from public.user_profiles up
    where up.user_id = auth.uid()
      and up.profile_id = 'controller'
      and up.active = true
    limit 1
$$;

create or replace function public.can_access_school(p_school_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select case
        when auth.uid() is null then false
        when public.current_app_role() in ('technical_admin', 'sme_management', 'federal_assistant') then true
        when exists (
            select 1
            from public.user_school_scopes uss
            where uss.user_id = auth.uid()
              and uss.school_id = p_school_id
        ) then true
        when public.current_app_role() = 'controller' then exists (
            select 1
            from public.schools s
            where s.id = p_school_id
              and s.controller_id = public.current_controller_id()
        )
        when public.current_app_role() = 'inventory' then exists (
            select 1
            from public.assets a
            where a.school_id = p_school_id
        )
        else false
    end
$$;

create or replace function public.can_write_school(p_school_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select case
        when auth.uid() is null then false
        when public.current_app_role() in ('technical_admin', 'federal_assistant') then true
        when public.current_app_role() = 'controller' then public.can_access_school(p_school_id)
        when exists (
            select 1
            from public.user_school_scopes uss
            where uss.user_id = auth.uid()
              and uss.school_id = p_school_id
              and uss.can_write = true
        ) then true
        else false
    end
$$;

revoke all on function public.current_app_role() from public;
revoke all on function public.current_controller_id() from public;
revoke all on function public.can_access_school(text) from public;
revoke all on function public.can_write_school(text) from public;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.current_controller_id() to authenticated;
grant execute on function public.can_access_school(text) to authenticated;
grant execute on function public.can_write_school(text) to authenticated;

alter table public.app_config enable row level security;
alter table public.programs enable row level security;
alter table public.controllers enable row level security;
alter table public.inventory_team_members enable row level security;
alter table public.competences enable row level security;
alter table public.schools enable row level security;
alter table public.school_programs enable row level security;
alter table public.verifications enable row level security;
alter table public.pendencies enable row level security;
alter table public.pendency_attempts enable row level security;
alter table public.pendency_contacts enable row level security;
alter table public.assets enable row level security;
alter table public.registered_invoices enable row level security;
alter table public.administrative_logs enable row level security;
alter table public.profiles enable row level security;
alter table public.user_profiles enable row level security;
alter table public.user_school_scopes enable row level security;

create policy app_config_read on public.app_config
for select to authenticated
using (true);

create policy app_config_manage on public.app_config
for all to authenticated
using (public.current_app_role() in ('technical_admin', 'sme_management'))
with check (public.current_app_role() in ('technical_admin', 'sme_management'));

create policy programs_read on public.programs
for select to authenticated
using (true);

create policy programs_manage on public.programs
for all to authenticated
using (public.current_app_role() in ('technical_admin', 'sme_management'))
with check (public.current_app_role() in ('technical_admin', 'sme_management'));

create policy competences_read on public.competences
for select to authenticated
using (true);

create policy competences_manage on public.competences
for all to authenticated
using (public.current_app_role() in ('technical_admin', 'sme_management'))
with check (public.current_app_role() in ('technical_admin', 'sme_management'));

create policy controllers_read on public.controllers
for select to authenticated
using (true);

create policy controllers_manage on public.controllers
for all to authenticated
using (public.current_app_role() in ('technical_admin', 'sme_management'))
with check (public.current_app_role() in ('technical_admin', 'sme_management'));

create policy inventory_members_read on public.inventory_team_members
for select to authenticated
using (true);

create policy inventory_members_manage on public.inventory_team_members
for all to authenticated
using (public.current_app_role() in ('technical_admin', 'sme_management'))
with check (public.current_app_role() in ('technical_admin', 'sme_management'));

create policy schools_read on public.schools
for select to authenticated
using (public.can_access_school(id));

create policy schools_insert on public.schools
for insert to authenticated
with check (public.current_app_role() in ('technical_admin', 'federal_assistant'));

create policy schools_update on public.schools
for update to authenticated
using (public.can_write_school(id))
with check (public.can_write_school(id));

create policy schools_delete on public.schools
for delete to authenticated
using (public.current_app_role() = 'technical_admin');

create policy school_programs_read on public.school_programs
for select to authenticated
using (public.can_access_school(school_id));

create policy school_programs_write on public.school_programs
for all to authenticated
using (public.can_write_school(school_id))
with check (public.can_write_school(school_id));

create policy verifications_read on public.verifications
for select to authenticated
using (public.can_access_school(school_id));

create policy verifications_write on public.verifications
for all to authenticated
using (public.can_write_school(school_id))
with check (public.can_write_school(school_id));

create policy pendencies_read on public.pendencies
for select to authenticated
using (public.can_access_school(school_id));

create policy pendencies_write on public.pendencies
for all to authenticated
using (public.can_write_school(school_id))
with check (public.can_write_school(school_id));

create policy pendency_attempts_read on public.pendency_attempts
for select to authenticated
using (exists (
    select 1 from public.pendencies p
    where p.id = pendency_id and public.can_access_school(p.school_id)
));

create policy pendency_attempts_write on public.pendency_attempts
for all to authenticated
using (exists (
    select 1 from public.pendencies p
    where p.id = pendency_id and public.can_write_school(p.school_id)
))
with check (exists (
    select 1 from public.pendencies p
    where p.id = pendency_id and public.can_write_school(p.school_id)
));

create policy pendency_contacts_read on public.pendency_contacts
for select to authenticated
using (public.can_access_school(school_id));

create policy pendency_contacts_write on public.pendency_contacts
for all to authenticated
using (public.can_write_school(school_id))
with check (public.can_write_school(school_id));

create policy assets_read on public.assets
for select to authenticated
using (public.can_access_school(school_id));

create policy assets_write on public.assets
for all to authenticated
using (
    public.current_app_role() in ('technical_admin', 'federal_assistant', 'inventory')
    and public.can_access_school(school_id)
)
with check (
    public.current_app_role() in ('technical_admin', 'federal_assistant', 'inventory')
    and public.can_access_school(school_id)
);

create policy registered_invoices_read on public.registered_invoices
for select to authenticated
using (public.can_access_school(school_id));

create policy registered_invoices_write on public.registered_invoices
for all to authenticated
using (public.can_write_school(school_id))
with check (public.can_write_school(school_id));

create policy administrative_logs_read on public.administrative_logs
for select to authenticated
using (
    school_id is null
    or public.can_access_school(school_id)
    or public.current_app_role() in ('technical_admin', 'sme_management')
);

create policy administrative_logs_insert on public.administrative_logs
for insert to authenticated
with check (
    school_id is null
    or public.can_access_school(school_id)
);

create policy profiles_read on public.profiles
for select to authenticated
using (true);

create policy profiles_manage on public.profiles
for all to authenticated
using (public.current_app_role() = 'technical_admin')
with check (public.current_app_role() = 'technical_admin');

create policy user_profiles_self_read on public.user_profiles
for select to authenticated
using (user_id = auth.uid() or public.current_app_role() = 'technical_admin');

create policy user_profiles_manage on public.user_profiles
for all to authenticated
using (public.current_app_role() = 'technical_admin')
with check (public.current_app_role() = 'technical_admin');

create policy user_school_scopes_self_read on public.user_school_scopes
for select to authenticated
using (user_id = auth.uid() or public.current_app_role() = 'technical_admin');

create policy user_school_scopes_manage on public.user_school_scopes
for all to authenticated
using (public.current_app_role() = 'technical_admin')
with check (public.current_app_role() = 'technical_admin');
