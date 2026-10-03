# Instabilidade operacional recorrente — checkpoint de investigação

**Classe:** handoff corrente da investigação autorizada, não regra funcional nova.
**Data:** 03/10/2026. **PR:** #407, permanece Draft.

## Objetivo e limite

Explicar e reproduzir por que ações humanas e eventos remotos geram leituras amplas,
aplicações de estado e reconstruções excessivas da interface durante uso sustentado.
O relatório do usuário é roteiro de hipóteses, não fonte absoluta. Backup, Docker,
snapshot e staging são instrumentos opcionais escolhidos conforme a hipótese.
Não condicionar a investigação ao backup. Não otimizar RPC/RLS/Realtime por suposição.
A autorização mais recente permite merge/publicação quando as evidências forem
suficientes. A investigação usa ambientes descartáveis; qualquer promoção depende
da avaliação dos riscos, checks e jornada do SHA efetivamente candidato.

## Fatos revalidados

- Código candidato testado: `a652b410509ee8bbbc2a24372010abc7a879c58d`.
  Gate final `37097052464` concluído, quatro jobs aprovados. Três mecanismos
  reproduzidos/corrigidos, resultados finais ao término deste handoff.
  Commits posteriores de evidência/docs não modificam esse runtime.
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

## Inventário inicial das provas e ferramentas — registro histórico da retomada

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

1. Não recriar as três correções já comprovadas: comparar qualquer relato novo
   com o SHA atual e identificar a jornada ainda problemática. Pergunta opcional
   sobre tela/ação/perfil atual foi enviada; não houve resposta específica.
2. Para avançar além deste candidato, aproveitar os testes reais existentes de
   Pendências/patrimônio e investigar jornadas concorrentes/prolongadas relevantes.
   Não abrir refatoração geral de app.js nem escolher backup como tarefa principal.
3. A avaliação cloud ainda falta: list_branches confirmou somente main/Production;
   não havia Supabase de staging já disponível. Não usar Preview local-mode como
   prova remota. Qualquer novo recurso com custo precisa do fluxo do provedor.
4. Preservar resultados remotamente. Três checks de dependência e o agregador
   final estão bloqueados por advisory sem patch; não suprimir esse impedimento.

Há três correções candidatas nos controllers/CSS existentes, ainda Draft.
Não afirmar solução definitiva,
homologação de staging ou canário sem execução e evidência.

## Cronologia histórica — estados intermediários superados pelas conclusões finais

As instruções e pendências abaixo descrevem seus checkpoints, não uma fila atual.
O próximo trabalho vigente consta em “Retomada após revisão enviada pelo usuário”.

### Checkpoint: preparação da reprodução comparativa

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

Os artefatos passam a publicar métricas/SQL/screenshots também em ZIP pequeno
separado dos vídeos. O ZIP integral pode exceder o limite de download de 32 MiB
do ambiente Codex em 400 rodadas; isso não deve bloquear leitura dos resultados
nem continuidade por outro agente. Mantém-se o vídeo integral como evidência
separada de curta retenção, e as conclusões/JSON relevantes serão versionados.

## Primeira comparação longa concluída — antes da correção da janela

Run `37096698975`, candidato `75da2150...` (mesmo runtime de `8c8d9c07...`):
os quatro jobs passaram. 400 rodadas, 1.106 gestos por variante, um HTTP 500,
um socket desconectado/reconectado, convergência e reload no mesmo contexto.
Relatórios integrais e resumo em `long-before-window-*.json`.

| Sessão | Baseline reads/writes | Candidato reads/writes | DOM baseline/candidato |
| --- | --- | --- | --- |
| Escritor A | 406 / 404 | 190 / 404 | 5 / 5 |
| Fiscal | 305 / 300 | 145 / 300 | 305 / 302 |
| Escritor C | 407 / 402 | 191 / 402 | 5 / 5 |
| Observador | 5 / 0 | 137 / 0 | 4 / 136 |
| Segunda aba | 5 / 0 | 136 / 0 | 5 / 136 |

- Coleta: baseline ~460 s; candidato ~498 s. Não chamar isso de 30–60 minutos.
- Todos os cinco candidatos tiveram zero frames com opacity < 0,95; observadores
  baseline tiveram 10/11 frames apagados. O escritor fiscal baseline teve 716.
  Nenhuma afirmação sobre causas visuais fora da opacidade deste painel.
- Os observadores candidatos releram ~181 MB cada e ~16,5 vezes/minuto. Isso
  confirma custo remanescente apesar do CSS estável; não esconder o desperdício
  porque a interface deixou de piscar. É o controle anterior à janela corrigida.
- SQL autenticado: baseline 58 calls, candidato 309, incluindo bootstrap.
  A política leading mantém frescor durante atividade, com custo maior que o
  trailing histórico. Não anunciar redução global de SQL em relação ao baseline.
- p95 clique → estável, **últimas 100 amostras** de avaliação: candidato
  A 619,3 ms / C 662 ms; baseline 561,2 / 590 ms. O trace não mede RPC nem CRUD
  fiscal neste run. Não extrapolar esse p95 para todas as 1.106 operações.
- Desconexão/reconexão foram induzidas via SDK no socket real. A aplicação
  recebeu a alteração perdida sem F5; isso não prova reconexão automática de
  uma interrupção de Internet. Baseline e candidato preservaram writes/estado.

ZIPs integrais de ~65 MB foram recuperados por referência de download autorizada
do conector; métricas, SQL e screenshots extraídos. O limite do download_file
não impediu esta recuperação; a publicação compacta facilita agentes futuros.
Naquele checkpoint o run `37097052464`, head `a652b410...`, ainda executava.
Ele terminou; o resultado abaixo substitui esse status anterior. Este checkpoint contém só evidências,
sem nova alteração funcional; [skip ci] evita repetir os mesmos testes por JSON/docs.


## Comparação final concluída — janela corrigida, ainda sem homologação de custo

Run [37097052464](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/37097052464),
SHA funcional `a652b410509ee8bbbc2a24372010abc7a879c58d`: quatro jobs aprovados.
400 rodadas / 1.106 gestos por variante, cinco sessões, ~470 s baseline e ~501 s
candidato. JSON completos selecionados, resumo, screenshot após reload e manifesto
com hashes estão em `../evidence/2026-10-03-operational-instability/final-*`.

| Sessão | Baseline leituras / escritas | Candidato leituras / escritas | DOM baseline / candidato |
| --- | --- | --- | --- |
| Escritor A | 406 / 404 | 125 / 404 | 5 / 3 |
| Fiscal | 305 / 300 | 108 / 300 | 305 / 303 |
| Escritor C | 407 / 402 | 128 / 402 | 5 / 3 |
| Observador | 5 / 0 | 70 / 0 | 4 / 69 |
| Segunda aba | 5 / 0 | 69 / 0 | 5 / 69 |

| Custo agregado observado | Baseline #406 | Candidato #407 |
| --- | --- | --- |
| Tentativas HTTP contextuais | 1.128 | 500 |
| Payload recebido | 39.880.237 bytes | 199.475.408 bytes |
| Execuções SQL autenticadas (inclui bootstrap) | 52 | 169 |
| Tempo SQL acumulado | 15.020,13 ms | 24.773,93 ms |
| Remoções/substituições principais observadas | 324 | 447 |
| Registros de mutação DOM observados | 88.279 | 102.057 |
| Frames do painel com opacity < 0,95 | 769 | 0 |

A redução de 55,7% nas tentativas HTTP **não é redução global do custo**.
Baseline cancela muitas tentativas antes do banco e seu debounce trailing deixa
observadores sem releitura durante a rajada. O candidato atualiza durante a
atividade, mas transfere ~92 MB por observador e executa 3,25× mais SQL total.
O gate verde prova os contratos que mediu, não que esse custo seja aceitável.

Em relação ao candidato anterior (`37096698975`), a correção da janela reduziu
observadores de 137/136 para 70/69 leituras e SQL de 309 para 169. Mesmo workload,
runners diferentes: contagens e RED determinístico sustentam a correção, sem
atribuir ganho de latência SQL isoladamente a ela.

Todas as cinco sessões candidatas tiveram zero amostras com opacidade reduzida
no painel observado. A coleta sob CI ficou em ~4–5 fps e ignora painel ausente/oculto;
isso não equivale a provar ausência universal de flicker.
Um HTTP 500 e disconnect/connect do socket via SDK foram induzidos; estado final
convergiu antes e depois de F5 no mesmo contexto. Os 1.106 gestos resultaram em
1.106 escritas observadas. p95 clique → estável das **últimas 100 avaliações**:
A 624,7 ms / C 598,3 ms; não representa todo o workload nem CRUD fiscal.
A captura final confirma contexto legível após reload; é evidência pontual.

Limites: massa sintética calibrada, ~8 minutos reais, sem jornada sustentada de
Pendências/patrimônio e sem staging cloud. O detector visual mede opacidade de
um painel; não todas as causas de instabilidade. O gate exige convergência final, mas ainda
não um prazo máximo de atualização durante a rajada. Render wrappers e observer DOM
não contam necessariamente referências capturadas ou toda reconstrução interna.

Checks do SHA: 30 success, quatro failure, dois skipped. Três falhas são o advisory
`GHSA-vfj7-8cjw-p6xm` em braces/Stylelint sem patch disponível na consulta feita;
a quarta é o agregador pré-Production. Preview Supabase/Auth remoto foram skipped.
Nenhuma dependência/gate de segurança foi relaxada. Production permanece `62fe...`;
#407 continua Draft.

## Retomada após revisão enviada pelo usuário

O texto anexado foi confrontado com o código e os artefatos acima. Seus totais
confirmam o custo residual; recomendações continuam hipóteses, não nova especificação.
Próximas ações autorizadas nesta retomada:

1. Reproduzir foco/visibility durante leitura bem-sucedida em voo; só corrigir se
   evento de lifecycle sem nova invalidação estiver criando leitura redundante.
2. Acrescentar comparação automática dos artefatos baseline/candidato, expondo
   bytes, SQL efetivo, DOM, aborts e estabilidade. Tetos derivados de timers não
   substituem orçamento de produto; não inventar limiar verde para os números atuais.
3. Investigar o escopo canônico da leitura e das projeções antes de chamar um
   Broadcast de outra escola de irrelevante. Contexto mensal, Pendências e bens
   podem atravessar a escola visível; filtro ingênuo pode perder convergência.
4. Preservar checkpoints no remoto a cada etapa. Em caso de interrupção, retomar
   deste handoff, revalidar SHA remoto e não repetir REDs/fixtures já comprovados.

Este checkpoint fecha a medição do candidato a652; não encerra a investigação do
custo residual nem autoriza publicação em Production.


## Retomada: foco em voo e escopo de contexto

O RED pelo `install()` real confirmou: focus inicia leitura; visibility/focus
antes da resposta, sem alteração nova, produziam duas leituras/reconstruções.
Agora solicitações sem force aderem à promise existente. Invalidação remota nova
continua pendente e exige a segunda leitura; falha/stale conservam recuperação.
41 controles dirigidos passaram. Evidência compacta: `focus-inflight-red-green.json`.
A alteração funcional posterior a a652 exige novo run sustentado; não reutilizar
os resultados de a652 como prova desse novo SHA.

A revisão do contexto refutou a ideia de ignorar automaticamente a escola B
quando o Prontuário A está visível. `read_operational_context` recebe competência
(e histórico), não escola. RLS do Controlador cobre toda a CRE; Dashboard, Carteira
e a troca de escola reaproveitam a projeção global em memória, sem leitura nova.
Pendências ativas e patrimônio ainda trazem relações entre competências.
Referências: migration `20260929143215_read_operational_context.sql`, RLS
`20260919234500_rls_set_based_access.sql`, `switchView` em app.js,
`readOperationalContext` em DataService e `StatePort.applyEntities`.

Há dois custos distintos a investigar: atualizar o contexto canônico global e
reconstruir a superfície visível. Toda leitura aplicada encaminha refreshCurrentView;
a prova isolada proposta mede escrita somente em B, estado global atualizado,
conteúdo/identidade DOM de A e navegação posterior para B sem reload. O teste misto
anterior não permite atribuir cada reconstrução a uma mudança irrelevante para A.
Nenhum filtro por escola/mês, nova RPC ou wrapper foi adicionado.


## Autorização e alcance da rodada atual

O usuário autorizou investigação, correções, reorganização, commits/push e, se
justificado pelos resultados, merge/deployment/canário pelo fluxo normal. A antiga
regra temporária de manter Draft não determina sozinha a decisão final. Não houve
merge nem escrita em Production nesta retomada. Os riscos conhecidos e a evidência
do candidato consolidado devem determinar se há condição de publicação.

O comparador usa dados de artefatos, sem consultar ou resetar banco. Custo sem
budget independente permanece diagnóstico explícito; evidência incompleta,
workloads divergentes e deltas SQL inválidos devem falhar. Instalação do baseline
passa a conservar o próprio lockfile; o harness de comparação continua comum.
O diagnóstico entre escolas ocorre após o snapshot SQL da sessão sustentada e em
output Playwright separado para não apagar relatórios/vídeos ou contaminar delta.

O observer de teste passa a medir Long Tasks (quando suportado pelo Chromium),
`applyRemoteState` e o renderer observado. Totais conservam todas as chamadas;
as durações de aplicação guardam só as últimas 100 amostras. São observações do
harness, não instrumentação nova em Production, nem atribuição de GC/parse/RLS
que os dados ainda não isolam. Precisam de execução real no novo candidato.

Consulta npm repetida em 03/10: braces atual continua 3.0.3, seis ocorrências high,
`fixAvailable:false`, advisory `GHSA-vfj7-8cjw-p6xm`. Não alterada/suprimida.


## Candidato consolidado da retomada — validação local e comparação automática

Perda de foco durante refresh foi reproduzida em três cenários reais de navegador:
tab com ID, Editar NF sem ID e movimento de foco durante leitura. Correção na
mesma autoridade de refresh, sem novo wrapper/controller: capturar imediatamente
antes do render; restaurar somente se o nó foi removido e foco caiu no body,
por ID único ou chave de linha + ação. Alvos removidos/ambíguos/ocultos/desabilitados
não recebem foco. preventScroll e proteção de edição são mantidos. Se o renderer
move foco deliberadamente, ele prevalece. Seis E2E novos passaram, incluindo Enter
abrindo a NF correta após reordenação; cinco provas relacionadas e 36 unitários
passaram. Evidência compacta: `refresh-focus-red-green.json`.

Comparador automático implementado com oito testes: rejeita artefatos incompletos,
carga divergente, contadores SQL regressivos/assinaturas desaparecidas e JSON
corrompido. JSON/Markdown expõem deltas absolutos/percentuais, tentativas vs aborts
vs SQL concluído, bytes, DOM, painel, recuperação e timing disponível. CPU não
medida nos artefatos antigos permanece ausente, sem virar zero. Budgets de custo
permanecem `not-established / report-only`. Replay real de a652 reproduziu
1.128→500 tentativas, SQL 52→169 e bytes 39.880.237→199.475.408, com avisos de custo.
Resumo em `automatic-comparison-replay.json`; não é nova jornada do produto.

A suíte unitária completa passou com 1.239 testes antes da última contraprova
visual; 49 controles dirigidos passaram no controller/comparador consolidado.
Referências de workflows conferidas. Ainda falta repetir Supabase/concorrência do
SHA final e inspecionar diagnóstico cross-school. Não usar os resultados de a652
para declarar homologado o foco novo ou as novas métricas de CPU.

Main contém dois commits documentais posteriores ao hotfix (plano e revert), cuja
árvore final não altera a funcionalidade do baseline. Sincronizar o candidato com
main antes da certificação final mantém o SHA integrado rastreável.


## Retorno autoritativo de novo envio — causa adicional localizada

Auditoria de writers/derivados em `authoritative-writer-audit.md`. A proteção de
completude e de falha pós-commit já existe em DataService; foi refutada a inferência
de que a ausência de marcador autoritativo deixaria automaticamente a origem
incorreta por 30 segundos. Não foi criado outro validador estático equivalente.

RED com serviços/porta/bridge reais: novo envio de NF de consumo e identificação
como serviço já aplicavam todos os derivados, mas declaravam assets sem alteração.
RPC devolvia asset:null, levando a uma leitura ampla corretiva desnecessária.
Correção mínima em PendencyService: escopo assets calculado antes da captura do
comando pela validação existente; identificação permanente e vínculo anômalo
conservam captura/rollback. Completude global continua estrita. Seis controles
novos e 75 relacionados passaram. Retorno sem verification ainda exige a leitura;
permanente retorna/aplica bem; rejeição mantém rollback integral.

A matriz UI/Supabase existente foi ampliada para bloquear leitura contextual
**durante** a identificação sequencial de consumo/serviço/permanente e conferir
imediatamente NF, Pendência, tentativa, Assessoria e patrimônio antes de consultar
o banco separadamente. A prova real está pendente no SHA consolidado. Não supor
que o workload sustentado de avaliação/CRUD fiscal mede essa correção de novo envio.
Resumo causal e hashes em `document-attempt-red-green.json`.
