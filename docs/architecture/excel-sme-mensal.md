# Exportação Excel SME mensal

**Estado:** contrato funcional/visual preservado; existe P1 de composição da auditoria ainda não corrigido  
**Atualizado em:** 5 de setembro de 2026

> Leia primeiro [`../../START_HERE.md`](../../START_HERE.md). A descrição anterior deste arquivo afirmava que o botão real já seguia integralmente a auditoria pré-download. A auditoria adversarial de 05/09/2026 demonstrou que isso não está comprovado e reproduziu caminho divergente.

## 1. Finalidade

O botão **Excel SME** gera uma tradução do modelo operacional da SME para **uma única competência mensal ativa**.

Contrato do produto:

- uma competência;
- uma aba;
- uma linha por unidade escolar;
- 27 colunas A:AA;
- dados, aba e nome de arquivo derivados da mesma `activeCompetenciaKey`.

O produto é independente do CSV e do XLSX institucional.

## 2. Regra temporal

A geração exige competência válida `YYYY-MM`.

- competência mensal válida: habilita;
- `TODAS`: bloqueia;
- valor ausente/inválido/divergente: bloqueia.

Arquivo:

```text
RADAR_PDDE_EXCEL_SME_MM-AAAA.xlsx
```

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

O template-fonte possui 30 colunas. O renderer remove exclusivamente as três colunas `SISTEMÁTICA PREENCHIDA` nas posições-fonte K, R e Y e valida o resultado de 27 colunas.

Campos sem fonte canônica permanecem vazios. A exportação não inventa conteúdo.

## 4. Integração funcional preservada

Continuam válidos:

- carregamento sob demanda do ExcelJS/template;
- validação de manifesto/hash;
- retry de falha de carregamento;
- bloqueio de clique concorrente;
- uma aba mensal;
- 27 colunas A:AA;
- designação textual;
- ausência deliberada de `dataValidations` incompatíveis;
- bordas/filtro/impressão dentro de A:AA.

Esses contratos possuem cobertura e não foram revogados pela auditoria adversarial.

## 5. Auditoria pré-download — contrato desejado

A regra de negócio permanece:

```text
clique no Excel SME
→ persistir evento inicial de auditoria
→ confirmar sucesso
→ gerar workbook
→ download
→ registrar conclusão
```

Se o registro inicial falhar, **nenhum download deveria ocorrer**.

## 6. P1 conhecido: botão real contorna a autoridade auditada

A auditoria Astra reproduziu em composição que:

- `RadarExcelExportAudit` bloqueia corretamente o entrypoint auditado quando a persistência inicial falha;
- `excel-export-integration.js` cria o botão SME com uma closure privada `exportSmeXlsx`;
- essa closure pode executar `download` e depois o caminho legado de log/persistência;
- a interceptação da camada auditada não reconhece o clone SME da mesma forma que os botões da Assistente;
- portanto, o botão real pode baixar antes de confirmar a auditoria inicial.

Probe preservado na auditoria:

```text
botão SME integrado + falha de auditoria
→ download → legacy-log → legacy-persist

entrypoint auditado + mesma falha
→ audit-failed
→ nenhum download
```

**Importante:** o defeito foi reproduzido na composição de código com renderer sintético. Ainda não é afirmação de incidente observado em Production. A correção funcional será feita em PR próprio.

## 7. Lacuna de teste atual

O E2E existente comprova:

```text
clicar botão real
→ gerar
→ baixar
→ validar workbook
```

Ele **não** comprova:

```text
clicar botão real
→ auditoria inicial falha
→ nenhum download
```

Esse segundo cenário passa a ser obrigatório para fechamento da correção.

## 8. Certificação futura da correção

O hotfix deverá provar:

1. clique pelo botão real;
2. falha inicial injetada;
3. zero download;
4. zero log de conclusão;
5. interface recuperável para nova tentativa;
6. sucesso normal continua gerando o workbook de 27 colunas;
7. competência, nome do arquivo e conteúdo continuam alinhados;
8. reload não é necessário para recuperar o botão.

## 9. Relação com outras exportações

- **XLSX institucional:** decisão posterior usa competência global ativa;
- **Excel SME:** competência global ativa, uma aba/27 colunas;
- **CSV:** política temporal/auditoria ainda precisa de decisão própria;
- **Pendências XLSX:** segue filtros locais da fila.

Não generalizar equivalência entre esses produtos.

## 10. Referências

- [`excel-export.md`](excel-export.md);
- [`excel-xlsx-runtime.md`](excel-xlsx-runtime.md);
- [`adversarial-analysis-and-implementation-method.md`](adversarial-analysis-and-implementation-method.md);
- [`../audits/2026-09-05-astra-adversarial-findings.md`](../audits/2026-09-05-astra-adversarial-findings.md).
