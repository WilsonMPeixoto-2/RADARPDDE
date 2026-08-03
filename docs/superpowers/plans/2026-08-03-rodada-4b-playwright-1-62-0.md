# Rodada 4B — Playwright 1.62.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atualizar o runner E2E do RADAR PDDE para Playwright 1.62.0 sem alterar o produto nem os ambientes remotos.

**Architecture:** A versão direta e as dependências internas `playwright` e `playwright-core` permanecem fixadas no lockfile. A matriz existente de Chromium desktop/mobile e WebKit mobile continua inalterada. A validação ocorre no CI do PR, incluindo produto, Supabase descartável, Excel, Lighthouse e perfis/viewports.

**Tech Stack:** Node.js 24.x, npm lockfile v3, Playwright Test 1.62.0, GitHub Actions.

## Global Constraints

- Não alterar código funcional, configuração Playwright ou limiares de qualidade sem defeito comprovado.
- Não adicionar Firefox à matriz nesta rodada.
- Não executar deployment Vercel.
- Não acessar nem modificar Supabase Production.
- Manter versões exatas e lockfile reproduzível.
- Preservar `git.deploymentEnabled: false`.

---

### Task 1: Fixar a versão e o lockfile

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [x] **Step 1: Confirmar a versão oficial estável**

Playwright 1.62.0 confirmado nas fontes oficiais.

- [x] **Step 2: Regenerar o lockfile sobre a `main` atual**

O npm atualizou exclusivamente Playwright e reorganizou `fsevents`, preservando Supabase CLI 2.110.0.

- [x] **Step 3: Verificar instalação reproduzível**

`npm ci` foi aprovado no workflow de saúde das dependências.

### Task 2: Executar gates do pacote funcional

- [x] **Saúde das dependências** — run `30786138787`.
- [x] **E2E Playwright completo** — run `30786138676`.
- [x] **Cinco perfis em desktop, Android e iPhone** — run `30786138715`.
- [x] **Lighthouse mobile e desktop** — run `30786138689`.
- [x] **Supabase readiness** — run `30786138713`.
- [x] **Backup e restauração descartáveis** — run `30786138677`.
- [x] **Homologação automatizada do Excel SME** — run `30786138685`.

### Task 3: Reconciliar documentação e PRs

**Files:**
- Modify: `docs/CURRENT_STAGE.md`
- Modify: `docs/ROADMAP_ATUALIZACOES_2026.md`
- Modify: `docs/superpowers/specs/2026-08-03-rodada-4b-playwright-1-62-0-design.md`
- Create: `docs/audits/2026-08-03-rodada-4b-playwright-1-62-0.md`
- Create: `docs/evidence/releases/2026-08-03-playwright-1-62-0.json`

- [x] **Registrar os resultados dos sete workflows.**
- [x] **Marcar Playwright 1.62.0 como concluído no roadmap.**
- [x] **Registrar ausência de impacto em Production.**
- [x] **Fechar o PR Dependabot #79 como substituído.**
- [ ] **Confirmar os checks no SHA documental final e concluir a revisão do PR #128.**

## Observações de execução

- uma especificação foi criada por engano diretamente na `main` e imediatamente removida antes da criação da branch;
- uma primeira tentativa de reaproveitar blobs do Dependabot foi descartada ao detectar regressão do Supabase CLI;
- os dois desvios estão descritos na auditoria, sem ocultação e sem impacto em Production.
