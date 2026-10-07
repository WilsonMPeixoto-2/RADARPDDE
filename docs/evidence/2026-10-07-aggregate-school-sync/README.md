# Sincronização agregada — RED, correção e medição

Classe: evidência do PR #427, sem alterar regras de negócio.

## Causa e mudança

Na main `2cb4fb359ff9614ebd7fdf824e297f22ebcb025f`,
`decideInvalidationAction()` classificava qualquer superfície fora do Prontuário
como global. Não faltavam Repository, RPC, DataService ou renderer escolar:
`refreshSchool()` já aplicava a fatia e invocava a renderização da view corrente.

A mudança de produto limita-se a `operational-realtime-invalidation.js`:
Dashboard, Carteira (`escolas`) e Competências usam a escola conhecida para
entidades já cobertas pelo #410. Navegação para essas superfícies com uma única
escola dirty conserva o escopo escolar. Não há novo estado, controller, timer,
RPC, migration, dependência, regra funcional ou alteração de Auth/RLS.

## Experimento pareado

Supabase CLI 2.114.0 descartável no GitHub Actions, Auth/RLS/RPC/Broadcast reais,
duas escolas e 25 NFs preexistentes na escola não alterada. Três sessões:
Dashboard/Controlador, Carteira/Assistente e escritor/Controlador.

O escritor executa oito gestos pela UI: criar/editar Despesa a identificar,
cancelar sua Pendência indevida, criar/editar/excluir outra NF elegível e alterar
bonificação duas vezes na outra escola. A NF com histórico não é excluída para
fabricar um teste; a regra vigente é preservada. Os observadores conferem a subida
e redução de agregados, filtros, competência, as seis coleções da outra escola e
verdade após navegação/reload. A base é sintética e pequena, não Production.

| Por observador | Main / RED | Candidato |
|---|---:|---:|
| Respostas `read_operational_context` | 8 | 0 |
| Respostas `read_school_operational_context` | 0 | 8 |
| Bytes de resposta | 133.356 | 53.351 |
| Aplicações globais / escolares | 8 / 0 | 0 / 8 |
| Substituições principais do DOM | 8 | 8 |
| Mutações Dashboard / Carteira | 144 / 74 | 144 / 74 |
| Pageerrors / long tasks / opacity reduzida | 0 / 0 / 0 | 0 / 0 / 0 |
| Tempo total de apply Dashboard / Carteira | 5,5 / 5,7 ms | 10,5 / 11,1 ms |

Redução medida: **80.005 bytes por observador, aproximadamente 60%**.
O candidato também registra tentativas: zero globais, oito escolares e nenhuma
falha por observador. Não foi reduzida a quantidade de renders, e a amostra pequena
de timing não sustenta ganho de CPU. Não extrapolar estes números para Production.
Bytes excluem escritas, outras rotas e overhead do protocolo.

## Proveniência

- RED pareado: run [`37615549972`](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/37615549972),
  SHA `23ce32de52db59780412718b732f21f067966ae1`, produto main inalterado.
  [Resumo e hash](baseline.json). O teste convergiu funcionalmente e falhou
  exatamente em zero leituras globais.
- GREEN completo de hardening: run [`37620876619`](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/37620876619),
  SHA `4d948a40e1031672d04ebc4d7ce64df73b675cbe`, **seis casos aprovados sem retries**.
  Artifact pequeno `11481643947`, `aggregate-school-sync-metrics-37620876619`.
  [Resumo e hash](candidate.json), [deltas estruturados](comparison.json).
- O primeiro GREEN principal (`37616935756`) também está preservado em
  [first-candidate.json](first-candidate.json); esse workflow inteiro falhou no
  segundo caso e não deve ser apresentado como certificação completa.
- A base mínima anterior, sem as 25 NFs, é [minimal-baseline.json](minimal-baseline.json).
  Não comparar seus bytes com a fixture pareada.

Os JSONs brutos e capturas ficam nos artifacts; hashes/medidas/conclusões ficam
no Git. As capturas desktop de topo foram abertas e inspecionadas: contexto
Maio/2026, filtros, escopo, estados e ações preservados. Há capturas adicionais da
rolagem interna/linha da outra escola no próximo checkpoint, além do CI visual
sem atualização de goldens. Opacity reduzida do contêiner não mede todo tipo de
flicker; não confundir esse contador com garantia visual universal.

## Recuperação e limites preservados

O segundo caso nativo prova escola dirty no Prontuário → Carteira com uma leitura
escolar/zero globais; resposta SQL retida antes de outra escrita; convergência da
versão final do banco com três leituras escolares acumuladas/zero globais; e
desconexão/reconexão real com uma leitura global conservadora.

O E2E auditável do #410 começa agora com leitura escolar no Dashboard. A própria
gravação auditável aborta essa leitura e invalida sua cobertura; a tentativa
seguinte retorna `MISSING_BASELINE_COVERAGE`, seguida de uma leitura global. A
atualização converge antes de foco/navegação alternativa. Evidência real: uma RPC
escolar abortada + uma global. Esse é fallback necessário, não o defeito alvo.

Bootstrap, competência, reconexão/evento perdido, entidade incerta, contatos
gerais, envelope incompleto e falta de cobertura continuam globais. A união
conservadora de várias escolas na mesma janela do #410 permanece. O contrato
comprovado aqui é um evento escolar conhecido em contexto coberto; não se promete
zero globais numa rajada multiescola ou após invalidar a cobertura.

O gate sustentado tem baseline fixo **pré-#410** (`d9bf67f7`), seis sessões e 400
rodadas. Seus deltas misturam a arquitetura já entregue no #410 com esta mudança:
usá-lo como regressão/convergência, sem atribuir seu ganho/perda a este PR. Um caso
de reconexão dependia de HTTP anterior ainda em voo; o harness agora drena esse
transporte e retém novas leituras durante a contraprova de evento perdido, de
forma idêntica nas duas variantes. Nenhuma recuperação do produto foi removida.

## Estado de certificação

Produto funcional: `57b8e64b`; checkpoints seguintes refinam testes/evidências.
Local: 1.318 unitários, oito integrações, 39 controles selecionados, sintaxe,
lint sem novos erros e referências de workflow aprovadas. No checkpoint
`4d948a40`, **14/14 workflows concluíram com sucesso**, incluindo a prova sustentada
de seis sessões/400 rodadas e a comparação. [Certificação e IDs](ci-4d948a40.json).
O checkpoint seguinte acrescenta documentos/capturas de rolagem interna, sem
alterar produto. Conferir seus checks antes de recomendar merge.

Checkpoint pré-merge: main/Production estavam em `2cb4fb35`. O relatório foi
apresentado antes da autorização posterior de integração. O [registro da frente](../../handoff/2026-10-07-aggregate-school-sync.md) é agora histórico concluído.


## Publicação e encerramento

O HEAD final `90414a8056bb5ac706a925376ead48681e014ec6` concluiu os 14 workflows
aplicáveis e as seis jornadas nativas sem retries. A medição desse run
(`37623372852`) foi 53.362 bytes por observador, oito RPCs escolares e zero tentativas
globais/falhas, com DOM/mutações mantidos. As capturas superiores e das linhas após
rolagem interna foram inspecionadas. O artifact compacto `11482643902` tem SHA-256
`302c0c3b56c47b1e2b66479e4e39cc35e648c2793311861c776b6bc251733346`.

Após apresentar o relatório e receber autorização, o #427 foi integrado em
`09083d91227e3f136496e34a5eef3a0c1158fa78`, com árvore idêntica à do candidato.
Deployment `dpl_5L41YQCcnLHnbE5kT4s5UtG6cvvg`, `READY`; manifesto oficial no merge,
`supabase-production`. O arquivo publicado possui SHA-256
`01171478aff8d0402e424d83cd0b3a36ed5ea765ae6a613834a9db3d7bd2338a` e coincide
com a saída esbuild canônica (não com o fonte anterior à minificação).

O [monitor público](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/37626582810)
aprovou 52 assets, bloqueio anônimo `blocked-401` e preflight das Edge Functions.
Os **8/8 workflows disparados na main** concluíram com sucesso, incluindo o
contrato público de login/RLS/responsividade. Não foram feitas escritas nem
afirmada homologação autenticada em Production.
[Proveniência estruturada e CI pós-merge](release.json). Handoff reclassificado
como histórico concluído; não restam tarefas desta entrega.
