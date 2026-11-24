// Disposable GitHub runner only. Deterministic PostgreSQL concurrency proof for
// T2/T3 operational correction RPCs (apply_operational_change):
//   1. Two simultaneous sessions with the SAME operationKey blocked on a
//      controlled advisory-lock barrier -> 1 commit, 1 idempotent replay,
//      1 ledger row, 1 deletion (including terminal 'Inventariada' asset).
//   2. Two simultaneous sessions with DISTINCT operationKeys sharing the same
//      planDigest -> 1 winner, 1 clean rejection (PLAN_BLOCKED/STALE_PLAN),
//      zero double writes.
//   3. Reusing a committed operationKey with an altered request -> clean
//      IDEMPOTENCY_CONFLICT.
//   4. Real reanalysis blocked on an attempt while a correction enters on the
//      same pendency: reanalysis commits, correction rejects its stale plan.
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import assert from 'node:assert/strict';

if (process.env.GITHUB_ACTIONS !== 'true') {
    throw new Error('Only disposable GitHub Supabase is supported');
}

const run = promisify(execFile);
const url = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const args = [url, '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose'];

async function sql(query, app = 'occ-race-control') {
    const { stdout } = await run('psql', [...args, '-c', query], {
        env: { ...process.env, PGAPPNAME: app }
    });
    return stdout.trim();
}

function startSession(query, appName) {
    const child = spawn('psql', args, { env: { ...process.env, PGAPPNAME: appName } });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    const completed = new Promise((resolve, reject) => {
        child.on('error', reject);
        child.on('close', code => resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() }));
    });
    child.stdin.end(query);
    clients.push(child);
    return completed;
}

async function awaitCondition(query, wanted, timeoutMs = 15000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (await sql(query) === wanted) return;
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error(`Barrier condition was not reached: ${query} (wanted=${wanted})`);
}

function quoteJson(value) {
    return `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
}

function parseJsonResult(output, label) {
    const jsonLine = String(output || '')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('{'))
        .at(-1);
    if (!jsonLine) {
        throw new Error(`Expected JSON output for ${label}, got: ${JSON.stringify(output)}`);
    }
    return JSON.parse(jsonLine);
}

function asController(userId, statement) {
    const claims = JSON.stringify({ sub: userId, role: 'authenticated' }).replaceAll("'", "''");
    return `
        begin;
        do $auth$ begin perform set_config('request.jwt.claims', '${claims}', true); end $auth$;
        set local role authenticated;
        ${statement}
        commit;
    `;
}

const SCHOOL = 'OCC-RACE-SCHOOL';
const PROGRAM = 'OCC_RACE_BASIC';
const COMPETENCE = '2042-04';
const VERIFICATION = `${SCHOOL}::${COMPETENCE}::${PROGRAM}`;
const USER = '00000000-0000-0000-0000-00000000c901';
const CONTROLLER = 'OCC-RACE-CTRL';
const OPKEY_SAME = 'ea7ba3dc-4d31-4a07-a066-e4f50b41ea10';
const OPKEY_RACE_1 = '1b4a6c0f-9a28-4d62-8e13-77a5c8a00101';
const OPKEY_RACE_2 = '1b4a6c0f-9a28-4d62-8e13-77a5c8a00102';
const LOCK_KEY_DELETE = 202611201;
const LOCK_KEY_CORRECT = 202611202;

const barriers = [];
const clients = [];

try {
    // 1. Seed isolated school, verification, permanent inventoried invoice, pendency, attempt, contact.
    await sql(`
        insert into auth.users (id, email)
        values ('${USER}', 'occ-race-controller@example.test');

        insert into public.controllers (id, name, email, user_id)
        values ('${CONTROLLER}', 'Controlador Concorrência OCC', 'occ-race-controller@example.test', '${USER}');

        insert into public.user_profiles (user_id, profile_id, controller_id, cre_scope, active)
        values ('${USER}', 'controller', '${CONTROLLER}', 'OCC-RACE-CRE', true);

        insert into public.competences (id, label, exercise)
        values ('${COMPETENCE}', 'Abril 2042', 2042)
        on conflict (id) do nothing;

        insert into public.programs (id, name)
        values ('${PROGRAM}', 'Programa Concorrência OCC')
        on conflict (id) do nothing;

        insert into public.schools (id, designation, denomination, cre, initial_competence, inep, cnpj, sici)
        values ('${SCHOOL}', '04.99.901', 'Escola Concorrência OCC', 'OCC-RACE-CRE', '${COMPETENCE}', '33990901', '90.090.100/0001-01', 'SICI-OCC-RACE-1');

        insert into public.verifications (id, school_id, competence_id, program_id, bonification, analysis, bonus_result, payload)
        values (
            '${VERIFICATION}', '${SCHOOL}', '${COMPETENCE}', '${PROGRAM}',
            '{"notaFiscal":"Sim","extCC":"Sim"}'::jsonb,
            '{"notaFiscal":"Incorreto","extCC":"Incorreto"}'::jsonb,
            'apta', '{}'::jsonb
        );

        insert into public.assets (id, school_id, competence_id, description, expense_type, invoice_number, amount, status)
        values ('OCC-RACE-ASSET-1', '${SCHOOL}', '${COMPETENCE}', 'Projetor Concorrência', 'permanente', 'OCC-R1', 2400, 'Inventariada');

        insert into public.registered_invoices (
            id, school_id, competence_id, program_id, verification_id, source_context_key,
            description, expense_type, invoice_number, amount, linked_asset_id, payload
        ) values (
            'OCC-RACE-NF-1', '${SCHOOL}', '${COMPETENCE}', '${PROGRAM}', '${VERIFICATION}', '${COMPETENCE}_${PROGRAM}',
            'Projetor Concorrência', 'permanente', 'OCC-R1', 2400, 'OCC-RACE-ASSET-1',
            '{"analiseDocumentoFiscal":"Incorreto"}'::jsonb
        );

        insert into public.pendencies (id, school_id, competence_origin, program_id, document_key, status, next_actor, registered_invoice_id)
        values
            ('OCC-RACE-P-NF1', '${SCHOOL}', '${COMPETENCE}', '${PROGRAM}', 'notaFiscal', 'Aberta', 'Escola', 'OCC-RACE-NF-1'),
            ('OCC-RACE-P-EXTCC', '${SCHOOL}', '${COMPETENCE}', '${PROGRAM}', 'extCC', 'Aberta', 'Escola', null);

        insert into public.pendency_attempts (id, pendency_id, attempt_number, submitted_at)
        values ('OCC-RACE-ATT-1', 'OCC-RACE-P-NF1', 1, now());

        insert into public.pendency_contacts (id, school_id, pendency_id, contact_type, contact_date, description)
        values ('OCC-RACE-CNT-1', '${SCHOOL}', 'OCC-RACE-P-NF1', 'email', current_date, 'Cobrança concorrência');

        create or replace function public.occ_race_delete_barrier()
        returns trigger language plpgsql as $fn$
        begin
            if old.id = 'OCC-RACE-NF-1' then
                perform pg_advisory_xact_lock(${LOCK_KEY_DELETE});
            end if;
            return old;
        end $fn$;

        drop trigger if exists occ_race_delete_barrier on public.registered_invoices;
        create trigger occ_race_delete_barrier
            before delete on public.registered_invoices
            for each row execute function public.occ_race_delete_barrier();

        create or replace function public.occ_race_correct_barrier()
        returns trigger language plpgsql as $fn$
        begin
            if old.id = 'OCC-RACE-P-EXTCC' then
                perform pg_advisory_xact_lock(${LOCK_KEY_CORRECT});
            end if;
            return old;
        end $fn$;

        drop trigger if exists occ_race_correct_barrier on public.pendencies;
        create trigger occ_race_correct_barrier
            before delete on public.pendencies
            for each row execute function public.occ_race_correct_barrier();
    `);

    // -------------------------------------------------------------------------
    // Case 1: Same operationKey in 2 simultaneous sessions (delete_invoice + Inventariada)
    // -------------------------------------------------------------------------
    const deleteRequest = {
        contractVersion: 1,
        action: 'delete_invoice',
        target: {
            kind: 'invoice',
            id: 'OCC-RACE-NF-1',
            schoolId: SCHOOL,
            competence: COMPETENCE,
            programId: PROGRAM
        }
    };
    const deletePreviewRes = await startSession(
        asController(USER, `select public.preview_operational_change(${quoteJson(deleteRequest)})::text;`),
        'occ-preview-1'
    );
    assert.equal(deletePreviewRes.code, 0, `Delete preview failed: ${deletePreviewRes.stderr}`);
    const deletePreview = parseJsonResult(deletePreviewRes.stdout, 'deletePreview');
    assert.match(deletePreview.planDigest, /^[0-9a-f]{64}$/);
    assert.deepEqual(deletePreview.effects.delete.registered_invoices, ['OCC-RACE-NF-1']);
    assert.deepEqual(deletePreview.effects.delete.assets, ['OCC-RACE-ASSET-1']);
    assert.deepEqual(deletePreview.effects.delete.pendencies, ['OCC-RACE-P-NF1']);

    const barrier1 = spawn('psql', args, { env: { ...process.env, PGAPPNAME: 'occ-barrier-1' } });
    barriers.push(barrier1);
    barrier1.stdin.write(`select pg_advisory_lock(${LOCK_KEY_DELETE});\n`);
    await awaitCondition(
        "select count(*) from pg_locks l join pg_stat_activity a on a.pid = l.pid where a.application_name = 'occ-barrier-1' and l.locktype = 'advisory' and l.granted",
        '1'
    );

    const applyDeleteSql = asController(
        USER,
        `select public.apply_operational_change(${quoteJson(deleteRequest)}, '${deletePreview.planDigest}', '${OPKEY_SAME}'::uuid)::text;`
    );
    const sessionA = startSession(applyDeleteSql, 'occ-same-a');
    await awaitCondition(
        "select count(*) from pg_stat_activity where application_name = 'occ-same-a' and wait_event = 'advisory'",
        '1'
    );
    const sessionB = startSession(applyDeleteSql, 'occ-same-b');
    await awaitCondition(
        "select count(*) from pg_stat_activity where application_name in ('occ-same-a', 'occ-same-b') and wait_event = 'advisory'",
        '2'
    );
    barrier1.stdin.end(`select pg_advisory_unlock(${LOCK_KEY_DELETE});\n\\q\n`);

    const [resA, resB] = await Promise.all([sessionA, sessionB]);
    assert.equal(resA.code, 0, `Session A failed: ${resA.stderr}`);
    assert.equal(resB.code, 0, `Session B failed: ${resB.stderr}`);
    const receiptA = parseJsonResult(resA.stdout, 'receiptA');
    const receiptB = parseJsonResult(resB.stdout, 'receiptB');
    assert.equal(receiptA.committed, true);
    assert.equal(receiptA.replayed, false);
    assert.equal(receiptB.committed, true);
    assert.equal(receiptB.replayed, true);
    assert.equal(receiptB.operationKey, OPKEY_SAME);
    assert.equal(receiptB.planDigest, deletePreview.planDigest);

    const case1Counts = await sql(`
        select json_build_object(
            'invoices', (select count(*) from public.registered_invoices where id = 'OCC-RACE-NF-1'),
            'assets', (select count(*) from public.assets where id = 'OCC-RACE-ASSET-1'),
            'pendencies', (select count(*) from public.pendencies where id = 'OCC-RACE-P-NF1'),
            'attempts', (select count(*) from public.pendency_attempts where id = 'OCC-RACE-ATT-1'),
            'contacts', (select count(*) from public.pendency_contacts where id = 'OCC-RACE-CNT-1'),
            'ledger', (select count(*) from radar_private.operational_change_ledger where operation_key = '${OPKEY_SAME}')
        )::text;
    `);
    assert.deepEqual(JSON.parse(case1Counts), {
        invoices: 0,
        assets: 0,
        pendencies: 0,
        attempts: 0,
        contacts: 0,
        ledger: 1
    });
    console.log('PASS [Case 1]: same operationKey under barrier -> 1 commit, 1 idempotent replay, 1 atomic deletion (including Inventariada asset).');

    // -------------------------------------------------------------------------
    // Case 2: Two DISTINCT operationKeys racing on the same planDigest (correct_analysis)
    // -------------------------------------------------------------------------
    const correctRequest = {
        contractVersion: 1,
        action: 'correct_analysis',
        target: {
            kind: 'analysis',
            schoolId: SCHOOL,
            competence: COMPETENCE,
            programId: PROGRAM,
            documentKey: 'extCC'
        },
        changes: { analysis: 'Correto' }
    };
    const correctPreviewRes = await startSession(
        asController(USER, `select public.preview_operational_change(${quoteJson(correctRequest)})::text;`),
        'occ-preview-2'
    );
    assert.equal(correctPreviewRes.code, 0, `Correct preview failed: ${correctPreviewRes.stderr}`);
    const correctPreview = parseJsonResult(correctPreviewRes.stdout, 'correctPreview');
    assert.match(correctPreview.planDigest, /^[0-9a-f]{64}$/);
    assert.deepEqual(correctPreview.effects.delete.pendencies, ['OCC-RACE-P-EXTCC']);

    const barrier2 = spawn('psql', args, { env: { ...process.env, PGAPPNAME: 'occ-barrier-2' } });
    barriers.push(barrier2);
    barrier2.stdin.write(`select pg_advisory_lock(${LOCK_KEY_CORRECT});\n`);
    await awaitCondition(
        "select count(*) from pg_locks l join pg_stat_activity a on a.pid = l.pid where a.application_name = 'occ-barrier-2' and l.locktype = 'advisory' and l.granted",
        '1'
    );

    const sessionC = startSession(
        asController(
            USER,
            `select public.apply_operational_change(${quoteJson(correctRequest)}, '${correctPreview.planDigest}', '${OPKEY_RACE_1}'::uuid)::text;`
        ),
        'occ-distinct-c'
    );
    await awaitCondition(
        "select count(*) from pg_stat_activity where application_name = 'occ-distinct-c' and wait_event = 'advisory'",
        '1'
    );
    const sessionD = startSession(
        asController(
            USER,
            `select public.apply_operational_change(${quoteJson(correctRequest)}, '${correctPreview.planDigest}', '${OPKEY_RACE_2}'::uuid)::text;`
        ),
        'occ-distinct-d'
    );
    await awaitCondition(
        "select count(*) from pg_stat_activity where application_name = 'occ-distinct-d' and wait_event_type = 'Lock'",
        '1'
    );
    barrier2.stdin.end(`select pg_advisory_unlock(${LOCK_KEY_CORRECT});\n\\q\n`);

    const [resC, resD] = await Promise.all([sessionC, sessionD]);
    assert.equal(resC.code, 0, `Session C failed: ${resC.stderr}`);
    assert.notEqual(resD.code, 0, 'Session D must fail when racing with distinct operationKey');
    assert.match(resD.stderr, /STALE_PLAN|PLAN_BLOCKED: NO_EFFECT/);
    const receiptC = parseJsonResult(resC.stdout, 'receiptC');
    assert.equal(receiptC.committed, true);
    assert.equal(receiptC.replayed, false);

    const case2State = JSON.parse(await sql(`
        select json_build_object(
            'extCC', (select analysis ->> 'extCC' from public.verifications where id = '${VERIFICATION}'),
            'bonusResult', (select bonus_result from public.verifications where id = '${VERIFICATION}'),
            'pendencies', (select count(*) from public.pendencies where id = 'OCC-RACE-P-EXTCC'),
            'ledgerWinner', (select count(*) from radar_private.operational_change_ledger where operation_key = '${OPKEY_RACE_1}'),
            'ledgerLoser', (select count(*) from radar_private.operational_change_ledger where operation_key = '${OPKEY_RACE_2}')
        )::text;
    `));
    assert.deepEqual(case2State, {
        extCC: 'Correto',
        bonusResult: 'apta',
        pendencies: 0,
        ledgerWinner: 1,
        ledgerLoser: 0
    });
    console.log('PASS [Case 2]: distinct operationKeys racing on same planDigest -> 1 winner, 1 clean STALE_PLAN/NO_EFFECT rejection.');

    // -------------------------------------------------------------------------
    // Case 3: Reusing committed operationKey with altered payload -> IDEMPOTENCY_CONFLICT
    // -------------------------------------------------------------------------
    const alteredRequest = { ...correctRequest, changes: { analysis: 'Correto (Atrasado)' } };
    const altered = await startSession(
        asController(
            USER,
            `select public.apply_operational_change(${quoteJson(alteredRequest)}, '${correctPreview.planDigest}', '${OPKEY_RACE_1}'::uuid)::text;`
        ),
        'occ-idempotency-conflict'
    );
    assert.notEqual(altered.code, 0, 'Altered payload with reused operationKey must fail');
    assert.match(altered.stderr, /IDEMPOTENCY_CONFLICT/);
    console.log('PASS [Case 3]: reused operationKey with altered payload rejected with IDEMPOTENCY_CONFLICT.');
    // Case 4: A real reanalysis owns the pendency while a correction tries to clear its result.
    const pendencyId = 'OCC-RACE-P-EXTINV';
    const attemptId = 'OCC-RACE-A-EXTINV';
    const correctionKey = '1b4a6c0f-9a28-4d62-8e13-77a5c8a00104';
    await sql(`
        update public.verifications set analysis = analysis || '{"extINV":"Incorreto"}'
          where id = '${VERIFICATION}';
        insert into public.pendencies (id, school_id, competence_origin, program_id, document_key, status, next_actor)
          values ('${pendencyId}', '${SCHOOL}', '${COMPETENCE}', '${PROGRAM}', 'extINV', 'Aguardando reanálise', 'Controlador');
        insert into public.pendency_attempts (id, pendency_id, attempt_number, submitted_at)
          values ('${attemptId}', '${pendencyId}', 1, now());
    `);
    const clearRequest = {
        contractVersion: 1, action: 'clear_analysis',
        target: { ...correctRequest.target, documentKey: 'extINV' }
    };
    const forClear = await startSession(asController(USER,
        `select public.preview_operational_change(${quoteJson(clearRequest)})::text;`), 'occ-preview-reanalysis');
    assert.equal(forClear.code, 0, forClear.stderr);
    const preview = parseJsonResult(forClear.stdout, 'clear before reanalysis');
    assert.deepEqual(preview.blockers, []);
    assert.deepEqual(preview.effects.delete.pendencies, [pendencyId]);

    const barrier = spawn('psql', args, { env: { ...process.env, PGAPPNAME: 'occ-attempt-barrier' } });
    barriers.push(barrier);
    barrier.stdin.write(`begin; select id from public.pendency_attempts where id = '${attemptId}' for update;\n`);
    await awaitCondition("select count(*) from pg_stat_activity where application_name = 'occ-attempt-barrier' and state = 'idle in transaction'", '1');

    function waitingFor(waiter, holder) {
        return `select count(*) from pg_stat_activity w join pg_stat_activity h
            on h.pid = any(pg_blocking_pids(w.pid))
            where w.application_name = '${waiter}' and h.application_name = '${holder}'`;
    }
    const reanalysis = startSession(asController(USER, `
        select public.reanalyze_pendency_with_verification(
            ${quoteJson({ id: pendencyId, status: 'Resolvida' })},
            ${quoteJson({ id: attemptId, pendency_id: pendencyId, attempt_number: 1,
                analyzed_at: new Date().toISOString(), result: 'correto', errors: [] })},
            (select jsonb_build_object('id', id, 'analysis', analysis || '{"extINV":"Correto"}')
                from public.verifications where id = '${VERIFICATION}'),
            ${preview.versions.pendencies[pendencyId]}, ${preview.versions.verifications[VERIFICATION]},
            ${quoteJson({ id: 'OCC-RACE-LOG-REANALYSIS', action: 'Reanálise de pendência', school_id: SCHOOL })}
        )::text;`), 'occ-reanalyze');
    await awaitCondition(waitingFor('occ-reanalyze', 'occ-attempt-barrier'), '1');
    const correction = startSession(asController(USER, `select public.apply_operational_change(
        ${quoteJson(clearRequest)}, '${preview.planDigest}', '${correctionKey}'::uuid)::text;`), 'occ-clear');
    await awaitCondition(waitingFor('occ-clear', 'occ-reanalyze'), '1');
    barrier.stdin.end('commit;\n\\q\n');

    const [reanalyzed, refused] = await Promise.all([reanalysis, correction]);
    assert.equal(reanalyzed.code, 0, reanalyzed.stderr);
    assert.notEqual(refused.code, 0, 'A correção precisa respeitar a reanálise que terminou primeiro');
    assert.match(refused.stderr, /STALE_PLAN|PLAN_BLOCKED: NO_EFFECT/);
    const finalState = JSON.parse(await sql(`
        select json_build_object(
            'analysis', (select analysis ->> 'extINV' from public.verifications where id = '${VERIFICATION}'),
            'bonus', (select bonus_result from public.verifications where id = '${VERIFICATION}'),
            'pendency', (select status from public.pendencies where id = '${pendencyId}'),
            'attempt', (select result from public.pendency_attempts where id = '${attemptId}'),
            'reanalysisLog', (select count(*) from public.administrative_logs where id = 'OCC-RACE-LOG-REANALYSIS'),
            'rejectedLog', (select count(*) from public.administrative_logs where details ->> 'operationKey' = '${correctionKey}'),
            'rejectedLedger', (select count(*) from radar_private.operational_change_ledger where operation_key = '${correctionKey}')
        )::text;
    `));
    assert.deepEqual(finalState, {
        analysis: 'Correto', bonus: 'apta', pendency: 'Resolvida', attempt: 'correto',
        reanalysisLog: 1, rejectedLog: 0, rejectedLedger: 0
    });
    console.log('PASS [Case 4]: reanálise e correção simultâneas preservam o resultado e o histórico, sem deadlock.');

    // T4: reject both a phantom INSERT and a move out of the protected context.
    // Controlled barrier owns exactly the advisory key used by apply.
    const t4Barrier = spawn('psql', args, { env: { ...process.env, PGAPPNAME: 'occ-t4-context-barrier' } });
    barriers.push(t4Barrier);
    t4Barrier.stdin.write(`begin; select pg_advisory_xact_lock(hashtextextended('${SCHOOL}::${COMPETENCE}::${PROGRAM}',20261123));\n`);
    await awaitCondition("select count(*) from pg_stat_activity where application_name = 'occ-t4-context-barrier' and state = 'idle in transaction'", '1');
    const phantom = 'OCC-RACE-T4-PHANTOM';
    const insertPhantom = `insert into public.pendencies (id,school_id,competence_origin,program_id,document_key,status,next_actor,resolved_at)
        values ('${phantom}','${SCHOOL}','${COMPETENCE}','${PROGRAM}','extINV','Resolvida','Controlador',now());`;
    const rejected = await startSession(`begin; set local statement_timeout='5s'; ${insertPhantom} commit;`, 'occ-t4-phantom');
    assert.notEqual(rejected.code, 0, 'A criação concorrente não pode entrar no contexto protegido');
    assert.match(rejected.stderr, /OPTIMISTIC_CONFLICT/);
    const moved = await startSession(`begin; set local statement_timeout='5s';
        update public.pendencies set program_id=null where id='${pendencyId}'; commit;`, 'occ-t4-move');
    assert.notEqual(moved.code, 0, 'A movimentação concorrente não pode sair do contexto protegido');
    assert.match(moved.stderr, /OPTIMISTIC_CONFLICT/);
    t4Barrier.stdin.end('commit;\n\\q\n');
    await awaitCondition("select count(*) from pg_stat_activity where application_name='occ-t4-context-barrier'", '0');
    assert.equal(await sql(`select count(*) from public.pendencies where id='${phantom}'`), '0');
    assert.equal(await sql(`select program_id from public.pendencies where id='${pendencyId}'`), PROGRAM);

    // The opposite order: a real writer enters first and commits while clear
    // waits on the context. The earlier preview must be rejected, not expanded.
    const historyRequest = { ...clearRequest, action: 'clear_item_history' };
    const historyPreview = await startSession(asController(USER,
        `select public.preview_operational_change(${quoteJson(historyRequest)})::text;`), 'occ-t4-preview');
    assert.equal(historyPreview.code, 0, historyPreview.stderr);
    const historyPlan = parseJsonResult(historyPreview.stdout, 'T4 history before writer');
    assert.deepEqual(historyPlan.blockers, []);
    const writer = spawn('psql', args, { env: { ...process.env, PGAPPNAME: 'occ-t4-writer' } });
    barriers.push(writer);
    writer.stdin.write(`begin; ${insertPhantom}\n`);
    await awaitCondition("select count(*) from pg_stat_activity where application_name='occ-t4-writer' and state='idle in transaction'", '1');
    const historyKey = '1b4a6c0f-9a28-4d62-8e13-77a5c8a00105';
    const history = startSession(asController(USER,
        `set local statement_timeout='15s'; select public.apply_operational_change(
          ${quoteJson(historyRequest)}, '${historyPlan.planDigest}', '${historyKey}'::uuid)::text;`), 'occ-t4-history');
    await awaitCondition(waitingFor('occ-t4-history','occ-t4-writer'), '1');
    writer.stdin.end('commit;\n\\q\n');
    const staleHistory = await history;
    assert.notEqual(staleHistory.code, 0);
    assert.match(staleHistory.stderr, /STALE_PLAN/);
    assert.equal(await sql(`select count(*) from public.pendencies where id in ('${phantom}','${pendencyId}')`), '2');
    assert.equal(await sql(`select count(*) from radar_private.operational_change_ledger where operation_key='${historyKey}'`), '0');
    console.log('PASS [T4]: phantom e movimentação concorrente bloqueados; escritor vencedor invalida a prévia sem perda de histórico.');
} finally {
    barriers.forEach(proc => { if (proc.exitCode === null) proc.kill(); });
    clients.forEach(proc => { if (proc.exitCode === null) proc.kill(); });
    await sql(`
        begin;
        set local session_replication_role = replica;
        drop trigger if exists occ_race_delete_barrier on public.registered_invoices;
        drop function if exists public.occ_race_delete_barrier();
        drop trigger if exists occ_race_correct_barrier on public.pendencies;
        drop function if exists public.occ_race_correct_barrier();
        delete from radar_private.operational_change_ledger where school_id = '${SCHOOL}';
        delete from public.administrative_logs where school_id = '${SCHOOL}';
        delete from public.pendency_contacts where school_id = '${SCHOOL}';
        delete from public.pendency_attempts where pendency_id in (select id from public.pendencies where school_id = '${SCHOOL}');
        delete from public.pendencies where school_id = '${SCHOOL}';
        delete from public.registered_invoices where school_id = '${SCHOOL}';
        delete from public.assets where school_id = '${SCHOOL}';
        delete from public.verifications where school_id = '${SCHOOL}';
        delete from public.schools where id = '${SCHOOL}';
        delete from public.programs where id = '${PROGRAM}';
        delete from public.user_profiles where user_id = '${USER}';
        delete from public.controllers where id = '${CONTROLLER}';
        delete from auth.users where id = '${USER}';
        commit;
    `);
}
