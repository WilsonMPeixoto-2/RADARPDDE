# Handoff corrente — jornada desktop de Despesa a identificar

**Atualizado:** 26/09/2026  
**Estado:** código funcional reconciliado; testes adequados ao contrato vigente; documentação reconciliada; Preview combinado READY; resta homologação visual navegada antes da integração.  
**Production:** `bb7246438b8c6b72ef068b21bb40d492a7049af2`.  
**Candidato funcional/UI auditado:** `4994aeb331f643c09ab4b76f66e5c831be9cd5d2`.

## 0. Retomada em 30 segundos

Não reiniciar a auditoria.

- #375: `d591b231...`;
- #376 contém formalmente o #375 e está behind 0 no candidato auditado;
- runtime do #376 preserva domínio/persistência;
- Playwright: **182 passed, 54 skipped, 1 flaky, 0 final failures**;
- flaky de layout = espera incompleta do teste, corrigida sem relaxar geometria;
- SQL/lint Supabase passaram; o vermelho restante é rate limit do registry externo;
- Preview combinado `dpl_9wLYQYVKszqwX4rZbCS6WQAJcfec`: READY;
- falta inspeção visual/navegada do mesmo candidato.

## 1. Estado remoto

### main / Production
- SHA `bb7246438b8c6b72ef068b21bb40d492a7049af2`
- deployment `dpl_BztNyEgnHjFxAKJvkPcQGeV6GGWm`

### #375
- branch `fix/pendency-context-mobile-preview-2026-09-25`
- head `d591b231eb06e95a1c09ba2fb6e40d2c7bb83f7d`
- `0d2fe5c6`: ordem correta da limpeza do filtro
- `d591b231`: URL/contexto Pendências ↔ Prontuário

### #376
- branch `fix/desktop-expense-journey-2026-09-25`
- base: #375
- candidato runtime/UI: `4994aeb331f643c09ab4b76f66e5c831be9cd5d2`
- relação com #375: ahead 51 / behind 0
- PR #377: sincronização técnica entre branches, não PR para main.

## 2. Achados e correções posteriores ao Preview histórico

O checkpoint `docs/evidence/2026-09-26-postfix-preview/` registrou defeitos em candidato anterior. Depois dele:

- `aeeb0b02`: reanálise abre pelo topo e foca orientação;
- `0d2fe5c6`: limpar filtro atualiza rota antes do estado;
- `d591b231`: URL correta ao abrir/voltar do Prontuário;
- `6d04624e`: ação longa contida na célula desktop;
- `d0796f3c`: teste de foco reconciliado com a UX vigente;
- `4994aeb3`: #376 incorpora formalmente o head atual do #375.

## 3. Matriz código ↔ teste

| Contrato | Código | Prova |
|---|---|---|
| filtro escolar no estado real da Task 9 | `navigation-bootstrap.js`, `task-9-focus-bridge.js`, `task-9-pendencias-page.js` | `canonical-routes.spec.js`, unit do filtro |
| limpar filtro devolve lista transversal | `clearSchoolRouteContext()` | `canonical-routes.spec.js` |
| URL/contexto Prontuário ↔ Pendências | `navigatePendencyContext()` | `task-9-pendencias.spec.js` |
| identificação preserva despesa/Pendência | fluxo Invoice/Pendency vigente | `unidentified-expense.spec.js`, jornada real |
| identificação começa pelo contexto | `openRegistrarNovoEnvioModal(...focusContext)` | jornada real |
| reanálise começa pela orientação | `openReanalysisModal()` | `pendency-cycle.spec.js`, jornada real |
| zonas tentativa/contexto/decisão | `renderReanalysisAttemptSummary()`, `index.html` | jornada real |
| ação longa contida | `task-9-pendencias.css` | `pendency-desktop-action-containment.spec.js` |
| feedback fora do drawer | `global-visual-polish.css` + body marker | jornada real |

## 4. Adequação do flaky de layout

Falha transitória: `layout-responsive-regressions.spec.js:87`, 8 px no wrapper na primeira tentativa, retry verde.

Causa: o helper considerava o layout pronto quando encontrava `desktop-basic-monitors.css`, embora o bootstrap ainda carregue folhas posteriores e `layout-responsive-2026.css` seja a reconciliação final.

Correção test-only:
- aguardar `layout-responsive-2026.css` carregada;
- aguardar `document.fonts.ready`;
- aguardar dois frames;
- preservar tolerância <= 1 px e demais invariantes;
- aplicar a mesma espera determinística em `desktop-basic-monitors.spec.js`, que compartilhava a premissa temporal antiga.

## 5. CI do candidato funcional

Playwright `36261993415`: **182 passed / 54 skipped / 1 flaky / 0 falhas finais**.

Verdes:
- Validar RADAR `36261993404`
- snapshot `36261993525`
- retificação `36261993433`
- Lighthouse `36261993359`
- Excel SME `36261993396`
- Playwright `36261993415`

Supabase readiness `36261993485`:
- readiness: success
- migration-smoke: success
- supabase-local: infraestrutura externa em failure
- 34 arquivos / 486 testes SQL: PASS
- lint: No schema errors found
- falha posterior: `postgres-meta:v0.97.0` → `toomanyrequests: Data limit exceeded`.

## 6. Preview combinado

- branch `preview/final-combined-current-2026-09-26`
- runtime `4994aeb3...`
- commit infra `4f8aca3c...`
- deployment `dpl_9wLYQYVKszqwX4rZbCS6WQAJcfec`
- URL `https://radarpdde-5rjsbtb4x-wilson-m-peixotos-projects.vercel.app`
- READY.

`vercel.json` dessa branch é temporário. Nunca integrar.

## 7. Próxima ação

Homologar no Preview combinado, desktop:

1. filtro escolar → detalhe → abas → limpar filtro;
2. abrir Prontuário e validar URL/reload;
3. voltar e validar contexto;
4. identificar `a_identificar`;
5. observar ação longa, topo do modal e feedback;
6. reanalisar e validar hierarquia;
7. registrar evidência do mesmo candidato.

Depois: merge #375 → retarget/rebase #376 → diff residual → gates → merge #376 → Production só com autorização explícita.

## 8. Não fazer

- não reverter UX para satisfazer teste antigo;
- não relaxar teste geométrico para esconder flake;
- não mexer em Supabase por rate limit externo;
- não reauditar mobile;
- não usar screenshots antigos como prova atual;
- não mergear branch de Preview;
- não publicar Production sem autorização.
