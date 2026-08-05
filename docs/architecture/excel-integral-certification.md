# Certificação integral dos relatórios Excel

**Atualizado em:** 5 de agosto de 2026

## 1. Finalidade

A certificação comprova os contratos funcionais desde o estado de origem até as células e estruturas efetivamente gravadas no pacote OOXML.

```text
estado de origem
→ regra mensal canônica
→ modelo lógico
→ workbook
→ reabertura
→ OOXML
→ células, estilos e hashes
```

## 2. Produtos

### Relatório institucional

- histórico multicompetência;
- linha por escola, competência e programa consolidado;
- equivalência com CSV;
- abas `BONIFICACOES`, `SINTESE`, `QUALIDADE_DADOS` e `METADADOS`;
- doze campos originais na aba principal;
- primeira linha de dados em 9;
- escopo independente da competência global ativa.

### Excel SME mensal

- uma competência por arquivo;
- uma linha por unidade escolar;
- uma aba com o nome do mês;
- **27 colunas A:AA**;
- cabeçalho na linha 1;
- dados a partir da linha 2;
- grupos Básico, Qualidade e Equidade com seis documentos cada;
- `STATUS` e campos administrativos finais;
- ausência deliberada de `dataValidations` incompatíveis.

O template-fonte possui 30 colunas. As posições K, R e Y são removidas de forma validada antes da certificação do produto público.

## 3. Módulo

```text
src/domain/excel-integral-certification.js
scripts/generate-excel-certification-evidence.mjs
```

O resultado inclui versão, data, aprovação, resultados canônicos, produtos e `manifestHash`.

A certificação é somente leitura e não é carregada no bundle do navegador.

## 4. Regra canônica

Cada verificação consolidada é confrontada com `evaluateMonthlyEvaluation()`. Divergência entre o resultado armazenado e o derivado gera bloqueio.

Contextos da evidência usam identificadores sintéticos ou hash; não incluem dados reais de escola ou servidor.

## 5. Certificação institucional

O módulo usa as entradas do próprio renderer e compara:

```text
buildExportModel
→ createWorkbookPlan
→ plan.sheets
→ XML das planilhas
```

Células `inlineStr`, numéricas, fórmulas e valores em cache são normalizados conforme o contrato.

## 6. Certificação do Excel SME

Percurso:

```text
buildSmeMonthlyModel
→ template-fonte
→ validação de K/R/Y
→ remoção das três posições
→ workbook de 27 colunas
→ serialização
→ reabertura pelo ExcelJS
→ inspeção OOXML
```

Verificações:

- exatamente 27 colunas;
- intervalo final A:AA;
- ausência de `SISTEMÁTICA PREENCHIDA`;
- cabeçalhos canônicos;
- valores das linhas;
- designação armazenada como texto no padrão `XX.XX.XXX`;
- bordas nos quatro lados;
- cabeçalho centralizado horizontal e verticalmente;
- `wrapText = true` e recuo zero;
- altura 105;
- mesclagem `A1:B1`;
- congelamento `E2`;
- filtro e área de impressão limitados ao conjunto exportado;
- nenhuma linha ou coluna oculta introduzida;
- nenhuma fórmula ou validação adicionada pelo renderer.

## 7. Integridade OOXML

Entradas obrigatórias:

- `[Content_Types].xml`;
- `_rels/.rels`;
- `xl/workbook.xml`;
- `xl/_rels/workbook.xml.rels`;
- `xl/styles.xml`;
- worksheet esperada de cada produto.

Também são verificadas:

- quantidade de abas;
- relações internas;
- ausência de `<dataValidations>` no SME;
- ordem e estrutura válidas de propriedades da planilha;
- assinatura ZIP e não substituição por HTML.

## 8. Isolamento temporal

### Institucional

Alteração em competência histórica incluída modifica o `contentHash`.

### SME

Somente a competência mensal selecionada participa do modelo. Alteração fora dela não pode modificar o `contentHash` do arquivo.

## 9. Hashes

- `structuralHash` — estrutura relevante do OOXML;
- `contentHash` — conteúdo lógico e worksheet;
- `manifestHash` — relatório de certificação.

Objetos são serializados de forma determinística. Timestamps não operacionais são excluídos do hash estrutural quando necessário.

## 10. Evidência sintética

O manifesto não contém:

- nomes reais;
- telefones;
- e-mails;
- CNPJ;
- identificador real de escola;
- dados de Production.

Comandos:

```bash
npm run certify:excel:fixture
node scripts/generate-excel-certification-evidence.mjs
node scripts/generate-excel-certification-evidence.mjs --check
```

## 11. Certificação do deployment

A disponibilidade do Excel SME exige ainda:

- `excel-sme-assets.json` no artefato;
- template e ExcelJS com tamanho e SHA esperados;
- HTTP válido para os assets;
- botão real concluindo o download;
- workbook reaberto e inspecionado;
- commit publicado correspondente ao manifesto.

Essa camada evita repetir o incidente em que o código existia, mas o template não estava corretamente disponível em Production.

## 12. Critério de aprovação

`passed` exige:

1. regra mensal canônica sem divergência;
2. equivalência institucional com CSV;
3. células institucionais corretas;
4. Excel SME com 27 colunas corretas;
5. isolamento temporal;
6. quantidade correta de unidades;
7. OOXML obrigatório e válido;
8. designação textual;
9. grade e cabeçalho corretos;
10. ausência de `dataValidations`;
11. manifesto determinístico;
12. assets do deployment disponíveis quando a prova é de Production.

## 13. Homologação humana

A versão atual do Excel SME, após os PRs nº 136 e 137, foi aberta no Microsoft Excel desktop sem solicitação de reparo e teve alinhamento visual aprovado.

A certificação automatizada não substitui essa abertura quando estrutura ou estilos materiais forem alterados novamente. O relatório institucional mantém homologação própria.
