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

### Task 1: Remover a implementação complexa provisória

**Files:**
- Delete: `src/assets/templates/cre-04-controle-onedrive-2026.chunk00.b64`
- Delete: `src/assets/templates/cre-04-controle-onedrive-2026.part01.b64`
- Delete: `src/assets/templates/cre-04-controle-onedrive-2026.part02.b64`
- Delete: `src/assets/templates/cre-04-controle-onedrive-2026.part03.b64`
- Delete: `src/assets/templates/cre-04-controle-onedrive-2026.part04.b64`
- Delete: `src/assets/templates/cre-04-controle-onedrive-2026.part05.b64`
- Delete: `src/assets/templates/cre-04-controle-onedrive-2026.part06.b64`
- Delete: `src/assets/templates/cre-04-controle-onedrive-2026.part07.b64`
- Delete: `src/domain/excel-sme-zip.js`
- Delete: `src/domain/excel-sme-template-renderer.js`
- Delete: `tests/unit/excel-sme-template-renderer.test.js`

**Interfaces:**
- Consumes: nenhum.
- Produces: branch sem assets Base64 nem edição de ZIP do modelo original.

- [ ] **Step 1:** excluir os arquivos provisórios listados.
- [ ] **Step 2:** comparar a branch com `main` e confirmar que os arquivos removidos não aparecem no diff final.
- [ ] **Step 3:** commit `refactor: remover template SME complexo`.

### Task 2: Criar o modelo mensal puro

**Files:**
- Modify: `src/domain/excel-sme-export-model.js`
- Modify: `tests/unit/excel-sme-export-model.test.js`

**Interfaces:**
- Consumes: `{ escolas, programas, verificacoes, activeCompetenciaKey }`.
- Produces: `buildSmeMonthlyModel(input)` com `{ competenceKey, sheetName, fileName, columns, rows }`.

- [ ] **Step 1: escrever testes que falham**

Cobrir `TODAS`, nome de arquivo/aba, ordenação por designação, competência única, valores normalizados e células vazias para programa não consolidado.

- [ ] **Step 2: executar** `node --test tests/unit/excel-sme-export-model.test.js` e confirmar falha.
- [ ] **Step 3: implementar** `buildSmeMonthlyModel`, `parseCompetence`, `normalizeSmeValue`, `resolveProgramKey` e contrato de colunas.
- [ ] **Step 4: executar** o teste e confirmar aprovação.
- [ ] **Step 5:** commit `feat: modelar Excel SME mensal`.

### Task 3: Criar o renderizador ExcelJS de uma aba

**Files:**
- Create: `src/domain/excel-sme-monthly-renderer.js`
- Create: `tests/unit/excel-sme-monthly-renderer.test.js`

**Interfaces:**
- Consumes: modelo de `buildSmeMonthlyModel(input)` e `ExcelJS`.
- Produces: `renderWorkbook(model, options)` e `downloadWorkbook(model, options)`.

- [ ] **Step 1: escrever testes que falham**

Usar `require('exceljs')` para validar workbook com uma aba, nome correto, cabeçalhos, valores, autofiltro, congelamento e impressão.

- [ ] **Step 2: executar** `node --test tests/unit/excel-sme-monthly-renderer.test.js` e confirmar falha.
- [ ] **Step 3: implementar** workbook com colunas A:Z, cabeçalho institucional, grupos cromáticos, bordas, alinhamentos, larguras, altura, linhas alternadas, autofiltro, freeze pane e page setup landscape/fit-to-page.
- [ ] **Step 4: executar** o teste e confirmar aprovação.
- [ ] **Step 5:** commit `feat: renderizar Excel SME mensal`.

### Task 4: Integrar ExcelJS ao carregamento e ao build

**Files:**
- Modify: `src/integration/load-excel-export.js`
- Modify: `scripts/build-vercel.mjs`
- Modify: `package.json`
- Create: `tests/unit/exceljs-public-build-contract.test.js`

**Interfaces:**
- Consumes: `node_modules/exceljs/dist/exceljs.min.js`.
- Produces: `window.ExcelJS` antes do renderer SME e `dist/vendor/exceljs.min.js` no build.

- [ ] **Step 1: escrever teste de contrato que falha** para exigir cópia do bundle e ordem de carregamento.
- [ ] **Step 2: executar** o teste e confirmar falha.
- [ ] **Step 3: modificar** `build-vercel.mjs` para copiar o bundle após os runtime entries.
- [ ] **Step 4: modificar** o loader para tentar `vendor/exceljs.min.js` e usar `/node_modules/exceljs/dist/exceljs.min.js` apenas como fallback local.
- [ ] **Step 5: adicionar** os novos módulos aos `node --check` de `package.json`.
- [ ] **Step 6: executar** teste e `npm run check`.
- [ ] **Step 7:** commit `build: disponibilizar ExcelJS para o Excel SME`.

### Task 5: Simplificar a integração e governar o botão

**Files:**
- Modify: `src/integration/excel-export-integration.js`
- Modify: `tests/unit/excel-sme-export-integration.test.js`
- Modify: `tests/excel-export-integration.test.js`
- Modify: `tests/e2e/excel-export-action.spec.js`

**Interfaces:**
- Consumes: `RadarExcelSmeExportModel.buildSmeMonthlyModel`, `RadarExcelSmeMonthlyRenderer.downloadWorkbook` e `activeCompetenciaKey`.
- Produces: botão `Excel SME` desabilitado em `TODAS`, habilitado em mês válido, e função global `exportDataExcelSme()`.

- [ ] **Step 1: escrever testes que falham** para estado desabilitado/habilitado, geração mensal e preservação do Excel atual.
- [ ] **Step 2: executar** testes unitários específicos e confirmar falha.
- [ ] **Step 3: implementar** atualização reativa do botão, tooltip em `TODAS`, geração assíncrona e log específico.
- [ ] **Step 4: executar** testes unitários e E2E do botão.
- [ ] **Step 5:** commit `feat: adicionar botão Excel SME mensal`.

### Task 6: Verificação, PR e publicação

**Files:**
- Modify: `docs/architecture/excel-export.md`

**Interfaces:**
- Consumes: implementação completa.
- Produces: documentação, PR aprovado, deployment de produção e bloqueio automático restaurado.

- [ ] **Step 1:** documentar a separação entre Excel institucional, Excel SME mensal e CSV.
- [ ] **Step 2:** executar `npm run test:unit`.
- [ ] **Step 3:** executar `npm run test:readiness`.
- [ ] **Step 4:** executar Playwright do botão Excel e regressões associadas.
- [ ] **Step 5:** abrir PR para `main` e acompanhar checks.
- [ ] **Step 6:** corrigir qualquer falha comprovada e repetir os gates.
- [ ] **Step 7:** integrar o PR.
- [ ] **Step 8:** publicar na Vercel de forma controlada.
- [ ] **Step 9:** fazer smoke test em produção e restaurar `deploymentEnabled: false`.
