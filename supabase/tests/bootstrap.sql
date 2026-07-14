-- Dependências mínimas do ambiente Supabase para smoke test das migrations.
-- Este arquivo é usado apenas no PostgreSQL efêmero do GitHub Actions.

create schema auth;

create role authenticated nologin;
create role anon nologin;
-- No ambiente Supabase real, service_role existe e ignora RLS. O smoke
-- independente precisa reproduzir essa dependência antes de aplicar migrations.
create role service_role nologin bypassrls;

create table auth.users (
    id uuid primary key,
    email text,
    created_at timestamptz not null default now()
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
