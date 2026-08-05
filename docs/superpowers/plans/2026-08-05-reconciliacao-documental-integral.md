# Reconciliação Documental Integral — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:verification-before-completion. A entrega é documental; nenhuma alteração funcional, de banco ou de Production integra este plano.

**Goal:** Reconciliar a documentação canônica do RADAR PDDE com o estado efetivo da `main`, da Vercel Production, do Supabase Production e das frentes ainda abertas em 5 de agosto de 2026.

**Architecture:** Os documentos executivos apontam para um único baseline remoto e distinguem código integrado, recurso publicado, operação comprovada e trabalho pendente. Documentos históricos permanecem preservados e classificados por matriz de validade.

**Tech Stack:** Markdown, GitHub, Vercel, Supabase, contratos de arquitetura e evidências versionadas.

## Global Constraints

- Fonte de verdade: código remoto, ambientes efetivos, testes reproduzíveis e decisões vigentes.
- Branch isolada: `docs/reconciliacao-integral-20260805`.
- PR em rascunho: nº 142.
- Escopo: somente documentação Markdown.
- Não alterar frontend, dependências, migrations, Auth, RLS, Edge Functions, dados ou configuração remota.
- Não realizar merge nem publicação sem autorização expressa.
- Registrar o PR nº 141 como trabalho em andamento enquanto permanecer aberto e não integrado.
- Preservar registros históricos; corrigir sua classificação, não seu conteúdo retrospectivo.

---

### Task 1: Fixar o baseline remoto

- [x] Registrar SHA da `main`, deployment Production, projeto Supabase, migrations, versões e Edge Function.
- [x] Diferenciar `main`, Production e PRs abertos.
- [x] Listar PRs nº 136 a 140 e estado do PR nº 141.

### Task 2: Reescrever o estado executivo

- [x] Atualizar `README.md`, `CURRENT_STAGE.md` e `PROJECT_CONTEXT.md`.
- [x] Remover incidentes, SHAs e deployments superados.
- [x] Registrar Excel SME de 27 colunas, Gestão de Equipe corrigida e monitoramento contínuo.
- [x] Definir confiabilidade funcional ponta a ponta como prioridade.
- [x] Distinguir publicado, comprovado, ferramenta interna e pendente.

### Task 3: Reconciliar governança e cronologia

- [x] Atualizar `AGENTS.md`, `DECISION_LOG.md` e roadmap.
- [x] Registrar ADRs de garantia operacional, confiabilidade e precedência remota.
- [x] Reclassificar atualizações menores e a sequência técnica.
- [x] Preservar branch/PR isolados e autorização expressa para merge/Production.

### Task 4: Reconciliar índices e validade documental

- [x] Atualizar `docs/README.md` e `docs/architecture/README.md`.
- [x] Reescrever `STATUS_DOCUMENTOS.md`.
- [x] Classificar canônicos, referências, runbooks, procedimentos históricos, evidências e trabalhos em andamento.
- [x] Incluir monitoramento e confiabilidade funcional na trilha de leitura.

### Task 5: Reconciliar contratos Supabase, frontend e Excel

- [x] Atualizar cobertura, auditoria, permissões e dicionário do Supabase.
- [x] Atualizar runbooks de conexão e migrations.
- [x] Registrar 25 migrations, `row_version = 20` e Edge Function v95.
- [x] Documentar a correção integral da Gestão de Equipe.
- [x] Atualizar contrato do Excel SME e sua homologação final.
- [x] Reconciliar ordem de carregamento, extensões, testes e readiness.
- [x] Atualizar catálogo de superfícies, classificação de mudanças e ambientes.

### Task 6: Validar a reconciliação

- [x] Conferir os links novos e os principais links alterados contra a árvore da branch.
- [x] Procurar e corrigir referências vigentes a 30 colunas, 404 aberto, deployments antigos e gates já cumpridos.
- [x] Comparar branch com `main`: 31 arquivos alterados, todos Markdown, zero commits atrás.
- [x] Confirmar que `main` permaneceu em `f812e5dbf3aaa18fb9851948445b0820ac7a5435` antes do PR.
- [x] Abrir o PR nº 142 em rascunho com fontes, limites e pendências.
- [x] Não realizar merge ou deployment.

## Estado

A implementação documental está registrada no PR nº 142. A conclusão técnica depende dos workflows do SHA final e da revisão do diff; o PR permanece em rascunho e sem autorização de merge.
