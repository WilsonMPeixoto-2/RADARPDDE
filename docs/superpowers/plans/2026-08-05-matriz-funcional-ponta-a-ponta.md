# Matriz Funcional Ponta a Ponta — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar um contrato canônico e verificável que ligue cada atividade crítica do usuário à superfície, perfil, serviço, repositório, backend, autorização, persistência, releitura, falha e evidência correspondente.

**Architecture:** A fonte canônica será um arquivo JSON versionado. Um script Node.js validará estrutura, perfis, caminhos, símbolos e evidências e gerará uma visão Markdown determinística. O readiness bloqueará divergência entre matriz, código e documentação.

**Tech Stack:** Node.js 24, JSON, Markdown, `node:test`, GitHub Actions e contratos existentes do RADAR PDDE.

## Global Constraints

- Branch isolada: `feat/matriz-funcional-ponta-a-ponta-20260805`.
- Base: merge do PR nº 142, commit `2e7b18ffa4b81300cf44c96ffde9c222cf98b895`.
- Não alterar regra funcional, Auth, RLS, migrations, Edge Functions, dados ou Production.
- A matriz deve ser derivada do código e dos contratos executáveis.
- Todo item crítico deve declarar perfis permitidos e negados.
- Toda mutação deve declarar persistência, releitura, concorrência e compensação.
- Lacunas devem ser explícitas e alimentar as fases seguintes.
- Nenhum merge sem autorização expressa.

---

### Task 1: Definir a fonte canônica da matriz

**Files:**
- Create: `docs/reference/functional-contract-matrix.json`
- Create: `scripts/check-functional-contract-matrix.mjs`

**Interfaces:**
- Consumes: arquivos do repositório, serviços de aplicação, adaptadores e testes existentes.
- Produces: `loadMatrix()`, `validateMatrix()`, `renderMarkdown()` e `main()`.

- [ ] **Step 1:** definir perfis, superfícies, estados de cobertura e campos obrigatórios.
- [ ] **Step 2:** implementar validação de IDs, perfis, criticidade, caminhos e símbolos.
- [ ] **Step 3:** gerar Markdown determinístico a partir do JSON.
- [ ] **Step 4:** suportar `--write` para regeneração e modo padrão para conferência.

### Task 2: Mapear as jornadas críticas

**Files:**
- Modify: `docs/reference/functional-contract-matrix.json`
- Create: `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`

**Interfaces:**
- Consumes: serviços `ConfigurationService`, `DirectoryService`, `SchoolService`, `VerificationService`, `PendencyService`, `InvoiceService`, `InventoryService`, `AuditService`, Auth, exportações e workflows.
- Produces: catálogo canônico por operação.

- [ ] **Step 1:** mapear autenticação, navegação, competência, consulta e exportações.
- [ ] **Step 2:** mapear configurações, programas, escolas e carteiras.
- [ ] **Step 3:** mapear bonificação, análise, consolidação e retificação.
- [ ] **Step 4:** mapear pendências, tentativas, reanálise, contatos, cancelamento e reabertura.
- [ ] **Step 5:** mapear notas fiscais, bens, encaminhamento e inventariação.
- [ ] **Step 6:** mapear Gestão de Equipe, auditoria, importação e recuperação.
- [ ] **Step 7:** classificar cobertura atual e próxima prova necessária.

### Task 3: Criar regressões da matriz

**Files:**
- Create: `tests/unit/functional-contract-matrix.test.js`

**Interfaces:**
- Consumes: funções exportadas por `scripts/check-functional-contract-matrix.mjs`.
- Produces: regressões de estrutura, referências, símbolos, cobertura e geração.

- [ ] **Step 1:** testar que a matriz canônica é válida.
- [ ] **Step 2:** testar rejeição de IDs duplicados e perfil desconhecido.
- [ ] **Step 3:** testar rejeição de arquivo ou símbolo ausente.
- [ ] **Step 4:** testar determinismo do Markdown.
- [ ] **Step 5:** testar que mutações P0/P1 declaram releitura e tratamento de falha.

### Task 4: Integrar ao readiness

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: scripts `generate:functional-matrix` e `check:functional-matrix`.

- [ ] **Step 1:** incluir o verificador no comando `check`.
- [ ] **Step 2:** incluir `check:functional-matrix` no `test:readiness`.
- [ ] **Step 3:** preservar todas as versões e dependências existentes.

### Task 5: Atualizar governança e próxima sequência

**Files:**
- Modify: `docs/CURRENT_STAGE.md`
- Modify: `docs/ROADMAP_ATUALIZACOES_2026.md`
- Modify: `docs/README.md`
- Modify: `docs/reference/STATUS_DOCUMENTOS.md`
- Modify: `docs/architecture/testing.md`

- [ ] **Step 1:** registrar a matriz como contrato canônico executável.
- [ ] **Step 2:** distinguir cobertura comprovada, parcial e lacuna.
- [ ] **Step 3:** transformar as lacunas em backlog das fases de leitura autenticada e escrita controlada.
- [ ] **Step 4:** manter o PR nº 141 como frente independente.

### Task 6: Verificar e abrir PR

- [ ] **Step 1:** executar `node scripts/check-functional-contract-matrix.mjs --write`.
- [ ] **Step 2:** executar `node --test tests/unit/functional-contract-matrix.test.js`.
- [ ] **Step 3:** executar `npm run test:readiness`.
- [ ] **Step 4:** confirmar diff sem alteração funcional ou remota.
- [ ] **Step 5:** abrir PR em rascunho e aguardar workflows.
- [ ] **Step 6:** não realizar merge sem autorização expressa.
