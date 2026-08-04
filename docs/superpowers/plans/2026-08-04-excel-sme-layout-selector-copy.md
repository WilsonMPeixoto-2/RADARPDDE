# Excel SME Layout and Competence Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir a estrutura e a formatação do Excel SME e retirar do cabeçalho global apenas o texto explicativo sobre o efeito da competência.

**Architecture:** O modelo mensal passa a expor somente as 27 colunas pertencentes ao documento original. O renderer continua aceitando o template-fonte atualmente publicado, mas o projeta de forma determinística removendo as colunas-fonte K, R e Y antes de validar, preencher e serializar o workbook; bordas, formato textual da designação, alinhamentos, filtro e impressão são aplicados sobre o contrato final A:AA. O seletor global deixa de criar o nó de ajuda explicativa, preservando rótulo, seletor e competência atual.

**Tech Stack:** JavaScript CommonJS/IIFE, Node.js 24, ExcelJS 4.4.0, Node Test Runner, Playwright.

## Global Constraints

- Não alterar Supabase Production, banco, dados, Auth, RLS ou migrations.
- Não alterar o conteúdo dos seis campos documentais de Básico, Qualidade e Equidade.
- Remover exclusivamente as colunas-fonte K, R e Y intituladas `SISTEMÁTICA PREENCHIDA`.
- Preservar as colunas administrativas atualmente identificadas em AB, AC e AD; no contrato final elas se deslocam para Y, Z e AA conforme a remoção física das três colunas anteriores.
- Manter uma única aba mensal, congelamento em E2, filtro, impressão em paisagem e compatibilidade com Microsoft Excel desktop.
- Retirar do site somente `A seleção atualiza todas as telas e exportações mensais.`; manter `COMPETÊNCIA`, o seletor e o mês atual.
- Trabalhar em branch própria e não realizar merge automático.

---

### Task 1: Contrato canônico de 27 colunas

**Files:**
- Modify: `tests/unit/excel-sme-canonical-translation.test.js`
- Modify: `tests/unit/excel-sme-export-model.test.js`
- Modify: `src/domain/excel-sme-export-model.js`
- Modify: `src/domain/excel-integral-certification.js`

**Interfaces:**
- Produces: `buildSmeMonthlyModel(input)` com `columns.length === 27` e sem chaves `*_systematic` no contrato exportável.

- [ ] **Step 1: Write the failing tests**

Atualizar os contratos para exigir:

```js
assert.equal(model.columns.length, 27);
assert.equal(model.columns.some(column => /systematic$/i.test(column.key)), false);
assert.equal(model.columns.some(column => column.label === 'SISTEMÁTICA PREENCHIDA'), false);
assert.deepEqual(model.columns.slice(-5).map(column => column.key), [
  'status', 'deliveryDate', 'correctionDate', 'opinion', 'notes'
]);
```

- [ ] **Step 2: Run tests to verify RED**

Run: `node --test tests/unit/excel-sme-canonical-translation.test.js tests/unit/excel-sme-export-model.test.js`

Expected: FAIL porque o modelo atual possui 30 colunas e três colunas sistemáticas.

- [ ] **Step 3: Implement the minimal model change**

Em `excel-sme-export-model.js`, manter `ACCOUNT_HEADERS` com somente os seis documentos de cada conta, fazer `accountColumns()` retornar seis colunas, retirar a escrita de `row[..._systematic]` e atualizar `ORIGINAL_HEADER_LABELS` e a versão do modelo. Manter `resolveSystematicStatus()` exportada apenas para compatibilidade, sem incluí-la no workbook.

Em `excel-integral-certification.js`, certificar 27 colunas, ausência de sistemáticas, `status` na posição 23 e quatro colunas administrativas após ele.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `node --test tests/unit/excel-sme-canonical-translation.test.js tests/unit/excel-sme-export-model.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/excel-sme-export-model.js src/domain/excel-integral-certification.js tests/unit/excel-sme-canonical-translation.test.js tests/unit/excel-sme-export-model.test.js
git commit -m "fix: restaurar contrato original do Excel SME"
```

### Task 2: Projeção do template e formatação final

**Files:**
- Modify: `tests/unit/excel-sme-template-renderer.test.js`
- Modify: `tests/unit/excel-sme-office-compatibility.test.js`
- Modify: `src/domain/excel-sme-template-renderer.js`

**Interfaces:**
- Produces: `renderWorkbook(model, options)` com saída A:AA, 27 colunas, designação textual, bordas completas e sem K/R/Y sistemáticas.

- [ ] **Step 1: Write the failing renderer tests**

Adicionar expectativas:

```js
assert.equal(worksheet.columnCount, 27);
assert.equal(worksheet.getCell('C2').value, '410001');
assert.equal(worksheet.getCell('C2').numFmt, '@');
assert.equal(worksheet.getCell('A1').border.left.style, 'thin');
assert.equal(worksheet.getCell('AA2').border.right.style, 'thin');
assert.equal(worksheet.autoFilter, 'A1:AA2');
assert.equal(worksheet.pageSetup.printArea, 'A1:AA2');
assert.deepEqual(worksheet.getCell('Z2').alignment, {
  horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1
});
```

Também verificar que nenhum cabeçalho final seja `SISTEMÁTICA PREENCHIDA` e que os antigos AB, AC e AD permaneçam semanticamente como `correctionDate`, `opinion` e `notes` após o deslocamento.

- [ ] **Step 2: Run tests to verify RED**

Run: `node --test tests/unit/excel-sme-template-renderer.test.js tests/unit/excel-sme-office-compatibility.test.js`

Expected: FAIL em contagem, AA, bordas e formato textual.

- [ ] **Step 3: Implement template projection**

Em `excel-sme-template-renderer.js`:

```js
const LAST_COLUMN = 27;
const LAST_COLUMN_LETTER = 'AA';
const SOURCE_SYSTEMATIC_COLUMNS = Object.freeze([25, 18, 11]);

function projectTemplateToOriginalColumns(worksheet) {
  SOURCE_SYSTEMATIC_COLUMNS.forEach(column => worksheet.spliceColumns(column, 1));
}
```

Executar a projeção antes de `verifyHeaderContract()`. Fazer `formatDesignation()` retornar apenas texto numérico e definir `target.getCell(3).numFmt = '@'`. Aplicar borda fina consistente em todas as células de `A1:AA<finalRow>`. Aplicar alinhamentos corporais com base em `model.columns[index].alignment`, incluindo `indent: 1` para campos à esquerda, eliminando o alinhamento categórico incorreto do parecer.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `node --test tests/unit/excel-sme-template-renderer.test.js tests/unit/excel-sme-office-compatibility.test.js`

Expected: PASS, inclusive verificações OOXML de área de impressão absoluta em `$AA$`.

- [ ] **Step 5: Commit**

```bash
git add src/domain/excel-sme-template-renderer.js tests/unit/excel-sme-template-renderer.test.js tests/unit/excel-sme-office-compatibility.test.js
git commit -m "fix: corrigir estrutura e formatação do Excel SME"
```

### Task 3: Remoção da cópia explicativa no seletor global

**Files:**
- Modify: `tests/e2e/mobile-header-controls.spec.js`
- Modify: `src/integration/global-competence-selector.js`

**Interfaces:**
- Produces: cabeçalho global sem `#global-competence-help` e sem a frase explicativa, preservando `#global-competence-select` e `#global-competence-label`.

- [ ] **Step 1: Write the failing E2E assertion**

```js
await expect(page.locator('#global-competence-help')).toHaveCount(0);
await expect(page.getByText('A seleção atualiza todas as telas e exportações mensais.')).toHaveCount(0);
```

- [ ] **Step 2: Run test to verify RED**

Run: `npx playwright test tests/e2e/mobile-header-controls.spec.js --project=mobile-chromium`

Expected: FAIL porque o nó de ajuda ainda é criado.

- [ ] **Step 3: Implement minimal markup change**

Remover a criação e o `append` de `global-competence-help`, e retirar essa referência de `aria-describedby`. Não remover o `label`, o `select` nem `global-competence-label`.

- [ ] **Step 4: Run test to verify GREEN**

Run: `npx playwright test tests/e2e/mobile-header-controls.spec.js --project=mobile-chromium`

Expected: PASS sem regressão geométrica.

- [ ] **Step 5: Commit**

```bash
git add src/integration/global-competence-selector.js tests/e2e/mobile-header-controls.spec.js
git commit -m "fix: retirar explicação interna do seletor global"
```

### Task 4: Homologação integral e evidência

**Files:**
- Modify when required by generated fixtures: `docs/evidence/excel-certification/*`
- Modify: `docs/architecture/excel-sme-mensal.md`

- [ ] **Step 1: Run focused suites**

Run:

```bash
node --test tests/unit/excel-sme-*.test.js
npm run certify:excel:fixture
npm run build:vercel
```

Expected: PASS.

- [ ] **Step 2: Generate and reopen a real workbook**

Gerar o candidato mensal com o script homologado, reabrir com ExcelJS e verificar: uma aba, 27 colunas, designação textual, ausência das três sistemáticas, bordas, filtro `A1:AA...`, impressão `A1:AA...` e integridade OOXML.

- [ ] **Step 3: Run readiness and E2E**

Run:

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:readiness
```

Expected: PASS.

- [ ] **Step 4: Update architecture documentation**

Registrar o contrato final de 27 colunas, a projeção determinística do template-fonte e o motivo do formato textual da designação.

- [ ] **Step 5: Commit and open draft PR**

```bash
git add docs src tests
git commit -m "docs: registrar contrato corrigido do Excel SME"
```

Abrir PR em rascunho contra `main`, sem merge automático.
