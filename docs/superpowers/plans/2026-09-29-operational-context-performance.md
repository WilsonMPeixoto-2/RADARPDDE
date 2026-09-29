# Contexto Operacional e Performance — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o fan-out de centenas de leituras REST por uma leitura contextual set-based canônica, preservando exatamente as dependências funcionais e reduzindo a latência da troca de competência e do pós-gravação.

**Architecture:** Manter `DataService.loadOperationalContext()` e a interface pública `OperationalSupabaseRepository.queryOperationalContext()`. Substituir a implementação cliente fragmentada por uma única RPC SQL `read_operational_context`, `SECURITY INVOKER`, que devolve o mesmo envelope contextual. Somente após medir essa correção decidir se Realtime ainda precisa de deduplicação adicional.

**Tech Stack:** JavaScript, Supabase/PostgreSQL 17, PostgREST/RPC, pgTAP, Node test runner, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-29-root-cause-consolidation-design.md`

## Global Constraints

- Não criar caminho `V2` paralelo.
- Não restaurar bootstrap global de coleções operacionais.
- Não usar cache, timeout maior ou polling como primeira correção.
- Preservar Pendências transversais, dependências históricas, NF individual, bens vinculados, tentativas e contatos.
- Preservar RLS com `SECURITY INVOKER`.
- `DataService` continua responsável por cancelamento, staleness e aplicação do contexto.
- Não alterar semântica de Auth, perfis ou `registered_invoices`.
- Supabase CLI 2.114.0 permanece homologada.
- A evidência base é `docs/evidence/2026-09-29-production-evaluation-performance/README.md`.

## Review Focus

- Pendência ativa de mês anterior deve continuar trazendo sua verificação e NF vinculada.
- Bem ativo de mês anterior deve continuar trazendo NF/verificação necessária ao fluxo patrimonial.
- Histórico solicitado de Resolvida/Cancelada deve aparecer sem ampliar a leitura para todo o ano.
- Troca rápida de competência deve abortar/apagar somente a leitura obsoleta e nunca aplicar contexto antigo.
- Invalidação Realtime durante/ao redor de uma escrita deve convergir sem multiplicar refreshes.

---

### Task 1: Fixar o contrato set-based no banco

**Files:**
- Create: `supabase/migrations/20260929120000_read_operational_context.sql`
- Create: `supabase/tests/database/operational-context-read.test.sql`
- Modify: `supabase/verification/remote-post-apply.sql`
- Modify: `src/types/database.types.ts`

**Interfaces:**
- Consumes: tabelas `verifications`, `registered_invoices`, `pendencies`, `pendency_attempts`, `pendency_contacts`, `assets`.
- Produces: `public.read_operational_context(p_competence_id text, p_history_statuses text[] default '{}'::text[]) returns jsonb`.

- [ ] **Step 1: Escrever pgTAP falho para o fechamento contextual**

Cobrir em uma única fixture:

- registros mensais da competência solicitada;
- Pendência aberta de mês anterior;
- Pendência aguardando reanálise de mês anterior;
- NF histórica ligada à Pendência;
- bem ativo histórico e NF/bem/verificação relacionada;
- tentativas/contatos apenas das Pendências incluídas;
- histórico Resolvida/Cancelada somente quando solicitado;
- ausência de registros alheios ao fechamento funcional.

- [ ] **Step 2: Rodar o teste e confirmar falha por ausência da RPC**

Run: `npx supabase test db supabase/tests/database/operational-context-read.test.sql`

Expected: FAIL porque `read_operational_context` ainda não existe.

- [ ] **Step 3: Implementar a RPC set-based**

Em `20260929120000_read_operational_context.sql`:

- validar `YYYY-MM`;
- validar que `p_history_statuses` contenha somente `Resolvida`/`Cancelada`;
- usar CTEs e joins/set operations para formar o fechamento contextual;
- retornar JSON com `competenceId` e `entities` nas chaves atuais;
- usar `SECURITY INVOKER`, `STABLE` e search_path explícito compatível com o padrão do projeto;
- conceder execução somente aos papéis já autorizados.

- [ ] **Step 4: Rodar pgTAP e verificar RLS/contrato**

Run: `npm run supabase:test:db`

Expected: PASS, inclusive testes de RLS existentes.

- [ ] **Step 5: Atualizar tipos e verificação remota**

Regenerar/atualizar `src/types/database.types.ts` e adicionar a presença da RPC em `remote-post-apply.sql`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260929120000_read_operational_context.sql   supabase/tests/database/operational-context-read.test.sql   supabase/verification/remote-post-apply.sql src/types/database.types.ts
git commit -m "perf: add set-based operational context read"
```

### Task 2: Substituir o fan-out cliente pela autoridade única

**Files:**
- Modify: `src/data/supabase-repository.js:500-528`
- Modify: `src/data/repository-factory.js:266-430`
- Create: `tests/unit/supabase-rpc-abort-signal.test.js`
- Test: `tests/unit/remote-operational-context-query.test.js`
- Test: `tests/unit/remote-context-bootstrap.test.js`
- Test: `tests/unit/remote-bootstrap-concurrency.test.js`

**Interfaces:**
- Consumes: RPC `read_operational_context(...)`.
- Extends: `SupabaseRepository.executeRpc(name, args, operation, options = {})`, com `options.signal` opcional apenas para leituras canceláveis; chamadas de escrita existentes sem `options.signal` mantêm comportamento idêntico.
- Produces: `OperationalSupabaseRepository.queryOperationalContext(options) -> { competenceId, entities }` com a mesma forma atual e cancelamento físico da requisição obsoleta.

- [ ] **Step 1: Reescrever teste unitário para exigir uma RPC e zero fan-out por contexto**

Asserções mínimas:

- uma chamada `rpc('read_operational_context', ...)`;
- zero GETs diretos em `verifications`/`registered_invoices` para resolver dependências;
- envelope final idêntico ao contrato anterior;
- o mesmo `AbortSignal` recebido por `queryOperationalContext()` chega ao builder PostgREST da RPC por `.abortSignal(signal)`;
- abortar a competência A cancela fisicamente a request A, além de impedir a aplicação de resposta obsoleta.

- [ ] **Step 2: Rodar o teste e confirmar que o código atual falha pelo excesso de chamadas**

Run: `node --test tests/unit/remote-operational-context-query.test.js`

Expected: FAIL porque o caminho atual usa `queryContextDependencies()`.

- [ ] **Step 3: Tornar a execução de RPC opcionalmente abortável sem alterar as escritas existentes**

Em `src/data/supabase-repository.js`:

- evoluir a assinatura para `executeRpc(name, args, operation, options = {})`;
- criar o builder com `this.client.rpc(name, cloneValue(args || {}))`;
- quando `options.signal` existir, exigir suporte a `.abortSignal(signal)` e aplicá-lo antes do `await`;
- quando não houver signal, manter exatamente o caminho atual das RPCs de escrita;
- preservar o mapeamento de erros já existente e permitir que cancelamento continue detectável pelo chamador como abort da leitura, sem convertê-lo em falso erro funcional.

- [ ] **Step 4: Testar isoladamente o contrato de cancelamento da RPC**

Em `tests/unit/supabase-rpc-abort-signal.test.js`, provar:

- `abortSignal` recebe exatamente o signal passado;
- RPC sem signal não exige nem chama `abortSignal`;
- abort de leitura não faz fallback para outra consulta nem retry de escrita.

Run: `node --test tests/unit/supabase-rpc-abort-signal.test.js`

Expected: PASS.

- [ ] **Step 5: Substituir somente a implementação de `queryOperationalContext()`**

Implementação:

- chamar `this.executeRpc('read_operational_context', args, 'queryOperationalContext', { signal: options.signal })`;
- normalizar/validar o JSON recebido;
- preservar ordenação determinística;
- manter `DataService` como autoridade de sequence/stale/application;
- remover `queryContextDependencies()` se ficar sem consumidor.

- [ ] **Step 6: Rodar os testes de contexto/bootstrap**

Run:

```bash
node --test   tests/unit/remote-operational-context-query.test.js   tests/unit/remote-context-bootstrap.test.js   tests/unit/remote-bootstrap-concurrency.test.js
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/data/supabase-repository.js src/data/repository-factory.js \
  tests/unit/supabase-rpc-abort-signal.test.js \
  tests/unit/remote-operational-context-query.test.js \
  tests/unit/remote-context-bootstrap.test.js \
  tests/unit/remote-bootstrap-concurrency.test.js
git commit -m "perf: collapse operational context fan-out"
```

### Task 3: Provar concorrência, cancelamento e aplicação incremental

**Files:**
- Test: `tests/unit/realtime-write-abort-interleaving.test.js`
- Test: `tests/unit/operational-context-refresh.test.js`
- Test: `tests/unit/incremental-state-application.test.js`
- Modify only if test proves necessary: `src/application/data-service.js:406-850`

**Interfaces:**
- Consumes: `queryOperationalContext()` set-based.
- Produces: mesmas garantias de staleness, abort e `StatePort.applyEntities()`.

- [ ] **Step 1: Atualizar fixtures para a leitura RPC única**

Preservar casos de:

- competência A abortada fisicamente por competência B;
- leitura abortada fisicamente por intenção de escrita;
- escrita aguardada como barreira somente quando já pendente;
- resposta antiga nunca aplicada;
- cancelamento continua reduzindo trabalho de rede, não apenas descartando o resultado no JavaScript.

- [ ] **Step 2: Rodar testes antes de alterar DataService**

Run:

```bash
node --test   tests/unit/realtime-write-abort-interleaving.test.js   tests/unit/operational-context-refresh.test.js   tests/unit/incremental-state-application.test.js
```

Expected: PASS. Se já passar, **não alterar `data-service.js`**.

- [ ] **Step 3: Corrigir `DataService` somente se uma garantia real tiver sido quebrada**

Não introduzir nova fila nem novo wrapper. Preservar `operationalContextSequence` e `AbortController`.

- [ ] **Step 4: Commit somente se houver mudança necessária**

### Task 4: Fixar um gate de performance próximo da experiência real

**Files:**
- Modify: `tests/e2e/performance-journeys.spec.js`
- Modify: `tests/support/performance-journey-observer.js`
- Add evidence on execution: `docs/evidence/<date>-operational-context-performance/README.md`

**Interfaces:**
- Consumes: tráfego real do navegador contra Supabase local autenticado.
- Produces: métrica de quantidade de requests e duração por jornada.

- [ ] **Step 1: Adicionar jornada de troca de competência na Avaliação**

Asserções:

- exatamente uma chamada a `/rest/v1/rpc/read_operational_context` por troca estabilizada;
- zero GETs diretos em `/rest/v1/verifications` e `/rest/v1/registered_invoices` decorrentes da hidratação;
- nenhuma falha de request;
- UI final corresponde à competência alvo.

- [ ] **Step 2: Adicionar orçamento de regressão**

Gate local:

- nenhuma jornada pode voltar ao padrão de dezenas/centenas de requests contextuais;
- o teste deve falhar por contagem, não por timeout artificial.

- [ ] **Step 3: Rodar baseline local autenticado**

Run conforme o workflow de performance já existente com `RADAR_E2E_PERFORMANCE_BASELINE=1` e Supabase local.

Expected: PASS com fan-out eliminado.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/performance-journeys.spec.js tests/support/performance-journey-observer.js
git commit -m "test: gate operational context request fan-out"
```

### Task 5: Medir Production e só então decidir sobre Realtime pós-write

**Files:**
- Evidence only unless a defect remains: `docs/evidence/<date>-operational-context-performance/README.md`
- Conditional tests: `tests/unit/operational-realtime-invalidation.test.js`, `tests/e2e/supabase-realtime-invalidation.spec.js`
- Conditional code: `src/integration/operational-realtime-invalidation.js`

**Interfaces:**
- Consumes: contexto set-based já publicado em candidato.
- Produces: decisão evidencial sobre necessidade de mudança adicional no Realtime.

- [ ] **Step 1: Repetir a mesma medição de Production**

Usar o mesmo perfil, viewport 1440×900 e destinos comparáveis.

Critérios:

- redução de requests de pelo menos 80% contra 172–292;
- alvo operacional de até 30 requests totais por troca, preferencialmente menos;
- redução de latência de pelo menos 50%;
- nenhuma regressão funcional ou visual.

- [ ] **Step 2: Repetir a prova de uma gravação isolada já existente ou controlada**

Medir:

- duração da RPC;
- broadcasts;
- quantidade de `read_operational_context` subsequentes;
- requests diretos adicionais;
- tempo até UI estável.

- [ ] **Step 3: Aplicar gate de decisão**

Se uma escrita autoritativa resultar em **no máximo um refresh contextual barato** e a UX ficar dentro do orçamento, **não alterar Realtime**.

Se ainda houver refresh duplicado/material:

- escrever antes uma hipótese única;
- adicionar teste que reproduza exatamente a duplicação;
- somente então alterar `operational-realtime-invalidation.js`;
- não usar janela temporal heurística para ignorar broadcast.

- [ ] **Step 4: Registrar evidência e commit documental**

### Task 6: Regressão integral da frente

**Files:**
- No new files unless evidence requires.

- [ ] **Step 1: Rodar gates direcionados**

```bash
npm run check:architecture
npm run lint
npm run typecheck:database
npm run test:unit
npm run test:integration
npm run test:sync-hardening
npm run test:prontuario-position-stability
npm run supabase:test:db
npm run supabase:lint:db
```

- [ ] **Step 2: Rodar E2E relacionado**

Inclui Avaliação mensal, Pendências, NF individual, Realtime, competência e performance.

- [ ] **Step 3: Verificar Production autenticada**

Critério de conclusão: comportamento correto + métricas dentro do orçamento + nenhuma nova camada paralela.

- [ ] **Step 4: Commit de evidência final**
