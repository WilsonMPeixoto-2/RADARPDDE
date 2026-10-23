# Modernização: revisão de continuidade e integração seletiva

**Classe:** auditoria datada e evidência de retomada; não redefine regras do produto.
**Data:** 23/10/2026. **Baseline recebida:** `8795f1e384b858e52b3ba4ca56ae54c58508161c`.
**Estado após as decisões desta rodada:** #477 integrado em `fdb522de8840e860845eb6596bc577a9aee77a2d` e #475 em `f95b7d7ad3d9589cd616b2b052931df586755e69`.

## Objetivo e fronteira

Aproveitar capacidades úteis dos pacotes já atualizados, com benefícios para o
operador ou para a confiabilidade do desenvolvimento. Não repetir a atualização
de versões nem transformar cada API disponível em funcionalidade nova.

O material do outro agente foi confrontado com os SHAs remotos, diffs, scripts,
logs originais do GitHub e execuções locais proporcionais. Os três anexos da
retomada preservam momentos distintos; suas afirmações de estado não prevalecem
sobre o remoto. A main já continha #474 e #476, além do checkpoint #472/#473.

## O que pode ser reaproveitado

| Entrega                   | Evidência e alcance                                                                                                     | Decisão                                                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Matriz tecnológica A0     | Estudo e evidências na branch `docs/audit-capacidades-pacotes-out2026`, HEAD `82ae71624a62ac66f9def575343d56c441ff4db8` | Reaproveitar como inventário datado; não integrar toda a branch experimental                                                          |
| TypeScript A1/A2/A4       | A4, run `39901370296`, detectou TS2345 após trocar um argumento da chamada real `persistentId` em InvoiceService        | Capacidade demonstrada. O código válido já tinha diagnósticos de checkJs; não constitui gate pronto nem proteção regular dos serviços |
| Knip profundo, #475       | Comando opcional; análise de arquivos/exports/tipos e busca textual em seis loaders                                     | Integrado em f95b7d7a, sem remover arquivos nem alterar o gate de dependências                                                        |
| Axe, #474                 | Correção do nome acessível de “Mais filtros”; merge `78227c8744519d1357dc97d39207fe0b3b27b79c`                          | Entrega publicada. Não repetir correção ou declarar conformidade WCAG integral                                                        |
| Classificação de CI, #476 | Merge `8795f1e384b858e52b3ba4ca56ae54c58508161c`, somente observação                                                    | Já integrado; não havia economia de execução nessa etapa                                                                              |
| Redução restrita, #477    | HEAD `0abc468d6b7134861dabf242955011c7505b9f84`, nove workflows aprovados e caminho integral exercitado                 | Integrado; caminho curto comprovado no job original pelo SHA documental 5d48b08a                                                      |

Fontes de A4: [resultado e limites](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/experiment/capabilities-a4-ts-knip-20261023/docs/audits/2026-10-23-a4-typecheck-knip-outcome.md).
A branch experimental permanece arquivo de evidências, com configurações que
ainda não foram promovidas à main. Não transportar seu workflow de piloto como
se fosse uma exigência funcional já aprovada.

**Precisão da contraprova TS7:** o log original confirma
`A4_REAL_CONSUMER_MUTATION_DETECTED=true` e TS2345 na chamada fiscal mutada.
Entretanto, a função atual `persistentId` converte o prefixo com `String`:
uma sonda local confirmou resultado idêntico para `123` e `'123'`. A rejeição
estática comprova o contrato `string` escolhido no piloto; não comprova um bug
preexistente nem uma rejeição desse valor em runtime. Antes de ampliar a tipagem,
confrontar anotações com o contrato deliberado e consumidores existentes, sem
inventar regra funcional para justificar um erro do compilador.

## Verificação independente do Knip

Executados no HEAD exato do #475, `b2df23a5d838837f3a5075cee33307a2f06fadc1`,
sem instalar/atualizar pacotes. O lockfile é o mesmo da instalação já disponível.

- `npm run analyze:unused:deep`: exit 0; **34 arquivos**, **0 exports**, **0 types**;
  os 34 arquivos tinham referências textuais nos loaders conhecidos.
- Controle temporário em worktree isolado: um módulo sem consumidor foi
  identificado como candidato adicional; **35 arquivos, 34 com referência,
  1 sem referência**. O controle foi removido em `finally`.
- `npm run analyze:unused`: exit 0, preservando o comando obrigatório existente.
- Nenhuma contagem fixa de 34 foi incorporada como obrigação futura.

Referência textual não prova que um caminho execute em Production. Ausência de
referência nesses seis loaders também não prova código morto. O relatório
orienta triagem; não autoriza exclusão automática. Os JSONs brutos são artefatos
locais em `artifacts/tooling/`, não arquivos permanentes no Git.

### Falhas de CI do #475

Os logs originais foram examinados, sem atribuir automaticamente o vermelho ao
produto nem classificar tudo como flakiness:

| Run / job                      | Ponto observado                                                                                                                            | Classificação nesta revisão                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `39901657944` / `120244383962` | Timeout em `signInProfile`, aguardando prontidão/role no spec `pendency-reanalysis-auth`                                                   | Causa ainda não determinada; não demonstra regressão do diagnóstico Knip                                                               |
| `39901657987` / `120244383671` | Falha geométrica `ratio: 1` com razão observada `0.9488689303398132`; retry encontrou estado remoto que o início do cenário esperava vazio | Expectativa geométrica e isolamento do retry exigem investigação; não alterar finanças ou reduzir a asserção para aceitar a ferramenta |

Aplicação, SQL, E2E e lockfile são idênticos entre #475 e o candidato certificado
do #477. Isso enfraquece a atribuição causal ao Knip, mas não explica sozinho as
falhas. Foi solicitada **uma única repetição dos dois jobs falhos**, sem push,
troca de código ou relaxamento de asserções. O job repetido dos ciclos,
`120258077170`, concluiu **21/21 aprovados**. Isso não explica por si só a falha
anterior nem autoriza chamá-la de flakiness. Às 05:46 UTC, o job de perfis repetido,
`120258075303`, ainda instalava Chromium/WebKit, sem ter chegado aos testes.
O resultado posterior deve ser consultado no mesmo run, tentativa 2.
O #475 permaneceu Draft nesse checkpoint intermediário. Depois, o job de perfis
concluiu **14 Auth/RLS + 15 perfis/viewports + 4 jornadas adicionais**, todos
aprovados. Os **18/18 workflows** do HEAD `b2df23a5...` terminaram com sucesso;
nenhuma review/thread bloqueante foi encontrada. O PR foi integrado em
`f95b7d7ad3d9589cd616b2b052931df586755e69`, mantendo as ocorrências originais e
seus limites de diagnóstico. Nenhuma alteração foi feita para obter esses verdes.

## Decisão e prova do #477

O diff funcional da A6 altera um workflow, o classificador e seus testes; o quarto
arquivo é seu registro datado. Não muda produto, pacotes, SQL, RLS ou Auth.

- **9/9 workflows** concluídos com sucesso no HEAD `0abc468d...`.
- [Ciclos reais, run 39904494464](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39904494464),
  job `120253198023`: log `A6_FULL_RUN=true`, pilha descartável iniciada e
  **21 testes aprovados**. A própria alteração de CI recebeu execução integral.
- [Homologação integral, run 39904494509](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39904494509):
  gate final aprovado, incluindo Supabase/Auth/RLS/pgTAP, desktop e backup.
- Verificação local do candidato: **12/12 testes** da classificação, sintaxe e
  `git diff --check` aprovados.
- Quatro sondas adicionais em repositório Git temporário: relatório Markdown
  permite o atalho; runtime, rename de runtime para Markdown e SHA base
  inexistente mantêm `full`. O ambiente temporário foi removido.
- Não havia reviews ou threads bloqueantes no momento da integração.

O check **Criar editar converter excluir avaliar e reanalisar** conserva nome,
trigger e presença. Somente relatórios Markdown diretamente em `docs/audits/`
podem evitar os passos pesados daquele job. Outros documentos, scripts, testes,
pacotes, SQL, CI, execução manual ou classificação incerta mantêm a pilha real.
Os demais workflows permanecem ativos. A consulta administrativa de branch
protection não está disponível pela integração; nenhuma regra de proteção foi
modificada e não se autoriza ampliar o mecanismo a outros gates por este resultado.

### Prova de economia no workflow original

O [PR #478](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/478), contendo
**somente este Markdown**, forneceu o caso real. No HEAD documental
`5d48b08a8db02525421c47f2be4708482fb6ad40`, o
[run 39906425278](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39906425278)
publicou o check original com sucesso, `scope: docs-only` e
`A6_DOCS_ONLY_SKIP=true`. Os passos npm/Chromium/Supabase/Auth/jornadas e seu
cleanup/artifact ficaram explicitamente `skipped`. Isso registra dispensa
proporcional, não aprovação de testes que não rodaram.

| Caminho do mesmo job      | Run / job                      | Início/fim UTC, 23/10 | Duração   |
| ------------------------- | ------------------------------ | --------------------- | --------- |
| Completo, alteração de CI | `39904494464` / `120253198023` | 05:12:42–05:18:24     | **342 s** |
| Relatório de auditoria    | `39906425278` / `120259336588` | 05:33:36–05:33:47     | **11 s**  |

**331 segundos a menos nesse job, redução observada de 96,8%.** Uma amostra por
caminho, com timestamps das respostas originais da API do GitHub; não é benchmark
estatístico, redução total de todos os workflows ou medição de espera em fila.
Os outros workflows continuaram ativos, inclusive a homologação integral. A A6
não reduz trabalho do navegador do usuário nem comprova fluidez adicional.

Os **cinco workflows** do HEAD documental `5d48b08a...` concluíram com sucesso.
O log original da homologação registra **227 testes desktop aprovados / 68
pulados**, **674 pgTAP**, **18 jornadas Auth/Supabase** e **4 jornadas de login
tardio/proteção patrimonial** aprovadas. São recortes sobrepostos das suítes;
não somá-los como quantidade de testes únicos nem atribuí-los à edição
documental posterior deste relatório.

A revisão final também atualiza as rotas documentais `CURRENT_STAGE`,
`docs/README` e `STATUS_DOCUMENTOS`. Esses caminhos ficam fora da allowlist da
A6, portanto o HEAD final deve executar o job integral, preservando a política.
A medição de 11 segundos pertence exclusivamente ao diff documental de um
arquivo do SHA `5d48b08a...`; não transferi-la para um diff diferente.

## Limites e próxima intervenção

A Vercel foi consultada antes e depois da integração. Estado inicial: Production
`READY`, deployment `dpl_DR5oJmJQAdGJNrq1wEF5owrZLxez`, SHA `8795f1e...`.
Depois do merge #477: **READY**, deployment
`dpl_95kFJ5B1RaXxaDxFkx6XvRrvJmRx`, SHA
`fdb522de8840e860845eb6596bc577a9aee77a2d`, domínio oficial vinculado. Os cinco
workflows distintos de push desse merge aprovaram; houve ainda uma execução
adicional bem-sucedida de monitoramento.
A consulta posterior ao #475 confirmou **READY**, deployment
`dpl_H187AY8pvVxaT2BZvRdEyPSWtfbz`, SHA
`f95b7d7ad3d9589cd616b2b052931df586755e69` e domínio oficial vinculado.
A homologação pública cancelada do #474 permanece cancelada, não “aprovada”.
Nenhuma sessão humana autenticada de Production foi executada nesta revisão.

A integração do #475 e a prova A6 estão concluídas. A próxima entrega útil é um
contrato JS pequeno, com consumidor real e contraprova TypeScript, em escopo próprio. Não
promover o InvoiceService inteiro a checkJs enquanto o código válido reprovar,
nem silenciar diagnósticos em massa. Lighthouse por jornada, avisos ESLint e
desempenho permanecem frentes separadas, reaproveitando #446/#447 quando pertinentes.

Correção ao estudo inicial: o `FuseWorker` instalado rejeita `useTokenSearch`,
modo já usado pelo RADAR. A substituição direta foi refutada também por sonda
local. Se a busca justificar melhoria, medir primeiro reconstrução/reuso do
índice atual sem perder sua semântica. [Documentação](https://www.fusejs.io/web-workers.html).

Não reabrir a CLI #472 nem a proteção premium de senhas vazadas no plano atual.
Nenhuma configuração de Production, permissão, regra financeira ou dado
institucional foi alterado para executar esta revisão.
