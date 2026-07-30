const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const ROOT = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

test('backup e restauração usam duas pilhas Supabase descartáveis e comparam integridade', () => {
  const script = read('scripts/verify-supabase-backup-restore.mjs');
  const workflow = read('.github/workflows/backup-restore-disposable.yml');
  const packageJson = JSON.parse(read('package.json'));

  assert.equal(packageJson.scripts['test:backup-restore'], 'node scripts/verify-supabase-backup-restore.mjs');
  assert.match(script, /RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE/);
  assert.match(script, /supabase db dump/);
  assert.match(script, /--role-only/);
  assert.match(script, /--data-only/);
  assert.match(script, /--use-copy/);
  assert.match(script, /SUPABASE_WORKDIR/);
  assert.match(script, /schemaFingerprint/);
  assert.match(script, /dataFingerprint/);
  assert.match(script, /finally/);
  assert.match(script, /supabase stop/);

  assert.match(workflow, /npm run supabase:start/);
  assert.match(workflow, /npm run supabase:reset/);
  assert.match(workflow, /RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE:\s*'true'/);
  assert.match(workflow, /npm run test:backup-restore/);
  assert.match(workflow, /actions\/upload-artifact@/);
  assert.doesNotMatch(workflow, /secrets\./);
  assert.doesNotMatch(workflow, /--linked/);
});

test('bloqueadores não exigem recurso pago de proteção contra senhas vazadas', () => {
  for (const documentPath of ['README.md', 'AGENTS.md', 'docs/CURRENT_STAGE.md']) {
    const source = read(documentPath);
    const blockerSection = source.slice(source.search(/bloqueadores|gates de liberação/i));
    assert.doesNotMatch(blockerSection, /proteção contra senhas vazadas/i, documentPath);
  }
});
