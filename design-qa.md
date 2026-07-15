# Design QA — Ciclo B3 Interações compartilhadas

## Fonte visual de verdade

- referência aprovada pelo usuário: `docs/evidence/shared-interactions/approved-reference.png`;
- implementação: `docs/evidence/shared-interactions/implementation.png`;
- viewport comum: `1906 × 825`;
- estado comum: Assistente de Verbas Federais → Gestão de Equipe → desativar Alzira de Souza → Érika Reis selecionada;
- comparação integral combinada: `docs/evidence/shared-interactions/full-comparison.png`;
- comparação focada combinada: `docs/evidence/shared-interactions/dialog-comparison.png`.

## Comparação visual

| Dimensão | Avaliação |
|---|---|
| hierarquia | título, consequência, impacto, decisão, histórico e ações preservam a ordem aprovada |
| geometria | largura de 670 px, centralização, cantos, separação do rodapé e alinhamento correspondem ao sistema atual e à referência |
| espaçamento | a implementação é discretamente mais compacta, sem perda de legibilidade ou alvo de 44 px |
| tipografia | usa a tipografia e os pesos reais do RADAR; mantém a hierarquia da referência sem introduzir fonte nova |
| cores | violeta institucional para impacto/seleção e vermelho sólido para a ação destrutiva |
| foco | foco inicial visível em Cancelar, conforme contrato C-05 |
| texto | implementação usa `Alzira de Souza` também na preservação do histórico, tornando o objeto mais inequívoco |
| ativos | nenhum ativo novo necessário; o ícone informativo decorativo da referência não foi simulado por caractere ou SVG artesanal |

## Histórico de iteração

1. Primeira implementação: a ação destrutiva mantinha tratamento visual claro demais em relação à referência (`P2`).
2. Correção: estado habilitado passou a usar fundo vermelho sólido e texto branco, preservando o estado desabilitado existente.
3. Recaptura: referência e implementação foram capturadas no mesmo viewport e no mesmo estado, após a transição visual terminar.
4. Comparação final: nenhuma divergência `P0`, `P1` ou `P2` permaneceu.

## Verificações funcionais relacionadas ao desenho

- `role=alertdialog`, nome e descrição acessíveis;
- seletor sem preseleção;
- confirmação desabilitada até escolha válida;
- `Escape` cancela e restaura foco;
- falha mantém o diálogo, a seleção e a orientação contextual;
- sucesso comunica exatamente quem recebeu quantas escolas;
- nenhum erro de console ou de página durante a captura final.

## Pendências visuais

Nenhuma pendência bloqueadora. A ausência do ícone meramente decorativo é intencional para não introduzir ativo falso; o texto de impacto permanece completo e autossuficiente.

final result: passed
