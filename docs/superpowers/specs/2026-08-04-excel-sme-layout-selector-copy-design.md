# Excel SME — estrutura, formatação e seletor global

## Resultado homologado

O Excel SME público contém 27 colunas, de A até AA. São removidas exclusivamente as três colunas técnicas `SISTEMÁTICA PREENCHIDA` que ocupavam K, R e Y no template-fonte. Os campos administrativos posteriores permanecem preservados.

A designação é gravada como texto no padrão `XX.XX.XXX`, com formato `@`. Toda a área exportada possui bordas finas completas. Denominação, parecer e observações usam alinhamento descritivo à esquerda.

O cabeçalho mantém as cores e larguras do template, mas seus títulos são normalizados para eliminar espaços artificiais. Todas as células efetivas da primeira linha recebem centralização horizontal, centralização vertical, quebra automática e recuo zero, com altura fixa de 105 pontos.

Na interface, foi removida somente a frase `A seleção atualiza todas as telas e exportações mensais.`. O rótulo, o seletor de competência, o mês atual e a sincronização global permanecem.

## Evidências

- abertura manual no Microsoft Excel desktop sem solicitação de reparo;
- 27 colunas e designação textual confirmadas;
- linhas divisórias confirmadas;
- alinhamento final do cabeçalho certificado no renderer, no download real e na reabertura via ExcelJS;
- desktop, Android e iPhone aprovados;
- Auth, RLS, pgTAP, migrations, backup/restauração, Lighthouse e Supabase readiness aprovados.

## SHA homologado

`5b2c941a465d129a6afe2398037e5211621d2c64`
