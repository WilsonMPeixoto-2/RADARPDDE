# T5 / D022 — orientação gerencial, piloto documental e desempenho

**Data:** 25/11/2026. **Classe:** evidência de candidata no [PR #565](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/565), sem declarar publicação. **Origem:** [instrução D022](../continuity/prontuario-t0-t6/D022_INTELIGENCIA_DOCUMENTOS_DESEMPENHO.md).

## Orientação que aparece no produto

O Dashboard reutiliza a fila existente para organizar o trabalho em seis etapas: reanálises prontas, análise fiscal a conferir, despesas a identificar, inventário por etapa, bonificação em apuração e acompanhamento em aberto. O Prontuário mostra os próximos passos da escola/mês em apresentação compacta, com expansão para motivos, filtros e demais itens. Cada sugestão oferece navegação para o registro existente; não executa uma mutação.

O domínio `src/domain/operational-guidance.js` usa as autoridades já existentes de projeção operacional, análise individual de despesa e avaliação mensal. Não consulta o banco dentro de loops nem inventa contextos de programas ausentes. A integração usa o conjunto de escolas do filtro atual do Dashboard e a competência canônica. A disponibilidade acompanha capacidades reais; uma sugestão não concede permissão.

Os números indicam escolas e registros carregados naquele recorte. A antiguidade desde a abertura e a espera da etapa atual ficam identificadas separadamente; datas ausentes, inválidas ou futuras não entram nos cálculos de duração. Os intervalos não são SLA nem produtividade pessoal. Despesa a identificar, análise fiscal, Pendência, patrimônio e bonificação continuam dimensões independentes.

## Gargalos medidos e corrigidos

Foram identificados dois custos repetidos nas projeções que alimentam as telas: configuração da ordenação de português em cada comparação e varredura de todas as pendências/contatos para cada escola. A página de Pendências também ordenava conjuntos que só precisavam de contagem e reordenava grupos já ordenados.

A candidata reutiliza `Intl.Collator` com as mesmas opções, constrói índices por escola dentro de cada chamada e ordena uma vez cada grupo exibido. Não há cache de registros entre chamadas; correção, exclusão e novos dados continuam visíveis na chamada seguinte.

### Comparação controlada de CPU

Baseline: `1e9991b2f533aa1838919ac92048c59c9939b9d5`. Massa sintética baseada nas contagens da fixture operacional existente: 163 escolas, 366 pendências, 99 contatos e 83 tentativas. A carteira de comparação contém 41 escolas sintéticas.

| Trabalho medido | Mediana antes → depois | Redução | P95 antes → depois |
|---|---:|---:|---:|
| Projeção de 163 escolas | 4,909 → 1,333 ms | 72,8% | 7,952 → 1,764 ms |
| Projeção da carteira de 41 escolas | 0,977 → 0,291 ms | 70,2% | 1,152 → 0,500 ms |
| Página de Pendências, todos os registros | 21,392 → 7,945 ms | 62,9% | 34,658 → 10,998 ms |
| Página de Pendências, filtro de agosto | 12,345 → 5,491 ms | 55,5% | 14,801 → 12,352 ms |
| Projeção de escolas, crescimento sintético 4× | 38,209 → 5,052 ms | 86,8% | 45,471 → 8,062 ms |
| Pendências, crescimento sintético 4× | 137,067 → 36,999 ms | 73,0% | 142,573 → 39,753 ms |

**Limite da evidência:** processamento em memória no Node 24.22.3, sem DOM, rede, SQL, Auth ou RLS. Os callbacks de situação usam os valores fixos da fixture; o custo das consultas reais de situação não está incluído. Essas reduções não equivalem à latência total de Production.

Cada cenário usa oito aquecimentos e 31 amostras de três chamadas por implementação, em ordem intercalada. Oito cenários preservaram o JSON completo do resultado e as entradas. O [JSON de evidência](2026-11-25-t5-performance/operational-projection-cpu.json) contém amostras, máquina, Node/V8/ICU, hashes dos módulos e limites. Os 23 testes específicos de projeção/modelo de página passaram, incluindo alteração entre chamadas, desempate em português e contagens após filtro/exclusão.

```bash
node scripts/benchmark-operational-projections.mjs --baseline 1e9991b2 --output /tmp/radar-projection-cpu.json
node --test tests/operational-projection.test.js tests/pendencias-view-model.test.js
```

### Jornada autenticada com seis sessões e volume calibrado

O [workflow 45569519301, tentativa 1](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45569519301) concluiu os dois ensaios e a comparação sem reexecução. Essa prova usa navegador, Auth, RLS, RPC, SQL e Realtime reais em Supabase descartável. Complementa a medição de CPU acima, mas compara produtos completos e não isola o efeito das otimizações D022.

| Proveniência | Valor |
|---|---|
| Candidata do PR #565 | `c601c8eed2c43a722848e3d519e5f2a3d6baa3ed` |
| Código efetivamente executado | `cc332efcea15da43f31b765ae6b16b6275f087f7`, merge de validação da candidata sobre `7523782bdc572a631783deeae2ea59be048dd725` |
| Baseline histórico | `d9bf67f7d8a1ce2e468ec3c793ff992d8e10dfd6`, integração do PR #408 |
| Jobs | Baseline `139052423898`; candidata `139052423719`; comparação `139057344871` |
| Ambiente | Ubuntu 26.04, Node 24.22.3, Chromium; produto, backend e lockfile próprios de cada variante, com harness comum da candidata |
| Evidência original | [Artefato `15002475260`](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45569519301/artifacts/15002475260) |
| Cópias para conferência | [Resumo integral](2026-11-25-t5-performance/operational-session-comparison-c601c8ee.md) e [métricas/proveniência JSON](2026-11-25-t5-performance/operational-session-comparison-c601c8ee.json) |

As cópias foram examinadas para divulgação: contêm agregados, tempos, códigos e fatos sintéticos, sem credenciais, documentos reais ou identidade de escolas/pessoas. Foram preservadas byte a byte; SHA-256 do JSON `9192ec2e6dffb44d6150d047f40cf3db84b387beb76901eb4410057316830c37` e do Markdown `f3c7128e0ebd51dff97a67912b6c99ae6fd76a5674beb7a8b1c82b9c43249f9b`.

O [harness executado](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/cc332efcea15da43f31b765ae6b16b6275f087f7/tests/e2e/operational-sustained-sessions.spec.js) usa seis sessões de quatro identidades de Controlador: dois escritores de avaliação, um escritor de CRUD fiscal, dois observadores escolares e um Dashboard. Há abas da mesma identidade. Foram 400 rodadas nos escritores de avaliação e 100 ciclos de criar/editar/excluir NF, com 1.107 gestos ao todo; a distribuição por sessão foi `406, 300, 401, 0, 0, 0`. O seed usa agregados observados em 02/10/2026 — 163 escolas, 1.077 verificações, 239 NFs, 366 Pendências, 83 tentativas, 99 contatos e 22 bens — antes dos contextos extras da jornada. A massa é sintética; não é uma cópia de Production.

#### Custo observado

| Métrica | Baseline PR #408 | Candidata | Variação |
|---|---:|---:|---:|
| Gestos / escritas bem-sucedidas | 1.107 / 1.107 | 1.107 / 1.107 | Igual |
| Janela de observação | 488.068 ms | 500.306 ms | +2,51% |
| Leituras tentadas | 26 | 110 | +323,08% |
| Respostas de leitura bem-sucedidas | 24 | 26 | +8,33% |
| Leituras abortadas | 1 | 83 | +82 |
| Erros HTTP de leitura induzidos / erros de página | 1 / 0 | 1 / 0 | Igual |
| Bytes dos corpos de leitura observados | 31.890.653 | 11.984.786 | −62,42% |
| Chamadas SQL concluídas das RPCs de leitura observadas | 51 | 56 | +9,80% |
| Execução SQL acumulada dessas chamadas | 11.553,03 ms | 9.172,37 ms | −20,61% |
| Substituições de DOM | 324 | 325 | +0,31% |
| Mutações de DOM | 91.321 | 102.959 | +12,74% |
| Long tasks no navegador | 1.810 | 1.922 | +6,19% |
| Tempo acumulado de long tasks | 148.472 ms | 167.601 ms | +12,88% |
| Tempo de bloqueio acumulado das long tasks | 57.972 ms | 71.501 ms | +23,34% |
| Render síncrono instrumentado | 4.833,30 ms | 6.094,00 ms | +26,08% |

O comparador registra **nove avisos**, mantendo o resultado como `diagnostic-comparison-complete` e o orçamento de custo como `not-established / report-only`: oito `cost-regression` correspondem ao aumento de leituras tentadas, chamadas SQL, substituições e mutações de DOM, quantidade/tempo/bloqueio de long tasks e tempo de render; o nono é `baseline-freshness-not-comparable`. Os cancelamentos e a defasagem não medida impedem interpretar menos bytes como ganho causal de eficiência. A aprovação dessa jornada confirma suas invariantes; não estabelece SLO de custo nem autoriza publicação.

#### Mediana e P95 por sessão

Valores em milissegundos, apresentados como **mediana / P95**, apenas para requisições bem-sucedidas. Percentis são calculados por posto mais próximo; não há P95 global reconstruído a partir desses percentis.

| Sessão e trabalho | Leitura baseline | Leitura candidata | Escrita baseline | Escrita candidata |
|---|---:|---:|---:|---:|
| 1 — avaliação | 1.249,50 / 1.433,13 | 1.269,06 / 2.952,29 | 206,64 / 328,94 | 211,93 / 355,23 |
| 2 — CRUD fiscal | 934,65 / 1.459,51 | 623,54 / 2.272,29 | 171,93 / 379,99 | 207,70 / 405,10 |
| 3 — avaliação | 1.088,17 / 1.540,46 | 3.049,16 / 3.049,16 | 198,85 / 308,42 | 209,37 / 357,98 |
| 4 — observação escolar | 1.124,31 / 4.236,16 | 2.286,51 / 3.661,34 | Não medida | Não medida |
| 5 — observação escolar | 1.024,05 / 1.462,97 | 1.424,00 / 2.640,18 | Não medida | Não medida |
| 6 — Dashboard | 795,52 / 1.534,76 | 681,92 / 1.386,77 | Não medida | Não medida |

| Sessão | Aplicação de estado baseline → candidata, mediana / P95 | Clique até estado estável baseline → candidata, mediana / P95 |
|---|---|---|
| 1 | 1,20 / 2,30 → 1,10 / 2,60 ms | 315,20 / 649,50 → 331,10 / 558,80 ms |
| 3 | 1,10 / 2,00 → 1,20 / 3,10 ms | 305,80 / 625,80 → 332,10 / 647,50 ms |

As medidas de UI representam somente as últimas 100 avaliações de cada sessão instrumentada; a sessão fiscal não tem essa medida. Há apenas 24 respostas de leitura bem-sucedidas no baseline e 26 na candidata, distribuídas por seis sessões. O ensaio induz atrasos de 300, 1.000 e 2.000 ms em fases distintas do transporte, além de um HTTP 500 e uma desconexão real de Realtime. Portanto, esses tempos não estimam a latência de Production.

#### Invariantes, componentes de custo e limites

A jornada confirmou o valor final no banco, nos observadores, no Dashboard e após reload; uma gravação canônica por gesto dos escritores de avaliação; nenhuma escrita pelos três observadores; e os 100 ciclos fiscais com consultas ao banco. A recuperação de Realtime manteve uma resposta antiga retida até a nova leitura, verificando que a UI só convergia após a resposta de recuperação. Os dois ensaios registraram zero erros de página na janela observada. A candidata também preservou zero quadros de opacidade reduzida nos painéis observadores amostrados.

**Inferência limitada para investigação:** a sessão de CRUD fiscal concentrou 5.308,70 dos 6.094,00 ms de render síncrono da candidata, aproximadamente 87,1%; esse é um ponto concreto para investigar custo de apresentação. Houve 301 chamadas de `renderProntuario` para 300 gravações fiscais, contra 304 chamadas na baseline; esse recorte não indica duplicação nova por gesto. O instrumento inclui o trabalho síncrono dos módulos filhos e não mede a orientação isoladamente. O tempo SQL acumulado das leituras observadas diminuiu enquanto o bloqueio por long tasks e o render aumentaram. Essa separação não permite concluir que render ou banco causou a variação total: os tempos somam sessões concorrentes, a captura SQL abrange um intervalo diferente e não cobre todas as consultas do sistema; render síncrono não inclui todo o trabalho assíncrono ou pintura.

O volume de aborts sinaliza trabalho de leitura cancelado sob a latência induzida. **Não foi medido o atraso até o dado ficar visível durante atividade contínua**, portanto a convergência final não comprova equivalência de atualização entre baseline e candidata. Os snapshots de `pg_stat_statements` observam somente `read_operational_context` e `read_school_operational_context`, não atribuem SQL a cada sessão e não registram o instante de reset das estatísticas. Bytes excluem escrita, protocolo, outros endpoints e corpos desconhecidos. São duas execuções diagnósticas únicas em runners separados, não uma amostra estatística de produção; patrimônio, Pendências, horas de uso e a comparação isolada de D022 permanecem fora da cobertura.

## Experiência com documentos reais

O proprietário autorizou pequena amostra real. Foram obtidos três PDFs acessíveis no Drive: declaração BB Ágil, relação de bens e termo de doação. Cada arquivo tem uma página e texto nativo. Os bytes foram preservados, identificados por SHA-256 e as três páginas renderizadas foram conferidas pelo integrador. Os documentos e resultados identificáveis permanecem fora deste repositório público.

O piloto separado em `ops/document-intelligence-poc/local-pdf-pilot/` extrai texto e proveniência, reconhece os três modelos examinados e propõe conferências determinísticas com página/linha/trecho. Não depende de serviço de IA, OCR remoto, rede ou escrita no RADAR. A demonstração sintética anterior conserva seu próprio contrato e não é apresentada como extração real.

A revisão independente produziu contraprovas de CNPJ ambíguo, pareamento ambíguo nas duas direções, campo de assinatura com valor nulo, limites de soma monetária e mensagens de erro dos CLIs. Os reparos passaram em 11 testes Node e 2 testes Python locais. As versões `local-document-pilot/2` e `local-native-pdf/2` foram reexecutadas sobre os três PDFs, mantendo os mesmos achados de negócio; a análise privada foi regenerada. O extrator Python depende das bibliotecas locais indicadas no README e não é incorporado ao runtime web.

Achados que orientaram a implementação:

- Os três documentos indicam exercício 2025 no conteúdo, embora o carregamento no Drive seja de 2026. O cadastro institucional consultado por leitura contém competências de 2026. A comparação registra diferença de exercício e não completa o contexto com a data de upload.
- Os CNPJs presentes em dois documentos identificaram duas escolas do cadastro; o terceiro documento não contém CNPJ e esse campo permaneceu ausente. Nome compatível e documento relacionado não fabricam a identidade faltante.
- Os documentos patrimoniais contêm dois itens reais cada e 12 linhas vazias do modelo cada. As 24 linhas com `00/01/1900` e valores/quantidades vazios não viram bens. Relação e doação correspondentes não são somadas como compras distintas.
- Uma assinatura estrutural PDF está presente na declaração e não aparece na camada textual extraída. A presença de campo `/Sig`, o aspecto visual e a validade criptográfica são fatos distintos. O piloto não certifica assinatura nem autenticidade fiscal.

A amostra comprova leitura desses layouts e os controles acima; não mede precisão de OCR, notas/extratos de 2026, parcelamentos, retenções, tempo de analista ou capacidade de validar toda uma prestação de contas. O resultado preserva revisão humana e não cria despesas, bens, análises, Pendências ou conclusões administrativas.

## Homologação e continuidade

O comando completo `npm run test:readiness` passou localmente no lote consolidado: **1.590 unitários e 8 integrações**, zero falhas e zero skips. Após os reparos de inicialização/logout, composição visual e identidade tipada, a execução integral passou novamente com **1.594 unitários e 8 integrações**, incluindo continuidade, arquitetura, matriz funcional, referências, lint, configuração, artefatos e tipos. A execução do extrator Python foi conferida separadamente com suas duas contraprovas e os três PDFs autorizados.

Os testes públicos são sintéticos e exercitam contraprovas de escopo, alteração de fonte, datas inválidas, valores e ambiguidade. As jornadas de interface usam o RADAR/Supabase descartável nos workflows existentes. Conferir resultado e capturas do HEAD no PR #565; evidência local de CPU e inspeção dos PDFs não substituem os testes de interface, concorrência e publicação da T5.

A suíte autenticada `supabase-operational-guidance-local.spec.js` foi acrescentada ao workflow de readiness existente, em etapa própria com pilotos de correção desligados. Exige a fila do Dashboard, os filtros, a escola recolhida preservando a área fiscal em 1440 × 900, foco em cinco alvos reais, distinção dos relógios, reconsolidação explícita e igualdade dos registros antes/depois. As capturas previstas abrangem Dashboard e Prontuário em desktop, tema escuro e celular. A existência dessa suíte não é declarada como sua aprovação antes do resultado remoto.
