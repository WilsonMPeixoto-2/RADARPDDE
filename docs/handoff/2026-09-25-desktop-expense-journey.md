# Handoff corrente — jornada desktop de Despesa a identificar

**Data:** 25/09/2026  
**Estado:** implementação concluída em dois PRs draft; CI final verde; validação humana de Preview ainda necessária antes de merge/Production.  
**Baseline efetiva:** `main`/Production `bb7246438b8c6b72ef068b21bb40d492a7049af2` (#374) → PR #375 head funcional `3b369122acca81b1d07668e8c88fc64c55b06121` → PR #376 último SHA funcional `f183e4b11b7c3ea91113ed98fa63031d0e3479d7`. Os commits posteriores no #376 desta reconciliação são apenas documentais.

## 0. Leia isto primeiro

A continuação **não deve reiniciar a auditoria do Codex** nem redescobrir o fluxo. A investigação já foi feita e os achados foram implementados.

O ponto de retomada é:

> validar visualmente os heads atuais, corrigir apenas defeito concreto encontrado nessa inspeção, reconciliar evidência/documentação se necessário e preparar a integração ordenada dos PRs.

Production continua intocada.

## 1. Autoridades e limites

Precedência:

`AGENTS.md` → `SYSTEM_CANONICAL_MODEL.md` → `PRODUCT_SURFACE_CATALOG.md` → `CURRENT_STAGE.md` → este handoff.

Limites desta frente:

- não alterar regras de negócio;
- não alterar schema, migration, RPC, RLS ou Supabase;
- não alterar `InvoiceService`, `PendencyService` ou `DataService`;
- não alterar identidade da despesa/Pendência nem histórico;
- não refazer arquitetura;
- não revisar mobile genericamente no #376;
- não escrever em Production;
- não fazer merge nem promover sem validação do Preview pelo responsável pelo produto.

## 2. Estado remoto confirmado

### main / Production

- `main`: `bb7246438b8c6b72ef068b21bb40d492a7049af2`
- Production: mesmo SHA
- deployment Vercel Production: `dpl_BztNyEgnHjFxAKJvkPcQGeV6GGWm`
- estado: `READY`
- projeto: `radarpdde-fix`

Nenhum commit dos PRs #375/#376 foi publicado em Production.

### PR #375

- URL: https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/375
- branch: `fix/pendency-context-mobile-preview-2026-09-25`
- base: `main`
- head: `3b369122acca81b1d07668e8c88fc64c55b06121`
- aberto, draft, mergeable
- escopo: NAV-01 + UX-04

### PR #376

- URL: https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/376
- branch: `fix/desktop-expense-journey-2026-09-25`
- base: branch do #375
- último SHA funcional: `f183e4b11b7c3ea91113ed98fa63031d0e3479d7`; commits posteriores na mesma branch são somente documentação
- aberto, draft, mergeable
- escopo: UX-01, UX-02, UX-03, UX-05, UX-06, D-01 + correção de colisão visual encontrada durante a validação desktop

## 3. Matriz final dos achados do Codex

| Achado | Estado atual | Implementação |
|---|---|---|
| NAV-01 | implementado no #375 | rota escolar sincroniza `pageState.filters.schoolId`; rerenders internos preservam contexto e resumo visual |
| UX-04 | implementado no #375 | drawer de Pendência usa largura útil no mobile até 720 px |
| UX-01 | implementado no #376 | cadastro e retificação têm cópias distintas; edição afirma que lançamento/Pendência/histórico são preservados |
| UX-02 | implementado no #376 | modal da despesa exibe escola, competência e programa |
| UX-03 | implementado no #376 | descrição provisória é o identificador principal da linha; natureza provisória fica secundária |
| UX-05 | implementado no #376 | Prontuário explicita escopo escolar; Pendências Operacionais explicita fila transversal/histórica; fila mostra identidade da despesa |
| UX-06 | implementado no #376 | reanálise destaca documento/despesa, tipo/valor e tentativa antes da decisão |
| D-01 | implementado e consolidado nesta atualização | CURRENT_STAGE, README, STATUS_DOCUMENTOS e este handoff apontam o estado real |

## 4. Correções adicionais descobertas durante a implementação

### 4.1 Resumo escolar desaparecia após rerender interno

O primeiro ajuste NAV-01 preservava a rota e o seletor, mas abrir/fechar o detalhe reconstruía a página e removia visualmente a faixa **Filtro por unidade**.

Correção:

- commit #375 `9f32539107138c5745f871fb50b7902836fee6de`
- `renderPendenciasTask9()` volta a chamar o bridge canônico que garante o resumo escolar depois de substituir o conteúdo.

### 4.2 Fixture E2E do NAV-01 foi perdida em checkpoint intermediário

Um checkpoint posterior partiu de árvore local anterior e retirou a fixture de Pendência usada pelo teste.

Correção final:

- commit #375 `3b369122acca81b1d07668e8c88fc64c55b06121`
- restaura a fixture real e mantém o código funcional do filtro.

### 4.3 Colisão entre “Aguardando reanálise” e “Visualizar pendência”

A inspeção desktop em 1440 px revelou que os dois controles podiam disputar espaço na mesma linha.

Correção:

- commit #376 `f183e4b11b7c3ea91113ed98fa63031d0e3479d7`
- restringe o botão de estado à coluna;
- permite quebra controlada do texto;
- o E2E mede os `boundingBox()` dos dois controles e exige separação mínima de 4 px.

## 5. O que o código do #376 faz

### UX-01 — retificação sem falsa criação

`src/integration/unidentified-expense-ux.js`:

- criação de `a_identificar`: mantém a mensagem de classificação automática e abertura da Pendência;
- edição de `a_identificar`: informa que está corrigindo **o mesmo lançamento** e que a Pendência/histórico permanecem vinculados;
- edição de despesa já identificada: informa que salvar não cria outra despesa ou Pendência.

### UX-02 — contexto do modal

O mesmo módulo injeta `[data-expense-context]` com:

`escola · MM/AAAA · programa`

O contexto vem dos valores reais de `nota-escola-id` e `nota-comp-key`; não cria estado paralelo.

### UX-03 — identidade da despesa provisória

`app.js`:

- para `tipo === 'a_identificar'`, a linha de Nota Fiscal usa `note.desc` como título principal;
- exibe abaixo `Despesa a identificar · documentação pendente`;
- preserva ID, tipo e vínculo existentes.

### UX-05 — escopo das superfícies

`app.js`:

- aba aprovada permanece **Pendências Ativas desta unidade**;
- o painel interno usa **Pendências ativas desta escola** e explica que contém abertas/aguardando reanálise daquela unidade.

`src/integration/task-9-pendencias-page.js`:

- Pendências Operacionais se descreve como fila de todas as escolas/competências, incluindo ativos e histórico;
- linha desktop mostra a descrição da despesa vinculada quando disponível.

### UX-06 — reanálise

`app.js` + `index.html`:

- modal orienta a conferir o último arquivo recebido;
- bloco `.reanalysis-document-identity` mostra descrição, tipo e valor da despesa/documento;
- tentativa, estado e contexto permanecem abaixo;
- fallback usa snapshot/item quando a invoice vinculada não estiver disponível.

## 6. CI final já concluído

### PR #375 — `3b369122`

Todos os workflows associados ao head atual terminaram em `success`.

E2E Playwright:

- run: https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36207289668
- resultado: **181 passed, 54 skipped, 0 failed**
- duração aproximada: 8,1 min
- artifact: `10893997246` — `playwright-report-desktop`

Também verdes:

- `Validar RADAR PDDE` — run `36207289713`
- `Homologação integral pré-production` — `36207289662`
- `Lighthouse CI` — `36207289765`
- `CodeQL` — `36207289692`
- `Identificação de Despesa a identificar` — `36207289681`
- `Confiabilidade funcional com Supabase real` — `36207289664`
- `Supabase readiness` — `36207289718`
- `Gate remoto de perfis e viewports` — `36207289698`
- `Ciclos funcionais reais com Supabase` — `36207289674`
- `Retificação auditável direcionada` — `36207289679`

### PR #376 — último SHA funcional `f183e4b1`

E2E Playwright:

- run: https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36207648694
- resultado: **181 passed, 54 skipped, 0 failed**
- duração aproximada: 8,4 min
- artifact: `10894812623` — `playwright-report-desktop`

Também verdes:

- `Validar RADAR PDDE` — `36207648717`
- `Validar snapshot canônico do RADAR` — `36207648707`
- `Retificação auditável direcionada` — `36207648710`
- `Lighthouse CI` — `36207648698`
- `Supabase readiness` — `36207648731`
- `Contratos-fonte do Excel SME` — `36207648723`

O job remoto de Auth/perfis/RLS/persistência no Preview aparece como `skipped` na validação geral quando os segredos/ambiente de Preview não estão provisionados; não interpretar isso como execução autenticada.

## 7. Evidência visual disponível e seu limite

O relatório Playwright final do #376 contém capturas desktop de 1440×900 da jornada real, incluindo estados de criação, drawer, identificação, `Aguardando reanálise` e demais superfícies visitadas pela suíte.

Foram inspecionadas capturas representativas do artefato:

- modal **Registrar despesa a identificar** mostra o contexto `Escola · 05/2026 · PDDE Básico`;
- drawer da Pendência mostra a descrição e o bloco de dados provisórios;
- modal **Registrar envio e identificar despesa** mantém escola, competência, programa e documento;
- a linha identificada mostra **Aguardando reanálise** e **Visualizar pendência** sem sobreposição na captura final.

Os testes também verificam programaticamente:

- texto e contexto do modal de retificação;
- descrição provisória na linha;
- bloco de identidade no modal de reanálise;
- competência `Maio/2026`;
- separação geométrica dos botões.

**Ainda assim, o gate de produto exige inspeção humana do candidato final em Preview.** Artefato de CI não substitui essa aprovação.

## 8. Preview / Vercel

A integração GitHub→Vercel do projeto `radarpdde-fix` ignora builds automáticos de branches por política. Os deployments registrados para heads de #375/#376 aparecem como `CANCELED`/`Ignored`; isso é esperado e não significa falha de build.

Um Preview isolado anterior foi criado fora do projeto oficial durante a investigação, mas ele aponta para SHA anterior ao head final. **Não usar esse Preview antigo como evidência de aceitação dos heads atuais.**

Para fechar a frente, gerar um Preview novo dos heads finais sem alterar Production e submetê-lo à validação do responsável.

## 9. Documentação reconciliada nesta atualização

Atualizados na branch do #376:

- `docs/CURRENT_STAGE.md`
- este handoff
- `docs/reference/STATUS_DOCUMENTOS.md`
- `docs/README.md`
- `docs/PROJECT_CONTEXT.md`
- `docs/reference/SYSTEM_CANONICAL_MODEL.md`

`PRODUCT_SURFACE_CATALOG.md` já descrevia corretamente o drawer contextual do Prontuário, identificação de `a_identificar` e reanálise por dois caminhos; não precisava de mudança funcional.

## 10. Ordem exata de retomada

1. Conferir somente se `main`, #375 e #376 ainda estão nos SHAs acima. Se estiverem, **não refazer investigação**.
2. Abrir o #376 e revisar o diff final apenas para detectar regressão evidente/escopo acidental.
3. Gerar Preview atualizado dos heads finais, sem Production.
4. Validar visualmente desktop 1440×900:
   - criação de `Despesa a identificar`;
   - drawer e dados provisórios;
   - edição/retificação do mesmo lançamento;
   - primeiro envio/identificação;
   - linha em `Aguardando reanálise` com ações sem colisão;
   - modal de reanálise com identidade da despesa;
   - Pendências Operacionais com escopo transversal e identidade da despesa;
   - NAV-01: filtro escolar sobrevive a abrir/fechar detalhe.
5. Não gastar a rodada reauditando mobile. Para #375, apenas confirmar UX-04 se o responsável solicitar ou se o Preview mostrar regressão concreta.
6. Se a inspeção estiver correta, registrar a aprovação/evidência.
7. Integrar **#375 primeiro**.
8. Depois retarget/rebase do **#376 para `main`**, confirmar que o diff residual contém apenas seu pacote UX/documental, rodar gates do novo head e gerar Preview final se o SHA mudar.
9. Merge do #376 somente depois dessa segunda confirmação.
10. Production somente com autorização explícita posterior.

## 11. Sinais de estratégia errada

Pare e reavalie se a continuação tentar:

- criar migrations/RPCs;
- alterar serviços de domínio/persistência;
- recriar a despesa ou Pendência na identificação;
- voltar a filtrar Pendências substituindo temporariamente a coleção global;
- mudar regras de Boleto/Assessoria/patrimônio;
- redesenhar mobile em massa;
- reabrir a auditoria do Codex sem evidência nova;
- mergear #376 antes de #375 ou promover qualquer branch direto a Production.

## 12. Ponto de parada do Work

O último commit funcional produzido pelo Work foi:

`f183e4b11b7c3ea91113ed98fa63031d0e3479d7` — **fix(ux): separar ações da reanálise no prontuário desktop**

A cota acabou antes de o Work receber o resultado dos workflows. Os workflows terminaram depois e ficaram verdes; portanto **não há falha de CI pendente para investigar no estado atual**.

O que falta é validação visual de Preview + integração ordenada, não nova implementação dos achados.
