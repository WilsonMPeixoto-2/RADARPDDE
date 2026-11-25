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

O comando completo `npm run test:readiness` passou localmente no lote consolidado: **1.590 unitários e 8 integrações**, zero falhas e zero skips, além das verificações de continuidade, arquitetura, matriz funcional, referências, lint, configuração, artefatos e tipos. A execução do extrator Python foi conferida separadamente com suas duas contraprovas e os três PDFs autorizados.

Os testes públicos são sintéticos e exercitam contraprovas de escopo, alteração de fonte, datas inválidas, valores e ambiguidade. As jornadas de interface usam o RADAR/Supabase descartável nos workflows existentes. Conferir resultado e capturas do HEAD no PR #565; evidência local de CPU e inspeção dos PDFs não substituem os testes de interface, concorrência e publicação da T5.

A suíte autenticada `supabase-operational-guidance-local.spec.js` foi acrescentada ao workflow de readiness existente, em etapa própria com pilotos de correção desligados. Exige a fila do Dashboard, os filtros, a escola recolhida preservando a área fiscal em 1440 × 900, foco em cinco alvos reais, distinção dos relógios, reconsolidação explícita e igualdade dos registros antes/depois. As capturas previstas abrangem Dashboard e Prontuário em desktop, tema escuro e celular. A existência dessa suíte não é declarada como sua aprovação antes do resultado remoto.
