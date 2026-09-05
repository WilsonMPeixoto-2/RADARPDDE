# Engenharia de continuidade e reconciliação pós-hotfixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** reconciliar o plano source-first do PR #253 com os PRs posteriores #254, #256, #257, #258, #260 e #261, produzindo uma única porta de entrada e um único plano executável vigente sem alterar runtime, banco ou Production.

**Architecture:** o PR #253 é o baseline de planejamento. Cada fase R1–R9 é confrontada com os hotfixes posteriores e com o código atual da `main`; decisões posteriores prevalecem. O resultado é materializado em `START_HERE.md`, `docs/CURRENT_STATE.md`, `docs/PLAN_TRACEABILITY.md` e `docs/MASTER_PLAN_CURRENT.md`, com validação automática impedindo rotas documentais concorrentes.

**Tech Stack:** Markdown, Node.js 24, GitHub Actions, JavaScript de auditoria documental.

**Spec:** `docs/superpowers/specs/2026-09-04-continuity-master-plan-reconciliation-design.md`

## Global Constraints

- Nenhuma alteração funcional, migration, banco ou Production.
- PR #262 permanece abortado e não define regra vigente.
- PR #253 é o baseline de planejamento; PRs #254/#256/#257/#258/#260/#261 são posteriores e prevalecem quando alteram suas premissas.
- Documento histórico nunca pode desfazer decisão posterior.
- Conflito não resolvível deve ser marcado como dúvida, não convertido em alteração funcional.
- `START_HERE.md` deve ser a única porta de entrada operacional.
- `docs/MASTER_PLAN_CURRENT.md` deve ser o único plano executável vigente.

---

### Task 1: Fechar matriz R1–R9 × hotfixes posteriores

**Files:**
- Create: `docs/PLAN_TRACEABILITY.md`
- Update: `docs/audits/2026-09-04-continuity-semantic-traceability-wip.md`

**Interfaces:**
- Consumes: plano R1–R9 do PR #253; PRs #254/#256/#257/#258/#260/#261; código e testes atuais.
- Produces: classificação final de cada R1–R9 e guardrails posteriores que o plano sucessor deve preservar.

- [ ] **Step 1:** registrar a sequência cronológica pós-PR #253 e o escopo de cada PR.
- [ ] **Step 2:** confrontar cada R1–R9 com arquivos tocados pelos PRs posteriores e com o código final.
- [ ] **Step 3:** classificar cada fase como `AINDA PENDENTE`, `PARCIAL/REFORMULADA`, `CONCLUÍDA POR CAMINHO DIFERENTE`, `SUPERADA` ou `GATE FUTURO`.
- [ ] **Step 4:** registrar explicitamente regras supervenientes de Pendências, Inventário, NF e confiabilidade que não podem regredir.
- [ ] **Step 5:** conferir que nenhum item é removido apenas por existir um teste verde.

### Task 2: Criar estado corrente e plano sucessor

**Files:**
- Create: `docs/CURRENT_STATE.md`
- Create: `docs/MASTER_PLAN_CURRENT.md`

**Interfaces:**
- Consumes: `docs/PLAN_TRACEABILITY.md`.
- Produces: fotografia curta do produto e única fila executável vigente.

- [ ] **Step 1:** registrar baseline factual e cadeia de PRs que compõem o estado atual.
- [ ] **Step 2:** congelar as decisões supervenientes sensíveis a regressão.
- [ ] **Step 3:** transportar para o plano novo apenas trabalho realmente remanescente.
- [ ] **Step 4:** reformular tarefas cuja premissa foi alterada pelos hotfixes, sem restaurar comportamento anterior.
- [ ] **Step 5:** manter gates já criados pelo PR #260 como infraestrutura existente, não como trabalho a reconstruir.

### Task 3: Criar única porta de entrada

**Files:**
- Create: `START_HERE.md`
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `docs/README.md`

**Interfaces:**
- Consumes: `docs/CURRENT_STATE.md`, `docs/PLAN_TRACEABILITY.md`, `docs/MASTER_PLAN_CURRENT.md`.
- Produces: ordem determinística de retomada para qualquer chat/agente.

- [ ] **Step 1:** criar `START_HERE.md` com ordem obrigatória de leitura e regra de precedência.
- [ ] **Step 2:** remover dos três pontos de entrada qualquer fila concorrente e apontar primeiro para `START_HERE.md`.
- [ ] **Step 3:** exigir revalidação de SHA antes de executar plano quando a `main` avançar.
- [ ] **Step 4:** deixar claro que documentos históricos explicam origem, mas não definem a próxima ação.

### Task 4: Marcar planos históricos e fechar contradições de roteamento

**Files:**
- Modify: `docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md`
- Modify: `docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md`
- Modify: `docs/CURRENT_STAGE.md`
- Modify: `docs/reference/STATUS_DOCUMENTOS.md`

**Interfaces:**
- Consumes: nova hierarquia documental.
- Produces: documentos antigos preservados sem poderem ser usados como fila atual.

- [ ] **Step 1:** adicionar banner `HISTÓRICO — NÃO EXECUTAR` ao plano de 03/09, apontando para `MASTER_PLAN_CURRENT.md`.
- [ ] **Step 2:** manter o plano de 26/08 como histórico e apontar diretamente para `START_HERE.md`.
- [ ] **Step 3:** atualizar `CURRENT_STAGE.md` para delegar continuidade à nova porta de entrada.
- [ ] **Step 4:** atualizar índice de status documental com classificação inequívoca.

### Task 5: Instalar validação automática de continuidade

**Files:**
- Create: `scripts/check-continuity-docs.mjs`
- Create: `tests/unit/continuity-docs.test.js`
- Modify: `package.json`
- Modify: `.github/workflows/continuity-baseline-audit.yml`

**Interfaces:**
- Consumes: estrutura documental final.
- Produces: gate que detecta rotas concorrentes e plano corrente ausente.

- [ ] **Step 1:** escrever teste que falha sem as regras de continuidade.
- [ ] **Step 2:** implementar checker que exige `START_HERE.md` como primeira leitura nos três pontos de entrada.
- [ ] **Step 3:** checker deve garantir existência e unicidade do plano executável corrente.
- [ ] **Step 4:** checker deve exigir banner histórico nos planos antigos selecionados.
- [ ] **Step 5:** integrar o checker ao `npm run check` e ao workflow de auditoria documental.
- [ ] **Step 6:** executar unitários e checker na branch.

### Task 6: Revisão final e fechamento documental

**Files:**
- Modify: `docs/audits/2026-09-04-continuity-semantic-traceability-wip.md`
- Modify: PR #263 body/status

**Interfaces:**
- Consumes: todos os artefatos anteriores.
- Produces: auditoria final reproduzível e PR pronto para revisão.

- [ ] **Step 1:** comparar o diff do PR #263 e confirmar ausência de runtime/migrations.
- [ ] **Step 2:** executar checker, unitários e inventário mecânico.
- [ ] **Step 3:** revisar referências a R1–R9 em documentos de entrada e eliminar linguagem concorrente.
- [ ] **Step 4:** transformar o ledger WIP em conclusão da auditoria, preservando evidências e decisões.
- [ ] **Step 5:** atualizar o PR #263 com resumo, matriz de reconciliação e verificações.
