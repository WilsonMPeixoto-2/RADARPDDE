# Retificações administrativas

**Escopo:** bonificação e resultado consolidado; não descreve todas as
correções de dados de Notas Fiscais e despesas. A independência entre
bonificação e despesa está na
[ADR-055](../decisions/ADR-055-independencia-despesas-bonificacao.md).
Consultar as autorizações efetivas na implementação atual.


## Histórico de permissão do protótipo

Na fase inicial do protótipo, somente o perfil `assistente` podia retificar uma consolidação via `RadarRetificacoes.canRetify`. Esse registro histórico não define quem pode corrigir despesas, mudar tipos ou excluir notas no sistema atual.

## Fluxo

1. abrir o contexto escola × competência × programa;
2. informar justificativa obrigatória;
3. comparar estado anterior e posterior;
4. confirmar a alteração;
5. registrar autoria, perfil, data e campos modificados;
6. preservar o estado anterior no histórico.

## Independência lógica

A retificação altera respostas de bonificação e, quando informado, o resultado consolidado. Ela não resolve, cancela ou reabre pendências e não modifica a análise técnica automaticamente.

## Estrutura mínima

Cada registro contém identificador, escola, competência, programa, usuário, perfil, data/hora, justificativa, estado anterior, estado posterior, campos alterados e resultados agregados anterior e posterior.
