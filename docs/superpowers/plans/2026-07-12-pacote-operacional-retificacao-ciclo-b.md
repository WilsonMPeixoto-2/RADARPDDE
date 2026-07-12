# Pacote Operacional, Retificação e Ciclo B — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Concluir as Tasks 10–13 do Ciclo A e incorporar Dashboard e Carteira do Ciclo B sobre um único modelo operacional compartilhado, com cancelamento, reabertura, contatos, retificação auditável e documentação atualizada.

**Architecture:** Dois módulos puros concentram o domínio: `operational-projection.js` deriva contagens, próxima ação, antiguidade e última movimentação; `retificacoes.js` controla permissão, comparação antes/depois e histórico auditável. Extensões de integração adicionam as ações às superfícies existentes sem reestruturar integralmente `app.js`, enquanto Dashboard, Carteira, Pendências e Prontuário consomem os mesmos helpers.

**Tech Stack:** JavaScript UMD/CommonJS, DOM existente, `node:test`, Playwright 1.61, HTML/CSS atuais, `localStorage` vigente.

## Global Constraints

- Branch: `feature/ciclo-a-pacote-operacional-retificacao`.
- Não ativar Supabase, autenticação real ou matriz definitiva de permissões.
- Retificação permitida ao perfil `assistente` nesta fase, por helper único.
- Não alterar regras de bonificação, estrutura do Excel ou `INITIAL_DATA_VERSION` sem necessidade comprovada.
- Pendências e retificações não se resolvem mutuamente de forma automática.
- Não criar estado `Vencida`.
- Preservar dados legados e migrações idempotentes.
- TDD obrigatório: teste falhando antes da implementação de cada comportamento.
- Nenhum merge ou deploy em produção sem autorização expressa.

---

### Task 1: Projeção operacional compartilhada

**Files:**
- Create: `tests/operational-projection.test.js`
- Create: `src/domain/operational-projection.js`
- Modify: `.github/workflows/validate.yml`

**Interfaces:**
- Produces `buildOperationalProjection(input)`, `buildSchoolProjection(input)`, `getConcreteNextAction(context)`, `getOperationalBaseDate(pendency)`, `sortOperationalActions(records)`.

- [ ] Escrever testes RED para contagens separadas `Aberta`/`Aguardando reanálise`, próxima ação concreta e data-base por estado.
- [ ] Confirmar falha por módulo inexistente no CI.
- [ ] Implementar módulo UMD puro sem DOM ou `localStorage`.
- [ ] Confirmar GREEN e adicionar testes de prioridade, última movimentação e contexto legado.
- [ ] Atualizar validação sintática permanente.
- [ ] Commit: `feat: criar projeção operacional compartilhada`.

### Task 2: Domínio auditável de retificações

**Files:**
- Create: `tests/retificacoes.test.js`
- Create: `src/domain/retificacoes.js`
- Modify: `.github/workflows/validate.yml`

**Interfaces:**
- Produces `canRetify(profile)`, `createRetification(input, audit)`, `applyRetification(verification, changes, audit)`, `listChangedFields(before, after)`.

- [ ] Escrever testes RED para permissão exclusiva do Assistente, justificativa obrigatória, comparação antes/depois e preservação do estado anterior.
- [ ] Confirmar RED no CI.
- [ ] Implementar funções puras e imutáveis.
- [ ] Testar que pendências e análise técnica não são alteradas.
- [ ] Confirmar GREEN.
- [ ] Commit: `feat: criar domínio de retificação administrativa`.

### Task 3: Contatos, cancelamento e reabertura nas Pendências

**Files:**
- Create: `tests/e2e/task-10-11-pendencias.spec.js`
- Create: `src/integration/task-10-11-pendency-actions.js`
- Create: `src/styles/task-10-11-pendency-actions.css`
- Modify: `config.js`
- Modify: `.github/workflows/validate.yml`

**Interfaces:**
- Produces `openPendencyContactModal`, `savePendencyContact`, `openCancelPendencyModal`, `confirmCancelPendency`, `openReopenPendencyModal`, `confirmReopenPendency`.

- [ ] Criar E2E RED para registrar contato em `Aberta` e `Aguardando reanálise` sem mudar status.
- [ ] Implementar modal acessível e timeline atualizada.
- [ ] Criar E2E RED para cancelar pendência ativa com justificativa e removê-la das filas ativas.
- [ ] Implementar cancelamento usando `RadarPendencias.cancelPendency`.
- [ ] Criar E2E RED para reabrir resolvida com erros válidos e preservar histórico.
- [ ] Implementar reabertura usando `RadarPendencias.reopenPendency`.
- [ ] Validar foco, confirmação, mensagens e mobile.
- [ ] Commit: `feat: materializar contatos cancelamento e reabertura`.

### Task 4: Retificação no Prontuário

**Files:**
- Create: `tests/e2e/task-12-13-retificacoes.spec.js`
- Create: `src/integration/task-12-13-retificacoes.js`
- Create: `src/styles/task-12-13-retificacoes.css`
- Modify: `config.js`
- Modify: `.github/workflows/validate.yml`

**Interfaces:**
- Produces `openRetificationModal`, `previewRetification`, `confirmRetification`, `renderRetificationHistory`.

- [ ] Criar E2E RED: Assistente visualiza `Retificar consolidação`; Controlador não visualiza.
- [ ] Bloquear edição silenciosa de consolidação pelo Assistente, direcionando ao fluxo auditável.
- [ ] Exibir antes/depois e exigir justificativa.
- [ ] Persistir retificação em `verificacao.retificacoes`, registrar log e recalcular somente resultado derivado.
- [ ] Mostrar histórico no Prontuário.
- [ ] Comprovar que pendências e análise técnica permanecem inalteradas.
- [ ] Commit: `feat: adicionar retificação auditável no prontuário`.

### Task 5: Dashboard operacional do Controlador

**Files:**
- Create: `tests/e2e/cycle-b-dashboard.spec.js`
- Create: `src/integration/cycle-b-dashboard.js`
- Create: `src/styles/cycle-b-dashboard.css`
- Modify: `config.js`
- Modify: `.github/workflows/validate.yml`

**Interfaces:**
- Consumes `RadarOperationalProjection`.
- Produces cartões separados, fila de próximas ações e transporte de filtro à Carteira.

- [ ] Criar E2E RED para cartões `Pendências abertas` e `Aguardando reanálise` separados.
- [ ] Implementar cartões acionáveis sem somar contagens sobrepostas.
- [ ] Criar fila ordenada de próximas ações com escola, contexto, antiguidade e ação principal.
- [ ] Transportar recorte para Carteira.
- [ ] Validar contexto e mobile.
- [ ] Commit: `feat: transformar dashboard em fila operacional`.

### Task 6: Carteira de Escolas integrada

**Files:**
- Create: `tests/e2e/cycle-b-carteira.spec.js`
- Create: `src/integration/cycle-b-carteira.js`
- Create: `src/styles/cycle-b-carteira.css`
- Modify: `config.js`
- Modify: `.github/workflows/validate.yml`

**Interfaces:**
- Consumes `RadarOperationalProjection`.
- Produces filtros por situação documental e pendência, colunas compartilhadas, navegação ao Prontuário e Pendências.

- [ ] Criar E2E RED para filtros `Aberta`, `Aguardando reanálise` e `Sem pendência ativa`.
- [ ] Adicionar busca por INEP sem regressão da busca por nome/designação.
- [ ] Exibir situação documental, abertas, para reanalisar, última movimentação e próxima ação.
- [ ] Preservar filtros no retorno do Prontuário e Pendências.
- [ ] Usar cartões no mobile e impedir overflow global.
- [ ] Commit: `feat: integrar carteira ao modelo operacional`.

### Task 7: Alertas e Visão por Competência

**Files:**
- Create: `tests/e2e/task-10-alertas-competencias.spec.js`
- Create: `src/integration/task-10-alerts-competence.js`
- Modify: `config.js`
- Modify: `.github/workflows/validate.yml`

- [ ] Criar E2E RED para alerta diferenciado de aberta e aguardando reanálise.
- [ ] Usar próxima ação concreta e antiguidade operacional relevante.
- [ ] Remover semântica de perigo automático para mera antiguidade.
- [ ] Confirmar contagens e passivo anterior após cancelar/reabrir.
- [ ] Commit: `feat: alinhar alertas e competências ao ciclo operacional`.

### Task 8: README e biblioteca documental

**Files:**
- Modify: `README.md`
- Create: `docs/README.md`
- Create: `docs/architecture/modelo-operacional.md`
- Create: `docs/architecture/retificacoes.md`
- Create: `docs/reference/STATUS_DOCUMENTOS.md`
- Add when available: `docs/reports/RADAR_PDDE_Relatorio_Guia_Ciclo_A_v1_0.docx`
- Add when available: documentos canônicos e protótipo Excel.

- [ ] Atualizar README como porta de entrada institucional e funcional.
- [ ] Registrar precedência documental, estado atual, persistência e limitações.
- [ ] Criar índice dos documentos e roadmap por pacotes.
- [ ] Incluir binários disponíveis sem inventar arquivos ausentes.
- [ ] Commit: `docs: organizar readme e biblioteca documental`.

### Task 9: Regressão e PR

**Files:**
- Modify only defects comprovados em código/testes.

- [ ] Executar sintaxe de todos os módulos novos.
- [ ] Executar `node --test tests/*.test.js`.
- [ ] Executar Playwright completo em desktop Chromium, Android Chromium e iPhone WebKit.
- [ ] Auditar `Vencida`, resolução direta, alteração automática da bonificação e edição silenciosa.
- [ ] Validar Preview Vercel sem erros de console, overlays presos ou overflow global.
- [ ] Abrir PR em rascunho com resultados exatos.
- [ ] Aguardar autorização para merge.

## Self-review

- Todas as regras da especificação possuem tarefa e teste correspondente.
- O pacote permanece dividido por domínio, embora entregue em um único PR.
- Nenhum placeholder ou decisão aberta foi mantido.
- Dashboard, Carteira, Pendências e Prontuário consomem o mesmo modelo derivado.
- Retificação permanece independente de pendências e análise técnica.
