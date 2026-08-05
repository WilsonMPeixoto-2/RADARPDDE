const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflowPath = path.resolve(
  __dirname,
  '../../.github/workflows/production-data-integrity.yml'
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

test('consulta Production com os secrets existentes e permissões mínimas', () => {
  const workflow = source();
  assert.match(workflow, /^permissions:\s*$/mu);
  assert.match(workflow, /^\s{2}contents:\s*read\s*$/mu);
  assert.doesNotMatch(workflow, /^\s{2}\w[\w-]*:\s*write\s*$/mu);
  assert.match(workflow, /RADAR_SUPABASE_URL:\s*\$\{\{ secrets\.RADAR_SUPABASE_URL \}\}/u);
  assert.match(workflow, /RADAR_SUPABASE_SERVICE_ROLE_KEY:\s*\$\{\{ secrets\.RADAR_SUPABASE_SERVICE_ROLE_KEY \}\}/u);
  assert.match(workflow, /node scripts\/check-production-data-integrity\.mjs/u);
});

test('workflow não instala dependências, fixa ações e sempre publica resumo', () => {
  const workflow = source();
  assert.match(workflow, /actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1/u);
  assert.match(workflow, /actions\/setup-node@820762786026740c76f36085b0efc47a31fe5020/u);
  assert.match(workflow, /persist-credentials:\s*false/u);
  assert.doesNotMatch(workflow, /\bnpm\s+(?:ci|install)\b/u);
  assert.doesNotMatch(workflow, /\bnpx\b/u);
  assert.match(workflow, /if:\s*always\(\)/u);
  assert.match(workflow, /GITHUB_STEP_SUMMARY/u);
});
