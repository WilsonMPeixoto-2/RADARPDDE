# Continuidade e instrumentação pós-PR #193 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Versionar o estado pós-merge do PR #193 e ligar a probe de desempenho operacional ao runtime real sem alterar contratos de negócio.

**Architecture:** A instrumentação permanece em uma extensão pós-`app.js`, com probe compartilhada e efêmera. O listener de feedback abre a amostra; o wrapper de escrita correlaciona a persistência; o reconciliador incremental fecha a fase de aplicação e estabilização. Toda falha diagnóstica é ignorada pelo fluxo funcional.

**Tech Stack:** JavaScript browser/Node, `node:test`, Performance API/PerformanceObserver nativos, GitHub Actions, Vercel, Supabase.

**Spec:** `docs/superpowers/specs/2026-08-23-continuity-instrumentation-post-pr193-design.md`

## Global Constraints

- Nenhuma mudança de regra de negócio.
- Nenhuma migration ou escrita em Supabase Production.
- Nenhuma dependência nova.
- Vulnerabilidades conscientemente aceitas: acompanhar, não corrigir nesta frente.
- Métricas somente locais/efêmeras e sem dados de negócio.
- Instrumentação fail-open.
- Preservar wrappers, retornos e idempotência existentes.
- Não reduzir thresholds de gates.

---

### Task 1: Provar o contrato de integração por TDD

**Files:**
- Modify: `tests/unit/operational-write-diagnostics.test.js`
- Modify: `tests/unit/operational-write-performance-policy.test.js`
- Create: `tests/unit/operational-write-diagnostics-integration.test.js`

**Interfaces:**
- Consumes: `RadarOperationalWriteDiagnostics.createProbe(options)`.
- Produces: contrato para `install(root)`, `begin(root, label)`, `mark(root, id, phase)`, `enqueue(root, label, id)`, `take(root, label)`, `withActive(root, id, fn)`, `active(root)`, `RadarOperationalWriteMetrics.snapshot()` e `summary()`.

- [ ] **Step 1: Escrever testes falhando para singleton, fila e interface somente leitura**

```javascript
const root = { performance: { now: () => 0 } };
const first = diagnostics.install(root, { limit: 2 });
const second = diagnostics.install(root, { limit: 2 });
assert.equal(first, second);
assert.equal(typeof root.RadarOperationalWriteMetrics.snapshot, 'function');
assert.equal(typeof root.RadarOperationalWriteMetrics.summary, 'function');
assert.equal(root.RadarOperationalWriteMetrics.begin, undefined);
```

- [ ] **Step 2: Escrever teste falhando para correlação de handler**

```javascript
const id = diagnostics.begin(root, 'toggleBonif');
diagnostics.enqueue(root, 'toggleBonif', id);
assert.equal(diagnostics.take(root, 'toggleBonif'), id);
assert.equal(diagnostics.take(root, 'toggleBonif'), null);
```

- [ ] **Step 3: Escrever teste falhando para contexto síncrono e fail-open**

```javascript
const value = diagnostics.withActive(root, 7, () => diagnostics.active(root));
assert.equal(value, 7);
assert.equal(diagnostics.active(root), null);
```

- [ ] **Step 4: Escrever teste falhando para bootstrap oficial**

```javascript
assert.ok(bootstrapSource.indexOf('/src/integration/operational-write-diagnostics.js')
    < bootstrapSource.indexOf('/src/integration/operational-write-performance.js'));
```

- [ ] **Step 5: Escrever teste falhando para instrumentação da persistência**

```javascript
const phases = [];
const root = diagnosticsRoot(phases);
policy.patchDataService(dataService, root);
await dataService.execute({ name: 'verification:set-bonification', persist: async () => ({}) });
assert.deepEqual(phases, ['rpcStart', 'rpcEnd']);
```

- [ ] **Step 6: Rodar os testes focados e confirmar RED**

Run:

```bash
node --test tests/unit/operational-write-diagnostics.test.js \
  tests/unit/operational-write-diagnostics-integration.test.js \
  tests/unit/operational-write-performance-policy.test.js
```

Expected: FAIL por APIs/integração ainda inexistentes, sem erro de sintaxe.

- [ ] **Step 7: Commit dos testes RED**

```bash
git add tests/unit/operational-write-diagnostics*.test.js tests/unit/operational-write-performance-policy.test.js
git commit -m "test: definir integração de métricas operacionais"
```

---

### Task 2: Implementar runtime compartilhado e público somente leitura

**Files:**
- Modify: `src/integration/operational-write-diagnostics.js`

**Interfaces:**
- Consumes: `performance.now`, opcionalmente `performance.mark/measure` e `PerformanceObserver`.
- Produces: métodos de correlação internos no API global e `window.RadarOperationalWriteMetrics` somente leitura.

- [ ] **Step 1: Implementar `install(root, options)` idempotente**

```javascript
const runtimes = new WeakMap();
function install(root, options = {}) {
    if (!root || (typeof root !== 'object' && typeof root !== 'function')) return null;
    if (runtimes.has(root)) return runtimes.get(root);
    const probe = createProbe({ ...options, now: options.now || (() => root.performance?.now?.() ?? Date.now()) });
    const runtime = createRuntime(probe);
    runtimes.set(root, runtime);
    root.RadarOperationalWriteMetrics = Object.freeze({
        snapshot: () => probe.snapshot(),
        summary: () => probe.summary()
    });
    return runtime;
}
```

- [ ] **Step 2: Implementar fila de traces e contexto ativo síncrono**

```javascript
function enqueue(root, label, id) { /* fila limitada por label */ }
function take(root, label) { /* shift ou null */ }
function withActive(root, id, callback) { /* set/try/finally/restore */ }
function active(root) { /* id atual ou null */ }
```

- [ ] **Step 3: Fazer `begin/mark` falharem abertos**

```javascript
function safeMark(root, id, phase) {
    try { return install(root)?.probe.mark(id, phase) ?? false; }
    catch { return false; }
}
```

- [ ] **Step 4: Integrar Performance API local sem retenção indefinida**

Usar nomes técnicos derivados apenas de `id`/fase. Ao fechar `stable`, limpar marcas/medidas antigas quando a API existir. Nenhum payload de negócio entra no nome da marca.

- [ ] **Step 5: Rodar testes focados e confirmar GREEN**

Run:

```bash
node --test tests/unit/operational-write-diagnostics.test.js \
  tests/unit/operational-write-diagnostics-integration.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/integration/operational-write-diagnostics.js tests/unit/operational-write-diagnostics*.test.js
git commit -m "feat: integrar runtime de métricas operacionais"
```

---

### Task 3: Ligar clique, feedback, RPC, aplicação e estabilidade

**Files:**
- Modify: `src/integration/product-extensions-bootstrap.js`
- Modify: `src/integration/operational-write-feedback.js`
- Modify: `src/integration/operational-write-performance.js`
- Test: `tests/unit/operational-write-diagnostics-integration.test.js`
- Test: `tests/unit/operational-write-performance-policy.test.js`

**Interfaces:**
- Consumes: API de correlação do Task 2.
- Produces: amostra real completa por handler inline suportado.

- [ ] **Step 1: Carregar diagnostics antes de performance**

```javascript
'/src/integration/operational-write-diagnostics.js',
'/src/integration/operational-write-performance.js',
```

- [ ] **Step 2: Abrir trace no listener capture antes do feedback visual**

```javascript
const handlerName = inlineHandlerName(found.handler);
const id = diagnostics.begin(root, handlerName);
diagnostics.enqueue(root, handlerName, id);
markPending(found.control, found.operation, found.handler);
diagnostics.mark(root, id, 'feedback');
```

Falha de qualquer chamada de diagnóstico não pode impedir `markPending`.

- [ ] **Step 3: Consumir trace no wrapper do handler**

```javascript
const traceId = diagnostics.take(root, name);
const resultPromise = diagnostics.withActive(root, traceId, () => original.apply(this, args));
result = await resultPromise;
```

Sem trace disponível, chamar `original` normalmente.

- [ ] **Step 4: Marcar RPC no wrapper do DataService**

Quando `command.persist` existir, envolver apenas a persistência:

```javascript
persist: async context => {
    diagnostics.mark(root, traceId, 'rpcStart');
    try { return await originalPersist(context); }
    finally { diagnostics.mark(root, traceId, 'rpcEnd'); }
}
```

Comando sem persist customizado preserva comportamento sem fabricar duração falsa de RPC.

- [ ] **Step 5: Marcar aplicação local e estabilização**

```javascript
diagnostics.mark(root, traceId, 'applyStart');
syncProntuarioProgramUI(root, schoolId, compKey);
diagnostics.mark(root, traceId, 'applyEnd');
(root.requestAnimationFrame || root.setTimeout || queueMicrotask)(() => {
    diagnostics.mark(root, traceId, 'stable');
});
```

- [ ] **Step 6: Garantir fallback e erro sem bloqueio**

O caminho `result === false`, exceções de persistência, probe ausente ou probe defeituosa deve manter exatamente o comportamento funcional anterior.

- [ ] **Step 7: Rodar testes focados e confirmar GREEN**

Run:

```bash
node --test tests/unit/operational-write-diagnostics*.test.js \
  tests/unit/operational-write-performance-policy.test.js \
  tests/unit/prontuario-inline-write-contract.test.js
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/integration/product-extensions-bootstrap.js \
  src/integration/operational-write-feedback.js \
  src/integration/operational-write-performance.js \
  tests/unit/operational-write-diagnostics-integration.test.js \
  tests/unit/operational-write-performance-policy.test.js
git commit -m "feat: medir escrita operacional ponta a ponta"
```

---

### Task 4: Reconciliar documentação canônica e handoff

**Files:**
- Create: `docs/handoff/2026-08-23-post-pr-193.md`
- Modify: `docs/CURRENT_STAGE.md`
- Modify: `docs/README.md`
- Modify: `docs/PROJECT_CONTEXT.md`
- Modify: `docs/DECISION_LOG.md`
- Modify: `docs/architecture/product-extensions-load-order.md`

**Interfaces:**
- Consumes: estado remoto confirmado, spec e implementação concluída.
- Produces: rota única de retomada futura.

- [ ] **Step 1: Criar handoff pós-PR #193**

Registrar baseline, PRs #190–#193, decisões, migrations, ferramentas, riscos aceitos e ordem de leitura.

- [ ] **Step 2: Atualizar `CURRENT_STAGE.md`**

Substituir a âncora corrente de 18/08 pelo estado pós-PR #193, mantendo o snapshot de 18/08 como histórico explícito.

- [ ] **Step 3: Atualizar índice e contexto**

`README.md` deve apontar primeiro para o handoff de 23/08. `PROJECT_CONTEXT.md` deve registrar os contratos de idempotência, Assessoria/NF e atualização incremental sem virar diário de commits.

- [ ] **Step 4: Registrar nova decisão duradoura**

Adicionar ADR agregada ao `DECISION_LOG.md` para:

- estabilização #190–#193;
- caminho incremental como normal e render integral como fallback;
- métricas locais sem telemetria externa;
- vulnerabilidades conhecidas aceitas: monitorar, não forçar atualização nesta frente.

- [ ] **Step 5: Corrigir ordem de carregamento**

Documentar a cadeia efetiva até `operational-write-feedback.js`, incluindo diagnóstico/performance/reconciliador e idempotência.

- [ ] **Step 6: Commit documental**

```bash
git add docs/
git commit -m "docs: consolidar estado pós-PR193"
```

---

### Task 5: Verificação final e preparação para revisão

**Files:**
- Modify only if required by a verified failure.

**Interfaces:**
- Consumes: branch completa.
- Produces: evidência de prontidão para revisão, sem merge automático.

- [ ] **Step 1: Rodar sintaxe e testes unitários**

```bash
npm run check
npm run test:unit
```

- [ ] **Step 2: Rodar gates incorporados pelas novas ferramentas**

```bash
npm run test:properties
npm run test:network-failures
npm run check:architecture
```

- [ ] **Step 3: Rodar readiness proporcional**

```bash
npm run test:readiness
```

Nenhuma migration/backup destrutivo adicional é necessário porque esta branch não altera contratos de banco.

- [ ] **Step 4: Conferir diff contra a `main`**

Validar ausência de migration, dependência nova, mudança de regra ou dados.

- [ ] **Step 5: Abrir PR com resumo e evidências**

O PR permanece sem merge automático. Production só muda depois de revisão/integração explícita.
