import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { verifyBackup } from '../pr562-backup/backup-key.mjs';
import { CANDIDATE_SHA, PROJECT } from '../pr562-backup/backup-production.mjs';
import { MAIN_SHA, OPERATIONS_REF, REPOSITORY, REQUIRED_WORKFLOWS } from '../pr562-backup/release-gate.mjs';

const execute = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIGRATION = '20261124000100_extend_bonification_correction.sql';
const MIGRATION_SHA256 = '4fcac2ce2ca94118d7670264aa12b1a727e58653083d5ab27aab894dd767a1b1';
// Confirmed by the read-only institutional preflight on 2026-11-25.
const BASELINE_ISSUE_IDS_SHA256 = '7c45c8f0aa602856fd7fdaf19316219b824f96521f4afa493522bf44913e0ac4';
const PREVIOUS_IMPLEMENTATION_SHA256 = '9151a3c05a19dec1d7eb6a53a63e6699c1b87c52ff512f97eb5221b248f433d5';
const SHA256 = /^[0-9a-f]{64}$/;
const SHA1 = /^[0-9a-f]{40}$/;
const RPC = {
  public: 'public.apply_operational_change(jsonb,text,uuid)',
  implementation: 'radar_private.apply_operational_change_impl(jsonb,text,uuid)',
  previous: 'radar_private.apply_operational_change_impl_r4(jsonb,text,uuid)',
  planner: 'radar_private.operational_correction_build_plan_r2(jsonb)'
};
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const json = async file => JSON.parse(await readFile(file, 'utf8'));

export function validateConfig(config) {
  assert.equal(config.schemaVersion, 1, 'Invalid release configuration version');
  assert.equal(config.configured, true, 'Backup artifact has not been verified and configured');
  assert.equal(config.projectRef, PROJECT, 'Unexpected project');
  assert.equal(config.candidateSha, CANDIDATE_SHA, 'Unexpected candidate');
  assert.equal(config.mainSha, MAIN_SHA, 'Unexpected main');
  assert.equal(config.migration.file, MIGRATION, 'Unexpected migration');
  assert.equal(config.migration.sha256, MIGRATION_SHA256, 'Unexpected migration checksum');
  for (const key of ['runId', 'artifactId']) assert.match(config.backup[key], /^[1-9][0-9]*$/, 'Backup ID is missing');
  assert.match(config.backup.opsSha, SHA1, 'Backup commit is missing');
  assert.match(config.backup.artifactSha256, SHA256, 'Verified artifact checksum is missing');
  return config;
}

async function command(label, file, args, options = {}) {
  try {
    const result = await execute(file, args, {
      encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, timeout: 600000,
      env: process.env, ...options
    });
    return result.stdout;
  } catch (error) {
    // CLI/API diagnostics may contain connection details; never forward raw stderr.
    const stderr = String(error.stderr ?? '');
    throw Object.assign(new Error(label), {
      safeReason: label,
      diagnostic: {
        exitCode: Number.isInteger(error.code) ? error.code : null,
        timedOut: error.killed === true,
        permissionDenied: /permission denied/i.test(stderr),
        authenticationFailed: /password authentication failed/i.test(stderr),
        sqlState: /SQLSTATE[ :]+([0-9A-Z]{5})\b/i.exec(stderr)?.[1] ?? null
      }
    });
  }
}

async function github(endpoint) {
  return JSON.parse(await command('GitHub metadata read failed', 'gh', [
    'api', `repos/${REPOSITORY}/${endpoint}`
  ]));
}

function paths() {
  assert.ok(process.env.RUNNER_TEMP && path.isAbsolute(process.env.RUNNER_TEMP), 'Runner temporary directory is required');
  const root = path.join(process.env.RUNNER_TEMP, 'pr562-release');
  return {
    root, archive: path.join(root, 'backup.zip'), sealed: path.join(root, 'sealed'),
    evidence: path.join(process.env.RUNNER_TEMP, 'pr562-release-evidence')
  };
}

async function record(name, value) {
  const directory = paths().evidence;
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await writeFile(path.join(directory, name), JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
}

function verifySealedEvidence(config, evidence, gate) {
  assert.equal(evidence.schemaVersion, 1, 'Unknown backup evidence version');
  assert.equal(evidence.projectRef, PROJECT, 'Backup project mismatch');
  assert.equal(evidence.candidateSha, CANDIDATE_SHA, 'Backup candidate mismatch');
  assert.equal(evidence.opsCommit, config.backup.opsSha, 'Backup operations commit mismatch');
  assert.equal(String(evidence.runId), config.backup.runId, 'Backup run mismatch');
  for (const key of ['restoreVerified', 'authenticatedDecryptionVerified', 'sourceReadOnly', 'sourceSnapshotConsistent']) {
    assert.equal(evidence[key], true, 'Backup verification is incomplete');
  }
  assert.deepEqual([...evidence.requiredSchemas].sort(), ['auth', 'public', 'radar_private', 'storage', 'supabase_migrations']);
  assert.equal(evidence.storageObjectCount, 0, 'Unexpected Storage baseline');
  assert.equal(evidence.vaultSecretCount, 0, 'Unexpected Vault baseline');
  assert.match(evidence.ciphertextSha256, SHA256, 'Missing encrypted payload checksum');
  assert.match(evidence.snapshotFingerprintSha256, SHA256, 'Missing restoration fingerprint');
  assert.equal(gate.projectRef, PROJECT, 'Backup gate project mismatch');
  assert.equal(gate.candidateSha, CANDIDATE_SHA, 'Backup gate candidate mismatch');
  assert.equal(gate.mainSha, MAIN_SHA, 'Backup gate main mismatch');
  assert.equal(gate.opsCommit, config.backup.opsSha, 'Backup gate operations commit mismatch');
  assert.equal(String(gate.runId), config.backup.runId, 'Backup gate run mismatch');
  assert.deepEqual(gate.approvedWorkflows.map(w => w.path).sort(), [...REQUIRED_WORKFLOWS].sort());
  assert.ok(gate.approvedWorkflows.every(w => w.conclusion === 'success'), 'Backup CI gate was incomplete');
}

async function download(config) {
  const { backup } = config;
  const [run, artifact] = await Promise.all([
    github(`actions/runs/${backup.runId}`), github(`actions/artifacts/${backup.artifactId}`)
  ]);
  assert.equal(String(run.id), backup.runId);
  assert.equal(run.path, '.github/workflows/pr562-production-backup.yml');
  assert.equal(run.head_sha, backup.opsSha);
  assert.equal(run.head_branch, OPERATIONS_REF.slice('refs/heads/'.length));
  assert.equal(run.status, 'completed');
  assert.equal(run.conclusion, 'success');
  assert.ok(['push', 'workflow_dispatch'].includes(run.event));
  assert.equal(String(artifact.id), backup.artifactId);
  assert.equal(artifact.name, `pr562-production-backup-encrypted-${backup.runId}`);
  assert.equal(String(artifact.workflow_run?.id), backup.runId);
  assert.equal(artifact.workflow_run?.head_sha, backup.opsSha);
  assert.equal(artifact.expired, false);
  assert.ok(Date.parse(artifact.expires_at) > Date.now());
  assert.equal(artifact.digest, `sha256:${backup.artifactSha256}`);
  assert.ok(Number.isSafeInteger(artifact.size_in_bytes) && artifact.size_in_bytes > 0);
  const { root, archive, sealed } = paths();
  await mkdir(root, { mode: 0o700 });
  const bytes = await command('Encrypted artifact download failed', 'gh', [
    'api', `repos/${REPOSITORY}/actions/artifacts/${backup.artifactId}/zip`
  ], { encoding: 'buffer' });
  assert.equal(bytes.length, artifact.size_in_bytes, 'Artifact length mismatch');
  assert.equal(digest(bytes), backup.artifactSha256, 'Artifact bytes do not match the verified GitHub digest');
  await writeFile(archive, bytes, { mode: 0o600, flag: 'wx' });
  await command('Encrypted artifact extraction failed', 'python3', [path.join(HERE, 'extract-backup.py'), archive, sealed]);
  const evidence = await json(path.join(sealed, 'evidence.json'));
  const gate = await json(path.join(sealed, 'release-gate.json'));
  verifySealedEvidence(config, evidence, gate);
  await record('backup-artifact.json', {
    ...backup, projectRef: PROJECT, candidateSha: CANDIDATE_SHA,
    artifactBytes: bytes.length, artifactDigestVerified: true,
    originalRestoreVerified: true, originalAuthenticatedDecryptionVerified: true,
    snapshotFingerprintSha256: evidence.snapshotFingerprintSha256,
    ciphertextSha256: evidence.ciphertextSha256
  });
}

async function candidateContract(directory) {
  assert.ok(directory && path.isAbsolute(directory), 'Absolute candidate checkout is required');
  assert.equal((await command('Candidate checkout check failed', 'git', ['-C', directory, 'rev-parse', 'HEAD'])).trim(), CANDIDATE_SHA);
  const lock = await json(path.join(directory, 'package-lock.json'));
  assert.equal(lock.packages['node_modules/supabase'].version, '3.2.0', 'Unexpected CLI version');
  const names = (await readdir(path.join(directory, 'supabase/migrations'))).filter(name => name.endsWith('.sql')).sort();
  assert.equal(names.length, 68, 'Unexpected local migration count');
  assert.equal(names.at(-1), MIGRATION, 'Unexpected final migration');
  const bytes = await readFile(path.join(directory, 'supabase/migrations', MIGRATION));
  assert.equal(digest(bytes), MIGRATION_SHA256, 'Migration content changed');
  const migrations = names.map(file => {
    const match = /^(\d+)_(.+)\.sql$/.exec(file);
    assert.ok(match, 'Invalid migration filename');
    return { version: match[1], name: match[2] };
  });
  const bodyHashes = {};
  for (const signature of [RPC.public, RPC.implementation, RPC.planner]) {
    const name = signature.split('(')[0].replaceAll('.', '\\.');
    const match = new RegExp(`create(?:\\s+or\\s+replace)?\\s+function\\s+${name}\\s*\\([\\s\\S]*?\\bas\\s+\\$\\$([\\s\\S]*?)\\$\\$`, 'i').exec(bytes.toString('utf8'));
    assert.ok(match, 'Migration function body was not found');
    bodyHashes[signature] = digest(match[1]);
  }
  return { directory, migrations, bodyHashes };
}

export function verifyContract(contract, candidate, before) {
  assert.equal(contract.schemaVersion, 1, 'Unknown database contract');
  assert.equal(contract.database, 'postgres', 'Unexpected database');
  assert.equal(contract.transactionReadOnly, true, 'Catalog query is not in a read-only transaction');
  assert.ok(contract.serverVersionNum >= 170000 && contract.serverVersionNum < 180000, 'Unexpected PostgreSQL major');
  assert.deepEqual(contract.migrations, before ? candidate.migrations : candidate.migrations.slice(0, -1), 'Remote migration history is not aligned');
  const integrity = contract.integrity;
  assert.equal(integrity.schemaVersion, 1);
  assert.equal(integrity.status, 'issues_detected');
  assert.equal(integrity.totalIssues, 3, 'Institutional integrity baseline changed');
  assert.equal(Object.keys(integrity.checks).length, 20, 'Unexpected integrity controls');
  for (const [name, count] of Object.entries(integrity.checks)) {
    assert.equal(count, name === 'permanent_invoices_without_linked_asset' ? 3 : 0, 'Integrity control differs from the approved baseline');
  }
  assert.equal(integrity.checks.permanent_invoices_without_linked_asset, 3);
  assert.equal(contract.baselineIssueIdsSha256, BASELINE_ISSUE_IDS_SHA256, 'The known baseline occurrences changed');
  assert.deepEqual(contract.functions.map(f => f.signature).sort(), Object.values(RPC).sort());
  for (const routine of contract.functions) {
    const isPrevious = routine.signature === RPC.previous;
    if (isPrevious && !before) {
      assert.equal(routine.present, false, 'Migration 68 appears already applied or schema has drifted');
      continue;
    }
    const isPublic = routine.signature === RPC.public;
    const isPlanner = routine.signature === RPC.planner;
    assert.equal(routine.present, true, 'Required function is missing');
    assert.equal(routine.owner, 'postgres');
    assert.equal(routine.result_type, 'jsonb');
    assert.equal(routine.security_definer, !isPublic);
    assert.equal(routine.volatility, isPlanner ? 's' : 'v');
    assert.deepEqual(routine.settings, [isPublic ? 'search_path=pg_catalog, radar_private' : 'search_path=pg_catalog, public, radar_private']);
    assert.equal(routine.anon_execute, false);
    assert.equal(routine.public_execute, false);
    assert.equal(routine.authenticated_execute, !isPrevious && !isPlanner);
    assert.equal(routine.service_role_execute, !isPlanner);
    assert.match(routine.body_sha256, SHA256);
    if (!before && routine.signature === RPC.implementation) {
      assert.equal(routine.body_sha256, PREVIOUS_IMPLEMENTATION_SHA256, 'The pre-migration implementation changed');
    }
    if (before) {
      const expected = isPrevious
        ? before.functions.find(f => f.signature === RPC.implementation).body_sha256
        : candidate.bodyHashes[routine.signature];
      assert.equal(routine.body_sha256, expected, 'Function body does not match the approved migration');
    }
  }
  if (before) {
    assert.deepEqual(contract.integrity, before.integrity, 'Integrity changed during apply');
    assert.equal(contract.baselineIssueIdsSha256, before.baselineIssueIdsSha256, 'The three baseline occurrences changed during apply');
  }
  return contract;
}

let sessionPoolerUrl;
async function queryContract(candidate, evidenceFile) {
  assert.ok(process.env.SUPABASE_ACCESS_TOKEN, 'Supabase access token is unavailable');
  assert.ok(process.env.SUPABASE_DB_PASSWORD, 'Database password is unavailable');
  if (!sessionPoolerUrl) {
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/config/database/pooler`, {
      headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}` },
      signal: AbortSignal.timeout(30000)
    });
    assert.ok(response.ok, `Session pooler discovery failed (HTTP ${response.status})`);
    const configurations = await response.json();
    const config = configurations.find(item => item.database_type === 'PRIMARY' && item.db_host?.endsWith('.pooler.supabase.com'));
    assert.ok(config, 'No recognized primary Supavisor endpoint');
    const url = new URL(`postgresql://${config.db_host}:5432/postgres`);
    url.username = `postgres.${PROJECT}`;
    url.password = process.env.SUPABASE_DB_PASSWORD;
    url.searchParams.set('sslmode', 'require');
    sessionPoolerUrl = url.href;
  }
  // CLI 3.2.0 uses BEGIN READ ONLY / ROLLBACK for a direct URL. Keep the
  // existing database role: the API read-only role cannot execute the monitor.
  // The URL stays in memory; command() never logs arguments or raw diagnostics.
  const output = await command('Read-only session catalog query failed', path.join(candidate.directory, 'node_modules/.bin/supabase'), [
    'db', 'query', `--remote=${sessionPoolerUrl}`, '--read-only',
    '--file', path.join(HERE, 'postflight.sql'), '--output', 'json', '--agent=no'
  ], { cwd: candidate.directory, timeout: 90000 });
  const rows = JSON.parse(output);
  assert.ok(Array.isArray(rows) && rows.length === 1 && rows[0].contract, 'Unexpected read-only contract response');
  await record(evidenceFile, rows[0].contract);
  return rows[0].contract;
}

export function verifyPushResult(result, dryRun) {
  const value = result.data ?? result;
  assert.equal(value.upToDate, false, 'Expected exactly one pending migration');
  assert.equal(value.dryRun, dryRun, 'Unexpected push mode');
  assert.deepEqual(value.migrations, [MIGRATION], 'Push plan is not exclusively migration 68');
  assert.deepEqual(value.seeds, [], 'Seeds are forbidden');
  assert.deepEqual(value.roles, [], 'Role files are forbidden');
  if (result.target) {
    assert.equal(result.target.kind, 'linked');
    assert.equal(result.target.project_ref, PROJECT);
  }
  return { dryRun, migrations: value.migrations, seeds: [], roles: [] };
}

async function gate(name) {
  const outputFile = path.join(paths().evidence, name);
  await mkdir(paths().evidence, { recursive: true, mode: 0o700 });
  await command('Candidate/main/CI gate failed', process.execPath, [path.join(HERE, '../pr562-backup/release-gate.mjs')], {
    env: { ...process.env, GATE_OUTPUT_FILE: outputFile }
  });
  const result = await json(outputFile);
  result.operation = 'PR562 migration 68 release gate';
  await record(name, result);
}

async function main() {
  const mode = process.argv[2];
  const state = {
    schemaVersion: 1, projectRef: PROJECT, candidateSha: CANDIDATE_SHA, mainSha: MAIN_SHA,
    opsCommit: process.env.GITHUB_SHA, runId: process.env.GITHUB_RUN_ID,
    operation: 'migration 68 only', mode, phase: 'configuration', status: 'running',
    databaseMayHaveChanged: false, startedAt: new Date().toISOString()
  };
  try {
    assert.equal(process.env.GITHUB_REPOSITORY, REPOSITORY);
    assert.equal(process.env.GITHUB_REF, OPERATIONS_REF);
    assert.equal(process.env.GITHUB_EVENT_NAME, 'push');
    assert.ok(['config', 'download', 'apply'].includes(mode));
    const config = validateConfig(await json(path.join(HERE, 'release-config.json')));
    if (mode === 'download') {
      state.phase = 'encrypted-backup-download';
      await download(config);
    }
    if (mode === 'apply') {
      state.phase = 'candidate-and-backup-verification';
      const candidate = await candidateContract(process.env.CANDIDATE_DIR);
      assert.ok(process.env.SUPABASE_DB_PASSWORD, 'Database password is unavailable');
      const sealed = paths().sealed;
      verifySealedEvidence(config, await json(path.join(sealed, 'evidence.json')), await json(path.join(sealed, 'release-gate.json')));
      const backupVerification = await verifyBackup({ outputDir: sealed, password: process.env.SUPABASE_DB_PASSWORD });
      await record('authenticated-backup-verification.json', backupVerification);
      const cli = path.join(candidate.directory, 'node_modules/.bin/supabase');
      assert.equal((await command('CLI version check failed', cli, ['--version'], { cwd: candidate.directory })).trim(), '3.2.0');
      state.phase = 'read-only-preflight';
      const before = verifyContract(await queryContract(candidate, 'preflight.json'), candidate);
      state.phase = 'link-and-dry-run';
      await command('Explicit project link failed', cli, ['link', '--project-ref', PROJECT, '--password', process.env.SUPABASE_DB_PASSWORD], { cwd: candidate.directory });
      const linkedRef = (await readFile(path.join(candidate.directory, 'supabase/.temp/project-ref'), 'utf8')).trim();
      assert.equal(linkedRef, PROJECT, 'CLI is linked to another project');
      const pushArgs = ['db', 'push', '--remote', '--skip-vault', '--password', process.env.SUPABASE_DB_PASSWORD, '--output-format', 'json'];
      const dryRun = await command('Migration dry-run failed', cli, [...pushArgs, '--dry-run'], { cwd: candidate.directory });
      await record('dry-run.json', verifyPushResult(JSON.parse(dryRun), true));
      state.phase = 'last-pre-apply-gates';
      await gate('last-release-gate.json');
      await candidateContract(candidate.directory);
      const immediate = verifyContract(await queryContract(candidate, 'immediate-preflight.json'), candidate);
      assert.deepEqual(immediate, before, 'Database contract changed after dry-run');
      state.phase = 'migration-68-apply';
      state.applyStartedAt = new Date().toISOString();
      state.databaseMayHaveChanged = true;
      await record('status.json', state);
      const applied = await command('Migration application failed', cli, [...pushArgs, '--yes'], { cwd: candidate.directory });
      await record('apply.json', verifyPushResult(JSON.parse(applied), false));
      state.phase = 'read-only-postflight';
      const after = verifyContract(await queryContract(candidate, 'postflight.json'), candidate, before);
      state.migrationVersion = '20261124000100';
      state.migrationSha256 = MIGRATION_SHA256;
      state.postflightVerified = true;
      state.backupRunId = config.backup.runId;
      state.backupArtifactId = config.backup.artifactId;
      state.backupArtifactSha256 = config.backup.artifactSha256;
    }
    state.status = 'success';
    state.completedAt = new Date().toISOString();
    await record(mode === 'apply' ? 'status.json' : `${mode}-status.json`, state);
    console.log(`PR562 ${mode}: verified successfully.`);
  } catch (error) {
    state.status = 'failed';
    state.failure = {
      reason: error.safeReason ?? (error.code === 'ERR_ASSERTION' && !error.generatedMessage
        ? error.message.split('\n')[0].slice(0, 200) : 'Unexpected error; raw details withheld'),
      ...(error.diagnostic ? { diagnostic: error.diagnostic } : {})
    };
    state.completedAt = new Date().toISOString();
    await record(mode === 'apply' ? 'status.json' : `${mode}-status.json`, state).catch(() => {});
    console.error(`PR562 blocked at ${state.phase}: ${state.failure.reason}. See sanitized status.`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
