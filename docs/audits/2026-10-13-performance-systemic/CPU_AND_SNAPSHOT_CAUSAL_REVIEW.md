# RADAR PDDE — Perfil de CPU e hipótese de cópias de estado por entidade

**Checkpoint:** 13/10/2026 BRT (CI executado em 14/10 UTC).  
**Prod:** somente leitura histórica nesta frente; **nenhuma alteração no banco, runtime ou Vercel Production**.  
**Baseline de referência do produto:** `main@1a1cda117e31f84647bf4591e4d6db899ef231f1`; teste PR [#447](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/447), diagnóstico documental PR [#446](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/446).

## 1. Nova prova: CPU por clique com banco descartável

GitHub Actions run [38496306947](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38496306947) **SUCESSO no workflow operacional**: jobs baseline e candidate, comparador e teste Chromium de três gestos concluídos. Artefatos brutos lidos:
- `operational-metrics-baseline-38496306947`, ID 11864693873;
- `operational-metrics-candidate-38496306947`, ID 11864219267;
- `operational-comparison-38496306947`, ID 11864414518.
- Evidência tabulada persistente: [`CPU_PROFILE_RUN_38496306947.json`](CPU_PROFILE_RUN_38496306947.json), versão 1.

| Gesto | Baseline: clique até persistência/visibilidade | Candidate: clique até persistência/visibilidade | CPU amostrada em `cloneValue` candidate | Substituições principais |
|---|---:|---:|---:|---:|
| Bonificação, Não→Sim | 452 ms | **468 ms** | ~43 ms | 0 |
| Análise técnica, selecionando Correto | 373 ms | **343 ms** | ~35 ms | 0 |
| NF consumo, criada e visível | 1003 ms | **992 ms** | ~49 ms | **1** |

A janela possui **uma amostra de cada gesto por variante**. Não é amostra estatística, nem prova de Production, nem demonstra que toda escrita é lenta. A NF usa uma RPC distinta (save_invoice_with_effects_v2), logo não isola apenas a renderização. Nas três ações **não houve consulta de contexto operacional na janela medida**, mas houve a RPC específica de salvamento; o custo visível não pode ser atribuído a nova consulta global naquele momento.

O profiler CDP registra muita amostragem como `(idle)` e `(program)`, não atribuível a aplicação; o tempo total amostrado **não deve ser somado ao tempo de parede**. `cloneValue` é uma observação concreta, mas seus ~35–54 ms são aproximações amostradas, não custo exato por chamada. A análise técnica/bonificação tiveram 59/66 mutações DOM; a NF 109. Mutações DOM não equivalem a renders integrais.

## 2. Novo elo compartilhado confirmado no código: clones por entidade, não por registro

**Causa estrutural candidata, com mecanismo estático confirmado e indício de custo real no CPU profiler.**

- `src/data/repository-contract.js:116–125`: `cloneValue` usa `structuredClone` profundo, com fallback serialização JSON.
- `src/application/state-port.js:31–59`: escopo de memória é **por entidade** (`verifications`, `logs`, `registeredInvoices` etc.), não por uma escola/linha. `captureEntities()` clona a memória dessas entidades (linhas ~294–303) e `exportCanonicalEntities()` exporta a coleção inteira dessa entidade (linhas ~377–388). Isso já melhora substancialmente o clone global prévio, mas ainda copia registros de outras escolas presentes na coleção.
- `src/application/unit-of-work.js:119–140,172–177`: a operação remota captura as entidades alteradas, exporta snapshot, clona o snapshot entregue ao persistidor e clona novamente snapshot/valor/resultado ao finalizar. Cada etapa pode ter uma justificativa de rollback, isolamento ou integridade.
- `src/application/data-service.js:213–228,1075–1097,1171–1177`: `mergePersistedResult()` clona o snapshot para conciliar o resultado autoritativo, `applyRemoteState()` aplica entidades e a resposta final retorna uma nova cópia do snapshot. Assim, **uma avaliação isolada pode produzir várias cópias de objetos que incluem avaliações não modificadas**.
- Esses clones de objetos são um mecanismo **diferente** do rerender do Prontuário. Podem contribuir tanto para bonificação quanto análise e NF, conforme indicam as amostras de CPU.

**Cuidado:** a razão dos clones é proteção da transação, e a remoção inadvertida pode causar corrupção do estado, rollback incorreto, conflitos entre controladores, falhas ao reanalisar ou perda de logs. Não aprovar mudança por observação de CPU isolada. A hipótese a testar é o **escopo excessivo** dos dados clonados, não a existência de cópias defensivas em si.

## 3. Contraprova: o benchmark agregado varia entre rodadas

No run 38496306947 (400 rodadas, seis sessões, **1.107 escritas por variante**, todas concluídas):

| Métrica | Baseline | Candidate | Resultado |
|---|---:|---:|---|
| Corpo das respostas de leitura | 37.211.842 B | 9.315.410 B | **-74,97%** |
| Tentativas de leitura | 76 | 48 | **-36,84%** |
| Tempo total | 477.056 ms | 447.567 ms | **-6,18%** |
| Tempo acumulado em tarefas longas | 144.899 ms | 158.367 ms | **+9,29%** |
| Parte bloqueante das tarefas longas | 57.099 ms | 67.017 ms | **+17,37%** |

O comparador contém advertência de custo para `longTaskTotalMs` e `longTaskBlockingMs` e ressalta que as atualizações podem ter sido adiadas durante a carga. Numa rodada anterior (38495224625), o tempo total havia sido praticamente igual nas duas versões e tarefas longas +1,51%, reforçando **variabilidade**. Não classificar diferença de uma execução como regressão comprovada, nem ganho de tempo como produto fluido para usuários. Foco em **custo CPU e frescor durante a atividade**.

## 4. Teste diagnóstico adicional de cópias de estado (PENDENTE)

O PR #447 recebeu `tests/unit/systemic-state-snapshot-amplification.test.js` (commit `64e12edac9e536f34463896744aad756543c8d92`). Executa `StatePort` e `UnitOfWork` reais sobre coleções **sintéticas** de 1, 163 e 1.630 avaliações, sempre alterando apenas um registro. Registra quantos registros foram transportados e quantas cópias integrais dos snapshots/arrays foram realizadas. **Ainda não afirmar execução verde ou tempos antes de consultar o CI do commit.**

Esse teste é **caracterização do desenho atual, não exigência funcional de que o sistema continue copiando tudo**. Após uma otimização realmente segura, o teste diagnóstico deve ser atualizado para acompanhar a nova arquitetura e a equivalência do rollback.

## 5. Falha paralela de E2E, não atribuída sem prova

No SHA anterior do PR #447, a suíte `Testes E2E Playwright` run [38496307068](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38496307068) teve **221 testes aprovados, 70 ignorados e um com falha**. No caso `unidentified-expense-user-journey.spec.js:218`, guia da reanálise apareceu **~1,78 px acima** do término geométrico do cabeçalho (valor esperado ≥125,562; recebido 123,787). O retry travou em screenshot ao atingir 30 s. As alterações feitas no PR #447 até esse ponto são exclusivamente testes e workflow; **nenhum CSS ou runtime foi alterado**. Não há base para atribuir esse desvio aos novos testes de CPU, nem para “consertar” layout/teste indiscriminadamente. Registrar como achado independente, com screenshot/trace do artifact 11864182593 disponível por sete dias, e verificar estabilidade em execução controlada da suíte individual caso a frente visual seja retomada.

## 6. Sequência correta para o próximo agente

1. Consultar CI de `64e12eda...`; ler output `[state-clone-characterization]` do job `Validar RADAR PDDE`, verificar que o teste usa `StatePort` e `UnitOfWork` reais. Gravar números no manifesto e no relatório, com limitações.
2. Se confirmada a cópia de coleções inteiras, fazer teste causal **1x/3x/10x com massa representativa e processamento por competência/escola**, mantendo idêntico número de alterações; comparar clone CPU, GC, espera do clique, respostas do banco e memória. Não confundir total de registros do banco com dados atualmente carregados na memória.
3. Definir mapa de dependências para otimizar uma NF sem perder bonificação, análise, Pendência, Assessoria, patrimônio, foco, rolagem, histórico e autorização. Registrar o evento correto que atualiza cada região.
4. Instrumentar frescor de outras sessões durante uso normal (com pausa entre cliques), não apenas convergência final; preservar o limite de carga de RPCs da Production.
5. Só então desenhar a simplificação estrutural por **unidade escolar/registro** quando seguro; não remover clones essenciais, RLS, auditoria e rollback em nome de velocidade.
6. Avaliar o E2E geométrico isoladamente. Não reabrir frontend para corrigir ~2px sem evidência de erro real ou consistência com a referência aprovada.

**Status:** relatório versionado, sem modificação de Production. PRs #446 e #447 continuam em Draft, sem merge.
