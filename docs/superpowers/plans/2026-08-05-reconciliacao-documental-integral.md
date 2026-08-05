# Reconciliação Documental Integral — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:verification-before-completion. A entrega é documental; nenhuma alteração funcional, de banco ou de Production integra este plano.

**Goal:** Reconciliar a documentação canônica do RADAR PDDE com o estado efetivo da `main`, da Vercel Production, do Supabase Production e das frentes ainda abertas em 5 de agosto de 2026.

**Architecture:** Os documentos executivos passam a apontar para um único baseline remoto e distinguem claramente código integrado, recurso publicado, operação comprovada e trabalho ainda pendente. Documentos históricos permanecem preservados e são classificados por uma matriz de validade, sem reescrever evidências antigas.

**Tech Stack:** Markdown, GitHub, Vercel, Supabase, contratos de arquitetura e evidências versionadas.

## Global Constraints

- Fonte de verdade: código remoto, ambientes efetivos, testes reproduzíveis e decisões vigentes.
- Branch isolada: `docs/reconciliacao-integral-20260805`.
- Escopo: somente documentação Markdown.
- Não alterar frontend, dependências, migrations, Auth, RLS, Edge Functions, dados ou configuração remota.
- Não realizar merge nem publicação sem autorização expressa.
- Registrar o PR nº 141 como trabalho em andamento enquanto permanecer aberto e não integrado.
- Preservar registros históricos; corrigir sua classificação, não seu conteúdo retrospectivo.

---

### Task 1: Fixar o baseline remoto

**Files:**
- Create: `docs/audits/2026-08-05-reconciliacao-documental-integral.md`

- [ ] Registrar o SHA da `main`, deployment Production, projeto Supabase, migrations, versões principais e Edge Function ativa.
- [ ] Diferenciar `main`, Production e PRs abertos.
- [ ] Listar as implementações dos PRs nº 136 a 140 e o estado do PR nº 141.

### Task 2: Reescrever o estado executivo

**Files:**
- Modify: `README.md`
- Modify: `docs/CURRENT_STAGE.md`
- Modify: `docs/PROJECT_CONTEXT.md`

- [ ] Remover incidentes e SHAs superados.
- [ ] Registrar Excel SME de 27 colunas, Gestão de Equipe corrigida e monitoramento contínuo.
- [ ] Definir confiabilidade funcional ponta a ponta como prioridade corrente.
- [ ] Explicitar o que está publicado, o que é ferramenta interna e o que permanece pendente.

### Task 3: Reconciliar governança e cronologia

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/DECISION_LOG.md`
- Modify: `docs/ROADMAP_ATUALIZACOES_2026.md`

- [ ] Atualizar o baseline operacional e a ordem de trabalho.
- [ ] Registrar decisões sobre garantia operacional, incidentes, integridade e confiabilidade funcional.
- [ ] Reclassificar atualizações menores abertas e a sequência técnica.
- [ ] Preservar a exigência de branch/PR isolados e autorização expressa para merge e Production.

### Task 4: Reconciliar índices e validade documental

**Files:**
- Modify: `docs/README.md`
- Modify: `docs/architecture/README.md`
- Modify: `docs/reference/STATUS_DOCUMENTOS.md`

- [ ] Atualizar a trilha de leitura obrigatória.
- [ ] Identificar documentos canônicos, vigentes, históricos e substituídos.
- [ ] Incluir monitoramento de Production e confiabilidade funcional no índice.

### Task 5: Reconciliar contratos Supabase e operação

**Files:**
- Modify: `docs/reference/SUPABASE_FUNCTIONAL_COVERAGE.md`
- Modify: `docs/reference/SUPABASE_INTEGRATION_AUDIT.md`
- Modify: `docs/reference/SUPABASE_PERMISSIONS_MATRIX.md`
- Modify: `docs/runbooks/SUPABASE_CONNECTION.md`

- [ ] Registrar 25 migrations em Production e `app_config.row_version = 20` na data de corte.
- [ ] Registrar `team-account-management` ativa, versão 95, JWT obrigatório.
- [ ] Documentar a correção integral da Gestão de Equipe e o monitor de preflight.
- [ ] Distinguir testes descartáveis de provas contínuas em Production.

### Task 6: Validar a reconciliação

- [ ] Conferir links relativos dos arquivos alterados.
- [ ] Procurar referências obsoletas a 30 colunas, incidente 404, deployments antigos e PRs já concluídos.
- [ ] Comparar a branch com a `main` e confirmar escopo exclusivamente Markdown.
- [ ] Abrir PR em rascunho com inventário de arquivos, fontes, limites e pendências.
- [ ] Não realizar merge.
