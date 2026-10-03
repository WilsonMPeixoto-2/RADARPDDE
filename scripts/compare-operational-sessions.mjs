#!/usr/bin/env node
// Artifact comparison only: no database access, counter reset or product mutation.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const READ_PATH = '/rest/v1/rpc/read_operational_context';
const WRITE_PATHS = new Set([
    '/rest/v1/rpc/save_verification_with_log',
    '/rest/v1/rpc/save_invoice_with_effects',
    '/rest/v1/rpc/save_invoice_with_effects_v2',
    '/rest/v1/rpc/delete_invoice_with_effects'
]);
const SUM_FIELDS = [
    'gestures', 'writeAttempts', 'successfulWrites', 'readAttempts', 'successfulReadResponses',
    'abortedReadAttempts', 'readHttpErrors', 'readNetworkErrors', 'payloadBytes',
    'staleLoads', 'abortedLoads', 'failedLoads', 'stateApplies', 'renderCalls',
    'domReplacements', 'domMutations', 'sampledOpacityFrames', 'fadedOpacityFrames',
    'nearlyInvisibleFrames', 'pageErrors'
];
const OPTIONAL_SUM_FIELDS = ['longTaskCount', 'longTaskTotalMs', 'longTaskBlockingMs',
    'applyMeasuredCount', 'applyTotalMs', 'renderMeasuredCount', 'renderTotalMs'];

function requireCondition(condition, message) {
    if (!condition) throw new Error(message);
}

function number(value, label, integer = false) {
    requireCondition(typeof value === 'number' && Number.isFinite(value) && value >= 0
        && (!integer || Number.isSafeInteger(value)), `${label}: expected a nonnegative ${integer ? 'safe integer' : 'number'}`);
    return value;
}

function count(value, label) { return number(value, label, true); }
function sum(values) { return values.reduce((total, value) => total + value, 0); }
function ratio(numerator, denominator) { return denominator === 0 ? null : numerator / denominator; }

export function change(baseline, candidate) {
    if (baseline === null || candidate === null) return { baseline, candidate, absolute: null,
        percent: null, percentUnavailableReason: 'not-recorded' };
    return { baseline, candidate, absolute: candidate - baseline,
        percent: baseline === 0 ? null : (candidate - baseline) * 100 / baseline,
        percentUnavailableReason: baseline === 0 ? 'zero-baseline' : null };
}

function browserPerformanceSummary(performance, label) {
    const empty = Object.fromEntries(OPTIONAL_SUM_FIELDS.map(field => [field, null]));
    if (performance == null) return { status: 'not-recorded', ...empty };
    const { longTasks, applyRemoteState, renderProntuario } = performance;
    requireCondition(longTasks && typeof longTasks.supported === 'boolean', `${label}: missing long task support status`);
    for (const [name, timing] of Object.entries({ applyRemoteState, renderProntuario })) {
        requireCondition(timing && typeof timing === 'object', `${label}: missing ${name} timing`);
        count(timing.count, `${label}.${name}.count`);
        number(timing.totalMs, `${label}.${name}.totalMs`);
        number(timing.maxMs, `${label}.${name}.maxMs`);
    }
    if (longTasks.supported) {
        count(longTasks.count, `${label}.longTasks.count`);
        for (const field of ['totalMs', 'maxMs', 'blockingMs']) number(longTasks[field], `${label}.longTasks.${field}`);
    }
    requireCondition(Array.isArray(applyRemoteState.samplesMs), `${label}: missing apply duration samples`);
    for (const [index, value] of applyRemoteState.samplesMs.entries()) number(value, `${label}.apply.samplesMs[${index}]`);
    return { status: 'recorded',
        longTaskCount: longTasks.supported ? longTasks.count : null,
        longTaskTotalMs: longTasks.supported ? longTasks.totalMs : null,
        longTaskBlockingMs: longTasks.supported ? longTasks.blockingMs : null,
        applyMeasuredCount: applyRemoteState.count, applyTotalMs: applyRemoteState.totalMs,
        renderMeasuredCount: renderProntuario.count, renderTotalMs: renderProntuario.totalMs,
        longTasksSupported: longTasks.supported,
        longTaskMaxMs: longTasks.supported ? longTasks.maxMs : null,
        applyMaxMs: applyRemoteState.maxMs, renderMaxMs: renderProntuario.maxMs,
        applySampleDurationMs: percentiles(applyRemoteState.samplesMs) };
}

function percentiles(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const percentile = fraction => sorted.length ? sorted[Math.ceil(fraction * sorted.length) - 1] : null;
    return { samples: sorted.length, p50: percentile(0.5), p95: percentile(0.95),
        p99: percentile(0.99), max: sorted.at(-1) ?? null };
}

function writeTimingSummary(timing, label) {
    if (timing == null) return { status: 'unavailable', sampleCount: 0 };
    const sampleCount = count(timing.sampleCount, `${label}.sampleCount`);
    const result = { status: sampleCount > 0 ? 'available' : 'unavailable', sampleCount };
    for (const field of ['clickToFeedback', 'rpc', 'apply', 'clickToStable']) {
        requireCondition(timing[field] && typeof timing[field] === 'object', `${label}: missing ${field} summary`);
        result[field] = {};
        for (const percentile of ['p50', 'p95']) {
            const value = timing[field][percentile];
            result[field][percentile] = value === null ? null : number(value, `${label}.${field}.${percentile}`);
        }
    }
    return result;
}

function summarizeSample(sample, gestures, index, variant) {
    const label = `${variant}.samples[${index}]`;
    requireCondition(sample && typeof sample === 'object', `${label}: missing sample`);
    requireCondition(number(sample.elapsedMs, `${label}.elapsedMs`) > 0, `${label}: elapsedMs must be positive`);
    requireCondition(Array.isArray(sample.requests), `${label}: missing requests`);
    requireCondition(Array.isArray(sample.errors), `${label}: missing page errors`);
    for (const [i, request] of sample.requests.entries()) {
        const at = `${label}.requests[${i}]`;
        requireCondition(request && typeof request.path === 'string' && typeof request.method === 'string', `${at}: invalid request`);
        requireCondition(count(request.status, `${at}.status`) <= 599, `${at}: invalid HTTP status`);
        number(request.durationMs, `${at}.durationMs`);
        if (request.payloadBytes !== null) count(request.payloadBytes, `${at}.payloadBytes`);
    }
    const reads = sample.requests.filter(request => request.path === READ_PATH);
    const writes = sample.requests.filter(request => request.method === 'POST' && WRITE_PATHS.has(request.path));
    const succeeded = request => request.status >= 200 && request.status < 300;
    requireCondition(count(sample.reads, `${label}.reads`) === reads.length, `${label}: read count disagrees with requests`);
    requireCondition(count(sample.writes, `${label}.writes`) === writes.length, `${label}: write count disagrees with requests`);
    requireCondition(writes.length === gestures && writes.every(succeeded), `${label}: gestures and successful write attempts disagree`);
    requireCondition(reads.filter(succeeded).every(request => request.payloadBytes !== null), `${label}: missing successful read payload size`);
    const payloadBytes = sum(reads.map(request => request.payloadBytes ?? 0));
    requireCondition(count(sample.payloadBytes, `${label}.payloadBytes`) === payloadBytes, `${label}: payload bytes disagree with requests`);
    const runtime = sample.runtime;
    requireCondition(runtime && Array.isArray(runtime.loads), `${label}: missing runtime loads`);
    for (const [i, load] of runtime.loads.entries()) {
        requireCondition(load && typeof load.source === 'string' && typeof load.ok === 'boolean', `${label}.loads[${i}]: invalid load`);
        number(load.durationMs, `${label}.loads[${i}].durationMs`);
    }
    requireCondition(typeof runtime.pendingRefresh === 'boolean', `${label}: missing pending refresh state`);
    const visual = runtime.visual;
    requireCondition(visual && typeof visual === 'object', `${label}: missing opacity samples`);
    const sampledOpacityFrames = count(visual.sampledFrames, `${label}.visual.sampledFrames`);
    const fadedOpacityFrames = count(visual.fadedFrames, `${label}.visual.fadedFrames`);
    const nearlyInvisibleFrames = count(visual.nearlyInvisibleFrames, `${label}.visual.nearlyInvisibleFrames`);
    requireCondition(sampledOpacityFrames > 0 && fadedOpacityFrames <= sampledOpacityFrames
        && nearlyInvisibleFrames <= fadedOpacityFrames, `${label}: incomplete or inconsistent opacity samples`);
    requireCondition(number(visual.minOpacity, `${label}.visual.minOpacity`) <= 1, `${label}: invalid minimum opacity`);
    const browserPerformance = browserPerformanceSummary(runtime.performance, `${label}.runtime.performance`);
    return {
        session: index + 1, elapsedMs: sample.elapsedMs, gestures,
        writeAttempts: writes.length, successfulWrites: writes.filter(succeeded).length,
        readAttempts: reads.length, successfulReadResponses: reads.filter(succeeded).length,
        abortedReadAttempts: reads.filter(request => request.aborted === true).length,
        readHttpErrors: reads.filter(request => request.status >= 400).length,
        readNetworkErrors: reads.filter(request => request.status === 0 && request.aborted !== true).length,
        payloadBytes, readsPerWrite: ratio(reads.length, writes.length),
        readsPerMinute: reads.length * 60000 / sample.elapsedMs,
        successfulReadDurationMs: percentiles(reads.filter(succeeded).map(request => request.durationMs)),
        successfulWriteDurationMs: percentiles(writes.filter(succeeded).map(request => request.durationMs)),
        writeTiming: writeTimingSummary(runtime.writeTiming, `${label}.runtime.writeTiming`),
        browserPerformance,
        ...Object.fromEntries(OPTIONAL_SUM_FIELDS.map(field => [field, browserPerformance[field]])),
        longTasksPerMinute: browserPerformance.longTaskCount === null ? null
            : browserPerformance.longTaskCount * 60000 / sample.elapsedMs,
        staleLoads: runtime.loads.filter(load => load.stale === true).length,
        abortedLoads: runtime.loads.filter(load => load.aborted === true).length,
        failedLoads: runtime.loads.filter(load => load.ok === false).length,
        refreshSources: runtime.loads.reduce((sources, load) => {
            sources[load.source] = (sources[load.source] || 0) + 1;
            return sources;
        }, Object.create(null)),
        stateApplies: count(runtime.applies, `${label}.runtime.applies`),
        renderCalls: count(runtime.renderCalls, `${label}.runtime.renderCalls`),
        domReplacements: count(runtime.mainReplacements, `${label}.runtime.mainReplacements`),
        domMutations: count(runtime.mutations, `${label}.runtime.mutations`),
        sampledOpacityFrames, fadedOpacityFrames, nearlyInvisibleFrames,
        minOpacity: visual.minOpacity, pageErrors: sample.errors.length,
        pendingRefreshAtSnapshot: runtime.pendingRefresh
    };
}

function sqlIndex(snapshot, label) {
    requireCondition(Array.isArray(snapshot), `${label}: missing or invalid SQL snapshot`);
    const result = new Map();
    for (const row of snapshot) {
        requireCondition(row && typeof row.queryId === 'string' && /^-?\d+$/.test(row.queryId)
            && typeof row.role === 'string' && row.role.length > 0, `${label}: queryId must be a decimal string and role must be present`);
        const key = JSON.stringify([row.queryId, row.role]);
        requireCondition(!result.has(key), `${label}: duplicate queryId + role ${key}`);
        for (const field of ['calls', 'rows']) count(row[field], `${label}.${key}.${field}`);
        for (const field of ['totalExecMs', 'meanExecMs', 'maxExecMs']) number(row[field], `${label}.${key}.${field}`);
        result.set(key, row);
    }
    return result;
}

export function sqlDelta(before, after, label = 'sql') {
    const beforeIndex = sqlIndex(before, `${label}.before`);
    const afterIndex = sqlIndex(after, `${label}.after`);
    requireCondition(afterIndex.size > 0, `${label}: no measured SQL signatures after the completed workload`);
    for (const key of beforeIndex.keys()) {
        requireCondition(afterIndex.has(key), `${label}: SQL signature disappeared (reset/eviction or incomplete snapshot): ${key}`);
    }
    const signatures = [...afterIndex].map(([key, current]) => {
        const previous = beforeIndex.get(key);
        const delta = {};
        for (const field of ['calls', 'rows', 'totalExecMs']) {
            delta[field] = current[field] - (previous?.[field] ?? 0);
            requireCondition(delta[field] >= 0, `${label}: SQL ${field} regressed (reset or invalid snapshot): ${key}`);
        }
        requireCondition(delta.calls > 0 || (delta.totalExecMs === 0 && delta.rows === 0), `${label}: SQL totals changed without completed calls: ${key}`);
        return { queryId: current.queryId, role: current.role, before: previous ?? null, after: current,
            delta: { ...delta, meanExecMs: ratio(delta.totalExecMs, delta.calls) } };
    });
    const calls = sum(signatures.map(signature => signature.delta.calls));
    const totalExecMs = sum(signatures.map(signature => signature.delta.totalExecMs));
    requireCondition(calls > 0, `${label}: no completed SQL calls measured for the workload`);
    return { calls, totalExecMs, meanExecMs: totalExecMs / calls,
        rows: sum(signatures.map(signature => signature.delta.rows)), signatures,
        maxDeltaExecMs: null,
        note: 'Completed calls recorded by pg_stat_statements; not HTTP attempts. Snapshot max is not an interval maximum when a prior baseline exists. Reset epoch is not recorded by this artifact schema; counter regression/disappearance is rejected, but reset followed by regrowth cannot be excluded.' };
}

function summarizeExperiment(input, variant) {
    requireCondition(input && typeof input === 'object', `${variant}: missing experiment`);
    const report = input.report;
    requireCondition(report?.schemaVersion === 1 && report.variant === variant, `${variant}: invalid schema or variant`);
    requireCondition(report.outcome === 'passed' && report.stage === 'reload' && !report.failure,
        `${variant}: experiment is incomplete or failed (requires passed reload)`);
    requireCondition(Number.isFinite(Date.parse(report.generatedAt)), `${variant}: missing valid generatedAt`);
    requireCondition(count(report.rounds, `${variant}.rounds`) > 0, `${variant}: rounds must be positive`);
    requireCondition(Array.isArray(report.samples) && report.samples.length > 0
        && Array.isArray(report.gestures) && report.gestures.length === report.samples.length,
    `${variant}: missing or mismatched samples/gestures`);
    requireCondition(typeof report.finalValue === 'string' && report.finalValue.length > 0
        && typeof report.reloadInitialCompetence === 'string', `${variant}: missing final state/reload evidence`);
    requireCondition(report.faults && report.faults.realtimeRecovered === true,
        `${variant}: missing Realtime recovery evidence`);
    for (const key of ['failuresInjected', 'realtimeDisconnects']) count(report.faults[key], `${variant}.faults.${key}`);
    requireCondition(Array.isArray(report.limits) && report.limits.every(limit => typeof limit === 'string'), `${variant}: missing experiment limitations`);
    const sessions = report.samples.map((sample, index) => summarizeSample(sample,
        count(report.gestures[index], `${variant}.gestures[${index}]`), index, variant));
    const totals = Object.fromEntries(SUM_FIELDS.map(field => [field, sum(sessions.map(session => session[field]))]));
    totals.elapsedMs = Math.max(...sessions.map(session => session.elapsedMs));
    totals.readsPerWrite = ratio(totals.readAttempts, totals.writeAttempts);
    totals.readsPerMinute = totals.readAttempts * 60000 / totals.elapsedMs;
    totals.pendingRefreshSessions = sessions.filter(session => session.pendingRefreshAtSnapshot).length;
    for (const field of OPTIONAL_SUM_FIELDS) {
        totals[field] = sessions.some(session => session[field] === null) ? null : sum(sessions.map(session => session[field]));
    }
    totals.longTasksPerMinute = totals.longTaskCount === null ? null : totals.longTaskCount * 60000 / totals.elapsedMs;
    const sql = sqlDelta(input.sqlBefore, input.sqlAfter, `${variant}.sql`);
    return { generatedAt: report.generatedAt, rounds: report.rounds, gestures: report.gestures,
        finalValue: report.finalValue, faults: report.faults, totals, sessions, sql,
        convergence: { status: 'asserted-by-passed-journey', finalValue: report.finalValue,
            reloadInitialCompetence: report.reloadInitialCompetence,
            note: 'Passed journey asserts final database/UI/reload state and reconnect recovery; it does not measure freshness lag during continuous activity.' },
        limits: report.limits };
}

/** Pure comparison. Throws for invalid/incomplete or non-comparable evidence, not cost regressions. */
export function compareOperationalSessions({ baseline, candidate } = {}, metadata = {}) {
    const before = summarizeExperiment(baseline, 'baseline');
    const after = summarizeExperiment(candidate, 'candidate');
    requireCondition(before.rounds === after.rounds && JSON.stringify(before.gestures) === JSON.stringify(after.gestures),
        'Workload mismatch: rounds and gestures per session must match');
    requireCondition(before.finalValue === after.finalValue, 'Workload mismatch: final state differs');
    for (const key of ['failuresInjected', 'realtimeDisconnects']) {
        requireCondition(before.faults[key] === after.faults[key], `Workload mismatch: ${key} differs`);
    }
    const changes = Object.fromEntries([...SUM_FIELDS, ...OPTIONAL_SUM_FIELDS, 'elapsedMs', 'readsPerMinute', 'longTasksPerMinute'].map(field =>
        [field, change(before.totals[field], after.totals[field])]));
    changes.sqlCalls = change(before.sql.calls, after.sql.calls);
    changes.sqlTotalExecMs = change(before.sql.totalExecMs, after.sql.totalExecMs);
    const warnings = [];
    for (const metric of ['readAttempts', 'payloadBytes', 'sqlCalls', 'sqlTotalExecMs', 'domReplacements', 'domMutations',
        'longTaskCount', 'longTaskTotalMs', 'longTaskBlockingMs', 'applyTotalMs', 'renderTotalMs']) {
        if (changes[metric].absolute > 0) warnings.push({ code: 'cost-regression', metric, ...changes[metric] });
    }
    if (before.totals.staleLoads > 0 || before.totals.abortedReadAttempts > 0) warnings.push({
        code: 'baseline-freshness-not-comparable',
        message: 'Baseline includes stale/aborted reads. Fewer completed SQL calls or payload bytes can reflect deferred updates; final convergence alone does not establish equal freshness during activity.'
    });
    if (after.totals.pageErrors || after.totals.pendingRefreshSessions) warnings.push({
        code: 'candidate-runtime-warning', message: 'Review page errors/pending refresh despite the passed experiment outcome.'
    });
    return { schemaVersion: 1, status: 'diagnostic-comparison-complete', metadata,
        costBudgets: { status: 'not-established', mode: 'report-only',
            note: 'No operational cost SLO is established here. Timer-derived read limits are not cost acceptance criteria; a completed comparison is not release approval.' },
        baseline: before, candidate: after, changes,
        perSessionChanges: before.sessions.map((session, index) => ({ session: session.session,
            ...Object.fromEntries([...SUM_FIELDS, ...OPTIONAL_SUM_FIELDS, 'readsPerMinute', 'longTasksPerMinute'].map(field =>
                [field, change(session[field], after.sessions[index][field])])) })),
        warnings,
        limitations: [
            'Browser read attempts include aborts before or after sending; they are not completed database statements.',
            'pg_stat_statements spans a different interval, including bootstrap/reload outside browser observation; SQL cannot be assigned to individual sessions from these snapshots.',
            'Payload is observed read response body bytes, including observed error bodies; it excludes unknown bodies, protocol overhead, writes and other endpoints.',
            'DOM replacement/mutation counts are distinct from render calls. Sampled panel opacity is not comprehensive flicker or layout stability measurement.',
            'Read durations use successful responses only (nearest-rank percentiles), include induced transport latency and exclude aborted requests.',
            'Write HTTP durations cover observed successful write requests. UI write/apply summaries are copied from the instrumented subset (currently at most the last 100 evaluation samples); they are not all gestures. Null RPC/UI timing is unavailable, not zero. Aggregate p95/p99 cannot be reconstructed from session percentiles.',
            'Browser long-task/apply/render timing is optional: older artifacts report not-recorded, not zero. Long-task availability depends on browser support; synchronous render duration does not include subsequent asynchronous rendering/paint.',
            'Session indices follow the same workload order. Samples end before reload; the passed report attests reload assertions separately.',
            'Completed observation records do not include requests still in flight at snapshot time. Absence of recorded errors does not certify unobserved intervals.',
            ...new Set([...before.limits, ...after.limits])
        ] };
}

function format(value) {
    if (value === null) return 'n/a';
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function renderComparisonMarkdown(comparison) {
    const lines = ['# Operational session comparison', '',
        `Status: **${comparison.status}**. Cost budgets: **not-established / report-only**.`, '',
        comparison.costBudgets.note, '',
        `Workload: ${comparison.baseline.rounds} rounds; gestures per session: ${comparison.baseline.gestures.join(', ')}.`, '',
        '| Metric | Baseline | Candidate | Absolute delta | Change |', '|---|---:|---:|---:|---:|'];
    for (const [field, metric] of Object.entries(comparison.changes)) {
        lines.push(`| ${field} | ${format(metric.baseline)} | ${format(metric.candidate)} | ${format(metric.absolute)} | ${metric.percent === null ? `n/a (${metric.percentUnavailableReason === 'zero-baseline' ? 'zero baseline' : metric.percentUnavailableReason})` : `${format(metric.percent)}%`} |`);
    }
    lines.push('', 'Read attempts are browser observations; sqlCalls are completed pg_stat_statements deltas. Their collection intervals differ.', '',
        '## Sessions', '', '| Variant | Session | Gestures | Read attempts | HTTP successes | Read aborts | HTTP / network errors | Read bytes | Reads/min | DOM replacements / mutations | Faded / sampled opacity frames |',
        '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
    for (const variant of ['baseline', 'candidate']) for (const session of comparison[variant].sessions) {
        lines.push(`| ${variant} | ${session.session} | ${session.gestures} | ${session.readAttempts} | ${session.successfulReadResponses} | ${session.abortedReadAttempts} | ${session.readHttpErrors} / ${session.readNetworkErrors} | ${session.payloadBytes} | ${format(session.readsPerMinute)} | ${session.domReplacements} / ${session.domMutations} | ${session.fadedOpacityFrames} / ${session.sampledOpacityFrames} |`);
    }
    lines.push('', '## Successful request timing and UI write/apply timing', '',
        '| Variant | Session | Read HTTP p50 / p95 / p99 / max ms | Write HTTP p50 / p95 / p99 / max ms | UI samples | Apply p50 / p95 ms | Click to stable p50 / p95 ms |',
        '|---|---:|---:|---:|---:|---:|---:|');
    for (const variant of ['baseline', 'candidate']) for (const session of comparison[variant].sessions) {
        const durations = summary => ['p50', 'p95', 'p99', 'max'].map(key => format(summary[key])).join(' / ');
        const ui = summary => ['p50', 'p95'].map(key => format(summary?.[key] ?? null)).join(' / ');
        lines.push(`| ${variant} | ${session.session} | ${durations(session.successfulReadDurationMs)} | ${durations(session.successfulWriteDurationMs)} | ${session.writeTiming.sampleCount} | ${ui(session.writeTiming.apply)} | ${ui(session.writeTiming.clickToStable)} |`);
    }
    lines.push('', '## Browser work (when instrumented)', '',
        '| Variant | Session | Status | Long tasks / min | Long-task total / blocking ms | Apply count / total ms | Render count / synchronous total ms |',
        '|---|---:|---|---:|---:|---:|---:|');
    for (const variant of ['baseline', 'candidate']) for (const session of comparison[variant].sessions) {
        lines.push(`| ${variant} | ${session.session} | ${session.browserPerformance.status} | ${format(session.longTasksPerMinute)} | ${format(session.longTaskTotalMs)} / ${format(session.longTaskBlockingMs)} | ${format(session.applyMeasuredCount)} / ${format(session.applyTotalMs)} | ${format(session.renderMeasuredCount)} / ${format(session.renderTotalMs)} |`);
    }
    lines.push('', '## SQL baseline/delta', '', '| Variant | Query ID | Role | Before calls | After calls | Delta calls | Delta execution ms | Delta mean ms |',
        '|---|---|---|---:|---:|---:|---:|---:|');
    for (const variant of ['baseline', 'candidate']) for (const signature of comparison[variant].sql.signatures) {
        lines.push(`| ${variant} | ${signature.queryId} | ${signature.role} | ${signature.before?.calls ?? 0} | ${signature.after.calls} | ${signature.delta.calls} | ${format(signature.delta.totalExecMs)} | ${format(signature.delta.meanExecMs)} |`);
    }
    lines.push('', comparison.baseline.sql.note, '', '## Warnings', '');
    if (!comparison.warnings.length) lines.push('No increase in the listed cost metrics; budgets remain unestablished.');
    for (const warning of comparison.warnings) lines.push(`- ${warning.code}: ${warning.message ?? `${warning.metric} ${format(warning.baseline)} → ${format(warning.candidate)} (${warning.percent === null ? 'n/a, zero baseline' : `${format(warning.percent)}%`}).`}`);
    lines.push('', '## Convergence and limits', '', comparison.candidate.convergence.note, '');
    for (const limitation of comparison.limitations) lines.push(`- ${limitation}`);
    lines.push('', '## Provenance', '', `Workflow run: ${comparison.metadata.runId ?? 'not recorded'}.`, '',
        '| Variant | Source file | SHA-256 |', '|---|---|---|');
    for (const source of comparison.metadata.sources ?? []) lines.push(`| ${source.variant} | ${source.path} | ${source.sha256} |`);
    return `${lines.join('\n')}\n`;
}

async function loadExperiment(root, variant) {
    const sources = [];
    const read = async relativePath => {
        const filename = path.resolve(root, relativePath);
        const contents = await readFile(filename);
        sources.push({ variant, path: relativePath, sha256: createHash('sha256').update(contents).digest('hex') });
        try { return JSON.parse(contents.toString('utf8')); }
        catch (error) { throw new Error(`${filename}: invalid JSON (${error.message})`); }
    };
    const report = await read(`operational-sustained/${variant}/session-report.json`);
    const sqlBefore = await read('operational-sustained/pg-stat-before.json');
    const sqlAfter = await read('operational-sustained/pg-stat-after.json');
    return { input: { report, sqlBefore, sqlAfter }, sources };
}

export async function main(args = process.argv.slice(2), env = process.env) {
    const options = {};
    for (let i = 0; i < args.length; i += 2) {
        requireCondition(['--baseline', '--candidate', '--output'].includes(args[i])
            && args[i + 1] && !args[i + 1].startsWith('--') && !options[args[i]],
        'Usage: node scripts/compare-operational-sessions.mjs --baseline DIR --candidate DIR --output DIR');
        options[args[i]] = args[i + 1];
    }
    requireCondition(Object.keys(options).length === 3, 'Missing --baseline, --candidate or --output');
    const [baseline, candidate] = await Promise.all([
        loadExperiment(options['--baseline'], 'baseline'), loadExperiment(options['--candidate'], 'candidate')
    ]);
    const comparison = compareOperationalSessions({ baseline: baseline.input, candidate: candidate.input }, {
        runId: env.GITHUB_RUN_ID || null, runAttempt: env.GITHUB_RUN_ATTEMPT || null,
        workflowSha: env.GITHUB_SHA || null, sources: [...baseline.sources, ...candidate.sources]
    });
    await mkdir(options['--output'], { recursive: true });
    await writeFile(path.join(options['--output'], 'comparison.json'), `${JSON.stringify(comparison, null, 2)}\n`);
    await writeFile(path.join(options['--output'], 'comparison.md'), renderComparisonMarkdown(comparison));
    return comparison;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    main().then(comparison => {
        process.stdout.write(`Comparison saved; cost budgets ${comparison.costBudgets.status}; ${comparison.warnings.length} diagnostic warnings.\n`);
    }).catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
