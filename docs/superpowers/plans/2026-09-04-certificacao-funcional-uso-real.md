# Certificação Funcional por Uso Real — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** provar que as operações funcionais relevantes do RADAR PDDE executam corretamente pela interface usada por uma pessoa, persistem no Supabase, sobrevivem a reload e mantêm telas/subopções relacionadas sincronizadas, corrigindo cada defeito real encontrado antes do encerramento.

**Architecture:** reaproveitar a matriz funcional já existente como inventário canônico de operações e acrescentar uma camada separada de certificação por uso real. A certificação não substitui unitários/CI, mas exige para mutações funcionais uma evidência de interface → persistência → reload → relação entre superfícies. Os testes do PR #260 que acionam serviços diretamente continuam como regressão de serviço, enquanto novos testes Playwright autenticados usam os controles reais da UI e fazem leitura direta do repositório Supabase apenas para comprovar o resultado.

**Tech Stack:** Node.js 24, Playwright 1.62.1, Supabase CLI 2.114.0, Supabase JS 2.112.4, JavaScript CommonJS/ESM, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-04-certificacao-funcional-uso-real-design.md`

## Global Constraints

- Baseline inicial: `main` em `8fc58926565a72465980143f253f0a2fee4b8fc2`.
- Não reabrir por padrão dívidas de permissão/hardening sem defeito funcional real.
- Não declarar operação validada apenas por unitário, lint, CI ou chamada direta de serviço.
- Mutações funcionais devem provar, quando aplicável: ação na UI → persistência → leitura direta → reload → nova leitura/renderização → sincronização de superfícies derivadas.
- Clique repetido deve ser provado para ações de gravação suscetíveis a duplo gesto.
- Cada defeito encontrado deve ter reprodução RED antes da correção do código de produção.
- Regras posteriores ao plano histórico prevalecem; PR #260 e decisões supervenientes não podem sofrer regressão.
- Não alterar layout aprovado sem defeito funcional ou de interação reproduzido.

---

### Task 1: Fechar o inventário de operações que exigem certificação real

**Files:**
- Create: `scripts/check-real-use-functional-certification.mjs`
- Create: `tests/unit/real-use-functional-certification.test.js`
- Create: `docs/reference/real-use-functional-certification.json`
- Create/generated: `docs/reference/REAL_USE_FUNCTIONAL_CERTIFICATION.md`
- Modify: `package.json`
- Read as source: `docs/reference/functional-contract-matrix.json`
- Read as source: `docs/reference/functional-contract-matrix/*.json`
- Read as source: `scripts/audit-functional-persistence.js`

**Interfaces:**
- Consumes: `loadMatrix()` from `scripts/check-functional-contract-matrix.mjs`.
- Produces: closed set of user-facing mutating operations keyed by existing operation ID.
- Inclusion rule: operation mode is `write`, `edge-function` or `export`, and at least one allowed profile has `kind: "functional"`.
- Technical-only operations are excluded from this user-facing certification and remain protected by existing technical gates.

- [ ] **Step 1: Write the failing unit test for closed coverage**

Create `tests/unit/real-use-functional-certification.test.js` with a temporary certification manifest missing one required operation and assert that validation reports the exact missing ID.

```js
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

const moduleUrl = pathToFileURL(path.resolve(__dirname, '../../scripts/check-real-use-functional-certification.mjs')).href;

test('certificação exige uma linha para toda mutação funcional canônica', async () => {
  const { requiredOperationIds, validateCertification } = await import(moduleUrl);
  const matrix = {
    profiles: [{ id: 'controller', kind: 'functional' }],
    operations: [
      { id: 'INV-01', mode: 'write', allow: ['controller'] },
      { id: 'READ-01', mode: 'read', allow: ['controller'] }
    ]
  };
  assert.deepEqual(requiredOperationIds(matrix), ['INV-01']);
  assert.deepEqual(
    validateCertification(matrix, { schemaVersion: 1, operations: [] }),
    ['Operação funcional sem certificação: INV-01.']
  );
});
```

- [ ] **Step 2: Run RED**

Run:

```bash
node --test tests/unit/real-use-functional-certification.test.js
```

Expected: FAIL because `scripts/check-real-use-functional-certification.mjs` does not exist.

- [ ] **Step 3: Implement the validator with explicit real-use fields**

Create `scripts/check-real-use-functional-certification.mjs` with exports:

```js
export function requiredOperationIds(matrix) {
  const functionalProfiles = new Set(
    matrix.profiles.filter(profile => profile.kind === 'functional').map(profile => profile.id)
  );
  return matrix.operations
    .filter(operation => ['write', 'edge-function', 'export'].includes(operation.mode))
    .filter(operation => operation.allow.some(profile => functionalProfiles.has(profile)))
    .map(operation => operation.id)
    .sort();
}

export function validateCertification(matrix, certification) {
  const findings = [];
  const required = requiredOperationIds(matrix);
  const rows = new Map((certification.operations || []).map(row => [row.id, row]));
  for (const id of required) {
    if (!rows.has(id)) findings.push(`Operação funcional sem certificação: ${id}.`);
  }
  for (const row of certification.operations || []) {
    for (const field of [
      'area', 'userAction', 'initialState', 'expectedResult',
      'persistence', 'reload', 'relations', 'repeatGesture',
      'functionalProfiles', 'result', 'evidence'
    ]) {
      if (row[field] === undefined || row[field] === null) {
        findings.push(`${row.id}: campo de uso real ausente: ${field}.`);
      }
    }
  }
  return findings;
}
```

The executable entrypoint must load `loadMatrix()`, read `docs/reference/real-use-functional-certification.json`, fail nonzero on omissions, and generate `docs/reference/REAL_USE_FUNCTIONAL_CERTIFICATION.md` with counts `PASS / FAIL / CORRIGIDO / NÃO EXECUTADO`.

- [ ] **Step 4: Seed the certification manifest from the canonical matrix**

Each required operation receives an explicit row, initially `NÃO EXECUTADO`, never `PASS` by inheritance from older evidence. Example:

```json
{
  "id": "INV-01",
  "area": "Notas Fiscais",
  "userAction": "Cadastrar ou editar Nota Fiscal/despesa pela interface do Prontuário",
  "initialState": "Escola, competência e programa carregados",
  "expectedResult": "Registro fiscal salvo e efeitos derivados coerentes",
  "persistence": "direct-database-read-required",
  "reload": "required",
  "relations": ["Prontuário", "Capital e Inventário", "Consulta Assessoria quando aplicável"],
  "repeatGesture": "required",
  "functionalProfiles": ["controller", "federal_assistant"],
  "result": "NÃO EXECUTADO",
  "evidence": []
}
```

- [ ] **Step 5: Add scripts to package.json**

Add:

```json
"generate:real-use-certification": "node scripts/check-real-use-functional-certification.mjs --write",
"check:real-use-certification": "node scripts/check-real-use-functional-certification.mjs"
```

and include the new script in `check` via `node --check scripts/check-real-use-functional-certification.mjs`.

- [ ] **Step 6: Verify GREEN and generated artifact**

Run:

```bash
node --test tests/unit/real-use-functional-certification.test.js
npm run generate:real-use-certification
npm run check:real-use-certification
```

Expected: PASS and generated Markdown lists every required functional mutation explicitly.

- [ ] **Step 7: Cross-check against mutation audit**

Run:

```bash
npm run audit:functional:json > /tmp/radar-functional-audit.json
```

Compare application/service mutation entrypoints reported by `audit-functional-persistence.js` against the existing canonical matrix. Any real user action that mutates business state but has no matrix operation must be added first to `docs/reference/functional-contract-matrix/*.json`, regenerated with `npm run generate:functional-matrix`, then added to real-use certification. Do not mark it `PASS` during discovery.

- [ ] **Step 8: Commit**

```bash
git add scripts/check-real-use-functional-certification.mjs tests/unit/real-use-functional-certification.test.js docs/reference/real-use-functional-certification.json docs/reference/REAL_USE_FUNCTIONAL_CERTIFICATION.md docs/reference/functional-contract-matrix*.json docs/reference/functional-contract-matrix/ package.json
git commit -m "test: fechar matriz de certificacao funcional real"
```

---

### Task 2: Criar suporte Playwright para autenticação, leitura real e reload

**Files:**
- Create: `tests/support/real-use-supabase.js`
- Create: `tests/unit/real-use-supabase-support.test.js`
- Reuse: `supabase/fixtures/auth-users.json`
- Reuse: patterns from `tests/e2e/supabase-functional-reliability.spec.js`

**Interfaces:**
- Produces `signInAs(page, profileId)`, `waitForReady(page, profileId)`, `reloadAndWait(page, profileId)`, `loadEntity(page, entityName)`, `countEntity(page, entityName, predicateShape)`.
- Browser actions remain UI-driven; the helper may use `page.evaluate()` only for direct verification reads or deterministic fixture inspection, not to invoke business commands.

- [ ] **Step 1: Write RED for fixture resolution**

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { fixtureForProfile } = require('../support/real-use-supabase.js');

test('resolve fixture ativa por perfil funcional', () => {
  assert.equal(fixtureForProfile('controller').profileId, 'controller');
  assert.throws(() => fixtureForProfile('missing-profile'), /Fixture ativa ausente/);
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/unit/real-use-supabase-support.test.js
```

Expected: FAIL because helper is absent.

- [ ] **Step 3: Implement helper**

Core implementation:

```js
const fs = require('node:fs');
const path = require('node:path');
const fixtures = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'),
  'utf8'
));

function fixtureForProfile(profileId) {
  const fixture = fixtures.find(item => item.profileId === profileId && item.active);
  if (!fixture) throw new Error(`Fixture ativa ausente para ${profileId}.`);
  return fixture;
}

async function waitForReady(page, profileId) {
  await page.waitForFunction(expected => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === expected
    && Boolean(window.RadarApplicationServices?.data?.repository)
  ), profileId);
}

async function signInAs(page, profileId) {
  const fixture = fixtureForProfile(profileId);
  const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';
  await page.goto('/');
  await page.locator('#radar-auth-email').fill(fixture.email);
  await page.locator('#radar-auth-password').fill(password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await waitForReady(page, profileId);
}

async function reloadAndWait(page, profileId) {
  await page.reload();
  await waitForReady(page, profileId);
}

async function loadEntity(page, entityName) {
  return page.evaluate(async name => (
    window.RadarApplicationServices.data.repository.load(name)
  ), entityName);
}

module.exports = { fixtureForProfile, signInAs, waitForReady, reloadAndWait, loadEntity };
```

- [ ] **Step 4: Verify GREEN**

```bash
node --test tests/unit/real-use-supabase-support.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/support/real-use-supabase.js tests/unit/real-use-supabase-support.test.js
git commit -m "test: adicionar suporte de uso real com Supabase"
```

---

### Task 3: Certificar Notas Fiscais e Capital/Inventário pela interface real

**Files:**
- Create: `tests/e2e/real-use-invoice-inventory.spec.js`
- Reuse selectors/flows from: `tests/e2e/unidentified-expense.spec.js`, `tests/e2e/inventory-prontuario-link.spec.js`, `tests/e2e/functional-core.spec.js`
- Reuse direct-read assertions from: `tests/e2e/supabase-functional-reliability.spec.js`, `tests/e2e/supabase-invoice-lifecycle-reliability.spec.js`
- Modify only on confirmed RED: `app.js`, `src/application/invoice-service.js`, `src/application/inventory-service.js`, `src/data/supabase-repository.js`, related migration only if root cause is database-side.

**Interfaces:**
- User interaction must use buttons/forms/selects.
- Direct repository reads are allowed only after the click to prove persistence.

- [ ] **Step 1: Write RED UI journey for common invoice**

The test must authenticate as `controller`, navigate to a deterministic school/competence/program through the visible UI, click `Adicionar Nota`, fill `#nota-tipo`, `#nota-numero`, `#nota-desc`, `#nota-valor`, submit `#form-dados-nota`, then find the created invoice by unique number.

After create: read `registeredInvoices`, reload, re-open the same school context, and assert the invoice is still visible with same type/number/value.

Then use the invoice UI edit action, change description/value, submit, read database, reload, assert updated UI.

Then use the delete UI action, confirm dialog, read database, reload, assert disappearance.

- [ ] **Step 2: Write RED UI journey for permanent asset synchronization**

Create permanent invoice using the same modal through the UI and assert:

1. `registeredInvoices.linked_asset_id` exists;
2. corresponding `assets.invoice_number` equals invoice number;
3. Capital e Inventário shows the asset;
4. Prontuário `encampInventario` reflects the expected stage;
5. reload preserves all three.

Then attempt to use the UI to inventory before forwarding and assert the action is blocked or unavailable.

Forward through the visible Capital e Inventário control, verify DB + Prontuário after reload, then inventory through the visible control and verify final DB + UI after reload.

- [ ] **Step 3: Write RED for conversion flows via UI**

Cover at minimum:

- consumo → permanente;
- permanente → consumo;
- serviço → permanente or permanent → serviço if exposed by current edit UI.

Each transition must assert linked asset creation/removal and related Prontuário state after reload.

- [ ] **Step 4: Write RED for repeated gesture**

On a fresh invoice form, use two near-simultaneous submit gestures:

```js
const submit = page.locator('#form-dados-nota button[type="submit"]');
await Promise.allSettled([submit.click(), submit.click({ force: true })]);
```

Then assert direct DB count for the unique invoice number equals exactly `1`. Repeat for forwarding and inventory controls if the UI permits a second gesture before the first completes.

- [ ] **Step 5: Run RED against current branch**

With local Supabase prepared:

```bash
RADAR_E2E_SUPABASE_LOCAL=1 npx playwright test tests/e2e/real-use-invoice-inventory.spec.js --project=desktop-chromium --workers=1
```

Expected: any failure is evidence, not something to paper over. Record exact failing action and state transition.

- [ ] **Step 6: For each failure, trace root cause before touching production code**

Use the failing UI action → handler in `app.js` → application service → repository/RPC path. Add or keep the failing Playwright assertion as RED. Change only the layer where the incorrect state originates.

Examples of acceptable minimal fixes after proven root cause:

- handler omits a required linked update → fix handler/service call;
- service constructs incomplete derived effect → fix service effect plan;
- RPC commits only one of two linked states → fix/add migration with atomic RPC;
- reload adapter maps persisted value incorrectly → fix adapter/state bridge.

Do not substitute a service-level call for a broken UI path.

- [ ] **Step 7: Verify GREEN plus old regressions**

```bash
RADAR_E2E_SUPABASE_LOCAL=1 npx playwright test \
  tests/e2e/real-use-invoice-inventory.spec.js \
  tests/e2e/supabase-functional-reliability.spec.js \
  tests/e2e/supabase-invoice-lifecycle-reliability.spec.js \
  --project=desktop-chromium --workers=1
```

Expected: PASS.

- [ ] **Step 8: Commit the test and any proven minimal fixes**

```bash
git add tests/e2e/real-use-invoice-inventory.spec.js app.js src/application/invoice-service.js src/application/inventory-service.js src/data/supabase-repository.js supabase/migrations/
git commit -m "test: certificar notas e inventario por uso real"
```

---

### Task 4: Certificar Pendências, A identificar e Consulta Assessoria pela interface real

**Files:**
- Create: `tests/e2e/real-use-pendencies.spec.js`
- Reuse selectors/flows: `tests/e2e/unidentified-expense.spec.js`, `tests/e2e/pendency-cycle.spec.js`, `tests/e2e/pendency-reanalysis-auth.spec.js`, `tests/e2e/invoice-document-analysis.spec.js`
- Modify only on confirmed RED: `app.js`, `src/application/pendency-service.js`, `src/application/invoice-service.js`, `src/integration/service-advisory.js`, `src/data/supabase-repository.js`, related RPC migration.

**Interfaces:**
- Use `Registrar despesa a identificar`, `Registrar novo envio`, `Reanalisar` and advisory UI controls as rendered.
- Read DB tables `registeredInvoices`, `pendencies`, `pendencyAttempts`, `verifications` only for verification.

- [ ] **Step 1: Write UI RED for A identificar**

Create `a_identificar` from the Prontuário button, not from a service call. Assert atomic result in database:

- one invoice;
- type `a_identificar`;
- individual analysis `Incorreto`;
- exactly one active linked pendency;
- aggregate summary consistent;
- after reload, same invoice/pendency and visible `Visualizar pendência`.

- [ ] **Step 2: Write UI RED for identification/new submission**

From Pendências, click `Registrar novo envio`, fill identification fields, submit, assert:

- same invoice ID preserved;
- type/number/description updated;
- pendency becomes `Aguardando reanálise`;
- one new attempt only;
- reload preserves state.

- [ ] **Step 3: Write UI RED for reanalysis**

Click `Reanalisar` as the functional profile currently intended to perform it, choose `Correto`, submit, assert database + reload show resolved pendency and corresponding individual/aggregate analysis.

Then create an incorrect reanalysis branch and assert it remains/reopens according to the current product rule.

- [ ] **Step 4: Write UI RED for Consulta Assessoria**

Create a service invoice through normal NF UI, use the rendered Assessoria subline controls, set individual analysis, create linked pendency when incorrect, then new submission and reanalysis. Confirm two service invoices in the same context remain isolated by invoice ID.

- [ ] **Step 5: Write repeated-click REDs**

For `Registrar novo envio` and `Reanalisar`, issue repeated clicks and assert exactly one `pendency_attempt`/state transition is persisted.

- [ ] **Step 6: Run RED and fix root causes minimally**

```bash
RADAR_E2E_SUPABASE_LOCAL=1 npx playwright test tests/e2e/real-use-pendencies.spec.js --project=desktop-chromium --workers=1
```

Trace UI → handler → service → RPC for every failure. Keep each failing scenario as permanent regression.

- [ ] **Step 7: Verify GREEN plus current pendency regressions**

```bash
RADAR_E2E_SUPABASE_LOCAL=1 npx playwright test \
  tests/e2e/real-use-pendencies.spec.js \
  tests/e2e/unidentified-expense.spec.js \
  tests/e2e/pendency-cycle.spec.js \
  tests/e2e/pendency-reanalysis-auth.spec.js \
  tests/e2e/invoice-document-analysis.spec.js \
  --project=desktop-chromium --workers=1
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add tests/e2e/real-use-pendencies.spec.js app.js src/application/pendency-service.js src/application/invoice-service.js src/integration/service-advisory.js src/data/supabase-repository.js supabase/migrations/
git commit -m "test: certificar pendencias por uso real"
```

---

### Task 5: Certificar verificação mensal, consolidação e sincronização entre superfícies

**Files:**
- Create: `tests/e2e/real-use-verification.spec.js`
- Reuse UI selectors: `tests/e2e/monthly-evaluation-journey.spec.js`, `tests/e2e/functional-core.spec.js`
- Reuse DB expectations: `tests/e2e/supabase-verification-reliability.spec.js`
- Modify only on RED: `app.js`, `src/application/verification-service.js`, `src/domain/*evaluation*` if the root cause is domain evaluation, `src/data/supabase-repository.js` if persistence is wrong.

**Interfaces:**
- All document status/analyse changes come from rendered controls.
- Consolidation must be invoked by the visible UI control.

- [ ] **Step 1: Write RED for bonification and analysis controls**

Select a deterministic school/competence/program through UI. Change delivery status for each relevant document using the visible controls. After each meaningful write, read `verifications`, reload, and confirm the same rendered selection.

- [ ] **Step 2: Prove automatic suboptions**

For states that imply `Não se aplica` or derived summaries, assert both the immediate layout and persisted/reloaded result. Include at minimum Nota Fiscal, Consulta Assessoria, BB Ágil and Encaminhado para Inventariação according to the current rules.

- [ ] **Step 3: Prove consolidation cannot skip required state**

Attempt the visible consolidation action while required fields are incomplete. Assert no persisted `bonus_result` and a useful UI response. Then complete the required fields and consolidate through UI; assert DB + reload + evaluation summary.

- [ ] **Step 4: Prove cross-surface reflection**

After consolidation/pendency changes, navigate normally to Dashboard and Carteira and assert the school summary/status reflects the persisted result. Return to Prontuário and ensure context remains coherent.

- [ ] **Step 5: Repeated-click RED for consolidation**

Issue repeated activation of the consolidation control and prove one semantic commit/log result, not duplicate state transitions.

- [ ] **Step 6: Run RED and root-cause fixes**

```bash
RADAR_E2E_SUPABASE_LOCAL=1 npx playwright test tests/e2e/real-use-verification.spec.js --project=desktop-chromium --workers=1
```

- [ ] **Step 7: Verify GREEN plus current verification regressions**

```bash
RADAR_E2E_SUPABASE_LOCAL=1 npx playwright test \
  tests/e2e/real-use-verification.spec.js \
  tests/e2e/supabase-verification-reliability.spec.js \
  tests/e2e/monthly-evaluation-journey.spec.js \
  --project=desktop-chromium --workers=1
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add tests/e2e/real-use-verification.spec.js app.js src/application/verification-service.js src/domain/ src/data/supabase-repository.js supabase/migrations/
git commit -m "test: certificar verificacao mensal por uso real"
```

---

### Task 6: Certificar demais gravações operacionais e perfis funcionais

**Files:**
- Create: `tests/e2e/real-use-secondary-writes.spec.js`
- Create: `tests/e2e/real-use-profile-tasks.spec.js`
- Reuse: `tests/e2e/exercise-management.spec.js`, `tests/e2e/sme-access-governance.spec.js`, `tests/e2e/school-details-desktop.spec.js`, `tests/e2e/task-12-13-retificacoes.spec.js`, `tests/e2e/excel-export-button.spec.js`
- Modify only on RED in the exact handler/service responsible.

**Interfaces:**
- Cover every remaining row in `real-use-functional-certification.json` not exercised by Tasks 3–5.
- Profiles are exercised for actual tasks, not for permission expansion.

- [ ] **Step 1: Add school/institutional edit journey**

Edit a school field through its visible form, submit, read `schools`, reload, reopen school and assert the same value.

- [ ] **Step 2: Add pendency contact/register journey if not covered in Task 4**

Use visible contact/cobrança form, submit, verify one `pendency_contacts` record, reload and confirm timeline/drawer reflection. Repeat gesture must not duplicate the same accepted operation.

- [ ] **Step 3: Add retification journey**

Use the current retification UI, provide justification, verify persisted verification/log, reload and confirm presentation.

- [ ] **Step 4: Add exercise/configuration journeys actually used by SME/assistant**

Use the visible configuration UI to perform supported operational changes such as exercise creation or program configuration listed by the canonical matrix. Verify database and reload. Do not add new authorization restrictions.

- [ ] **Step 5: Add profile task journeys**

Authenticate separately as:

- `controller`: one complete Prontuário mutation;
- `federal_assistant`: one operational pendency/reanalysis task and any configuration task currently exposed;
- `inventory`: one Capital e Inventário task through its UI;
- `sme_management`: one current SME functional task that writes or exports according to the matrix.

The assertion is that the intended task works end to end for that profile. Do not fail a test merely because another profile can also perform it unless current product behavior requires exclusivity.

- [ ] **Step 6: Cover exports as user actions**

For export rows in the certification matrix, click the actual export button and assert a download is produced with nonzero content using Playwright `page.waitForEvent('download')`. Reuse existing content-level certification where available.

- [ ] **Step 7: Run and fix only reproduced failures**

```bash
RADAR_E2E_SUPABASE_LOCAL=1 npx playwright test \
  tests/e2e/real-use-secondary-writes.spec.js \
  tests/e2e/real-use-profile-tasks.spec.js \
  --project=desktop-chromium --workers=1
```

For each failure, create a RED assertion, trace root cause, apply minimal fix, rerun targeted plus adjacent regressions.

- [ ] **Step 8: Commit**

```bash
git add tests/e2e/real-use-secondary-writes.spec.js tests/e2e/real-use-profile-tasks.spec.js app.js src/ supabase/migrations/
git commit -m "test: certificar operacoes funcionais restantes"
```

---

### Task 7: Executar a certificação inicial completa e registrar os defeitos reais

**Files:**
- Create: `docs/evidence/2026-09-04-certificacao-funcional-uso-real-inicial.md`
- Modify: `docs/reference/real-use-functional-certification.json`
- Regenerate: `docs/reference/REAL_USE_FUNCTIONAL_CERTIFICATION.md`

**Interfaces:**
- A failure is a product finding until root cause proves otherwise.
- `PASS` requires actual evidence path and scenario name.

- [ ] **Step 1: Run all real-use suites against Supabase disposable**

```bash
RADAR_E2E_SUPABASE_LOCAL=1 npx playwright test \
  tests/e2e/real-use-invoice-inventory.spec.js \
  tests/e2e/real-use-pendencies.spec.js \
  tests/e2e/real-use-verification.spec.js \
  tests/e2e/real-use-secondary-writes.spec.js \
  tests/e2e/real-use-profile-tasks.spec.js \
  --project=desktop-chromium --workers=1
```

- [ ] **Step 2: Record every scenario result**

The evidence file must contain a table:

```md
| Operation ID | Scenario | UI action | DB read | Reload | Cross-surface | Repeat gesture | Result | Evidence |
|---|---|---|---|---|---|---|---|---|
```

No blanket PASS by file. Each canonical operation gets its own row.

- [ ] **Step 3: Update certification JSON only from executed evidence**

Allowed result transitions:

- `NÃO EXECUTADO` → `PASS` when all required checks pass;
- `NÃO EXECUTADO` → `FAIL` when any required check fails;
- `FAIL` → `CORRIGIDO` only after RED → fix → rerun passes.

- [ ] **Step 4: Regenerate and validate**

```bash
npm run generate:real-use-certification
npm run check:real-use-certification
```

- [ ] **Step 5: Commit evidence before additional defect fixes**

```bash
git add docs/evidence/2026-09-04-certificacao-funcional-uso-real-inicial.md docs/reference/real-use-functional-certification.json docs/reference/REAL_USE_FUNCTIONAL_CERTIFICATION.md
git commit -m "test: registrar certificacao funcional inicial"
```

---

### Task 8: Corrigir cada FAIL sem criar um novo ciclo de caça aleatória

**Files:**
- Modify: only the source/test files proven by the root-cause trace for each FAIL.
- Modify after each fix: `docs/reference/real-use-functional-certification.json`.
- Update evidence: `docs/evidence/2026-09-04-certificacao-funcional-uso-real-inicial.md`.

**Interfaces:**
- One failing behavior at a time.
- No unrelated refactor.
- Existing real-use Playwright scenario is the RED whenever it already reproduces the defect.

- [ ] **Step 1: Select the first FAIL by operational severity**

Order:

1. data loss / wrong persistence;
2. cross-screen desynchronization;
3. stage skipping / wrong derived state;
4. duplicate commit from repeated gesture;
5. UI action unusable despite correct lower-layer service;
6. remaining functional mismatch.

- [ ] **Step 2: Trace exact data flow**

Document in the evidence file:

`UI control → handler → service method → repository/RPC → persisted rows → reload adapter/render`

State the root cause in one sentence before editing code.

- [ ] **Step 3: Verify RED**

Run only the failing test/scenario and confirm it fails for the expected reason.

```bash
RADAR_E2E_SUPABASE_LOCAL=1 npx playwright test <real-use-spec> --project=desktop-chromium --workers=1 --grep "<scenario>"
```

- [ ] **Step 4: Implement the smallest root-cause fix**

No batching of unrelated FAILs in the same code change. If the same root cause provably explains multiple matrix rows, fix once and rerun all affected rows.

- [ ] **Step 5: Verify targeted GREEN and adjacent regression**

Run the real-use scenario plus the older service/unit/database regression nearest to that code path.

- [ ] **Step 6: Mark only the repaired row(s) `CORRIGIDO`**

Attach exact test name and commit SHA in `evidence`.

- [ ] **Step 7: Commit the individual fix**

Use a specific commit message, for example:

```bash
git commit -m "fix: sincronizar encaminhamento com prontuario"
```

- [ ] **Step 8: Repeat Steps 1–7 until zero FAIL remains**

Stop only when the generated certification reports `FAIL = 0` and `NÃO EXECUTADO = 0` for the required functional set.

---

### Task 9: Tornar a certificação real um gate permanente de PR

**Files:**
- Create: `.github/workflows/real-use-functional-certification.yml`
- Modify: `package.json`

**Interfaces:**
- Supabase disposable + authenticated fixtures.
- Desktop Chromium, single worker for mutation determinism.

- [ ] **Step 1: Add workflow**

Create a workflow based on `.github/workflows/functional-reliability-lifecycle.yml`, but execute all `real-use-*.spec.js` files after Supabase reset and auth bootstrap.

Core command:

```yaml
- name: Executar certificação funcional por uso real
  env:
    RADAR_E2E_SUPABASE_LOCAL: '1'
  run: >-
    npx playwright test
    tests/e2e/real-use-invoice-inventory.spec.js
    tests/e2e/real-use-pendencies.spec.js
    tests/e2e/real-use-verification.spec.js
    tests/e2e/real-use-secondary-writes.spec.js
    tests/e2e/real-use-profile-tasks.spec.js
    --project=desktop-chromium
    --workers=1
```

- [ ] **Step 2: Validate manifest before browser execution**

Add preceding command:

```yaml
- name: Validar cobertura fechada
  run: npm run check:real-use-certification
```

- [ ] **Step 3: Upload Playwright evidence on failure**

Preserve `playwright-report/` and `test-results/` for 7 days, matching existing reliability workflows.

- [ ] **Step 4: Validate workflow references**

```bash
npm run check:workflow-references
```

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/real-use-functional-certification.yml package.json
git commit -m "ci: adicionar gate de certificacao funcional real"
```

---

### Task 10: Fechamento, documentação canônica e PR

**Files:**
- Modify: `docs/CURRENT_STAGE.md`
- Create: `docs/handoff/2026-09-04-certificacao-funcional-uso-real.md`
- Modify: `docs/reference/real-use-functional-certification.json`
- Regenerate: `docs/reference/REAL_USE_FUNCTIONAL_CERTIFICATION.md`
- Update: `docs/evidence/2026-09-04-certificacao-funcional-uso-real-inicial.md`

**Interfaces:**
- Closing statement must be numeric and SHA-specific.

- [ ] **Step 1: Run the entire real-use certification from a clean Supabase reset**

```bash
npm run supabase:reset
RADAR_E2E_SUPABASE_LOCAL=1 npx playwright test \
  tests/e2e/real-use-invoice-inventory.spec.js \
  tests/e2e/real-use-pendencies.spec.js \
  tests/e2e/real-use-verification.spec.js \
  tests/e2e/real-use-secondary-writes.spec.js \
  tests/e2e/real-use-profile-tasks.spec.js \
  --project=desktop-chromium --workers=1
```

Expected: all scenarios PASS.

- [ ] **Step 2: Run adjacent safety gates**

```bash
npm run check:functional-matrix
npm run check:real-use-certification
npm run test:unit
npm run test:integration
npm run supabase:test:db
npm run lint
```

Expected: PASS. These are supporting gates, not substitutes for Task 10 Step 1.

- [ ] **Step 3: Update canonical docs**

`docs/CURRENT_STAGE.md` must state:

- certification baseline SHA;
- total required real-use operations;
- `PASS`, `CORRIGIDO`, `FAIL`, `NÃO EXECUTADO` counts;
- exact meaning of certification: UI + persistence + reload + relations where applicable;
- explicit note that lower-level green tests are supporting evidence only.

The handoff must list every defect found and fixed with its regression test.

- [ ] **Step 4: Verify generated docs are current**

```bash
npm run generate:functional-matrix
npm run generate:real-use-certification
npm run check:functional-matrix
npm run check:real-use-certification
```

- [ ] **Step 5: Commit closure**

```bash
git add docs/CURRENT_STAGE.md docs/handoff/2026-09-04-certificacao-funcional-uso-real.md docs/reference/ docs/evidence/
git commit -m "docs: fechar certificacao funcional por uso real"
```

- [ ] **Step 6: Open PR from `stabilization/functional-certification-real-use-2026-09-04` to `main`**

PR body must include numeric certification summary and distinguish:

- user-real functional certification;
- supporting lower-level gates;
- defects found/corrected;
- migrations, if any;
- deployment/smoke requirements.

- [ ] **Step 7: Merge only after the real-use workflow and adjacent required checks pass on the exact PR head SHA**

After merge, deploy Production and perform a non-destructive authenticated smoke of navigation/read plus the safest representative write only if the environment provides a designated reversible test record. Do not mutate arbitrary real school data merely to manufacture a Production green badge.

---

## Self-review

- Spec coverage: UI, persistence, reload, cross-surface synchronization, automatic suboptions, stage order, repeated clicks, profiles, remaining writes, documentation and numeric closure are all mapped to tasks.
- No operation inherits `PASS` from older tests; initial state is `NÃO EXECUTADO`.
- Existing PR #260 service-level reliability suites are preserved as adjacent regression, not discarded.
- Unknown defects are not guessed in advance. Task 8 defines the mandatory RED/root-cause loop only after Task 7 produces concrete failures, preventing speculative fixes.
- Technical permission hardening is not a success criterion for this front.
