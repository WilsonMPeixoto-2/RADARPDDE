# Excel SME Mensal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gerar uma planilha Excel SME de uma única competência mensal, com layout semelhante ao modelo recebido, sem alterar o Excel institucional atual.

**Architecture:** Um módulo de domínio monta um modelo mensal puro a partir do estado do RADAR; um renderizador ExcelJS cria uma única aba estilizada; a integração existente adiciona e governa o botão. O build público copia o bundle de navegador do ExcelJS para `dist/vendor`.

**Tech Stack:** JavaScript UMD/CommonJS, ExcelJS 4.4.0, Node.js 24, Playwright, Vercel static build.

## Global Constraints

- O Excel institucional atual não pode ter seu modelo, renderer, nome, quatro abas ou botão alterados.
- O Excel SME exige competência no formato `AAAA-MM`; `TODAS` deve desabilitar o botão.
- O arquivo deve conter exatamente uma aba com o nome do mês em português.
- Campos sem origem no RADAR ficam em branco.
- Não incorporar o workbook original nem preservar fórmulas ou relações entre abas.
- Não adicionar dependência de CDN em produção.

---

### Task 1: Modelo mensal puro

**Files:**
- Create: `src/domain/excel-sme-export-model.js`
- Create: `tests/unit/excel-sme-export-model.test.js`

**Interfaces:**
- Consumes: `{ escolas, programas, verificacoes, activeCompetenciaKey }`.
- Produces: `buildSmeMonthlyModel(input)` com `{ competenceKey, sheetName, fileName, columns, rows }`.

- [ ] Escrever testes para `TODAS`, nome do arquivo e aba, ordenação, competência única, normalização e vazios.
- [ ] Executar o teste e confirmar falha.
- [ ] Implementar o modelo mínimo.
- [ ] Executar o teste e confirmar aprovação.
- [ ] Commit `feat: modelar Excel SME mensal`.

### Task 2: Renderizador ExcelJS

**Files:**
- Create: `src/domain/excel-sme-monthly-renderer.js`
- Create: `tests/unit/excel-sme-monthly-renderer.test.js`

**Interfaces:**
- Consumes: modelo mensal e `ExcelJS`.
- Produces: `renderWorkbook(model, options)` e `downloadWorkbook(model, options)`.

- [ ] Escrever teste de workbook com uma aba, cabeçalhos, valores, autofiltro, freeze e impressão.
- [ ] Executar o teste e confirmar falha.
- [ ] Implementar workbook A:Z com acabamento semelhante ao modelo SME.
- [ ] Executar o teste e confirmar aprovação.
- [ ] Commit `feat: renderizar Excel SME mensal`.

### Task 3: ExcelJS no carregamento e build

**Files:**
- Modify: `src/integration/load-excel-export.js`
- Modify: `scripts/build-vercel.mjs`
- Modify: `package.json`
- Create: `tests/unit/exceljs-public-build-contract.test.js`

**Interfaces:**
- Consumes: `node_modules/exceljs/dist/exceljs.min.js`.
- Produces: `window.ExcelJS` e `dist/vendor/exceljs.min.js`.

- [ ] Escrever teste de contrato para cópia e ordem de carregamento.
- [ ] Implementar cópia no build e fallback local no loader.
- [ ] Adicionar os módulos ao `node --check`.
- [ ] Executar teste e `npm run check`.
- [ ] Commit `build: disponibilizar ExcelJS para o Excel SME`.

### Task 4: Botão e integração

**Files:**
- Modify: `src/integration/excel-export-integration.js`
- Create: `tests/unit/excel-sme-export-integration.test.js`
- Modify: `tests/excel-export-integration.test.js`
- Modify: `tests/e2e/excel-export-action.spec.js`

**Interfaces:**
- Consumes: modelo mensal, renderer mensal e `activeCompetenciaKey`.
- Produces: botão `Excel SME` e `exportDataExcelSme()`.

- [ ] Escrever testes de estado desabilitado/habilitado, geração e regressão.
- [ ] Implementar controle reativo do botão e download assíncrono.
- [ ] Executar testes unitários e E2E específicos.
- [ ] Commit `feat: adicionar botão Excel SME mensal`.

### Task 5: Verificação e publicação

**Files:**
- Modify: `docs/architecture/excel-export.md`

- [ ] Documentar os três formatos.
- [ ] Executar `npm run test:unit`.
- [ ] Executar `npm run test:readiness`.
- [ ] Executar Playwright do botão e regressões.
- [ ] Abrir PR, acompanhar e corrigir checks.
- [ ] Integrar e publicar de forma controlada.
- [ ] Smoke test em produção e restauração de `deploymentEnabled: false`.
