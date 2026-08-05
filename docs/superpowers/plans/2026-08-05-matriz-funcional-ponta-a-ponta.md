# Matriz Funcional Ponta a Ponta — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar um contrato canônico e verificável que ligue cada atividade crítica do usuário à superfície, perfil, serviço, repositório, backend, autorização, persistência, releitura, falha e evidência correspondente.

**Architecture:** A fonte canônica é um conjunto JSON versionado. Um script Node.js valida estrutura, perfis, caminhos, símbolos e evidências e gera uma visão Markdown determinística. O readiness bloqueia divergência entre matriz, código e documentação.

**Tech Stack:** Node.js 24, JSON, Markdown, `node:test`, GitHub Actions e contratos existentes do RADAR PDDE.

## Global Constraints

- Branch isolada: `feat/matriz-funcional-ponta-a-ponta-20260805-r2`.
- Base: `30bdecc1116bbcd007448d21db57326b28d9a003`, após integração dos PRs nº 141 e 142.
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

- [x] Definir perfis, superfícies, estados de cobertura e campos obrigatórios.
- [x] Implementar validação de IDs, perfis, caminhos, símbolos e evidências.
- [x] Gerar Markdown determinístico a partir do JSON.
- [x] Suportar `--write` e modo de conferência.

### Task 2: Mapear as jornadas críticas

**Files:**
- Create: `docs/reference/functional-contract-matrix/*.json`
- Create: `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`

- [x] Mapear autenticação, navegação, competência, leitura e exportações.
- [x] Mapear configurações, programas, escolas e carteiras.
- [x] Mapear bonificação, análise, consolidação e retificação.
- [x] Mapear pendências, tentativas, reanálise, contatos, cancelamento e reabertura.
- [x] Mapear notas fiscais, bens, encaminhamento e inventariação.
- [x] Mapear Gestão de Equipe, auditoria, importação e recuperação.
- [x] Incorporar monitoramento de Production e auditoria de vinte invariantes de integridade.
- [x] Classificar cobertura atual e próxima prova necessária.

### Task 3: Criar regressões da matriz

**Files:**
- Create: `tests/unit/functional-contract-matrix.test.js`

- [x] Testar que a matriz canônica de 41 operações é válida.
- [x] Testar rejeição de IDs duplicados e perfil desconhecido.
- [x] Testar rejeição de arquivo ou símbolo ausente.
- [x] Testar determinismo do Markdown.
- [x] Testar que mutações P0/P1 declaram releitura e tratamento de falha.

### Task 4: Integrar ao readiness

**Files:**
- Modify: `package.json`

- [x] Criar scripts `generate:functional-matrix` e `check:functional-matrix`.
- [x] Incluir o verificador no comando `check`.
- [x] Incluir `check:functional-matrix` no `test:readiness`.
- [x] Preservar versões e dependências.

### Task 5: Atualizar governança e sequência

**Files:**
- Modify: `docs/CURRENT_STAGE.md`
- Modify: `docs/ROADMAP_ATUALIZACOES_2026.md`
- Modify: `docs/README.md`
- Modify: `docs/reference/STATUS_DOCUMENTOS.md`
- Modify: `docs/architecture/testing.md`

- [ ] Registrar a matriz como contrato canônico executável.
- [ ] Atualizar baseline para 26 migrations e PR nº 141 integrado.
- [ ] Distinguir cobertura comprovada, parcial, lacuna e decisão pendente.
- [ ] Transformar lacunas em backlog das fases de leitura autenticada e escrita controlada.

### Task 6: Verificar e abrir PR

- [ ] Gerar e conferir `FUNCTIONAL_CONTRACT_MATRIX.md`.
- [ ] Executar os testes unitários específicos.
- [ ] Executar `npm run test:readiness`.
- [ ] Confirmar diff sem alteração funcional ou remota.
- [ ] Abrir PR em rascunho e aguardar workflows.
- [ ] Não realizar merge sem autorização expressa.
