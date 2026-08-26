# Avaliação mensal — contrato canônico

**Estado:** vigente, implementado e publicado  
**Atualizado em:** 26 de agosto de 2026

## 1. Finalidade

A avaliação mensal representa, para cada combinação de unidade escolar, competência e programa, três dimensões relacionadas e independentes:

1. bonificação pela entrega dos documentos;
2. análise técnica da qualidade documental;
3. pendências e regularizações decorrentes.

Dashboard, Carteira, Competências, Prontuário, timeline e exportações não podem calcular resultados distintos para o mesmo contexto.

## 2. Identidade

```text
schoolId + competenceKey + programId
```

Na camada de compatibilidade, a chave pode aparecer como:

```text
2026-08_BASIC
```

No Supabase, competência e programa permanecem campos relacionais distintos.

## 3. Projeção canônica

`RadarFluxoOperacional.evaluateMonthlyEvaluation()` recebe:

```javascript
evaluateMonthlyEvaluation({
  bonification,
  analysis,
  programId,
  bonusResult, // opcional; usado apenas para compatibilidade de consolidações anteriores
  pendencies
});
```

E devolve uma projeção serializável:

```javascript
{
  canConsolidate: true,
  bonusResult: 'apta',
  missingFields: [],
  bonificationStatus: 'apta',
  technicalStatus: 'correto',
  technicalCompletion: 'complete',
  openPendencyCount: 0,
  awaitingReanalysisCount: 0,
  activePendencyCount: 0
}
```

A projeção é pura e não persiste dados.

## 4. Bonificação

Documentos avaliados em todos os programas:

- Extrato da Conta Corrente;
- Extrato de Investimento;
- Notas Fiscais;
- Consulta à Assessoria;
- Declaração BB Ágil;
- Encaminhamento para Inventariação.

Somente em **Educação Conectada** (`programId = CONECTADA`) existe ainda:

- Boleto de pagamento de Internet.

Valores aceitos:

- `Sim`;
- `Não`;
- `Não se aplica`.

Extrato da Conta Corrente, Extrato de Investimento e Declaração BB Ágil não aceitam `Não se aplica` para consolidação.

### Boleto de pagamento de Internet

`boletoInternet` é uma categoria documental autônoma e **exclusiva de Educação Conectada**. Não integra a avaliação dos demais programas. Embora registre pagamento de serviço, ela é uma exceção explícita à regra de consulta contábil:

- não cria Nota Fiscal;
- não cria nem encaminha bem para inventariação;
- não ativa `Consulta Assessoria`;
- aceita `Sim`, `Não` e `Não se aplica` na bonificação;
- usa os mesmos estados canônicos da análise técnica;
- `Incorreto` segue a abertura atômica da Pendência documental.

A exceção vale somente para esta categoria e somente dentro de Educação Conectada. A regra de Assessoria vinculada às Notas Fiscais de serviço permanece inalterada.

### Resultado

- todos os campos válidos e nenhum `Não`: `apta`;
- todos os campos válidos e ao menos um `Não`: `inapta`;
- campo ausente ou `Não se aplica` indevido: resultado nulo e consolidação bloqueada.

A regularização posterior não reescreve automaticamente a bonificação histórica.

Registros de **Educação Conectada** já consolidados antes da criação de `boletoInternet` permanecem compatíveis sem backfill: quando a nova chave não existe e há `resultadoBonif` consolidado, a projeção trata exclusivamente essa ausência histórica como `Não se aplica` e análise `Correto`, sem persistir valores inventados. Registros não consolidados de Educação Conectada precisam ter a nova categoria explicitamente avaliada. Os demais programas continuam com o contrato documental anterior e não recebem a chave.

## 5. Análise técnica

Estados documentais existentes incluem:

- `Não analisado`;
- `Correto`;
- `Correto (Atrasado)`;
- `Incorreto`;
- estados intermediários compatíveis com a interface vigente.

Situação e grau de conclusão são independentes:

| Situação dos documentos | `technicalStatus` | `technicalCompletion` |
|---|---|---|
| todos não analisados | `nao-analisado` | `not_started` |
| estados parciais sem incorreção | `em-analise` | `in_progress` |
| algum incorreto e item não analisado | `incorreto` | `in_progress` |
| algum incorreto e todos analisados | `incorreto` | `complete` |
| todos corretos | `correto` | `complete` |
| todos corretos, com atraso | `correto-atrasado` | `complete` |

Análise técnica não altera automaticamente o resultado da bonificação.

## 6. Pendências

A projeção contabiliza somente pendências da mesma escola, competência e programa:

- `openPendencyCount`: `Aberta`;
- `awaitingReanalysisCount`: `Aguardando reanálise`;
- `activePendencyCount`: soma dos estados ativos.

`Resolvida` e `Cancelada` permanecem no histórico, mas não integram a contagem ativa.

## 7. Serviço de aplicação

`VerificationService.getMonthlyEvaluation()` resolve o registro canônico e recorta as pendências correspondentes.

`VerificationService.closeBonification()`:

1. valida a capacidade do perfil;
2. lê o registro da escola, competência e programa;
3. obtém a projeção canônica;
4. bloqueia consolidação incompleta;
5. grava `resultadoBonif` igual a `bonusResult`;
6. registra log administrativo;
7. persiste verificação e log pela operação atômica existente;
8. aplica `row_version`;
9. devolve a mesma projeção usada na decisão.

Nenhuma tabela, RPC ou migration adicional foi necessária para este contrato.

## 8. Perfis

- **Controlador:** lança e consolida nas escolas autorizadas da própria CRE;
- **Assistente:** lança, consolida e executa ajustes autorizados;
- **Gestão SME:** consulta bonificação, sem análise técnica ou mutações operacionais;
- **Inventário:** não lança avaliação mensal;
- **Administrador técnico:** não herda operação cotidiana por padrão.

Política de capacidades, handlers, serviços e RLS são cumulativos.

## 9. Relação com a timeline

A timeline consome o estado e os logs existentes para projetar consolidações e alterações técnicas. Ela não recalcula nem persiste uma avaliação paralela.

## 10. Relação com os relatórios Excel

A certificação integral já está implementada. Os dois produtos executam a regra canônica e comparam o resultado até a célula OOXML:

```text
estado de origem
→ evaluateMonthlyEvaluation
→ modelo de exportação
→ plano do workbook, quando aplicável
→ célula XLSX
→ manifesto SHA-256
```

Divergência entre `resultadoBonif` armazenado e `bonusResult` canônico bloqueia a certificação. Para consolidações anteriores à introdução de `boletoInternet`, a mesma compatibilidade histórica é aplicada antes da comparação, sem alterar as 27 colunas do Excel SME.

Contrato detalhado: [`excel-integral-certification.md`](excel-integral-certification.md).

A homologação manual no Microsoft Excel desktop permanece gate separado da certificação automatizada.

## 11. Testes obrigatórios

### Domínio

- APTA;
- INAPTA;
- campo vazio;
- `Não se aplica` indevido;
- análise não iniciada, em andamento e completa;
- situação incorreta ainda incompleta;
- contagem de pendências ativas.

### Serviço

- recorte por escola, competência e programa;
- consolidação devolvendo a projeção persistida;
- estado incompleto sem alteração de resultado;
- persistência atômica e log;
- concorrência por `row_version`.

### Interface e integração

- competência posterior a maio;
- lançamento no Prontuário;
- consolidação do PDDE Básico sem exibição de `boletoInternet`;
- exibição e avaliação de `boletoInternet` somente em Educação Conectada;
- correspondência entre tela, serviço, estado e armazenamento;
- recarga preservando competência e resultado;
- certificação Excel sem divergências;
- ausência de `pageerror`.

## 12. Referências

- [`competencias.md`](competencias.md);
- [`timeline-unidade.md`](timeline-unidade.md);
- [`excel-integral-certification.md`](excel-integral-certification.md);
- [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md).
