# Certificação integral dos relatórios Excel

**Atualizado em:** 1º de agosto de 2026

## 1. Finalidade

A certificação integral comprova que os relatórios Excel do RADAR PDDE preservam seus contratos funcionais desde o estado de origem até o valor efetivamente gravado em cada célula do pacote OOXML.

A certificação não substitui os modelos nem os renderers. Ela os executa como consumidores reais e verifica:

```text
estado de origem
→ evaluateMonthlyEvaluation
→ modelo lógico
→ plano do workbook, quando aplicável
→ entradas do pacote OOXML
→ endereço e valor da célula
→ manifesto com hashes
```

## 2. Produtos certificados

### 2.1 Relatório institucional

Contrato preservado:

- histórico e multicompetência;
- uma linha por escola, competência e programa consolidado;
- equivalência integral com o CSV legado;
- quatro abas, nesta ordem:
  1. `BONIFICACOES`;
  2. `SINTESE`;
  3. `QUALIDADE_DADOS`;
  4. `METADADOS`;
- doze campos originais mantidos na aba principal;
- primeira linha de dados em `9`;
- escopo temporal deliberadamente independente da competência ativa.

### 2.2 Excel SME mensal

Contrato preservado:

- uma única competência por arquivo;
- todas as unidades escolares no escopo da Gestão SME;
- uma linha por unidade;
- 30 colunas literais do template canônico;
- agrupamentos PDDE Básico, Qualidade e Equidade;
- uma planilha com o nome do mês;
- cabeçalho na linha `1` e dados a partir da linha `2`;
- ausência de `dataValidations`, pois o recurso provocava reparo no Microsoft Excel.

Os dois produtos não são intercambiáveis. O relatório institucional é histórico; o Excel SME é mensal.

## 3. Módulo de certificação

O módulo Node:

```javascript
src/domain/excel-integral-certification.js
```

expõe:

```javascript
certifyExcelProducts(input)
```

O resultado contém:

```javascript
{
  version,
  generatedAt,
  passed,
  canonicalResults,
  products: {
    institutional,
    smeMonthly
  },
  manifestHash
}
```

A certificação é somente leitura e não é carregada no bundle do navegador.

## 4. Auditoria da regra canônica

Para cada verificação consolidada, o módulo executa:

```javascript
evaluateMonthlyEvaluation({
  bonification,
  analysis,
  pendencies
})
```

O valor armazenado em `resultadoBonif` deve ser igual a `bonusResult`.

Divergência gera:

```text
STORED_RESULT_DIFFERS_FROM_CANONICAL
```

O contexto não inclui o identificador real da escola. Ele é representado por:

```text
SHA-256(escola | competência | programa), truncado para 16 caracteres
```

Uma divergência canônica bloqueia todos os produtos que incluam o contexto afetado.

## 5. Certificação célula a célula

### 5.1 Extração

Para o produto institucional, o módulo usa as entradas produzidas pelo próprio renderer:

- `RadarExcelXlsxRenderer.buildPackageEntries()`;

A planilha XML institucional é lida diretamente. Células `inlineStr` e numéricas são normalizadas sem biblioteca paralela de planilhas.

Para o Excel SME, a certificação do manifesto valida o contrato lógico de 30 colunas, cabeçalhos literais, posições das três sistemáticas, `STATUS`, quatro campos administrativos e isolamento temporal. Os testes do renderer carregam o template, executam o round-trip pelo ExcelJS e verificam a planilha resultante, incluindo estilos, alinhamentos, filtro, congelamento e impressão.

### 5.2 Comparação institucional

Os valores esperados vêm de:

```text
buildExportModel
→ createWorkbookPlan
→ plan.sheets[0].table.rows
```

Cada valor é comparado com seu endereço correspondente, começando por `A9`.

### 5.3 Comparação SME

Os valores esperados vêm de:

```text
buildSmeMonthlyModel
→ model.columns + model.rows
```

O cabeçalho lógico é comparado na linha `1`; os dados, a partir de `A2`. A igualdade com o template canônico e com o workbook gerado é protegida pelos testes do renderer e de compatibilidade Office.

Qualquer célula ausente ou divergente gera:

- `CELL_MISSING`;
- `CELL_VALUE_MISMATCH`.

## 6. Integridade OOXML

A certificação exige as entradas estruturais:

- `[Content_Types].xml`;
- `_rels/.rels`;
- `xl/workbook.xml`;
- `xl/_rels/workbook.xml.rels`;
- `xl/styles.xml`.

Também verifica, conforme o produto:

- quantidade de worksheets;
- ausência de `<dataValidations>`;
- integridade estrutural dos XMLs relevantes;
- correspondência entre escopo e número de abas.

O hash estrutural exclui `docProps/core.xml`, porque esse arquivo contém timestamps de criação que não alteram o conteúdo operacional do relatório.

## 7. Escopo temporal

### Institucional

As competências são obtidas das linhas consolidadas do relatório, na ordem do modelo. Alterar uma competência histórica deve alterar seu `contentHash`.

### SME

Somente `activeCompetenciaKey` participa do modelo. Alterar uma competência diferente não pode modificar o `contentHash` do Excel SME.

Esse isolamento possui teste próprio.

## 8. Hashes e determinismo

São produzidos:

- `structuralHash`: conteúdo estrutural do pacote OOXML;
- `contentHash`: modelo lógico mais worksheet efetiva;
- `manifestHash`: todo o relatório de certificação, exceto o próprio hash.

Os hashes usam SHA-256.

Objetos são serializados com chaves em ordem determinística. A mesma massa, data e versões de código devem produzir o mesmo manifesto.

Alteração em uma célula deve alterar o `contentHash` do produto correspondente.

## 9. Proteção de dados

A evidência versionada utiliza massa sintética.

O manifesto não contém:

- nome de diretor;
- telefone;
- e-mail;
- CPF;
- CNPJ;
- identificador interno real da escola;
- nome de unidade escolar real.

Contextos divergentes usam hash. Amostras de células se limitam a valores sintéticos de controle.

## 10. Gerador de evidência

O script:

```text
scripts/generate-excel-certification-evidence.mjs
```

pode:

- gerar o manifesto versionável;
- imprimir o manifesto em uma única linha para diagnóstico de CI;
- comparar a regeneração com uma evidência existente por `--check`;
- falhar quando qualquer produto não for certificado.

Comandos:

```bash
npm run certify:excel:fixture
node scripts/generate-excel-certification-evidence.mjs
node scripts/generate-excel-certification-evidence.mjs --check
```

## 11. Critério de aprovação

`passed` somente é verdadeiro quando:

1. nenhum resultado armazenado diverge da regra canônica;
2. a equivalência institucional com o CSV é verdadeira;
3. todas as células institucionais conferem;
4. todas as células SME conferem;
5. o relatório institucional mantém o escopo histórico;
6. o Excel SME permanece restrito à competência ativa;
7. a quantidade de escolas SME corresponde à massa de entrada;
8. as entradas OOXML obrigatórias existem;
9. a quantidade de abas está correta;
10. não existem `dataValidations`;
11. o manifesto é determinístico.

## 12. Limites e homologação manual

A certificação não:

- consulta diretamente Production;
- grava dados no Supabase;
- declara que o arquivo foi aberto manualmente no Microsoft Excel desktop.

O candidato correspondente à implementação funcional integrada pelo PR #117 foi aberto manualmente no Microsoft Excel desktop sem reparo, com conteúdo visível e alinhamentos revisados. Essa evidência é externa à certificação automatizada. O relatório institucional e o CSV mantêm contratos e gates próprios.
