# Revisão pós-merge — causalidade da prova de reconexão

Baseline: main `5152f435bf3fdbb123534b7ce4f7f9ccb8cca740`, #427/#428 publicados.
A análise externa do Manus e a revisão posterior foram tratadas como hipóteses e
confrontadas com código, workflow, referências e threads atuais.

## Achados confirmados

- A-1: o spec sustentado registra a request depois da latência/barreira; a drenagem
  pode não enxergar uma leitura retida. Liberá-la antes de provar recovery permite
  que ela busque o estado novo sem que a recuperação da reconexão o tenha obtido.
- A-2/P1: STATUS_DOCUMENTOS e a rota canônica já foram corrigidos pelo #428.
  Thread `PRRT_kwDOTSIJkc6p63HP` respondida com a evidência e resolvida. A thread P2
  `PRRT_kwDOTSIJkc6p63HK` é respondida com link ao #429 após GREEN e contraprova.
- A-3: duas referências do smoke ainda exigem identidades técnicas exclusivas.
  #426 e seu workflow aceitam de uma a cinco contas reais autorizadas; agendamento
  somente leitura e escrita manual reversível explicitamente habilitada.

## Contraprova planejada e limite da sugestão externa

O controlador compartilha uma única leitura em voo. Reter uma resposta antiga
indefinidamente pode impedir a nova RPC de começar; isso seria um falso defeito
produzido pelo teste. A prova deve impedir que uma leitura anterior forneça o novo
estado, preservando o fluxo real de serialização. Primeiro reproduzir o falso
positivo com recovery suprimido apenas no harness. Depois reter uma resposta SQL
antiga e provar a convergência exclusivamente após a resposta nova de recovery.

Escopo: teste, suporte de teste, evidências e os dois parágrafos documentais.
Nenhuma mudança em produto, migrations, Auth/RLS, dependências ou Production.
O-1/O-2/O-3 são observações, não implementação autorizada automaticamente. Os
60% pertencem à fixture pareada; deltas do gate pré-#410 não isolam o #427. As
observações externas de Production são datadas e não foram reexecutadas aqui.

## RED nativo confirmado

Run [37654112405](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/37654112405),
SHA `b686c438`, seis sessões/40 rodadas. Baseline passou; candidato falhou na
asserção causal adicionada. Com a leitura de recovery suprimida no harness, a
asserção original `Sim` e `reconnectRefreshes > 0` passaram por causa da request
antiga invisível à drenagem. O resumo/hash do artefato estão em `red.json`.
A sabotagem é temporária e será removida do candidato final. Não é falha nova de
Production nem justificativa para alterar o controlador.

## Checkpoint #429

Correção do harness publicada em `829c3d10`; 1323 unitários e oito integrações
aprovados. [Continuidade completa](../../handoff/2026-10-07-pr429-reconnect-proof.md).
A sabotagem do RED foi removida do candidato. Resultado local em `local-validation.json`.

## GREEN nativo confirmado

Seis execuções verdes da prova causal, zero falhas (baseline e candidato em cada run):

- [37655737551](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/37655737551):
  dispatch diagnóstico, 40 rodadas, SHA `829c3d10`; old `Não`/v44, recovery `Sim`/v45.
- [37655886850](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/37655886850):
  gate do PR, 400 rodadas, SHA `829c3d10`; old `Não`/v404, recovery `Sim`/v405.
- [37656306919](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/37656306919):
  gate do PR, 400 rodadas, SHA `4f87ef1c` (só docs sobre `829c3d10`); old `Não`/v404,
  recovery `Sim`/v405.

Em todas: `oldHeldThroughReconnect`, `uiOldBeforeRecovery` e `uiConvergedAfterRecovery`
verdadeiros; RPC de recovery `read_operational_context`; origem
`session-realtime-reconnect-inflight-finished-refresh`. A reconexão ocorre uma vez por
variante por execução; as 400 rodadas medem a carga sustentada, não 400 reconexões.
A prova é um invariante de recuperação e não diferencia baseline de candidato.

## Contraprova do mecanismo final

Run [37665993736](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/37665993736),
branch descartável sobre `4f87ef1c` (commit `700f7af9`, branch já removida), 40 rodadas.
Mesma sabotagem do RED, só no candidato: `loadOperationalContext` com source contendo
`realtime-reconnect` retorna `skipped`; socket, SUBSCRIBED e métricas permanecem reais.

- Baseline: passou (old `Não`/v44, recovery `Sim`/v45, reload concluído).
- Candidato: **falhou como exigido** em `stage: reconnect-counterproof`, na espera da
  resposta de recovery (`Expected "Sim"`, `Received undefined`, timeout de 60 s);
  `recoveryReadsSuppressed: 1`. A resposta antiga `Não`/v44 foi liberada e não
  produziu convergência.
- O job de comparação falhou por consequência (`candidate: experiment is incomplete
  or failed (requires passed reload)`), comportamento fail-closed esperado.
- Artefato pequeno do candidato `11502977073`, sha256
  `abf1a5530945e2041553fadee532c28bd42c1ca9217362857e74eee57f150225`.

Conclusão: o novo harness não aprova a reconexão sem a leitura real de recovery; o
falso positivo apontado no P2 do #427 está sanado. Produto, Auth/RLS, banco e
Production não foram alterados.

## Retomada: confronto com os artefatos finais

Revisão independente do HEAD `d0d4739c` após o diagnóstico do Manus (branch
`docs/auditoria-manus-2026-10-07`, checkpoint `b0442990`). Não foi necessário alterar
produto nem harness. O relato estava temporalmente superado: a **tentativa 4** do
run `37667249912` terminou com sucesso, inclusive comparação, às 21:00:36 UTC.

| Tentativa | Baseline | Candidato | Interpretação |
| --- | --- | --- | --- |
| 1 | cancelado em Instalar Chromium, ~35 min | passou 400 rodadas/reload | backend/spec do baseline não iniciaram; timeout do job, não concorrência de pushes |
| 2 | falhou no login, opacity esperada 1/recebida 0, 5 s | resultado aprovado da tentativa 1 preservado | spec iniciou, mas zero gestos e reconnectProof vazio; não chegou às rodadas/reconexão |
| 3 | cancelado em Instalar Chromium, ~35 min | resultado aprovado preservado | mesmo estágio de preparação da tentativa 1 |
| 4 | passou 400 rodadas/reload | resultado aprovado preservado | comparação aprovada, sem mudança do teste |

A falha de login permanece registrada; não comprovamos que sua causa foi apenas
animação lenta. A linha antecede o #429 e não foi modificada. Uma passagem posterior
não apaga essa ocorrência, mas ela não reproduziu defeito do recovery. Não houve
relaxamento de asserções ou aumento de timeout para produzir verde.

Os artifacts pequenos foram baixados por ID, abertos e conferidos: ambos os
resultados finais têm seis sessões, 400 rodadas, 1.107 gestos, `stage=reload` e
`outcome=passed`. Tempos observados por sessão: aproximadamente 466,5 s baseline e
417,6 s candidato. Não interpretar esses tempos como ganho deste PR: o runtime é
inalterado e as variantes foram executadas em momentos/runners distintos.

Em ambos, snapshot antigo Não/v404 foi retido durante reconnect; a nova RPC global
obteve Sim/v405; UI permaneceu antiga antes da entrega e convergiu depois. Também
reabrimos o artifact da contraprova `37665993736`: recovery suprimido uma vez,
nenhuma resposta nova e falha esperada após 60 s. Seu hash coincide com o publicado.
O commit descartável `700f7af9` modifica somente o harness; essa sabotagem não está
no HEAD do PR. Threads P1/P2 do #427 confirmadas resolvidas; #429 sem threads abertas.

`final-artifact-verification.json` preserva resultados/hashes; `run-attempts.json`
preserva estágios e timestamps sem logs brutos. No HEAD revisado `d0d4739c`, **9/9
workflows concluíram verdes**, PR aberto, não Draft e mergeável. A descrição antiga
que ainda dizia GREEN pendente foi corrigida. Esta revisão apresenta prontidão;
não executa merge automaticamente nem altera Production.
