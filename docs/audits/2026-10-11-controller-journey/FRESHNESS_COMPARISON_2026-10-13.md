# Comparação de atualização durante atividade — 13/10/2026

Evidência diagnóstica do agente principal, sem subagentes. Não é certificação de
performance nem observação de usuários em Production. Produto e timers inalterados.

## Resultado e atribuição

| Medida | main 113841bd | candidato 99fa423c |
|---|---:|---:|
| Gravações HTTP 200 | 44 | 44 |
| Amostras | 291 | 301 |
| Maior intervalo commit → versão remota observada | 23.670 ms | 24.845 ms |
| Leituras por sessão (três sessões) | 1 / 1 / 1 | 1 / 1 / 1 |
| Cancelamentos | 0 | 0 |
| Broadcasts por sessão | 44 | 44 |
| Convergência final com banco | sim | sim |

As duas versões reproduzem adiamento durante gravações contínuas. Não foi
identificada regressão de sincronização atribuível ao #438 neste cenário. Uma
execução por variante, durações diferentes de atividade e amostragem de 100 ms não
permitem interpretar a diferença de 1,175 s como efeito do PR.

`operational-realtime-invalidation.js`, `operational-context-refresh.js` e
`data-service.js` não têm diff entre a main analisada e o candidato. Em ambas,
`scheduleRefresh` cancela e reagenda seu timer de 2 s a cada invalidação: isso é
compatível com a leitura apenas após cessar a atividade. Trata-se da política
existente de agrupamento; este experimento não define sozinho se seu compromisso
entre frescor e custo é aceitável no uso institucional, nem justifica revertê-la.

## Método reproduzido

Três contextos Chromium independentes, login Controlador pela UI, Supabase/Auth/
RLS/RPC/Broadcast reais no descartável já usado nesta auditoria. Mesma escola
ESC-LOCAL, competência 2026-05. A alterna extCC do BASIC 12 vezes (pausa 1.250 ms
após cada escrita); B alterna extCC de CONECTADA 32 vezes (pausa 300 ms); C observa.
Escritas por botões Sim/Não; aguarda resposta e fila remota. Programas separados
para evitar disputa legítima de versão pela mesma avaliação. Sem mock de respostas.
Cada leitura contextual recebe atraso artificial de 600 ms antes de continuar.
Após as escritas, aguarda 8 s e compara com consulta autenticada ao banco.

Amostras de 100 ms registram botão visível, valor local e rowVersion do BASIC.
A métrica é o primeiro instante amostrado com versão >= versão confirmada pela RPC,
não apenas igualdade de Sim/Não, que poderia coincidir apesar de uma versão antiga.
A atualiza a própria versão em até 80 ms no candidato / 76 ms na main; B e C só
alcançam as versões remotas ao final da atividade. Nenhuma perda de escrita foi
observada. Não houve cancelamento: esta prova NÃO explica os 46 aborts do gate longo.

Dados agregados e intervalos por commit: [JSON](evidence/freshness-main-candidate-2026-10-13.json).
Os hashes identificam os JSONs brutos privados; credenciais não foram versionadas.
Script original nesta máquina: /workspace/scratch/controller-tools/freshness-probe.mjs.
Falhas de preparação (global ainda ausente, conexão recusada) foram excluídas.
Uma tentativa inicial escreveu a mesma avaliação em duas sessões e recebeu conflito
optimista; foi excluída por não representar o cenário independente pretendido.

## Comparação longa e limites de evidência

Run 38355640318 terminou baseline/candidato/comparador aprovados. Seu baseline é
#408 d9bf67f7, NÃO a main anterior ao #438. Os números reportados pelo auditor
externo (26→66 tentativas, 1→46 aborts, ~31,9→10,6 MB e ~66,3→67,6 s de long tasks)
comparam várias etapas acumuladas. Não atribuir esses deltas ao #438 nem chamar
isso de superioridade geral de desempenho. O log do comparador confirma quatro
advertências e budgets não estabelecidos. Download dos artefatos pelo executor
recebeu Forbidden: os valores brutos continuam atribuídos à inspeção externa.

Os 22 workflows do SHA 99fa423c terminaram verdes. Isso certifica somente os
contratos executados; os jobs de smoke autenticado de Production continuam sem
provisionamento, e a auditoria A–N permanece parcial. O erro antigo de opacity 0
na preparação da baseline continua sem causa encerrada, mesmo com o novo run verde.

## Decisão

Preservar as correções comprovadas. Não reescrever Realtime, alterar debounce,
relaxar asserções ou iniciar bateria extensa a partir destes números. Não declarar
os PRs #406/#408/#410/#427 inválidos: conter tempestades, ler por escola e manter
convergência não garante latência limitada durante uma rajada contínua.

PR #438 permanece Draft. Não houve merge, deploy ou alteração de Production. A
migration patrimonial 61 ainda exige publicação controlada e verificação dos
triggers; sua proteção não pode ser anunciada como já ativa em Production.
A decisão sobre eventual frente de frescor precisa confrontar este cenário com
cadência real, contrato de atualização durante atividade e custo total, preservando
as proteções existentes. Este diagnóstico encerra a comparação curta, não a
investigação inteira nem a certificação de desempenho.
