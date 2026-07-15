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

-- Compatibilidade mínima para o smoke independente, onde a imagem PostgreSQL
-- não distribui pg_jsonschema. A pilha Supabase local usa a extensão real.
create schema if not exists extensions;
create or replace function extensions.jsonb_matches_schema(p_schema json, p_instance jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
    v_type text := p_schema ->> 'type';
begin
    if v_type = 'object' then return jsonb_typeof(p_instance) = 'object'; end if;
    if v_type = 'array' then return jsonb_typeof(p_instance) = 'array'; end if;
    if v_type = 'string' then return jsonb_typeof(p_instance) = 'string'; end if;
    if v_type = 'integer' then return jsonb_typeof(p_instance) = 'number' and (p_instance #>> '{}') ~ '^-?\\d+$'; end if;
    if v_type = 'number' then return jsonb_typeof(p_instance) = 'number'; end if;
    if v_type = 'boolean' then return jsonb_typeof(p_instance) = 'boolean'; end if;
    return true;
end
$$;
