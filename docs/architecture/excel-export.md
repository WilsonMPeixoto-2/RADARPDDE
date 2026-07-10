# Exportação Excel do RADAR PDDE

## Finalidade

Evoluir o relatório CSV existente para um arquivo `.xlsx` real, acrescentando organização, significado visual e análises opcionais sem reduzir o conteúdo originalmente exportado.

## Contrato do relatório original

A função `exportDataExcel()` percorre, nesta ordem:

1. todas as escolas;
2. todas as competências configuradas;
3. todos os programas vinculados a cada escola.

Uma linha é exportada somente quando existe verificação para a combinação `escola + competência + programa` e `resultadoBonif` está preenchido. Portanto, a granularidade original é:

> uma linha por escola, competência e programa com bonificação consolidada.

A competência ativa participa apenas do nome do arquivo CSV. Ela não limita o conteúdo, que abrange todas as competências disponíveis.

## Campos obrigatoriamente preservados

A aba principal `BONIFICACOES` deve manter os doze campos do CSV original, na mesma ordem lógica:

| Nº | Campo original | Rótulo aprimorado | Origem |
|---:|---|---|---|
| 1 | `INEP` | INEP | cadastro da escola |
| 2 | `Denominacao` | Denominação | cadastro da escola |
| 3 | `Designacao` | Designação | cadastro da escola |
| 4 | `Competencia` | Competência | competência iterada |
| 5 | `Programa` | Programa | programa vinculado |
| 6 | `CC` | Conta corrente | `bonificacao.extCC` |
| 7 | `Investimento` | Investimento | `bonificacao.extINV` |
| 8 | `NF` | Nota fiscal | `bonificacao.notaFiscal` |
| 9 | `Assessoria` | Assessoria | `bonificacao.consAssessoria` |
| 10 | `BBAgil` | BB Ágil | `bonificacao.declBBAgil` |
| 11 | `EncaminhadoInventario` | Encaminhado ao inventário | `bonificacao.encampInventario` |
| 12 | `StatusBonificacao` | Status da bonificação | `resultadoBonif` consolidado |

Nenhum desses campos pode ser removido, agregado, substituído por indicador ou transferido exclusivamente para outra aba.

## Aba principal

A aba `BONIFICACOES` será a base oficial do arquivo e deverá:

- conservar o universo de linhas do relatório original;
- preservar a ordem de escolas, competências e programas;
- manter o formato legado `MM-AAAA` na coluna Competência, enquanto formatos amigáveis podem aparecer nas abas opcionais;
- exibir `APTA` e `INAPTA` em texto, mesmo quando houver cor semântica;
- manter INEP, designação e competência como texto;
- permitir filtros, ordenação e congelamento de cabeçalhos;
- evitar gráficos ou resumos que interfiram na leitura da base.

## Abas opcionais

As abas adicionais devem ser totalmente derivadas da aba principal ou de estruturas explicitamente documentadas. A ausência delas não pode impedir o uso da base.

### `SINTESE_COMPETENCIA`

- quantidade de resultados consolidados por competência;
- quantidade de aptas e inaptas;
- taxa de aptidão calculada sobre linhas consolidadas;
- advertência explícita de que a unidade estatística é escola-programa-competência, não escola única.

### `SINTESE_PROGRAMA`

- consolidadas, aptas e inaptas por programa;
- comparação entre programas sem alterar a base.

### `QUALIDADE_DADOS`

- localização de campos ausentes ou substituídos por traço;
- referência à linha correspondente da aba principal;
- finalidade de controle, não de reclassificação do resultado.

### `METADADOS`

- data e hora da geração;
- versão do modelo;
- regra de inclusão;
- granularidade;
- escopo temporal;
- dicionário dos campos;
- indicação da fonte dos dados.

## Oportunidades posteriores

Após validação da primeira versão, outras abas podem ser acrescentadas sem alterar `BONIFICACOES`:

- análise técnica por documento, distinguindo bonificação e conferência;
- pendências abertas e resolvidas;
- inventário e bens permanentes;
- carteira por controlador e região administrativa;
- trilha de auditoria da exportação.

Essas abas exigem dados adicionais além do CSV original e, por isso, devem ser implementadas como módulos opcionais com origem e regra próprias.

## Questões corrigidas na evolução para XLSX

- o CSV atual não escapa ponto e vírgula, aspas e quebras de linha;
- o nome do arquivo sugere uma competência única, embora o conteúdo inclua todas;
- o CSV não suporta estilos, filtros estruturados, congelamento, metadados ou múltiplas abas;
- campos ausentes podem aparecer de maneira inconsistente;
- não existe declaração visível da unidade estatística nem da regra de inclusão.

## Regra de aceite

A exportação `.xlsx` somente poderá substituir a atual quando um teste de equivalência demonstrar que, para o mesmo estado da aplicação:

1. a quantidade de linhas da aba `BONIFICACOES` corresponde à quantidade de linhas do CSV original;
2. cada linha conserva os mesmos doze valores lógicos;
3. nenhum registro consolidado é omitido;
4. nenhum registro não consolidado é inserido;
5. as abas opcionais podem ser removidas sem perda do relatório básico.
