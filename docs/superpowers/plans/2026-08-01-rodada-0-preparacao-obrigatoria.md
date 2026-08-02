# Rodada 0 — Preparação Obrigatória Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preparar o repositório para as rodadas de atualização, corrigindo gates quebrados, validando referências de workflows, registrando a linha de base e classificando PRs automáticos sem alterar o comportamento funcional ou produção.

**Architecture:** A rodada cria um verificador nativo de referências locais usadas por GitHub Actions, integra-o aos checks existentes e corrige o workflow do Excel SME. A documentação registra baseline, riscos e destino dos PRs Dependabot atualmente abertos. Nenhuma dependência nova, migration, configuração Supabase remota ou artefato funcional será introduzido.

**Tech Stack:** Node.js 24, `node:test`, GitHub Actions, npm scripts, Markdown.

## Global Constraints

- Não alterar regras de negócio, interface, persistência, dados, Supabase remoto ou Vercel Production.
- Não atualizar pacotes nesta rodada; apenas preparar a base para atualizações posteriores.
- Não adicionar dependências npm.
- Toda alteração deve ocorrer em branch própria e PR isolado.
- O workflow do Excel SME deve refletir que a homologação desktop e a publicação já foram concluídas.
- Referências locais inválidas em workflows devem falhar com mensagem objetiva.

---

### Task 1: Verificador de referências dos workflows

**Files:**
- Create: `scripts/check-workflow-references.mjs`
- Create: `tests/unit/workflow-references.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces: comando `npm run check:workflow-references`.
- Consumes: arquivos `.github/workflows/*.yml` e `.github/workflows/*.yaml`.

- [ ] **Step 1:** Criar testes para referência existente, referência inexistente e exclusão de caminhos dinâmicos.
- [ ] **Step 2:** Implementar parser conservador para comandos locais `node`, `node --test`, redirecionamentos de tipos e caminhos explícitos em `path:`/`cache-dependency-path:`.
- [ ] **Step 3:** Garantir saída legível e código diferente de zero quando houver referência inválida.
- [ ] **Step 4:** Registrar script no `package.json` e incluir o próprio arquivo no `npm run check`.
- [ ] **Step 5:** Executar testes unitários e o verificador contra o repositório.

### Task 2: Reparar homologação do Excel SME

**Files:**
- Modify: `.github/workflows/excel-sme-homologation.yml`

**Interfaces:**
- Consumes: testes reais presentes em `tests/unit`.
- Produces: workflow acionável sem referência inexistente e resumo coerente com o estado publicado.

- [ ] **Step 1:** Remover `tests/unit/excel-sme-original-contract.test.js`, inexistente na `main`.
- [ ] **Step 2:** Preservar os sete testes reais e a certificação integral.
- [ ] **Step 3:** Substituir a mensagem de gate desktop pendente por registro de homologação concluída, mantendo a automação como proteção regressiva.
- [ ] **Step 4:** Executar o verificador de referências e testes específicos do Excel SME.

### Task 3: Integrar o gate preventivo

**Files:**
- Modify: `.github/workflows/validate.yml`
- Modify: `.github/workflows/dependency-health.yml`

**Interfaces:**
- Consumes: `npm run check:workflow-references`.
- Produces: validação em PRs que alterem workflows, scripts ou package metadata.

- [ ] **Step 1:** Incluir caminhos do novo script/teste nos filtros relevantes.
- [ ] **Step 2:** Executar o verificador na validação principal.
- [ ] **Step 3:** Executar o verificador na saúde de dependências antes de auditorias longas.
- [ ] **Step 4:** Confirmar permissões mínimas e ausência de mudanças em deploy.

### Task 4: Baseline e classificação das atualizações pendentes

**Files:**
- Create: `docs/audits/2026-08-01-rodada-0-baseline.md`
- Modify: `docs/DECISION_LOG.md`

**Interfaces:**
- Produces: registro canônico da linha de base e do destino dos PRs Dependabot #52, #79, #81 e #83.

- [ ] **Step 1:** Registrar Node, dependências diretas, ferramentas, workflows e gates existentes.
- [ ] **Step 2:** Registrar o defeito corrigido e o novo controle preventivo.
- [ ] **Step 3:** Classificar PRs Dependabot antigos como candidatos a recriação/rebase em rodadas posteriores, sem merge nesta rodada.
- [ ] **Step 4:** Registrar explicitamente itens fora do escopo e ausência de alteração funcional/produção.

### Task 5: Verificação e fechamento

**Files:**
- Review: todos os arquivos alterados na branch.

**Interfaces:**
- Produces: PR isolado e verificável.

- [ ] **Step 1:** Revisar diff completo e procurar referências obsoletas.
- [ ] **Step 2:** Executar checks acionados pelo PR e inspecionar logs.
- [ ] **Step 3:** Corrigir falhas atribuíveis à rodada.
- [ ] **Step 4:** Confirmar que apenas preparação, CI e documentação foram alterados.
- [ ] **Step 5:** Integrar somente após todos os gates aplicáveis aprovarem.
