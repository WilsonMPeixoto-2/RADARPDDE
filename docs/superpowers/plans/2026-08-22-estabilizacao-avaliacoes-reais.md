# Estabilização das Avaliações Reais Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir as divergências de integridade e transição do fluxo mensal de avaliações, preservar a fluidez incremental do PR #192 e ampliar a proteção automatizada antes do uso efetivo na segunda-feira.

**Architecture:** Manter o desenho atual de `VerificationService`/`InvoiceService`/`PendencyService` + Repository + RPCs + `DataService`/`StatePort`. As correções devem produzir retornos autoritativos completos e um reconciliador visual localizado por escola/competência/programa. Escritas destrutivas são testadas somente em Supabase descartável/Preview; Production recebe apenas leitura até a homologação.

**Tech Stack:** JavaScript/IIFE, Node 24, node:test, Playwright, Supabase/Postgres/pgTAP, ESLint, Axe, Knip, Lighthouse; adicionar `fast-check`, MSW e `dependency-cruiser` como devDependencies em etapas próprias.

**Spec:** `docs/superpowers/specs/2026-08-22-estabilizacao-avaliacoes-reais-design.md`

## Global Constraints

- Não alterar regras de negócio vigentes sem decisão explícita do produto.
- Não usar `renderProntuario()` completo no caminho normal de sucesso incremental.
- Não executar escrita de teste em Production.
- Toda mudança funcional segue RED → GREEN → regressão.
- `fast-check`, MSW e `dependency-cruiser` ficam fora do bundle de produção.
- `web-vitals`, OpenTelemetry e migração de framework ficam fora desta estabilização.

---

### Task 1: Provar e corrigir limpeza de consolidação na RPC de NF

**Files:**
- Modify/Create migration em `supabase/migrations/20260822*_stabilize_evaluation_integrity.sql`
- Test: `supabase/tests/database/*invoice*.sql` ou novo teste pgTAP focal
- Test: `tests/unit/verification-remote-persistence.test.js` / `tests/unit/invoice-service.test.js`

**Interfaces:**
- Consumes: payload da operação atômica de NF com patch de verificação.
- Produces: RPC que distingue ausência de `bonus_result` de campo presente vazio e devolve `verification` autoritativa atualizada.

- [ ] Escrever teste de banco em que `bonus_result` ausente preserva APTA/INAPTA e campo presente `''` limpa para `NULL`.
- [ ] Executar o teste no Supabase descartável e confirmar falha no caso de limpeza.
- [ ] Criar migration ajustando a expressão `CASE` da RPC de efeitos de NF.
- [ ] Reexecutar teste de banco e unidade até ficar verde.
- [ ] Confirmar que o retorno autoritativo contém a `verification` persistida.

### Task 2: Corrigir transição N/A → Sim/Não e idempotência de verificação

**Files:**
- Modify: `src/application/verification-service.js`
- Test: `tests/unit/verification-service.test.js`
- Test: `tests/unit/monthly-evaluation-service.test.js`

**Interfaces:**
- Consumes: `setBonification()` e `closeBonification()`.
- Produces: estado sem análise fiscal residual e no-op para valores semanticamente iguais.

- [ ] Escrever teste: `notaFiscal=N/A` seguido de `Sim` deixa `analise.notaFiscal='Não analisado'`.
- [ ] Escrever teste equivalente para `N/A → Não`.
- [ ] Escrever teste: repetir o mesmo valor de bonificação não produz persistência/log novo.
- [ ] Escrever teste: consolidar novamente sem mudança não produz segundo log.
- [ ] Confirmar RED.
- [ ] Implementar a menor alteração no serviço.
- [ ] Confirmar GREEN e ausência de regressão dos testes de avaliação mensal.

### Task 3: Preservar data de disponibilização

**Files:**
- Create migration em `supabase/migrations/20260822*_pendency_attempt_available_at.sql`
- Modify: `src/data/state-bridge.js`
- Modify: contratos/tipos gerados somente conforme o padrão existente
- Modify: `src/application/pendency-service.js` se necessário para payload canônico
- Test: teste de adapter/state bridge e teste de serviço

**Interfaces:**
- Produces: `pendency_attempts.available_at` separado de `submitted_at` e round-trip sem perda.

- [ ] Escrever teste de ida e volta com `available_at != submitted_at`.
- [ ] Confirmar RED porque a informação é reconstruída a partir de `submitted_at`.
- [ ] Criar migration aditiva e backfill seguro a partir do payload quando disponível, usando `submitted_at` apenas como fallback.
- [ ] Ajustar adapter/bridge e persistência.
- [ ] Confirmar GREEN no round-trip e na regra `Correto`/`Correto (Atrasado)`.

### Task 4: Reabrir pendência Cancelada

**Files:**
- Modify: domínio de pendências correspondente
- Modify: `src/application/pendency-service.js` se necessário
- Migration/RPC somente se o banco bloquear a transição
- Test: testes de domínio, serviço e Playwright

- [ ] Escrever teste `Cancelada → Aberta` preservando histórico.
- [ ] Confirmar RED.
- [ ] Implementar transição conforme PEND-05.
- [ ] Confirmar GREEN para Resolvida e Cancelada.

### Task 5: Tornar Assessoria Incorreta + pendência atômicas e vinculadas à NF

**Files:**
- Create migration: adicionar `registered_invoice_id` nullable em `pendencies`, FK para `registered_invoices`, ajustar índices parciais e RPC composta.
- Modify: `src/application/invoice-service.js`
- Modify: `src/application/pendency-service.js`
- Modify: `src/data/supabase-repository.js`
- Modify: adapters/contratos JSON conforme padrão vigente
- Test: banco + serviço + Playwright

**Interfaces:**
- Produces: operação composta que só persiste `Assessoria=Incorreto` quando a pendência é confirmada; pendência conhece a NF; reanálise altera apenas a NF vinculada e deriva o resumo.

- [ ] Escrever teste de serviço: cancelar modal/abertura não persiste `Incorreto`.
- [ ] Escrever teste de banco: duas NFs distintas podem ter pendências de Assessoria ativas simultâneas.
- [ ] Escrever teste: duas pendências ativas para a mesma NF são rejeitadas.
- [ ] Escrever teste de reanálise: NF A muda, NF B permanece inalterada e resumo é recalculado.
- [ ] Confirmar RED.
- [ ] Criar migration, RPC e código mínimo.
- [ ] Confirmar GREEN e atomicidade sob falha simulada.

### Task 6: Reconciliador condicional incremental

**Files:**
- Modify/refactor focal: `src/integration/operational-write-performance.js`
- Modify: integração operacional do Prontuário relevante
- Test: `tests/unit/prontuario-inline-write-contract.test.js`
- Test: Playwright para transições condicionais

**Interfaces:**
- Produces: `syncProntuarioProgramUI` ou sucessor idempotente que recalcula a linha/programa completo a partir do estado já aplicado, sem nova leitura remota.

- [ ] Escrever testes para N/A↔Sim/Não, A identificar, Assessoria, Inventário, análise tardia, pendência e Consolidar/Consolidada.
- [ ] Confirmar RED nos ramos hoje ausentes.
- [ ] Implementar projeção condicional determinística localizada.
- [ ] Testar equivalência DOM: patch incremental versus recarga integral do mesmo estado autoritativo.
- [ ] Confirmar que `renderProntuario()` não é chamado em sucesso incremental.

### Task 7: Incorporar fast-check

**Files:**
- Modify: `package.json`, lockfile
- Create: testes property-based focais

- [ ] Adicionar `fast-check` como devDependency.
- [ ] Definir propriedades: recarga preserva significado; Incorreto exige pendência; NF vinculada não altera irmã; no-op não cria log; N/A não deixa estado incompatível.
- [ ] Executar com seed reproduzível e registrar seed em falhas.

### Task 8: Incorporar MSW para falhas de rede

**Files:**
- Modify: `package.json`, lockfile
- Create: suporte MSW de testes
- Test: DataService/Playwright/integration

- [ ] Adicionar MSW como devDependency.
- [ ] Simular RPC lenta, 500, timeout, conflito de `row_version` e resposta autoritativa incompleta.
- [ ] Provar rollback/fallback e ausência de estado visual falso.

### Task 9: Medir fluidez com Performance API

**Files:**
- Create/Modify: helper de instrumentação de diagnóstico ou testes de performance, sem telemetria externa.

- [ ] Marcar clique, feedback, início/fim de RPC, aplicação e estabilização visual.
- [ ] Registrar p50/p95 em cenário repetível antes/depois.
- [ ] Confirmar que as correções não reintroduzem render integral no caminho rápido.

### Task 10: Incorporar dependency-cruiser e ampliar gates existentes

**Files:**
- Modify: `package.json`, lockfile
- Create: configuração do dependency-cruiser
- Modify: workflow/readiness somente depois do comando estar estável

- [ ] Adicionar `dependency-cruiser` como devDependency.
- [ ] Proibir dependência de domínio em integração e dependência de produção em testes.
- [ ] Detectar ciclos e módulos não resolvidos sem duplicar a responsabilidade do Knip.
- [ ] Ampliar ESLint/Axe apenas nos módulos alterados quando produzir sinal útil.

### Task 11: Homologação final

- [ ] Rodar `test:readiness` completo.
- [ ] Rodar Playwright E2E e gate remoto de perfis/viewports.
- [ ] Rodar Supabase DB tests, lint e readiness.
- [ ] Rodar CodeQL e Lighthouse sem reduzir thresholds.
- [ ] Validar Preview em PC e mobile.
- [ ] Executar auditoria somente leitura em Production para estados impossíveis e integridade referencial.
- [ ] Comparar branch contra `main` e revisar migrations/diff integral.
- [ ] Somente com todos os gates verdes preparar PR/merge/deploy.
