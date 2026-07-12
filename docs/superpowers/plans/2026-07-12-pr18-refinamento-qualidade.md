# PR 18 — Refinamento de Qualidade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Concluir a PR 18 com correções de regressão, refinamento visual, acessibilidade e responsividade, sem alterar o conceito estético nem as regras aprovadas.

**Architecture:** A projeção de domínio continuará separada da interface, mas passará a expor todas as ações documentais ativas na fila global. Um helper pequeno e compartilhado controlará o ciclo de foco dos diálogos novos; um stylesheet carregado por último concentrará somente ajustes de acabamento e breakpoint, preservando os módulos visuais existentes.

**Tech Stack:** JavaScript UMD/CommonJS, DOM existente, CSS responsivo, `node:test`, Playwright 1.61, `localStorage` vigente.

## Global Constraints

- Branch: `feature/ciclo-a-pacote-operacional-retificacao`.
- Preservar integralmente a identidade roxa/lilás e a semântica cromática existente.
- Não alterar regras de bonificação, análise, pendências, retificação ou estrutura do Excel.
- Não ativar Supabase, autenticação real ou integração com Google Drive.
- Não alterar `INITIAL_DATA_VERSION`.
- Não redesenhar integralmente Dashboard, Carteira, Pendências ou Prontuário.
- TDD obrigatório para correções e novos comportamentos.
- Nenhum merge ou deploy em produção sem autorização expressa.

---

### Task 1: Restaurar a fila operacional completa

**Files:**
- Modify: `tests/operational-projection.test.js`
- Modify: `src/domain/operational-projection.js`
- Modify: `tests/e2e/cycle-b-dashboard.spec.js`

**Interfaces:**
- Preserves: `buildSchoolProjection(input).nextAction` como ação principal da escola.
- Changes: `buildOperationalProjection(input).actions` passa a conter uma ação por pendência ativa.

- [ ] **Step 1: escrever o teste RED de várias pendências na mesma escola**

Adicionar a `tests/operational-projection.test.js`:

```js
test('expõe todas as pendências ativas na fila global sem perder a ação principal da escola', () => {
  const model = Projection.buildOperationalProjection(baseInput());

  assert.equal(model.schools[0].nextAction.pendencyId, 'open-1');
  assert.deepEqual(
    model.actions.map(action => action.pendencyId).sort(),
    ['await-1', 'open-1']
  );
});
```

- [ ] **Step 2: confirmar RED**

Run: `node --test tests/operational-projection.test.js`

Expected: FAIL porque `model.actions` contém somente `open-1`.

- [ ] **Step 3: implementar a expansão global sem duplicar fallback escolar**

Em `buildOperationalProjection`, produzir ações documentais a partir de `school.activePendencies`; usar `school.nextAction` somente quando não houver pendência ativa. Enriquecer cada ação com `waitingDays`, R.A., designação, nome e Controlador, usando `getOperationalBaseDate()` e `differenceInDays()`.

- [ ] **Step 4: migrar o locator obsoleto do E2E**

Substituir o locator por ID cru em `cycle-b-dashboard.spec.js` por:

```js
const awaitingAction = queue.locator('.cycle-b-action-item').filter({
  hasText: 'Reanalisar Extrato Investimento'
});
await awaitingAction.getByRole('button', { name: 'Abrir pendência' }).click();
```

- [ ] **Step 5: confirmar GREEN**

Run:

```powershell
node --test tests/operational-projection.test.js
pnpm exec playwright test tests/e2e/cycle-b-dashboard.spec.js tests/e2e/pendency-cycle.spec.js --project=desktop-chromium
```

Expected: PASS.

- [ ] **Step 6: commit**

```bash
git add src/domain/operational-projection.js tests/operational-projection.test.js tests/e2e/cycle-b-dashboard.spec.js
git commit -m "fix: preservar todas as ações operacionais"
```

---

### Task 2: Completar acessibilidade dos fluxos novos

**Files:**
- Create: `src/integration/pr18-dialog-focus.js`
- Modify: `config.js`
- Modify: `src/integration/task-10-11-pendency-actions.js`
- Modify: `src/integration/task-12-13-retificacoes.js`
- Modify: `tests/e2e/task-10-11-pendencias.spec.js`
- Modify: `tests/e2e/task-12-13-retificacoes.spec.js`

**Interfaces:**
- Produces: `RadarDialogFocus.getFocusable(dialog)`, `focusInitial(dialog)`, `trapTab(dialog, event)`.

- [ ] **Step 1: escrever testes RED para ciclo e restauração de foco**

Nos testes existentes, abrir os diálogos, focar o último botão, pressionar `Tab` e exigir foco no primeiro controle; focar o primeiro controle, pressionar `Shift+Tab` e exigir foco no último botão. Após fechar, exigir retorno ao acionador. Após retificação bem-sucedida, exigir foco no botão recriado `Retificar consolidação` ou no título do histórico.

- [ ] **Step 2: confirmar RED**

Run:

```powershell
pnpm exec playwright test tests/e2e/task-10-11-pendencias.spec.js tests/e2e/task-12-13-retificacoes.spec.js --project=desktop-chromium
```

Expected: FAIL porque `Tab` escapa dos novos diálogos.

- [ ] **Step 3: criar helper compartilhado de foco**

Implementar módulo UMD com seletor:

```js
const FOCUSABLE_SELECTOR = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
].join(',');
```

`trapTab` deve envolver primeiro/último somente quando `event.key === 'Tab'`. `focusInitial` deve priorizar `[data-dialog-initial-focus]`.

- [ ] **Step 4: integrar sem duplicar o controle de abertura**

Carregar o helper antes dos módulos de Tasks 10–13. Acrescentar `aria-describedby`, marcar o primeiro campo lógico com `data-dialog-initial-focus` e chamar `trapTab` nos handlers existentes. Atualizar `role` e `aria-live` a cada anúncio. Após confirmação de retificação, focar destino lógico recriado.

- [ ] **Step 5: confirmar GREEN**

Run: comando do Step 2.

Expected: PASS.

- [ ] **Step 6: commit**

```bash
git add config.js src/integration/pr18-dialog-focus.js src/integration/task-10-11-pendency-actions.js src/integration/task-12-13-retificacoes.js tests/e2e/task-10-11-pendencias.spec.js tests/e2e/task-12-13-retificacoes.spec.js
git commit -m "fix: completar acessibilidade dos dialogos"
```

---

### Task 3: Refinar alertas, filtros e navegação por teclado

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `src/integration/cycle-b-carteira.js`
- Modify: `src/integration/mobile-navigation.js`
- Modify: `tests/e2e/task-10-alertas-competencias.spec.js`
- Modify: `tests/e2e/cycle-b-carteira.spec.js`
- Modify: `tests/e2e/mobile-smoke.spec.js`

**Interfaces:**
- Preserves: `handleAlertClick(source)` e filtros existentes.
- Adds: semântica de botão/teclado e restauração de foco por ID de filtro.

- [ ] **Step 1: escrever testes RED**

Cobrir:

```js
await expect(page.getByRole('button', { name: /alertas de ação/i })).toHaveAttribute('aria-expanded', 'false');
await page.locator('#filter-escola-pendencias').focus();
await page.locator('#filter-escola-pendencias').selectOption('aguardando');
await expect(page.locator('#filter-escola-pendencias')).toBeFocused();
```

No mobile, abrir o menu, focar `Carteira de Escolas`, pressionar `Enter` e verificar o título da Carteira.

- [ ] **Step 2: confirmar RED**

Run:

```powershell
pnpm exec playwright test tests/e2e/task-10-alertas-competencias.spec.js tests/e2e/cycle-b-carteira.spec.js tests/e2e/mobile-smoke.spec.js
```

- [ ] **Step 3: implementar semântica e foco**

Transformar o sino e itens de alerta em botões sem alterar o desenho; sincronizar `aria-expanded`. Tornar itens móveis acionáveis por `Enter`/`Space`. Antes de rerenderizar a Carteira, guardar o ID do filtro focado e restaurá-lo após a substituição.

- [ ] **Step 4: melhorar estado vazio da Carteira**

Adicionar `role="status"`, `aria-live="polite"` e botão `Limpar filtros` que chama a rotina canônica existente.

- [ ] **Step 5: confirmar GREEN e commit**

Run: comando do Step 2.

```bash
git add index.html app.js src/integration/cycle-b-carteira.js src/integration/mobile-navigation.js tests/e2e/task-10-alertas-competencias.spec.js tests/e2e/cycle-b-carteira.spec.js tests/e2e/mobile-smoke.spec.js
git commit -m "fix: tornar fluxos operacionais acessiveis"
```

---

### Task 4: Aplicar refinamento visual responsivo

**Files:**
- Create: `src/styles/pr18-quality-polish.css`
- Modify: `config.js`
- Modify: `src/styles/cycle-b-dashboard.css`
- Modify: `src/styles/cycle-b-carteira.css`
- Modify: `src/styles/task-10-11-pendency-actions.css`
- Modify: `src/styles/task-12-13-retificacoes.css`
- Modify: `src/styles/task-9-pendencias.css`
- Modify: `src/integration/cycle-b-carteira.js`
- Create: `tests/e2e/pr18-quality-polish.spec.js`

**Interfaces:**
- Adds no business API.
- Uses the existing palette and CSS variables only.

- [ ] **Step 1: escrever testes RED de layout**

Cobrir no novo spec:

- dois cartões por linha do Dashboard em viewport 900 × 900;
- Carteira e Pendências em cartões abaixo de 900 px;
- ausência de overflow global em 390 × 844 e 768 × 1024;
- modais de Tasks 10–13 contidos em `100dvh`, com rodapé de ações visível;
- alvos principais com altura mínima de 44 px;
- estado vazio da Carteira visível e recuperável.

- [ ] **Step 2: confirmar RED**

Run: `pnpm exec playwright test tests/e2e/pr18-quality-polish.spec.js --project=desktop-chromium`

- [ ] **Step 3: implementar acabamento sem novos conceitos**

Carregar `pr18-quality-polish.css` por último. Aplicar anel de foco com `var(--border-focus)`, padding/rodapé dos modais, títulos `h2`, checkboxes de 18–20 px, quebra de texto e pesos existentes. Ajustar Dashboard para 5/3/2/1 colunas e alinhar os breakpoints operacionais em 900 px.

- [ ] **Step 4: responder a mudança de viewport da Carteira**

Usar `matchMedia('(max-width: 900px)')` com listener controlado que rerenderiza somente quando a representação muda, sem duplicar listeners.

- [ ] **Step 5: confirmar GREEN e inspeção visual**

Run:

```powershell
pnpm exec playwright test tests/e2e/pr18-quality-polish.spec.js tests/e2e/cycle-b-dashboard.spec.js tests/e2e/cycle-b-carteira.spec.js tests/e2e/task-9-pendencias.spec.js --project=desktop-chromium
```

Capturar Dashboard, Carteira, Pendências e um modal em desktop e mobile; confirmar hierarquia, contraste, corte, sobreposição e consistência.

- [ ] **Step 6: commit**

```bash
git add config.js src/styles src/integration/cycle-b-carteira.js tests/e2e/pr18-quality-polish.spec.js
git commit -m "style: refinar qualidade visual da pr 18"
```

---

### Task 5: Ativar regressão visual no CI e concluir a verificação

**Files:**
- Modify: `.github/workflows/validate.yml`
- Modify: `docs/reference/STATUS_DOCUMENTOS.md` only if status text requires factual correction.

- [ ] **Step 1: atualizar CI**

Instalar browsers fixados pelo Playwright 1.61 e executar `npm run test:e2e` após os testes unitários, preservando o workflow móvel existente.

- [ ] **Step 2: executar verificação completa fresca**

```powershell
node --check app.js
Get-ChildItem src/domain,src/integration -Filter *.js | ForEach-Object { node --check $_.FullName }
node --test tests/*.test.js
pnpm run test:e2e
```

Expected: sintaxe válida, 0 falhas unitárias e 0 falhas E2E.

- [ ] **Step 3: auditar o diff**

Confirmar:

- nenhuma alteração no Excel;
- nenhuma nova dependência;
- nenhuma mudança em regras de bonificação/persistência;
- nenhuma redefinição de paleta ou estrutura de telas;
- nenhum uso de `Vencida` como estado;
- nenhum merge ou deploy.

- [ ] **Step 4: commit**

```bash
git add .github/workflows/validate.yml docs/reference/STATUS_DOCUMENTOS.md
git commit -m "ci: validar regressao completa da pr 18"
```

## Self-review

- O plano cobre as duas falhas reproduzidas na linha de base.
- Todos os achados P1 de visual, responsividade e foco possuem tarefa.
- Alertas, filtros, menu móvel e estados vazios possuem testes específicos.
- Não há placeholder, dependência nova ou redesign.
- O Prontuário recebe apenas o acabamento necessário aos controles já criados.

