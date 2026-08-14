# Prontuário UX de Baixo Risco Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aproximar o checkbox de envio à Assessoria da respectiva NF e melhorar a separação visual entre programas sem alterar regras ou persistência.

**Architecture:** A implementação altera apenas o markup gerado no Prontuário por `app.js` e classes visuais em `styles.css`. O estado individual por NF, handlers, serviços, Supabase e projeções mensais permanecem intactos.

**Tech Stack:** JavaScript vanilla, HTML gerado por template strings, CSS, Playwright, Node.js 24.x.

## Global Constraints

- Trabalhar somente na branch `feat/prontuario-ux-baixo-risco-20260814` até o PR estar pronto.
- Não alterar schema, migrations, RPCs, RLS, Auth, Excel ou serviços de domínio.
- Preservar `toggleInvoiceAdvisorySent()` e a persistência individual por NF.
- Preservar análise técnica individual e resumo mensal automático.
- Manter identidade visual vigente; usar hierarquia, espaçamento, borda e fundo sutil, não nova paleta.
- Aplicar TDD: escrever a expectativa de interface antes da alteração de produção e observar a falha.

---

### Task 1: Proteger por teste o novo posicionamento da Assessoria

**Files:**
- Modify: `tests/e2e/functional-core.spec.js` no cenário `renderiza e persiste consulta à Assessoria individualizada por nota de serviço`

**Interfaces:**
- Consumes: `data-service-advisory-invoice`, `toggleInvoiceAdvisorySent()`, labels acessíveis existentes.
- Produces: expectativa de que cada checkbox esteja contido na caixa da NF correspondente, sem alterar o local da análise técnica e do resumo.

- [ ] **Step 1: Escrever a expectativa que deve falhar**

No cenário existente, depois de criar `NF-SERV-E2E-1` e `NF-SERV-E2E-2`, localizar as caixas na linha `Notas Fiscais` e exigir que cada uma contenha o checkbox correspondente:

```javascript
const noteRow = fiscalNoteRow(page);
const firstInvoiceCard = noteRow.locator('[data-service-advisory-invoice="nota-e2e-servico"]').filter({
  hasText: 'NF-SERV-E2E-1'
});
const secondInvoiceCard = noteRow.locator('[data-service-advisory-invoice]').filter({
  hasText: 'NF-SERV-E2E-2'
});

await expect(firstInvoiceCard.getByLabel('Consulta enviada à Assessoria para a NF NF-SERV-E2E-1')).toHaveCount(1);
await expect(secondInvoiceCard.getByLabel('Consulta enviada à Assessoria para a NF NF-SERV-E2E-2')).toHaveCount(1);
```

Como IDs das notas de serviço criadas pelo fluxo real podem diferir entre a primeira e a segunda inclusão, preferir seletores por `data-service-advisory-invoice` + texto da NF, não assumir IDs iguais.

- [ ] **Step 2: Executar o cenário e confirmar RED**

Run: `npx playwright test tests/e2e/functional-core.spec.js --project=desktop-chromium --grep="renderiza e persiste consulta à Assessoria individualizada"`

Expected: FAIL porque os checkboxes ainda estão somente na linha `Consulta Assessoria`, não dentro das caixas da linha `Notas Fiscais`.

- [ ] **Step 3: Não alterar produção ainda**

Registrar a falha como evidência do contrato novo e seguir para Task 2.

---

### Task 2: Mover o checkbox para dentro da caixa da NF

**Files:**
- Modify: `app.js` no bloco `serviceAdvisoryEntries` do render do Prontuário
- Test: `tests/e2e/functional-core.spec.js`

**Interfaces:**
- Consumes: `serviceAdvisoryEntries`, `toggleInvoiceAdvisorySent(noteId, schoolId, checked)`, `isBonifLocked`.
- Produces: caixa de NF com controle `Enviada à Assessoria`; linha de Assessoria continua contendo análise individual e resumo mensal.

- [ ] **Step 1: Alterar apenas o markup da caixa da NF**

Substituir o conteúdo visual da caixa por estrutura semântica equivalente a:

```html
<div class="service-invoice-card" data-service-advisory-invoice="...">
  <div class="service-invoice-card-main">
    <strong>NF ...</strong>
    <span>Descrição do serviço</span>
  </div>
  <label class="service-invoice-advisory-toggle">
    <input type="checkbox" aria-label="Consulta enviada à Assessoria para a NF ...">
    <span>Enviada à Assessoria</span>
  </label>
</div>
```

O `onchange` deve continuar chamando exatamente:

```javascript
toggleInvoiceAdvisorySent(note.id, esc.id, this.checked)
```

- [ ] **Step 2: Remover somente o checkbox duplicado da linha Consulta Assessoria**

A célula de bonificação `consAssessoria` deve exibir o resumo mensal e, quando útil, referência textual às NFs, mas não uma segunda cópia do checkbox. A célula de análise continua renderizando um `select` por NF.

- [ ] **Step 3: Executar o cenário focado e confirmar GREEN**

Run: `npx playwright test tests/e2e/functional-core.spec.js --project=desktop-chromium --grep="renderiza e persiste consulta à Assessoria individualizada"`

Expected: PASS, incluindo persistência independente e `Resumo mensal: Sim`.

---

### Task 3: Proteger e implementar a separação visual de programas

**Files:**
- Modify: `tests/e2e/functional-core.spec.js`
- Modify: `app.js` no `<tr data-program-id>` e na célula de competência/programa
- Modify: `styles.css` próximo de `.program-status-summary`

**Interfaces:**
- Consumes: `progId`, `progName`, `c.label`, `idx` no render do Prontuário.
- Produces: classes `.program-block-start`, `.program-context-cell`, `.program-context-competence`, `.program-context-name`.

- [ ] **Step 1: Escrever teste de agrupamento visual**

Adicionar cenário desktop que abra uma escola com pelo menos dois programas e verifique:

```javascript
const starts = page.locator('#prontuario-verif-rows tr.program-block-start');
await expect(starts).toHaveCount(2);
await expect(starts.nth(0).locator('.program-context-name')).not.toHaveText('');
await expect(starts.nth(1).locator('.program-context-name')).not.toHaveText('');
```

O teste deve escolher dinamicamente uma escola em escopo com dois programas e limitar a renderização ao contexto necessário.

- [ ] **Step 2: Executar e confirmar RED**

Run: `npx playwright test tests/e2e/functional-core.spec.js --project=desktop-chromium --grep="separa visualmente os programas"`

Expected: FAIL porque as classes ainda não existem.

- [ ] **Step 3: Implementar classes no markup**

No `<tr>` do documento:

```javascript
class="${idx === 0 ? 'program-block-start' : ''}"
```

Na célula `rowspan`:

```html
<td class="program-context-cell" ...>
  <strong class="program-context-competence">...</strong>
  <span class="program-context-name">...</span>
  ...
</td>
```

- [ ] **Step 4: Implementar CSS mínimo**

Adicionar regras equivalentes a:

```css
#prontuario-verif-rows tr.program-block-start > td {
    border-top: 2px solid var(--border-hover);
}

.program-context-cell {
    vertical-align: top;
    width: 180px;
    border-right: 1px solid var(--border-color);
    background: var(--table-header-bg);
    padding-top: 16px;
}

.program-context-competence,
.program-context-name {
    display: block;
}

.program-context-competence {
    font-size: 0.9rem;
}

.program-context-name {
    margin-top: 4px;
    color: var(--primary);
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1.3;
}
```

Em viewport estreito, permitir quebra natural e não esconder conteúdo.

- [ ] **Step 5: Executar o cenário e confirmar GREEN**

Run: `npx playwright test tests/e2e/functional-core.spec.js --project=desktop-chromium --grep="separa visualmente os programas"`

Expected: PASS.

---

### Task 4: Validação proporcional e integração

**Files:**
- Modify somente se necessário por defeito real: arquivos já alterados

**Interfaces:**
- Consumes: alterações das Tasks 1–3.
- Produces: PR pronto para integração e SHA de Production confirmado.

- [ ] **Step 1: Executar os dois cenários focados juntos**

Run: `npx playwright test tests/e2e/functional-core.spec.js --project=desktop-chromium --grep="(renderiza e persiste consulta à Assessoria individualizada|separa visualmente os programas)"`

Expected: PASS.

- [ ] **Step 2: Executar gate base proporcional**

Run: `npm run check && npm run lint:e2e`

Expected: PASS. Não executar Supabase, migrations, Excel, backup ou Lighthouse, pois não são superfícies alteradas.

- [ ] **Step 3: Revisar diff**

Confirmar que o diff contém somente `app.js`, `styles.css`, teste focado e documentação do pacote; nenhuma mudança em serviços, migrations, schema ou contratos de persistência.

- [ ] **Step 4: Abrir PR**

Título: `Prontuário: refinar Assessoria por NF e separação de programas`

Descrever escopo, ausência de mudança de regra/persistência, testes executados e risco baixo.

- [ ] **Step 5: Integrar na main quando os gates materiais estiverem verdes**

Usar merge normal conforme padrão do repositório e confirmar que a `main` avançou para o merge SHA.

- [ ] **Step 6: Confirmar Production**

Verificar na Vercel que o deployment do novo SHA está `READY`, `target=production` e servido pelo alias `radarpdde-fix.vercel.app`.
