# Excel SME Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o fluxo Excel SME recuperável, determinístico e verificável do código-fonte ao workbook baixado em produção.

**Architecture:** O trabalho será dividido em contratos independentes: carregamento de recursos, bootstrap, competência, integridade modelo-template, build/manifesto, E2E semântico e smoke. Cada alteração de comportamento começará por teste que falha no branch atual, seguida da implementação mínima e da verificação de regressão.

**Tech Stack:** JavaScript CommonJS/IIFE, Node.js 24, node:test, Playwright 1.62, ExcelJS 4.4, Vercel Build Output API v3, GitHub Actions.

## Global Constraints

- Não alterar Supabase, banco, Auth, RLS, migrations ou dados de Production.
- Não trocar ExcelJS nem atualizar dependências gerais.
- Não alterar as regras de negócio do relatório institucional.
- O branch do PR nº 136 é o workspace isolado; `main` não será alterada diretamente.
- O template é modelo visual; o estado atual do sistema é fonte de verdade cadastral.
- Nenhuma competência mensal pode ser escolhida por fallback arbitrário.
- Todos os recursos críticos devem possuir timeout e permitir retry real após falha.

---

### Task 1: Reproduzir falhas do loader real

**Files:**
- Modify: `tests/unit/excel-sme-runtime-loader.test.js`
- Modify: `src/integration/excel-sme-runtime-loader.js`

**Interfaces:**
- Consumes: `createRuntimeLoader(environment)`.
- Produces: loader com `loadExcelSmeRuntime()`, `clearCache()` e erros tipados por fase.

- [ ] **Step 1: Escrever testes que falham**

Adicionar testes com documento DOM mínimo real para comprovar:

```javascript
await assert.rejects(loader.loadExcelSmeRuntime(), error => error.code === 'SME_EXCELJS_LOAD_FAILED');
assert.equal(document.querySelector('[data-radar-excel-runtime]'), null);
const runtime = await loader.loadExcelSmeRuntime();
assert.equal(runtime.ExcelJS, ExcelJS);
```

Adicionar cenários de timeout do script e do template, chamadas concorrentes e limpeza de `inFlight`.

- [ ] **Step 2: Executar RED**

Run: `npm run test:unit -- --test-name-pattern="ExcelJS|timeout|nova tentativa"`
Expected: falha porque o elemento fracassado permanece no DOM e não existem timeouts/códigos.

- [ ] **Step 3: Implementar máquina de estados e timeout**

Implementar estados `idle/loading/ready/failed`, remoção de elemento falho, limpeza de listeners, timer, `AbortController`, erros com `code` e retry real.

- [ ] **Step 4: Executar GREEN**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `fix: tornar loader Excel SME recuperável`.

---

### Task 2: Tornar bootstrap dos módulos recuperável

**Files:**
- Create: `tests/unit/load-excel-export.test.js`
- Modify: `src/integration/load-excel-export.js`
- Modify: `config.js`

**Interfaces:**
- Produces: `RadarExcelExportBootstrap.start()` e `reset()` com estados explícitos.

- [ ] **Step 1: Escrever testes que falham**

Cobrir elemento existente em `loading`, elemento `failed`, timeout, remoção e segunda tentativa bem-sucedida. Confirmar que o marcador global somente indica `ready` após todos os módulos.

- [ ] **Step 2: Executar RED**

Run: `node --test tests/unit/load-excel-export.test.js`
Expected: FAIL no comportamento atual que resolve pela mera existência do elemento.

- [ ] **Step 3: Implementar bootstrap controlado**

Exportar API CommonJS/IIFE, controlar estado por script, validar contratos globais após cada módulo, permitir reset/retry e substituir a injeção cega de `config.js` por chamada observável.

- [ ] **Step 4: Executar GREEN**

Run: `npm run test:unit && npm run check`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `fix: recuperar bootstrap da exportação Excel`.

---

### Task 3: Resolver competência sem efeitos colaterais

**Files:**
- Modify: `app.js`
- Modify: `src/integration/excel-export-integration.js`
- Modify: `tests/unit/excel-sme-export-integration.test.js`
- Modify: `tests/e2e/excel-export-button.spec.js`

**Interfaces:**
- Produces: `resolveSmeCompetence(state, documentRef)` retornando `{ ok, competenceKey, code, message }`.

- [ ] **Step 1: Escrever testes que falham**

Cobrir estado mensal válido, `TODAS` com seletor ativo, seletor ausente, oculto, duplicado, divergente e garantia de que `changeSMEMonth()` nunca é chamada por resolução/enhancement.

- [ ] **Step 2: Executar RED**

Run: `node --test tests/unit/excel-sme-export-integration.test.js`
Expected: FAIL por fallback para primeiro mês e efeitos colaterais.

- [ ] **Step 3: Implementar contrato puro**

Adicionar `data-radar-sme-competence` ao seletor SME, remover `normalizeSmeState`, bloquear ambiguidades e capturar snapshot imutável no clique.

- [ ] **Step 4: Executar GREEN**

Run: `npm run test:unit && npm run lint:e2e`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `fix: tornar competência SME determinística`.

---

### Task 4: Garantir integridade entre cadastro e template

**Files:**
- Modify: `src/domain/excel-sme-export-model.js`
- Modify: `src/domain/excel-sme-template-renderer.js`
- Modify: `tests/unit/excel-sme-export-model.test.js`
- Modify: `tests/unit/excel-sme-template-renderer.test.js`
- Modify: `scripts/generate-excel-certification-evidence.mjs`

**Interfaces:**
- Produces: validação de designações únicas e renderer que reescreve `A:D` pelo modelo atual.

- [ ] **Step 1: Escrever testes que falham**

Cobrir designação duplicada no estado, duplicada no template, denominação desatualizada e escola removida/adicionada.

- [ ] **Step 2: Executar RED**

Run: `node --test tests/unit/excel-sme-export-model.test.js tests/unit/excel-sme-template-renderer.test.js`
Expected: FAIL por sobrescrita silenciosa ou preservação de identificação antiga.

- [ ] **Step 3: Implementar validações e reconstrução determinística**

Bloquear chaves duplicadas, limpar área de dados controlada, copiar estilo-base e reescrever `A:D` e `E:AD` conforme modelo.

- [ ] **Step 4: Executar GREEN**

Run: `npm run test:unit && npm run certify:excel:fixture`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `fix: alinhar template Excel SME aos dados atuais`.

---

### Task 5: Gerar manifesto de assets por conteúdo

**Files:**
- Create: `scripts/generate-excel-sme-assets-manifest.mjs`
- Create: `tests/integration/excel-sme-assets-manifest.test.js`
- Modify: `scripts/build-vercel.mjs`
- Modify: `src/integration/excel-sme-runtime-loader.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `assets/generated/excel-sme-assets.json` com `path`, `sha256` e `bytes`.

- [ ] **Step 1: Escrever teste de integração que falha**

Validar que o manifesto reproduz hashes reais, é copiado para `.vercel/output/static` e que o loader usa a versão derivada do manifesto.

- [ ] **Step 2: Executar RED**

Run: `node --test tests/integration/excel-sme-assets-manifest.test.js`
Expected: FAIL porque o manifesto não existe.

- [ ] **Step 3: Implementar geração e consumo**

Gerar manifesto deterministicamente no build, validar ativos obrigatórios e remover a data manual como fonte de verdade.

- [ ] **Step 4: Executar GREEN**

Run: `npm run build:vercel && npm run test:integration && npm run check:generated`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `build: versionar assets do Excel SME por hash`.

---

### Task 6: Validar semanticamente o download real

**Files:**
- Modify: `tests/e2e/excel-export-button.spec.js`
- Modify: `playwright.config.js` somente se necessário para o servidor do artefato.
- Modify: `tests/support/spa-server.mjs` somente se necessário para servir `.vercel/output/static`.

**Interfaces:**
- Consumes: arquivo baixado pelo botão real.
- Produces: assertions semânticas via ExcelJS.

- [ ] **Step 1: Escrever assertions que falham no teste antigo**

Reabrir bytes, validar aba `JULHO`, 30 colunas, cabeçalhos, congelamento, autofiltro, competência no arquivo e dados de escolas.

- [ ] **Step 2: Adicionar cenários de recuperação**

Interceptar falha inicial do ExcelJS, `404` inicial do template, HTML 200 e requisição pendente; confirmar mensagem, reabilitação e retry sem refresh.

- [ ] **Step 3: Executar RED/GREEN conforme cada cenário**

Run: `npx playwright test tests/e2e/excel-export-button.spec.js --project=desktop-chromium`
Expected final: PASS.

- [ ] **Step 4: Commit**

Commit message: `test: validar Excel SME real e recuperação`.

---

### Task 7: Ampliar smoke de produção e observabilidade

**Files:**
- Modify: `.github/workflows/excel-sme-production-smoke.yml`
- Create or modify: `scripts/smoke-excel-sme-production.mjs`
- Modify: `src/integration/excel-sme-runtime-loader.js`
- Modify: `src/integration/excel-export-integration.js`
- Modify: `scripts/check-workflow-references.mjs` se o contrato exigir.

**Interfaces:**
- Produces: códigos de erro estáveis e smoke estático + navegador associado ao SHA implantado.

- [ ] **Step 1: Escrever/verificar contratos de workflow**

Garantir gatilhos para todo o pipeline SME e validação de hash, MIME, tamanho, OOXML, ExcelJS e workbook baixado.

- [ ] **Step 2: Implementar códigos e mensagens por fase**

Usar códigos `SME_EXCELJS_LOAD_FAILED`, `SME_EXCELJS_LOAD_TIMEOUT`, `SME_TEMPLATE_HTTP_FAILED`, `SME_TEMPLATE_TIMEOUT`, `SME_INVALID_COMPETENCE`, `SME_COMPETENCE_MISMATCH`, `SME_TEMPLATE_PARSE_FAILED`, `SME_DUPLICATE_DESIGNATION`, `SME_SERIALIZATION_FAILED` e `SME_DOWNLOAD_FAILED`.

- [ ] **Step 3: Verificar**

Run: `npm run check:workflow-references && npm run test:readiness`
Expected: PASS.

- [ ] **Step 4: Commit**

Commit message: `ci: certificar fluxo Excel SME em produção`.

---

### Task 8: Verificação final e fechamento do branch

**Files:**
- Modify: PR nº 136 description.

- [ ] **Step 1: Executar matriz final**

Run: `npm run check`, `npm run lint`, `npm run test:unit`, `npm run test:integration`, `npm run certify:excel:fixture`, `npm run build:vercel`, `npm run test:e2e`, `npm run check:generated`, `npm run check:workflow-references`.

- [ ] **Step 2: Confirmar GitHub Actions**

Todos os checks aplicáveis devem concluir com sucesso. Divergências de artefatos gerados devem ser reproduzidas e corrigidas, nunca ignoradas.

- [ ] **Step 3: Atualizar PR**

Documentar causas, mudanças, testes, riscos residuais e instrução de homologação no Excel desktop.

- [ ] **Step 4: Marcar como pronto para revisão**

Somente após todos os checks automáticos verdes. Não realizar merge sem decisão explícita do usuário.
