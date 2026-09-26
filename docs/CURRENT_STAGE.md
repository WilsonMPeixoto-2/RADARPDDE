# RADAR PDDE — estado atual e retomada

**Classe documental:** Canônico — estado mutável  
**Atualizado em:** 26 de setembro de 2026

## 1. Baseline confirmada

- `main`: `bb7246438b8c6b72ef068b21bb40d492a7049af2` — merge do PR #374.
- Production: mesmo SHA `bb7246438b8c6b72ef068b21bb40d492a7049af2`.
- Deployment Production: `dpl_BztNyEgnHjFxAKJvkPcQGeV6GGWm`, `READY`.
- PRs #375/#376 continuam fora de `main` e Production.
- A frente atual não altera schema, migrations, RPCs, RLS, serviços de domínio nem persistência canônica.

## 2. Frente ativa

### PR #375 — contexto escolar de Pendências

- branch: `fix/pendency-context-mobile-preview-2026-09-25`
- head: `d591b231eb06e95a1c09ba2fb6e40d2c7bb83f7d`
- base: `main`
- aberto, draft e mergeable
- `0d2fe5c6`: limpeza do filtro escolar ocorre após atualização da rota;
- `d591b231`: abrir Prontuário e voltar às Pendências sincroniza URL e contexto escolar.
- UX-04 permanece no #375, mas não é foco da auditoria desktop atual.

### PR #376 — jornada desktop de Despesa a identificar

- branch: `fix/desktop-expense-journey-2026-09-25`
- base: branch do #375 em `d591b231...`
- candidato de runtime/UI auditado: `4994aeb331f643c09ab4b76f66e5c831be9cd5d2`
- relação #375 → #376 nesse candidato: **ahead 51 / behind 0**
- aberto, draft e mergeable
- PR #377 foi usado apenas para incorporar formalmente o head atual do #375 ao histórico do #376.
- commits posteriores ao candidato funcional podem ser test-only/documentação; qualquer alteração de runtime exige nova homologação explícita.

## 3. Contratos de código confirmados

A revisão source-first confirmou alinhamento entre código e regras vigentes:

- filtro escolar sincroniza o estado real de `RadarTask9PendencyPage`, sem substituir a coleção global de Pendências;
- abrir Pendência no Prontuário usa `/escolas/<id>`; voltar restaura `/pendencias?escola=<id>`, busca, aba, seleção e contexto;
- limpar o filtro navega primeiro para a rota global e só então limpa o estado interno;
- `a_identificar` continua nascendo `Incorreto + Pendência` atomicamente;
- identificação preserva o mesmo ID de despesa e a mesma Pendência;
- modal de identificação abre no topo e foca o título do contexto;
- modal de reanálise abre no topo e foca `.reanalysis-guidance`;
- documento, tentativa, contexto e decisão são zonas distintas;
- descrição provisória é a identidade principal e a natureza provisória fica secundária;
- feedback de criação permanece legível com drawer aberto;
- a ação longa `Registrar envio / identificação da despesa` permanece dentro da célula no desktop.

Nenhuma dessas mudanças redefine domínio, persistência ou transições.

## 4. Testes alinhados

Playwright do candidato `4994aeb3...`, run `36261993415`: **182 passed, 54 skipped, 1 flaky, 0 final failures**.

- o contrato antigo que focava diretamente `Resultado da reanálise` foi removido; o teste agora valida foco na orientação visível;
- `canonical-routes.spec.js` cobre preservação e limpeza do filtro escolar;
- `task-9-pendencias.spec.js` cobre URL Prontuário ↔ Pendências;
- `pendency-desktop-action-containment.spec.js` mede contenção geométrica em 1440×900 e executa a ação;
- `unidentified-expense-user-journey.spec.js` percorre a jornada real pelo frontend.

### Adequação do flaky de layout

`layout-responsive-regressions.spec.js:87` variou 8 px na primeira tentativa e passou no retry. O helper aguardava apenas a presença de uma folha intermediária no DOM, não a aplicação da folha final `layout-responsive-2026.css`.

A correção test-only desta rodada:
- espera `layout-responsive-2026.css` com regras acessíveis;
- espera `document.fonts.ready`;
- espera dois frames de layout;
- mantém as mesmas tolerâncias geométricas estritas;
- a mesma sincronização de CSS/fonte foi aplicada ao helper irmão de `desktop-basic-monitors.spec.js`, que tinha a mesma premissa temporal.

Não foi alterado CSS/runtime para satisfazer os testes.

## 5. Gates técnicos do candidato funcional

Verdes:
- Validar RADAR PDDE `36261993404`;
- snapshot canônico `36261993525`;
- Retificação auditável `36261993433`;
- Lighthouse `36261993359`;
- contratos-fonte Excel SME `36261993396`;
- Playwright desktop `36261993415`.

### Supabase readiness

- `readiness`: success;
- `migration-smoke`: success;
- `supabase-local`: falha de infraestrutura externa, reproduzida no rerun.

Antes da falha: **34 arquivos / 486 testes SQL passaram** e `supabase db lint` retornou **No schema errors found**. Depois, o registry recusou `public.ecr.aws/supabase/postgres-meta:v0.97.0` com `toomanyrequests: Data limit exceeded` nas três tentativas. Não há evidência de regressão de banco nesta frente.

## 6. Preview combinado atual

Branch descartável: `preview/final-combined-current-2026-09-26`

- base de produto: `4994aeb331f643c09ab4b76f66e5c831be9cd5d2`
- commit temporário: `4f8aca3cc9cf58b7da5cbb1eb7c3ba9d4f933dd4`
- deployment: `dpl_9wLYQYVKszqwX4rZbCS6WQAJcfec`
- estado: `READY`
- URL: `https://radarpdde-5rjsbtb4x-wilson-m-peixotos-projects.vercel.app`

A branch de Preview altera somente `vercel.json` para permitir o deploy e **não deve ser mesclada**.

As evidências em `docs/evidence/2026-09-26-postfix-preview/` pertencem a candidato anterior e permanecem históricas.

## 7. Lacuna restante

O gate permanente de frontend ainda exige inspeção visual/navegada do Preview combinado do mesmo runtime. No desktop, confirmar:

1. limpar filtro escolar devolve fila global e URL `/pendencias`;
2. Prontuário usa URL correta e reload preserva a superfície;
3. ação longa permanece contida em 1366/1440 px;
4. reanálise abre no topo com orientação/contexto visíveis;
5. feedback não é encoberto pelo drawer.

Essa é a lacuna real. Não reabrir arquitetura nem regras já comprovadas.

## 8. Não alterar nesta frente

- Supabase/RLS/RPC/migrations;
- `InvoiceService`, `PendencyService` ou `DataService` sem novo defeito reproduzido;
- identidade da despesa/Pendência e histórico;
- Boleto de Internet, Assessoria ou patrimônio;
- mobile geral;
- Production.

## 9. Ordem de integração após homologação visual

1. confirmar head do #375;
2. integrar #375;
3. retarget/rebase #376 para `main`;
4. conferir diff residual;
5. rerodar gates do novo SHA;
6. Preview final se o runtime mudar materialmente;
7. integrar #376;
8. Production somente com autorização explícita separada.

## 10. Rota de retomada

1. `AGENTS.md`
2. `docs/reference/SYSTEM_CANONICAL_MODEL.md`
3. `docs/reference/PRODUCT_SURFACE_CATALOG.md`
4. este arquivo
5. `docs/handoff/2026-09-25-desktop-expense-journey.md`
6. `docs/reference/FRONTEND_USER_VALIDATION_GATE.md`
7. `docs/reference/TEST_GOVERNANCE.md`
8. `docs/reference/STATUS_DOCUMENTOS.md`
