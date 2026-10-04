-- PostgreSQL descartável, seed local e tabelas operacionais vazias.
-- psql -X -qAt -v ON_ERROR_STOP=1 -f este-arquivo.sql
-- Tudo, inclusive desativação de triggers, é revertido ao final/ao fechar conexão.
begin;
set local radar.disposable_benchmark = 'on';
\ir ../../seed.sql
\ir ../../fixtures/operational-production-shape.sql

insert into auth.users(id, email)
values ('00000000-0000-0000-0000-000000004100', 'school-read-benchmark@example.test');
insert into public.user_profiles(user_id, profile_id, controller_id, cre_scope)
values ('00000000-0000-0000-0000-000000004100', 'controller', 'controller-local', '4ª CRE');

create temporary table bench_samples(mode text, school_id text, sample integer, rpc_ms numeric, payload_bytes integer, counts jsonb);
grant insert on bench_samples to authenticated;
create function pg_temp.measure_school_reads() returns void language plpgsql as $$
declare
    g jsonb;
    r jsonb;
    expected jsonb;
    s record;
    histories text[];
    started timestamptz;
    elapsed numeric;
    targets text[];
    target text;
    n integer;
    variant text;
begin
    g := public.read_operational_context('2026-08');
    -- Verifica a equivalência das 163 escolas com as três coberturas de histórico.
    -- Filtrar JSON é apenas o oráculo do ensaio, nunca a implementação candidata.
    foreach variant in array array['regular', 'resolved', 'all-history'] loop
        histories := case variant when 'regular' then array[]::text[]
            when 'resolved' then array['Resolvida'] else array['Cancelada','Resolvida'] end;
        g := public.read_operational_context('2026-08', histories);
        for s in select id from public.schools order by id loop
            r := public.read_school_operational_context(s.id, '2026-08', histories);
            select jsonb_object_agg(e.key, (
                select coalesce(jsonb_agg(item order by item ->> 'id'), '[]'::jsonb)
                from jsonb_array_elements(e.value) item
                where item ->> 'school_id' = s.id or (e.key = 'pendencyAttempts'
                    and item ->> 'pendency_id' in (select p ->> 'id'
                        from jsonb_array_elements(g -> 'entities' -> 'pendencies') p
                        where p ->> 'school_id' = s.id))
            )) into expected from jsonb_each(g -> 'entities') e;
            if r -> 'coverage' -> 'complete' is distinct from 'true'::jsonb
                or r -> 'entities' is distinct from expected then
                raise exception 'BENCHMARK_EQUIVALENCE_FAILURE: escola %, histórico %', s.id, histories;
            end if;
        end loop;
    end loop;
    g := public.read_operational_context('2026-08');
    -- Escolas densa, mediana e leve escolhidas pelo total da partição global.
    with sizes as (
        select sc.id, (select count(*) from jsonb_each(g -> 'entities') e,
            jsonb_array_elements(e.value) i where i ->> 'school_id' = sc.id
                or (e.key = 'pendencyAttempts' and i ->> 'pendency_id' in (
                    select p ->> 'id' from jsonb_array_elements(g -> 'entities' -> 'pendencies') p
                    where p ->> 'school_id' = sc.id))) as rows
        from public.schools sc
    ), ordered as (select id, row_number() over (order by rows desc, id) as rn from sizes)
    select array_agg(id order by rn) into targets from ordered where rn in (1, 82, 163);

    -- Alterna a ordem para que aquecimento não favoreça sempre a mesma variante.
    -- 3 warmups + 20 amostras medidas, mesma conexão, fixture e RLS.
    for n in -2..20 loop
        if n % 2 = 0 then
            started := clock_timestamp();
            r := public.read_operational_context('2026-08');
            elapsed := extract(epoch from clock_timestamp() - started) * 1000;
            if n > 0 then
                insert into bench_samples select 'global', null, n, elapsed, octet_length(r::text),
                    (select jsonb_object_agg(key, jsonb_array_length(value)) from jsonb_each(r -> 'entities'));
            end if;
        end if;
        foreach target in array targets loop
            started := clock_timestamp();
            r := public.read_school_operational_context(target, '2026-08');
            elapsed := extract(epoch from clock_timestamp() - started) * 1000;
            if n > 0 then
                insert into bench_samples select 'school', target, n, elapsed, octet_length(r::text),
                    (select jsonb_object_agg(key, jsonb_array_length(value)) from jsonb_each(r -> 'entities'));
            end if;
        end loop;
        if n % 2 <> 0 then
            started := clock_timestamp();
            r := public.read_operational_context('2026-08');
            elapsed := extract(epoch from clock_timestamp() - started) * 1000;
            if n > 0 then
                insert into bench_samples select 'global', null, n, elapsed, octet_length(r::text),
                    (select jsonb_object_agg(key, jsonb_array_length(value)) from jsonb_each(r -> 'entities'));
            end if;
        end if;
    end loop;
end;
$$;

analyze public.verifications;
analyze public.registered_invoices;
analyze public.pendencies;
analyze public.pendency_attempts;
analyze public.pendency_contacts;
analyze public.assets;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000004100', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select pg_temp.measure_school_reads();
reset role;

select jsonb_build_object(
    'postgresVersion', version(),
    'role', 'authenticated/controller/4ª CRE',
    'fixture', 'production-aggregates-2026-10-02',
    'competenceId', '2026-08',
    'equivalentSchoolCoverages', 489,
    'samplesPerVariant', 20,
    'timing', 'RPC execution, excluding serialization/network/UI',
    'payload', 'octet_length(jsonb::text), uncompressed; not measured HTTP bytes',
    'results', (select jsonb_agg(to_jsonb(t) order by t.mode, t.school_id) from (
        select mode, school_id, count(*) as samples,
            round((percentile_cont(0.5) within group(order by rpc_ms))::numeric, 3) as p50_ms,
            round((percentile_cont(0.95) within group(order by rpc_ms))::numeric, 3) as p95_ms,
            round((percentile_cont(0.99) within group(order by rpc_ms))::numeric, 3) as p99_ms,
            max(rpc_ms) as max_ms, min(payload_bytes) as payload_min_bytes,
            max(payload_bytes) as payload_max_bytes, min(counts::text)::jsonb as counts
        from bench_samples group by mode, school_id
    ) t)
);
rollback;
