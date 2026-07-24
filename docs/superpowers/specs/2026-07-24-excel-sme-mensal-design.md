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

A planilha preserva a organização visual essencial do modelo mensal recebido da SME: identificação da unidade nas quatro primeiras colunas; blocos documentais para PDDE Básico, PDDE Qualidade e PDDE Equidade; campos administrativos complementares ao final; cores, bordas, fontes, alinhamentos, larguras, alturas, autofiltro, congelamento de painéis e configuração de impressão semelhantes ao modelo.

Cada bloco de conta possui os seis campos documentais já existentes no RADAR: Extrato Conta Corrente, Extrato Investimento, Notas Fiscais, Consulta Assessoria, Declaração BB Ágil e Encaminhado para Inventariação. Valores são normalizados para `SIM`, `NÃO` e `NÃO SE APLICA`. Campos que não são produzidos pelo RADAR permanecem em branco.

## Regra de inclusão

- A planilha lista as escolas disponíveis no estado atual, ordenadas por designação.
- Os programas reais são agrupados nas contas Básico, Qualidade e Equidade.
- Para cada escola, são preenchidos apenas programas vinculados e consolidados na competência selecionada.
- Ausência de consolidação não impede a inclusão da escola; as células documentais correspondentes permanecem vazias.
- Quando mais de um programa alimenta a mesma conta, `NÃO` prevalece sobre `SIM`, e `SIM` prevalece sobre `NÃO SE APLICA`.

## Arquitetura

Um módulo de domínio monta o modelo mensal. Um renderizador dedicado reutiliza o motor OOXML/ZIP já empregado e auditado pelo Excel institucional do RADAR, criando a única aba sem biblioteca ou bundle adicional. A integração existente apenas adiciona o botão, controla seu estado e dispara o download.

## Tratamento de erros

A geração é bloqueada quando a competência é `TODAS` ou inválida, o motor XLSX institucional não está disponível ou não há escolas carregadas. A interface informa o problema sem acionar o Excel institucional atual como fallback.

## Testes obrigatórios

- botão desabilitado em `TODAS` e habilitado em mês válido;
- nome correto do arquivo e da aba;
- apenas a competência selecionada;
- escolas ordenadas por designação;
- programas distribuídos nas contas corretas;
- valores normalizados e campos indisponíveis em branco;
- pacote XLSX com uma aba, autofiltro, painéis congelados, validações e impressão;
- regressão protegida para Excel atual e CSV;
- nenhuma dependência ou artefato externo adicional.

## Fora de escopo

- reproduzir 13 abas;
- preservar fórmulas ou relações entre abas;
- gerar consolidado anual;
- incorporar o workbook original em Base64;
- preencher informações inexistentes no RADAR.
