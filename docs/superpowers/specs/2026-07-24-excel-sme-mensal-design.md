# Excel SME mensal — especificação de design

## Objetivo

Adicionar um segundo botão de exportação, **Excel SME**, sem alterar o relatório Excel institucional já existente. O novo botão gera uma planilha `.xlsx` com uma única aba correspondente à competência mensal selecionada no RADAR PDDE.

## Comportamento

- O botão fica disponível somente quando `activeCompetenciaKey` estiver no formato `AAAA-MM`.
- Quando a competência estiver em `TODAS`, o botão permanece desabilitado e orienta o usuário a selecionar um mês.
- O arquivo é nomeado `RADAR_PDDE_EXCEL_SME_MM-AAAA.xlsx`.
- A única aba usa o nome do mês em português, por exemplo `JULHO`.
- Apenas dados da competência selecionada são incluídos.
- O Excel atual e o CSV legado permanecem inalterados e independentes.

## Conteúdo

A planilha preserva a organização visual essencial do modelo mensal recebido da SME:

- uma linha de cabeçalho;
- identificação da unidade nas quatro primeiras colunas;
- blocos documentais para PDDE Básico, PDDE Qualidade e PDDE Equidade;
- campos administrativos complementares ao final;
- cores, bordas, fontes, alinhamentos, larguras, alturas, autofiltro, congelamento de painéis e configuração de impressão semelhantes ao modelo.

Cada bloco de programa possui os seis campos documentais já existentes no RADAR:

1. Extrato Conta Corrente;
2. Extrato Investimento;
3. Notas Fiscais;
4. Consulta Assessoria;
5. Declaração BB Ágil;
6. Encaminhado para Inventariação.

Valores são normalizados para `SIM`, `NÃO` e `NÃO SE APLICA`. Campos que não são produzidos pelo RADAR, como datas de entrega ou correção, parecer e observações, permanecem em branco.

## Regra de inclusão

- A planilha lista as escolas disponíveis no estado atual, ordenadas por designação.
- Para cada escola, são preenchidos apenas programas vinculados e consolidados na competência selecionada.
- Programas fora do modelo SME mensal permanecem sem bloco próprio.
- Ausência de consolidação não impede a inclusão da escola; as células documentais correspondentes permanecem vazias.

## Arquitetura

A implementação usa um modelo mensal puro e um renderizador dedicado baseado em ExcelJS. O modelo resolve competência, escolas, programas e valores; o renderizador cuida exclusivamente da apresentação e da geração binária. A integração existente apenas adiciona o botão, controla seu estado e dispara o download.

O build da Vercel copia o bundle de navegador do ExcelJS para `dist/vendor/exceljs.min.js`. Em desenvolvimento local, o carregador usa o pacote instalado em `node_modules` como fallback.

## Tratamento de erros

A geração é bloqueada quando:

- a competência é `TODAS` ou inválida;
- ExcelJS não está disponível;
- não há escolas carregadas.

A interface informa o problema sem acionar o Excel institucional atual como fallback.

## Testes obrigatórios

- competência `TODAS` desabilita o botão;
- competência mensal habilita o botão;
- nome do arquivo e da aba correspondem à competência;
- somente a competência selecionada é lida;
- escolas são ordenadas por designação;
- valores documentais são normalizados;
- campos não disponíveis ficam em branco;
- workbook contém uma única aba, autofiltro, painéis congelados e configuração de impressão;
- o Excel institucional atual e o CSV legado mantêm seus contratos anteriores;
- o build público inclui `vendor/exceljs.min.js`.

## Fora de escopo

- reproduzir as 13 abas do arquivo original;
- preservar fórmulas ou relações entre abas;
- gerar consolidado anual;
- incorporar o arquivo-base original em Base64;
- validar hash ou estrutura interna do modelo recebido;
- preencher informações inexistentes no RADAR.
