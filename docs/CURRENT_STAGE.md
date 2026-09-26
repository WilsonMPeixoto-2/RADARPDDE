# RADAR PDDE — estado atual e retomada

**Classe documental:** Canônico — estado mutável  
**Atualizado em:** 25 de setembro de 2026

## 1. Baseline confirmada

- `main`: `bb7246438b8c6b72ef068b21bb40d492a7049af2` — merge do PR #374.
- Production confirmada no mesmo SHA `bb7246438b8c6b72ef068b21bb40d492a7049af2`.
- Deployment Production: `dpl_BztNyEgnHjFxAKJvkPcQGeV6GGWm`, estado `READY`, projeto Vercel `radarpdde-fix`.
- Nenhum commit dos PRs #375 ou #376 está em `main` ou Production.
- Production continua usando Supabase como persistência canônica. Os PRs #375/#376 não alteram schema, migrations, RPCs, RLS, serviços de domínio nem persistência.

## 2. Frente ativa

A frente corrente é o fechamento da auditoria UX da jornada **Despesa a identificar**, em dois PRs empilhados e ainda em draft.

### PR #375 — contexto escolar e drawer mobile

- URL: https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/375
- base: `main`
- branch: `fix/pendency-context-mobile-preview-2026-09-25`
- head atual: `3b369122acca81b1d07668e8c88fc64c55b06121`
- estado: aberto, draft, mergeable
- escopo: NAV-01 + UX-04
- NAV-01: o filtro escolar de Pendências passa a viver em `pageState.filters.schoolId` e sobrevive a rerenders internos, abertura/fechamento do detalhe e navegação contextual.
- UX-04: o drawer móvel de Pendência deixa de ser comprimido por `max-width: 44vw` e ocupa a largura útil em telas pequenas.
- o último ajuste restaura a fixture real do E2E do filtro escolar após um checkpoint intermediário ter partido de árvore anterior.

**Validação final do head #375:** todos os workflows associados ao SHA atual concluíram com sucesso. O E2E desktop terminou com **181 passed, 54 skipped, 0 failed**. A publicação automática da Vercel para branches continua deliberadamente ignorada pela política do projeto; isso não é falha do código.

### PR #376 — refinamento da jornada desktop

- URL: https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/376
- base: branch do PR #375
- branch: `fix/desktop-expense-journey-2026-09-25`
- head atual: `f183e4b11b7c3ea91113ed98fa63031d0e3479d7`
- estado: aberto, draft, mergeable
- escopo: UX-01, UX-02, UX-03, UX-05, UX-06 e D-01
- foco de aceitação desta frente: **desktop**
- nenhuma revisão geral de mobile deve ser reaberta aqui; UX-04 permanece no #375.

Implementado no #376:

1. **UX-01** — cópia distinta para cadastro e retificação. Editar deixa explícito que o mesmo lançamento e a mesma Pendência são preservados.
2. **UX-02** — modal da despesa mostra escola, competência e programa.
3. **UX-03** — descrição provisória vira identificador principal da linha de `Despesa a identificar`; a natureza provisória fica como informação secundária.
4. **UX-05** — Prontuário explicita o recorte de Pendências ativas da escola; Pendências Operacionais explicita a fila transversal/histórica e mostra a identidade da despesa vinculada.
5. **UX-06** — reanálise destaca o documento/despesa exato, tipo/valor e tentativa antes da decisão.
6. **D-01** — documentação corrente passa a apontar esta frente e seus PRs.
7. **Ajuste adicional encontrado na inspeção desktop** — os controles `Aguardando reanálise` e `Visualizar pendência` foram separados para não colidir; o E2E mede geometricamente a ausência de sobreposição.

**Validação final do head #376:** `Validar RADAR PDDE`, snapshot canônico, retificação auditável, Lighthouse, Supabase readiness, contratos-fonte do Excel SME e E2E Playwright concluíram com sucesso. O E2E desktop terminou com **181 passed, 54 skipped, 0 failed**.

## 3. O que NÃO está pendente

Não reiniciar a auditoria funcional do fluxo nem reimplementar os achados do Codex. Os itens NAV-01, UX-04, UX-01, UX-02, UX-03, UX-05 e UX-06 já possuem implementação remota.

Não alterar nesta frente:

- Supabase/RLS/RPC/migrations;
- `InvoiceService`, `PendencyService`, `DataService` ou contratos de persistência;
- regras de identificação, tentativa ou reanálise;
- IDs da despesa/Pendência e histórico;
- regras de Boleto de Internet, patrimônio ou Assessoria;
- mobile além do UX-04 já isolado no #375;
- Production.

## 4. Pendências reais para retomada

O próximo executor deve começar no **handoff corrente**, sem reconstruir a investigação:

`docs/handoff/2026-09-25-desktop-expense-journey.md`

Restam somente:

1. **validação visual humana do candidato final**, em Preview ou ambiente equivalente, priorizando desktop 1440×900;
2. confirmar visualmente os estados de criação, retificação, identificação, `Aguardando reanálise`, reanálise e fila de Pendências;
3. não interpretar Preview antigo ou deployment `CANCELED` da Vercel como candidato final;
4. atualizar evidências apenas se a inspeção encontrar problema concreto;
5. após aprovação do responsável pelo produto, integrar na ordem correta: #375 primeiro; depois retarget/rebase do #376 para `main`, conferir diff e gates novamente;
6. Production somente após autorização explícita posterior.

## 5. Evidência de CI já disponível

### PR #375 — head `3b369122`

- E2E Playwright: run `36207289668` — success — **181 passed, 54 skipped**
- artefato Playwright: `10893997246` (`playwright-report-desktop`)
- validação geral: `36207289713` — success
- homologação integral pré-production: `36207289662` — success
- Lighthouse, CodeQL, Supabase readiness, confiabilidade Supabase, ciclos funcionais, identificação de `a_identificar`, retificação e gate de perfis/viewports: success.

### PR #376 — head `f183e4b1`

- E2E Playwright: run `36207648694` — success — **181 passed, 54 skipped**
- artefato Playwright: `10894812623` (`playwright-report-desktop`)
- validação geral: `36207648717` — success
- snapshot canônico: `36207648707` — success
- retificação auditável: `36207648710` — success
- Lighthouse: `36207648698` — success
- Supabase readiness: `36207648731` — success
- contratos-fonte do Excel SME: `36207648723` — success.

Os artefatos do Playwright expiram; use os run IDs acima como trilha permanente e gere novas capturas se a continuação ocorrer após a expiração.

## 6. Rota de leitura para qualquer retomada

1. `AGENTS.md`
2. `docs/reference/SYSTEM_CANONICAL_MODEL.md`
3. `docs/reference/PRODUCT_SURFACE_CATALOG.md`
4. este arquivo
5. `docs/handoff/2026-09-25-desktop-expense-journey.md`
6. `docs/reference/FRONTEND_USER_VALIDATION_GATE.md`
7. `docs/reference/STATUS_DOCUMENTOS.md`

A modernização de performance/sincronização de 19/09 está encerrada e é histórica para esta frente.
