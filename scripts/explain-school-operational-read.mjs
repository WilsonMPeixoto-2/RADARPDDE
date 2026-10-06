// Gera SQL de EXPLAIN a partir dos corpos efetivos, sem executar banco.
// Piping para psql é permitido somente em ambiente descartável. Não usar Production.
import { readFileSync } from 'node:fs';

const school = readFileSync('supabase/migrations/20261004132755_read_school_operational_context.sql', 'utf8');
const global = readFileSync('supabase/migrations/20260929143215_read_operational_context.sql', 'utf8');
function bind(sql) {
    return sql.replaceAll(/\bv_school_id\b/g, "'ESC-LOCAL'")
        .replaceAll(/\bp_competence_id\b/g, "'2026-08'")
        .replaceAll(/\bv_history_statuses\b/g, 'array[]::text[]');
}
function closure(source, variable) {
    const start = source.indexOf('    with\n');
    const end = source.indexOf(`into ${variable};`, start);
    if (start < 0 || end < 0) throw new Error('Corpo da RPC mudou: rever extração do plano');
    return bind(source.slice(start, end).trim());
}
const guardStart = school.indexOf('    if exists (', school.indexOf('-- FKs por ID'));
const guardEnd = school.indexOf(' then\n', guardStart);
if (guardStart < 0 || guardEnd < 0) throw new Error('Guard mudou: rever extração do plano');
const guard = bind(school.slice(guardStart + '    if '.length, guardEnd));
const queries = [
    ['school_guard', `select ${guard} as non_isolatable`],
    ['school_closure', closure(school, 'v_entities')],
    ['global_closure', closure(global, 'v_result')]
];
process.stdout.write(`begin;
set local radar.disposable_benchmark = 'on';
${readFileSync('supabase/seed.sql', 'utf8')}
${readFileSync('supabase/fixtures/operational-production-shape.sql', 'utf8')}
insert into auth.users(id,email) values ('00000000-0000-0000-0000-000000004100','school-read-benchmark@example.test');
insert into public.user_profiles(user_id,profile_id,controller_id,cre_scope)
values ('00000000-0000-0000-0000-000000004100','controller','controller-local','4ª CRE');
analyze public.verifications;
analyze public.registered_invoices;
analyze public.pendencies;
analyze public.pendency_attempts;
analyze public.pendency_contacts;
analyze public.assets;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000004100',true);
select set_config('request.jwt.claim.role','authenticated',true);
${queries.map(([name, sql]) => `select 'PLAN_${name}';\nexplain (analyze, buffers, format json, timing off) ${sql};`).join('\n')}
rollback;
`);
