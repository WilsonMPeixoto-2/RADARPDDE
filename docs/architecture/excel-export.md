# Relatório institucional Excel do RADAR PDDE

**Estado:** modelo, renderer e certificação implementados; troca do botão institucional pendente  
**Atualizado em:** 29 de julho de 2026

## 1. Finalidade

O relatório institucional `.xlsx` preserva integralmente o universo e os doze campos do CSV legado, acrescentando estrutura editorial, sínteses e controles de qualidade sem reduzir ou reinterpretar a base original.

A implementação existe e é certificada automaticamente. O botão institucional da interface ainda permanece associado ao CSV. A eventual substituição do botão é decisão separada e reversível.

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
| Botão institucional usando XLSX | pendente |
| Homologação manual no Excel desktop | pendente |

## 3. Contrato do relatório legado

A rotina lógica percorre:

1. escolas;
2. competências configuradas;
3. programas vinculados a cada escola.

Uma linha existe quando há verificação para `escola + competência + programa` e `resultadoBonif` está preenchido.

Granularidade:

```text
escola × competência × programa consolidado
```

A competência ativa não limita o conteúdo institucional. O produto é histórico e multicompetência.

## 4. Campos obrigatórios

A aba `BONIFICACOES` mantém, na mesma ordem lógica:

| Nº | Campo | Rótulo | Origem |
|---:|---|---|---|
| 1 | `INEP` | INEP | escola |
| 2 | `Denominacao` | Denominação | escola |
| 3 | `Designacao` | Designação | escola |
| 4 | `Competencia` | Competência | competência iterada |
| 5 | `Programa` | Programa | vínculo escola–programa |
| 6 | `CC` | Conta corrente | `bonificacao.extCC` |
| 7 | `Investimento` | Investimento | `bonificacao.extINV` |
| 8 | `NF` | Nota fiscal | `bonificacao.notaFiscal` |
| 9 | `Assessoria` | Assessoria | `bonificacao.consAssessoria` |
| 10 | `BBAgil` | BB Ágil | `bonificacao.declBBAgil` |
| 11 | `EncaminhadoInventario` | Encaminhado ao inventário | `bonificacao.encampInventario` |
| 12 | `StatusBonificacao` | Status da bonificação | `resultadoBonif` |

Nenhum campo pode ser removido, agregado ou transferido exclusivamente para outra aba.

## 5. Estrutura do workbook

Ordem fixa:

1. `BONIFICACOES`;
2. `SINTESE`;
3. `QUALIDADE_DADOS`;
4. `METADADOS`.

As abas auxiliares não alteram a base principal.

## 6. Aba `BONIFICACOES`

Contrato:

- universo e ordem equivalentes ao CSV;
- competência no formato legado esperado pelo relatório;
- `APTA` e `INAPTA` em texto;
- INEP, designação e competência preservados como texto;
- filtros e ordenação;
- congelamento das oito primeiras linhas e três primeiras colunas;
- cabeçalho na linha 8;
- dados a partir da linha 9;
- nenhum gráfico dentro da base principal.

### Larguras e alinhamentos

| Coluna | Campo | Largura | Alinhamento |
|---|---|---:|---|
| A | INEP | 12 | centralizado |
| B | Denominação | 34 | esquerda |
| C | Designação | 14 | centralizado |
| D | Competência | 13 | centralizado |
| E | Programa | 24 | esquerda |
| F | Conta corrente | 17 | centralizado |
| G | Investimento | 17 | centralizado |
| H | Nota fiscal | 17 | centralizado |
| I | Assessoria | 17 | centralizado |
| J | BB Ágil | 17 | centralizado |
| K | Encaminhado ao inventário | 20 | centralizado |
| L | Status da bonificação | 21 | centralizado |

## 7. Aba `SINTESE`

Reúne, sem modificar a base:

- consolidadas, aptas, inaptas e taxa de aptidão por competência;
- consolidadas, aptas e inaptas por programa;
- indicadores gerais calculados sobre linhas consolidadas;
- visualizações simples quando suportadas pelo renderer.

A unidade estatística deve ser declarada como `escola × competência × programa`.

## 8. Aba `QUALIDADE_DADOS`

Localiza campos ausentes ou representados de forma inválida e referencia a linha correspondente da aba principal.

Finalidade:

- controle de completude;
- rastreabilidade da linha;
- apoio à revisão;
- nenhuma reclassificação autônoma de APTA/INAPTA.

A primeira linha de dados da base é a linha 9.

## 9. Aba `METADADOS`

Registra:

- data e hora da geração;
- versão do modelo;
- regra de inclusão;
- granularidade;
- escopo temporal;
- ordem das abas;
- dicionário dos doze campos;
- fonte dos dados;
- versão dos componentes relevantes.

## 10. Semântica visual

- azul: estrutura e informação;
- verde: situação positiva;
- vermelho: situação crítica;
- âmbar: atenção;
- roxo: análise derivada;
- cinza: informação neutra.

Cor nunca substitui texto. Estados permanecem escritos.

## 11. Equivalência lógica

Rotas separadas:

```text
buildLegacyLogicalRows()
buildBaseRows()
```

A comparação verifica:

1. quantidade de registros;
2. ordem;
3. doze valores lógicos;
4. presença de consolidados;
5. ausência de não consolidados.

Qualquer divergência bloqueia a certificação e a futura troca do botão.

## 12. Certificação integral

A certificação executa:

```text
estado de origem
→ evaluateMonthlyEvaluation
→ modelo institucional
→ plano do workbook
→ pacote OOXML
→ endereço e valor da célula
→ hashes e manifesto
```

Critérios:

- zero divergência canônica;
- equivalência com CSV;
- quatro abas na ordem;
- todas as células esperadas presentes;
- valores normalizados idênticos;
- escopo histórico preservado;
- manifesto determinístico.

Evidência: [`../evidence/excel-certification/synthetic-manifest.json`](../evidence/excel-certification/synthetic-manifest.json).

## 13. Troca do botão institucional

A mudança do botão de CSV para XLSX não integra a entrega de certificação.

Antes da troca:

1. abrir o arquivo no Microsoft Excel desktop sem reparo;
2. homologar conteúdo e apresentação com massa representativa;
3. manter o CSV acessível durante a transição;
4. implementar em PR próprio;
5. garantir reversão imediata;
6. atualizar documentação e UAT.

## 14. Relação com o Excel SME

Os produtos não são intercambiáveis:

| Dimensão | Institucional | SME mensal |
|---|---|---|
| Escopo | histórico | competência ativa |
| Granularidade | escola × competência × programa | uma linha por escola |
| Abas | quatro | uma |
| Colunas principais | doze | 26 |
| Botão atual | CSV legado | Excel SME |

Contrato SME: [`excel-sme-mensal.md`](excel-sme-mensal.md).

## 15. Limites

A implementação não:

- altera automaticamente o botão legado;
- consulta Production durante a certificação sintética;
- grava no Supabase;
- substitui homologação manual;
- autoriza novas análises sem origem e regra documentadas.

## 16. Evolução

Novas abas ou análises devem ser opcionais, rastreáveis e incapazes de modificar `BONIFICACOES`. Mudança de granularidade, campos ou regra de inclusão exige decisão específica e nova certificação integral.
