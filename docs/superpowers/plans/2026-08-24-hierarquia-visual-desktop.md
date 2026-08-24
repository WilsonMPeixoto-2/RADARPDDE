# Hierarquia Visual Desktop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar competência, dossiê institucional e cobrança imediatamente legíveis no desktop, preservando integralmente os contratos funcionais do RADAR PDDE.

**Architecture:** Manter `RadarCompetenceContext` e `app.js` como autoridades existentes, acrescentando somente markup semântico e classes CSS opt-in. Os contratos visuais serão provados no navegador real por Playwright; o Auth permanece fora do patch e será medido em investigação separada.

**Tech Stack:** JavaScript ES2022, HTML e CSS legados, Node.js 24, Node Test Runner, Playwright 1.62 e axe-core.

**Spec:** `docs/superpowers/specs/2026-08-24-hierarquia-visual-desktop-design.md`

## Global Constraints

- Baseline obrigatório: `origin/main@4542bbfdba7b4a6073445c8f3ea6ceafbb660dba`.
- Implementação exclusiva para desktop; não alterar cartões, breakpoints ou testes mobile.
- Não alterar Auth nesta branch.
- Não criar outra fonte de `activeCompetenciaKey`; somente refletir `RadarCompetenceContext`.
- Não alterar regra de negócio, texto gerado, dados, permissões, RLS, schema, dependências ou lockfile.
- Usar TDD: teste observável falhando, implementação mínima, teste passando.
- Não gravar baseline visual definitivo antes da aprovação humana do Preview.
- Não fazer merge nem mutar Production.

---

### Task 1: Contrato visual desktop da competência

**Files:**
- Create: `tests/e2e/visual-hierarchy-desktop.spec.js`
- Modify: `src/styles/global-competence-selector.css`
- Modify: `app.js`
- Modify: `styles.css`

**Interfaces:**
- Consumes: `window.RadarCompetenceContext`, `#global-competence-select`, `#global-competence-label`.
- Produces: `[data-radar-competence-context]`, `.radar-context-block`, `.radar-context-label`, `.radar-context-value`.

- [ ] **Step 1: Write the failing dashboard test**

Criar o spec desktop com um helper que aguarde o contexto real e, no primeiro teste, afirmar o contrato observável:

```js
test('torna a competência o contexto dominante sem criar outro estado', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Contrato desktop.');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForFunction(() => window.RadarCompetenceContext?.isInitialized?.());
  await page.evaluate(() => {
    switchProfile('controlador');
    RadarCompetenceContext.select('2026-08', { source: 'visual-hierarchy-e2e' });
    switchView('dashboard');
  });

  const selector = page.locator('#global-competence-badge');
  const context = page.locator('[data-radar-competence-context]');
  await expect(selector).toContainText('Competência ativa');
  await expect(page.locator('#global-competence-select')).toHaveValue('2026-08');
  await expect(context).toContainText('Agosto 2026');
  expect(await selector.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const selectStyle = getComputedStyle(element.querySelector('select'));
    return rect.width >= 240 && rect.height >= 52 && parseFloat(selectStyle.fontSize) >= 15;
  })).toBe(true);
  expect(await page.evaluate(() => RadarCompetenceContext.getState().activeKey)).toBe('2026-08');
});
```

- [ ] **Step 2: Run the test to verify RED**

```bash
npx playwright test tests/e2e/visual-hierarchy-desktop.spec.js --project=desktop-chromium --grep "contexto dominante"
```

Expected: FAIL porque o rótulo ainda é `Competência`, o controle é menor que o contrato e o contexto de página ainda não existe.

- [ ] **Step 3: Implement the minimal context grammar**

- tornar o cabeçalho do seletor visualmente dominante apenas em desktop;
- mudar o rótulo visível para `Competência ativa`, preservando IDs, eventos e opções;
- adicionar o bloco contextual sem controle ao `Painel do Controlador`;
- definir as classes opt-in em `styles.css`, sem alterar seletores genéricos.

- [ ] **Step 4: Verify GREEN and the existing synchronization contract**

```bash
npx playwright test tests/e2e/visual-hierarchy-desktop.spec.js --project=desktop-chromium --grep "contexto dominante"
npx playwright test tests/e2e/global-competence-carteira.spec.js --project=desktop-chromium
```

Expected: PASS.

- [ ] **Step 5: Extend RED to Visão por Competência**

Adicionar ao mesmo spec:

```js
await page.evaluate(() => switchView('competencias'));
const competenceContext = page.locator('[data-radar-competence-context]');
await expect(competenceContext).toHaveCount(1);
await expect(competenceContext).toContainText('Agosto 2026');
await expect(page.getByRole('heading', {
  name: 'Lista de Entrega e Bonificação - Competência Agosto/2026'
})).toBeVisible();
```

Executar o teste e confirmar FAIL pela ausência do bloco nessa tela.

- [ ] **Step 6: Add the same read-only context and verify GREEN**

Usar as mesmas classes e o mesmo valor `competenceKey`; não criar seletor local nem listener.

```bash
npx playwright test tests/e2e/visual-hierarchy-desktop.spec.js tests/e2e/global-competence-carteira.spec.js --project=desktop-chromium
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app.js styles.css src/styles/global-competence-selector.css tests/e2e/visual-hierarchy-desktop.spec.js
git commit -m "feat: destacar contexto global de competência"
```

---

### Task 2: Dossiê institucional do Prontuário

**Files:**
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `tests/e2e/visual-hierarchy-desktop.spec.js`
- Modify: `tests/e2e/school-details-desktop.spec.js` somente se um contrato existente precisar ser generalizado sem perder cobertura.

**Interfaces:**
- Consumes: o mesmo objeto `esc`, `controladores`, `config` e os mesmos helpers de escape já usados por `renderProntuario()`.
- Produces: `.school-dossier`, `.radar-info-section`, `.radar-info-grid`, `.radar-info-field`, `.radar-info-label`, `.radar-info-value`.

- [ ] **Step 1: Write the failing semantic-layout test**

Abrir uma escola pelo fluxo real e exigir os grupos, os campos e a geometria desktop:

```js
const dossier = page.locator('.school-dossier');
await expect(dossier.getByRole('heading', { name: 'Identificação' })).toBeVisible();
await expect(dossier.getByRole('heading', { name: 'Gestão escolar' })).toBeVisible();
await expect(dossier.getByRole('heading', { name: 'Contatos' })).toBeVisible();
await expect(dossier.getByRole('heading', { name: 'Vinculação administrativa' })).toBeVisible();
await expect(dossier.getByRole('heading', { name: 'Programas vinculados' })).toBeVisible();
await expect(dossier.locator('dt')).toHaveCount(14);
await expect(dossier.locator('dd')).toHaveCount(14);

const geometry = await page.evaluate(() => {
  const dossierElement = document.querySelector('.school-dossier');
  const workspace = document.querySelector('.school-workspace');
  const grid = document.querySelector('.radar-info-grid');
  return {
    workspaceBelow: workspace.getBoundingClientRect().top >= dossierElement.getBoundingClientRect().bottom,
    dossierWidth: Math.round(dossierElement.getBoundingClientRect().width),
    mainWidth: Math.round(document.querySelector('main.content-area').getBoundingClientRect().width),
    columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length
  };
});
expect(geometry.workspaceBelow).toBe(true);
expect(geometry.dossierWidth).toBeGreaterThan(geometry.mainWidth * 0.9);
expect(geometry.columns).toBeGreaterThanOrEqual(2);
```

- [ ] **Step 2: Run the test to verify RED**

```bash
npx playwright test tests/e2e/visual-hierarchy-desktop.spec.js --project=desktop-chromium --grep "dossiê institucional"
```

Expected: FAIL porque o Prontuário atual usa uma lista plana na sidebar.

- [ ] **Step 3: Implement grouped semantic markup**

- manter os 13 campos atuais e seus valores;
- usar `section`, `h2`/`h3`, `dl`, `dt` e `dd` com nomes acessíveis;
- posicionar o dossiê e os programas acima do workspace;
- usar grades desktop fluidas sem breakpoint mobile novo;
- preservar `.school-program-list`, `.school-program-item`, ações e tablist.

- [ ] **Step 4: Verify GREEN and adjacent behavior**

```bash
npx playwright test tests/e2e/visual-hierarchy-desktop.spec.js tests/e2e/school-details-desktop.spec.js --project=desktop-chromium
```

Expected: PASS, inclusive teclado, perfis e axe-core.

- [ ] **Step 5: Commit**

```bash
git add app.js styles.css tests/e2e/visual-hierarchy-desktop.spec.js tests/e2e/school-details-desktop.spec.js
git commit -m "feat: organizar prontuário como dossiê institucional"
```

---

### Task 3: Workspace de cobrança legível

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `tests/e2e/visual-hierarchy-desktop.spec.js`
- Modify: `tests/e2e/modal-accessibility.spec.js` somente se necessário para reforçar o modal real de cobrança.

**Interfaces:**
- Consumes: `openCobrancaModal(escolaId)`, `buildCobrancaPreview(escolaId)`, `copyCobrancaText()` e `.chk-cobranca-item`.
- Produces: `.cobranca-workspace`, `.cobranca-selection-panel`, `.cobranca-preview-panel`, `.cobranca-option`.

- [ ] **Step 1: Write the failing modal-layout test**

Sem mockar o modal, criar pendências reais no estado de teste, abrir o Prontuário e clicar `Gerar Cobrança`. Verificar:

```js
const modal = page.locator('#modal-cobranca');
await expect(modal).toHaveClass(/show/);
await expect(modal.getByRole('button', { name: 'Fechar mensagem de cobrança' })).toBeVisible();
await expect(modal.locator('.cobranca-option')).not.toHaveCount(0);

const layout = await modal.evaluate(element => {
  const selection = element.querySelector('.cobranca-selection-panel').getBoundingClientRect();
  const preview = element.querySelector('.cobranca-preview-panel').getBoundingClientRect();
  const footer = element.querySelector('.modal-footer').getBoundingClientRect();
  return {
    sideBySide: preview.left > selection.right,
    footerBelow: footer.top >= Math.min(selection.bottom, preview.bottom) - 1,
    footerVisible: footer.bottom <= innerHeight
  };
});
expect(layout).toEqual({ sideBySide: true, footerBelow: true, footerVisible: true });
```

Registrar o texto inicial da prévia, desmarcar uma opção e afirmar que apenas a pendência correspondente deixa a mensagem, mantendo saudação e assinatura.

- [ ] **Step 2: Run the test to verify RED**

```bash
npx playwright test tests/e2e/visual-hierarchy-desktop.spec.js --project=desktop-chromium --grep "cobrança"
```

Expected: FAIL porque o modal atual é linear, usa estilos inline e não tem opção/painéis semânticos.

- [ ] **Step 3: Implement the two-panel workspace**

- mover o rodapé para fora de `.modal-body`;
- adicionar nome acessível ao botão `×`;
- substituir estilos inline por classes opt-in;
- renderizar cada item com título e detalhe visualmente separados;
- manter IDs, checkbox `value`, estado `checked`, `onchange` e funções existentes;
- preservar literalmente a composição da mensagem em `buildCobrancaPreview()`.

- [ ] **Step 4: Verify GREEN, focus and accessibility**

```bash
npx playwright test tests/e2e/visual-hierarchy-desktop.spec.js tests/e2e/modal-accessibility.spec.js tests/e2e/school-details-desktop.spec.js --project=desktop-chromium
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html app.js styles.css tests/e2e/visual-hierarchy-desktop.spec.js tests/e2e/modal-accessibility.spec.js
git commit -m "feat: separar seleção e prévia da cobrança"
```

---

### Task 4: Auditoria de equivalentes e regressão desktop

**Files:**
- Modify apenas arquivos já tocados se a auditoria encontrar ocorrência semanticamente idêntica.
- Modify: `tests/e2e/visual-hierarchy-desktop.spec.js` para o viewport adicional e axe-core.

**Interfaces:**
- Consumes: classes opt-in das Tasks 1–3.
- Produces: evidência de que nenhuma ocorrência equivalente desta frente ficou com linguagem divergente.

- [ ] **Step 1: Audit equivalent occurrences**

Pesquisar usos do seletor de competência, blocos `info-label`/`info-value`, títulos mensais e modal de cobrança. Classificar cada resultado:

- equivalente e dentro do escopo: reutilizar a nova classe;
- funcionalmente diferente: preservar;
- mobile: preservar sem alteração.

- [ ] **Step 2: Add viewport and accessibility checks first**

Rodar os mesmos fluxos em `1280 × 800` e adicionar axe-core para `#main-container` e `#modal-cobranca`, filtrando impactos `serious` e `critical`. Confirmar RED caso exista overflow, recorte ou violação introduzida pelo novo contrato.

- [ ] **Step 3: Make only evidence-driven fixes and verify**

```bash
npx playwright test tests/e2e/visual-hierarchy-desktop.spec.js --project=desktop-chromium
npx playwright test tests/e2e/global-competence-carteira.spec.js tests/e2e/school-details-desktop.spec.js tests/e2e/modal-accessibility.spec.js tests/e2e/cycle-b-carteira.spec.js --project=desktop-chromium
```

Expected: PASS; o cenário mobile existente não é alterado nem executado como gate desta frente.

- [ ] **Step 4: Commit if the audit produced code**

```bash
git add app.js index.html styles.css src/styles/global-competence-selector.css tests/e2e
git commit -m "test: homologar hierarquia visual no desktop"
```

---

### Task 5: Verificação ampla, Preview e revisão humana

**Files:**
- No source changes expected; temporary screenshots must stay outside Git.

**Interfaces:**
- Consumes: candidate branch and all existing gates.
- Produces: Preview isolado, screenshots desktop and PR ready for human review.

- [ ] **Step 1: Run the repository gates**

```bash
npm run test:readiness
npx playwright test --project=desktop-chromium
npm run build:vercel
```

Expected: exit code 0 for all commands.

- [ ] **Step 2: Review the diff and scope**

Confirmar por `git diff --check`, `git status`, `git diff --stat` e revisão linha a linha:

- nenhum arquivo mobile modificado;
- nenhum Auth modificado;
- nenhum lockfile/dependency modificado;
- nenhum schema/RLS/migration modificado;
- nenhum texto funcional de cobrança alterado;
- nenhum segundo estado de competência criado.

- [ ] **Step 3: Create an isolated Preview**

Seguir o contrato Vercel do repositório, garantindo ambiente de Preview e sem tocar Production. Aguardar deployment `READY` e associar o SHA exato da branch.

- [ ] **Step 4: Capture and inspect desktop evidence**

No Preview, capturar em `1440 × 900` e, quando necessário, página inteira:

1. Painel do Controlador com competência;
2. Visão por Competência;
3. topo do Prontuário e dossiê;
4. workspace/abas abaixo do dossiê;
5. modal de cobrança com seleção e prévia;
6. modal após desmarcar uma pendência.

Inspecionar as capturas com `view_image` e registrar um ledger com pelo menos: contexto, tipografia, agrupamento, espaçamento, container, ações, overflow e conteúdo preservado.

- [ ] **Step 5: Open the PR and stop before merge**

O PR deve registrar baseline, escopo desktop, testes, Preview, capturas, ausência de mudanças Auth/mobile e a investigação de desempenho como frente separada. Não criar baseline visual definitivo, não fazer merge e não alterar Production sem nova autorização explícita.
