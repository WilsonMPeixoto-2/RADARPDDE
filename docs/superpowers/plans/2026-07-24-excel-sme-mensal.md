# Excel SME Mensal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gerar uma planilha Excel SME de uma única competência mensal, com layout semelhante ao modelo recebido, sem alterar o Excel institucional atual.

**Architecture:** Um módulo de domínio monta um modelo mensal puro a partir do estado do RADAR; um renderizador dedicado reutiliza o motor OOXML/ZIP institucional já auditado; a integração existente adiciona e governa o botão.

**Tech Stack:** JavaScript UMD/CommonJS, motor XLSX interno do RADAR, Node.js 24, Playwright e build estático da Vercel.

## Global Constraints

- O Excel institucional atual não pode ter seu modelo, renderer, nome, quatro abas ou botão alterados.
- O Excel SME exige competência no formato `AAAA-MM`; `TODAS` deve desabilitar o botão.
- O arquivo deve conter exatamente uma aba com o nome do mês em português.
- Campos sem origem no RADAR ficam em branco.
- Não incorporar o workbook original nem preservar fórmulas ou relações entre abas.
- Não adicionar biblioteca, bundle ou CDN.

---

### Task 1: Modelo mensal puro

**Files:**
- Create: `src/domain/excel-sme-export-model.js`
- Create: `tests/unit/excel-sme-export-model.test.js`

**Interfaces:**
- Consumes: `{ escolas, programas, verificacoes, activeCompetenciaKey }`.
- Produces: `buildSmeMonthlyModel(input)` com `{ competenceKey, sheetName, fileName, columns, rows }`.

- [x] Testar `TODAS`, nome do arquivo e aba, ordenação, competência única, normalização e vazios.
- [x] Mapear os programas reais nas contas Básico, Qualidade e Equidade.
- [x] Agregar múltiplas ações da mesma conta com precedência conservadora.
- [x] Implementar o modelo mensal.

### Task 2: Renderizador mensal no motor interno

**Files:**
- Create: `src/domain/excel-sme-monthly-renderer.js`
- Create: `tests/unit/excel-sme-monthly-renderer.test.js`

**Interfaces:**
- Consumes: modelo mensal e `RadarExcelXlsxRenderer.createZip`.
- Produces: `renderWorkbook(model)` e `downloadWorkbook(model, options)`.

- [x] Criar pacote OOXML de uma aba A:Z.
- [x] Aplicar cabeçalhos cromáticos, bordas, larguras, linhas alternadas e fonte Arial.
- [x] Adicionar autofiltro, congelamento, validações e configuração de impressão.
- [x] Testar XML, pacote ZIP e conteúdo gerado.

### Task 3: Carregamento e integração

**Files:**
- Modify: `src/integration/load-excel-export.js`
- Modify: `src/integration/excel-export-integration.js`
- Create: `tests/unit/excel-sme-export-integration.test.js`
- Modify: `tests/e2e/excel-export-button.spec.js`

**Interfaces:**
- Consumes: modelo mensal, renderer mensal e `activeCompetenciaKey`.
- Produces: botão `Excel SME` e `exportDataExcelSme()`.

- [x] Carregar os módulos após o motor XLSX institucional.
- [x] Desabilitar o botão em `TODAS` e habilitar em competência mensal.
- [x] Implementar download assíncrono e log específico.
- [x] Preservar o Excel atual e o CSV legado.
- [x] Cobrir integração unitária e E2E.

### Task 4: Verificação e publicação

**Files:**
- Create: `docs/architecture/excel-sme-mensal.md`

- [x] Documentar os três formatos e o mapeamento das contas.
- [ ] Executar `npm run test:unit` no CI.
- [ ] Executar `npm run test:readiness` no CI.
- [ ] Executar Playwright do botão e regressões.
- [ ] Integrar o PR após todos os checks.
- [ ] Publicar de forma controlada.
- [ ] Fazer smoke test em produção e restaurar `deploymentEnabled: false`.
