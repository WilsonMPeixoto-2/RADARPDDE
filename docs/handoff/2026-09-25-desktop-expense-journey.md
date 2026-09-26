> **Encerramento em 26/09/2026:** este handoff deixou de ser corrente. A implementação e homologação foram concluídas em `2d21e752`; os 16 workflows estão verdes, inclusive runs `36276637534` e `36276637527` (183 passed / 54 skipped). A inspeção visual do mesmo runtime foi registrada no #376 com artifact `10916268576`. O delta de 8 px era medição antes da remoção da classe de Dashboard; apenas a sincronização do teste mudou. #375 foi fechado sem merge e #376 é a entrega única. O usuário autorizou publicação em 26/09. Estado operacional e resultado do merge/deployment: `docs/CURRENT_STAGE.md` e comentário final do PR #376. O texto abaixo preserva o checkpoint anterior e suas pendências já superadas; não representa fila de trabalho atual.

# Handoff histórico — jornada desktop de Despesa a identificar

**Atualizado:** 26/09/2026  
**Estado:** #376 consolidado como candidato único contra `main`; código/testes alinhados; sete gates verdes; Preview desktop final READY; resta apenas homologação visual/navegada antes de qualquer merge/publicação.  
**Production:** `bb7246438b8c6b72ef068b21bb40d492a7049af2`.  
**Candidato:** `8d44b1d18f96b1dddb96f1d92af2cd816587e759`.  
**Runtime funcional/UI:** `4994aeb331f643c09ab4b76f66e5c831be9cd5d2`.

## 0. Retomada em 30 segundos

Não reiniciar a investigação.

- #376 foi retargetado para `main` e contém integralmente #375;
- #375 não precisa nem deve ser mergeado isoladamente;
- #377 é somente histórico de sincronização;
- a execução vermelha atribuída ao #375 testou, na verdade, `pull/377/merge`, misturando runtime novo com teste antigo;
- os sete workflows do head `8d44b1d1...` estão verdes;
- Preview atual: `dpl_EcLDqaAPe7aWo5dwNyR6G3TuwQSy`, READY;
- branch Preview: `preview/desktop-final-2026-09-26`, commit `9aa59f5a...`;
- branch Preview difere do produto somente em `vercel.json`;
- falta homologação visual/navegada desse Preview;
- não fazer merge em `main` sem autorização, pois isso publica Production automaticamente.

## 1. Por que a estratégia mudou

O plano antigo era:

`merge #375 → retarget/rebase #376 → merge #376`

A análise dos logs mostrou que o único “vermelho do #375” usado como bloqueio não era uma execução do #375 isolado.

### Verde real do #375

Run `36252023185`  
checkout: `refs/remotes/pull/375/merge`  
merge SHA: `97d3431131c730fadc002208d0852c1b315487d5`  
resultado: **182 passed**.

### Vermelho enganoso

Run `36261864567` / job `108465025843`  
checkout: `refs/remotes/pull/377/merge`  
merge SHA: `b79f4d93f6fea3a336dfd0389878ce914f2c3ba6`

Esse merge temporário já carregava o runtime do #376, que foca `.reanalysis-guidance`, mas ainda trazia o teste antigo de `#reanalisar-resultado`.

Não existe evidência de race de foco a corrigir no produto por esse run.

A solução mais simples e fiel ao estado real foi manter todo o histórico e transformar o #376 em candidato único contra `main`.

## 2. PRs

### #376 — candidato único

- branch: `fix/desktop-expense-journey-2026-09-25`
- base: `main`
- head: `8d44b1d18f96b1dddb96f1d92af2cd816587e759`
- mergeable, draft
- contém todo o #375
- runtime funcional: `4994aeb3...`
- commits posteriores ao runtime são testes/documentação.

### #375 — substituído

- head: `d591b231eb06e95a1c09ba2fb6e40d2c7bb83f7d`
- conteúdo preservado dentro do #376
- não integrar separadamente.

### #377 — histórico

Merge técnico usado para sincronizar os dois últimos commits do #375 ao #376. Não é candidato a `main`.

## 3. Código ↔ regra ↔ teste

| Contrato | Implementação/prova |
|---|---|
| filtro escolar usa estado real da Task 9 | `navigation-bootstrap.js`, `task-9-focus-bridge.js`, canonical routes |
| limpar filtro devolve fila global | `clearSchoolRouteContext()` + E2E |
| Prontuário usa URL própria | `navigatePendencyContext()` + E2E |
| retorno preserva contexto | `returnToPendencias()` + E2E |
| `a_identificar` nasce atômico | fluxo Invoice/Pendency vigente |
| identificação preserva identidade/histórico | jornada real + regressões existentes |
| identificação abre pelo topo | runtime + jornada E2E |
| reanálise abre pela orientação | `openReanalysisModal()` + `pendency-cycle.spec.js` atualizado |
| hierarquia da reanálise | runtime/index + jornada |
| ação longa contida | CSS + `pendency-desktop-action-containment.spec.js` |
| feedback não fica sob drawer | CSS/body marker + jornada |
| layout espera CSS final | helpers de layout atualizados sem relaxar tolerâncias |

## 4. CI do candidato

Head `8d44b1d1...`:

- Playwright — success
- Validar RADAR — success
- snapshot — success
- retificação — success
- Lighthouse — success
- Supabase readiness — success
- Excel SME — success

Nenhum vermelho técnico conhecido permanece no candidato.

## 5. Preview final

Branch:
`preview/desktop-final-2026-09-26`

A branch está ahead 2 / behind 0 do candidato e altera somente `vercel.json`.

Primeiro deployment:
`dpl_4wFGj3QbqQRwuFdKXCNhCJL9qjaJ` — ERROR

A falha foi intencionalmente explicada pelos guardrails unitários que rejeitam qualquer branch Vercel além de `main`. A política do produto não foi relaxada.

Segundo commit efêmero:
`9aa59f5a0fea47bbb03036dfa6eda0ee001eac15`

Deployment válido:
`dpl_EcLDqaAPe7aWo5dwNyR6G3TuwQSy` — READY

URL:
`https://radarpdde-4ja1codbg-wilson-m-peixotos-projects.vercel.app`

Não mergear `preview/*`.

## 6. Homologação que falta

No Preview acima, desktop:

1. Pendências filtradas por escola;
2. abrir/fechar drawer;
3. alternar abas;
4. limpar filtro e confirmar fila global + URL;
5. abrir Prontuário e validar URL/reload;
6. voltar e validar contexto;
7. identificar `a_identificar`;
8. confirmar ação longa contida;
9. confirmar modal de identificação no topo;
10. confirmar feedback ao lado do drawer;
11. abrir reanálise e validar orientação/contexto/hierarquia;
12. registrar screenshots do mesmo candidato.

Essa prova visual é a única lacuna material conhecida.

## 7. Integração

Push em `main` publica Production automaticamente.

Logo, não existe uma etapa segura de “merge agora e Production depois” com a configuração atual.

Após homologação visual:

- registrar evidência final;
- confirmar diff final contra `main`;
- deixar #376 pronto;
- merge/publicação somente com autorização explícita.

## 8. Não fazer

- não mergear #375 isoladamente;
- não reverter a UX para satisfazer teste histórico;
- não relaxar guardrail Vercel do produto por causa da branch Preview;
- não mergear `preview/*`;
- não tratar o run de `pull/377/merge` como prova contra o #375;
- não declarar homologação visual sem ter navegado o Preview final;
- não publicar Production sem autorização.
