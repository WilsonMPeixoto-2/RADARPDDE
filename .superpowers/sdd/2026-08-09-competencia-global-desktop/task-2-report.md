# Task 2 — Dashboards vinculados à competência mensal canônica

Data: 2026-08-09

Base obrigatória verificada antes das alterações: `057a61dc55afb794ee10bfd62ee015c45bfc04e3`

Commit planejado: `fix(competence): bind dashboards to canonical month`

## Escopo executado

A Task 2 foi implementada somente nos quatro arquivos funcionais/de teste autorizados, além deste relatório obrigatório de evidência:

- `app.js`
- `src/integration/cycle-b-dashboard.js`
- `tests/e2e/cycle-b-dashboard.spec.js`
- `tests/e2e/global-competence-dashboard.spec.js` (novo)
- `.superpowers/sdd/2026-08-09-competencia-global-desktop/task-2-report.md` (evidência)

Não houve alteração em Supabase, dados remotos, Production, CSS, catálogo visual ou arquivos pertencentes às Tasks 3–8.

## TDD — RED observado antes da implementação

O novo E2E comportamental usa verificações determinísticas de maio e agosto para uma CRE e uma escola reais da fixture. Ele seleciona maio pelo `RadarCompetenceContext`, abre o Dashboard SME, expande a CRE e então altera o controle mensal local para agosto. O teste verifica em conjunto o seletor global, o cabeçalho global, o seletor local, o card de aptas, a tabela/projeção e o estado canônico.

Uma primeira execução encontrou apenas uma diferença de capitalização da fixture (`Inapta` esperado pelo teste versus `INAPTA` renderizado). Essa execução foi rejeitada como RED inválido porque não provava a falha funcional do requisito; somente a asserção do teste foi corrigida.

Na execução RED válida, a falha foi a divergência mensal esperada:

```text
Expected: "2026-08"
Received: "2026-05"
Locator: #global-competence-select
```

Ou seja: o seletor mensal do Dashboard SME mudava seus espelhos e renderizava localmente, mas não comandava o `RadarCompetenceContext`; por isso o seletor global permanecia em maio. Não houve falha de fixture, carregamento ou seletor nessa execução.

## Implementação

### Dashboards mensais

Os renders de Controlador, Assistente e SME agora:

- aguardam o `RadarCompetenceContext` estar inicializado;
- capturam `getState().activeKey` uma única vez no início de cada render;
- reutilizam essa chave canônica em filtros, cards, cabeçalhos, tabelas e projeções;
- derivam o rótulo mensal do catálogo canônico uma vez por render;
- não leem `activeCompetenciaKey` dentro dos três renders.

`changeSMEMonth(value)` agora executa apenas:

```js
window.RadarCompetenceContext.select(value, { source: 'sme-dashboard' });
```

e devolve `true` em sucesso ou `false` se a seleção for rejeitada. A função não grava espelhos e não chama render diretamente; a única atualização funcional parte da notificação do contexto.

### Integração Cycle B

`enhanceDashboard()` aguarda a inicialização do contexto, captura uma única competência canônica e a distribui para projeção, filtros, cards, resumo e metadados das ações daquela renderização. Os helpers relevantes recebem a chave explicitamente, evitando novas leituras mensais durante o mesmo render.

A fixture do E2E Cycle B passou a selecionar maio por `RadarCompetenceContext.select(..., { source: 'cycle-b-dashboard-test' })` e deixou de gravar o espelho `activeCompetenciaKey`.

## GREEN e gates executados

Após os ajustes finais, os seguintes comandos foram executados sobre o conteúdo atual:

```powershell
npx playwright test tests/e2e/global-competence-dashboard.spec.js tests/e2e/cycle-b-dashboard.spec.js --project=desktop-chromium
```

Resultado: `4 passed (3.3s)`.

```powershell
npm run check
```

Resultado: aprovado, código de saída `0`.

```powershell
git diff --check
```

Resultado: aprovado, código de saída `0`, sem erros de whitespace.

Como `npm run check` não inclui diretamente o arquivo de integração Cycle B, também foi executado:

```powershell
node --check src/integration/cycle-b-dashboard.js
```

Resultado: aprovado, código de saída `0`.

## Auto-revisão contra o brief

- O seletor SME comanda exclusivamente a autoridade mensal canônica.
- Seletor global, cabeçalho, seletor local, card de aptas e tabela/projeção convergem para agosto no E2E.
- O teste confirma `RadarCompetenceContext.activeKey`, `activeCompetenciaKey` e `currentExercise` em agosto; os dois últimos são atualizados pelo `applyState()` do seletor global, não pelo dashboard ou pela fixture.
- Controlador, Assistente e SME capturam uma única chave canônica em cada render.
- A integração Cycle B reutiliza a chave capturada nas projeções e ações construídas naquele render.
- Não foi introduzido render direto em `changeSMEMonth`; a mudança gera somente a atualização funcional dirigida pelo contexto.
- O Dashboard Inventário não foi alterado porque não possui consumo mensal nesta fundação.
- Identidade visual, textos fora do rótulo canônico e compatibilidade estrutural foram preservados.

## Preocupações e limites deliberados

- O fluxo legado que abre uma ação Cycle B ainda possui leituras/escritas de espelhos fora de `enhanceDashboard()`. Ele pertence às Tasks 4 e 6 e foi deliberadamente mantido intacto nesta Task 2.
- O comando focal solicitado valida o projeto `desktop-chromium` com a viewport configurada pelo projeto. Não foi criada uma parametrização adicional para `1440x900`, pois isso ampliaria o escopo do E2E desta tarefa; a matriz visual completa permanece como gate transversal posterior. Nenhum CSS ou layout foi alterado aqui.
- A suíte E2E integral não foi executada nesta tarefa. Foram executados o par focal solicitado, o gate estático completo do projeto, a verificação de whitespace e a checagem sintática adicional da integração.
- Nenhuma validação ou escrita remota foi realizada; Production permaneceu intocada.

## Recuperação

Não há migração nem dado a recuperar. Para desfazer somente esta Task 2 após o commit, executar na branch que o contém:

```powershell
git revert (git rev-list -1 HEAD --grep="^fix(competence): bind dashboards to canonical month$")
npx playwright test tests/e2e/global-competence-dashboard.spec.js tests/e2e/cycle-b-dashboard.spec.js --project=desktop-chromium
npm run check
```

O revert é rastreável e preserva o histórico; não exige `reset`, alteração de Supabase ou intervenção em Production.
