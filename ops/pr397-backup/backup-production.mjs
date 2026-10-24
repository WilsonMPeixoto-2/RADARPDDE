import { spawn } from 'node:child_process';
import { createHash, createPublicKey, publicEncrypt, randomBytes, createCipheriv, constants } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readFile, writeFile, chmod, rm } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT = 'scnryinorqeucbfkioxo';
const CONTAINER = 'supabase_db_radar-pdde';
const REQUIRED = ['public', 'radar_private', 'auth', 'storage', 'supabase_migrations'];
const qid = value => '"' + String(value).replaceAll('"', '""') + '"';
const sqlString = value => "'" + String(value).replaceAll("'", "''") + "'";
const digest = value => createHash('sha256').update(value).digest('hex');

async function fileHash(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

// This module only sends explicitly listed libpq variables into the container.
async function exec(command, args, { env = process.env, input, output, label = command } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: ['pipe', 'pipe', 'pipe'] });
    const parts = [];
    let stderr = '';
    let sink;
    if (output) { sink = createWriteStream(output, { mode: 0o600 }); sink.once('error', () => { child.kill(); reject(new Error(`${label}: private output failed`)); }); child.stdout.pipe(sink); }
    else child.stdout.on('data', chunk => parts.push(chunk));
    child.stderr.on('data', chunk => { stderr += chunk.toString(); });
    child.once('error', () => reject(new Error(`${label}: process launch failed`)));
    child.once('close', async code => {
      if (sink) await new Promise(done => sink.writableFinished ? done() : sink.once('finish', done));
      if (code !== 0) {
        if (process.env.BACKUP_PRIVATE_DIR) {
          await writeFile(path.join(process.env.BACKUP_PRIVATE_DIR, 'failure-private.txt'), stderr, { mode: 0o600 });
        }
        reject(new Error(`${label}: failed; details remain private on the ephemeral runner`));
      } else resolve(Buffer.concat(parts).toString('utf8').trim());
    });
    child.stdin.end(input);
  });
}

function dockerArgs(env, executable, args) {
  const forwarded = ['PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGDATABASE', 'PGSSLMODE', 'PGOPTIONS'];
  return ['exec', '-i', ...forwarded.flatMap(key => ['--env', key]), CONTAINER, executable, ...args];
}

function pg(env, executable, args, options = {}) {
  return exec('docker', dockerArgs(env, executable, args), { ...options, env: { ...process.env, ...env } });
}

async function query(env, sql, snapshot) {
  const body = snapshot
    ? `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY; SET TRANSACTION SNAPSHOT ${sqlString(snapshot)}; ${sql} COMMIT;`
    : sql;
  return pg(env, 'psql', ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1'], { input: body, label: 'Read metadata/fingerprint' });
}

export async function closeSnapshot(child) {
  if (child.exitCode !== null) {
    if (child.exitCode !== 0) throw new Error('Read-only snapshot session failed');
    return;
  }
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Read-only snapshot close timed out'));
    }, 10000);
    child.once('close', code => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error('Read-only snapshot session failed'));
    });
    child.stdin.end('ROLLBACK;\n');
  });
}

async function keepSnapshot(env) {
  const child = spawn('docker', dockerArgs(env, 'psql', ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1']), {
    env: { ...process.env, ...env }, stdio: ['pipe', 'pipe', 'pipe']
  });
  const snapshot = await new Promise((resolve, reject) => {
    let out = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('Read-only snapshot creation timed out')); }, 45000);
    child.stdout.on('data', chunk => {
      out += chunk;
      const match = out.match(/RADAR_SNAPSHOT:([0-9A-Fa-f-]+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
    child.stderr.on('data', () => {});
    child.once('error', () => { clearTimeout(timer); reject(new Error('Snapshot process failed')); });
    child.once('exit', () => { clearTimeout(timer); reject(new Error('Snapshot session ended prematurely')); });
    child.stdin.write("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY; SELECT 'RADAR_SNAPSHOT:' || pg_export_snapshot();\n");
  });
  return { snapshot, child, close: () => closeSnapshot(child) };
}

async function poolerEnvironment() {
  if (!process.env.SUPABASE_ACCESS_TOKEN || !process.env.SUPABASE_DB_PASSWORD) throw new Error('Required existing Actions secrets are unavailable');
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/config/database/pooler`, {
    headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}` }
  });
  if (!response.ok) throw new Error(`Read-only pooler discovery failed (${response.status})`);
  const configurations = await response.json();
  const config = configurations.find(item => item.database_type === 'PRIMARY' && item.db_host?.endsWith('.pooler.supabase.com'));
  if (!config) throw new Error('No recognized primary Supavisor endpoint; refuse to guess a database host');
  // The official Session pooler uses port 5432; transaction pooling is unsuitable for a held snapshot.
  return {
    PGHOST: config.db_host, PGPORT: '5432', PGUSER: `postgres.${PROJECT}`, PGPASSWORD: process.env.SUPABASE_DB_PASSWORD,
    PGDATABASE: 'postgres', PGSSLMODE: 'require',
    PGOPTIONS: '-c default_transaction_read_only=on -c statement_timeout=900000 -c lock_timeout=10000 -c search_path=pg_catalog,public'
  };
}

async function fingerprint(env, tables, snapshot) {
  const selects = tables.map(({ schema, name }) => `SELECT ${sqlString(schema + '.' + name)} AS name, count(*) AS rows,
    md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text)::text, '[]')) AS hash FROM ${qid(schema)}.${qid(name)} t`);
  const rows = JSON.parse(await query(env, `SELECT coalesce(json_agg(x ORDER BY name), '[]'::json) FROM (${selects.join(' UNION ALL ')}) x;`, snapshot));
  const schemas = REQUIRED.map(sqlString).join(',');
  // A logical restore preserves visible column order, not gaps left by dropped columns.
  // Both connections use the same search_path so catalog definitions have identical qualification.
  const schemaHash = await query(env, `WITH objects AS (
    SELECT 'column|' || table_schema || '|' || table_name || '|' || logical_position || '|' || column_name || '|' || udt_name || '|' || is_nullable || '|' || coalesce(column_default,'') AS item
      FROM (SELECT *, row_number() OVER (PARTITION BY table_schema, table_name ORDER BY ordinal_position) AS logical_position
        FROM information_schema.columns WHERE table_schema IN (${schemas})) logical_columns
    UNION ALL SELECT 'constraint|' || n.nspname || '|' || c.relname || '|' || k.conname || '|' || pg_get_constraintdef(k.oid,true)
      FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN (${schemas})
    UNION ALL SELECT 'function|' || n.nspname || '|' || p.proname || '|' || pg_get_functiondef(p.oid)
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN (${schemas}) AND p.prokind IN ('f','p')
    UNION ALL SELECT 'policy|' || schemaname || '|' || tablename || '|' || policyname || '|' || permissive || '|' || array_to_string(roles,',') || '|' || cmd || '|' || coalesce(qual,'') || '|' || coalesce(with_check,'')
      FROM pg_policies WHERE schemaname IN (${schemas})
    UNION ALL SELECT 'rls|' || n.nspname || '|' || c.relname || '|' || c.relrowsecurity || '|' || c.relforcerowsecurity
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN (${schemas}) AND c.relkind IN ('r','p')
  ) SELECT md5(coalesce(string_agg(item,E'\n' ORDER BY item),'')) FROM objects;`, snapshot);
  return { tables: rows, schemaHash };
}

export async function encryptArchive(archive, publicKeyFile, outputDir) {
  const recipient = createPublicKey(await readFile(publicKeyFile));
  if (recipient.asymmetricKeyType !== 'rsa' || recipient.asymmetricKeyDetails.modulusLength < 3072) throw new Error('Recipient must be an RSA public key of at least 3072 bits');
  await mkdir(outputDir, { recursive: true, mode: 0o700 });
  const key = randomBytes(32);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = path.join(outputDir, 'backup.tar.gz.enc');
  await pipeline(createReadStream(archive), cipher, createWriteStream(ciphertext, { mode: 0o600 }));
  const envelope = {
    schemaVersion: 1, cipher: 'aes-256-gcm', keyWrap: 'rsa-oaep-sha256',
    recipientSpkiSha256: digest(recipient.export({ type: 'spki', format: 'der' })),
    iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'),
    wrappedKey: publicEncrypt({ key: recipient, oaepHash: 'sha256', padding: constants.RSA_PKCS1_OAEP_PADDING }, key).toString('base64'),
    ciphertextSha256: await fileHash(ciphertext), archiveSha256: await fileHash(archive)
  };
  key.fill(0);
  await writeFile(path.join(outputDir, 'envelope.json'), JSON.stringify(envelope, null, 2) + '\n', { mode: 0o600 });
  return envelope;
}

async function main() {
  const privateDir = path.resolve(process.env.BACKUP_PRIVATE_DIR || '');
  const outputDir = path.resolve(process.env.BACKUP_OUTPUT_DIR || '');
  if (!process.env.BACKUP_PRIVATE_DIR || !process.env.BACKUP_OUTPUT_DIR || !process.env.BACKUP_PUBLIC_KEY) throw new Error('Explicit private/output paths and recipient public key are required');
  await mkdir(privateDir, { recursive: true, mode: 0o700 });
  await chmod(privateDir, 0o700);
  const source = await poolerEnvironment();
  // Managed functions in the unchanged archive use superuser-only SET parameters.
  // Supabase's existing local administrator is used exclusively inside the disposable container.
  const local = { PGHOST: '127.0.0.1', PGPORT: '5432', PGUSER: 'supabase_admin', PGPASSWORD: 'postgres', PGDATABASE: 'radar_pr397_restore', PGSSLMODE: 'disable', PGOPTIONS: '-c statement_timeout=900000 -c search_path=pg_catalog,public' };
  if (await query({ ...local, PGDATABASE: 'postgres' }, 'SHOW is_superuser;') !== 'on') {
    throw new Error('Disposable restore requires the existing local superuser; Production access remains read-only');
  }
  const keeper = await keepSnapshot(source);
  let sourceFingerprint;
  let tables;
  try {
    if (await query(source, 'SHOW transaction_read_only;', keeper.snapshot) !== 'on') throw new Error('Production connection is not read-only');
    const info = JSON.parse(await query(source, `SELECT json_build_object('version', current_setting('server_version'), 'storageObjects', (SELECT count(*) FROM storage.objects), 'vaultSecrets', (SELECT count(*) FROM vault.secrets));`, keeper.snapshot));
    if (!info.version.startsWith('17.')) throw new Error('Source PostgreSQL major differs from the approved disposable major');
    if (info.storageObjects !== 0 || info.vaultSecrets !== 0) throw new Error('Storage objects or Vault secrets require an additional encrypted recovery plan; do not claim a complete backup');
    tables = JSON.parse(await query(source, `SELECT json_agg(json_build_object('schema',n.nspname,'name',c.relname) ORDER BY n.nspname,c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN (${REQUIRED.map(sqlString).join(',')}) AND c.relkind IN ('r','p');`, keeper.snapshot));
    sourceFingerprint = await fingerprint(source, tables, keeper.snapshot);
    await writeFile(path.join(privateDir, 'source-fingerprint.json'), JSON.stringify(sourceFingerprint, null, 2));
    await pg(source, 'pg_dump', ['--format=custom', '--snapshot', keeper.snapshot, '--lock-wait-timeout=10s'], { output: path.join(privateDir, 'database.dump'), label: 'Read full logical database archive' });
    await pg(source, 'pg_dumpall', ['--roles-only', '--no-role-passwords'], { output: path.join(privateDir, 'roles.sql'), label: 'Read cluster role definitions without passwords' });
    const roles = JSON.parse(await query(source, 'SELECT json_agg(rolname ORDER BY rolname) FROM pg_roles;', keeper.snapshot));
    await writeFile(path.join(privateDir, 'role-names.json'), JSON.stringify(roles));
    const locals = JSON.parse(await query({ ...local, PGDATABASE: 'postgres' }, 'SELECT json_agg(rolname ORDER BY rolname) FROM pg_roles;'));
    const missingRoles = roles.filter(name => !locals.includes(name));
    if (missingRoles.length) await query({ ...local, PGDATABASE: 'postgres' }, missingRoles.map(name => `CREATE ROLE ${qid(name)} NOLOGIN;`).join('\n'));
    await pg({ ...local, PGDATABASE: 'postgres' }, 'createdb', ['--template=template0', local.PGDATABASE], { label: 'Create isolated verification database' });
  } finally { await keeper.close(); }
  await exec('docker', ['cp', path.join(privateDir, 'database.dump'), `${CONTAINER}:/tmp/pr397-production.dump`], { label: 'Copy archive to disposable container' });
  // Disable every container network before restore so restored SQL cannot contact the source or external services.
  const networks = JSON.parse(await exec('docker', ['inspect', '--format', '{{json .NetworkSettings.Networks}}', CONTAINER], { label: 'Inspect disposable networks' }));
  for (const network of Object.keys(networks)) {
    await exec('docker', ['network', 'disconnect', '--force', network, CONTAINER], { label: 'Isolate disposable restore network' });
  }
  const toc = await pg(local, 'pg_restore', ['--list', '/tmp/pr397-production.dump']);
  // PostgreSQL omits the default public schema definition when pg_database_owner owns it.
  for (const schema of REQUIRED.filter(name => name !== 'public')) {
    if (!toc.includes(`SCHEMA - ${schema} `)) throw new Error(`Required schema is absent from archive: ${schema}`);
  }
  // No source connection variables or source URI are present in this command.
  await pg(local, 'pg_restore', ['--dbname', local.PGDATABASE, '--single-transaction', '--exit-on-error', '--no-owner', '/tmp/pr397-production.dump'], { label: 'Restore only into isolated disposable database' });
  const restoredSchemas = JSON.parse(await query(local, 'SELECT json_agg(nspname ORDER BY nspname) FROM pg_namespace;'));
  for (const schema of REQUIRED) {
    if (!restoredSchemas.includes(schema)) throw new Error(`Required schema is absent after restore: ${schema}`);
  }
  const restored = await fingerprint(local, tables);
  await writeFile(path.join(privateDir, 'restored-fingerprint.json'), JSON.stringify(restored, null, 2));
  if (JSON.stringify(restored) !== JSON.stringify(sourceFingerprint)) throw new Error('Restored database content/definitions differ from the source snapshot');
  const archive = path.join(path.dirname(privateDir), 'pr397-backup.tar.gz');
  await exec('tar', ['--create', '--gzip', '--file', archive, '--directory', privateDir, '.'], { label: 'Package private logical backup' });
  const envelope = await encryptArchive(archive, process.env.BACKUP_PUBLIC_KEY, outputDir);
  await rm(archive);
  const evidence = {
    schemaVersion: 1, projectRef: PROJECT, createdAt: new Date().toISOString(), sourceReadOnly: true,
    backup: 'full logical pg_dump archive plus password-free cluster roles',
    sourceSnapshotConsistent: true, requiredSchemas: REQUIRED, restoreTarget: 'ephemeral runner localhost/radar_pr397_restore',
    verification: 'rows, columns, constraints, function definitions, policies and RLS flags in all five required schemas',
    originalOwnershipAndClusterRoles: 'preserved in archive; local verifier uses no-owner and existing local platform roles',
    restoreVerified: true, storageObjectCount: 0, vaultSecretCount: 0,
    snapshotFingerprintSha256: digest(JSON.stringify(sourceFingerprint)),
    ciphertextSha256: envelope.ciphertextSha256, recipientSpkiSha256: envelope.recipientSpkiSha256,
    opsCommit: process.env.GITHUB_SHA || null, runId: process.env.GITHUB_RUN_ID || null
  };
  await writeFile(path.join(outputDir, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n', { mode: 0o600 });
  console.log('Read-only Production backup restored and verified on the disposable runner; only encrypted files and sanitized evidence may be uploaded.');
}

async function sealFailure(error) {
  if (!process.env.BACKUP_PRIVATE_DIR || !process.env.BACKUP_OUTPUT_DIR || !process.env.BACKUP_PUBLIC_KEY) return;
  const privateDir = path.resolve(process.env.BACKUP_PRIVATE_DIR);
  const outputDir = path.resolve(process.env.BACKUP_OUTPUT_DIR);
  const archive = path.join(path.dirname(privateDir), 'pr397-backup.tar.gz');
  await mkdir(privateDir, { recursive: true, mode: 0o700 });
  await writeFile(path.join(privateDir, 'failure-context.json'), JSON.stringify({
    error: error.message, projectRef: PROJECT, opsCommit: process.env.GITHUB_SHA || null,
    runId: process.env.GITHUB_RUN_ID || null, restoreVerified: false
  }, null, 2), { mode: 0o600 });
  await exec('tar', ['--create', '--gzip', '--file', archive, '--directory', privateDir, '.'], { label: 'Package private failure diagnostics' });
  const envelope = await encryptArchive(archive, process.env.BACKUP_PUBLIC_KEY, outputDir);
  await rm(archive);
  await writeFile(path.join(outputDir, 'evidence.json'), JSON.stringify({
    schemaVersion: 1, projectRef: PROJECT, createdAt: new Date().toISOString(),
    result: 'failure', artifactPurpose: 'encrypted diagnostics or partial dump; NOT a certified backup',
    restoreVerified: false, sourceReadOnly: true, opsCommit: process.env.GITHUB_SHA || null,
    runId: process.env.GITHUB_RUN_ID || null, ciphertextSha256: envelope.ciphertextSha256,
    recipientSpkiSha256: envelope.recipientSpkiSha256
  }, null, 2) + '\n', { mode: 0o600 });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(async error => {
    try { await sealFailure(error); }
    catch { console.error('Could not encrypt private failure diagnostics; no successful backup may be claimed.'); }
    console.error(error.message);
    process.exitCode = 1;
  });
}
