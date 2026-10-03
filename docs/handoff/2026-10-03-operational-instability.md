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
container. Isso é mecanismo compatível com flicker, ainda sem prova visual
sustentada desta sessão. Medir substituição de DOM, foco, scroll e convergência;
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

1. Executar gate corrigido no runner descartável e não confundir preparação com
   jornada: medir pelo navegador com Auth, RLS e Realtime reais.
2. Usar mesmo workload no baseline #406/main e no #407, com leitura pesada,
   sessões escritoras/observadoras, edição, latência, erro e retorno à aba.
3. Publicar contagem de gestos, escritas, Broadcasts, leituras, origem, payload,
   p50/p95/p99, applies, substituições de DOM, convergência e resultado após F5.
4. Somente então classificar desperdício/defeito e escrever RED da hipótese causal.
5. Preservar checkpoint remoto após cada etapa, incluindo falhas e lacunas.

Não houve nova correção funcional nesta retomada. Não afirmar solução definitiva,
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
