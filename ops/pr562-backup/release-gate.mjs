import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CANDIDATE_SHA, PROJECT } from './backup-production.mjs';

export const REPOSITORY = 'WilsonMPeixoto-2/RADARPDDE';
export const MAIN_SHA = '32245854763fe43d74223d6772826855f1bd4bd9';
export const OPERATIONS_REF = 'refs/heads/ops/pr562-publicacao-controlada';
export const PREFLIGHT_RUN_ID = 45539820847;
export const REQUIRED_WORKFLOWS = [
  'unidentified-expense-identification-targeted.yml', 'lighthouse-ci.yml',
  'backup-restore-disposable.yml', 'retification-targeted.yml',
  'functional-reliability-supabase.yml', 'visual-regression.yml',
  'sync-hardening-targeted.yml', 'excel-sme-source-contract.yml',
  'production-authenticated-read.yml', 'snapshot-canonico-radar.yml',
  'prontuario-position-stability.yml', 'validate.yml', 'codeql.yml',
  'supabase-cli-v3-disposable-remote.yml', 'helpdesk-regressions-targeted.yml',
  'gate-remoto-perfis-viewports.yml', 'supabase-readiness.yml',
  'functional-reliability-lifecycle.yml', 'operational-real-usage-gate.yml',
  'preproduction-full-validation.yml', 'playwright-mobile.yml'
].map(name => `.github/workflows/${name}`);

export function verifyReleaseGate({ pr, main, preflight, runs, repository, ref, event }) {
  assert.equal(repository, REPOSITORY, 'Unexpected repository');
  assert.equal(ref, OPERATIONS_REF, 'Unexpected operations branch');
  assert.ok(['push', 'workflow_dispatch'].includes(event), 'Unexpected trigger');
  assert.equal(pr.number, 562, 'Unexpected pull request');
  assert.equal(pr.state, 'open', 'Pull request is no longer open');
  assert.equal(pr.merged, false, 'Pull request is already merged');
  assert.equal(pr.head?.repo?.full_name, REPOSITORY, 'Unexpected candidate repository');
  assert.equal(pr.head?.sha, CANDIDATE_SHA, 'Candidate has changed');
  assert.equal(pr.base?.ref, 'main', 'Unexpected target branch');
  assert.equal(pr.base?.repo?.full_name, REPOSITORY, 'Unexpected target repository');
  assert.equal(main.commit?.sha, MAIN_SHA, 'Production branch has changed');
  assert.equal(preflight.id, PREFLIGHT_RUN_ID, 'Unexpected institutional preflight');
  assert.equal(preflight.head_sha, CANDIDATE_SHA, 'Preflight belongs to another candidate');
  assert.equal(preflight.path, '.github/workflows/supabase-remote-validation.yml', 'Unexpected preflight workflow');
  assert.equal(preflight.event, 'workflow_dispatch', 'Unexpected preflight trigger');
  assert.equal(preflight.status, 'completed', 'Preflight is incomplete');
  assert.equal(preflight.conclusion, 'success', 'Preflight did not succeed');
  const latest = new Map();
  for (const run of runs) {
    if (run.event !== 'pull_request' || run.head_sha !== CANDIDATE_SHA) continue;
    const old = latest.get(run.path);
    if (!old || run.id > old.id) latest.set(run.path, run);
  }
  const approved = REQUIRED_WORKFLOWS.map(workflow => {
    const run = latest.get(workflow);
    assert.ok(run, `Required workflow is missing: ${workflow}`);
    assert.equal(run.status, 'completed', `Required workflow is incomplete: ${workflow}`);
    assert.equal(run.conclusion, 'success', `Required workflow did not succeed: ${workflow}`);
    return { path: workflow, runId: run.id, attempt: run.run_attempt, conclusion: run.conclusion };
  });
  return {
    schemaVersion: 1, projectRef: PROJECT, candidateSha: CANDIDATE_SHA,
    mainSha: MAIN_SHA, preflightRunId: PREFLIGHT_RUN_ID,
    approvedWorkflows: approved, operation: 'read-only institutional backup',
    humanAcceptance: 'PR562 screens and October encrypted GitHub artifact destination approved by repository owner in the release conversation'
  };
}

async function github(endpoint) {
  assert.ok(process.env.GH_TOKEN, 'GitHub read token is unavailable');
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/${endpoint}`, {
    headers: { Authorization: `Bearer ${process.env.GH_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error(`Release metadata read failed (${response.status})`);
  return response.json();
}

async function candidateRuns() {
  const runs = [];
  for (let page = 1; page <= 10; page++) {
    const result = await github(`actions/runs?head_sha=${CANDIDATE_SHA}&event=pull_request&per_page=100&page=${page}`);
    assert.ok(Array.isArray(result.workflow_runs), 'Invalid workflow response');
    runs.push(...result.workflow_runs);
    if (result.workflow_runs.length < 100) return runs;
  }
  throw new Error('Workflow pagination was incomplete');
}

async function main() {
  const [pr, mainBranch, preflight, runs] = await Promise.all([
    github('pulls/562'), github('branches/main'), github(`actions/runs/${PREFLIGHT_RUN_ID}`), candidateRuns()
  ]);
  const evidence = verifyReleaseGate({
    pr, main: mainBranch, preflight, runs,
    repository: process.env.GITHUB_REPOSITORY, ref: process.env.GITHUB_REF, event: process.env.GITHUB_EVENT_NAME
  });
  evidence.checkedAt = new Date().toISOString();
  evidence.opsCommit = process.env.GITHUB_SHA;
  evidence.runId = process.env.GITHUB_RUN_ID;
  assert.ok(process.env.GATE_OUTPUT_FILE && path.isAbsolute(process.env.GATE_OUTPUT_FILE), 'Explicit absolute gate output required');
  await writeFile(process.env.GATE_OUTPUT_FILE, JSON.stringify(evidence, null, 2) + '\n', { mode: 0o600 });
  console.log('PR562 candidate, main, institutional dry-run and all 21 required workflows verified.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
