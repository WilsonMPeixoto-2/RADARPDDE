# Exportação Excel SME mensal

**Estado:** contrato público de 27 colunas, renderer ExcelJS, integração, certificação e homologação automatizada protegidos por testes

**Atualizado em:** 4 de agosto de 2026

## 1. Finalidade

O botão **Excel SME** gera uma tradução do modelo operacional da SME com os dados canônicos do RADAR para uma única competência mensal.

O produto é independente do relatório institucional:

- **Excel SME:** uma competência, uma aba e uma linha por unidade escolar;
- **relatório institucional XLSX:** histórico, quatro abas e uma linha por escola × competência × programa consolidado;
- **CSV institucional:** formato legado preservado como contingência do relatório institucional.

## 2. Regra temporal

A geração exige `activeCompetenciaKey` no formato `YYYY-MM`.

- competência mensal válida: geração habilitada;
- `TODAS`: geração desabilitada;
- valor inexistente, inválido ou divergente da interface: geração bloqueada.

O arquivo segue o padrão:

```text
RADAR_PDDE_EXCEL_SME_MM-AAAA.xlsx
```

A única aba recebe o nome do mês em português.

## 3. Contrato público de 27 colunas

A planilha exportada ocupa **A:AA**:

| Intervalo | Conteúdo |
|---|---|
| A:D | sequência, CRE, designação e unidade escolar |
| E:J | seis documentos da Conta PDDE Básico |
| K:P | seis documentos da Conta PDDE Qualidade |
| Q:V | seis documentos da Conta PDDE Equidade |
| W | `STATUS` |
| X | data da entrega de documentos |
| Y | data da correção dos documentos enviados |
| Z | parecer |
| AA | observações |

As colunas técnicas `SISTEMÁTICA PREENCHIDA`, anteriormente presentes nas posições-fonte **K, R e Y**, não pertencem ao arquivo original destinado ao usuário e são eliminadas antes da geração final.

Os campos administrativos posteriores permanecem integralmente preservados. Após a remoção física das três colunas técnicas, os campos originalmente posteriores deslocam-se para W:AA; nenhum deles é descartado.

Os quatro campos administrativos finais permanecem vazios quando não existe fonte canônica no RADAR. A exportação não inventa conteúdo.

## 4. Projeção do template-fonte

O template versionado `assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx` ainda possui 30 colunas. O renderer não o publica diretamente.

Antes de validar ou preencher a planilha, `src/domain/excel-sme-template-renderer.js` executa uma projeção determinística:

1. valida que as posições 25, 18 e 11 contêm exatamente `SISTEMÁTICA PREENCHIDA`;
2. remove essas colunas em ordem decrescente, equivalentes a Y, R e K no template-fonte;
3. valida os 27 cabeçalhos restantes contra o contrato canônico;
4. reconstrói as linhas usando o cadastro e o estado atual do RADAR;
5. limita filtro, impressão, bordas e estilos ao intervalo final A:AA.

A validação posicional impede que uma mudança silenciosa no template remova outra coluna por engano.

## 5. Mapeamento das contas

| Conta SME | Programas do RADAR |
|---|---|
| PDDE Básico | `BASIC` |
| PDDE Qualidade | `CONECTADA`, `PROEC`, `ED_FAMILIA`, `ADOLESCENCIAS`, `LEITURA`, `TEMPO_APRENDER` |
| PDDE Equidade | `RECURSOS` |

O agrupamento preserva ações com saldo ou histórico operacional existentes no sistema.

## 6. Consolidação documental

Quando mais de um programa consolidado pertence à mesma conta no mesmo mês, cada campo documental segue:

1. `NÃO`, quando ao menos um programa possui `Não`;
2. `SIM`, quando não existe `Não` e ao menos um programa possui `Sim`;
3. `NÃO SE APLICA`, quando todos os valores informados são `Não se aplica`;
4. vazio, quando não existe consolidação ou valor informado.

Essa regra evita apresentar uma conta como regular quando uma ação vinculada possui ausência documental.

## 7. Apresentação e compatibilidade

O renderer usa ExcelJS 4.4.0 e produz uma planilha com:

- 27 cabeçalhos literais do contrato público;
- mesclagem `A1:B1`;
- borda fina completa em todas as células de A1:AA até a última linha exportada;
- designação gravada como **texto** com formato `@`, evitando interpretação decimal e exibição com `,000`;
- unidade escolar, parecer e observações alinhados à esquerda, com quebra automática e recuo leve;
- valores categóricos centralizados;
- painel congelado em `E2`;
- autofiltro de `A1:AA<última linha>`;
- impressão em paisagem, ajustada à largura e limitada a `A1:AA<última linha>`;
- uma única aba mensal;
- ausência de linhas, colunas, fórmulas ou validações ocultas introduzidas pelo renderer.

### Ausência deliberada de validação de lista

O arquivo não contém `dataValidations`.

A validação de lista para `SIM`, `NÃO` e `NÃO SE APLICA` permanece ausente porque a estrutura anterior provocava reparo no Microsoft Excel. Essa ausência é verificada automaticamente e não deve ser revertida sem nova implementação OOXML e abertura manual sem reparo.

## 8. Integração de runtime

`src/integration/excel-export-integration.js` reutiliza o mesmo pipeline mensal nos pontos autorizados da interface.

A integração:

- habilita o Excel SME apenas para competência mensal;
- acompanha a competência global selecionada;
- impede clique concorrente durante a geração;
- registra o evento de exportação;
- mantém os botões idempotentes em renderizações tardias;
- não altera o escopo histórico do relatório institucional.

O seletor global mantém rótulo, lista e competência atual. A frase explicativa `A seleção atualiza todas as telas e exportações mensais.` não é renderizada, pois descreve uma regra interna e não integra a interface destinada aos usuários.

## 9. Contrato de publicação

`src/integration/excel-sme-runtime-loader.js` carrega sob demanda:

```text
/assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx
```

O build público da Vercel deve preservar esse caminho e publicar também o manifesto de assets e o ExcelJS versionados por hash. Alterar caminho, nome ou conteúdo exige atualização conjunta do carregador, build, manifesto, testes e smoke do ambiente publicado.

## 10. Certificação

A certificação integral compara:

```text
competência ativa
→ modelo SME de 27 colunas
→ projeção do template-fonte
→ workbook reaberto pelo ExcelJS
→ pacote OOXML
→ endereços e valores
→ formatos, bordas, filtro e impressão
→ hash de conteúdo
```

Critérios específicos:

- uma única competência;
- uma única aba;
- exatamente 27 colunas;
- nenhuma coluna `SISTEMÁTICA PREENCHIDA`;
- quantidade de escolas igual à massa de entrada;
- designação armazenada como texto;
- grade completa;
- filtro e impressão limitados a A:AA;
- células do cabeçalho e dos dados sem divergência;
- ausência de `dataValidations`;
- alteração em outra competência sem impacto no `contentHash`.

## 11. Limites da automação

A certificação automatizada:

- usa massa sintética;
- não consulta nem grava em Production;
- não altera Supabase, Auth, RLS ou migrations;
- reabre o arquivo pelo ExcelJS e inspeciona o OOXML;
- não substitui a abertura humana do novo candidato no Microsoft Excel desktop.

A versão anterior do Excel SME foi confirmada manualmente no Excel desktop sem aviso de reparo. Como esta correção altera estrutura e estilos, o novo candidato deve ser aberto novamente antes do merge.

## 12. Contratos protegidos

- competência mensal única;
- uma linha por unidade escolar;
- 27 colunas A:AA;
- remoção exclusiva das posições-fonte K, R e Y;
- preservação dos campos administrativos posteriores;
- três agrupamentos de conta, cada um com seis documentos;
- nenhuma informação inventada;
- designação textual;
- grade completa;
- ausência de `dataValidations`;
- isolamento temporal;
- nome da aba, nome do arquivo e dados vinculados à competência ativa;
- independência do relatório institucional e do CSV;
- template, manifesto e runtime presentes no artefato público;
- smoke HTTP e funcional após deployment.

## 13. Referências

- [`excel-integral-certification.md`](excel-integral-certification.md);
- [`excel-export.md`](excel-export.md);
- [`excel-xlsx-runtime.md`](excel-xlsx-runtime.md);
- [`avaliacao-mensal.md`](avaliacao-mensal.md);
- [`../audits/2026-08-03-hotfix-excel-sme-template-404.md`](../audits/2026-08-03-hotfix-excel-sme-template-404.md);
- [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md).