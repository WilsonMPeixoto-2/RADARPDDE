# Rodada 4A — Reconciliação canônica do roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidar as listas técnica e funcional em um roadmap canônico, atualizar o estado documental posterior às Rodadas 0, 1, 2 e 3B e instituir avaliação tecnológica proativa em todas as tarefas futuras.

**Architecture:** A implementação é exclusivamente documental. `docs/ROADMAP_ATUALIZACOES_2026.md` será a fonte única do portfólio de atualizações; `CURRENT_STAGE.md` continuará controlando a etapa corrente; `DECISION_LOG.md` registrará as decisões duradouras; `AGENTS.md` transformará a nova regra em comportamento operacional; os índices e a matriz documental garantirão encontrabilidade e precedência.

**Tech Stack:** Markdown, GitHub, documentação canônica do RADAR PDDE.

## Global Constraints

- Não alterar código funcional, dependências, lockfile, migrations, dados, Auth, RLS, Edge Functions ou configuração de deployment.
- Não acessar nem modificar Supabase Production.
- Não publicar Vercel Production.
- Usar GitHub remoto como fonte de verdade.
- Preservar documentos históricos; não reescrever planos anteriores para parecerem atuais.
- Registrar explicitamente diferença entre integrado à `main` e publicado em Production.
- Não transformar candidato funcional em escopo aprovado sem decisão específica.

---

### Task 1: Criar o roadmap canônico

**Files:**
- Create: `docs/ROADMAP_ATUALIZACOES_2026.md`

**Interfaces:**
- Consumes: listas técnica e funcional aprovadas; PRs e commits das Rodadas 0, 1, 2 e 3B.
- Produces: taxonomia única de status, prioridade, implantação, dependências e próxima decisão.

- [ ] **Step 1: Registrar a finalidade e as regras de uso**

Incluir escopo, precedência, taxonomia de status, prioridade e implantação.

- [ ] **Step 2: Reconciliar a lista técnica**

Registrar cada atualização, ferramenta e decisão de manutenção com status atual, evidência e próxima ação.

- [ ] **Step 3: Reconciliar a lista funcional**

Registrar cada frente de modernização e evolução funcional, distinguindo concluído, parcial, adiado e pendente de avaliação.

- [ ] **Step 4: Registrar a sequência aprovada**

Definir a ordem posterior à Rodada 4A sem autorizar automaticamente as implementações.

- [ ] **Step 5: Revisar integralidade**

Confirmar que nenhum item das duas listas foi omitido e que todas as Rodadas 0, 1, 2 e 3B possuem referências verificáveis.

- [ ] **Step 6: Commit**

```bash
git add docs/ROADMAP_ATUALIZACOES_2026.md
git commit -m "docs: consolidar roadmap técnico e funcional de 2026"
```

### Task 2: Atualizar o estado corrente

**Files:**
- Modify: `docs/CURRENT_STAGE.md`

**Interfaces:**
- Consumes: roadmap criado na Task 1 e estado real de GitHub/Vercel/Supabase.
- Produces: estado executivo posterior às Rodadas 0, 1, 2 e 3B e próxima sequência documental.

- [ ] **Step 1: Atualizar data e referências operacionais**

Registrar `main` após a Rodada 3B, deployment Production vigente e distinção entre conteúdo publicado e ferramenta interna.

- [ ] **Step 2: Registrar as rodadas concluídas**

Incluir Rodadas 0, 1, 2 e 3B, seus escopos, commits, PRs e efeitos em Production.

- [ ] **Step 3: Registrar o estágio atual**

Apontar o novo roadmap como controlador do portfólio e Playwright como próxima atualização técnica pendente, sem reduzir a frente global a esse único item.

- [ ] **Step 4: Preservar gates de release**

Manter UAT, Advisors quando aplicável, homologação do relatório institucional e decisão formal separados do roadmap de atualização.

- [ ] **Step 5: Commit**

```bash
git add docs/CURRENT_STAGE.md
git commit -m "docs: atualizar estado após rodadas de modernização"
```

### Task 3: Instituir decisões duradouras

**Files:**
- Modify: `docs/DECISION_LOG.md`

**Interfaces:**
- Consumes: ADR-038 existente e regra aprovada na especificação.
- Produces: referências às decisões de integração pertinente e evolução tecnológica proativa.

- [ ] **Step 1: Atualizar data**

Alterar a data de referência para 3 de agosto de 2026.

- [ ] **Step 2: Incorporar ADR-038 ao índice acumulado**

Resumir que atualizações devem produzir integração pertinente, sem adoção artificial de recursos.

- [ ] **Step 3: Criar ADR-039**

Registrar a obrigação de avaliar e propor tecnologia moderna quando ela melhorar materialmente correções, layout, segurança, desempenho, acessibilidade, manutenção ou novas capacidades.

- [ ] **Step 4: Registrar limites de autorização**

Explicitar que a proposta não autoriza instalação, ampliação silenciosa de escopo nem alteração de Production.

- [ ] **Step 5: Commit**

```bash
git add docs/DECISION_LOG.md
git commit -m "docs: decidir evolução tecnológica proativa"
```

### Task 4: Tornar a regra operacional para agentes

**Files:**
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: roadmap, ADR-038 e ADR-039.
- Produces: comportamento obrigatório em futuras tarefas.

- [ ] **Step 1: Inserir o roadmap na leitura obrigatória**

Adicionar `docs/ROADMAP_ATUALIZACOES_2026.md` imediatamente após `CURRENT_STAGE.md`.

- [ ] **Step 2: Atualizar o estado de referência**

Registrar Rodadas 0, 1, 2 e 3B e a situação correta de Production.

- [ ] **Step 3: Adicionar avaliação tecnológica proativa**

Exigir que correções e melhorias avaliem limites da tecnologia atual e apresentem proposta de instalação ou atualização quando houver ganho material.

- [ ] **Step 4: Preservar governança**

Exigir análise de benefício, custo, risco, bundle, dados, permissões, testes, rollback e implantação antes de qualquer adoção.

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md
git commit -m "docs: orientar propostas tecnológicas em toda tarefa"
```

### Task 5: Atualizar índices e validade documental

**Files:**
- Modify: `docs/README.md`
- Modify: `docs/reference/STATUS_DOCUMENTOS.md`

**Interfaces:**
- Consumes: documentos criados e atualizados nas Tasks 1–4.
- Produces: encontrabilidade, classificação canônica e ordem de leitura coerente.

- [ ] **Step 1: Atualizar o índice documental**

Incluir roadmap, rodadas recentes e evidências correspondentes.

- [ ] **Step 2: Atualizar a matriz de validade**

Classificar o roadmap como canônico e registrar especificação, plano e auditoria como histórico/evidência da Rodada 4A.

- [ ] **Step 3: Atualizar datas e estados superados**

Remover afirmações que ainda situem o projeto antes das Rodadas 0, 1, 2 e 3B.

- [ ] **Step 4: Commit**

```bash
git add docs/README.md docs/reference/STATUS_DOCUMENTOS.md
git commit -m "docs: indexar roadmap e rodadas de atualização"
```

### Task 6: Registrar auditoria e verificar o diff

**Files:**
- Create: `docs/audits/2026-08-03-rodada-4a-roadmap-atualizacoes.md`

**Interfaces:**
- Consumes: diff final das Tasks 1–5.
- Produces: evidência de escopo, integralidade e ausência de impacto operacional.

- [ ] **Step 1: Registrar fontes confrontadas**

Listar documentos originais, PRs, commits, deployment e arquivos canônicos.

- [ ] **Step 2: Registrar resultado da reconciliação**

Documentar o total de itens por status e a sequência recomendada.

- [ ] **Step 3: Verificar escopo**

Confirmar que somente Markdown foi alterado e que não houve operação em Production.

- [ ] **Step 4: Verificar consistência**

Comparar roadmap, `CURRENT_STAGE.md`, `DECISION_LOG.md`, `AGENTS.md`, índice e matriz de validade; eliminar contradições, placeholders e links incorretos.

- [ ] **Step 5: Commit**

```bash
git add docs/audits/2026-08-03-rodada-4a-roadmap-atualizacoes.md
git commit -m "docs: auditar reconciliação do roadmap"
```

### Task 7: Abrir PR da Rodada 4A

**Files:**
- No additional file required unless final evidence identifies inconsistency.

**Interfaces:**
- Consumes: branch documental verificada.
- Produces: PR revisável, sem merge ou deployment automático.

- [ ] **Step 1: Comparar branch com `main`**

Confirmar que todos os arquivos alterados são Markdown e pertencem ao escopo.

- [ ] **Step 2: Revisar links e referências**

Validar caminhos para roadmap, especificação, plano, auditorias e decisões.

- [ ] **Step 3: Abrir PR**

Descrever objetivo, documentos alterados, regra tecnológica, limites e ausência de impacto em Production.

- [ ] **Step 4: Verificar checks disponíveis**

Registrar explicitamente quando não houver workflow associado ao SHA documental.
