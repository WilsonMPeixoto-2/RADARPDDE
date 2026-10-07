# Dashboard/Carteira — sincronização escolar residual

Classe: handoff da frente, sem criar regra funcional nova.

## Baseline e objetivo

- Main verificada em 07/10: `2cb4fb359ff9614ebd7fdf824e297f22ebcb025f`.
- Branch: `fix/aggregate-school-sync-2026-10-07`, criada dessa main.
- #410 está mergeado; #407/#409 e checkpoints Draft antigos são históricos.
- Completar a aplicação escolar já existente para Dashboard, Carteira e
  Competências. Nenhuma mudança em Auth/RLS, schema, dependências, observabilidade
  ou smoke de Production pertence a esta frente.
- Não fazer merge antes de apresentar resultados ao usuário.

## Fronteira causal identificada no código

`decideInvalidationAction`, em `operational-realtime-invalidation.js`, transforma
todo evento fora do Prontuário em global, mesmo com entidade coberta e schoolId.
O shared refresh já oferece `refreshSchool`, aplica a fatia pelo DataService e
invoca `refreshCurrentView`. Dashboard/Carteira calculam seus indicadores a partir
da memória canônica; não precisam de um novo renderer ou bootstrap.

Há duas fronteiras adjacentes a confrontar: navegação para agregado com escolas
dirty e coalescimento de escolas diferentes no debounce. Ambas ainda promovem
para global. Não alterar sem contraprova e preservar o fallback necessário.

Contatos gerais (`pendency_contacts`) não têm a mesma cobertura das seis coleções
operacionais: a presença de schoolId por si só não permite trocar seu fallback.
Evento desconhecido, reconexão e competência/bootstrap continuam conservadores.

## Checkpoint inicial — histórico anterior à correção

`supabase-aggregate-school-sync.spec.js` autentica três sessões reais:
Dashboard/controlador, Carteira/assistente e escritor/controlador. O escritor usa
controles reais para criar/editar Despesa a identificar, cancelar sua Pendência,
criar/editar/excluir outra NF elegível e alterar outra escola. Observadores conferem
agregados crescentes/decrescentes, estado não vazio da outra escola, filtros e
competência. O contrato final exige oito leituras escolares e zero globais por
observador. O benchmark registra respostas/bytes, aplicações, renders, DOM,
long tasks, erros e capturas em artifact. O RED nativo está certificado abaixo.

Supabase local canônico 2.114.0 não pôde subir: a imagem Postgres excedeu o disco
de 32 GB. A prova usará o Supabase descartável do workflow de hardening existente.
Não adaptar CLI nem enfraquecer RLS para contornar capacidade do workspace.

## Continuidade

Este bloco conserva a sequência inicial. O checkpoint candidato abaixo é o
ponto de retomada vigente; não reiniciar a investigação nem reimplementar #410.

Primeiro run `37613255984` (`350dec11`) não certificou RED: a expectativa do
teste ignorou a pluralização vigente (`1 Escola`) e o retry reutilizou o banco
já modificado. A correção é no teste, sem mudar produto: aceitar singular/plural
e não repetir esta jornada sem reset. Sete REDs unitários de roteamento/navegação
confirmaram a fronteira; a contraprova completa veio no run abaixo. Run
`37613789796` parou em ação fiscal inelegível no teste; a jornada foi corrigida
sem alterar permissões nem código do produto.

1. Executar workflow `sync-hardening-targeted.yml` nesta branch e abrir artifact.
2. Diferenciar eventual erro de fixture/seletor do RED de produto.
3. Salvar números e run/SHA do RED antes de modificar implementação.
4. Reutilizar `refreshSchool` e o dirty/generation do #410, sem segundo scheduler.
5. Provar GREEN, recuperação/inflight/navegação/perfis e inspeção visual.
6. Atualizar docs canônicas estritamente afetadas, abrir PR e certificar CI final.

Dados brutos ficam nos artifacts; resumo, hashes, decisões e orientação ficam no
Git. Nenhuma escrita nem teste destrutivo em Production foi realizado.

## RED real certificado

Run `37614827962`, SHA `8c0bf804`: oito ações pelas interfaces reais; oito leituras
globais e zero escolares por observador (Dashboard/controlador e Carteira/assistente).
Estado/UI corretos inclusive no aumento e redução de Pendências, edição e exclusão
de NF sem histórico, filtros e outra escola. O teste falha precisamente em
`globalReads === 0`. Cada observador recebeu 33.395 bytes, fez oito aplicações e
oito substituições principais; zero pageerrors/faded frames/long tasks nesta base
mínima. [Resumo/hashes](../evidence/2026-10-07-aggregate-school-sync/minimal-baseline.json).

O teste respeita o contrato fiscal: despesa com Pendência não pode ser excluída.
Cancela a ocorrência indevida pelo drawer para medir redução do agregado e usa
outra NF sem histórico para provar exclusão real. Não alterar essa regra de negócio.

Para comparar custo remoto e preservação sobre dados não vazios, a próxima base
inclui 25 NFs sintéticas preexistentes em ESC-OTHER, preparadas com a identidade
autenticada antes de abrir observadores. O volume é controlado, não alegadamente
um clone de Production. A jornada/contagens são as mesmas; a base mínima anterior
permanece registrada e não deve ser comparada em bytes com essa nova base.

## Implementação candidata e limites

PR remoto: [#427](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/427), Draft.
Produto candidato `57b8e64b`. A primeira prova do candidato (`37616251841`) parou
na comparação da outra escola: timestamps legados PostgreSQL com microssegundos
e `+00:00` foram normalizados pelo codec vigente para ISO JavaScript (`Z`, ms).
Nenhum campo de negócio divergente foi identificado. O teste agora compara todas
as seis coleções pela porta canônica, incluindo filhos, sem omitir datas/campos;
não se altera o codec correto do #410 para satisfazer igualdade textual legada.

RED pareado com 25 NFs: `37615549972`, produto main inalterado (`23ce32de`), oito
globais por observador, 133.356 bytes cada. O resumo está em `baseline.json`;
comparar somente com candidato que use essa mesma fixture.

Somente `operational-realtime-invalidation.js` muda no produto: três rotas
agregadas passam a `refreshSchool`, e navegação com uma escola dirty preserva o
mesmo escopo. Repository, DataService, StatePort, renderizadores, RPCs, Auth/RLS,
schema, dependencies e timers não mudaram. A união de escopos multiescola do #410
foi preservada deliberadamente, assim como contatos gerais e recuperação global.
Esta frente não promete zero leituras globais em todos os cenários.

GREEN local: 40 controles focados; 1.310 unitários; oito integrações; sintaxe e
lint de segurança sem novos erros. O manifesto Production conferido permanece
na main `2cb4fb35`. Ainda medir candidato no Supabase nativo e confrontar CI final,
capturas e navegação/reconexão. Não confundir GREEN local com conclusão.

## Primeiro GREEN da jornada alvo e revisão de intercalações

Run `37616935756`, SHA `c0552659ff08f784e6e7911183981b76087b505f`:
a jornada principal passou com oito leituras escolares, zero globais e 53.362
bytes por observador. A fixture é a mesma do RED pareado: duas escolas, 25 NFs
preexistentes na outra escola e oito gestos. Foram preservadas as seis coleções
da escola não alterada, filtros, competência, UI e conferência após reload.
[Resumo e hash](../evidence/2026-10-07-aggregate-school-sync/first-candidate.json).
O workflow inteiro ainda falhou no segundo caso; este resultado não o certifica.

Comparação medida por observador: 133.356 → 53.362 bytes (−79.994); oito aplicações
globais → oito escolares. DOM permanece com oito substituições e 144/74 registros
de mutação (Dashboard/Carteira). Zero pageerrors, opacity reduzida ou long tasks
nesta massa. O tempo total de aplicação foi 5,5/5,7 → 12,9/9,0 ms; não alegar ganho
de CPU/DOM nem extrapolar percentual de Production. Capturas desktop foram abertas:
contexto Maio/2026, escopo, filtros, estados e ações legíveis; sem alteração de CSS
ou atualização de goldens. A próxima certificação conserva inspeção de CI visual.

Três problemas nos próprios testes foram confrontados sem mudar o produto:

- Segundo caso novo media contagem antes da última resposta terminar:
  `hasPendingRefresh() === false` também ocorre quando a leitura começa. Agora
  espera a resposta efetiva e compara `row_version` com SQL autenticado; a resposta
  retida é produzida antes da segunda escrita para não mascarar estado antigo.
- O E2E auditável do #410 retinha apenas `read_operational_context` no Dashboard.
  A chamada dirigida correta jamais chegava à barreira, causando timeout em
  readiness/homologação. A barreira passa à RPC escolar, mantendo prova de snapshot
  real, AbortSignal, recuperação sem gesto/navegação e acrescentando zero globais.
- Run sustentado `37616251842` falhou no teste que exigia estado antigo depois de
  desconectar somente WebSocket: HTTP em voo podia legitimamente trazer o novo
  estado. O mesmo produto passou a prova e comparação no run `37616935595`.
  Para remover essa dependência de ordem, o transporte anterior é drenado e
  leituras novas são retidas apenas durante a contraprova de evento perdido;
  reconexão continua real, SQL/Auth não são simulados e ambas variantes usam o
  mesmo harness. Não alterar recuperação do produto para bloquear HTTP saudável.

Produto segue exatamente `57b8e64b`; mudanças posteriores são evidência, docs e
testes. Próximo agente: concluir native hardening (seis casos), readiness e
homologação pré-production no novo SHA, confrontar todos os checks e nova comparação
sustentada. Não fazer merge automaticamente. PR #427 permanece Draft até relatório
com CI aplicável, ganhos medidos e limites. Dados brutos continuam nos artifacts.

## Recuperação após escrita — fronteira global legítima

Checkpoint `1fc6b653`, native hardening `37619349287`: ambas as novas jornadas
passaram, incluindo school dirty, navegação, versão SQL durante inflight e reconexão
global. O E2E antigo auditável falhou ao exigir duas RPCs escolares: recebeu uma.
Readiness/homologação reproduziram a mesma diferença. O produto continuou convergindo.

Diagnóstico no DataService vigente: `execute()` chama
`invalidateSchoolOperationalCoverage()` antes de qualquer escrita, inclusive
`audit:record`. A leitura escolar é abortada; a nova tentativa sem cobertura pede
`MISSING_BASELINE_COVERAGE` e o shared refresh usa global. Essa proteção do #410 não
é a leitura global residual por superfície agregada. O teste auditável agora exige
escolar inicial abortada + recuperação global + estado remoto correto antes de
navegar. Não remover essa cobertura conservadora nesta frente.

Também houve corrida no helper antigo de deep link: `getState()` podia ser chamado
antes de o singleton de competência existir. O helper passa a aguardar a API já
existente `isInitialized()`; nenhum bootstrap/readiness do produto foi alterado.

O benchmark novo registra tentativas além de respostas, para que um global
abortado não seja escondido na contagem. Capturas passam a cobrir a página inteira.
JSONs/capturas são gravados em arquivo e preservados num artifact pequeno separado
de vídeo/trace: `aggregate-school-sync-metrics-<run>`. Isso permite recuperar a
evidência sem depender de baixar centenas de MB. Todos os 1.318 unitários atuais
passaram localmente; os 39 controles de roteamento/recuperação selecionados também.
