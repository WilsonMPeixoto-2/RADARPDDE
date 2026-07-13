-- RADAR PDDE — esquema relacional base para futura integração com Supabase.
-- Esta migration não contém dados institucionais e não é executada pela aplicação atual.

create extension if not exists pgcrypto;

create table public.app_config (
    id text primary key,
    exercises jsonb not null default '[]'::jsonb,
    closing_competence text,
    bonus_deadline_extended date,
    settings jsonb not null default '{}'::jsonb,
    row_version integer not null default 1 check (row_version > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.programs (
    id text primary key,
    name text not null,
    description text not null default '',
    active boolean not null default true,
    row_version integer not null default 1 check (row_version > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.controllers (
    id text primary key,
    name text not null,
    email text not null default '',
    active boolean not null default true,
    row_version integer not null default 1 check (row_version > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.inventory_team_members (
    id text primary key,
    name text not null,
    email text not null default '',
    active boolean not null default true,
    row_version integer not null default 1 check (row_version > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.competences (
    id text primary key check (id ~ '^\d{4}-(0[1-9]|1[0-2])$'),
    label text not null,
    exercise integer not null check (exercise between 2000 and 2100),
    starts_on date,
    ends_on date,
    closed_at timestamptz,
    row_version integer not null default 1 check (row_version > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table public.schools (
    id text primary key,
    designation text not null unique,
    denomination text not null,
    phone text not null default '',
    institutional_mobile text not null default '',
    email text not null default '',
    director_name text not null default '',
    director_phone text not null default '',
    deputy_director_name text not null default '',
    deputy_director_phone text not null default '',
    inep text not null default '',
    cnpj text not null default '',
    cre text not null,
    ra text not null default '',
    sici text not null default '',
    controller_id text references public.controllers (id) on update cascade on delete set null,
    inventory_process text not null default '',
    initial_competence text references public.competences (id) on update cascade on delete set null,
    active boolean not null default true,
    row_version integer not null default 1 check (row_version > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.school_programs (
    id text primary key,
    school_id text not null references public.schools (id) on update cascade on delete cascade,
    program_id text not null references public.programs (id) on update cascade on delete restrict,
    active boolean not null default true,
    starts_on date,
    ends_on date,
    row_version integer not null default 1 check (row_version > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (school_id, program_id),
    check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table public.verifications (
    id text primary key,
    school_id text not null references public.schools (id) on update cascade on delete cascade,
    competence_id text not null references public.competences (id) on update cascade on delete restrict,
    program_id text not null references public.programs (id) on update cascade on delete restrict,
    bonification jsonb not null default '{}'::jsonb,
    analysis jsonb not null default '{}'::jsonb,
    bonus_result text check (bonus_result in ('apta', 'inapta', 'em-apuracao', 'nao-lancada')),
    row_version integer not null default 1 check (row_version > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (school_id, competence_id, program_id)
);

create table public.pendencies (
    id text primary key,
    school_id text not null references public.schools (id) on update cascade on delete cascade,
    competence_origin text not null references public.competences (id) on update cascade on delete restrict,
    program_id text references public.programs (id) on update cascade on delete restrict,
    document_key text not null,
    status text not null check (status in ('Aberta', 'Aguardando reanálise', 'Resolvida', 'Cancelada')),
    responsible_area text not null default '',
    next_actor text not null default '',
    reason text not null default '',
    notes text not null default '',
    opened_at timestamptz not null default now(),
    resolved_at timestamptz,
    canceled_at timestamptz,
    payload jsonb not null default '{}'::jsonb,
    row_version integer not null default 1 check (row_version > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (resolved_at is null or status = 'Resolvida'),
    check (canceled_at is null or status = 'Cancelada')
);

create table public.pendency_attempts (
    id uuid primary key default gen_random_uuid(),
    pendency_id text not null references public.pendencies (id) on update cascade on delete cascade,
    attempt_number integer not null check (attempt_number > 0),
    submitted_at timestamptz not null default now(),
    analyzed_at timestamptz,
    result text check (result in ('correto', 'incorreto', 'arquivo_indisponivel')),
    observation text not null default '',
    drive_url text not null default '',
    errors jsonb not null default '[]'::jsonb,
    created_by uuid references auth.users (id) on delete set null,
    row_version integer not null default 1 check (row_version > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (pendency_id, attempt_number)
);

create table public.pendency_contacts (
    id uuid primary key default gen_random_uuid(),
    school_id text not null references public.schools (id) on update cascade on delete cascade,
    pendency_id text references public.pendencies (id) on update cascade on delete set null,
    contact_type text not null,
    contact_date date not null,
    description text not null,
    official_charge boolean not null default false,
    created_by uuid references auth.users (id) on delete set null,
    row_version integer not null default 1 check (row_version > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.assets (
    id text primary key,
    school_id text not null references public.schools (id) on update cascade on delete cascade,
    competence_id text references public.competences (id) on update cascade on delete set null,
    description text not null,
    expense_type text not null check (expense_type in ('consumo', 'permanente', 'servico')),
    invoice_number text not null default '',
    amount numeric(14,2) not null default 0 check (amount >= 0),
    status text not null check (status in ('Não encaminhada', 'Encaminhada', 'Inventariada')),
    inventory_process text not null default '',
    notes text not null default '',
    row_version integer not null default 1 check (row_version > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.registered_invoices (
    id text primary key,
    school_id text not null references public.schools (id) on update cascade on delete cascade,
    competence_id text references public.competences (id) on update cascade on delete set null,
    description text not null,
    expense_type text not null check (expense_type in ('consumo', 'permanente', 'servico')),
    invoice_number text not null,
    amount numeric(14,2) not null check (amount >= 0),
    payload jsonb not null default '{}'::jsonb,
    row_version integer not null default 1 check (row_version > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.administrative_logs (
    id text primary key,
    school_id text references public.schools (id) on update cascade on delete set null,
    actor_user_id uuid references auth.users (id) on delete set null,
    user_identifier text not null default '',
    profile_name text not null default '',
    action text not null,
    details jsonb not null default '{}'::jsonb,
    event_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create index schools_controller_id_idx on public.schools (controller_id);
create index schools_cre_ra_idx on public.schools (cre, ra);
create index schools_inep_idx on public.schools (inep);
create index school_programs_program_id_idx on public.school_programs (program_id);
create index verifications_school_competence_idx on public.verifications (school_id, competence_id);
create index verifications_program_idx on public.verifications (program_id);
create index pendencies_school_status_idx on public.pendencies (school_id, status);
create index pendencies_competence_idx on public.pendencies (competence_origin);
create index pendency_attempts_pendency_idx on public.pendency_attempts (pendency_id, attempt_number);
create index pendency_contacts_school_date_idx on public.pendency_contacts (school_id, contact_date desc);
create index assets_school_status_idx on public.assets (school_id, status);
create index registered_invoices_school_competence_idx on public.registered_invoices (school_id, competence_id);
create index administrative_logs_school_event_idx on public.administrative_logs (school_id, event_at desc);
