# Certificação integral dos relatórios Excel

**Estado:** vigente para estrutura/conteúdo; política temporal atualizada em 05/09/2026  
**Atualizado em:** 5 de setembro de 2026

> A certificação estrutural não substitui teste de composição pelo botão real nem prova a ordem de auditoria pré-download.

## 1. Finalidade

A certificação comprova contratos desde o estado de origem até o OOXML:

```text
estado de origem
→ regra mensal canônica
→ modelo lógico
→ workbook
→ reabertura
→ OOXML
→ células, estilos e hashes
```

## 2. Produtos e política temporal

### XLSX institucional

Contrato atual do ponto de entrada real:

- competência global ativa;
- linha por escola × competência ativa × programa consolidado;
- abas `BONIFICACOES`, `SINTESE`, `QUALIDADE_DADOS` e `METADADOS`;
- doze campos principais.

A descrição anterior “histórico multicompetência / independente da competência global” está **superada** pela decisão posterior de 09/08/2026.

O modelo interno pode continuar capaz de receber várias competências sem definir a política da UI.

### Excel SME mensal

- uma competência por arquivo;
- uma linha por unidade escolar;
- uma aba mensal;
- 27 colunas A:AA;
- template-fonte de 30 colunas com remoção validada de K, R e Y;
- ausência deliberada de `dataValidations` incompatíveis.

### CSV

Não declarar equivalência temporal com o XLSX institucional até o contrato do CSV ser deliberadamente reconciliado.

## 3. Certificação institucional

O módulo confronta `evaluateMonthlyEvaluation()` e percorre:

```text
buildExportModel
→ escopo da competência ativa no ponto de entrada
→ createWorkbookPlan
→ worksheets
→ XML
```

Teste de certificação com uma única competência não é suficiente para proteger escopo temporal. Deve existir cenário com pelo menos duas competências em que apenas a ativa apareça no produto institucional atual.

## 4. Certificação do Excel SME

Percurso:

```text
buildSmeMonthlyModel
→ template-fonte
→ validação K/R/Y
→ remoção das três posições
→ workbook 27 colunas
→ serialização
→ reabertura ExcelJS
→ inspeção OOXML
```

Provar:

- exatamente 27 colunas;
- A:AA;
- ausência de `SISTEMÁTICA PREENCHIDA`;
- cabeçalhos/valores canônicos;
- designação textual;
- bordas, cabeçalho, wrap, altura, mesclagem, congelamento e impressão vigentes;
- ausência de linhas/colunas ocultas, fórmulas ou validações introduzidas.

## 5. Integridade OOXML

Continuam obrigatórios:

- `[Content_Types].xml`;
- `_rels/.rels`;
- `xl/workbook.xml`;
- relações do workbook;
- `xl/styles.xml`;
- worksheet esperada;
- assinatura ZIP válida e não substituição por HTML.

## 6. Isolamento temporal

### Institucional

Somente a competência global ativa deve participar do produto corrente. Alteração em outra competência não deve modificar o conteúdo exportado pelo botão institucional.

### SME

Somente a competência mensal selecionada participa. Alteração fora dela não deve modificar o `contentHash`.

### CSV

Definir antes de certificar; não herdar automaticamente a regra institucional nem a regra histórica.

## 7. Hashes e evidência sintética

`structuralHash`, `contentHash` e `manifestHash` permanecem mecanismos válidos de reprodutibilidade. Evidências sintéticas não devem conter PII nem dados de Production.

## 8. Limite importante revelado pela auditoria adversarial

Uma certificação de workbook pode estar integralmente verde enquanto o **botão real** contorna a autoridade de auditoria antes do download.

Portanto, fechamento da família Excel exige duas classes de prova separadas:

1. **produto gerado correto**: modelo/workbook/OOXML/hash;
2. **composição operacional correta**: gesto real → auditoria inicial → download somente após confirmação.

O P1 atual do Excel SME está na segunda classe e não é invalidado pela certificação do arquivo.

## 9. Referências

- [`excel-export.md`](excel-export.md);
- [`excel-sme-mensal.md`](excel-sme-mensal.md);
- [`excel-xlsx-runtime.md`](excel-xlsx-runtime.md);
- [`adversarial-analysis-and-implementation-method.md`](adversarial-analysis-and-implementation-method.md);
- [`../audits/2026-09-05-astra-adversarial-findings.md`](../audits/2026-09-05-astra-adversarial-findings.md).
