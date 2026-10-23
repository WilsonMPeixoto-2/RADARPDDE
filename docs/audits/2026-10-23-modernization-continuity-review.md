# Modernização: revisão de continuidade e integração seletiva

**Classe:** auditoria datada e evidência de retomada; não redefine regras do produto.
**Data:** 23/10/2026. **Baseline recebida:** `8795f1e384b858e52b3ba4ca56ae54c58508161c`.
**Estado após a decisão desta rodada:** #477 integrado em `fdb522de8840e860845eb6596bc577a9aee77a2d`.

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
| Knip profundo, #475       | Comando opcional; análise de arquivos/exports/tipos e busca textual em seis loaders                                     | Candidato útil, sem remover arquivos nem alterar o gate de dependências                                                               |
| Axe, #474                 | Correção do nome acessível de “Mais filtros”; merge `78227c8744519d1357dc97d39207fe0b3b27b79c`                          | Entrega publicada. Não repetir correção ou declarar conformidade WCAG integral                                                        |
| Classificação de CI, #476 | Merge `8795f1e384b858e52b3ba4ca56ae54c58508161c`, somente observação                                                    | Já integrado; não havia economia de execução nessa etapa                                                                              |
| Redução restrita, #477    | HEAD `0abc468d6b7134861dabf242955011c7505b9f84`, nove workflows aprovados e caminho integral exercitado                 | Revisado e integrado nesta rodada; comprovar o caminho curto no job original com este relatório documental                            |

Fontes de A4: [resultado e limites](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/experiment/capabilities-a4-ts-knip-20261023/docs/audits/2026-10-23-a4-typecheck-knip-outcome.md).
A branch experimental permanece arquivo de evidências, com configurações que
ainda não foram promovidas à main. Não transportar seu workflow de piloto como
se fosse uma exigência funcional já aprovada.

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
troca de código ou relaxamento de asserções. O resultado deve ser consultado nos
mesmos runs, considerando a tentativa correspondente. Não entrar em loop até verde.

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

### Prova de economia ainda a registrar

Este arquivo é também um caso real de relatório de auditoria, criado depois da
integração da A6. Seu PR deve conter **somente este Markdown** para comprovar no
workflow original: classificação `docs-only`, check publicado com sucesso e
passos npm/Chromium/Supabase/jornadas marcados como `skipped`.

Comparar duração do job com `120253198023`, conservando a distinção entre tempo
do job, espera em fila e tempo total de todos os workflows. Registrar SHA, run,
steps e duração no corpo do PR desta evidência. Não atribuir uma redução total
da CI à economia de apenas um job. A função nova não reduz trabalho do navegador
do usuário nem comprova fluidez adicional do produto.

## Limites e próxima intervenção

A Vercel foi consultada antes da integração: Production `READY`, deployment
`dpl_DR5oJmJQAdGJNrq1wEF5owrZLxez`, SHA `8795f1e...` e domínio oficial vinculado.
Isso confirma o estado inicial; não comprova o deployment do merge posterior.
A homologação pública cancelada do #474 permanece cancelada, não “aprovada”.
Nenhuma sessão humana autenticada de Production foi executada nesta revisão.

Depois de concluir #475 e a prova A6, a próxima entrega útil é um contrato JS
pequeno, com consumidor real e contraprova TypeScript, em escopo próprio. Não
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
