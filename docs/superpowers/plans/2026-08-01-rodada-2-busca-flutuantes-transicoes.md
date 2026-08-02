# Rodada 2 — Busca, Flutuantes e Transições Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar busca aproximada, posicionamento robusto de menus e transições progressivas à interface atual do RADAR PDDE, sem central de comandos e sem alterar dados ou regras de negócio.

**Architecture:** Novos módulos de integração serão carregados após `app.js` e envolverão os pontos globais existentes, preservando fallback. Fuse.js e Floating UI serão empacotados localmente em `vendor/` com esbuild; a navegação continuará usando os contratos canônicos já existentes.

**Tech Stack:** JavaScript IIFE/CommonJS compatível com navegador e Node, Fuse.js 7.5.0, @floating-ui/dom 1.8.0, esbuild 0.28.1, CSS, Node test runner e Playwright.

## Global Constraints

- Não criar `Ctrl + K`, paleta ou central de comandos.
- Não alterar migrations, RLS, Auth, Edge Functions, dados, Supabase Production ou Vercel Production.
- Não carregar bibliotecas por CDN em runtime.
- Respeitar todos os perfis e a visibilidade efetiva da navegação.
- View Transitions deve ser progressiva e desativada com `prefers-reduced-motion`.
- Menus devem fechar por `Escape` e clique externo, restaurando o foco quando apropriado.

---

### Task 1: Dependências e bundles locais

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/vendor/fuse-entry.js`
- Create: `src/vendor/floating-ui-entry.js`
- Create: `scripts/build-search-ui-vendors.mjs`
- Create: `vendor/fuse.js`
- Create: `vendor/floating-ui.js`
- Test: `tests/unit/search-ui-vendor-contract.test.js`

**Interfaces:**
- Produces: `window.Fuse` como construtor e `window.FloatingUIDOM` com `computePosition`, `offset`, `flip`, `shift`, `size` e `autoUpdate`.

- [ ] **Step 1: escrever teste contratual falhando**

Validar que `package.json` fixa `fuse.js` em `7.5.0`, `@floating-ui/dom` em `1.8.0`, expõe `build:search-ui-vendors` e que os entrypoints exportam os globais esperados.

- [ ] **Step 2: executar o teste e confirmar falha**

Run: `node --test tests/unit/search-ui-vendor-contract.test.js`
Expected: FAIL por dependências, script e arquivos ausentes.

- [ ] **Step 3: instalar e empacotar**

Adicionar as dependências, regenerar lockfile com npm 11 em Node 24 e criar bundles IIFE minificados com sourcemap desativado.

- [ ] **Step 4: executar o teste e confirmar aprovação**

Run: `node --test tests/unit/search-ui-vendor-contract.test.js && npm run build:search-ui-vendors`
Expected: PASS e bundles reproduzíveis.

- [ ] **Step 5: commit**

```bash
git add package.json package-lock.json src/vendor scripts/build-search-ui-vendors.mjs vendor tests/unit/search-ui-vendor-contract.test.js
git commit -m "build: integrar Fuse.js e Floating UI"
```

### Task 2: Motor e índice de busca inteligente

**Files:**
- Create: `src/domain/global-search-index.js`
- Test: `tests/unit/global-search-index.test.js`

**Interfaces:**
- Consumes: construtor `Fuse` recebido por parâmetro.
- Produces: `createSearchCatalog(context)`, `createSearchEngine(FuseCtor, items)` e `searchCatalog(engine, query, limit)`.

- [ ] **Step 1: escrever testes falhando**

Cobrir normalização de acentos, escola por erro de digitação, exclusão de módulo oculto, programas, competências e pendências vinculadas.

- [ ] **Step 2: executar e confirmar falha**

Run: `node --test tests/unit/global-search-index.test.js`
Expected: FAIL por módulo ausente.

- [ ] **Step 3: implementar catálogo puro**

O catálogo deve receber somente dados autorizados e itens de navegação visíveis. Cada item terá `id`, `type`, `title`, `subtitle`, `keywords`, `route` e `priority`.

- [ ] **Step 4: executar e confirmar aprovação**

Run: `node --test tests/unit/global-search-index.test.js`
Expected: PASS.

- [ ] **Step 5: commit**

```bash
git add src/domain/global-search-index.js tests/unit/global-search-index.test.js
git commit -m "feat: criar índice de busca global"
```

### Task 3: Combobox acessível e navegação por resultados

**Files:**
- Create: `src/integration/global-search.js`
- Create: `src/styles/global-search.css`
- Modify: `index.html`
- Test: `tests/unit/global-search-integration.test.js`
- Test: `tests/e2e/global-search.spec.js`

**Interfaces:**
- Consumes: `window.Fuse`, `window.RadarGlobalSearchIndex`, `window.switchView` e `window.RadarNavigationHistory`.
- Produces: `window.RadarGlobalSearch.install(root)` e substituição compatível de `handleGlobalSearch`.

- [ ] **Step 1: escrever testes falhando**

Cobrir criação de `role=combobox`, `aria-controls`, `aria-expanded`, navegação por setas, `Enter`, `Escape`, clique, mensagem sem resultados e ausência de atalho `Ctrl + K`.

- [ ] **Step 2: executar e confirmar falha**

Run: `node --test tests/unit/global-search-integration.test.js`
Expected: FAIL por integração ausente.

- [ ] **Step 3: implementar integração mínima**

Criar painel ancorado ao campo existente, reconstruir o índice quando dados/perfil mudarem e navegar apenas para destinos de consulta.

- [ ] **Step 4: validar unidade e E2E focal**

Run: `node --test tests/unit/global-search-integration.test.js && npx playwright test tests/e2e/global-search.spec.js --project=desktop-chromium`
Expected: PASS.

- [ ] **Step 5: commit**

```bash
git add index.html src/integration/global-search.js src/styles/global-search.css tests/unit/global-search-integration.test.js tests/e2e/global-search.spec.js
git commit -m "feat: integrar busca inteligente acessível"
```

### Task 4: Posicionamento dos elementos flutuantes

**Files:**
- Create: `src/integration/floating-ui-bootstrap.js`
- Create: `src/styles/floating-ui.css`
- Modify: `index.html`
- Test: `tests/unit/floating-ui-bootstrap.test.js`
- Test: `tests/e2e/floating-ui.spec.js`

**Interfaces:**
- Consumes: `window.FloatingUIDOM` e elementos de alertas, perfil e busca.
- Produces: `window.RadarFloatingUI.install(root)`, `openFloating(name)` e `closeFloating(name, options)`.

- [ ] **Step 1: escrever testes falhando**

Cobrir middleware configurado, limpeza de `autoUpdate`, exclusividade entre menus, `Escape`, clique externo, `aria-expanded` e restauração de foco.

- [ ] **Step 2: executar e confirmar falha**

Run: `node --test tests/unit/floating-ui-bootstrap.test.js`
Expected: FAIL por módulo ausente.

- [ ] **Step 3: implementar bootstrap**

Substituir de forma compatível `toggleAlertsDropdown` e `toggleProfileDropdown`, posicionando com estratégia fixa, `offset(8)`, `flip`, `shift({padding: 8})` e `size` limitado ao viewport.

- [ ] **Step 4: validar unidade e viewports**

Run: `node --test tests/unit/floating-ui-bootstrap.test.js && npx playwright test tests/e2e/floating-ui.spec.js --project=desktop-chromium --project=mobile-chromium --project=mobile-webkit`
Expected: PASS sem overflow horizontal.

- [ ] **Step 5: commit**

```bash
git add index.html src/integration/floating-ui-bootstrap.js src/styles/floating-ui.css tests/unit/floating-ui-bootstrap.test.js tests/e2e/floating-ui.spec.js
git commit -m "feat: estabilizar menus flutuantes"
```

### Task 5: Transições progressivas de navegação

**Files:**
- Create: `src/integration/view-transitions.js`
- Create: `src/styles/view-transitions.css`
- Modify: `index.html`
- Test: `tests/unit/view-transitions.test.js`
- Test: `tests/e2e/view-transitions.spec.js`

**Interfaces:**
- Produces: `shouldAnimateNavigation(root)`, `runViewTransition(root, update)` e `install(root)`.

- [ ] **Step 1: escrever testes falhando**

Cobrir suporte presente/ausente, redução de movimento, exceção síncrona, retorno assíncrono e garantia de atualização única.

- [ ] **Step 2: executar e confirmar falha**

Run: `node --test tests/unit/view-transitions.test.js`
Expected: FAIL por módulo ausente.

- [ ] **Step 3: implementar wrapper**

Envolver `switchView` e aplicação de rota sem alterar assinaturas. Usar o caminho original quando a API não existir ou houver preferência por redução de movimento.

- [ ] **Step 4: validar unidade e E2E**

Run: `node --test tests/unit/view-transitions.test.js && npx playwright test tests/e2e/view-transitions.spec.js --project=desktop-chromium`
Expected: PASS com e sem API simulada.

- [ ] **Step 5: commit**

```bash
git add index.html src/integration/view-transitions.js src/styles/view-transitions.css tests/unit/view-transitions.test.js tests/e2e/view-transitions.spec.js
git commit -m "feat: adicionar transições progressivas"
```

### Task 6: Auditoria, documentação e gates completos

**Files:**
- Modify: `package.json`
- Modify: `.github/workflows/dependency-health.yml`
- Create: `docs/audits/2026-08-01-rodada-2-busca-flutuantes-transicoes.md`
- Test: all relevant suites

**Interfaces:**
- Produces: build reproduzível dos vendors e evidência da Rodada 2.

- [ ] **Step 1: integrar build aos gates**

Adicionar `check:search-ui-vendors` e executar a checagem no readiness e na saúde das dependências.

- [ ] **Step 2: executar validação focal**

Run: `npm ci && npm run build:search-ui-vendors && npm run check && npm run lint && npm run test:unit && npm run audit:functional`
Expected: PASS.

- [ ] **Step 3: executar gates completos**

Executar readiness, integração, Playwright completo, cinco perfis e três viewports, Supabase local, backup/restauração, Excel SME e Lighthouse.

- [ ] **Step 4: revisar diff e documentação**

Confirmar ausência de central de comandos, alterações de banco, credenciais, CDN e deploy de Production.

- [ ] **Step 5: commit**

```bash
git add package.json .github/workflows/dependency-health.yml docs/audits/2026-08-01-rodada-2-busca-flutuantes-transicoes.md
git commit -m "docs: registrar evidências da rodada 2"
```
