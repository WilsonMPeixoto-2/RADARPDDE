# Plano declarativo do workbook Excel

## Finalidade

O módulo `src/domain/excel-workbook-plan.js` transforma o modelo lógico aprovado da exportação em uma descrição completa e serializável do arquivo `.xlsx`, sem depender ainda de uma biblioteca específica de geração.

A separação possui três camadas:

1. `excel-export-model.js`: seleciona e organiza os dados, preservando a equivalência com o CSV;
2. `excel-workbook-plan.js`: define abas, intervalos, fórmulas, tabelas, estilos e funcionalidades;
3. renderizador XLSX futuro: converte o plano em arquivo binário para download.

## Bloqueio de segurança

O plano somente é produzido quando:

- o relatório de equivalência indica `equivalent: true`;
- a aba principal possui exatamente os 12 campos originais;
- o modelo contém a estrutura mínima esperada.

Assim, um renderizador não poderá gerar silenciosamente um arquivo que perdeu dados em relação ao CSV.

## Conteúdo do plano

### `BONIFICACOES`

- título e descrição;
- metadados da geração;
- cabeçalho na linha 8;
- primeira linha de dados na linha 9;
- congelamento das oito primeiras linhas e três primeiras colunas;
- tabela estruturada com os 12 campos;
- larguras e alinhamentos aprovados;
- formatação condicional para `APTA` e `INAPTA`.

### `SINTESE`

- quatro indicadores gerais;
- fórmulas referenciando o intervalo real da aba principal;
- análises por competência e programa;
- descrição do gráfico aprovado por competência.

### `QUALIDADE_DADOS`

- referência à linha correspondente da base;
- tabela estruturada e filtrável;
- larguras e alinhamentos aprovados;
- destaque para registros classificados como `Revisar`.

### `METADADOS`

- data da geração, fonte, versão e regras do relatório;
- dicionário dos 12 campos originais;
- indicação da origem e do significado de cada coluna.

## Independência do renderizador

O plano é composto somente por objetos, matrizes, textos, números e fórmulas serializáveis em JSON. Isso permite:

- testar a estrutura sem criar arquivos binários;
- comparar diferentes bibliotecas de geração XLSX;
- substituir o renderizador sem alterar as regras de dados;
- manter o botão atual em CSV até a validação final.

## Critério para a próxima etapa

O renderizador será aceito somente quando gerar um `.xlsx` que:

1. respeite integralmente o plano;
2. abra sem reparos no Excel;
3. preserve os 12 campos e todas as linhas consolidadas;
4. reproduza a estrutura visual aprovada;
5. mantenha o CSV disponível como alternativa durante a validação inicial.
