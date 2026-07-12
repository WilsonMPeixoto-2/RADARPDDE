# Retificações administrativas

## Regra provisória de permissão

Nesta fase do protótipo, somente o perfil `assistente` pode retificar uma consolidação. A autorização fica centralizada em `RadarRetificacoes.canRetify`, permitindo expansão futura sem alterar cada tela.

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
