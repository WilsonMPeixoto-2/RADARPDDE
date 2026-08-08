# Prontuário Desktop Operacional — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o Prontuário integralmente utilizável no desktop, sem rolagem herdada, cortes horizontais ou controles semanticamente falsos, preservando perfis e fluxos existentes.

**Architecture:** `app.js` continuará responsável pela renderização e passará a redefinir a rolagem apenas na entrada de outra superfície ou escola. O layout será contido por classes específicas em `styles.css`; abas e competências terão um contrato ARIA único, compartilhado com a extensão de histórico cronológico. As regressões serão exercitadas pelo navegador real em 1440 × 900 e pelas suítes funcionais existentes.

**Tech Stack:** JavaScript legado no navegador, HTML dinâmico, CSS, Node.js 24.x, Playwright 1.62, Axe-core e testes `node:test`.

## Global Constraints

- Baseline: `e31505099279d06ca7ad8be7572387972bcf71a0`.
- Branch: `fix/prontuario-desktop-operacional-20260808`.
- Desktop é requisito de entrega; mobile recebe somente verificação de não regressão.
- Não alterar backend, persistência, Auth, RLS, migrations, perfis, nomes, paleta ou logotipo.
- Não publicar, enviar, abrir PR, integrar ou implantar sem autorização posterior.
- TDD: cada comportamento novo deve falhar pelo motivo esperado antes da implementação.

---

### Task 1: Regressão da entrada e do retorno contextual

**Files:**
- Create: `tests/e2e/school-details-desktop.spec.js`
- Modify: `app.js:5059-5087`

**Interfaces:**
- Consumes: `switchView(view, param)`, `main.content-area`, `RadarNavigationContext.returnToOrigin`.
- Produces: entrada em nova superfície com `scrollTop === 0`, sem alterar a restauração contextual.

- [x] **Step 1: escrever o teste RED da entrada no topo**

```js
test('abre o Prontuário no topo e restaura a Carteira no retorno', async ({ page }) => {
  const { link, scrollTop } = await openScrolledCarteiraSchool(page);
  expect(scrollTop).toBeGreaterThan(0);
  await link.click();
  await expect.poll(() => contentScrollTop(page)).toBe(0);
  await page.locator('[data-radar-contextual-back="true"]').click();
  await expect.poll(() => contentScrollTop(page)).toBeGreaterThanOrEqual(scrollTop - 2);
});
```

- [x] **Step 2: executar o teste e confirmar falha porque o Prontuário herda a rolagem**

Run: `npx playwright test tests/e2e/school-details-desktop.spec.js --project=desktop-chromium -g "abre o Prontuário no topo"`

Expected: FAIL com `scrollTop` do Prontuário maior que zero.

- [x] **Step 3: implementar a redefinição mínima de rolagem**

```js
function resetContentAreaScroll() {
    const contentArea = document.querySelector('main.content-area');
    if (!contentArea) return;
    if (typeof contentArea.scrollTo === 'function') {
        contentArea.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } else {
        contentArea.scrollTop = 0;
    }
}
```

Capturar `previousView` e `previousSchoolId` no início de `switchView`; chamar o helper depois da renderização somente quando a view mudar ou outra escola for aberta.

- [x] **Step 4: executar a regressão e as rotas canônicas**

Run: `npx playwright test tests/e2e/school-details-desktop.spec.js tests/e2e/canonical-routes.spec.js --project=desktop-chromium`

Expected: PASS, incluindo restauração de competência, rolagem e foco.

### Task 2: Contenção e ações do layout desktop

**Files:**
- Modify: `app.js:9252-9392`
- Modify: `styles.css:1079-1165`
- Test: `tests/e2e/school-details-desktop.spec.js`

**Interfaces:**
- Consumes: `.page-header`, `.school-grid`, `.table-responsive`, matriz de perfil vigente.
- Produces: `.prontuario-actions`, `.school-workspace`, `.prontuario-tablist`, `.school-program-list`.

- [x] **Step 1: escrever testes RED para overflow, ações e programas**

```js
test('mantém conteúdo, ações e abas dentro da área desktop', async ({ page }) => {
  await openControllerSchool(page);
  const geometry = await page.evaluate(() => {
    const main = document.querySelector('main.content-area');
    return { clientWidth: main.clientWidth, scrollWidth: main.scrollWidth };
  });
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  await expect(page.locator('.prontuario-actions .btn')).toHaveCount(3);
  await expect(page.locator('.prontuario-tablist [role="tab"]')).toHaveCount(6);
});

test('expõe programas vinculados como informação estática', async ({ page }) => {
  await openControllerSchool(page);
  const list = page.locator('.school-program-list');
  await expect(list).toHaveAttribute('role', 'list');
  await expect(list.locator('button, a')).toHaveCount(0);
});
```

- [x] **Step 2: executar e confirmar falhas por overflow e ausência das novas fronteiras semânticas**

Run: `npx playwright test tests/e2e/school-details-desktop.spec.js --project=desktop-chromium -g "conteúdo|programas"`

Expected: FAIL por `scrollWidth > clientWidth` e seletores ainda inexistentes.

- [x] **Step 3: implementar o markup mínimo**

Usar grupo de ações somente quando houver ações autorizadas:

```html
<div class="prontuario-actions" role="group" aria-label="Ações da unidade escolar">
```

Usar coluna de trabalho e lista estática:

```html
<div class="school-workspace">
<ul class="school-program-list" role="list" aria-label="Programas vinculados">
  <li class="school-program-item">Nome do programa</li>
</ul>
```

- [x] **Step 4: implementar a contenção CSS**

```css
.school-grid { grid-template-columns: 280px minmax(0, 1fr); }
.school-workspace { min-width: 0; max-width: 100%; }
.prontuario-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 12px; }
.prontuario-tablist { flex-wrap: wrap; overflow-x: visible; gap: 8px 10px; }
```

Estilizar `.school-program-list` e `.school-program-item` como lista informativa, sem hover, cursor ou formato de botão.

- [x] **Step 5: executar os testes focados e inspecionar as três ações por automação de navegador**

Run: `npx playwright test tests/e2e/school-details-desktop.spec.js --project=desktop-chromium -g "conteúdo|programas|ações"`

Expected: PASS e nenhum elemento autorizado fora da largura da área principal.

### Task 3: Contrato acessível das abas

**Files:**
- Modify: `app.js:9380-9392, 9654-9687`
- Modify: `src/integration/school-timeline.js:174-225`
- Test: `tests/e2e/school-details-desktop.spec.js`
- Modify: `tests/e2e/school-timeline.spec.js`

**Interfaces:**
- Consumes: `activateProntuarioTab(tabId)` e extensão `installTimelineTab(schoolId)`.
- Produces: `handleSchoolTabKeydown(event)` e estado coerente de `role`, `aria-selected`, `tabindex`, `hidden` e `aria-labelledby`.

- [x] **Step 1: escrever testes RED de clique, teclado e histórico cronológico**

```js
test('sincroniza abas, painéis e teclado', async ({ page }) => {
  await openControllerSchool(page);
  const tabs = page.locator('.prontuario-tablist [role="tab"]');
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  const panelId = await tabs.nth(1).getAttribute('aria-controls');
  await expect(page.locator(`#${panelId}`)).not.toHaveAttribute('hidden', '');
});
```

No teste E2E da timeline, localizar o controle como aba e exigir seleção e painel exposto após a ativação.

- [x] **Step 2: executar e confirmar falhas por ausência do contrato ARIA**

Run: `npx playwright test tests/e2e/school-details-desktop.spec.js --project=desktop-chromium -g "abas"`

Expected: FAIL nos atributos e na navegação por teclado.

- [x] **Step 3: implementar a ativação única**

Em `activateProntuarioTab`, percorrer somente botões e painéis do Prontuário, atualizar classe, `aria-selected`, `tabIndex`, `hidden`, `role` e `aria-labelledby`; incluir `tab-historico` no conjunto permitido.

- [x] **Step 4: implementar teclado e extensão cronológica**

`handleSchoolTabKeydown` aceitará `ArrowLeft`, `ArrowRight`, `Home` e `End`, moverá foco e ativará a aba encontrada. `installTimelineTab` criará o sexto botão e painel com o mesmo contrato.

- [x] **Step 5: executar testes E2E focados e a suíte unitária completa**

Run: `npm run test:unit`

Run: `npx playwright test tests/e2e/school-details-desktop.spec.js tests/e2e/school-timeline.spec.js tests/e2e/canonical-routes.spec.js --project=desktop-chromium`

Expected: PASS para clique, teclado, rota profunda e timeline.

### Task 4: Competências realmente desabilitadas

**Files:**
- Modify: `app.js:9405-9434`
- Modify: `styles.css:1448-1477`
- Test: `tests/e2e/school-details-desktop.spec.js`

**Interfaces:**
- Consumes: `getCompMonthStatus`, `changeProntuarioCompetencia`.
- Produces: botões com `disabled`, `aria-disabled` e `aria-pressed` coerentes.

- [x] **Step 1: escrever teste RED para mês fora do escopo e seleção ativa**

```js
test('não oferece meses fora do escopo como ações', async ({ page }) => {
  await openSchoolWithOutOfScopeMonths(page);
  const disabledMonth = page.locator('.comp-sub-tab.disabled').first();
  await expect(disabledMonth).toBeDisabled();
  await expect(disabledMonth).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('.comp-sub-tab[aria-pressed="true"]')).toHaveCount(1);
});
```

- [x] **Step 2: executar e confirmar falha porque o botão atual continua habilitado**

Run: `npx playwright test tests/e2e/school-details-desktop.spec.js --project=desktop-chromium -g "meses fora do escopo"`

Expected: FAIL em `toBeDisabled()`.

- [x] **Step 3: implementar atributos e CSS mínimo**

Adicionar `type="button"`, `disabled`, `aria-disabled`, `aria-pressed` e `data-competence`. Trocar hover por `.comp-sub-tab:hover:not(:disabled)` e estado visual por `.comp-sub-tab:disabled`.

- [x] **Step 4: executar regressão mensal**

Run: `npx playwright test tests/e2e/school-details-desktop.spec.js tests/e2e/monthly-evaluation-journey.spec.js --project=desktop-chromium`

Expected: PASS para meses fora do escopo e operações mensais existentes.

### Task 5: Ações, perfis e verificação ampla

**Files:**
- Test: `tests/e2e/school-details-desktop.spec.js`
- Modify only if a regression proves necessary: files already listed in Tasks 1–4.

**Interfaces:**
- Consumes: modais existentes, perfis locais e suítes funcionais do Prontuário.
- Produces: evidência operacional desktop e limite explícito de mobile.

- [x] **Step 1: testar os três modais, a matriz de perfis e o recorte Axe do Prontuário**

No Controlador e na Assistente, exigir três ações visíveis; abrir Contato, Cobrança e Editar, confirmar diálogo/foco e fechar por `Escape`. Na SME e no Inventário, exigir ausência do grupo mutável e presença somente das abas autorizadas.

- [x] **Step 2: executar a suíte desktop relacionada**

Run: `npx playwright test tests/e2e/school-details-desktop.spec.js tests/e2e/canonical-routes.spec.js tests/e2e/functional-core.spec.js tests/e2e/monthly-evaluation-journey.spec.js tests/e2e/pendency-cycle.spec.js tests/e2e/school-timeline.spec.js tests/e2e/modal-accessibility.spec.js tests/e2e/accessibility-scans.spec.js tests/e2e/frontend-contract.spec.js --project=desktop-chromium`

Expected: todos os cenários desktop passam sem falha, erro de página ou violação séria/crítica nova.

- [x] **Step 3: executar estática, unidade e readiness**

Run: `npm run check`

Run: `npm run lint`

Run: `npm run test:unit`

Run: `npm run test:readiness`

Expected: saída com código zero; avisos preexistentes devem ser distinguidos de erros.

- [x] **Step 4: executar smoke mobile Chromium sem homologar o layout**

Run: `npx playwright test tests/e2e/mobile-smoke.spec.js tests/e2e/mobile-header-controls.spec.js --project=mobile-chromium`

Resultado: 7 cenários passaram. A faixa de abas e a organização das ações no celular permanecem fora do critério de conclusão desta frente; WebKit e homologação mobile integral foram deliberadamente adiados.

- [x] **Step 5: comparar visualmente antes e depois em 1440 × 900**

Capturar topo, abas e tabela do Prontuário no mesmo perfil, escola e viewport da auditoria inicial. Confirmar ausência de corte, ações visíveis, abas descobríveis, hierarquia preservada e nenhuma mudança de paleta ou logotipo.

Resultado: comparação repetida no navegador integrado com a mesma escola (`04.10.001`), perfil Controlador e viewport de 1440 × 900. No baseline `e3150509...`, o Prontuário abriu com `scrollTop ≈ 589`, `scrollWidth = 1348` e `clientWidth = 1010`, deixando o topo e parte das abas fora da área visível. Na implementação, abriu com `scrollTop = 0` e `scrollWidth = clientWidth = 1170`; as três ações e as seis abas ficaram visíveis, com quebra de linha coerente e sem mudança de paleta ou logotipo. Evidências: `00-prontuario-desktop-baseline.png` e `01-prontuario-desktop-top.png` no diretório local da auditoria visual.

- [x] **Step 6: revisar diff e estado da branch**

Run: `git diff --check`

Run: `git status --short`

Não executar `git commit`, `git push`, criação de PR, merge ou deployment sem autorização expressa.

Resultado: revisão final sem achados materiais no escopo desta entrega. A suíte `desktop-chromium` concluiu com 100 cenários aprovados e 33 ignorados pelas condições declaradas dos próprios testes. O gate `test:readiness` concluiu com 591 testes unitários e 7 testes de integração aprovados. `git diff --check` não encontrou erros; a branch permanece sem commit, push, PR ou deployment até a autorização posterior do usuário.
