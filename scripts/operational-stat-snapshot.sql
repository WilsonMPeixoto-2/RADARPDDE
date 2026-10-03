-- Somente leitura. Executado no banco local do laboratório; nunca faz reset.
set search_path = public, extensions;
select coalesce(jsonb_agg(jsonb_build_object(
    'queryId', s.queryid::text, 'role', r.rolname, 'calls', s.calls,
    'totalExecMs', s.total_exec_time, 'meanExecMs', s.mean_exec_time,
    'maxExecMs', s.max_exec_time, 'rows', s.rows
) order by s.queryid), '[]'::jsonb)
from pg_stat_statements s
join pg_roles r on r.oid = s.userid
where r.rolname = 'authenticated'
  and s.dbid = (select oid from pg_database where datname = current_database())
  and s.query ilike '%read_operational_context%';
