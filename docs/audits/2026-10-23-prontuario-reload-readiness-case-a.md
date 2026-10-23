# Caso A da issue #460: caracterização de prontidão após reload do Prontuário

**Classe:** investigação causal/teste observacional, **não** correção de sincronização, hidratação, permissões ou negócio.  
**Base de código:** `main@2b46df7eeb9c6a649e1d4d3e0ad0cfb1076af498`, após [PR #485](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/485); o SHA da branch/PR de diagnóstico precisa ser revalidado separadamente.  
**Questão histórica:** [issue #460, Caso A](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/460) narra um estado `inapta` persistido no Supabase versus `nao-lancada` calculado em memória/exportação logo depois de `page.reload()`, durante teste do antigo PR #446. A divergência apareceu após rerun, com fixtures serializadas capazes de contaminar retries. O Caso B de geometria **foi corrigido** pelo #463 e não participa desta investigação.

## Observações verificadas no código-base atual

1. `app.js` → `initializeRadarData()` chama `radarDataService.bootstrap(...)` antes de definir `window.RadarDataContext = Object.freeze({ready:true, ...})`. O carregamento inicial usa uma competência derivada de `RadarCompetencia.previousCompetenceKeyFromDate()`. Portanto `ready` é sinal do **bootstrap inicial**, não um contrato textual explícito sobre *todas* as trocas de competência que ocorram posteriormente.
2. `src/integration/global-competence-selector.js` mantém `hydrationPromise`, `hydrationSequence` e `lastHydratedCompetence`; o método público `whenHydrated()` existe. `applyState(..., {initial:true})` não aguarda `hydrateRemoteState` e usa a competência operacional inicial existente; transições não iniciais podem iniciar `dataService.loadOperationalContext` de forma assíncrona. **Possibilidade**, não causa comprovada: competência escolhida, snapshot remoto e memória podem estar em fases diferentes após um reload.
3. `src/domain/competence-context.js` resolve competência inicial a partir da seleção explícita, armazenamento e fechamento conforme exercício. O seletor global também considera competência previamente carregada; determinar a ordem exata no cenário da fixture e a semântica de `meta.initial` exige medição, não suposição.
4. `app.js` → `getProgramBonificationStatus(escolaId,compKey,progId)` lê `verificacoes[escolaId][compKey_progId]` em memória, **não** a resposta `Supabase.from('verifications')` consultada pelo helper `persistedContext(page,...)` no E2E. A função de domínio `RadarFluxoOperacional.getProgramBonificationStatus` prioriza `bonus_result`/resultado consolidado quando presente. Assim, uma consulta remota correta **não demonstra sozinha** que a fatia em memória já foi aplicada.
5. O E2E `tests/e2e/supabase-expense-independence.spec.js` verifica `bonus_result` remoto e, depois, resultado projetado/exportação após reload. O teste histórico não registrava, no **mesmo instante da divergência**, a tríade `selectedCompetence` / `operationalCompetence` / `verificacoes` e o `RadarDataContext.ready`.

## Mudança proposta na branch de caracterização

Apenas o cenário E2E preexistente do Controlador e Assistente Federal recebe **observação passiva antes das asserções que já existem**. Em cada reload, anexa JSON com:
- valor remoto `bonus_result` lido pelo helper existente (sem consultas adicionais);
- `RadarDataContext.ready`, valor do seletor e `RadarCompetenceContext.getState()`;
- `RadarApplicationServices.data.currentOperationalCompetence`;
- presença de `verificacoes[school][competence_program]`, `bonus_result` e documento de bonificação;
- retorno de `getProgramBonificationStatus` naquele instante;
- PNG **somente se houver divergência**, preservando o estado efetivamente apresentado ao usuário.

**Não há** `waitForTimeout`, polling para obter verde, espera de `whenHydrated()`, relaxamento de expectativa, novas credenciais, alteração de fixture, mutação de banco, CSS, JS produtivo ou API do RADAR. Uma leitura extra de memória pode ter custo/timing mínimo e por isso **não é medição neutra de latência**, mas não introduz espera específica por convergência. As asserções pré-existentes permanecem.

## Decisão que esta prova poderá apoiar

- **Banco `inapta`, memória ausente, competência operacional diferente:** investigar ordenação inicial, recorte operacional e contexto da competência, sem concluir automaticamente se é bug de produto ou contrato de prontidão.
- **Banco `inapta`, memória ausente, competência igual:** investigar aplicação/cobertura do snapshot e stale response, preservando Auth/RLS e histórico.
- **Banco e memória `inapta`, função `nao-lancada`:** investigar contrato de projeção/domínio e formato da verificação, com contraprova de unidade.
- **Banco, memória, função `inapta`, DOM/exportação divergem:** investigar atualização de view/exportação, separada de DataService.
- **Nenhuma falha na execução:** houve aprovação dos gates naquele SHA, **não prova** que a divergência histórica esteja causalmente resolvida. Não repetir indefinidamente até surgir falha.

Qualquer correção de produto subsequente exige um **novo teste RED causal** na camada responsável, paridade banco–memória–DOM–exportação, segurança entre sessões/competências e verificação visual no navegador. Manter a frente distinta do custo de pintura A9 e do fallback escolar `MISSING_BASELINE_COVERAGE`.

## Resultados ainda pendentes

**NÃO PREENCHER antes de consultar o CI do HEAD final:** status de Playwright e ciclo Supabase, artefatos gerados, valores de `reloadReadiness`, recorrência do sintoma e classificação da causa. O PR de caracterização pode ser integrado com CI verde como **instrumento**, não como correção. Se um teste falhar, inspecionar o JSON e o PNG antes de atualizar a hipótese ou relançar jobs.
