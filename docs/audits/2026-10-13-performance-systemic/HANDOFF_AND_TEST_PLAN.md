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
