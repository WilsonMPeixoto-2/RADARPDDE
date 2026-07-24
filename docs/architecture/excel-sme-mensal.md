# Exportação Excel SME mensal

## Finalidade

O botão **Excel SME** oferece um formato alternativo ao relatório institucional do RADAR PDDE. Ele gera uma planilha visualmente próxima ao modelo mensal recebido da SME, preenchida com os dados disponíveis no sistema para a competência selecionada.

A exportação não substitui nem modifica:

- **Gerar relatório Excel (.xlsx)** — relatório institucional de quatro abas;
- **CSV** — formato legado de segurança.

## Regra temporal

A geração exige que `activeCompetenciaKey` esteja no formato `AAAA-MM`.

- competência mensal: botão habilitado;
- `TODAS`: botão desabilitado;
- valor inválido: geração bloqueada.

O arquivo segue o padrão `RADAR_PDDE_EXCEL_SME_MM-AAAA.xlsx`, e a única aba recebe o nome do mês em português.

## Estrutura da aba

A aba possui 26 colunas:

1. número sequencial;
2. CRE;
3. designação;
4. unidade escolar;
5. seis campos documentais da Conta PDDE Básico;
6. seis campos documentais da Conta PDDE Qualidade;
7. seis campos documentais da Conta PDDE Equidade;
8. data de entrega;
9. data de correção;
10. parecer;
11. observações.

Os quatro campos administrativos finais permanecem vazios porque não possuem fonte canônica no RADAR.

## Mapeamento das contas

O banco registra programas e ações específicas, enquanto o modelo SME organiza os dados pelas três contas bancárias. O agrupamento adotado é:

| Conta SME | Programas do RADAR |
|---|---|
| PDDE Básico | `BASIC` |
| PDDE Qualidade | `CONECTADA`, `PROEC`, `ED_FAMILIA`, `ADOLESCENCIAS`, `LEITURA`, `TEMPO_APRENDER` |
| PDDE Equidade | `RECURSOS` |

O mapeamento acompanha a classificação das Ações Integradas do PDDE e preserva programas mantidos no sistema por possuírem saldos ou histórico operacional.

## Consolidação documental

Quando mais de um programa consolidado pertence à mesma conta no mesmo mês, cada campo documental é agregado com a seguinte precedência:

1. `NÃO`, quando ao menos um programa possui `Não`;
2. `SIM`, quando não existe `Não` e ao menos um programa possui `Sim`;
3. `NÃO SE APLICA`, quando todos os valores informados são `Não se aplica`;
4. vazio, quando não há programa consolidado ou valor informado.

Essa regra evita apresentar uma conta como regular quando uma das ações vinculadas possui ausência documental.

## Apresentação

O renderer ExcelJS cria diretamente uma única planilha com:

- cabeçalho em Arial, com grupos cromáticos por conta;
- bordas e linhas alternadas;
- larguras e alturas ajustadas;
- textos longos com quebra automática;
- validação de lista para `SIM`, `NÃO` e `NÃO SE APLICA`;
- autofiltro;
- quatro primeiras colunas e cabeçalho congelados;
- impressão em paisagem, ajustada à largura de uma página;
- cabeçalho e rodapé de impressão.

Não há fórmulas, relações entre abas ou consolidação anual.

## Runtime

- Node e testes usam `require('exceljs')`.
- O navegador carrega `/vendor/exceljs.min.js`.
- O build da Vercel copia `node_modules/exceljs/dist/exceljs.min.js` para `dist/vendor/exceljs.min.js`.
- O desenvolvimento local possui fallback para `/node_modules/exceljs/dist/exceljs.min.js`.

## Contratos protegidos

- o Excel institucional atual mantém suas quatro abas e sua lógica de equivalência;
- o CSV legado permanece acessível;
- o Excel SME não usa o CSV como fallback;
- nenhuma informação inexistente é inventada;
- todas as escolas carregadas são listadas, mesmo sem consolidação no mês, deixando os blocos correspondentes vazios.
