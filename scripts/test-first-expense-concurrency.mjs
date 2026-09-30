// Disposable GitHub runner only. Two PostgreSQL sessions are stopped inside
// BEFORE INSERT, after both have observed an absent verification. No race-by-sleep.
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import assert from 'node:assert/strict';

if (process.env.GITHUB_ACTIONS !== 'true') throw new Error('Only disposable GitHub Supabase is supported');
const run = promisify(execFile);
const url = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const args = [url, '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose'];
async function sql(query, app = 'pr397-control') {
    return (await run('psql', [...args, '-c', query], { env: { ...process.env, PGAPPNAME: app } })).stdout.trim();
}
const school = 'PR397-RACE';
const user = '00000000-0000-0000-0000-000000003977';
const verification = `${school}::2033-04::PR397_RACE`;
let barrier;
let clients = [];

function command(id, version = null) {
    const invoice = { id, school_id: school, competence_id: '2033-04', program_id: 'PR397_RACE',
        verification_id: verification, source_context_key: '2033-04_PR397_RACE', description: id,
        expense_type: 'consumo', invoice_number: id, amount: 123, payload: {} };
    const patch = { id: verification, school_id: school, competence_id: '2033-04', program_id: 'PR397_RACE',
        bonification: { notaFiscal: '' }, analysis: { notaFiscal: 'Não analisado' }, bonus_result: null };
    const log = { id: `${id}-log`, school_id: school, action: 'Gasto Consumo Cadastrado', details: {} };
    const quote = object => `'${JSON.stringify(object).replaceAll("'", "''")}'::jsonb`;
    return `set role authenticated; select set_config('request.jwt.claim.sub','${user}',false);
        select public.save_invoice_with_effects_v2(md5('${id}')::uuid, ${quote(invoice)},
        null, ${quote(patch)}, null, null, ${version ?? 'null'}, ${quote(log)});`;
}
function start(query, name) {
    const child = spawn('psql', args, { env: { ...process.env, PGAPPNAME: name } });
    let stdout = '', stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    const completed = new Promise((resolve, reject) => {
        child.on('error', reject);
        child.on('close', code => resolve({ code, stdout, stderr }));
    });
    child.stdin.end(query);
    clients.push(child);
    return completed;
}
async function awaitCondition(query, wanted) {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
        if (await sql(query) === wanted) return;
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error(`Barrier condition was not reached: ${query}`);
}
try {
    await sql(`insert into auth.users(id,email) values('${user}','pr397-race@example.test');
        insert into public.user_profiles(user_id,profile_id) values('${user}','federal_assistant');
        insert into public.competences(id,label,exercise) values('2033-04','Abril 2033',2033) on conflict do nothing;
        insert into public.programs(id,name) values('PR397_RACE','Concorrência despesa');
        insert into public.schools(id,designation,denomination,cre,initial_competence,inep,cnpj,sici)
        values('${school}','04.99.977','Escola Concorrência','4ª CRE','2033-04','33990977','90.097.700/0001-77','SICI-RACE-977');
        create function public.pr397_verification_barrier() returns trigger language plpgsql as $fn$
        begin if new.school_id = '${school}' then perform pg_advisory_xact_lock(397977); end if; return new; end $fn$;
        create trigger pr397_verification_barrier before insert on public.verifications
        for each row execute function public.pr397_verification_barrier();`);
    barrier = spawn('psql', args, { env: { ...process.env, PGAPPNAME: 'pr397-barrier' } });
    barrier.stderr.on('data', chunk => process.stderr.write(chunk));
    barrier.stdin.write('select pg_advisory_lock(397977);\n');
    await awaitCondition("select count(*) from pg_locks l join pg_stat_activity a on a.pid=l.pid where a.application_name='pr397-barrier' and l.locktype='advisory' and l.granted", '1');
    const first = start(command('pr397-race-a'), 'pr397-race-a');
    const second = start(command('pr397-race-b'), 'pr397-race-b');
    await awaitCondition("select count(*) from pg_stat_activity where application_name in ('pr397-race-a','pr397-race-b') and wait_event='advisory'", '2');
    console.log('Both sessions reached absent-row INSERT and are blocked at the controlled barrier.');
    barrier.stdin.end('select pg_advisory_unlock(397977);\n\\q\n');
    const results = await Promise.all([first, second]);
    assert.equal(results.filter(result => result.code === 0).length, 1);
    const failedIndex = results.findIndex(result => result.code !== 0);
    assert.match(results[failedIndex].stderr, /23505|OPTIMISTIC_CONFLICT/);
    assert.equal(await sql(`select count(*) from public.verifications where id='${verification}'`), '1');
    assert.equal(await sql(`select count(*) from public.registered_invoices where school_id='${school}'`), '1');
    assert.equal(await sql(`select count(*) from public.administrative_logs where school_id='${school}'`), '1');
    const winner = failedIndex === 0 ? 'pr397-race-b' : 'pr397-race-a';
    const loser = failedIndex === 0 ? 'pr397-race-a' : 'pr397-race-b';
    // Discard the original response, then replay the same committed intent.
    const replay = await sql(command(winner));
    assert.match(replay, new RegExp(winner));
    assert.equal(await sql(`select count(*) from public.administrative_logs where school_id='${school}'`), '1');
    await assert.rejects(sql(command(winner).replace('"amount":123', '"amount":124')), /IDEMPOTENCY_CONFLICT/);
    // The losing transaction has no stored intent; re-read its context/version
    // and submit once explicitly, rather than using an automatic generic retry.
    const version = await sql(`select row_version from public.verifications where id='${verification}'`);
    await sql(command(loser, version));
    assert.equal(await sql(`select count(*) from public.verifications where id='${verification}'`), '1');
    assert.equal(await sql(`select count(*) from public.registered_invoices where school_id='${school}'`), '2');
    assert.equal(await sql(`select count(*) from public.administrative_logs where school_id='${school}'`), '2');
    console.log('PASS: one atomic winner, explicit recoverable conflict, no partial loser; replay and changed-payload rejection; explicit recovery yields two distinct expenses and one context.');
} finally {
    barrier?.kill();
    clients.forEach(child => { if (child.exitCode === null) child.kill(); });
    await sql(`drop trigger if exists pr397_verification_barrier on public.verifications;
        drop function if exists public.pr397_verification_barrier();
        delete from radar_private.invoice_operation_idempotency where actor_user_id='${user}';
        delete from public.administrative_logs where school_id='${school}';
        delete from public.registered_invoices where school_id='${school}';
        delete from public.verifications where school_id='${school}';
        delete from public.schools where id='${school}';
        delete from public.programs where id='PR397_RACE';
        delete from auth.users where id='${user}';`);
}
