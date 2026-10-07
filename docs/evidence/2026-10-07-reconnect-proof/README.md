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
  `PRRT_kwDOTSIJkc6p63HK` permanece aberta até a correção/prova do teste.
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
