-- Stub mínimo do ambiente Supabase para aplicar as migrations do RADARPDDE em Postgres descartável local.
-- Uso exclusivo de análise; nada aqui é aplicado em ambiente remoto.
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin noinherit bypassrls; end if;
  if not exists (select 1 from pg_roles where rolname='authenticator') then create role authenticator login noinherit; end if;
  if not exists (select 1 from pg_roles where rolname='supabase_admin') then create role supabase_admin login superuser; end if;
  if not exists (select 1 from pg_roles where rolname='supabase_realtime_admin') then create role supabase_realtime_admin nologin; end if;
end $$;
grant anon, authenticated, service_role to authenticator;

create schema if not exists extensions;
create schema if not exists auth;
create schema if not exists realtime;
grant usage on schema public, extensions, auth, realtime to anon, authenticated, service_role;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists pgtap with schema extensions;

create table if not exists auth.users (
  instance_id uuid, id uuid primary key default gen_random_uuid(), aud varchar(255), role varchar(255),
  email varchar(255), encrypted_password varchar(255), email_confirmed_at timestamptz, invited_at timestamptz,
  confirmation_token varchar(255), recovery_token varchar(255), last_sign_in_at timestamptz,
  raw_app_meta_data jsonb default '{}'::jsonb, raw_user_meta_data jsonb default '{}'::jsonb,
  is_super_admin boolean, created_at timestamptz default now(), updated_at timestamptz default now(),
  phone text, banned_until timestamptz, email_change_token_new varchar(255), email_change varchar(255), email_change_token_current varchar(255) default '', phone_change text default '', phone_change_token varchar(255) default '', reauthentication_token varchar(255) default '', email_change_confirm_status smallint default 0, deleted_at timestamptz, is_sso_user boolean default false, is_anonymous boolean default false
);

create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(coalesce(current_setting('request.jwt.claim.sub', true), (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')), '')::uuid
$$;
create or replace function auth.role() returns text language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'))
$$;
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
grant execute on function auth.uid(), auth.role(), auth.jwt() to anon, authenticated, service_role;

-- pg_jsonschema indisponível para arm64: stub permissivo (aceita qualquer JSON). Limitação registrada no relatório.
create or replace function extensions.jsonb_matches_schema(schema json, instance jsonb) returns boolean
language sql immutable as $$ select true $$;
create or replace function extensions.json_matches_schema(schema json, instance json) returns boolean
language sql immutable as $$ select true $$;

create table if not exists realtime.messages (
  id bigserial primary key, topic text, extension text, payload jsonb, event text, private boolean default true,
  inserted_at timestamptz default now(), updated_at timestamptz default now()
);
alter table realtime.messages enable row level security;
create table if not exists realtime.sent_log (id bigserial primary key, payload jsonb, event text, topic text, private boolean, at timestamptz default now());
create or replace function realtime.send(payload jsonb, event text, topic text, private boolean default true) returns void
language sql as $$ insert into realtime.sent_log(payload, event, topic, private) values (payload, event, topic, private) $$;
create or replace function realtime.topic() returns text language sql stable as $$ select current_setting('realtime.topic', true) $$;
grant execute on function realtime.send(jsonb, text, text, boolean) to anon, authenticated, service_role;
do $$ begin
  if not exists (select 1 from pg_publication where pubname='supabase_realtime') then create publication supabase_realtime; end if;
end $$;
