# Retificação administrativa da bonificação/consolidação

**Escopo:** este documento trata a retificação de respostas de bonificação e do resultado consolidado. Correção dos dados de uma despesa, retificação de tipo e retificação de análise técnica possuem contratos próprios no [modelo canônico](../reference/SYSTEM_CANONICAL_MODEL.md) e na [matriz funcional](../reference/FUNCTIONAL_CONTRACT_MATRIX.md). Não usar a permissão abaixo como bloqueio genérico da edição fiscal autorizada por #397/#403/#404.

## Permissão da superfície de consolidação

Nesta superfície, somente o perfil funcional `assistente` pode retificar uma consolidação, conforme `RadarRetificacoes.canRetify`. Esta regra da superfície não substitui a autorização efetiva de Auth/RLS nem transforma simulação visual de perfil em identidade autenticada.

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
