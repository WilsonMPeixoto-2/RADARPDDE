# Instabilidade operacional recorrente — checkpoint de investigação

**Classe:** handoff corrente da investigação autorizada, não regra funcional nova.
**Data:** 03/10/2026. **PR:** #407, permanece Draft.

## Objetivo e limite

Explicar e reproduzir por que ações humanas e eventos remotos geram leituras amplas,
aplicações de estado e reconstruções excessivas da interface durante uso sustentado.
O relatório do usuário é roteiro de hipóteses, não fonte absoluta. Backup, Docker,
snapshot e staging são instrumentos opcionais escolhidos conforme a hipótese.
Não condicionar a investigação ao backup. Não otimizar RPC/RLS/Realtime por suposição.
Não escrever em Production nem promover o #407 nesta etapa.

## Fatos revalidados

- `main` e manifesto de Production: `62fe000c7253bb97a31091f1c7dc33407906d554`.
- Hotfix #406 integrado em `24f51fbcce413069287236fa78418465df08d267`;
  deployment marcado success em 02/10 às 20:29:48 UTC.
- Head anterior do #407: `22fb52aee685ced0b899923c689011ce22cd50c5`, Draft.
  Proveniência do Broadcast e limitador de releituras são experimentais;
  migration `20261002233000` está somente no candidato, ausente de Production.
- Produção, 03/10: 163 escolas, 430 vínculos, 1.077 avaliações, 239 despesas,
  366 Pendências, 83 tentativas, 99 contatos, 22 bens e 9.774 logs administrativos.
  Banco: 64.826.515 bytes. As contagens menores de setembro são históricas.
- `pg_stat_statements`: 10.491 chamadas autenticadas à RPC contextual,
  média acumulada 1.232,11 ms, máximo 7.975,42 ms, desde 29/09.
  `stats_reset` atual: 17/09/2026, não julho. Nenhum reset executado.
- Janela 02/10 21:00–24:00 UTC, após publicação do hotfix: sessão escritora
  487 saves de avaliação / 635 leituras; outra sessão 4 saves / 176 leituras.
  O ganho de contenção não comprova eficiência estrutural.
- Às 18h UTC, a RPC somou 986 leituras e 148 HTTP 5xx, p95 de origem 10.534 ms.
  Às 21h, 752 leituras e 2 HTTP 5xx, p95 565,75 ms. Carga, contexto e usuários
  diferem entre as janelas: comparação observacional, não efeito causal isolado.

Fonte quantitativa e limites: `../evidence/2026-10-03-operational-instability/production-baseline.json`.

## Mapa de investigação confirmado no código

| Gatilho | Caminho | Consequência a medir |
| --- | --- | --- |
| Bootstrap/login | DataService.bootstrap → queryOperationalContext | carga inicial contextual; separar da atividade sustentada |
| Escrita de negócio | Service → DataService.execute → retorno/reconciliação | RPC de escrita, aplicação autoritativa e eventual leitura em loadRemoteEntities |
| Broadcast | operational-realtime-invalidation → refresh(force) | leitura contextual após debounce; eco próprio existe no baseline |
| Evento durante leitura | refresh em voo → pending → flushPending(inflight-finished) | segunda leitura deliberada para não perder convergência |
| Foco/visibilidade | operational-context-refresh.install | tentativa throttled; possível pendência |
| Fim de escrita | operational-write-feedback → flushPending(write-settled) | drena invalidação recebida durante edição/escrita |
| Clique/focusout/fechamento/transição/mutação de dialog | flushPending | retry respeita cooldown pós-falha do #406 |
| Troca de competência | global-competence-selector → loadOperationalContext | cancela leitura obsoleta e reconstrói superfície |
| Histórico/fila de Pendências | task-9-pendencias-page → loadOperationalContext | amplia recorte histórico; não filtrar ingenuamente por escola/mês |
| Reconexão | Realtime SUBSCRIBED posterior → refresh | leitura de recuperação obrigatória |

Após leitura aplicada, `operational-context-refresh` chama `refreshCurrentView`,
que chega a `switchView`/`renderProntuario`. O renderer substitui conteúdo do
container. A prova visual ao final deste checkpoint confirma replay de fadeIn
no painel durante refresh. Medir substituição de DOM, foco, scroll e convergência;
não chamar toda invocação de renderer de reconstrução efetiva.

## Estado das provas e ferramentas

- Documentos canônicos, matriz e ADR-054 lidos antes da análise.
- 22 testes dirigidos do #407 passaram, sem skips. São controles unitários,
  não prova de vários usuários reais ou de operação prolongada.
- CI do gate de volume, run `37082647983`, job `111086302108`, falhou no seed:
  `cannot insert multiple commands into a prepared statement`.
  A fixture não foi aplicada; não houve prova de performance desse run.
  Correção de tooling: executar arquivo transacional via psql local com
  `ON_ERROR_STOP=1`, preservando a fixture e o contrato do produto.
- Docker local disponível, mas extração das camadas Postgres com driver vfs
  excedeu os 32 GB do workspace. Duas inicializações tentadas; não repetir
  indefinidamente nem mudar daemon/driver. Considerar o runner descartável do CI.
- Chromium e dependências instalados. Worktree `/workspace/RADARPDDE-baseline`
  fixa main para controle comparável, sem alterar a branch principal.
- Backup de 30/09 recuperado fora do Git, ciphertext SHA256
  `bed4ba1e509b7d9eae9195f31e7fca5fa8923cce34ec37383efdeea813440142`.
  Chave privada indisponível. Recuperação do arquivo não equivale a restauração.
  Não é bloqueador da investigação de amplificação/DOM.

## Próximo passo executável

1. Corrigir somente o replay da animação do painel do Prontuário reproduzido
   no RED visual. A primeira correção de releituras já passou na comparação real.
2. Reexecutar a jornada inteira com amostragem de opacidade por frame e
   aumentar a duração/quantidade de operações para investigar estado acumulado.
3. Confrontar SQL efetivo, tentativas abortadas, observadores, estabilidade,
   convergência e reload. Não afirmar redução global de RPC sem essa separação.
4. Preservar checkpoint remoto após cada etapa, incluindo falhas e lacunas.

Houve uma correção funcional candidata no controller de refresh, ainda Draft.
Não afirmar solução definitiva,
homologação de staging ou canário sem execução e evidência.

## Checkpoint: preparação da reprodução comparativa

- Primeiro checkpoint publicado: `641dd7e504462b6b973bdbaff4a2421094eb638d`.
- CI seguinte, run `37092832359`, job `111116611086`, passou a executar psql
  e revelou outra falha de preparação: duplicidade em
  `pendencies_active_document_uidx`, ainda antes do navegador. A fixture
  distribuía contextos de meses diferentes apenas por escola/programa e depois
  substituía a competência de origem. A correção conserva os totais/shape,
  distribui 180 contextos históricos coerentes com seus meses (81 com NF) e
  usa dois documentos distintos quando existem duas Pendências no contexto.
  Nenhuma constraint do produto foi removida. Resultado ainda precisa de CI.
- Novo job compara `main` publicado em `62fe000c...` e o candidato, cada um
  com seu próprio código/migrations e a mesma massa e jornada.
  Worktree do baseline fica dentro da raiz servida permitida pelo servidor.
- `scripts/bootstrap-operational-session-fixtures.mjs`: quatro identidades
  reais locais, três escolas adicionais isoladas para não alterar os contextos
  de volume. Cada browser entra pelo formulário; só preparação usa Admin.
- `tests/e2e/operational-sustained-sessions.spec.js`: cinco sessões, dois
  escritores de avaliação, um escritor de CRUD fiscal, dois observadores
  (um deles segunda aba do mesmo usuário). 40 rodadas por escritor de avaliação
  e dez ciclos fiscais previstos; latência 300/1.000/2.000 ms, um HTTP 500
  e pendência durante foco no seletor. Convergência antes e depois do reload.
- Relatórios por sessão medem requests, respostas, payload, duração, fontes de
  refresh quando disponíveis, aplicações de estado, chamadas de renderer e
  remoção efetiva de nós principais. Vídeos e capturas preservam a evidência
  visual. Relatório parcial também é salvo quando o teste falha.
- Limites: workload curto/acelerado e sintético; não prova horas de uso,
  jornadas de Pendência/patrimônio, reconexão de WebSocket ou staging cloud.
  Os limites temporais e de regressão não serão escolhidos antes de medir.

Retomada: consultar o run do workflow `operational-real-usage-gate.yml` no head
mais recente do #407, ler **todos** os jobs e baixar os artefatos por variante.
Caso preparação falhe, diagnosticar essa falha sem chamar o produto de instável
com base nela. Se uma jornada falhar com backend preparado, preservar RED e
confrontar com vídeos, RPCs e estado canônico antes de escolher correção.

## Resultado inicial: volume real de transporte, usuários ainda não executados

Run `37093452257`, head `9c50c06c...`:
- Volume autenticado: **passou**. Seed validou todas as contagens e contexto,
  `pg_column_size` 1.357.267 bytes. Vinte chamadas pelo cliente autenticado e
  quatro refreshes pelo controlador real passaram; JSON durável em
  `../evidence/2026-10-03-operational-instability/local-volume-candidate.json`.
- Contratos unitários: **passaram**, 22 testes.
- Baseline e candidato cinco sessões: **não executaram a jornada**. A nova
  preparação tentou INSERT em controllers por service_role, enquanto a
  migration de grants só concede SELECT/UPDATE nessa tabela. Erro 42501.
  Correção restrita ao laboratório: cadastrar controllers/escolas/vínculos via
  psql local e depois vincular Auth por UPDATE e perfis pelos grants existentes.
  Não ampliar privilégio nem alterar RLS para satisfazer o teste.

O verde no volume prova carga isolada e quatro refreshes, não uso sustentado nem
latência cloud. Nova rodada das cinco sessões ainda necessária.

## Primeira execução real concorrente: hipóteses refutadas e novas evidências

Run `37093715914`, head `e25c2fa6...`, preparações passaram em ambos os produtos.
Os cinco browsers executaram 110 gestos completos: 80 avaliações e 30 operações
CRUD fiscais. Relatórios completos preservados como `first-sustained-*.json`.

- **Baseline:** 141 Broadcasts por sessão, mas zero tentativas de refresh durante
  a rajada contínua de aproximadamente 39 s. O debounce trailing era reiniciado
  a cada evento. O teste terminou por expectativa inadequada de pendência em
  menos de 20 s durante essa atividade e não aguardou a quietude final. Não
  concluir eficiência ou perda permanente de convergência com esse resultado.
- **Candidato:** escritor A 40 writes / 41 reads, 38 resultados stale e apenas
  três refreshes aplicados; escritor C 40 / 42, 37 stale; escritor fiscal 30 / 30.
  Observadores 17 e 15 reads, com 16 e 15 reconstruções principais de DOM.
  O limitador remoto de Broadcast não limita o flush por clique/focusout/
  write-settled/inflight-finished. As razões acumularam repetidamente o sufixo
  inflight-finished, evidência de drenagens encadeadas. Preservar isso como
  reprodução de amplificação fora da janela limitada, não solução homologada.
- **Candidato convergiu antes do reload** e o banco tinha o valor final. Falhou
  depois do reload porque o contexto inicial passou a Setembro e o teste
  procurou o valor de Agosto sem voltar ao mês. Código de bootstrap prioriza
  competência carregada/calendário; não classificar como perda de persistência.
- Captura do candidato antes do reload inspecionada: contexto Agosto/escola 1,
  Não visível, controles legíveis. Essa captura isolada não prova flicker;
  vídeos por sessão estão nos artefatos do run, com retenção de 30 dias.

Correção do harness, sem mudança funcional: provocar edição e uma falha em uma
fase inicial de evento isolado (comparável para os dois debounces), depois
executar a mesma rajada concorrente e aguardar convergência; voltar a Agosto
explicitamente após reload. O novo relatório histórico enviado pelo usuário
foi incorporado como hipóteses sobre refresh/wrappers/readiness/DOM, não como
fila automática de refatoração nem ordem para escrever em Production.

## Comparação completa e RED causal, antes de nova correção funcional

Run `37094225289`, harness `6bc0c4e8...`: todos os quatro jobs passaram.
Cada variante realizou 114 gestos (42 + 30 + 42), um erro induzido, edição
bloqueando refresh e convergência antes/depois do reload no mesmo contexto.
JSONs completos e resumo durável: `complete-sustained-*.json` e
`complete-comparison.json` na pasta de evidências desta investigação.

- Baseline escritores A/C: 44/45 **tentativas** de leitura, 42 writes cada,
  41/42 aborts. Observadores: três reads cada, após debounce trailing.
- Candidato escritores A/C: 43/44 tentativas, 42 writes cada, 41/42 aborts;
  os próprios Broadcasts foram reconhecidos/ignorados corretamente (42 cada).
  Observadores: 17/16 reads e 16/16 substituições principais.
- Causa compartilhada localizada: após read stale por escrita, controller
  conserva a razão Realtime pendente; flushPending por click/focusout/
  write-settled volta a interpretar a razão como permissão de forçar read.
  Cada gesto aborta uma leitura e força a próxima. O limitador do canal não
  governa esses flushes. Não é regressão N+1: cada tentativa usa uma RPC.
- Abort no interceptor antes de enviar a requisição não significa execução
  custosa de SQL. Separar tentativas do browser, HTTP concluído e chamadas
  efetivas ao Postgres; o próximo run deve incluir baseline/delta pg_stat.
- RED isolado em `operational-stale-read-amplification.test.js`: um evento
  conhecido + 30 flushes de interação produzem **31 reads**, esperado um
  antes do retry controlado. Dois controles passam: invalidação nova recupera
  stale, e invalidação durante read bem-sucedido continua exigindo a segunda
  leitura. Não suprimir essas invalidações reais para obter o verde.

`app.js` revalidado: 13.177 linhas. Caminho de avaliação local: guard/trace →
conditional reconciler → toggleBonif no app → VerificationService → DataService
com feedback → RPC/resultado incremental → renderer suprimido/reconcile.
Refresh externo chega pelo selector/switchView e passa pelo renderer completo.
Não confundir chamada suprimida com troca efetiva de DOM. Polling de
atomic-analysis-pendency ainda existe a 100 ms; install está privado ao módulo.
Auditor de precedência lê config/index e cadeia Excel, sem percorrer os arrays
do product-extensions-bootstrap. Essas são lacunas atuais confirmadas, ainda
sem prova de que causaram esta amplificação; não fazer refatoração geral.

Próxima alteração candidata: distinguir invalidação bloqueada pela edição de
recuperação de read obsoleto; interação não deve ser autoridade para rearmar
retry de uma invalidação já consumida. Preservar retry/reconnect, pendência e
novo evento externo; reexecutar a comparação inteira antes de concluir.

## Correção mínima candidata — ainda aguardando comparação real

Controller existente passou a conservar, junto à razão pendente, se ela veio
de uma invalidação nova bloqueada por edição/leitura. Um resultado stale
sozinho mantém a necessidade de reconciliação sem permitir retry forçado por
clique/focusout/write-settled. Não foram adicionados debounce, cooldown, RPC,
wrapper ou política de escola/competência. Retry/reconnect Realtime continuam
fora da drenagem de interação. Flush durante read não consume/recria a pendência.

RED 31 reads → GREEN um read antes do retry controlado; 40 testes dirigidos
passaram, incluindo edição, read em voo, falha, nova invalidação e reconexão.
O workflow passa a executar esse RED permanentemente e a preservar snapshots
pg_stat_statements antes/depois do browser (sem reset) para separar tentativas
abortadas no transporte das execuções SQL. Observer lê métricas existentes
de clique/feedback/RPC/apply/estável, sem novo wrapper funcional.

Ainda não chamar a correção de solução do incidente. Executar os cinco browsers
novamente, confrontar reads/stale/aborts/DOM/convergência e inspecionar vídeos.
As lacunas de sessão longa, outras jornadas e cloud permanecem explícitas.

## Comparação após correção de releituras e RED visual

Run `37094996421`, candidato `2be528f6...`: os quatro jobs passaram, com
114 gestos, cinco browsers, erro induzido, convergência e F5 no mesmo contexto.
Relatórios completos: `after-read-fix-baseline.json`, `after-read-fix-candidate.json`
e resumo com SQL antes/depois em `after-read-fix-comparison.json`.

- Escritores A/C: baseline 44/45 tentativas para 42 writes cada; candidato
  19/19. Fiscal: baseline 32 tentativas para 30 writes; candidato 13.
  O mecanismo de rearmar leitura a cada interação foi contido, sem perder writes.
- Observadores do candidato ainda têm 15/14 leituras e 14/14 reconstruções
  principais; baseline trailing tem três leituras cada. Não confundir atraso
  de convergência do baseline durante a rajada com eficiência superior.
- SQL efetivo: baseline 38 execuções; candidato 61. Muitos aborts do escritor
  ocorreram antes de enviar a chamada, enquanto os observadores do candidato
  chegaram ao banco. Portanto não houve redução global comprovada de calls SQL.
  Tempos médios 307,55/115,14 ms vêm de runners distintos e não isolam ganho causal.
- p95 clique → estável de avaliações no candidato: A 645,5 ms, C 587,7 ms;
  baseline 533,7/561,6 ms. O campo de duração RPC do trace existente veio nulo;
  não anunciar essa métrica como medida. Respostas HTTP têm medição separada.

**Flicker reproduzido:** vídeo do observador candidato no run `37094225289`
mostra o painel mensal desaparecendo por alguns frames (exemplo 24,08 s) e
retornando (30 s). Frames preservados em `refresh-panel-blank.png` e
`refresh-panel-visible.png`; a imagem é de navegador real com Supabase local.
Não generalizar para toda piscada relatada ou inferir duração apenas destes frames.

Causa isolada atual: `renderProntuario` substitui o painel ativo; a regra global
`.tab-content-panel.active` em `styles.css` reaplica `fadeIn 0.3s`, iniciando em
opacity zero. `view-transitions` exige intenção de navegação e não explica esse
refresh de fundo. RED de frontend no mesmo renderer registrou opacidade mínima
zero, esperado ≥ 0,95; amostras em `refresh-visibility-red.json`. Essa prova
isolada usa modo local para separar CSS; a gravação do vídeo acima usa backend
real. A jornada de cinco sessões passa a amostrar opacidade e exigir ausência
de frames apagados nos dois observadores candidatos. Baseline serve de controle.

A alteração visual ainda não foi aplicada neste checkpoint. Não refatorar
app.js, remover Realtime ou reabrir RPC/RLS para resolver este replay de CSS.

## Candidato visual mínimo e próxima prova ampliada

A regra existente de UX do Prontuário passa a desabilitar a animação de entrada
apenas dos seus painéis ativos. A navegação continua sob view-transitions; não
houve reforma global de CSS nem novo módulo/observer de runtime. O RED isolado
agora passa com opacidade 1 em todos os frames (`refresh-visibility-green.json`).
Stylelint passou; ESLint sem erros (warnings condicionais do harness); referências
locais dos workflows conferidas. Isso ainda não homologa a jornada concorrente.

O gate operacional aumenta de 40 para 400 rodadas por escritor: cerca de 1.100
gestos, crescimento de histórico e tempo real maior, sem chamá-lo de 30–60 minutos.
Dispatch permite selecionar 40 para diagnóstico curto. Passa também a desligar
e reconectar um socket Realtime real; uma alteração feita enquanto desconectado
precisa reaparecer sem F5. Candidate deve ter zero frames apagados nos observadores.
Executar, guardar resultados completos e corrigir somente falhas reproduzidas.

## Revisão adversarial da janela remota e checks gerais

1.227 testes unitários passaram no candidato `8c8d9c07...`, assim como cinco
jornadas locais de visibilidade/rolagem/composição. CI das duas sessões com
Realtime real passou. A comparação ampliada de 400 rodadas ainda está executando.

Três checks gerais falham no advisory `GHSA-vfj7-8cjw-p6xm`, em braces 3.0.3
pela cadeia Stylelint. `npm audit` confirmou seis ocorrências high e
`fixAvailable: false`; `npm view braces version` retornou 3.0.3. Lockfile e
pacotes não foram alterados nesta investigação. Snapshot da auditoria preservado.
Não relaxar o gate, inventar exceção ou substituir ferramentas para dizer verde.

Hipótese adicional agora com RED: o limitador calcula prazo só ao agendar,
usando o último refresh concluído. Um Broadcast durante leitura lenta pode
agendar com timestamp anterior; o callback chega ainda em voo, marca pendência
e a conclusão inicia nova leitura imediatamente. Teste determinístico com os
dois controllers reais reproduziu três leituras, esperadas duas antes da janela,
e exige a terceira posteriormente (sem perder invalidação). Evidência em
`slow-read-window-red.json`. Não atribuir todas as leituras medidas a esse caso.
Avaliar usar os timestamps já expostos pela autoridade de refresh e revalidar
a janela no disparo do timer, sem acrescentar novo limitador nem mudar retry/reconnect.

## Correção da janela no controller existente

RED da leitura lenta passou após consultar getLastAttemptAt/getLastRefreshAt da
própria autoridade de refresh e recalcular a janela no callback. Não acrescenta
novo timeout ou limitador, nem altera o debounce de 2 s ou a janela de 5 s.
Retry/reconnect continuam fora dessa janela e a invalidação trailing é preservada.
41 controles dirigidos passaram. A jornada inclui tetos por tempo derivados
 desses intervalos existentes (observadores 5 s; escritores 2 s para permitir
retry), com margem fixa de oito reads para fases induzidas/edição/reconexão.
Eles complementam convergência, zero writes de observadores e zero frames apagados.

O commit de RED cancelou automaticamente o run longo `37096135028` pela
concorrência do workflow anterior; esse run não é prova concluída de 400 rodadas.
Agora cancel-in-progress=false preserva uma comparação ativa durante checkpoints.
A comparação do head anterior ainda em andamento é controle válido antes da
nova correção da janela; guardar ambos quando concluírem. Não registrar cancelado
como falha funcional nem como homologação. Não publicar novo commit funcional
sem reexecutar a jornada completa do candidato correspondente.
