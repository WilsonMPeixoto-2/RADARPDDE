# Exportação Excel SME mensal

**Estado:** template canônico, renderer ExcelJS, integração, certificação e homologação desktop concluídos

**Atualizado em:** 1º de agosto de 2026

## 1. Finalidade

O botão **Excel SME** gera uma tradução fiel do modelo operacional recebido da SME, preenchida com os dados canônicos do RADAR para a competência selecionada.

O produto é distinto do relatório institucional:

- **Excel SME:** uma competência, uma aba, uma linha por unidade;
- **relatório institucional XLSX:** histórico, quatro abas, uma linha por escola × competência × programa consolidado;
- **CSV institucional:** formato legado preservado como botão secundário e fallback do relatório institucional.

O produto SME não substitui o relatório institucional nem o CSV de contingência.

## 2. Regra temporal

A geração exige `activeCompetenciaKey` em `YYYY-MM`.

- competência mensal válida: geração habilitada;
- `TODAS`: geração desabilitada;
- valor inexistente ou inválido: geração bloqueada.

Nome do arquivo:

```text
RADAR_PDDE_EXCEL_SME_MM-AAAA.xlsx
```

A única aba recebe o nome do mês em português.

## 3. Estrutura

A planilha possui 30 colunas:

1. número sequencial;
2. CRE;
3. designação;
4. unidade escolar;
5. seis campos documentais e `SISTEMÁTICA PREENCHIDA` da Conta PDDE Básico;
6. seis campos documentais e `SISTEMÁTICA PREENCHIDA` da Conta PDDE Qualidade;
7. seis campos documentais e `SISTEMÁTICA PREENCHIDA` da Conta PDDE Equidade;
8. `STATUS`;
9. data de entrega;
10. data de correção;
11. parecer;
12. observações.

Os quatro campos administrativos finais permanecem vazios quando não existe fonte canônica no RADAR. A exportação não inventa conteúdo.

## 4. Mapeamento das contas

| Conta SME | Programas do RADAR |
|---|---|
| PDDE Básico | `BASIC` |
| PDDE Qualidade | `CONECTADA`, `PROEC`, `ED_FAMILIA`, `ADOLESCENCIAS`, `LEITURA`, `TEMPO_APRENDER` |
| PDDE Equidade | `RECURSOS` |

O agrupamento preserva ações com saldo ou histórico operacional existentes no sistema.

## 5. Consolidação documental

Quando mais de um programa consolidado pertence à mesma conta no mesmo mês, cada campo documental segue:

1. `NÃO`, quando ao menos um programa possui `Não`;
2. `SIM`, quando não existe `Não` e ao menos um programa possui `Sim`;
3. `NÃO SE APLICA`, quando todos os valores informados são `Não se aplica`;
4. vazio, quando não existe consolidação ou valor informado.

Essa regra evita apresentar uma conta como regular quando uma ação vinculada possui ausência documental.

## 6. Apresentação

O renderer usa ExcelJS 4.4.0 e o template canônico `assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx` para criar uma única planilha com:

- 30 cabeçalhos literais do documento original;
- mesclagem `A1:B1`, estilos, bordas, larguras e alturas preservados;
- textos descritivos alinhados à esquerda com recuo leve;
- valores categóricos centralizados;
- alinhamento vertical e quebra automática coerentes em todas as células;
- autofiltro e painel congelado em `E2`;
- impressão em paisagem ajustada à largura;
- uma única aba, nomeada pelo mês da competência ativa.

### Ausência deliberada de validação de lista

O arquivo **não contém** `dataValidations`.

A validação de lista para `SIM`, `NÃO` e `NÃO SE APLICA` foi removida porque a estrutura provocava reparo no Microsoft Excel. A ausência desse elemento é verificada pela certificação automatizada e não deve ser reintroduzida sem nova implementação OOXML, abertura manual sem reparo e atualização dos testes.

Os valores exportados continuam textos estáticos derivados do modelo canônico.

## 7. Integração de runtime

`src/integration/excel-export-integration.js` insere o botão `Excel SME` entre o botão principal do relatório institucional e o botão secundário `CSV`.

A integração:

- habilita o botão apenas para competência mensal;
- atualiza estado e `aria-disabled` quando a competência muda;
- impede clique concorrente durante a geração;
- registra o evento de exportação;
- mantém o botão idempotente em renderizações tardias;
- não altera o escopo histórico do relatório institucional.

## 8. Certificação

A certificação integral compara:

```text
competência ativa
→ modelo SME
→ colunas e linhas
→ pacote OOXML
→ endereço e valor de cada célula
→ hash de conteúdo
```

Critérios específicos:

- uma única competência;
- uma única aba;
- 30 colunas;
- quantidade de escolas igual à massa de entrada;
- células do cabeçalho e dos dados sem divergência;
- ausência de `dataValidations`;
- alteração em outra competência sem impacto no `contentHash`.

Evidência: [`../evidence/excel-certification/synthetic-manifest.json`](../evidence/excel-certification/synthetic-manifest.json).

## 9. Limites

A certificação automatizada:

- usa massa sintética;
- não consulta Production;
- não grava no Supabase;
- não comprova abertura manual no Microsoft Excel desktop.

O candidato correspondente à implementação funcional integrada pelo PR #117 foi aberto no Microsoft Excel desktop sem aviso de reparo, exibiu o conteúdo e teve os alinhamentos revisados. Essa evidência cumpre o gate manual específico do Excel SME; o relatório institucional mantém homologação própria.

## 10. Contratos protegidos

- competência mensal única;
- uma linha por unidade escolar;
- 30 colunas literais do template canônico;
- três agrupamentos de conta;
- nenhuma informação inventada;
- ausência de `dataValidations`;
- isolamento temporal;
- nome da aba, nome do arquivo e dados vinculados à competência ativa;
- independência do relatório institucional e do CSV de fallback.

## 11. Referências

- [`excel-integral-certification.md`](excel-integral-certification.md);
- [`excel-export.md`](excel-export.md);
- [`excel-xlsx-runtime.md`](excel-xlsx-runtime.md);
- [`avaliacao-mensal.md`](avaliacao-mensal.md);
- [`../evidence/releases/2026-08-01-excel-sme-production.json`](../evidence/releases/2026-08-01-excel-sme-production.json);
- [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md).
