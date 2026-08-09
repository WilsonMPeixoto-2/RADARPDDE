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

- são chamados somente depois que o gate central de `renderDashboard()` confirma a inicialização do `RadarCompetenceContext`;
- capturam `getState().activeKey` uma única vez no início de cada render;
- reutilizam essa chave canônica em filtros, cards, cabeçalhos, tabelas e projeções;
- derivam o rótulo mensal do catálogo canônico uma vez por render;
- não leem `activeCompetenciaKey` dentro dos três renders.

Se um Dashboard mensal for solicitado antes da inicialização, o gate central registra uma única reação one-shot ao evento `radar:competence-change` e encerra aquela tentativa. No primeiro evento canônico, a reação consulta novamente o perfil ativo e renderiza uma vez somente quando a view ainda é `dashboard`. Chamadas concorrentes anteriores ao bootstrap reutilizam o mesmo registro pendente; o Dashboard Inventário continua fora desse gate mensal.

`changeSMEMonth(value)` agora executa apenas:

```js
window.RadarCompetenceContext.select(value, { source: 'sme-dashboard' });
```

e devolve `true` em sucesso ou `false` se a seleção for rejeitada. A função não grava espelhos e não chama render diretamente; a única atualização funcional parte da notificação do contexto.

### Integração Cycle B

`enhanceDashboard()` executa somente depois da inicialização do contexto, captura uma única competência canônica e a distribui para projeção, filtros, cards, resumo e metadados das ações daquela execução. Os helpers relevantes recebem a chave explicitamente, evitando novas leituras mensais dentro do enhancement.

Quando a integração Cycle B termina de instalar sobre um Dashboard Controlador já recuperado, ela chama somente `enhanceDashboard()`. Ela não solicita uma segunda renderização funcional do Dashboard base.

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
- O teste confirma `RadarCompetenceContext.activeKey`, `activeCompetenciaKey` e `activeProntuarioCompetencia` em agosto; os dois espelhos são atualizados pelo `applyState()` do seletor global, não pelo dashboard ou pela fixture.
- Controlador, Assistente e SME capturam uma única chave canônica em cada render.
- A integração Cycle B reutiliza a chave capturada nas projeções e ações construídas naquele render.
- Não foi introduzido render direto em `changeSMEMonth`; a mudança gera somente a atualização funcional dirigida pelo contexto.
- O Dashboard Inventário não foi alterado porque não possui consumo mensal nesta fundação.
- Identidade visual, textos fora do rótulo canônico e compatibilidade estrutural foram preservados.

## Preocupações e limites deliberados

- O fluxo legado que abre uma ação Cycle B ainda possui leituras/escritas de espelhos fora de `enhanceDashboard()`. Ele pertence às Tasks 4 e 6 e foi deliberadamente mantido intacto nesta Task 2.
- O render composto do Controlador ainda faz duas leituras síncronas da autoridade canônica: uma no Dashboard base e outra no enhancement Cycle B. Como não existe `await`, callback ou seleção entre elas, não há snapshot misto observável hoje. O endurecimento estrutural foi mantido deferred como Minor e não foi agravado neste fix.
- O comando focal solicitado valida o projeto `desktop-chromium` com a viewport configurada pelo projeto. Não foi criada uma parametrização adicional para `1440x900`, pois isso ampliaria o escopo do E2E desta tarefa; a matriz visual completa permanece como gate transversal posterior. Nenhum CSS ou layout foi alterado aqui.
- A suíte E2E integral não foi executada nesta tarefa. Foram executados o par focal solicitado, o gate estático completo do projeto, a verificação de whitespace e a checagem sintática adicional da integração.
- Nenhuma validação ou escrita remota foi realizada; Production permaneceu intocada.

## Fix round 1/5

Base verificada antes do fix: `dfc676feea059d57b4a505d5ea822eef86ffa66f`.

Commit do fix: `fix(competence): recover dashboards after context bootstrap`.

### Achado reproduzido

Os três guards individuais introduzidos na primeira entrega desistiam do render quando o contexto ainda não estava inicializado. A aplicação inicial de `applyState(..., { initial: true })` publica o evento canônico, mas não atualiza a view, enquanto a recuperação posterior da integração Cycle B renderizava somente o Controlador.

O E2E foi ampliado com três casos independentes para Controlador, Assistente e SME. A interceptação devolve o arquivo real `global-competence-selector.js` dentro de um invólucro que posterga apenas sua execução. Assim, a navegação e a autorização concluem por `RadarNavigationReady`, o perfil é escolhido uma única vez ainda sem contexto inicializado e, somente então, o seletor real é liberado. Esse formato evita que uma recuperação de rota posterior masque a falha que está sendo testada.

Uma primeira tentativa que segurava a requisição inteira passou porque o término tardio do carregamento também acionava `applyPendingRoute()`, produzindo outro render. O stack confirmou essa interferência, e esse resultado foi rejeitado como RED inválido. Nenhum código de produção havia sido alterado.

No RED determinístico válido, Assistente e SME falharam de forma idêntica:

```text
rendererCalls: esperado 1, recebido 0
heading: esperado o título do perfil, recebido ""
profileSwitchesAfterSelection: 0
currentView: "dashboard"
```

Isso confirma que o perfil escolhido e a view permaneciam corretos, mas nenhum primeiro Dashboard era produzido quando o contexto ficava pronto.

### Correção

- `renderDashboard()` passou a centralizar o gate mensal e registrar uma única recuperação pendente no primeiro `radar:competence-change`.
- A reação é one-shot, libera seu marcador antes de decidir e só renderiza se a view continuar sendo Dashboard e o perfil ativo ainda for Controlador, Assistente ou SME.
- Os guards individuais foram removidos; cada renderer mensal volta a assumir o contrato de contexto já inicializado.
- A instalação Cycle B passou a enriquecer o Controlador recuperado com `enhanceDashboard()` em vez de solicitar um segundo render base.

### GREEN e regressão

```powershell
npx playwright test tests/e2e/global-competence-dashboard.spec.js --project=desktop-chromium --grep "recupera o primeiro Dashboard de (assistente|sme)"
```

Resultado: `2 passed (1.6s)`.

```powershell
npx playwright test tests/e2e/global-competence-dashboard.spec.js --project=desktop-chromium --grep "recupera o primeiro Dashboard"
```

Resultado: `3 passed (1.9s)`. Os três casos confirmam `rendererCalls: 1`, nenhuma nova troca de perfil, a permanência em `dashboard` e o cabeçalho correspondente.

```powershell
npx playwright test tests/e2e/global-competence-dashboard.spec.js tests/e2e/cycle-b-dashboard.spec.js --project=desktop-chromium
```

Resultado final repetido sobre o conteúdo candidato ao commit: `7 passed (4.7s)`.

```powershell
npm run check
node --check src/integration/cycle-b-dashboard.js
git diff --check
```

Resultado: os três comandos foram aprovados com código de saída `0`; a verificação do diff não encontrou erros de whitespace.

O fix permanece nos arquivos autorizados da Task 2 e neste relatório. Não altera o seletor global, não antecipa a Task 3 e não acessa Supabase ou Production.

## Recuperação

Não há migração nem dado a recuperar. Para desfazer somente esta Task 2 após o commit, executar na branch que o contém:

```powershell
git revert (git rev-list -1 HEAD --grep="^fix(competence): recover dashboards after context bootstrap$")
git revert (git rev-list -1 HEAD --grep="^fix(competence): bind dashboards to canonical month$")
npx playwright test tests/e2e/global-competence-dashboard.spec.js tests/e2e/cycle-b-dashboard.spec.js --project=desktop-chromium
npm run check
```

O revert é rastreável e preserva o histórico; não exige `reset`, alteração de Supabase ou intervenção em Production.
