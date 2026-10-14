# RADAR PDDE — Handoff verificável: lentidão sistêmica

**Checkpoint:** 13/10/2026 BRT (últimos runs em 14/10 UTC).  
**Baseline do produto:** `main@1a1cda117e31f84647bf4591e4d6db899ef231f1`.  
**PR documental:** [#446](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/446), Draft.  
**PR de testes:** [#447](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/447), Draft.  
**Risco operacional:** zero alterações deliberadas em Production, runtime, permissões, regras, migrations ou dados institucionais. Testes de escrita usam apenas Supabase descartável.

## Leia primeiro, nesta ordem

1. `AGENTS.md`, `docs/reference/ENGINEERING_METHOD.md`, `docs/reference/SYSTEM_CANONICAL_MODEL.md`, `docs/reference/PRODUCT_SURFACE_CATALOG.md`.
2. **[Diagnóstico causal completo](INITIAL_CAUSAL_DIAGNOSIS.md)**, incluindo checkpoints 1–8.
3. **[Manifesto de evidências persistentes](EVIDENCE_MANIFEST.json)**: runs, métricas consolidadas e ressalvas em formato legível por máquina. Leia também **[medições por sessão](PER_SESSION_SUMMARY.json)**, preservadas do artefato original para evitar perda do detalhe após expiração.
4. `tests/unit/systemic-performance-characterization.test.js`, `tests/e2e/operational-multi-competence-performance.spec.js`, `tests/e2e/operational-write-cpu-performance.spec.js` da branch do **PR #447**.
5. Artefatos de origem dos workflows enquanto disponíveis. Eles têm **retenção limitada** (tipicamente 30 dias) e NÃO substituem o manifesto commitado.

## O que está demonstrado e o que NÃO está

| Assunto | O que foi provado | Ainda não se sabe |
|---|---|---|
| Custo no navegador | Em [run 38495224625](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38495224625), 1.107 gravações idênticas por variante; tráfego -66,61%, duração total quase igual, long tasks +1,51% no candidato | Quais funções geram CPU depois de cada gesto e se carga cotidiana repete o padrão |
| NF | `salvarDadosNota` chama `renderProntuario` após salvar; o renderer substitui `main-container.innerHTML`; fluxo NF tem aproximadamente uma reconstrução completa por gravação no ensaio sustentado | Quanto dessa reconstrução é caro, quais outras partes precisam atualizar e qual substituição local é segura |
| Realtime | Teste **executado**: escolas A+A => leitura escolar; A+B => leitura global; avisos repetidos t=0..4 s => atualização em t=6 s | Frequência desse fallback na rotina real; solução que não comprometa consistência |
| Competência | Teste com meses agosto/setembro/outubro em Supabase descartável passou em baseline e candidato; **uma** RPC/uma reconstrução por troca; todas as seis trocas de cada variante abaixo de 600 ms | Por que usuários sentem lentidão em sessões mais longas, aparelhos mais modestos ou com concorrência |
| Histórico | Audit log paginado fora do bootstrap normal; consulta do log administrativo por cursor eficiente; 23.473 atualizações auditadas sem snapshots idênticos | Custo marginal de triggers por escrita com volumes 1×/3×/10×; não há prova de que seja o principal gargalo |
| UX após clique | Projeto registra eventos e métricas de feedback, mas um `requestAnimationFrame` não prova pintura final | Tempos reais até confirmação visível por operação e contexto, especialmente após analisar/abrir Pendências |

**Hipótese integradora:** amplificação de trabalho por ação. Escrever ou trocar mês pode desencadear invalidação da cobertura, releitura global, aplicação ampla de estado, reconstrução de interface e observadores visuais. Parte das salvaguardas protege integridade e é indispensável. Não eliminar qualquer mecanismo antes de quantificar custo e garantir comportamento equivalente.

## Evolução executada e evidências definitivas

- **PR #446**: `INITIAL_CAUSAL_DIAGNOSIS.md` concentra história, source code, medições de Production somente leitura, planos de SQL/índices e 8 checkpoints; este `HANDOFF_AND_TEST_PLAN.md` é o ponto de entrada; `EVIDENCE_MANIFEST.json` preserva números quando artifacts expirarem.
- **PR #447**: três testes unitários de agendamento executados, 3/3 verdes em [run 38492452052](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38492452052).
- **PR #447**: teste de três competências executado em dois navegadores/autenticações com volumes por mês e resultados preservados.
- **Falha do harness, NÃO do produto:** run [38493158276](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38493158276) teve os dois E2E verdes mas o comparador falhou: segunda invocação Playwright limpava o diretório `test-results/` da primeira. Corrigido pela opção `--output=playwright-results-multi-competence` no commit `13538fbb00b4225b18bedc8e45308f7226389b59`.
- **Contraprova de correção do harness:** workflow [38495224625](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38495224625) terminou **SUCESSO** em ambas as variantes e no comparador. Artifact `operational-comparison-38495224625` id `11864340261`, run SHA `a8690c2a790219b0844595533b30d4ab1185c9c4`. Confira números detalhados no JSON versionado.
- **Nova prova de CPU (PENDENTE DE VERIFICAÇÃO):** `operational-write-cpu-performance.spec.js` foi acrescentado ao workflow e usa o protocolo Chromium para amostrar funções que consomem processamento em três operações (bonificação, análise técnica, NF). Run acionado: [38496306947](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38496306947), SHA PR #447 `87c69fbfb571da83324bd088d35f3c5204d024c2`. **Não dizer que passou até conferir jobs, logs, anexos e medidas.**

## Como continuar sem repetir nem produzir loop de remendos

**A. Encerrar a medição de CPU:** consultar o workflow [38496306947](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38496306947). Se passou, abrir `operational-metrics-baseline-*` e `operational-metrics-candidate-*`, arquivos `operational-sustained/cpu-write-{baseline,candidate}.json`; comparar as três ações, top funções, mutações, troca de mês, resultado visual. Se falhou, **diagnosticar primeiro se é teste ou comportamento legítimo**, corrigir instrumento somente no PR #447. Preservar resultados num novo checkpoint Markdown/JSON versionado no PR #446. Não usar uma rodada como percentil populacional.

**B. Perfilar CPU com prova causal:** se NF mostrar maior custo, comparar com bonificação com gravação similar e screenshots antes/depois; identificar `renderProntuario`, indexação, observadores e layout. Repetir 3–5 vezes de modo pareado, igualar estado/carga e confirmar UI. Um ganho no Chrome não autoriza remover regras patrimoniais, reanálise, Assessoria ou trilha de auditoria.

**C. Confirmar relevância institucional:** teste de quatro Controladores em escolas distintas + Assistente e Dashboard, em ritmo humano e com perfil de CPU moderado; conservar stress em separado. Medir desde clique até feedback, servidor, confirmação final e tela estabilizada, além de no máximo uma consulta escolar/global necessária por motivo. Comparar sem incluir dados de Production.

**D. Crescimento histórico preventivo:** benchmark sintético de gravação e leitura com 1x, 3x, 10x eventos; auditoria habilitada, somente em banco descartável. Registrar tempo de gravação, tamanho, plano de consulta, índices, custo de manter logs e recuperação de backup. Não limpar logs reais.

**E. Decisão arquitetural:** produzir mapa de causas por mecanismo com **prova, hipótese refutada, teste de regressão e riscos**. Só propor PR de produto após confirmação, avaliação cruzada de Navegação, Carteira, Competências, Prontuário, Pendências e patrimônio. Se 2 tentativas de correção não convergirem, reavaliar a estratégia e suspender novos remendos.

## Disciplina de versões e preservação

- **Nunca declarar trabalho concluído somente porque foi enviado ao GitHub.** Confirmar estado remoto (SHA), arquivos, CI, evidência e efeitos reais.
- **Cada checkpoint:** atualizar este handoff com SHA/status/teste; acrescentar uma seção no diagnóstico com o *resultado*, não apenas planejamento; atualizar o `EVIDENCE_MANIFEST.json` quando saírem novas medições.
- **Artifacts expiram:** resultados sanitizados relevantes devem ser commitados em Markdown/JSON no PR #446. Não commitar credenciais, dados pessoais/institucionais, dumps ou vídeos desnecessários.
- **Branches mantidas separadas:** #446 só documentação e métricas; #447 só testes/CI, sem alterações de runtime; sem merge automático. Se surgir necessidade de corrigir produto, usar PR próprio com prova e validação.
- **Critério de sucesso:** latência percebida melhor e custo global não piora, com dados íntegros, feedback correto, persistência após refresh, autorização preservada, coerência entre sessões, rollback e ausência de regressões.

## Resumo executivo para agente substituto

Os sintomas de lentidão são históricos e transversais. Redução de tráfego (-66,6%) **não** reduziu o tempo total ou trabalho do navegador no ensaio pesado. A própria aplicação reconstrói o Prontuário após NF; a reconciliação incremental já evita boa parte disso na avaliação simples. O Realtime reúne eventos e às vezes promove escola→global, ou adia atualização até acabar a sequência de avisos. Troca de mês isolada foi rápida no laboratório, não certificando a Production. A frente seguinte **é classificar CPU real dos três gestos** e testar hipóteses causais, não mexer em timers/cache/render no escuro. Consulte PRs #446/#447, confira o último run, versione os achados.


## Atualização de 13/10 BRT — conclusão de CPU e cópias por entidade

- **Perfil CPU concluído e validado:** workflow [38496306947](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38496306947) success; relatório [CPU_PROFILE_RUN_38496306947.json](CPU_PROFILE_RUN_38496306947.json) e interpretação detalhada [CPU_AND_SNAPSHOT_CAUSAL_REVIEW.md](CPU_AND_SNAPSHOT_CAUSAL_REVIEW.md). Tempos candidate bonificação **468 ms**, análise técnica **343 ms**, NF **992 ms**; uma amostra por ação em CI, não SLO de Production. NF foi a única que substituiu toda a view. `cloneValue` consumiu cerca de 43/35/49 ms de CPU amostrada nas três ações; amostragem não é cronômetro exato.
- **Teste real de escopo de snapshot aprovado:** `systemic-state-snapshot-amplification.test.js` exercitou `StatePort` + `UnitOfWork` reais, com 1, 163, 1.630 registros sintéticos e **uma única avaliação alterada** em cada massa. `Validar RADAR PDDE` run [38499041481](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38499041481) success; `unit-tests.xml` teve 1.365 casos e o caso diagnóstico consta sem falha. Prova: snapshot continua sendo por **entidade**, não por escola/linha. **Não há ainda benchmark de custo percentual em Production**, nem autorização para retirar clones essenciais.
- **Falhas paralelas sem atribuição ao runtime:** `Supabase readiness` run [38499041317](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38499041317) falhou em `supabase start` com limite de solicitações Docker e porta **54322 ocupada**; CI de E2E geral run [38496307068](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38496307068) tinha um desvio geométrico de ~1,78 px em teste de reanálise e timeout no screenshot de retry. Alterações do #447 são **somente testes**, portanto não atribuir regressão ao produto sem prova independente. Evitar retries em cascata ou correções cosméticas de harness.
- **Próxima campanha:** parear perfil de CPU em hardware mais modesto e com massas operacionais diferentes, isolar apenas custo de `cloneValue`/exportação, preservar rollback e concorrência; distinguir rerender pós-NF do clone de estado; medir frescor com múltiplos usuários em cadência humana. Se não houver ambiente isolado disponível, manter a frente em diagnóstico, sem stress em Production.


## Checkpoint prioritário seguinte — medição de custo por volume (14/10 UTC)

O teste de crescimento foi **executado** e conferido no artifact `systemic-state-clone-diagnostics`, run [38500456162](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38500456162), conclusão **success**. Cinco execuções para cada tamanho, sempre **uma** avaliação alterada: 1 / 163 / 1.630 / 16.300 registros resultaram em medianas locais de **0,39 / 5,41 / 53,39 / 523,07 ms**, respectivamente, e **6 / 978 / 9.780 / 97.800 ocorrências de registros clonados**. O relatório JSON completo, inclusive todas as amostras e ressalvas, está em [`STATE_CLONE_VOLUME_RUN_38500456162.json`](STATE_CLONE_VOLUME_RUN_38500456162.json). Isso **demonstra a amplificação de trabalho por registro alheio no mecanismo isolado**. NÃO extrapolar milissegundos para Production: objetos sintéticos, Node GitHub Actions, sem rede, SQL, RLS, DOM ou concorrência.

O experimento de render sem escrita foi adicionado a `tests/e2e/operational-write-cpu-performance.spec.js`, PR #447, comparando chamadas repetidas de `renderProntuario` com dados idênticos. Workflow [38500456205](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38500456205) ainda **pending** na última verificação; seus tempos não estão homologados. Ao concluir, abrir artifacts `operational-metrics-baseline/candidate`, arquivos `pure-render-{baseline,candidate}.json` e `cpu-write-{baseline,candidate}.json`. Preservar números sanitizados no manifesto e documento causal e verificar CI integral. Se falhar, diagnosticar o test harness antes de mudar runtime.

**Conclusão arquitetural provisória:** o código vigente reduz o custo de operações remotas ao trabalhar por entidade, mas ainda pode copiar todos os registros da entidade (não só uma escola), diversas vezes na mesma ação. O próximo desenho deve considerar granularidade e isolamento por registro **sem quebrar** rollback, auditabilidade, autorização, idempotência, reanálise de NF, concorrência e sincronização. Não implementar esse desenho como hotfix até haver teste pareado ponta a ponta e contraprovas.



### Nota de infraestrutura do run 38500456188

O workflow `Supabase readiness` [38500456188](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38500456188) encerrou com falha exclusiva no job `supabase-local`, etapa `Regenerar tipos e cliente fixado`; `migration-smoke` e `readiness` passaram. Log original registra repetidamente **`docker: Error response from daemon: toomanyrequests: Data limit exceeded`**. Portanto, **é bloqueio de obtenção de imagem Docker no runner**, não diagnóstico de mudança funcional do RADAR nem da investigação de clones. A estratégia de revalidar é corrigir a capacidade/limite de pulls no ambiente de CI, não mexer em migração ou permissões. Evitar disparar novas execuções em loop. O teste unitário escalonado foi aprovado no workflow independente `Validar RADAR PDDE` [38500456162](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38500456162), com JSON disponível na trilha permanente.



## Resultado quantitativo de escala confirmado em 13/10 BRT

O workflow [38500456162](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38500456162) concluiu `Validar RADAR PDDE` **success**. Foi recuperado e conferido o arquivo bruto `state-clone-amplification.json`, artifact `systemic-state-clone-diagnostics` ID **11864979495**. Resultados **permanentemente versionados** em [STATE_CLONE_VOLUME_MEASURED.json](STATE_CLONE_VOLUME_MEASURED.json).

Uma única avaliação foi alterada em cada caso, com cinco execuções após aquecimento:

| Registros de verificação em memória | Ocorrências totais de registros clonados | Tempo mediano |
|---|---:|---:|
| 1 | 6 | 0,39 ms |
| 163 | 978 | 5,41 ms |
| 1.630 | 9.780 | 53,39 ms |
| 16.300 | 97.800 | 523,07 ms |

**Achado causal reproduzido:** a transação `StatePort + UnitOfWork` clona o conjunto completo por **entidade**, seis vezes nesse caminho, mesmo modificando um registro. Custos crescem aproximadamente com o tamanho da coleção em memória. **Não são latências de Production** (não incluem banco, rede, UI e auditoria). Não pressupor que 16.300 registros estejam carregados atualmente: medir o conjunto real por competência/sessão e o crescimento projetado.

**Ação metodológica:** antes de implementar correção, comparar caminhos com snapshots limitados por *identidade escolar/documental*, sem eliminar rollback, captura prévia, concorrência, sincronização nem registros técnicos. Instrumentar ao mesmo tempo CPU, memória, aplicação de estado e efeito no fluxo visual, com dados descartáveis. Se a otimização reduzir clones mas deslocar custo para merge/rehydration, rejeitar.

A última leitura de CI do SHA `0496913ef70cea4174b45409a203a81373a18ef9` registrou suíte desktop geral **success**, `Validar RADAR PDDE` **success**, e `Supabase readiness` **failure**; a falha de readiness anterior derivou de limite de Docker e conflito de porta, de modo que a causa exata deste novo run ainda precisa ser conferida antes de atribuição. A homologação completa exige avaliar cada job, não inferir aprovação geral de um teste isolado.


## Novo checkpoint — retomada após a sessão Codex de 14/10/2026

A transcrição entregue pelo usuário foi lida e **registrada sem dados sensíveis** em [CODEX_LOCAL_PIPELINE_HANDOFF_2026-10-14.md](CODEX_LOCAL_PIPELINE_HANDOFF_2026-10-14.md). O arquivo de teste original criado localmente no worktree do Codex **não estava no GitHub e não foi fornecido integralmente**; seus tempos e a prova de rollback eram locais. **Não alegar recuperação literal ou reprodução autenticada do código original.**

Foi criado **novo teste independente**, `tests/unit/systemic-write-pipeline-characterization.test.js` no PR [#447](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/447), commits `145d8ed931542412f1e31e1c593c731738f1a342` (teste) e `1a06e6bfcaa88581f7d2b009e6c3e39821d4a43b` (artifact no CI), com `DataService`, `UnitOfWork`, `StatePort` e `state-bridge` reais e apenas repositório externo controlado. Compara 1/163/1630 verificações, 5 medições por volume, atualização de uma escola, preservação de outra, confirmação remota sintética, aplicação local e rollback anterior ao commit. **No registro inicial deste checkpoint o CI run [38511334777](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/38511334777) ainda estava pending.** Não declarar o teste aprovado até inspecionar logs/JUnit e artifact `systemic-write-pipeline-diagnostics`; em caso de falha, corrigir o instrumento somente após causa localizada.

Em paralelo, consultas **somente leitura** à Production mostraram `verifications`: **1.321 linhas totais**, por competência `2026-08`: **292** (108 escolas), `2026-09`: **181** (73 escolas), `2026-10`: **1**. A soma total não é automaticamente o conjunto em memória do navegador. Consequentemente, a simulação com 16.300 verificações deve ser tratada como **ensaio prospectivo de crescimento**, não reflexo da carga presente do RADAR. Investigar o working set realmente carregado antes de atribuir atrasos multissegundo a clones.

**Estado/segurança:** nada em runtime ou Production foi alterado. #446 somente documentação, #447 somente testes e workflow; sem merge. As próximas etapas são aferir a representatividade, verificar o CI e recuperar métricas sanitizadas ao remoto, sem correção prematura por linha ou cache de estado.
