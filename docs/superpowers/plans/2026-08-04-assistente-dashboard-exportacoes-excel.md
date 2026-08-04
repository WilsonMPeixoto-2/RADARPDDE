# Exportações Excel no Dashboard da Assistente Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir no dashboard inicial da Assistente de Verbas Federais os botões Relatório RADAR PDDE e Excel SME, reutilizando os pipelines atuais e respeitando a competência global.

**Architecture:** A integração existente de Excel reconhecerá a superfície da Assistente, criará um grupo próprio com dois botões e o removerá quando perfil ou tela deixarem de corresponder. Nenhuma lógica de geração será duplicada; os handlers chamarão `exportXlsx()` e `exportSmeXlsx()`.

**Tech Stack:** JavaScript UMD, DOM API, Node.js 24 test runner, Playwright, GitHub Actions.

## Global Constraints

- O grupo aparece somente no dashboard inicial do perfil `assistente`.
- O grupo contém exatamente dois botões Excel e nenhum botão CSV.
- O Excel SME usa `activeCompetenciaKey` e fica desabilitado quando a competência não é mensal.
- Não alterar Supabase, banco, Auth, RLS, migrations, dados ou os formatos dos relatórios.
- Não duplicar modelos, renderizadores ou loaders Excel.
- Não realizar merge automático.

---

### Task 1: Contratos unitários da superfície da Assistente

**Files:**
- Modify: `tests/unit/excel-sme-export-integration.test.js`
- Test: `tests/unit/excel-sme-export-integration.test.js`

**Interfaces:**
- Consumes: `ensureAssistantExportActions(options)`, `isAssistantDashboard(documentRef, profile)`, `removeAssistantExportActions(documentRef)`.
- Produces: contratos verificáveis para perfil, criação, não duplicação, remoção e estados dos botões.

- [ ] **Step 1: Criar DOM mínimo de teste**

Adicionar uma fábrica que represente `#main-container .page-header`, título do dashboard, ação de redistribuição, criação de elementos e busca por atributos `data-*`.

- [ ] **Step 2: Escrever testes inicialmente vermelhos**

Cobrir:

```js
test('reconhece somente o dashboard da Assistente', () => {});
test('cria exatamente os dois botões Excel no dashboard da Assistente', () => {});
test('não duplica o grupo em novas observações do DOM', () => {});
test('remove o grupo quando o perfil deixa de ser assistente', () => {});
test('desabilita somente o Excel SME quando a competência é TODAS', () => {});
```

- [ ] **Step 3: Executar o teste e confirmar RED**

Run:

```bash
node --test tests/unit/excel-sme-export-integration.test.js
```

Expected: FAIL porque as novas funções e o grupo ainda não existem.

- [ ] **Step 4: Commit dos testes vermelhos**

```bash
git add tests/unit/excel-sme-export-integration.test.js
git commit -m "test: definir botões Excel no dashboard da Assistente"
```

---

### Task 2: Grupo reutilizável de exportação

**Files:**
- Modify: `src/integration/excel-export-integration.js`
- Test: `tests/unit/excel-sme-export-integration.test.js`

**Interfaces:**
- Produces:
  - `resolveEffectiveProfile(options = {}) -> string`;
  - `isAssistantDashboard(documentRef, profile) -> boolean`;
  - `createAssistantInstitutionalButton(documentRef) -> HTMLButtonElement`;
  - `ensureAssistantExportActions(options = {}) -> HTMLElement | null`;
  - `removeAssistantExportActions(documentRef) -> boolean`.

- [ ] **Step 1: Implementar resolução de perfil**

Prioridade:

1. `options.profile`;
2. `root.getRadarAccessProfile()`;
3. `root.currentProfile`;
4. string vazia.

Normalizar aliases conhecidos por `RadarAccessPolicy.normalizeProfile()` quando disponível e, como fallback, converter `federal_assistant` e rótulos equivalentes para `assistente`.

- [ ] **Step 2: Implementar reconhecimento da superfície**

Exigir perfil `assistente`, `#main-container .page-header` e título exato `Painel do Assistente de Verbas Federais`.

- [ ] **Step 3: Criar botão institucional**

O botão deve usar `btn btn-primary`, rótulo `Relatório RADAR PDDE`, `data-radar-assistant-export="institutional"` e chamar `exportXlsx()` com proteção contra clique duplicado.

- [ ] **Step 4: Reutilizar o botão Excel SME**

Criar o segundo botão por `createSmeButton(institutionalButton)`, ajustar `data-radar-assistant-export="sme"` e manter `updateSmeButtonState()` ligado à competência global.

- [ ] **Step 5: Criar e manter o grupo**

Inserir uma única estrutura:

```html
<div
  data-radar-assistant-export-actions="true"
  role="group"
  aria-label="Exportações em Excel"
></div>
```

Aplicar `display:flex`, `gap:8px`, `flex-wrap:wrap` e alinhamento ao final. Não criar CSV.

- [ ] **Step 6: Integrar ao ciclo existente**

No final de `enhanceExportButtons()`, chamar `ensureAssistantExportActions()`. Quando a superfície não corresponder, remover um grupo antigo.

- [ ] **Step 7: Exportar as novas funções públicas**

Adicionar as funções ao objeto congelado retornado pelo módulo para permitir testes diretos.

- [ ] **Step 8: Executar testes e confirmar GREEN**

Run:

```bash
node --test tests/unit/excel-sme-export-integration.test.js
npm run test:unit
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/integration/excel-export-integration.js tests/unit/excel-sme-export-integration.test.js
git commit -m "feat: adicionar exportações Excel ao dashboard da Assistente"
```

---

### Task 3: Validação E2E e regressão

**Files:**
- Modify: `tests/e2e/excel-export-button.spec.js`
- Modify if needed: workflow that runs the Excel SME homologation

**Interfaces:**
- Consumes: interface renderizada do perfil Assistente.
- Produces: evidência de presença, ausência de CSV, estados de competência e não regressão dos demais perfis.

- [ ] **Step 1: Escrever cenário E2E da Assistente**

Confirmar no dashboard inicial:

```js
await expect(page.locator('[data-radar-assistant-export-actions="true"]')).toHaveCount(1);
await expect(page.locator('[data-radar-assistant-export="institutional"]')).toBeVisible();
await expect(page.locator('[data-radar-assistant-export="sme"]')).toBeVisible();
await expect(page.locator('[data-radar-assistant-export-actions] [data-radar-export-format="csv"]')).toHaveCount(0);
```

- [ ] **Step 2: Testar competência inválida e mensal**

Em `TODAS`, exigir SME desabilitado. Após selecionar um mês, exigir SME habilitado e `data-radar-competence-key` coerente.

- [ ] **Step 3: Confirmar ausência nos demais perfis**

Alternar para Controlador, SME e Inventário e exigir ausência do grupo.

- [ ] **Step 4: Executar E2E específico**

Run:

```bash
npx playwright test tests/e2e/excel-export-button.spec.js
```

Expected: PASS em desktop e projetos móveis aplicáveis.

- [ ] **Step 5: Executar gates finais**

Run:

```bash
npm run check
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:readiness
```

Expected: todos os gates aplicáveis aprovados.

- [ ] **Step 6: Atualizar descrição do PR e manter rascunho**

Registrar a nova superfície, os testes e o SHA final. Não fazer merge.
