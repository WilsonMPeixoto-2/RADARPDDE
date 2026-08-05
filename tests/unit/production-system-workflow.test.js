const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const workflowPath = path.join(root, '.github/workflows/production-system-smoke.yml');

function workflowSource() {
  return fs.readFileSync(workflowPath, 'utf8');
}

test('monitor de Production executa após main, a cada hora e manualmente', () => {
  const source = workflowSource();
  assert.match(source, /^name:\s*Monitoramento contínuo de Production$/mu);
  assert.match(source, /^\s{2}push:\s*$/mu);
  assert.match(source, /^\s{6}- main\s*$/mu);
  assert.match(source, /^\s{2}schedule:\s*$/mu);
  assert.match(source, /cron:\s*['"]23 \* \* \* \*['"]/u);
  assert.match(source, /^\s{2}workflow_dispatch:\s*$/mu);
});

test('monitor usa somente leitura de conteúdo e escrita de incidentes', () => {
  const source = workflowSource();
  assert.match(source, /^permissions:\s*$/mu);
  assert.match(source, /^\s{2}contents:\s*read\s*$/mu);
  assert.match(source, /^\s{2}issues:\s*write\s*$/mu);
  assert.doesNotMatch(source, /^\s{2}(?:actions|checks|deployments|pull-requests):\s*write\s*$/mu);
  assert.match(source, /^concurrency:\s*$/mu);
  assert.match(source, /cancel-in-progress:\s*false/u);
  assert.match(source, /timeout-minutes:\s*15/u);
});

test('monitor não instala dependências nem persiste credenciais do checkout', () => {
  const source = workflowSource();
  assert.match(source, /persist-credentials:\s*false/u);
  assert.match(source, /fetch-depth:\s*2/u);
  assert.doesNotMatch(source, /\bnpm\s+(?:ci|install)\b/u);
  assert.doesNotMatch(source, /\bnpx\b/u);
});

test('monitor valida sistema inteiro e preflight com ações fixadas por SHA', () => {
  const source = workflowSource();
  assert.match(source, /actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1/u);
  assert.match(source, /actions\/setup-node@820762786026740c76f36085b0efc47a31fe5020/u);
  assert.match(source, /node scripts\/check-production-system\.mjs/u);
  assert.match(source, /--base-url "\$\{RADAR_PRODUCTION_URL\}"/u);
  assert.match(source, /SMOKE_ARGS/u);
  assert.match(source, /--expected-commit/u);
  assert.match(source, /--allow-any-commit/u);
  assert.match(source, /--attempts "\$\{ATTEMPTS\}"/u);
  assert.match(source, /node scripts\/check-production-team-account-preflight\.mjs/u);
});

test('monitor exige SHA apenas quando o artefato web mudou e evita corrida com deployment automático', () => {
  const source = workflowSource();
  assert.match(source, /radar-build-manifest\.json/u);
  assert.match(source, /CURRENT_DEPLOYED_COMMIT/u);
  assert.match(source, /git diff --name-only "\$\{BEFORE_SHA\}" "\$\{GITHUB_SHA\}"/u);
  assert.match(source, /src\/types\/\*/u);
  assert.match(source, /index\.html\|app\.js\|config\.js\|styles\.css/u);
  assert.match(source, /assets\/templates\/\*\|src\/\*\|vendor\/\*/u);
  assert.match(source, /scripts\/build-vercel\.mjs/u);
  assert.match(source, /DEPLOYMENT_REQUIRED=true/u);
  assert.match(source, /EXPECTED_COMMIT=""/u);
  assert.match(source, /MONITORED_COMMIT="\$\{CURRENT_DEPLOYED_COMMIT\}"/u);
  assert.match(source, /EXPECTED_COMMIT="\$\{GITHUB_SHA\}"/u);
  assert.match(source, /MONITORED_COMMIT="\$\{GITHUB_SHA\}"/u);
  assert.match(source, /if \[ -n "\$\{EXPECTED_COMMIT\}" \]; then/u);
  assert.match(source, /SMOKE_ARGS\+=\(--expected-commit "\$\{EXPECTED_COMMIT\}"\)/u);
  assert.match(source, /SMOKE_ARGS\+=\(--allow-any-commit\)/u);
  assert.match(source, /--commit "\$\{MONITORED_COMMIT\}"/u);
  assert.doesNotMatch(source, /EXPECTED_COMMIT="\$\{CURRENT_DEPLOYED_COMMIT\}"/u);
});

test('monitor gerencia incidentes fora de pull requests sem mascarar o resultado principal', () => {
  const source = workflowSource();
  assert.match(source, /name:\s*Gerenciar incidente automático/u);
  assert.match(source, /if:\s*always\(\)\s*&&\s*github\.event_name\s*!=\s*'pull_request'/u);
  assert.match(source, /continue-on-error:\s*true/u);
  assert.match(source, /GITHUB_TOKEN:\s*\$\{\{ github\.token \}\}/u);
  assert.match(source, /node scripts\/manage-production-incident\.mjs/u);
  assert.match(source, /--core-status "\$\{CORE_STATUS\}"/u);
  assert.match(source, /--preflight-status "\$\{PREFLIGHT_STATUS\}"/u);
});

test('monitor aguarda propagação apenas quando o artefato web mudou e sempre publica resumo', () => {
  const source = workflowSource();
  assert.match(source, /GITHUB_EVENT_NAME.*push/u);
  assert.match(source, /ATTEMPTS=60/u);
  assert.match(source, /ATTEMPTS=1/u);
  assert.match(source, /if:\s*always\(\)/u);
  assert.match(source, /GITHUB_STEP_SUMMARY/u);
  assert.match(source, /Novo deployment exigido/u);
  assert.match(source, /Política de commit/u);
  assert.match(source, /Gestão automática do incidente/u);
});
