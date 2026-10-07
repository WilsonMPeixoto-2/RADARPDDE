# Auditoria Manus: pós-merge dos PRs #427/#428 e conclusão do #429 (07/10/2026)

**Classe documental:** auditoria externa datada (histórico). Este registro não forma fila de execução.
**Autor:** agente Manus, a pedido do mantenedor.
**Escopo:** verificação independente pós-merge dos PRs #427/#428 e conclusão controlada do PR #429, que mexe só em testes e documentação.

## Etapas

| Etapa | Conteúdo | Arquivo |
|---|---|---|
| 1 | Pós-merge dos PRs #427/#428: código Realtime/refresh, RPC escolar, CI, artefatos e Production | resumo abaixo (o arquivo original se perdeu) |
| 2 | Verificação do ganho com uso real (consultas somente leitura no Supabase e logs) | resumo abaixo (o arquivo original se perdeu) |
| 3 | O que o Codex fez no #429, o que descobriu e o que faltava | [etapa-03-pr429-trabalho-do-codex.md](etapa-03-pr429-trabalho-do-codex.md) |
| 4 | Contraprova, documentação do #429 e thread P2 do #427 | [etapa-04-pr429-contraprova-docs-thread.md](etapa-04-pr429-contraprova-docs-thread.md) |
| 5 | Checks finais e merge do #429 | etapa-05 (acrescentada após o merge) |

Script reutilizável: [resumo-prova-causal.sh](resumo-prova-causal.sh). Ele baixa os artefatos `operational-metrics-*` de um run e resume a prova de reconexão.

## Resumo das Etapas 1 e 2

Os arquivos originais dessas etapas ficavam no sandbox do agente e se perderam quando ele foi reiniciado, antes de qualquer versionamento. Abaixo está apenas o que foi preservado no registro da sessão. **Não há números novos aqui.**

**Etapa 1 (pós-merge #427/#428):**

- os PRs #427 e #428 estão integrados e publicados;
- a decisão de invalidação Realtime passou a privilegiar o refresh escolar nas telas de escola;
- nenhuma regressão funcional foi identificada.

Há uma observação não bloqueante. O caminho escolar não emite o evento global `operational-context-refreshed`; algum consumidor que dependa desse evento só será notificado no fallback global.

**Etapa 2 (ganho em uso real):**

- as consultas somente leitura não bastam para medir o ganho do #427 em Production, porque ainda há pouco uso real após o merge;
- a redução de cerca de 60% em bytes continua sendo uma medida da fixture pareada, não de Production.

Houve também indício de logouts depois de respostas 401 durante a renovação de sessão. Esse ponto deve ser investigado separadamente e **não foi atribuído** aos PRs #427/#428.

## Resultado do #429 (detalhes nas Etapas 3 e 4)

- **RED** (run 37654112405): confirmou o falso positivo da prova antiga de reconexão.
- **GREEN nativo:** seis execuções verdes da nova prova causal (runs 37655737551, 37655886850 e 37656306919).
- **Contraprova** (run 37665993736): com a recuperação suprimida no harness, o candidato falha em `reconnect-counterproof`.
- **Thread P2 do #427** (`PRRT_kwDOTSIJkc6p63HK`): respondida e resolvida.
