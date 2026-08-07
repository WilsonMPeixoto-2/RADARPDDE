# Relatório institucional Excel do RADAR PDDE

**Estado:** modelo, renderer, certificação, integração e auditoria obrigatória implementados  
**Atualizado em:** 7 de agosto de 2026

## 1. Finalidade

O relatório institucional `.xlsx` preserva o universo e os doze campos do CSV legado, acrescentando estrutura editorial, sínteses e controles de qualidade sem reduzir ou reinterpretar a base original.

A integração de runtime substitui a ação principal por XLSX e preserva o CSV como contingência. O download institucional é envolvido por auditoria obrigatória via `RadarExcelExportAudit`.

## 2. Estado por camada

| Camada | Estado |
|---|---|
| Modelo lógico institucional | implementado |
| Plano do workbook | implementado |
| Renderer OOXML/ZIP | implementado |
| Quatro abas | implementadas |
| Equivalência com CSV | certificada |
| Comparação célula a célula | certificada |
| Manifesto e hashes | implementados |
| Botão institucional principal usando XLSX | implementado em runtime |
| Botão secundário CSV | implementado como fallback |
| Auditoria inicial antes do download | implementada e obrigatória |
| Registro de conclusão | implementado |
| Neutralização do log legado duplicado | implementada |
| Homologação manual do relatório institucional no Excel desktop | pendente quando priorizada |

## 3. Contrato do relatório

A rotina lógica percorre escolas, competências configuradas e programas vinculados. Uma linha existe quando há verificação para `escola + competência + programa` e `resultadoBonif` está preenchido.

Granularidade:

```text
escola × competência × programa consolidado
```

A competência ativa não limita o conteúdo institucional. O produto é histórico e multicompetência.

## 4. Campos obrigatórios

A aba `BONIFICACOES` mantém, na mesma ordem lógica:

| Nº | Campo | Origem |
|---:|---|---|
| 1 | INEP | escola |
| 2 | Denominação | escola |
| 3 | Designação | escola |
| 4 | Competência | competência iterada |
| 5 | Programa | vínculo escola–programa |
| 6 | Conta corrente | bonificação |
| 7 | Investimento | bonificação |
| 8 | Nota fiscal | bonificação |
| 9 | Assessoria | bonificação |
| 10 | BB Ágil | bonificação |
| 11 | Encaminhado ao inventário | bonificação |
| 12 | Status da bonificação | `resultadoBonif` |

Nenhum campo pode ser removido, agregado ou transferido exclusivamente para outra aba.

## 5. Estrutura do workbook

Ordem fixa:

1. `BONIFICACOES`;
2. `SINTESE`;
3. `QUALIDADE_DADOS`;
4. `METADADOS`.

As abas auxiliares não alteram a base principal.

## 6. Aba `BONIFICACOES`

- universo e ordem equivalentes ao CSV;
- `APTA` e `INAPTA` em texto;
- identificadores textuais preservados;
- filtros e ordenação;
- congelamento das oito primeiras linhas e três primeiras colunas;
- cabeçalho na linha 8;
- dados a partir da linha 9;
- nenhum gráfico dentro da base principal.

## 7. `SINTESE`, qualidade e metadados

`SINTESE` agrega indicadores sem modificar a base. `QUALIDADE_DADOS` localiza campos ausentes/representações inválidas e referencia a linha correspondente. `METADADOS` registra geração, versão do modelo, regra de inclusão, granularidade, escopo temporal e dicionário.

A unidade estatística deve permanecer declarada como `escola × competência × programa`.

## 8. Equivalência e certificação

A comparação entre rota lógica legada e base XLSX verifica quantidade, ordem, doze valores, consolidados e ausência de não consolidados.

A certificação percorre:

```text
estado de origem
→ evaluateMonthlyEvaluation
→ modelo institucional
→ plano do workbook
→ OOXML
→ células
→ hashes e manifesto
```

Divergência lógica bloqueia a exportação XLSX e mantém o CSV como contingência.

## 9. Runtime e ordem de carregamento

`src/integration/load-excel-export.js` carrega sequencialmente os módulos de domínio/renderização, `excel-export-integration.js` e, ao final, `excel-export-audit.js`.

A integração principal preserva a função CSV legada, disponibiliza XLSX/SME/CSV e mantém fallback técnico. A camada `RadarExcelExportAudit` passa a controlar a liberação do download.

## 10. Auditoria obrigatória da exportação

Percurso vigente:

```text
clique autorizado
→ RadarExcelExportAudit
→ AuditService.record('Exportação Excel Iniciada')
→ confirmação obrigatória
→ geração/download
→ AuditService.record(ação de conclusão)
```

Regras:

1. se `AuditService` estiver indisponível ou o evento inicial falhar, a exportação é bloqueada;
2. durante o pipeline, o filtro de compatibilidade neutraliza `registerLog` para os eventos legados de exportação, evitando duplicação;
3. se a geração falhar, não se afirma conclusão;
4. se o arquivo for gerado mas o registro final falhar, o retorno distingue `exportCompleted` de `auditFailed` e orienta o usuário;
5. XLSX institucional e Excel SME usam a mesma regra de auditoria inicial.

Essa camada foi incorporada pelo PR #162 e substitui o contrato documental antigo de persistência assíncrona do snapshot integral de logs.

## 11. Certificação do deployment

A disponibilidade do produto exige:

- assets e manifestos esperados;
- HTTP válido;
- botão real concluindo o percurso;
- workbook reaberto/inspecionado;
- commit publicado coerente;
- auditoria inicial disponível.

## 12. Homologação humana

O Excel SME possui homologação própria concluída para o contrato atual. O relatório institucional mantém sua homologação humana independente quando priorizada. Certificação automatizada não substitui abertura humana diante de mudança estrutural ou visual material.

## 13. Relação com o Excel SME

| Dimensão | Institucional | SME mensal |
|---|---|---|
| Escopo | histórico | competência ativa |
| Granularidade | escola × competência × programa | uma linha por escola |
| Abas | quatro | uma |
| Colunas principais | doze | **27 A:AA** |
| Ação | XLSX institucional | Excel SME |
| Fallback | CSV | não aplicável |
| Auditoria inicial | obrigatória | obrigatória |

Contrato SME: [`excel-sme-mensal.md`](excel-sme-mensal.md).

## 14. Limites

A implementação não:

- consulta Production durante certificação sintética;
- inventa dados para completar o relatório;
- substitui homologação humana;
- remove o CSV legado;
- libera download institucional sem registro inicial de auditoria.

## 15. Referências

- [`excel-integral-certification.md`](excel-integral-certification.md);
- [`excel-sme-mensal.md`](excel-sme-mensal.md);
- [`excel-xlsx-runtime.md`](excel-xlsx-runtime.md);
- [`frontend-load-order.md`](frontend-load-order.md);
- [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md).
