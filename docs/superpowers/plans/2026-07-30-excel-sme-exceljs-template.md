# Excel SME com ExcelJS e Template Canônico — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o gerador artesanal do Excel SME por ExcelJS 4.4.0 aplicado ao template original, preservando o documento e traduzindo corretamente os dados e regras canônicas do RADAR.

**Architecture:** O domínio produz um modelo mensal puro e independente de XLSX. Um renderer separado carrega o template oficial, seleciona a aba mensal, preenche os campos mapeados e preserva os demais. ExcelJS e o template são carregados apenas no clique de exportação.

**Tech Stack:** JavaScript UMD, Node.js 24, ExcelJS 4.4.0, Microsoft OOXML, Node Test Runner, GitHub Actions.

## Global Constraints

- Os 30 textos de cabeçalho do arquivo original devem permanecer literais.
- Campos sem fonte no RADAR permanecem vazios.
- APTA/INAPTA deve ser calculado por `RadarFluxoOperacional.evaluateMonthlyEvaluation`.
- O relatório institucional, o CSV, o Supabase e Production não podem ser alterados.
- ExcelJS e o template não podem integrar o bootstrap inicial.
- Nenhum merge ou deployment antes da abertura do candidato no Excel desktop sem reparo.

---

### Task 1: Contratos de tradução do domínio

**Files:**
- Modify: `src/domain/excel-sme-export-model.js`
- Test: `tests/unit/excel-sme-export-model.test.js`
- Test: `tests/unit/excel-sme-original-contract.test.js`

**Interfaces:**
- Consumes: `RadarFluxoOperacional.evaluateMonthlyEvaluation(input)`.
- Produces: `buildSmeMonthlyModel(input)`, com `columns[30]`, `rows[]`, `sourcePrograms` e diagnósticos.

- [ ] **Step 1: Escrever regressões para partial, systematic e status**

Cobrir:

```javascript
assert.equal(row.basic_systematic, 'SIM');
assert.equal(row.qualidade_systematic, 'NÃO');
assert.equal(row.equidade_systematic, '');
assert.equal(row.status, '');
```

Adicionar cenários separados para `APTA` e `INAPTA`, calculados a partir de `bonificacao`, inclusive quando `resultadoBonif` armazenado divergir.

- [ ] **Step 2: Executar testes focados e confirmar falha**

Run:

```bash
node --test tests/unit/excel-sme-export-model.test.js tests/unit/excel-sme-original-contract.test.js
```

Expected: FAIL nas regras de parcialidade, sistemática e resultado canônico.

- [ ] **Step 3: Injetar o domínio canônico no modelo**

Alterar o wrapper para resolver `RadarFluxoOperacional` em Node e browser. Separar:

```javascript
collectProgramContexts(...)
evaluateProgramContext(...)
aggregateAccountDocuments(...)
resolveSystematicStatus(...)
resolveSchoolStatus(...)
```

Não filtrar verificações parciais. Manter AA:AD como strings vazias.

- [ ] **Step 4: Executar testes focados**

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/excel-sme-export-model.js tests/unit/excel-sme-export-model.test.js tests/unit/excel-sme-original-contract.test.js
git commit -m "feat: consolidar tradução canônica do Excel SME"
```

### Task 2: Template oficial e renderer ExcelJS

**Files:**
- Create: `assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx`
- Create: `src/domain/excel-sme-template-renderer.js`
- Delete after migration: `src/domain/excel-sme-monthly-renderer.js`
- Test: `tests/unit/excel-sme-template-renderer.test.js`

**Interfaces:**
- Consumes: `buildSmeMonthlyModel(input)` e bytes do template.
- Produces: `renderWorkbook(model, options): Promise<Uint8Array>` e `downloadWorkbook(model, options)`.

- [ ] **Step 1: Versionar o template original sem alteração**

Registrar SHA-256 do arquivo no teste e em `docs/evidence/excel-sme-template.json`.

- [ ] **Step 2: Escrever testes vermelhos do template**

Exigir:

```javascript
assert.equal(workbook.worksheets.length, 1);
assert.equal(sheet.name, 'DEZEMBRO');
assert.equal(sheet.getCell('A1').value, 'CRE');
assert.equal(sheet.getCell('A1').isMerged, true);
assert.equal(sheet.columnCount, 30);
assert.equal(sheet.getCell('Z2').value, 'APTA');
assert.equal(sheet.getCell('AA2').value, '');
```

Verificar também filtro, congelamento, validações, larguras e impressão.

- [ ] **Step 3: Executar e confirmar falha**

```bash
node --test tests/unit/excel-sme-template-renderer.test.js
```

- [ ] **Step 4: Implementar seleção da aba mensal**

Mapa:

```javascript
{
  1: 'JANEIRO', 2: 'FEVEREIRO', 3: 'MARÇO', 4: 'ABRIL',
  5: 'MAIO', 6: 'JUNHO', 7: 'JANEIRO A JULHO', 8: 'AGOSTO',
  9: 'SETEMBRO', 10: 'OUTUBRO', 11: 'NOVEMBRO', 12: 'DEZEMBRO'
}
```

Para julho, renomear a aba final para `JULHO`.

- [ ] **Step 5: Implementar preenchimento por designação**

Normalizar designação somente para localizar a linha; preservar o valor visual do template. Limpar E:AD antes de preencher. Copiar estilo da linha canônica apenas para unidades ausentes.

- [ ] **Step 6: Executar round-trip ExcelJS**

Gerar buffer, recarregar com `new ExcelJS.Workbook().xlsx.load(bytes)` e repetir as asserções estruturais.

- [ ] **Step 7: Commit**

```bash
git add assets/templates src/domain tests/unit/excel-sme-template-renderer.test.js docs/evidence/excel-sme-template.json
git commit -m "feat: gerar Excel SME a partir do template oficial"
```

### Task 3: ExcelJS sob demanda no navegador

**Files:**
- Modify: `src/integration/load-excel-export.js`
- Modify: `src/integration/excel-export-integration.js`
- Create: `src/integration/excel-sme-runtime-loader.js`
- Test: `tests/unit/excel-sme-runtime-loader.test.js`
- Test: `tests/unit/excel-export-integration.test.js`

**Interfaces:**
- Produces: `loadExcelSmeRuntime(): Promise<{ ExcelJS, templateBytes }>`.

- [ ] **Step 1: Escrever regressão de lazy loading**

Exigir que `/vendor/exceljs.min.js` e o template não estejam na lista inicial de scripts e só sejam requisitados após `exportSmeXlsx()`.

- [ ] **Step 2: Confirmar falha**

```bash
node --test tests/unit/excel-sme-runtime-loader.test.js tests/unit/excel-export-integration.test.js
```

- [ ] **Step 3: Implementar single-flight de carregamento**

O loader deve reutilizar a mesma Promise, validar `root.ExcelJS.Workbook`, buscar o template com `cache: 'force-cache'` e devolver bytes imutáveis por cópia.

- [ ] **Step 4: Adaptar integração**

O clique continua com estado `Gerando Excel SME…`. Erros distinguem falha de biblioteca, template e geração.

- [ ] **Step 5: Executar testes focados e commit**

```bash
git add src/integration tests/unit
git commit -m "perf: carregar ExcelJS somente na exportação SME"
```

### Task 4: Dependência reproduzível e política de segurança por alcance

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `vendor/exceljs.min.js`
- Create: `scripts/build-exceljs.mjs`
- Create: `scripts/check-exceljs-audit-policy.mjs`
- Modify: `.github/workflows/dependency-health.yml`
- Test: `tests/unit/exceljs-audit-policy.test.js`

**Interfaces:**
- Produces: `npm run build:exceljs` e `npm run audit:exceljs-policy`.

- [ ] **Step 1: Escrever testes da política**

A política deve:

- bloquear qualquer `critical`;
- bloquear qualquer advisory novo;
- aceitar somente `GHSA-mh99-v99m-4gvg` e `GHSA-w5hq-g745-h8pq` nos pacotes e caminhos documentados;
- falhar se o bundle não corresponder ao distribuído pelo pacote;
- falhar se o runtime importar writer streaming, filesystem, glob ou parser de XLSX externo.

- [ ] **Step 2: Confirmar falha**

```bash
node --test tests/unit/exceljs-audit-policy.test.js
```

- [ ] **Step 3: Instalar versão fixa e gerar lockfile**

```bash
npm install --save-exact exceljs@4.4.0
```

- [ ] **Step 4: Gerar bundle reproduzível**

Copiar exatamente `node_modules/exceljs/dist/exceljs.min.js` e registrar SHA-256.

- [ ] **Step 5: Integrar política ao gate**

Manter `npm audit --json` como entrada; substituir somente a decisão bruta por severidade para esta exceção nominal e limitada.

- [ ] **Step 6: Executar auditoria e commit**

```bash
npm run audit:exceljs-policy
npm run check
npm run test:unit
git add package.json package-lock.json vendor scripts .github/workflows/dependency-health.yml tests/unit/exceljs-audit-policy.test.js
git commit -m "build: fixar ExcelJS com política de alcance"
```

### Task 5: Certificação integral e artefato de homologação

**Files:**
- Modify: `src/domain/excel-integral-certification.js`
- Modify: `scripts/generate-excel-sme-homologation.mjs`
- Modify: `.github/workflows/excel-sme-homologation.yml`
- Modify: `docs/evidence/excel-certification/synthetic-manifest.json`
- Test: `tests/unit/excel-integral-certification.test.js`

- [ ] **Step 1: Escrever regressões de certificação**

Certificar modelo, template e arquivo serializado. Exigir 30 colunas, zero divergências, hashes determinísticos e nenhuma informação pessoal no manifesto.

- [ ] **Step 2: Confirmar falha**

```bash
node --test tests/unit/excel-integral-certification.test.js
```

- [ ] **Step 3: Implementar certificação e regenerar manifesto**

Não editar hashes manualmente.

```bash
node scripts/generate-excel-certification-evidence.mjs
node scripts/generate-excel-certification-evidence.mjs --check
```

- [ ] **Step 4: Gerar candidato real**

O workflow instala dependências, gera o arquivo pelo renderer real, recarrega-o pelo ExcelJS e publica somente o `.xlsx` candidato e um JSON sanitizado.

- [ ] **Step 5: Commit**

```bash
git add src/domain scripts .github/workflows/excel-sme-homologation.yml docs/evidence tests/unit
git commit -m "test: certificar integralmente o Excel SME"
```

### Task 6: Validação final e homologação humana

**Files:**
- Modify: `docs/CURRENT_STAGE.md`
- Create: `docs/audits/2026-07-30-excel-sme-exceljs-template.md`

- [ ] **Step 1: Executar gates no mesmo SHA**

```bash
npm ci
npm run test:readiness
npm run audit:exceljs-policy
```

Aguardar também Playwright, perfis/viewports, Lighthouse, backup/restauração e homologação Excel.

- [ ] **Step 2: Inspecionar o artefato**

Confirmar que o candidato contém uma aba mensal, 30 colunas, textos literais, campos vazios previstos e status canônico.

- [ ] **Step 3: Entregar ao usuário para Excel desktop**

O arquivo deve abrir sem:

- “Encontramos um problema em um conteúdo”;
- relatório de reparo;
- remoção de propriedades de `workbook.xml`.

- [ ] **Step 4: Manter PR em rascunho**

Não marcar pronto, não mesclar e não publicar até confirmação expressa da homologação manual.
