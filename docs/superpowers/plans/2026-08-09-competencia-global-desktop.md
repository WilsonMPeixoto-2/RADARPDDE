# Competência Global Desktop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o mês/exercício escolhido comandar, de forma única e persistente, todas as superfícies desktop, a navegação histórica e as exportações, sem seleções concorrentes ou nomes de arquivo temporalmente falsos.

**Architecture:** `RadarCompetenceContext` permanece como singleton e única autoridade. Controles locais continuam permitidos apenas como superfícies de comando para `select()`/`selectExercise()` e espelhos do snapshot. O assinante central atualiza os três globais legados e dispara uma única renderização. Navegações históricas selecionam a competência antes da rota; exportações SME são mensais e exportações institucionais declaram escopo consolidado.

**Tech Stack:** JavaScript legado no navegador, módulos IIFE, Node.js 24.x, `node:test`, Playwright 1.62, ExcelJS 4.4.0 e CSS existente.

## Global Constraints

- Baseline funcional: `85971e948e1b012df8af6f10fca663ba97f184f3`.
- Design aprovado: `docs/superpowers/specs/2026-08-08-estabilizacao-desktop-funcional-integral-design.md`.
- Desktop é requisito de entrega em 1440 × 900 e 1280 × 720; mobile recebe somente smoke compartilhado.
- `RadarCompetenceContext` é a única autoridade mensal.
- `activeCompetenciaKey`, `currentExercise` e `activeProntuarioCompetencia` são apenas espelhos escritos por `src/integration/global-competence-selector.js::applyState()`.
- Toda escrita mensal usa `select()`, `selectExercise()` ou `replaceConfiguration()`; renderizadores leem `getState()`.
- Uma alteração de mês emite um evento e provoca no máximo uma renderização funcional da superfície corrente.
- Mudar `closingKey` não muda uma seleção ainda válida.
- Uma ação histórica seleciona o mês do registro antes de navegar; o retorno contextual restaura competência antes de rolagem e foco.
- A exportação SME é mensal. A exportação institucional é consolidada e deve dizer “Todas as competências” no nome, conteúdo, metadados e auditoria.
- Não escrever em Production, não criar outro store, não alterar paleta, tipografia, logotipo ou linguagem visual.

---

### Task 1: Centralizar espelhos, configuração e exercício

**Files:**

- Modify: `src/domain/competence-context.js`
- Modify: `src/integration/global-competence-selector.js`
- Modify: `src/integration/exercise-management.js`
- Modify: `app.js`
- Modify: `tests/unit/competence-context.test.js`
- Modify: `tests/e2e/exercise-management.spec.js`

**Interfaces:**

- Consumes: `getState()`, `select(key, meta)`, `selectExercise(year, meta)`, `replaceConfiguration(next)`.
- Produces: `RadarGlobalCompetenceSelector.refreshContext({ source }): boolean`.
- Invariant: after every notification, `activeCompetenciaKey === state.activeKey`, `currentExercise === state.exercise` and `activeProntuarioCompetencia === state.activeKey`.

- [ ] **Step 1: preserve the current domain behavior with characterization tests**

Add tests that already pass and protect these invariants; they are characterization, not RED:

```js
test('replaceConfiguration preserva a competência ativa válida ao alterar o fechamento', () => {
  const context = loadApi().createCompetenceContext({
    competences: competences2026,
    currentExercise: '2026',
    closingCompetence: '2026-05',
    initialCompetence: '2026-08',
    storage: createMemoryStorage()
  });

  const next = context.replaceConfiguration({
    competences: competences2026,
    currentExercise: '2026',
    closingCompetence: '2026-09',
    source: 'calendar-saved'
  });

  assert.equal(next.activeKey, '2026-08');
  assert.equal(next.closingKey, '2026-09');
});
```

Also characterize the fallback to the new closing key when the active key no longer exists.

Run: `node --test --test-name-pattern="replaceConfiguration" tests/unit/competence-context.test.js`

Expected: PASS on the baseline. If it fails, stop and reconcile the discovered domain divergence before changing integration code.

- [ ] **Step 2: write the real RED test for saving the SME calendar**

```js
test('salvar o fechamento não troca uma competência ativa ainda válida', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('/');
  await page.waitForFunction(() => window.RadarCompetenceContext?.isInitialized?.());
  await page.locator('#global-competence-select').selectOption('2026-08');
  await page.evaluate(() => {
    switchProfile('sme');
    switchView('sme-config');
  });
  await page.locator('#cfg-comp-fechamento').selectOption('2026-07');
  await page.getByRole('button', { name: 'Salvar Parâmetros' }).click();

  await expect(page.locator('#global-competence-select')).toHaveValue('2026-08');
  expect(
    await page.evaluate(() => ({
      state: RadarCompetenceContext.getState(),
      activeCompetenciaKey,
      currentExercise,
      activeProntuarioCompetencia
    }))
  ).toMatchObject({
    state: { activeKey: '2026-08', exercise: '2026', closingKey: '2026-07' },
    activeCompetenciaKey: '2026-08',
    currentExercise: '2026',
    activeProntuarioCompetencia: '2026-08'
  });
});
```

Run: `npx playwright test tests/e2e/exercise-management.spec.js --project=desktop-chromium -g "salvar o fechamento não troca"`

Expected: FAIL because `salvarCalendarioSME()` assigns `activeCompetenciaKey = cFechamento` and the Prontuário mirror is not synchronized.

- [ ] **Step 3: implement the single-writer integration**

In `applyState()` write all compatibility mirrors from the snapshot:

```js
activeCompetenciaKey = state.activeKey;
currentExercise = state.exercise;
activeProntuarioCompetencia = state.activeKey;
```

Remove the direct calendar assignment. After the service confirms and rereads configuration, call:

```js
window.RadarGlobalCompetenceSelector.refreshContext({ source: 'calendar-saved' });
```

For state restore and exercise creation, call `refreshContext()` and then the relevant context command; do not write globals or the storage key manually.

- [ ] **Step 4: verify context/configuration and commit**

Run: `node --test tests/unit/competence-context.test.js`

Run: `npx playwright test tests/e2e/exercise-management.spec.js tests/e2e/global-competence-selector.spec.js --project=desktop-chromium`

Expected: PASS; active month remains August while closing month becomes July.

Commit: `fix(competence): centralize configuration and compatibility mirrors`

### Task 2: Bind the three dashboards to the canonical month

**Files:**

- Modify: `app.js`
- Modify: `src/integration/cycle-b-dashboard.js`
- Modify: `tests/e2e/cycle-b-dashboard.spec.js`
- Create: `tests/e2e/global-competence-dashboard.spec.js`

**Interfaces:**

- `changeSMEMonth(value): boolean` calls `RadarCompetenceContext.select(value, { source: 'sme-dashboard' })` only.
- Dashboard renders capture `const competenceKey = RadarCompetenceContext.getState().activeKey` once and reuse it in cards, lists, projections and actions.

- [ ] **Step 1: write the RED desktop journey**

```js
test('controle mensal SME comanda contexto, cabeçalho, cards e tabela', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.RadarCompetenceContext?.isInitialized?.());
  await page.evaluate(() => switchProfile('sme'));

  const local = page.locator('select[data-radar-sme-competence="true"]');
  await local.selectOption('2026-08');

  await expect(page.locator('#global-competence-select')).toHaveValue('2026-08');
  await expect(local).toHaveValue('2026-08');
  await expect(page.getByText(/Unidades Aptas \(Agosto 2026\)/)).toBeVisible();
  expect(
    await page.evaluate(() => ({
      contextKey: RadarCompetenceContext.getState().activeKey,
      mirror: activeCompetenciaKey
    }))
  ).toEqual({ contextKey: '2026-08', mirror: '2026-08' });
});
```

Run: `npx playwright test tests/e2e/global-competence-dashboard.spec.js --project=desktop-chromium`

Expected: FAIL because the SME selector changes only the legacy mirror.

- [ ] **Step 2: implement command-only local control and canonical reads**

```js
function changeSMEMonth(value) {
  try {
    window.RadarCompetenceContext.select(value, { source: 'sme-dashboard' });
    return true;
  } catch (_error) {
    return false;
  }
}
```

Do not call `renderDashboard()` in the handler. Update Cycle B test seeds to select through the context.

- [ ] **Step 3: verify and commit**

Run: `npx playwright test tests/e2e/global-competence-dashboard.spec.js tests/e2e/cycle-b-dashboard.spec.js --project=desktop-chromium`

Commit: `fix(competence): bind dashboards to canonical month`

### Task 3: Synchronize Carteira and Competências

**Files:**

- Modify: `app.js`
- Modify: `src/integration/cycle-b-carteira.js`
- Modify: `tests/e2e/cycle-b-carteira.spec.js`
- Modify: `tests/e2e/task-10-alertas-competencias.spec.js`
- Create: `tests/e2e/global-competence-carteira.spec.js`

**Interfaces:**

- `changeCarteiraCompetencia(value): boolean` and `changeCompetenciaView(value): boolean` call `select()` and never render directly.
- `renderEscolas()`, its filters/projection and `renderCompetencias()` consume one canonical key per render.

- [ ] **Step 1: write the RED cross-view test**

Select August in `#carteira-competencia-select`, assert the global selector/context are August, navigate to Competências and assert the heading is August and `#comp-select-view` does not exist.

Run: `npx playwright test tests/e2e/global-competence-carteira.spec.js --project=desktop-chromium`

Expected: FAIL because the Carteira control currently writes and renders locally.

- [ ] **Step 2: implement both legacy adapters as commands**

Use sources `carteira` and `competencias-view`. Remove direct assignments and direct calls to `updateGlobalCompetenceIndicator()`, `renderEscolas()` and `renderCompetencias()` from the handlers.

- [ ] **Step 3: verify and commit**

Run: `npx playwright test tests/e2e/global-competence-carteira.spec.js tests/e2e/cycle-b-carteira.spec.js tests/e2e/task-10-alertas-competencias.spec.js --project=desktop-chromium`

Commit: `fix(competence): synchronize portfolio and competence views`

### Task 4: Make Prontuário, monthly tabs and timeline consume the context

**Files:**

- Modify: `app.js`
- Modify: `src/integration/school-timeline.js`
- Modify: `src/integration/task-12-13-retificacoes.js`
- Modify: `tests/e2e/school-timeline.spec.js`
- Create: `tests/e2e/global-competence-prontuario.spec.js`

**Interfaces:**

- `changeProntuarioCompetencia(escolaId, compKey): boolean` only calls `select(compKey, { source: \`prontuario:${escolaId}\` })`.
- Prontuário renderers, monthly action context, timeline and retification use the same `getState().activeKey`.

- [ ] **Step 1: write the RED event/reload test**

Open a school in May, attach a `radar:competence-change` collector, click the August monthly button, and assert:

```js
expect(
  await page.evaluate(() => ({
    contextKey: RadarCompetenceContext.getState().activeKey,
    mirror: activeProntuarioCompetencia,
    events: window.__competenceEvents
  }))
).toEqual({
  contextKey: '2026-08',
  mirror: '2026-08',
  events: ['2026-08']
});
```

Then open the chronological history, assert “Agosto 2026”, reload and assert the global selector remains August on the same school route.

Run: `npx playwright test tests/e2e/global-competence-prontuario.spec.js --project=desktop-chromium`

Expected: FAIL because `changeProntuarioCompetencia()` changes only page-local state.

- [ ] **Step 2: remove the second authority**

Remove local initialization in `renderProntuario()`. Read the canonical key once. Replace timeline and retification fallbacks to `activeProntuarioCompetencia` with the context.

- [ ] **Step 3: verify and commit**

Run: `node --test tests/unit/school-timeline.test.js`

Run: `npx playwright test tests/e2e/global-competence-prontuario.spec.js tests/e2e/school-timeline.spec.js tests/e2e/school-details-desktop.spec.js --project=desktop-chromium`

Commit: `fix(competence): synchronize school record and timeline`

### Task 5: Make Pendências monthly by default and all-period only by explicit scope

**Files:**

- Modify: `src/integration/task-9-pendencias-page.js`
- Modify: `src/integration/cycle-b-carteira.js`
- Modify: `src/integration/task-9-cross-view.js`
- Modify: `src/styles/task-9-pendencias.css`
- Modify: `tests/e2e/task-9-cross-view.spec.js`
- Create: `tests/e2e/global-competence-pendencias-scope.spec.js`

**Interfaces:**

```js
changePendencyCompetenceScope('selected' | 'all'): boolean;
```

`RadarTask9PendencyPage.getState()` exposes `competenceScope` and `contextKey`. In `selected`, the view-model receives the canonical month; in `all`, it receives no competence filter. A global month change and “Limpar filtros” both return to `selected` without changing the global month.

- [ ] **Step 1: write the RED scope test**

Seed one May and one August pendency. Select August, open Pendências and require only August plus `#pendency-competence-scope = selected`. Select `all` and require both with the visible label “Escopo amplo: todas as competências”. Change the global month to May and require scope reset plus only May.

Run: `npx playwright test tests/e2e/global-competence-pendencias-scope.spec.js --project=desktop-chromium`

Expected: FAIL because the current default is a silent all-period queue.

- [ ] **Step 2: implement explicit temporal scope**

Replace the page-local competence dropdown with:

```html
<label for="pendency-competence-scope">Escopo de competência</label>
<select id="pendency-competence-scope" class="form-control">
  <option value="selected">Competência selecionada</option>
  <option value="all">Todas as competências</option>
</select>
<p id="pendency-scope-indicator" role="status" aria-live="polite"></p>
```

Cross-view actions select the record month before routing and keep only non-temporal filters.

- [ ] **Step 3: verify both desktop sizes and commit**

Run: `npx playwright test tests/e2e/global-competence-pendencias-scope.spec.js tests/e2e/task-9-cross-view.spec.js tests/e2e/task-9-pendencias.spec.js --project=desktop-chromium`

Expected: PASS at 1440 × 900 and 1280 × 720 with the scope indicator visible.

Commit: `fix(competence): make pendency month scope explicit`

### Task 6: Select historical competence before navigation and label alerts

**Files:**

- Modify: `src/integration/navigation-context.js`
- Modify: `tests/unit/navigation-context.test.js`
- Modify: `src/integration/task-10-alerts-competence.js`
- Modify: `src/integration/task-9-pendencias-page.js`
- Modify: `src/integration/task-9-cross-view.js`
- Modify: `src/integration/cycle-b-dashboard.js`
- Modify: `src/integration/cycle-b-carteira.js`
- Modify: `app.js`
- Modify: `tests/e2e/task-10-alertas-competencias.spec.js`
- Create: `tests/e2e/competence-aware-navigation.spec.js`

**Interfaces:**

```js
selectCompetenceForNavigation(root, competenceKey, { source }): boolean;
navigateWithCompetence(root, route, { competenceKey, source }): object | false;
```

The helper selects another exercise first when required, selects the month, then calls `RadarNavigationHistory.navigate()`.

- [ ] **Step 1: write the RED ordering unit test**

Record calls and assert exactly `select:2026-04:historical-alert` before `navigate:prontuario`.

Run: `node --test --test-name-pattern="navigateWithCompetence" tests/unit/navigation-context.test.js`

Expected: FAIL because the function does not exist.

- [ ] **Step 2: write the RED historical alert journey**

With August active, seed an April active pendency. Require visible text “Passivo histórico · Abril 2026”, click it, then assert the global selector/context become April before the April pendency is shown.

Run: `npx playwright test tests/e2e/competence-aware-navigation.spec.js --project=desktop-chromium`

Expected: FAIL because historical actions retain the active month or write `activeProntuarioCompetencia` directly.

- [ ] **Step 3: implement the shared navigation command**

Use it from alerts, passivo, Prontuário links and Dashboard/Carteira/cross-view actions. Preserve `returnToOrigin()` ordering: restore competence, navigate, after-render, restore viewport/focus.

- [ ] **Step 4: verify and commit**

Run: `node --test tests/unit/navigation-context.test.js`

Run: `npx playwright test tests/e2e/competence-aware-navigation.spec.js tests/e2e/task-10-alertas-competencias.spec.js tests/e2e/round-2-navigation-experience.spec.js tests/e2e/canonical-routes.spec.js --project=desktop-chromium`

Commit: `fix(navigation): select month before historical routes`

### Task 7: Bind SME Excel export to the canonical month

**Files:**

- Modify: `src/integration/excel-export-integration.js`
- Modify: `src/integration/excel-export-audit.js`
- Modify: `tests/unit/excel-sme-export-integration.test.js`
- Modify: `tests/unit/excel-export-audit.test.js`
- Modify: `tests/e2e/excel-export-button.spec.js`

**Interfaces:**

- Export `getBrowserState()` and read its `activeCompetenciaKey` from `RadarCompetenceContext.getState().activeKey`.
- `resolveSmeCompetence()` validates UI equality; it cannot use a local selector as fallback.
- Filename, worksheet, rows and audit all use the same canonical key.

- [ ] **Step 1: write RED unit tests for canonical precedence and missing context**

Set context to July and legacy mirror to May; require `getBrowserState().activeCompetenciaKey === '2026-07'`. With no canonical month and a local July select, require `{ ok: false, code: 'SME_INVALID_COMPETENCE' }`.

Run: `node --test --test-name-pattern="competência canônica|não usa seletor SME" tests/unit/excel-sme-export-integration.test.js`

Expected: FAIL because `getBrowserState` is not exported and the local control is currently accepted as fallback.

- [ ] **Step 2: implement canonical export state and audit**

Block the SME export if the context has no valid monthly key. Ensure the filename is `RADAR_PDDE_EXCEL_SME_07-2026.xlsx`, the sheet is `JULHO`, data is July and audit records `2026-07`.

- [ ] **Step 3: verify and commit**

Run: `node --test tests/unit/excel-sme-export-integration.test.js tests/unit/excel-export-audit.test.js`

Run: `npx playwright test tests/e2e/excel-export-button.spec.js --project=desktop-chromium -g "SME"`

Commit: `fix(exports): bind SME workbook to canonical month`

### Task 8: Declare all-period scope in institutional exports and close the slice

**Files:**

- Modify: `src/integration/excel-export-integration.js`
- Modify: `src/domain/excel-export-model.js`
- Modify: `src/integration/excel-export-audit.js`
- Modify: `app.js`
- Modify: `tests/excel-export-integration.test.js`
- Modify: `tests/excel-export-model.test.js`
- Modify: `tests/unit/excel-export-audit.test.js`
- Modify: `tests/e2e/excel-export-button.spec.js`

**Interfaces:**

```js
const INSTITUTIONAL_SCOPE = Object.freeze({
  kind: 'all-competences',
  label: 'Todas as competências',
  fileToken: 'TODAS_AS_COMPETENCIAS'
});
```

The XLSX filename is `RADAR_PDDE_BONIFICACOES_TODAS_AS_COMPETENCIAS.xlsx`; the legacy CSV uses the same token. Metadata and audit include the literal label.

- [ ] **Step 1: replace the incorrect monthly institutional test with RED coverage**

Seed consolidated rows in May and July while active month is May. Require both rows, filename `RADAR_PDDE_BONIFICACOES_TODAS_AS_COMPETENCIAS.xlsx` and metadata `competenceScope === 'Todas as competências'`.

Run: `node --test --test-name-pattern="todas as competências" tests/excel-export-integration.test.js tests/unit/excel-export-audit.test.js`

Expected: FAIL because the current filename and audit borrow the active month.

- [ ] **Step 2: implement the explicit institutional scope**

Use `INSTITUTIONAL_SCOPE` in file naming, `temporalScope`, workbook metadata and audit. Keep the content consolidated. Remove all `activeCompetenciaKey` use from institutional XLSX/CSV generation.

- [ ] **Step 3: run the slice gate**

Run: `npm run check`

Run: `node --test tests/unit/competence-context.test.js tests/unit/navigation-context.test.js tests/unit/school-timeline.test.js tests/unit/excel-sme-export-integration.test.js tests/unit/excel-export-audit.test.js tests/excel-export-integration.test.js tests/excel-export-model.test.js`

Run: `npx playwright test tests/e2e/global-competence-selector.spec.js tests/e2e/global-competence-dashboard.spec.js tests/e2e/global-competence-carteira.spec.js tests/e2e/global-competence-prontuario.spec.js tests/e2e/global-competence-pendencias-scope.spec.js tests/e2e/competence-aware-navigation.spec.js tests/e2e/task-10-alertas-competencias.spec.js tests/e2e/excel-export-button.spec.js --project=desktop-chromium`

Run: `npm run test:readiness`

- [ ] **Step 4: prove there are no operational writers outside the subscriber**

Run: `rg -n "activeCompetenciaKey\s*=|currentExercise\s*=|activeProntuarioCompetencia\s*=" app.js src -g "*.js"`

Expected: declarations may remain in `app.js`; runtime assignments exist only in `src/integration/global-competence-selector.js::applyState()`.

Run: `git diff --check`

Commit: `fix(exports): declare institutional all-competence scope`
