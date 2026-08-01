# Integração runtime das exportações Excel

**Estado:** vigente e implementado  
**Atualizado em:** 1º de agosto de 2026

## 1. Objetivo

Ativar no aplicativo os dois produtos `.xlsx` sem modificar o núcleo monolítico `app.js`, preservando o CSV legado como contingência e mantendo instalação reversível.

## 2. Encadeamento

`src/integration/load-excel-export.js` carrega sequencialmente:

1. `excel-export-model.js` — universo institucional e equivalência com o CSV;
2. `excel-workbook-plan.js` — plano declarativo do workbook institucional;
3. `excel-xlsx-renderer.js` — pacote Office Open XML institucional;
4. `excel-sme-export-model.js` — modelo mensal SME;
5. `excel-sme-template-renderer.js` — aplicação do template canônico por ExcelJS;
6. `excel-sme-monthly-renderer.js` — adaptador estável para o renderer do template;
7. `excel-sme-runtime-loader.js` — ExcelJS e template carregados sob demanda;
8. `excel-export-integration.js` — integração dos botões e fallback.

O loader é acionado por `config.js` após o evento `load`. Seus filhos usam ordem sequencial e `async = false`.

## 3. Comportamento institucional

Na instalação:

1. a função global legada `exportDataExcel()` é capturada;
2. a função legada fica disponível por `exportDataCsvLegacy()`;
3. `exportDataExcel()` passa a apontar para o gerador institucional XLSX;
4. o botão principal é configurado como **Gerar relatório Excel (.xlsx)**;
5. o workbook contém:
   - `BONIFICACOES`;
   - `SINTESE`;
   - `QUALIDADE_DADOS`;
   - `METADADOS`;
6. um botão secundário **CSV** é inserido como exportação legada e fallback.

O relatório institucional permanece histórico e não é limitado pela competência ativa.

## 4. Comportamento do Excel SME

A integração insere um botão **Excel SME** entre o botão principal e o CSV.

O botão:

- exige competência mensal `YYYY-MM`;
- fica desabilitado em `TODAS` ou valor inválido;
- atualiza `aria-disabled`, título e competência associada;
- impede múltiplas gerações simultâneas;
- gera arquivo mensal de uma aba e 30 colunas, com nome, aba e dados derivados da competência ativa;
- carrega ExcelJS 4.4.0 e o template canônico somente após o acionamento do botão;
- registra o evento de exportação.

## 5. Barreiras de segurança

### Institucional

A geração é interrompida quando:

- não há registros consolidados;
- a equivalência com o CSV não foi comprovada;
- o modelo não contém os doze campos originais;
- qualquer dependência não foi carregada.

Em falha técnica, a interface pode oferecer o CSV legado.

### SME

A geração é interrompida quando:

- não há competência mensal válida;
- modelo ou renderer não foram carregados;
- o contrato mensal é inválido.

Não existe fallback CSV para o produto SME porque ele possui granularidade e estrutura distintas.

## 6. Renderização OOXML

O renderer institucional produz diretamente:

- quatro planilhas;
- estilos e formatação numérica;
- mesclagens;
- congelamento de painéis;
- tabelas e autofiltros;
- formatação condicional;
- fórmulas com valores em cache;
- gráfico da síntese;
- metadados do arquivo.

O renderer SME aplica os dados canônicos ao template oficial de 30 colunas, preserva sua apresentação e não inclui `dataValidations`.

Não há dependência de CDN no runtime. O bundle versionado de ExcelJS e o template residem no próprio artefato da aplicação.

## 7. Idempotência

A instalação:

- usa flag interna para impedir repetição;
- evita duplicar botões por `dataset`;
- observa mutações do DOM para renderizações tardias;
- reage a mudança de competência;
- preserva uma única função legada capturada;
- fornece fluxo de `uninstall()` para restaurar `exportDataExcel`.

## 8. Auditoria

Exports bem-sucedidos registram log funcional com nome do arquivo, escopo e quantidade de registros/unidades, sem conteúdo sensível.

A geração não grava dados de negócio no Supabase.

## 9. Certificação

A integração depende dos contratos certificados em:

- [`excel-export.md`](excel-export.md);
- [`excel-sme-mensal.md`](excel-sme-mensal.md);
- [`excel-integral-certification.md`](excel-integral-certification.md).

A certificação automatizada não substitui abertura manual no Microsoft Excel desktop. A implementação funcional do Excel SME integrada pelo PR #117 já passou por essa homologação; o produto institucional mantém gate separado.

## 10. Reversão

A integração pode ser revertida por:

- remoção controlada do bootstrap Excel em novo build;
- desinstalação da integração no ambiente de teste;
- restauração da função legada preservada.

O `app.js` não foi reescrito para acomodar o XLSX, reduzindo o impacto do rollback.

## 11. Gates de liberação ainda pendentes

Antes da liberação oficial:

- abrir o institucional no Microsoft Excel desktop sem reparo;
- confirmar o botão CSV e o fallback;
- validar downloads nos perfis autorizados;
- registrar evidência e UAT.
