// Pure Node CPU benchmark. No database, browser, network, or real personal records.
// node scripts/benchmark-operational-projections.mjs --baseline 1e9991b2 --output <report.json>
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const { createOperationalProjectionVolume } = require('../tests/fixtures/operational-projection-volume.js');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const options = { baseline: '1e9991b2', output: null };
for (let index = 2; index < process.argv.length; index += 2) {
  const flag = process.argv[index];
  if (!['--baseline', '--output'].includes(flag) || !process.argv[index + 1]) {
    throw new Error('Usage: --baseline <commit SHA> [--output <report.json>]');
  }
  options[flag.slice(2)] = process.argv[index + 1];
}
if (!/^[a-f0-9]{7,40}$/i.test(options.baseline)) throw new Error('Baseline must be a commit SHA.');
const baselineSha = execFileSync('git', ['rev-parse', options.baseline], { cwd: root, encoding: 'utf8' }).trim();
const files = {
  operational: 'src/domain/operational-projection.js',
  pendencies: 'src/domain/pendencias-view-model.js'
};
const hashes = {};
function loadModule(key, baseline) {
  const file = files[key];
  const source = baseline
    ? execFileSync('git', ['show', `${baselineSha}:${file}`], { cwd: root, encoding: 'utf8' })
    : readFileSync(path.join(root, file), 'utf8');
  hashes[`${baseline ? 'baseline' : 'candidate'}:${file}`] = createHash('sha256').update(source).digest('hex');
  const context = vm.createContext({ module: { exports: {} } });
  vm.runInContext(source, context, { filename: file });
  return context.module.exports;
}
const baseline = Object.fromEntries(Object.keys(files).map(key => [key, loadModule(key, true)]));
const candidate = Object.fromEntries(Object.keys(files).map(key => [key, loadModule(key, false)]));
const warmup = 8;
const samples = 31;
const batch = 3;
let sink = 0;
const rounded = value => Number(value.toFixed(3));
function consume(model) {
  sink += model.total ?? model.totals.schools;
}
function summarize(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const percentile = quantile => rounded(sorted[Math.ceil(sorted.length * quantile) - 1]);
  return {
    medianMs: percentile(0.5), p95Ms: percentile(0.95),
    minMs: rounded(sorted[0]), maxMs: rounded(sorted.at(-1)),
    samplesMs: values.map(rounded)
  };
}
function measurePair(before, after) {
  for (let index = 0; index < warmup; index += 1) {
    consume(before());
    consume(after());
  }
  const results = { baseline: [], candidate: [] };
  const operations = { baseline: before, candidate: after };
  for (let index = 0; index < samples; index += 1) {
    // Alternate order to limit warmup/host drift favoring either implementation.
    const order = index % 2 ? ['candidate', 'baseline'] : ['baseline', 'candidate'];
    for (const name of order) {
      const start = performance.now();
      for (let iteration = 0; iteration < batch; iteration += 1) consume(operations[name]());
      results[name].push((performance.now() - start) / batch);
    }
  }
  return { baseline: summarize(results.baseline), candidate: summarize(results.candidate) };
}

const scenarios = [];
for (const scale of [1, 4]) {
  const input = createOperationalProjectionVolume(scale);
  const cases = [
    ['projection-all-august', 'operational', 'buildOperationalProjection', { ...input, competencia: '2026-08' }],
    ['projection-controller-august', 'operational', 'buildOperationalProjection', {
      ...input, escolas: input.escolas.filter(school => school.controladorId === 'ctrl-0'), competencia: '2026-08'
    }],
    ['pendencies-all', 'pendencies', 'createPendencyPageModel', input],
    ['pendencies-filter-august', 'pendencies', 'createPendencyPageModel', { ...input, filters: { competence: '2026-08' } }]
  ];
  for (const [name, module, method, data] of cases) {
    const initialInput = JSON.stringify(data);
    const before = () => baseline[module][method](data);
    const after = () => candidate[module][method](data);
    const baselineOutput = JSON.stringify(before());
    assert.equal(JSON.stringify(after()), baselineOutput, `Full JSON equivalence: ${name}, scale ${scale}`);
    const result = measurePair(before, after);
    assert.equal(JSON.stringify(data), initialInput, `Input preserved: ${name}, scale ${scale}`);
    const scenario = {
      name, scale,
      workload: {
        schools: data.escolas.length, pendencies: data.pendencias.length, contacts: data.contatos.length,
        attempts: data.pendencias.reduce((sum, item) => sum + item.tentativas.length, 0),
        competence: data.competencia || data.filters?.competence || 'all',
        schoolPrograms: data.escolas.reduce((sum, school) => sum + school.programasIds.length, 0)
      },
      fullJsonEquivalent: true, inputPreserved: true,
      outputSha256: createHash('sha256').update(baselineOutput).digest('hex'),
      ...result,
      medianReductionPercent: rounded((1 - result.candidate.medianMs / result.baseline.medianMs) * 100)
    };
    scenarios.push(scenario);
    process.stdout.write(`${JSON.stringify({ name, scale, baselineMedianMs: result.baseline.medianMs,
      candidateMedianMs: result.candidate.medianMs, medianReductionPercent: scenario.medianReductionPercent })}\n`);
  }
}
const report = {
  generatedAt: new Date().toISOString(), baselineSha,
  kind: 'synthetic-in-memory-projection-cpu',
  runtime: { node: process.version, v8: process.versions.v8, icu: process.versions.icu },
  machine: { platform: process.platform, arch: process.arch, cpu: os.cpus()[0]?.model,
    logicalCpus: os.cpus().length, availableParallelism: os.availableParallelism(), memoryGiB: rounded(os.totalmem() / 1024 ** 3) },
  methodology: {
    warmupCallsPerImplementation: warmup, samplesPerImplementation: samples, callsPerSample: batch,
    statistic: 'Milliseconds per public API call; each sample is the mean of its batch; nearest-rank p50/p95.',
    ordering: 'Interleaved baseline/candidate, alternating execution order each sample.',
    fixture: 'tests/fixtures/operational-projection-volume.js',
    countSource: 'supabase/fixtures/operational-production-shape.sql',
    statusCallbacks: 'Fixed nao-lancada / nao-analisado callbacks match the SQL fixture. The cost of production status lookup implementations is not measured.',
    scope: 'All-school and synthetic controller portfolio inputs mirror existing UI projection entrypoints. No Auth/RLS exercise.',
    limitations: 'Node CPU only, without DOM, fetch, SQL, hydration or real production records/latency. 4x is a synthetic growth scenario. A single host run is not a production SLA.',
    cachePolicy: 'Locale collator reused; record indexes are reconstructed each call. No cross-call data cache.',
    equivalence: 'Complete serialized output equality and input preservation asserted for every scenario before reporting.'
  },
  sourcesSha256: hashes, scenarios, sink
};
if (options.output) {
  const destination = path.resolve(root, options.output);
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`Saved ${path.relative(root, destination)}\n`);
}
