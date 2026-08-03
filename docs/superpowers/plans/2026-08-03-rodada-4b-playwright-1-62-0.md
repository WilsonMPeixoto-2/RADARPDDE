# Rodada 4B — Playwright 1.62.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atualizar o runner E2E do RADAR PDDE para Playwright 1.62.0 sem alterar o produto nem os ambientes remotos.

**Architecture:** A versão direta e as dependências internas `playwright` e `playwright-core` permanecem fixadas no lockfile. A matriz existente de Chromium desktop/mobile e WebKit mobile continua inalterada. A validação ocorre no CI do PR, incluindo gates de produto, Supabase descartável, Excel, Lighthouse e perfis/viewports.

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

Confirmado Playwright 1.62.0 nas release notes oficiais e no npm.

- [x] **Step 2: Reaplicar o lockfile oficial gerado pelo Dependabot**

Aplicar os blobs de `package.json` e `package-lock.json` do PR #79 sobre a `main` atual, preservando todos os demais arquivos.

- [ ] **Step 3: Verificar instalação e versão efetiva no CI**

Esperado:

```text
npm ci: exit 0
npx playwright --version: Version 1.62.0
```

### Task 2: Executar gates do PR

**Files:**
- No production-code changes expected.

- [ ] **Step 1: Saúde das dependências**
- [ ] **Step 2: E2E Playwright completo**
- [ ] **Step 3: Cinco perfis em desktop, Android e iPhone**
- [ ] **Step 4: Lighthouse mobile e desktop**
- [ ] **Step 5: Supabase readiness**
- [ ] **Step 6: Backup e restauração descartáveis**
- [ ] **Step 7: Homologação automatizada do Excel SME**

### Task 3: Reconciliar documentação e encerrar o PR antigo

**Files:**
- Modify: `docs/CURRENT_STAGE.md`
- Modify: `docs/ROADMAP_ATUALIZACOES_2026.md`
- Create: `docs/audits/2026-08-03-rodada-4b-playwright-1-62-0.md`
- Create: `docs/evidence/releases/2026-08-03-playwright-1-62-0.json`

- [ ] **Step 1: Registrar resultados reais dos workflows**
- [ ] **Step 2: Marcar Playwright 1.62.0 como concluído no roadmap**
- [ ] **Step 3: Registrar ausência de impacto em Production**
- [ ] **Step 4: Fechar o PR Dependabot #79 como substituído**
- [ ] **Step 5: Revisar diff final e confirmar branch zero commits atrás**
