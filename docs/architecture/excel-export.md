# Exportação Excel do RADAR PDDE

## Finalidade

Evoluir o relatório CSV existente para um arquivo `.xlsx` real, acrescentando organização, significado visual e análises opcionais sem reduzir o conteúdo originalmente exportado.

A versão visual aprovada em 10/07/2026 passa a ser a referência funcional e editorial para a implementação. O padrão deve ser adaptado à finalidade operacional do RADAR, sem reproduzir mecanicamente todos os componentes do sistema editorial.

A referência binária imutável está preservada em [`docs/reference/RADAR_PDDE_Exportacao_Excel_Aprovada_v1.xlsx`](../reference/RADAR_PDDE_Exportacao_Excel_Aprovada_v1.xlsx), com integridade controlada pelo manifesto [`docs/reference/excel-approved-v1.json`](../reference/excel-approved-v1.json).

## Contrato do relatório original

A função atual `exportDataExcel()` percorre, nesta ordem:

1. todas as escolas;
2. todas as competências configuradas;
3. todos os programas vinculados a cada escola.

Uma linha é exportada somente quando existe verificação para a combinação `escola + competência + programa` e `resultadoBonif` está preenchido. A granularidade original é:

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

## Estrutura aprovada do arquivo

A ordem das abas é fixa:

1. `BONIFICACOES` — base principal obrigatória;
2. `SINTESE` — análises derivadas opcionais;
3. `QUALIDADE_DADOS` — controle auxiliar opcional;
4. `METADADOS` — contrato, fonte e dicionário opcional.

Somente `BONIFICACOES` é indispensável. As demais abas podem ser removidas sem perda do relatório básico.

## Aba `BONIFICACOES`

A base oficial deverá:

- conservar o universo de linhas do relatório original;
- preservar a ordem de escolas, competências e programas;
- manter o formato legado `MM-AAAA` na coluna Competência;
- exibir `APTA` e `INAPTA` em texto, mesmo quando houver cor semântica;
- manter INEP, designação e competência como texto;
- disponibilizar filtros e ordenação;
- congelar as oito primeiras linhas e as três primeiras colunas;
- iniciar o cabeçalho da tabela na linha 8 e os dados na linha 9;
- não inserir gráficos ou resumos dentro da base principal.

### Larguras e alinhamentos aprovados

| Coluna | Campo | Largura | Alinhamento |
|---|---|---:|---|
| A | INEP | 12 | centralizado |
| B | Denominação | 34 | esquerda |
| C | Designação | 14 | centralizado |
| D | Competência | 13 | centralizado |
| E | Programa | 24 | esquerda |
| F | Conta corrente | 17 | centralizado |
| G | Investimento | 17 | centralizado |
| H | Nota fiscal | 17 | centralizado |
| I | Assessoria | 17 | centralizado |
| J | BB Ágil | 17 | centralizado |
| K | Encaminhado ao inventário | 20 | centralizado |
| L | Status da bonificação | 21 | centralizado |

## Aba `SINTESE`

A aba aprovada reúne, sem alterar a base:

- consolidadas, aptas, inaptas e taxa de aptidão por competência;
- consolidadas, aptas e inaptas por programa;
- indicadores gerais calculados sobre linhas consolidadas;
- gráfico simples por competência, quando útil.

A unidade estatística deve ser declarada como `escola × competência × programa`, não como escola única.

## Aba `QUALIDADE_DADOS`

A aba auxiliar deverá:

- localizar campos ausentes, vazios ou representados por traço;
- referenciar a linha correspondente da aba `BONIFICACOES`;
- considerar que a primeira linha de dados da base é a linha 9;
- ter finalidade de controle, sem reclassificar `APTA` ou `INAPTA`.

### Larguras e alinhamentos aprovados

| Campo | Largura | Alinhamento |
|---|---:|---|
| Linha na base | 17 | centralizado |
| INEP | 14 | centralizado |
| Designação | 16 | centralizado |
| Competência | 14 | centralizado |
| Programa | 26 | esquerda |
| Campos ausentes | 17 | centralizado |
| Detalhamento | 40 | esquerda |
| Situação | 15 | centralizado |

## Aba `METADADOS`

Deverá registrar:

- data e hora da geração;
- versão do modelo;
- regra de inclusão;
- granularidade;
- escopo temporal;
- estrutura aprovada das abas;
- dicionário dos doze campos;
- fonte dos dados.

Os conteúdos textuais permanecem alinhados à esquerda.

## Semântica visual

A paleta segue o sistema editorial, adaptada ao uso operacional:

- azul estrutural: títulos e estrutura;
- azul informacional: cabeçalhos;
- verde: situação positiva;
- vermelho: situação crítica;
- âmbar: atenção e revisão;
- roxo: análise e indicadores derivados;
- cinza: informação funcional e neutra.

A cor nunca substitui o texto. `APTA`, `INAPTA`, `Completa` e `Revisar` devem permanecer escritos.

## Teste de equivalência

O módulo mantém duas rotas lógicas separadas:

- `buildLegacyLogicalRows()`: espelho da rotina CSV atual;
- `buildBaseRows()`: modelo da futura aba `BONIFICACOES`.

O relatório de equivalência compara, linha a linha e coluna a coluna:

1. a quantidade de registros;
2. a ordem dos registros;
3. os doze valores lógicos;
4. a presença de consolidados;
5. a ausência de registros não consolidados.

Qualquer diferença deve bloquear a substituição do CSV.

## Regra de aceite para integração

A exportação `.xlsx` somente poderá substituir a atual quando:

1. o relatório de equivalência retornar `equivalent: true`;
2. todos os testes automatizados forem aprovados;
3. a prévia visual reproduzir a referência binária aprovada;
4. o CSV atual permanecer disponível até a validação final em produção;
5. o botão do site for alterado em PR separado, com possibilidade de reversão imediata.

## Oportunidades posteriores

Novas análises podem ser acrescentadas em abas opcionais, sempre com origem e regra documentadas:

- análise técnica por documento;
- pendências abertas e resolvidas;
- inventário e bens permanentes;
- carteira por controlador e região administrativa;
- trilha de auditoria da exportação.

Essas extensões não poderão modificar o conteúdo da aba `BONIFICACOES`.
