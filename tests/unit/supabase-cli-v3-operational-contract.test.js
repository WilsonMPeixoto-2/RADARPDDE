'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '../..');
const source = name => fs.readFileSync(path.join(ROOT, name), 'utf8');
const wf = name => source('.github/workflows/' + name + '.yml');

test('CLI 3.2.0 and configuration grants are explicitly pinned', () => {
  const pkg=JSON.parse(source('package.json'));
  assert.equal(pkg.devDependencies.supabase, '3.2.0');
  const config=source('supabase/config.toml');
  assert.match(config, /major_version\s*=\s*17\b/);
  assert.match(config, /auto_expose_new_tables\s*=\s*false\b/);
  assert.match(config, /\[auth\.email\][\s\S]*?enabled\s*=\s*true\b/);
  assert.doesNotMatch(config.split('[auth.email]')[1].split('\n[')[0], /\benable_signup\s*=/);
  assert.match(source('docs/TECHNOLOGY_CAPABILITIES_TRACKER.md'), /\x60supabase@3\.2\.0\x60/);
});

test('remote CI workflows select an explicit remote and reject legacy linked flags', () => {
  for (const name of [
    'supabase-remote-validation','supabase-remote-post-apply',
    'production-data-integrity','importar-snapshot-canonico-supabase',
    'remove-test-invoice-1234','update-inventory-process-0411012'
  ]) {
    const content=wf(name);
    assert.doesNotMatch(content, /supabase (db|migration|test|gen|functions)\s+[^\n]*--linked\b/, name);
    assert.match(content, /supabase (db|migration|test|gen|functions)\s+[^\n]*--remote\b/, name);
  }
});

test('preflight, postapply and production DO verification stay in PostgreSQL read-only transactions', () => {
  for (const name of ['supabase-remote-validation','supabase-remote-post-apply','production-data-integrity']) {
    const content=wf(name);
    assert.match(content, /BEGIN TRANSACTION READ ONLY;/, name);
    assert.match(content, /supabase db query --remote --yes --file/, name);
    assert.match(content, /COMMIT;/, name);
  }
});

test('remote workflows preserve explicit authorization for hosted writes', () => {
  const post=wf('supabase-remote-post-apply');
  assert.match(post, /APLICAR_25_MIGRATIONS_EM_AMBIENTE_DESCARTAVEL/);
  assert.match(post, /supabase db push --remote --password.*--yes/);
  assert.match(post, /supabase test db [^\n]*--remote --yes/);
  assert.match(post, /supabase functions deploy team-account-management[\s\S]*?--remote=[^\n]*[\s\S]*?--yes/);
  const imported=wf('importar-snapshot-canonico-supabase');
  assert.match(imported, /IMPORTAR_SNAPSHOT_CANONICO_RADAR_PDDE/);
  assert.match(imported, /supabase db query --remote --yes --file/);
});

test('historical one-shot production scripts cannot rerun on a push or PR', () => {
  for (const name of ['remove-test-invoice-1234','update-inventory-process-0411012']) {
    const content=wf(name);
    assert.match(content, /on:\s*\n\s+workflow_dispatch:/, name);
    assert.doesNotMatch(content, /on:\s*\n\s+push:/, name);
    assert.match(content, /inputs\.confirmation/, name);
    assert.match(content, /supabase db query --remote --yes --file/, name);
  }
});

test('backup/restore tool explicitly uses CLI 3 remote DB URL semantics', () => {
  const body=source('scripts/verify-supabase-backup-restore.mjs');
  assert.doesNotMatch(body, /'--db-url'/);
  assert.match(body, /--remote=/);
});
