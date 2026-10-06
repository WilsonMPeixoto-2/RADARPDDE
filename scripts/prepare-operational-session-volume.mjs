import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// Somente container local descartável. A fixture SQL exige tabelas operacionais
// vazias e desliga triggers durante o seed; reabilitá-los antes de COMMIT é
// obrigatório para que a jornada subsequente exercite Broadcast real.
const fixture = readFileSync(new URL('../supabase/fixtures/operational-production-shape.sql', import.meta.url), 'utf8');
const tables = ['verifications', 'registered_invoices', 'pendencies', 'pendency_attempts', 'pendency_contacts', 'assets'];
const sql = [
  "begin; set local radar.disposable_benchmark = 'on';",
  fixture,
  ...tables.map(table => `alter table public.${table} enable trigger ${table}_operational_invalidation;`),
  'commit;'
].join('\n');
const result = spawnSync('docker', ['exec', '-i', 'supabase_db_radar-pdde', 'psql',
  '-X', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'],
{ input: sql, encoding: 'utf8', stdio: ['pipe', 'inherit', 'inherit'] });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
