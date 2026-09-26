# RADAR PDDE — estado atual e retomada

**Classe documental:** Canônico — estado mutável

**Atualizado em:** 26 de setembro de 2026

## 1. Frente concluída e publicação autorizada

A frente de contexto escolar/Pendências e jornada desktop de Despesa a identificar está tecnicamente concluída. O usuário autorizou explicitamente o merge/publicação em 26/09/2026. O PR [#376](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/376) é a entrega única para `main`, preservando o histórico de #375 e #376.

- Código e testes homologados: `2d21e752d8004e9c0343cca3978a84a46bf4609b`.
- Runtime funcional/UI: idêntico a `4994aeb331f643c09ab4b76f66e5c831be9cd5d2`.
- O fechamento posterior a `2d21e752` é exclusivamente documental.
- Base de integração e último Production anterior à entrega: `bb7246438b8c6b72ef068b21bb40d492a7049af2` (#374), deployment `dpl_BztNyEgnHjFxAKJvkPcQGeV6GGWm`.
- `main` publica automaticamente no projeto Vercel `radarpdde-fix`.
- O SHA efetivo do merge e o deployment resultante são registrados no comentário de publicação do #376 e no manifesto público `/radar-build-manifest.json`; conferir esses registros antes de uma nova intervenção. Um documento preparado antes do merge não comprova que o deployment terminou.

Não há handoff corrente de implementação. O [handoff desta frente](handoff/2026-09-25-desktop-expense-journey.md) fica classificado como histórico, com adendo de encerramento. Não reiniciar investigações já encerradas nem integrar #375 separadamente.

## 2. PRs e estratégia

- #376: entrega única contra `main`; merge convencional com head fixado, sem rebase/force-push.
- #375: fechado sem merge, substituído pelo #376; todos os commits preservados no candidato.
- #377: fechado/merged, somente histórico técnico de sincronização.
- Nunca integrar `preview/*` nem transportar o `vercel.json` efêmero.

O diff contra a base não altera `vercel.json`, schema, migrations, RPCs, RLS, serviços de domínio ou persistência canônica.

## 3. Diagnósticos encerrados

### Foco atribuído ao #375

O run vermelho `36261864567`, job `108465025843`, executou `refs/remotes/pull/377/merge`, SHA `b79f4d93f6fea3a336dfd0389878ce914f2c3ba6`: runtime novo focando `.reanalysis-guidance` combinado com teste antigo exigindo `#reanalisar-resultado`.

O run verde `36252023185` executou o merge-ref real do #375, SHA `97d3431131c730fadc002208d0852c1b315487d5`, e passou 182 testes. A associação ao mesmo head não significava a mesma árvore executada. Não há evidência nesse vermelho de corrida de foco do #375 isolado.

### Delta de layout de 8 px

O teste media Pendências enquanto `body` ainda tinha a classe visual do Dashboard, `radar-expressiva-institucional`. A remoção ocorre por MutationObserver + requestAnimationFrame. O trace mantinha `#main-container` em 1138 px e documento em 1366 px antes/depois, drawer fixed e nenhum overflow global.

`2d21e752` sincroniza a medição com a remoção dessa classe e dois frames. Nenhum CSS, regra funcional, persistência ou tolerância geométrica mudou.

## 4. Contratos preservados

- Pendências é transversal; filtro escolar é recorte local da Task 9.
- Limpar filtro restaura fila global e `/pendencias`.
- Prontuário usa `/escolas/<id>`; retorno preserva escola e contexto quando aplicável.
- `a_identificar` nasce atomicamente `Incorreto + Pendência`; identificação preserva ID, Pendência e histórico.
- Novo envio não resolve Pendência; reanálise exige tentativa/contexto válidos.
- Identificação e reanálise abrem pelo topo; reanálise foca `.reanalysis-guidance`.
- Hierarquia: Documento → Tentativa → Contexto → Decisão.
- Ação longa contida e feedback visível com drawer aberto.

## 5. Gates revalidados

Em `2d21e752`, os 16 workflows terminaram success: Playwright, homologação integral pré-production, perfis/viewports, ciclos reais, confiabilidade Supabase, readiness, identificação de despesa, estabilidade do Prontuário, Lighthouse, CodeQL, snapshot, retificação, Excel SME, validação geral, help desk e nomenclatura.

Os logs dos runs `36276637534` (Playwright) e `36276637527` (homologação integral) confirmam checkout de `pull/376/merge`, SHA `a68a4003d121957fadecaeac06167fafedd6ed5d`: merge de `2d21e752` em `bb724643`. Ambos executaram **183 passed / 54 skipped**, sem falha/flaky reportado. Os skips seguem o recorte da suíte; não significam prova de cenários não executados.

A inspeção visual registrada no #376 usou screenshots Chromium 1440×900 do run `36273138972`, artifact `10916268576`, do mesmo runtime. Foram conferidos criação, contexto, drawer/feedback, identificação, ação longa, topo/hierarquia da reanálise e estado final, sem regressão visual material observada.

## 6. Preview e limite da evidência

- Branch: `preview/desktop-final-2026-09-26`.
- Commit efêmero: `9aa59f5a0fea47bbb03036dfa6eda0ee001eac15`.
- Deployment: `dpl_EcLDqaAPe7aWo5dwNyR6G3TuwQSy`, READY revalidado em 26/09.
- URL: https://radarpdde-4ja1codbg-wilson-m-peixotos-projects.vercel.app
- Origem: candidato `8d44b1d1`, com somente `vercel.json` alterado; avanços do produto desde então são testes/documentação, sem mudança de runtime.

O acesso live ao Preview pelos conectores permaneceu bloqueado pelo SSO da Vercel. A inspeção Chromium do CI não é apresentada como navegação nesse deployment. O status Vercel success da branch de produto corresponde a build ignorado pela política main-only, não a outro Preview publicado.

## 7. Fechamento operacional

Integrar o head documental final do #376 após gates coerentes e confirmar Production READY, SHA do merge no manifesto público, rotas/assets e tela renderizada. Registrar resultado e eventuais limites no #376. Não executar escritas artificiais em dados de Production para repetir a homologação já feita em ambiente de teste.

Após a confirmação de publicação no #376, esta frente não tem próxima correção planejada. Qualquer nova frente exige revalidação do `main`, ambiente e regras atuais.
