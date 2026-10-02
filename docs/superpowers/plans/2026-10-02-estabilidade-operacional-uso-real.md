# Estabilidade Operacional / Uso Real — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o RADAR robusto sob uso real sustentado por múltiplos controladores, com gravações, correções, exclusões, reanálises, crescimento de dados, Realtime, latência e falhas, sem interromper Production.

**Architecture:** A frente começa por observabilidade e reprodução, sem mudar regras de negócio nem o comportamento de Production. Em seguida mede a origem dos refreshes e o custo real do contexto operacional, cria cenários concorrentes prolongados e só então aplica correções incrementais, reversíveis e compatíveis. Mudanças de arquitetura de leitura só entram depois de prova RED→GREEN e comparação objetiva contra o baseline pós-PR #406.

**Tech Stack:** JavaScript/Node 24, node:test, Playwright, Supabase/Postgres, Realtime, GitHub Actions, Vercel.

**Spec:** `docs/architecture/operational-real-usage-contracts.md`

## Global Constraints

- Production permanece no baseline `24f51fbcce413069287236fa78418465df08d267` até haver evidência suficiente e gates verdes.
- Nenhuma alteração de regra de negócio, RLS ou dado de Production nesta frente sem necessidade demonstrada.
- Nenhuma otimização da RPC `read_operational_context` antes de medir causa, frequência, payload e latência em cenário realista.
- Toda mudança comportamental usa TDD com RED observado antes do código de produção.
- Cenários precisam cobrir múltiplos controladores, sessões prolongadas, criação, edição, exclusão, reanálise, Realtime, timeout e recuperação.
- Critério de sucesso inclui experiência real: ausência de tempestade de refresh, ausência de rerender desnecessário, convergência entre sessões e preservação da edição em curso.
- Implementações devem ser incrementais, reversíveis e compatíveis com rollback sem paralisação do site.

## Review Focus

- Sessão que recebe muitas invalidações enquanto grava e corrige dados não pode transformar cada evento em leitura contextual completa.
- Timeout de `read_operational_context` não pode gerar retry em cascata por foco, clique, fechamento de modal ou Realtime.
- Edição em curso não pode ser perdida nem sobrescrita por refresh remoto; invalidação legítima precisa drenar ao final.
- Duas ou mais sessões devem convergir sem F5 após criação, correção e exclusão.
- Crescimento de dados e histórico não pode degradar silenciosamente chamadas/payloads até ultrapassar o orçamento operacional.

---

### Task 1: Observabilidade do refresh operacional

**Files:**
- Modify: `src/integration/operational-context-refresh.js`
- Modify: `tests/unit/production-refresh-stability.test.js`

**Interfaces:**
- Consumes: `createController(root, service, options)` existente.
- Produces: `controller.getMetrics()` com snapshot imutável de motivos, tentativas, skips, falhas, sucessos, pendências, rerenders e duração da última leitura.

- [ ] **Step 1: Write the failing tests** para provar contagem por motivo, throttle, edição, falha, sucesso e rerender.
- [ ] **Step 2: Run tests and verify RED** porque `getMetrics()` ainda não existe.
- [ ] **Step 3: Implement minimal metrics** sem mudar decisões de refresh.
- [ ] **Step 4: Run targeted unit tests and verify GREEN.**
- [ ] **Step 5: Run complete unit suite.**
- [ ] **Step 6: Commit.**

### Task 2: Gate de jornada sustentada concorrente

**Files:**
- Create: `tests/unit/operational-real-usage-session.test.js`
- Optionally modify: `package.json` only to expose a dedicated non-destructive test command.

**Interfaces:**
- Consumes: metrics from Task 1 plus existing refresh and Realtime controllers.
- Produces: deterministic stress scenario with several logical sessions and bounded refresh counts.

- [ ] **Step 1: Write RED scenario** with multiple sessions, creation/correction/delete-like invalidations, editing windows, latency and one timeout.
- [ ] **Step 2: Verify RED** against current behavior/budget.
- [ ] **Step 3: Record exact excess trigger pattern.**
- [ ] **Step 4: No production fix until root cause is isolated.**
- [ ] **Step 5: Commit test/evidence only.**

### Task 3: Correção mínima do gatilho dominante

**Files:**
- Determined by Task 2 evidence; expected candidates: `src/integration/operational-context-refresh.js` and/or `src/integration/operational-realtime-invalidation.js`.
- Test: `tests/unit/operational-real-usage-session.test.js`

**Interfaces:**
- Consumes: failing budget and trigger attribution from Task 2.
- Produces: bounded refresh behavior without loss of convergence.

- [ ] **Step 1: State one root-cause hypothesis from evidence.**
- [ ] **Step 2: Apply the smallest behavior change that addresses it.**
- [ ] **Step 3: Verify GREEN on sustained-session test.**
- [ ] **Step 4: Re-run two-session Realtime gates and production-refresh stability.**
- [ ] **Step 5: Commit.**

### Task 4: Realistic data-volume and RPC cost gate

**Files:**
- Create test/fixture tooling under `tests/integration/` or `scripts/audit/` following existing project patterns.
- No Production schema change in this task.

**Interfaces:**
- Consumes: current `read_operational_context` and a production-shaped synthetic dataset.
- Produces: reproducible measurements for latency, payload size and query frequency under growth.

- [ ] **Step 1: Create production-shaped synthetic data specification from observed Production counts without copying personal data.**
- [ ] **Step 2: Measure baseline p50/p95/p99 and payload.**
- [ ] **Step 3: Add failing operational budget only if evidence shows a stable threshold can be enforced.**
- [ ] **Step 4: Commit evidence and gate.**

### Task 5: RPC/read-path optimization only if Task 4 proves necessity

**Files:**
- New versioned RPC/migration or read-path module, selected only from measured evidence.
- Existing RPC remains available during rollout.

**Interfaces:**
- Consumes: Task 4 profile and budgets.
- Produces: optional `read_operational_context` successor behind reversible selection/feature flag.

- [ ] **Step 1: Write RED comparison proving the exact bottleneck.**
- [ ] **Step 2: Implement one isolated optimization.**
- [ ] **Step 3: Verify semantic equivalence, RLS, payload and latency.**
- [ ] **Step 4: Keep old and new paths compatible for rollback.**
- [ ] **Step 5: Commit; do not switch Production yet.**

### Task 6: Permanent real-usage release gate

**Files:**
- Workflow/test files chosen from existing CI conventions.
- Documentation update recording the operational invariants.

**Interfaces:**
- Consumes: Tasks 1–5 metrics and tests.
- Produces: mandatory CI contract for future changes to refresh, Realtime, repository, persistence and Supabase read paths.

- [ ] **Step 1: Add gate covering sustained session, timeout recovery and multi-session convergence.**
- [ ] **Step 2: Verify it fails against intentionally regressed fixture/branch behavior and passes current fixed behavior.**
- [ ] **Step 3: Run full readiness/E2E relevant gates.**
- [ ] **Step 4: Record final operational baseline and rollback plan.**
- [ ] **Step 5: Commit.**
