const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflowPath = path.resolve(
  __dirname,
  '../../.github/workflows/production-data-integrity.yml'
);
const healthSqlPath = path.resolve(
  __dirname,
  '../../supabase/verification/production-integrity-health.sql'
);

function source() {
  return fs.readFileSync(workflowPath, 'utf8');
}

test('auditoria executa a cada seis horas e manualmente', () => {
  const workflow = source();
  assert.match(workflow, /^name:\s*Integridade contínua dos dados de Production$/mu);
  assert.match(workflow, /^\s{2}schedule:\s*$/mu);
  assert.match(workflow, /cron:\s*['"]41 \*\/6 \* \* \*['"]/u);
  assert.match(workflow, /^\s{2}workflow_dispatch:\s*$/mu);
});

test('pull request executa somente contratos locais sem receber secrets', () => {
  const workflow = source();
  assert.match(workflow, /^\s{2}pull_request:\s*$/mu);
  assert.match(workflow, /node --test tests\/unit\/production-data-integrity\.test\.js/u);
  assert.match(workflow, /node --check scripts\/check-production-data-integrity\.mjs/u);
  assert.match(workflow, /if:\s*github\.event_name\s*!=\s*'pull_request'/u);
});

test('consulta Production com os secrets administrativos já existentes e permissões mínimas', () => {
  const workflow = source();
  assert.match(workflow, /^permissions:\s*$/mu);
  assert.match(workflow, /^\s{2}contents:\s*read\s*$/mu);
  assert.doesNotMatch(workflow, /^\s{2}\w[\w-]*:\s*write\s*$/mu);
  assert.match(workflow, /SUPABASE_ACCESS_TOKEN:\s*\$\{\{ secrets\.SUPABASE_ACCESS_TOKEN \}\}/u);
  assert.match(workflow, /PGPASS_REMOTE:\s*\$\{\{ secrets\.SUPABASE_DB_PASSWORD \}\}/u);
  assert.match(workflow, /PROJECT_REF:\s*scnryinorqeucbfkioxo/u);
  assert.match(workflow, /supabase link --project-ref "\$\{PROJECT_REF\}" --password "\$\{PGPASS_REMOTE\}"/u);
  assert.match(workflow, /supabase db query --linked --file supabase\/verification\/production-integrity-health\.sql/u);
  assert.doesNotMatch(workflow, /RADAR_SUPABASE_SERVICE_ROLE_KEY/u);
});

test('workflow instala somente a árvore fixada, não persiste credenciais e sempre publica resumo', () => {
  const workflow = source();
  assert.match(workflow, /actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1/u);
  assert.match(workflow, /actions\/setup-node@820762786026740c76f36085b0efc47a31fe5020/u);
  assert.match(workflow, /persist-credentials:\s*false/u);
  assert.match(workflow, /\bnpm ci\b/u);
  assert.doesNotMatch(workflow, /\bnpm install\b/u);
  assert.match(workflow, /npx --no-install supabase/u);
  assert.match(workflow, /if:\s*always\(\)/u);
  assert.match(workflow, /GITHUB_STEP_SUMMARY/u);
});

test('SQL periódico falha em contrato inválido ou inconsistência sem alterar dados', () => {
  const sql = fs.readFileSync(healthSqlPath, 'utf8');
  assert.match(sql, /public\.production_integrity_check\(\)/iu);
  assert.match(sql, /v_schema_version\s*<>\s*1/iu);
  assert.match(sql, /v_status\s+is\s+distinct\s+from\s+'healthy'/iu);
  assert.match(sql, /v_total_issues\s*<>\s*0/iu);
  assert.match(sql, /raise exception 'PRODUCTION_INTEGRITY_FAILED/iu);
  assert.doesNotMatch(sql, /\b(?:insert|update|delete|truncate|alter|drop|create)\b/iu);
});
