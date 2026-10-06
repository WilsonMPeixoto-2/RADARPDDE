'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { mkdtemp, mkdir, readFile, rm, writeFile } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const modulePromise = import('../../scripts/compare-operational-sessions.mjs');
const READ_PATH = '/rest/v1/rpc/read_operational_context';
const WRITE_PATH = '/rest/v1/rpc/save_verification_with_log';

function sqlRow(calls, totalExecMs, queryId = '9007199254740993', role = 'authenticated') {
    return { queryId, role, calls, rows: calls, totalExecMs,
        meanExecMs: calls ? totalExecMs / calls : 0, maxExecMs: totalExecMs };
}

function experiment(variant) {
    const read = (status, durationMs, payloadBytes, extra = {}) =>
        ({ path: READ_PATH, method: 'POST', status, durationMs, payloadBytes, ...extra });
    const requests = [read(200, 20, 100), read(200, 40, 100), read(0, 10, null, { aborted: true }),
        ...[15, 25].map(durationMs => ({ path: WRITE_PATH, method: 'POST', status: 200, durationMs, payloadBytes: 5 }))];
    return {
        report: { schemaVersion: 1, generatedAt: '2026-10-03T00:00:00Z', variant,
            outcome: 'passed', stage: 'reload', rounds: 4, gestures: [2], finalValue: 'Não',
            reloadInitialCompetence: '2026-09', faults: { failuresInjected: 1,
                realtimeDisconnects: 1, realtimeRecovered: true }, limits: ['Synthetic fixture.'],
            samples: [{ elapsedMs: 60000, reads: 3, writes: 2, payloadBytes: 200, requests, errors: [],
                runtime: { loads: [{ source: 'realtime', durationMs: 20, ok: true },
                    { source: 'realtime', durationMs: 40, ok: true },
                    { source: 'realtime', durationMs: 10, ok: true, stale: true, aborted: true }],
                applies: 4, renderCalls: 4, mainReplacements: 2, mutations: 8, pendingRefresh: false,
                writeTiming: { sampleCount: 2, clickToFeedback: { p50: 1, p95: 2 },
                    rpc: { p50: null, p95: null }, apply: { p50: 3, p95: 4 },
                    clickToStable: { p50: 30, p95: 50 } },
                visual: { sampledFrames: 20, fadedFrames: 2, nearlyInvisibleFrames: 1, minOpacity: 0 } } }] },
        sqlBefore: [sqlRow(100, 1000)], sqlAfter: [sqlRow(105, 1100)]
    };
}

function pair() { return { baseline: experiment('baseline'), candidate: experiment('candidate') }; }

test('separa tentativas, aborts, SQL concluído e custo sem converter comparação em aceite', async () => {
    const { compareOperationalSessions } = await modulePromise;
    const inputs = pair();
    inputs.candidate.sqlAfter = [sqlRow(108, 1200)];
    const result = compareOperationalSessions(inputs);
    assert.equal(result.baseline.totals.readAttempts, 3);
    assert.equal(result.baseline.totals.successfulReadResponses, 2);
    assert.equal(result.baseline.totals.abortedReadAttempts, 1);
    assert.equal(result.baseline.sql.calls, 5);
    assert.equal(result.candidate.sql.calls, 8);
    assert.deepEqual(result.costBudgets.status, 'not-established');
    assert.equal(result.costBudgets.mode, 'report-only');
    assert.equal(result.changes.sqlCalls.percent, 60);
    assert.ok(result.warnings.some(warning => warning.code === 'cost-regression' && warning.metric === 'sqlCalls'));
    assert.ok(result.warnings.some(warning => warning.code === 'baseline-freshness-not-comparable'));
    assert.equal(result.candidate.sessions[0].successfulWriteDurationMs.p95, 25);
    assert.equal(result.candidate.sessions[0].writeTiming.apply.p95, 4);
    assert.equal(result.candidate.sessions[0].writeTiming.rpc.p95, null);
    assert.equal(result.candidate.sessions[0].domReplacements, 2);
    assert.equal(result.candidate.sessions[0].renderCalls, 4);
});

test('delta SQL usa queryID textual e papel; não subtrai máximos ou mistura identidades', async () => {
    const { sqlDelta } = await modulePromise;
    const before = [sqlRow(100, 1000), sqlRow(20, 200, '9007199254740993', 'service_role')];
    const after = [sqlRow(110, 1150), sqlRow(23, 260, '9007199254740993', 'service_role'),
        sqlRow(2, 70, '9007199254740994')];
    const delta = sqlDelta(before, after);
    assert.equal(delta.calls, 15);
    assert.equal(delta.totalExecMs, 280);
    assert.equal(delta.signatures.length, 3);
    assert.equal(delta.signatures[0].delta.meanExecMs, 15);
    assert.equal(delta.signatures[1].delta.calls, 3);
    assert.equal(delta.signatures[2].before, null);
    assert.equal(delta.maxDeltaExecMs, null);
    assert.match(delta.note, /Reset epoch is not recorded/);
});

test('não aceita reset, assinatura removida, ausência ou duplicação de estatísticas SQL', async () => {
    const { sqlDelta } = await modulePromise;
    assert.throws(() => sqlDelta([sqlRow(100, 1000)], [sqlRow(99, 1001)]), /regressed/);
    assert.throws(() => sqlDelta([sqlRow(100, 1000)], [sqlRow(101, 999)]), /regressed/);
    assert.throws(() => sqlDelta([sqlRow(100, 1000)], [sqlRow(101, 1001, '2')]), /disappeared/);
    assert.throws(() => sqlDelta([], []), /no measured SQL/);
    assert.throws(() => sqlDelta(undefined, [sqlRow(1, 1)]), /invalid SQL snapshot/);
    assert.throws(() => sqlDelta([], [sqlRow(1, 1), sqlRow(1, 1)]), /duplicate/);
    assert.throws(() => sqlDelta([], [{ ...sqlRow(1, 1), queryId: 123 }]), /decimal string/);
});

test('recusa experimento incompleto, métricas corrompidas e evidência visual ausente', async () => {
    const { compareOperationalSessions } = await modulePromise;
    for (const outcome of ['failed', 'incomplete']) {
        const inputs = pair(); inputs.candidate.report.outcome = outcome;
        assert.throws(() => compareOperationalSessions(inputs), /incomplete or failed/);
    }
    const noReload = pair(); noReload.candidate.report.stage = 'convergence';
    assert.throws(() => compareOperationalSessions(noReload), /requires passed reload/);
    const invalidReads = pair(); invalidReads.candidate.report.samples[0].reads = 99;
    assert.throws(() => compareOperationalSessions(invalidReads), /read count disagrees/);
    const invalidBytes = pair(); invalidBytes.candidate.report.samples[0].payloadBytes = 99;
    assert.throws(() => compareOperationalSessions(invalidBytes), /payload bytes disagree/);
    const noFrames = pair(); noFrames.candidate.report.samples[0].runtime.visual.sampledFrames = 0;
    assert.throws(() => compareOperationalSessions(noFrames), /opacity samples/);
    const missingRequest = pair(); delete missingRequest.candidate.report.samples[0].requests;
    assert.throws(() => compareOperationalSessions(missingRequest), /missing requests/);
    const missingRecovery = pair(); missingRecovery.candidate.report.faults.realtimeRecovered = false;
    assert.throws(() => compareOperationalSessions(missingRecovery), /recovery evidence/);
});

test('recusa cargas diferentes mesmo quando as duas jornadas passaram', async () => {
    const { compareOperationalSessions } = await modulePromise;
    const inputs = pair(); inputs.candidate.report.rounds = 8;
    assert.throws(() => compareOperationalSessions(inputs), /Workload mismatch/);
    const faults = pair(); faults.candidate.report.faults.failuresInjected = 2;
    assert.throws(() => compareOperationalSessions(faults), /Workload mismatch/);
    const gestures = pair();
    const sample = gestures.candidate.report.samples[0];
    gestures.candidate.report.gestures[0] = 3;
    sample.writes = 3;
    sample.requests.push({ ...sample.requests.at(-1) });
    assert.throws(() => compareOperationalSessions(gestures), /Workload mismatch/);
});

test('zero não gera percentuais falsos ou duração inexistente', async () => {
    const { change, compareOperationalSessions, renderComparisonMarkdown } = await modulePromise;
    assert.deepEqual(change(0, 5), { baseline: 0, candidate: 5, absolute: 5, percent: null, percentUnavailableReason: 'zero-baseline' });
    assert.equal(change(0, 0).percent, null);
    const inputs = pair();
    for (const input of Object.values(inputs)) {
        input.report.gestures = [0];
        input.report.samples[0].writes = 0;
        input.report.samples[0].requests = input.report.samples[0].requests.filter(request => request.path === READ_PATH);
        input.report.samples[0].runtime.writeTiming = null;
    }
    const result = compareOperationalSessions(inputs);
    assert.equal(result.baseline.totals.readsPerWrite, null);
    assert.equal(result.baseline.sessions[0].successfulWriteDurationMs.p95, null);
    assert.equal(result.baseline.sessions[0].writeTiming.status, 'unavailable');
    assert.match(renderComparisonMarkdown(result), /n\/a \(zero baseline\)/);
});

test('CPU ausente permanece não medido; instrumentação disponível compara carga e duração', async () => {
    const { compareOperationalSessions } = await modulePromise;
    const inputs = pair();
    const old = compareOperationalSessions(inputs);
    assert.equal(old.candidate.sessions[0].browserPerformance.status, 'not-recorded');
    assert.equal(old.candidate.totals.longTaskCount, null);
    assert.equal(old.changes.longTaskCount.percentUnavailableReason, 'not-recorded');
    const performance = {
        longTasks: { supported: true, count: 2, totalMs: 150, maxMs: 90, blockingMs: 50 },
        applyRemoteState: { count: 4, totalMs: 10, maxMs: 4, samplesMs: [1, 2, 3, 4] },
        renderProntuario: { count: 4, totalMs: 20, maxMs: 8 }
    };
    inputs.baseline.report.samples[0].runtime.performance = structuredClone(performance);
    inputs.candidate.report.samples[0].runtime.performance = structuredClone(performance);
    inputs.candidate.report.samples[0].runtime.performance.longTasks.count = 3;
    const result = compareOperationalSessions(inputs);
    assert.equal(result.changes.longTaskCount.percent, 50);
    assert.equal(result.candidate.totals.longTasksPerMinute, 3);
    assert.equal(result.candidate.sessions[0].browserPerformance.applySampleDurationMs.p95, 4);
    assert.equal(result.candidate.totals.renderTotalMs, 20);
    inputs.candidate.report.samples[0].runtime.performance.longTasks.supported = false;
    assert.equal(compareOperationalSessions(inputs).candidate.totals.longTaskCount, null);
});

async function writeArtifacts(root, variant, input) {
    const folder = path.join(root, variant, 'operational-sustained');
    await mkdir(path.join(folder, variant), { recursive: true });
    await writeFile(path.join(folder, variant, 'session-report.json'), JSON.stringify(input.report));
    await writeFile(path.join(folder, 'pg-stat-before.json'), JSON.stringify(input.sqlBefore));
    await writeFile(path.join(folder, 'pg-stat-after.json'), JSON.stringify(input.sqlAfter));
}

test('CLI produz JSON/Markdown rastreáveis e falha em artefato faltante/corrompido', async t => {
    const { main } = await modulePromise;
    const root = await mkdtemp(path.join(os.tmpdir(), 'radar-session-comparison-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    const inputs = pair();
    await Promise.all(Object.entries(inputs).map(([variant, input]) => writeArtifacts(root, variant, input)));
    const output = path.join(root, 'output');
    const args = ['--baseline', path.join(root, 'baseline'), '--candidate', path.join(root, 'candidate'), '--output', output];
    const result = await main(args, { GITHUB_RUN_ID: '123', GITHUB_SHA: 'abc' });
    const written = JSON.parse(await readFile(path.join(output, 'comparison.json'), 'utf8'));
    assert.deepEqual(written.metadata, result.metadata);
    assert.equal(written.metadata.runId, '123');
    assert.equal(written.metadata.sources.length, 6);
    const source = written.metadata.sources.find(entry => entry.variant === 'baseline' && entry.path.endsWith('session-report.json'));
    assert.equal(source.sha256, createHash('sha256').update(JSON.stringify(inputs.baseline.report)).digest('hex'));
    assert.match(await readFile(path.join(output, 'comparison.md'), 'utf8'), /Apply p50 \/ p95/);
    await writeFile(path.join(root, 'candidate/operational-sustained/candidate/session-report.json'), '{invalid');
    await assert.rejects(main(args, {}), /invalid JSON/);
    await writeArtifacts(root, 'candidate', inputs.candidate);
    await rm(path.join(root, 'candidate/operational-sustained/pg-stat-before.json'));
    await assert.rejects(main(args, {}), /ENOENT/);
    await assert.rejects(main(args.concat('--unknown', 'yes'), {}), /Usage:/);
});


test('comparação inclui leituras escolares e globais no mesmo custo contextual', async () => {
    const { compareOperationalSessions } = await modulePromise;
    const baseline = experiment('baseline');
    const candidate = experiment('candidate');
    candidate.report.samples[0].requests[0].path = '/rest/v1/rpc/read_school_operational_context';
    const result = compareOperationalSessions({ baseline, candidate });
    assert.equal(result.candidate.sessions[0].readAttempts, 3);
    assert.equal(result.candidate.sessions[0].payloadBytes, 200);
});
