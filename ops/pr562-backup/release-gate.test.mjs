import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyReleaseGate, REPOSITORY, MAIN_SHA, OPERATIONS_REF, PREFLIGHT_RUN_ID, REQUIRED_WORKFLOWS } from './release-gate.mjs';
import { CANDIDATE_SHA } from './backup-production.mjs';

function fixture() {
  return {
    repository: REPOSITORY, ref: OPERATIONS_REF, event: 'push',
    pr: { number: 562, state: 'open', merged: false, head: { sha: CANDIDATE_SHA, repo: { full_name: REPOSITORY } }, base: { ref: 'main', repo: { full_name: REPOSITORY } } },
    main: { commit: { sha: MAIN_SHA } },
    preflight: { id: PREFLIGHT_RUN_ID, head_sha: CANDIDATE_SHA, path: '.github/workflows/supabase-remote-validation.yml', event: 'workflow_dispatch', status: 'completed', conclusion: 'success' },
    runs: REQUIRED_WORKFLOWS.map((path, id) => ({ path, id: id + 1, event: 'pull_request', head_sha: CANDIDATE_SHA, status: 'completed', conclusion: 'success', run_attempt: 1 }))
  };
}

test('accepts only the approved candidate with all required workflows and preflight', () => {
  assert.equal(verifyReleaseGate(fixture()).approvedWorkflows.length, 21);
});

test('refuses candidate, main, repository and trigger drift', () => {
  for (const mutate of [
    x => { x.pr.head.sha = 'changed'; }, x => { x.main.commit.sha = 'changed'; },
    x => { x.repository = 'other/repository'; }, x => { x.ref = 'refs/heads/main'; },
    x => { x.pr.head.repo.full_name = 'other/repository'; }, x => { x.event = 'pull_request'; },
    x => { x.pr.merged = true; }, x => { x.preflight.head_sha = 'changed'; }
  ]) {
    const input = fixture(); mutate(input); assert.throws(() => verifyReleaseGate(input));
  }
});

test('refuses missing, failed, running or superseded unsuccessful workflow evidence', () => {
  for (const mutate of [
    x => { x.runs.pop(); }, x => { x.runs[0].conclusion = 'failure'; },
    x => { x.runs[0].status = 'in_progress'; }, x => { x.preflight.conclusion = 'failure'; },
    x => { x.runs.push({ ...x.runs[0], id: 999, conclusion: 'failure' }); }
  ]) {
    const input = fixture(); mutate(input); assert.throws(() => verifyReleaseGate(input));
  }
});
