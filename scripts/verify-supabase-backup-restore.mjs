import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_DIR = path.resolve(
  ROOT,
  process.env.RADAR_BACKUP_RESTORE_OUTPUT_DIR || 'artifacts/backup-restore'
);
const NPM = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const PSQL = process.platform === 'win32' ? 'psql.exe' : 'psql';
const RESTORE_PROJECT_ID = 'radar-pdde-restore';
const RESTORE_PORTS = Object.freeze({ api: 55321, db: 55322, shadow: 55320 });
const AUTH_TABLES = Object.freeze([
  { name: 'users', qualified: 'auth.users' },
  { name: 'identities', qualified: 'auth.identities' }
]);

if (process.env.RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE !== 'true') {
  throw new Error(
    'Execução bloqueada. Defina RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE=true somente em ambiente descartável.'
  );
}

function redact(value) {
  return String(value || '')
    .replace(/postgresql:\/\/[^\s]+/gi, '[DB_URL_REDACTED]')
    .replace(/(password|secret|token|key)=([^\s]+)/gi, '$1=[REDACTED]');
}

function run(command, args, { capture = false, cwd = ROOT, env = process.env, label = command } = {}) {
  process.stdout.write(`→ ${label}\n`);
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit'
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    const details = capture ? `\n${redact(result.stderr || result.stdout)}` : '';
    throw new Error(`${label} falhou com status ${result.status}.${details}`);
  }
  return capture ? String(result.stdout || '').trim() : '';
}

function runSupabase(args, { workdir, capture = false, label } = {}) {
  const env = workdir ? { ...process.env, SUPABASE_WORKDIR: workdir } : process.env;
  return run(NPM, ['supabase', ...args], {
    capture,
    env,
    label: label || `supabase ${args[0] || ''}`.trim()
  });
}

function parseEnvOutput(output) {
  return Object.fromEntries(
    output
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => /^[A-Z0-9_]+=/.test(line))
      .map(line => {
        const index = line.indexOf('=');
        const key = line.slice(0, index);
        let value = line.slice(index + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        return [key, value];
      })
  );
}

function status(workdir) {
  return parseEnvOutput(
    runSupabase(['status', '-o', 'env'], {
      workdir,
      capture: true,
      label: workdir ? 'Ler status da pilha restaurada' : 'Ler status da pilha de origem'
    })
  );
}

function psql(dbUrl, args, { capture = false, label = 'psql' } = {}) {
  return run(PSQL, ['--dbname', dbUrl, ...args], { capture, label });
}

function psqlQuery(dbUrl, sql) {
  return psql(dbUrl, ['--tuples-only', '--no-align', '--quiet', '--command', sql], {
    capture: true,
    label: 'Consultar fingerprint PostgreSQL'
  });
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function quoteIdentifier(identifier) {
  return `"${String(identifier).replaceAll('"', '""')}"`;
}

async function fileEvidence(filePath) {
  const [content, metadata] = await Promise.all([readFile(filePath), stat(filePath)]);
  return {
    file: path.basename(filePath),
    bytes: metadata.size,
    sha256: sha256(content)
  };
}

function schemaFingerprint(dbUrl) {
  const sql = String.raw`
WITH objects AS (
  SELECT 'column|' || table_name || '|' || ordinal_position || '|' || column_name || '|' ||
         data_type || '|' || COALESCE(udt_name, '') || '|' || is_nullable || '|' ||
         COALESCE(column_default, '') AS item
  FROM information_schema.columns
  WHERE table_schema = 'public'
  UNION ALL
  SELECT 'constraint|' || rel.relname || '|' || con.conname || '|' ||
         pg_get_constraintdef(con.oid, true)
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace ns ON ns.oid = rel.relnamespace
  WHERE ns.nspname = 'public'
  UNION ALL
  SELECT 'index|' || tbl.relname || '|' || pg_get_indexdef(idx.indexrelid)
  FROM pg_index idx
  JOIN pg_class tbl ON tbl.oid = idx.indrelid
  JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
  WHERE ns.nspname = 'public'
  UNION ALL
  SELECT 'policy|' || tablename || '|' || policyname || '|' || permissive || '|' ||
         COALESCE(array_to_string(roles, ','), '') || '|' || cmd || '|' ||
         COALESCE(qual, '') || '|' || COALESCE(with_check, '')
  FROM pg_policies
  WHERE schemaname = 'public'
  UNION ALL
  SELECT 'function|' || proc.oid::regprocedure::text || '|' || pg_get_functiondef(proc.oid)
  FROM pg_proc proc
  JOIN pg_namespace ns ON ns.oid = proc.pronamespace
  WHERE ns.nspname = 'public'
  UNION ALL
  SELECT 'trigger|' || tbl.relname || '|' || trg.tgname || '|' || pg_get_triggerdef(trg.oid, true)
  FROM pg_trigger trg
  JOIN pg_class tbl ON tbl.oid = trg.tgrelid
  JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
  WHERE ns.nspname = 'public' AND NOT trg.tgisinternal
)
SELECT item FROM objects ORDER BY item;`;
  return sha256(psqlQuery(dbUrl, sql));
}

function deterministicTableEvidence(dbUrl, qualified) {
  const sql = `
SELECT count(*)::text || '|' || COALESCE(
  md5(string_agg(row_data, E'\\n' ORDER BY row_data)),
  md5('')
)
FROM (SELECT to_jsonb(source_row)::text AS row_data FROM ${qualified} AS source_row) rows;`;
  const [count, fingerprint] = psqlQuery(dbUrl, sql).split('|');
  return { count: Number(count), fingerprint };
}

function tableDataEvidence(dbUrl) {
  const tables = psqlQuery(
    dbUrl,
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
  )
    .split(/\r?\n/)
    .map(value => value.trim())
    .filter(Boolean);

  const evidence = {};
  for (const table of tables) {
    evidence[table] = deterministicTableEvidence(dbUrl, `public.${quoteIdentifier(table)}`);
  }
  return evidence;
}

function dataFingerprint(dbUrl) {
  const tables = tableDataEvidence(dbUrl);
  return {
    tables,
    sha256: sha256(JSON.stringify(tables))
  };
}

function authFingerprint(dbUrl) {
  const tables = {};
  for (const table of AUTH_TABLES) {
    tables[table.name] = deterministicTableEvidence(dbUrl, table.qualified);
  }
  return {
    tables,
    sha256: sha256(JSON.stringify(tables))
  };
}

function migrationFingerprint(dbUrl) {
  const sql = String.raw`
SELECT version || '|' || COALESCE(name, '') || '|' ||
       md5(COALESCE(array_to_string(statements, E'\n'), ''))
FROM supabase_migrations.schema_migrations
ORDER BY version;`;
  return sha256(psqlQuery(dbUrl, sql));
}

function createRestoreConfig(sourceConfig) {
  return sourceConfig
    .replace(/^project_id\s*=.*$/m, `project_id = "${RESTORE_PROJECT_ID}"`)
    .replace(/^port\s*=\s*54321$/m, `port = ${RESTORE_PORTS.api}`)
    .replace(/^port\s*=\s*54322$/m, `port = ${RESTORE_PORTS.db}`)
    .replace(/^shadow_port\s*=\s*54320$/m, `shadow_port = ${RESTORE_PORTS.shadow}`)
    .replace(/(\[db\.seed\][\s\S]*?enabled\s*=\s*)true/, '$1false');
}

async function prepareRestoreWorkdir(workdir) {
  const supabaseDir = path.join(workdir, 'supabase');
  await mkdir(path.join(supabaseDir, 'migrations'), { recursive: true });
  const sourceConfig = await readFile(path.join(ROOT, 'supabase/config.toml'), 'utf8');
  await writeFile(path.join(supabaseDir, 'config.toml'), createRestoreConfig(sourceConfig));
  await writeFile(path.join(supabaseDir, 'seed.sql'), '-- restauração descartável: seed desativado\n');
  await cp(path.join(ROOT, 'supabase/functions'), path.join(supabaseDir, 'functions'), {
    recursive: true
  });
}

async function dumpSource(sourceDbUrl) {
  const files = {
    roles: path.join(OUTPUT_DIR, 'roles.sql'),
    schema: path.join(OUTPUT_DIR, 'schema.sql'),
    data: path.join(OUTPUT_DIR, 'data.sql'),
    historySchema: path.join(OUTPUT_DIR, 'history-schema.sql'),
    historyData: path.join(OUTPUT_DIR, 'history-data.sql')
  };

  // supabase db dump é usado deliberadamente em vez de pg_dump cru.
  runSupabase(['db', 'dump', '--db-url', sourceDbUrl, '-f', files.roles, '--role-only'], {
    label: 'Gerar backup de papéis'
  });
  runSupabase(['db', 'dump', '--db-url', sourceDbUrl, '-f', files.schema], {
    label: 'Gerar backup de schema'
  });
  runSupabase(
    ['db', 'dump', '--db-url', sourceDbUrl, '-f', files.data, '--use-copy', '--data-only'],
    { label: 'Gerar backup de dados' }
  );
  runSupabase(
    ['db', 'dump', '--db-url', sourceDbUrl, '-f', files.historySchema, '--schema', 'supabase_migrations'],
    { label: 'Gerar backup do schema de histórico' }
  );
  runSupabase(
    [
      'db',
      'dump',
      '--db-url',
      sourceDbUrl,
      '-f',
      files.historyData,
      '--use-copy',
      '--data-only',
      '--schema',
      'supabase_migrations'
    ],
    { label: 'Gerar backup dos registros de migrations' }
  );

  return files;
}

function restoreBackup(targetDbUrl, files) {
  psql(
    targetDbUrl,
    ['--variable', 'ON_ERROR_STOP=1', '--command', 'DROP SCHEMA IF EXISTS supabase_migrations CASCADE;'],
    { label: 'Preparar histórico vazio no destino' }
  );

  psql(
    targetDbUrl,
    [
      '--single-transaction',
      '--variable',
      'ON_ERROR_STOP=1',
      '--file',
      files.roles,
      '--file',
      files.schema,
      '--command',
      'SET session_replication_role = replica',
      '--file',
      files.data,
      '--file',
      files.historySchema,
      '--file',
      files.historyData
    ],
    { label: 'Restaurar backup lógico na segunda pilha' }
  );
}

async function main() {
  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });
  run(PSQL, ['--version'], { label: 'Confirmar cliente PostgreSQL' });

  const restoreWorkdir = await mkdtemp(path.join(os.tmpdir(), 'radar-backup-restore-'));
  let targetStarted = false;
  const evidence = {
    generatedAt: new Date().toISOString(),
    scope: 'local-disposable-only',
    productionAccessed: false,
    sourceProject: 'radar-pdde',
    targetProject: RESTORE_PROJECT_ID,
    result: 'failure'
  };

  try {
    const sourceStatus = status();
    const sourceDbUrl = sourceStatus.DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
    const source = {
      schemaFingerprint: schemaFingerprint(sourceDbUrl),
      dataFingerprint: dataFingerprint(sourceDbUrl),
      authFingerprint: authFingerprint(sourceDbUrl),
      migrationFingerprint: migrationFingerprint(sourceDbUrl)
    };

    const files = await dumpSource(sourceDbUrl);
    evidence.dumps = await Promise.all(Object.values(files).map(fileEvidence));

    await prepareRestoreWorkdir(restoreWorkdir);
    runSupabase(['start'], {
      workdir: restoreWorkdir,
      label: 'Iniciar segunda pilha Supabase descartável'
    });
    targetStarted = true;

    const targetStatus = status(restoreWorkdir);
    const targetDbUrl =
      targetStatus.DB_URL ||
      `postgresql://postgres:postgres@127.0.0.1:${RESTORE_PORTS.db}/postgres`;
    restoreBackup(targetDbUrl, files);

    const target = {
      schemaFingerprint: schemaFingerprint(targetDbUrl),
      dataFingerprint: dataFingerprint(targetDbUrl),
      authFingerprint: authFingerprint(targetDbUrl),
      migrationFingerprint: migrationFingerprint(targetDbUrl)
    };

    evidence.source = source;
    evidence.target = target;
    evidence.comparisons = {
      schema: source.schemaFingerprint === target.schemaFingerprint,
      data: source.dataFingerprint.sha256 === target.dataFingerprint.sha256,
      auth: source.authFingerprint.sha256 === target.authFingerprint.sha256,
      migrations: source.migrationFingerprint === target.migrationFingerprint
    };

    if (!Object.values(evidence.comparisons).every(Boolean)) {
      throw new Error(`Restauração divergente: ${JSON.stringify(evidence.comparisons)}`);
    }

    evidence.result = 'success';
    await writeFile(path.join(OUTPUT_DIR, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
    process.stdout.write('Backup e restauração descartáveis comprovados com integridade equivalente.\n');
  } catch (error) {
    evidence.error = redact(error instanceof Error ? error.message : String(error));
    await writeFile(path.join(OUTPUT_DIR, 'evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
    throw error;
  } finally {
    if (targetStarted) {
      try {
        // supabase stop usa SUPABASE_WORKDIR para destruir somente a pilha restaurada.
        runSupabase(['stop', '--no-backup'], {
          workdir: restoreWorkdir,
          label: 'Encerrar segunda pilha Supabase descartável'
        });
      } catch (cleanupError) {
        process.stderr.write(`Falha de limpeza: ${redact(cleanupError.message)}\n`);
      }
    }
    if (process.env.RADAR_KEEP_DISPOSABLE_BACKUP_RESTORE !== 'true') {
      await rm(restoreWorkdir, { recursive: true, force: true });
    }
  }
}

await main();
