select now() as captured_at, (select stats_reset from extensions.pg_stat_statements_info) as stats_reset,
s.userid::regrole::text as role, s.dbid, s.toplevel, s.queryid::text, s.calls,s.total_exec_time,s.rows,s.shared_blks_hit,s.shared_blks_read,s.stats_since,
array(select name from unnest(array['school_programs','verifications','registered_invoices','pendencies','user_profiles','profiles']) name where s.query ~ ('\m' || name || '\M')) as relations
from extensions.pg_stat_statements s
where s.userid = 'authenticated'::regrole
and s.query ~ '(school_programs|verifications|registered_invoices|pendencies|user_profiles|profiles)'
and s.query not ilike '%pg_stat_statements%' order by s.total_exec_time desc;
