# Diagnóstico da captura no ciclo de despesa a identificar (23/10/2026)

**Tipo:** correção de teste E2E com evidência do layout real. **Não é uma correção de produto.**

## Fonte material
- Execução original do PR documental #478: [39908494735](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39908494735), job `120265806421`.
- Artefato Playwright: `functional-lifecycle-39908494735`, ID `12481768443`, com PNG, vídeo e contexto de erro.
- `tests/e2e/supabase-expense-independence.spec.js`, teste `primeira despesa a identificar de outro programa`, competência `2026-05`, Conectada, viewport **1366×768**.
- A captura original mostra a despesa e o painel `Notas Fiscais`, com `Débito sem documento Conectada`, classificação `Incorreto`, botão `Visualizar pendência`, `Adicionar Nota` e `Registrar despesa a identificar`. Os controles estão na área visível da imagem.

## Causa do apontamento e classificação

O helper `capture()` forçava `scrollIntoView({block:'center'})` no painel completo e exigia `toBeInViewport({ratio:1})` sobre o contêiner. Playwright mediu **0.9488689303398132**, isto é, 94,89% do painel. A captura confirma que parte inferior da caixa, próxima à borda do viewport, ficou recortada, mas as ações operacionais continuaram visíveis.

A exigência de ver **cada pixel de um painel incluindo bordas** não corresponde ao critério de usabilidade que se queria proteger (ações principais disponíveis na captura). A intervenção não reduz `ratio` arbitrariamente. Passa a comprovar `panel.toBeVisible()` e `toBeInViewport({ratio:1})` **para ambos os botões de ação**, sem alterar o posicionamento real nem forçar a visibilidade dos botões individualmente antes da asserção.

**Falha secundária:** no retry da `describe.serial`, o primeiro teste verificou incorretamente que `verifications` estava vazio, depois que os testes anteriores já tinham criado linhas no Supabase descartável. Evidência: retorno BASIC e CONECTADA para `ESC-INDEP`. A precondição de isolamento do retry não foi resolvida neste PR; sua correção exige estudo do ciclo serial/fixtures e não deve apagar o contrato fiscal.

## Critérios

1. Executar os testes em Playwright com Supabase descartável real, não somente os unitários.
2. Verificar os dois botões `Adicionar Nota` e `Registrar despesa a identificar` com `ratio:1`; qualquer botão operacional incompletamente visível deve continuar gerando falha.
3. Confirmar ausência de mudança de JS do produto, CSS, RPCs, banco, fixtures ou regras fiscais.
4. Não interpretar os 94,89% do painel como falha financeira ou como confirmação automática de layout impecável. A captura mostra parte inferior de contêiner cortada, que pode justificar estudo de diagramação independente se atrapalhar o usuário.
5. Se o gate completo apresentar falhas de outras suítes, analisar sua causa sem degradar asserções por conveniência.

**Estado:** proposta limitada de teste. Nada alterado em Production.
