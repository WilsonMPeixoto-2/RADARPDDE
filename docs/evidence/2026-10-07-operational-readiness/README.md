# Retomada operacional depois do encerramento da sincronização

Baseline analisada: `a5a67d34b6dcab04903b6657fb9fa01f0aba9d11` (merge #429).
Esta frente não reabre a implementação #410/#427 nem autoriza CRUD em Production.

## Estado revalidado

- #429 fechado/mergeado em `a5a67d34`, candidato final `761560c0`.
- Os seis runs pós-merge consultados terminaram com sucesso: `37693918573`,
  `37693377212`, `37693377003`, `37693377153`, `37693377122`, `37693377164`.
- O smoke autenticado `37629357126` passou nos contratos, mas o job de contas
  reais foi **skipped** e o job de provisionamento executou. Isso não prova login
  nem jornada autenticada em Production.
- A matriz registra 44 operações: 18 `covered`, 26 `partial`, zero `gap` e zero
  `decision`. `partial` não significa defeito. Referências de evidência são caminhos
  de testes, não comprovantes de sua execução atual.

## RED anterior à implementação

Comando: `node --test tests/unit/production-authenticated-read.test.js tests/unit/production-authenticated-read-workflow.test.js`.
Node local: `v24.19.0`. Resultado: 12 testes, 10 aprovados, **2 falhas**, zero skips.

1. Falta opção manual somente leitura. Ambos os flags `WRITE_SMOKE_ENABLED` e
   `WRITE_SMOKE_REQUIRED` eram `1` para todo `workflow_dispatch`.
2. `isSuspiciousMutationRequest('POST', '/rest/v1/rpc/read_operational_context')`
   devolvia `true`; também faltava `read_school_operational_context` na allow-list.
   Isso faria a leitura funcional ser denunciada como mutação no fim do smoke.

Autoridades conferidas: `src/data/repository-factory.js` usa essas duas RPCs;
`src/data/supabase-repository.js:executeRpc` chama `client.rpc` sem opção GET.
As migrations `20260929143215` e `20261004132755` declaram `STABLE`,
`SECURITY INVOKER` e contêm consultas, sem DML na função. Não há substituição
posterior dessas funções nas migrations da baseline. A correção da allow-list
deve admitir apenas esses nomes conhecidos, nunca qualquer RPC `read_*`.

## Limites e próximo checkpoint

Nenhuma credencial foi lida ou versionada. Nenhuma execução autenticada, gravação
ou alteração de usuário foi feita em Production. O usuário recebeu instruções
para provisionar o secret pelo GitHub, sem compartilhar senha no chat.

Próximo passo: GREEN dos dois contratos, opção `read-only` como padrão manual,
revisão dos registros históricos e PR restrito ao smoke/documentação. A jornada
autenticada permanece pendente até credenciais/habilitação seguras.
