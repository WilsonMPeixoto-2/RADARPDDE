# Integração runtime da exportação XLSX

## Objetivo

Ativar no aplicativo a geração do workbook `.xlsx` aprovado sem modificar o arquivo monolítico `app.js` e sem remover a exportação CSV existente.

## Encadeamento

A integração é carregada após a aplicação principal e utiliza quatro camadas:

1. `excel-export-model.js` — seleciona os registros e comprova equivalência com o CSV;
2. `excel-workbook-plan.js` — descreve o workbook aprovado;
3. `excel-xlsx-renderer.js` — produz diretamente o pacote Office Open XML;
4. `excel-export-integration.js` — conecta o gerador ao botão e mantém o CSV legado.

O carregamento sequencial é feito por `load-excel-export.js`, acionado pelo bootstrap mínimo de `config.js`.

## Comportamento do botão

A função global existente `exportDataExcel()` é preservada como `exportDataCsvLegacy()` e substituída, em tempo de execução, pela geração do novo `.xlsx`.

O botão principal passa a gerar:

- `BONIFICACOES`;
- `SINTESE`;
- `QUALIDADE_DADOS`;
- `METADADOS`.

Um botão secundário `CSV` é inserido ao lado da ação principal sempre que o elemento de exportação estiver visível.

## Barreiras de segurança

A geração é interrompida quando:

- não há registros consolidados;
- a equivalência com o CSV não foi comprovada;
- o modelo não contém os doze campos originais;
- qualquer camada necessária não foi carregada.

Em falhas técnicas, o usuário recebe a opção de baixar o CSV legado.

## Renderização

O arquivo é produzido sem dependência externa, diretamente como pacote Office Open XML. O renderizador inclui:

- quatro planilhas;
- estilos e formatação numérica;
- mesclagens;
- congelamento de painéis;
- tabelas e autofiltros;
- formatação condicional;
- fórmulas com valores em cache;
- gráfico da síntese;
- metadados do arquivo.

## Reversão

A integração pode ser revertida removendo o bootstrap de `config.js`. O `app.js` e sua função original permanecem sem alterações, reduzindo o impacto de rollback.
