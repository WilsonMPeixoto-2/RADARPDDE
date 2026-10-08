# PR #429 — histórico concluído da prova causal de reconexão

> **Encerramento confirmado em 08/10/2026:** PR #429 integrado em 07/10 às 22:00:57 UTC, merge `a5a67d34b6dcab04903b6657fb9fa01f0aba9d11`. Candidato final `761560c056845f8b9dcaa017853d52f6dbfba76f`, nove workflows verdes, inclusive gate sustentado `37691286270`. Production `dpl_BW2hefHBNgc7Aq1R4j7wEBsfYE9K`, READY, no merge. Este handoff não é corrente; Draft, candidato anterior e espera de merge abaixo são checkpoints históricos. Preservar RED, GREEN e contraprova; não repetir a certificação para encerrar uma entrega já concluída. A retomada pertence a [CURRENT_STAGE.md](../CURRENT_STAGE.md).

**Checkpoint de 07/10/2026, antes de interrupção por cota; atualizado no mesmo dia
com GREEN nativo e contraprova do mecanismo final (seção "Encerramento").**
Escopo exclusivo de testes/documentação; não é nova frente de performance do produto.

## Estado remoto

- PR aberto **Draft**: https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/429
- Branch: `test/postmerge-reconnect-proof-2026-10-07`.
- Baseline main: `5152f435bf3fdbb123534b7ce4f7f9ccb8cca740` (#427/#428 integrados).
- Candidato de testes: `829c3d1043b6cfa49e6c31f0bc78c99b6a8ede1f`.
- O commit deste handoff somente acrescenta documentação; não muda o teste candidato.
- Nenhuma alteração em produto, banco, Auth/RLS, dependências ou Production.
- GREEN nativo e contraprova registrados abaixo; merge do PR somente com checks verdes.

## Pedido e decisões

O usuário trouxe revisão externa Manus e concordância de outro agente. Conferimos os
achados no código, referências e threads. O trabalho aprovado de #410/#427 continua
encerrado. O follow-up corrige a força da prova de reconexão e duas referências do
smoke #426. Não implementar O-1 (telemetria futura), O-2 (aborts) ou O-3 (baseline
incremental) como tarefas deste PR. Baseline estrutural fixa #408 permanece.

A redução de aproximadamente 60% dos bytes é do cenário pareado #427. Os deltas
sustentados contra #408 incluem #410. DOM/CPU não têm melhora demonstrada. Não
reexecutamos logs de Production nesta rodada; as observações externas são datadas.

## RED causal confirmado em Supabase real

Commit temporário: `b686c438b7b5a9f0f027e89d93f97cc839d59d46`.
Run: https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/37654112405

- Seis sessões, 40 rodadas; baseline passou e candidato falhou **como esperado**.
- No harness antigo, request era registrada no Set somente depois de latência/barreira.
- Forçamos leitura anterior retida enquanto o socket estava desconectado.
- Suprimimos somente `loadOperationalContext` com source contendo `realtime-reconnect`;
  mantivemos socket, SUBSCRIBED e métrica reais. Sabotagem somente no teste.
- A drenagem declarou zero requests apesar da leitura retida.
- Escritor gravou Sim; o observador mostrava Não.
- A barreira antiga foi liberada antes de reconectar, permitindo SQL com o novo Sim.
- A asserção original Sim e `reconnectRefreshes > 0` passaram mesmo com recovery suprimido.
- A asserção causal adicional Não falhou, confirmando falso positivo da prova anterior.
- Não é um defeito novo do produto. A sabotagem **foi removida** do candidato `829c3d10`.

Resumo durável e SHA256 do artefato: `docs/evidence/2026-10-07-reconnect-proof/red.json`.
Job candidato `112904743021`; artefato pequeno `11497023708` (377019 bytes).
SHA256 ZIP: `5301e2ce64ccb7e75079ba3aefe5415a25ea545b7b6dfdd4cc613fc9d7e43aa3`.
Os JSONs completos, vídeos e screenshots ficam nos artifacts do run.

## Correção candidata já publicada

Arquivos: spec `tests/e2e/operational-sustained-sessions.spec.js`, suporte
`tests/support/operational-read-tracker.js`, cinco testes unitários correspondentes,
filtro de paths do workflow (inclui helpers `operational-*.js`).

1. Registrar request ao entrar na rota, antes de latência/falha/barreira.
2. Distinguir requests ativas e respostas retidas. Abort remove ambas; handler tardio
   não pode ressuscitar request; liberar barreira não significa HTTP terminado.
3. Desconectar socket real; obter e reter **resposta SQL real já contendo Não** antes
   da escrita offline. `route.fetch` usa Auth/RLS/SQL reais; não inventamos payload.
4. Escritor grava Sim; observador continua Não.
5. Reconectar e exigir SUBSCRIBED, incremento de reconnectRefreshes **e** execução do
   scheduler (`refreshAttempts`) com pendência, mantendo resposta antiga retida.
6. Só então liberar snapshot antigo Não. O controller usa single-flight compartilhado:
   reter essa resposta até a nova RPC terminar causaria deadlock artificial. Por isso
   a proposta externa foi adaptada; a resposta antiga já não pode obter o Sim novo.
7. Reter a nova resposta global real Sim; confirmar RPC iniciada após reconnect,
   row_version maior, UI ainda Não antes da entrega.
8. Liberar recovery; exigir UI Sim e load global concluído com source de reconnect,
   sem stale/abort. Depois escrita final Não e comparação com banco/reload existentes.
9. `faults.reconnectProof` documenta timestamps, versões, valores, origem e ordenação.

A sonda antiga acrescenta uma leitura real às duas variantes. Não atribuir alteração
nas métricas desse estágio a ganho/regressão do produto. Produto é idêntico à main.
A correção deve ser confrontada no CI; não mascarar falha alterando controlador.

## Testes locais efetivamente concluídos

- `node --test tests/unit/operational-read-tracker.test.js`: 5/5, zero falhas/skips.
- `npm run test:unit`: **1323/1323**, zero falhas/skips; 57143 ms.
- `npm run test:integration`: **8/8**, zero falhas/skips.
- `npm run check:workflow-references`: 38 workflows, 342 referências válidas.
- `node --check tests/e2e/operational-sustained-sessions.spec.js`: aprovado.
- ESLint do spec: zero erros, nove warnings.
- `npm run lint:e2e`: zero erros, 224 warnings na suíte; não houve autofix.
- `git diff --check`: aprovado antes da publicação.

Resultados/hashes dos logs locais em `docs/evidence/2026-10-07-reconnect-proof/local-validation.json`.
Não confundir esses controles com a prova GREEN do novo E2E.

## CI disparada, ainda sem resultado neste checkpoint

Registro original do checkpoint. No SHA `829c3d10`, última consulta retornou **queued**
(resultados finais na seção "Encerramento"):

- `37655737551`: dispatch diagnóstico 40 rodadas, baseline e candidato.
- `37655886850`: PR gate sustentado 400 rodadas, baseline e candidato.
- `37655886360`: Supabase readiness.
- `37655886585`: saúde das dependências.
- `37655886491`: homologação integral pré-production.
- `37655886594`: confiabilidade funcional Supabase real.
- `37655886875`: CodeQL.
- `37655886838`: validar RADAR.
- `37655887029`: E2E Playwright.
- `37655886488`: ciclos funcionais reais.

Reconsultar estado; não disparar duplicatas antes de verificar. Não cancelamos runs.
O workflow usa concurrency por ref; dispatches da mesma branch podem enfileirar.

## Próximos passos proporcionais

1. Conferir HEAD remoto, diff, estado dos runs acima e resultado do candidato.
2. Se o E2E falhar, inspecionar `stage`, `faults.reconnectProof`, logs e artefatos.
   O teste novo ainda não recebeu GREEN nativo; não presumir defeito de produto.
3. Após GREEN, completar três execuções diagnósticas do spec (40 rodadas) no mesmo
   candidato e confirmar prova sustentada 400 rodadas. Já há uma diagnóstica disparada.
4. Rodar hardening real (`sync-hardening-targeted.yml`) se não tiver sido coberto.
5. Contraprova do harness final: temporariamente suprimir recovery como no RED e
   exigir falha na espera da nova resposta/na convergência; remover a sabotagem antes
   do candidato final. O RED atual comprova o falso positivo antigo, não substitui
   automaticamente essa contraprova do novo mecanismo.
6. Registrar evidências compactas/IDs/hashes, sem grandes JSONs brutos no Git.
7. Atualizar PR e referências; resolver P2 somente após validação, com link ao PR.
8. Apresentar relatório de prontidão; não fazer merge enquanto certificação pendente.

## Reviews/documentação já tratadas

- P1 #427, thread `PRRT_kwDOTSIJkc6p63HP`, comentário raiz `4207328078`:
  respondida citando #428 e resolvida. Reply `4209494668`.
- P2 #427, thread `PRRT_kwDOTSIJkc6p63HK`, raiz `4207328068`: respondida (reply `4210508192`) e resolvida após GREEN e contraprova.
- `SUPABASE_INTEGRATION_AUDIT.md` e `SUPABASE_FUNCTIONAL_COVERAGE.md` atualizados
  no commit `8e741d98`: #426 aceita 1–5 contas reais autorizadas, agendamento read-only,
  CRUD manual reversível explicitamente autorizado. Não provisionamos credenciais.

## Ambiente e persistência

Worktree: `/workspace/RADARPDDE-reconnect-proof`. `node_modules` é symlink não
versionado da worktree anterior; lockfiles conferidos idênticos. Não commitar isso.
Docker local indisponível nesta rodada (disco livre ~9,6 GB); usar CI descartável,
CLI canônico 2.114.0, não Production. Nenhuma infraestrutura cloud nova foi criada.

GitHub apresentou erros internos em git push, criação de PR e dispatch. Conseguimos
salvar a árvore pela API de trees/commit e atualizar a ref via REST PATCH; depois
abrir #429 e disparar CI. Não interpretar erros como rejeição de segurança.

- Commits locais `2db3c427` + `fe637ef2` foram consolidados em `829c3d10` pela API.
- Mesma árvore: `9a4b1fce8a559a3ff066f859d1372f36f5a605db`.
- Backup local `checkpoint/reconnect-local-fe637ef2`; branch ativa sincronizada com remoto.
- `gh api graphql` também falhou com 401 nesta sessão; conector GitHub funcionou
  para threads. REST/connector podem servir de alternativa quando git push falhar.
- Artefato RED local: `/workspace/attachments/b6468102-c1a3-4773-8aa0-779dc5ef688d/github-actions-artifact-11497023708.zip`.
- Logs locais: `/workspace/scratch/reconnect-red.log`, `reconnect-unit.log`, `reconnect-lint-e2e.log`.

**Não há correção nova de runtime proposta. O objetivo restante é tornar a evidência
causal mais forte e encerrar este pequeno follow-up, não reabrir performance por estética.**

## Encerramento — GREEN nativo e contraprova (07/10/2026)

Resultados reconsultados no GitHub e nos artefatos `operational-metrics-*`:

- `37655737551` (dispatch, 40 rodadas, `829c3d10`): **success**; baseline e candidato
  com old `Não`/v44 retido, recovery `Sim`/v45 e UI convergida só após recovery.
- `37655886850` (PR, 400 rodadas, `829c3d10`): **success**; old `Não`/v404, recovery `Sim`/v405.
- `37656306919` (PR, 400 rodadas, head `4f87ef1c`): **success**; mesmos valores.
- Os nove workflows do head `4f87ef1c` concluíram com sucesso. Runs de `829c3d10`
  cancelados foram substituídos pelo push seguinte (concorrência), não falharam.
- O código de teste é idêntico em `829c3d10` e `4f87ef1c`; as três execuções do
  passo 3 ficam cumpridas (seis execuções verdes, zero falhas).

Contraprova do passo 5: branch descartável `tmp/counterproof-pr429-2026-10-07`
(commit `700f7af9` sobre `4f87ef1c`), mesma supressão do RED somente no candidato,
run `37665993736` (40 rodadas). Baseline passou; candidato **falhou como exigido** em
`reconnect-counterproof`, aguardando a resposta de recovery (`Expected "Sim"`,
`Received undefined`, 60 s), com `recoveryReadsSuppressed: 1`. A comparação falhou
por consequência (`requires passed reload`). Branch removida após registrar o run.
Detalhes e hash do artefato em `docs/evidence/2026-10-07-reconnect-proof/README.md`.

Hardening (`sync-hardening-targeted.yml`) não foi executado: o PR não altera produto.
Thread P2 `PRRT_kwDOTSIJkc6p63HK` do #427 respondida com link ao #429 (reply `4210508192`) e resolvida.

## Verificação da retomada após o Manus

O diagnóstico `b0442990` foi confrontado com as quatro tentativas do run
`37667249912`. A quarta concluiu baseline e comparação; candidato aprovado desde a
primeira tentativa. Ambos completaram 400 rodadas, 1.107 gestos, prova causal e reload.
Artefatos finais e contraprova baixados/abertos novamente, hashes registrados em
`docs/evidence/2026-10-07-reconnect-proof/final-artifact-verification.json`.
Estágios/timestamps em `run-attempts.json`; interpretação no README da mesma pasta.

Não reabrir a implementação: tentativas 1/3 não chegaram ao backend/spec do baseline;
tentativa 2 chegou ao login, com zero gestos e sem reconexão. A ocorrência de opacity
no login fica registrada, sem atribuir causa não provada ou relaxar o teste.
HEAD revisado `d0d4739c`: 9/9 workflows verdes, PR não Draft/mergeável, P1/P2 resolvidas.
A revisão não fez merge. O commit documental seguinte preserva esta verificação;
consultar checks atuais antes de integrar. Não repetir a contraprova já confirmada.
