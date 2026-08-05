# Exportação Excel SME mensal

**Estado:** contrato público de 27 colunas, renderer ExcelJS, integração, certificação, homologação desktop e publicação concluídos  
**Atualizado em:** 5 de agosto de 2026

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

O arquivo segue:

```text
RADAR_PDDE_EXCEL_SME_MM-AAAA.xlsx
```

A única aba recebe o nome do mês em português.

## 3. Contrato público de 27 colunas

| Intervalo | Conteúdo |
|---|---|
| A:D | sequência, CRE, designação e unidade escolar |
| E:J | seis documentos da Conta PDDE Básico |
| K:P | seis documentos da Conta PDDE Qualidade |
| Q:V | seis documentos da Conta PDDE Equidade |
| W | `STATUS` |
| X | data da entrega |
| Y | data da correção |
| Z | parecer |
| AA | observações |

As colunas técnicas `SISTEMÁTICA PREENCHIDA`, presentes nas posições-fonte K, R e Y, são eliminadas antes da geração final.

Os campos administrativos posteriores são preservados e deslocados para W:AA. Campos sem fonte canônica permanecem vazios; a exportação não inventa conteúdo.

## 4. Projeção do template-fonte

O template `assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx` possui 30 colunas e não é publicado diretamente como produto preenchido.

O renderer:

1. valida as posições 25, 18 e 11;
2. remove Y, R e K em ordem decrescente;
3. valida os 27 cabeçalhos finais;
4. reconstrói as linhas com o cadastro atual;
5. limita conteúdo, filtro, impressão, bordas e estilos a A:AA.

A validação posicional impede remoção silenciosa de outra coluna.

## 5. Mapeamento das contas

| Conta SME | Programas do RADAR |
|---|---|
| PDDE Básico | `BASIC` |
| PDDE Qualidade | `CONECTADA`, `PROEC`, `ED_FAMILIA`, `ADOLESCENCIAS`, `LEITURA`, `TEMPO_APRENDER` |
| PDDE Equidade | `RECURSOS` |

## 6. Consolidação documental

Quando mais de um programa pertence à mesma conta:

1. `NÃO`, se ao menos um programa possui `Não`;
2. `SIM`, quando não existe `Não` e há `Sim`;
3. `NÃO SE APLICA`, quando todos os informados são `Não se aplica`;
4. vazio, sem consolidação ou valor.

## 7. Apresentação

- 27 cabeçalhos;
- mesclagem `A1:B1`;
- borda fina completa;
- designação como texto `XX.XX.XXX`, formato `@`;
- unidade, parecer e observações alinhados à esquerda;
- valores categóricos centralizados;
- cabeçalho centralizado horizontal e verticalmente;
- quebra automática e recuo zero no cabeçalho;
- altura 105;
- congelamento `E2`;
- filtro e impressão em A:AA;
- uma aba mensal;
- nenhuma linha, coluna, fórmula ou validação oculta adicionada.

### `dataValidations`

Não existem `dataValidations`. A estrutura anterior provocava reparo no Microsoft Excel e não pode ser reintroduzida sem nova implementação e homologação.

## 8. Integração

`src/integration/excel-export-integration.js`:

- habilita somente para competência mensal;
- acompanha a competência global;
- impede clique concorrente;
- registra exportação;
- mantém botões idempotentes;
- disponibiliza o produto nas superfícies autorizadas, inclusive dashboard da Assistente;
- não altera o relatório institucional.

A frase interna `A seleção atualiza todas as telas e exportações mensais.` não é renderizada.

## 9. Publicação

O runtime carrega sob demanda:

```text
/assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx
```

O build publica também manifesto e ExcelJS com tamanho e SHA-256. Alteração de caminho, nome ou conteúdo exige atualização conjunta de runtime, build, manifesto, testes e smoke.

## 10. Certificação

```text
competência
→ modelo de 27 colunas
→ projeção do template
→ workbook
→ reabertura pelo ExcelJS
→ OOXML
→ valores e formatos
→ hashes
```

Critérios:

- uma competência e uma aba;
- 27 colunas;
- nenhuma `SISTEMÁTICA PREENCHIDA`;
- quantidade correta de escolas;
- designação textual;
- grade completa;
- cabeçalho normalizado;
- filtro e impressão A:AA;
- ausência de `dataValidations`;
- isolamento temporal.

## 11. Homologação final

O candidato correspondente aos PRs nº 136 e 137 foi:

- gerado pelo botão real;
- reaberto pelo ExcelJS;
- inspecionado no pacote OOXML;
- validado em desktop, Android e iPhone;
- aberto no Microsoft Excel desktop sem reparo;
- aprovado visualmente após o ajuste de alinhamento do cabeçalho;
- publicado em Production.

Nova alteração material de estrutura, estilo ou motor exige novo candidato e nova abertura humana antes de publicação.

## 12. Contratos protegidos

- competência mensal única;
- uma linha por unidade;
- 27 colunas A:AA;
- remoção exclusiva de K, R e Y no template-fonte;
- preservação dos campos posteriores;
- três grupos de seis documentos;
- nenhuma informação inventada;
- designação textual;
- bordas e cabeçalho;
- ausência de `dataValidations`;
- isolamento temporal;
- template, manifesto e runtime no artefato;
- smoke HTTP e funcional após deployment.

## 13. Referências

- [`excel-integral-certification.md`](excel-integral-certification.md);
- [`excel-export.md`](excel-export.md);
- [`excel-xlsx-runtime.md`](excel-xlsx-runtime.md);
- [`avaliacao-mensal.md`](avaliacao-mensal.md);
- [`../audits/2026-08-03-hotfix-excel-sme-template-404.md`](../audits/2026-08-03-hotfix-excel-sme-template-404.md);
- [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md).
