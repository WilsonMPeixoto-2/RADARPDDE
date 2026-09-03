# Avaliação mensal — contrato canônico

**Estado:** contrato vigente e publicado
**Atualizado em:** 3 de setembro de 2026

## 1. Finalidade

A avaliação mensal representa, para cada combinação de unidade escolar, competência e programa, três dimensões relacionadas e independentes:

1. bonificação pela entrega dos documentos;
2. análise técnica da qualidade documental;
3. pendências e regularizações decorrentes.

Dashboard, Carteira, Competências, Prontuário, timeline e exportações não podem calcular resultados distintos para o mesmo contexto.

## 1.1 Ordem visual dos programas

Na tela de avaliação, `PDDE Básico` é apresentado primeiro para manter a sequência de trabalho habitual dos Controladores.

Essa prioridade é **somente de apresentação**:

- não reordena `programasIds` na fonte;
- não persiste nova ordem;
- não altera consolidação, bonificação, análise, Pendências ou regras de programa;
- os demais programas preservam entre si a ordem original.
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

Valores aceitos:

- `Sim`;
- `Não`;
- `Não se aplica`.

Extrato da Conta Corrente e Extrato de Investimento não aceitam `Não se aplica` para consolidação.

A Declaração BB Ágil aceita `Não se aplica` quando não houver despesas a serem lançadas. Nesse estado, sua análise técnica é projetada como `Correto` apenas como valor neutro de conclusão, sem criar Pendência. Ao voltar de N/A para `Sim` ou `Não`, a análise técnica retorna a `Não analisado`. Uma Pendência ativa da Declaração BB Ágil precisa ser resolvida ou cancelada antes de marcar N/A.

### Boleto de pagamento de Internet

Boleto de pagamento de Internet **não é categoria documental autônoma**.

O contrato vigente após os PRs #208 e #209 é:

- `boleto_internet` é um **tipo de gasto** dentro do item documental `notaFiscal`;
- a opção aparece somente em competências de Educação Conectada;
- a escola precisa possuir vínculo ativo com Educação Conectada, inclusive na validação server-side;
- bonificação, análise técnica e Pendência são as próprias de **Notas Fiscais**;
- não existe bonificação, análise técnica ou Pendência independente `boletoInternet`;
- `boleto_internet` não cria nem encaminha bem para inventariação;
- `boleto_internet` não participa de Consulta Assessoria;
- somente despesas de tipo `servico` participam da matriz de Assessoria.

Chaves históricas `boletoInternet` podem permanecer armazenadas em verificações antigas para auditabilidade, mas são ignoradas pela matriz documental, pela consolidação, pelo status técnico, pela retificação e pela criação de novas Pendências.

### Resultado

- todos os campos válidos e nenhum `Não`: `apta`;
- todos os campos válidos e ao menos um `Não`: `inapta`;
- campo ausente ou `Não se aplica` indevido: resultado nulo e consolidação bloqueada.

A regularização posterior não reescreve automaticamente a bonificação histórica.

Registros antigos que contenham a chave `boletoInternet` não exigem backfill nem limpeza destrutiva. A chave é preservada como histórico, mas não participa do cálculo atual. Educação Conectada usa a mesma matriz de seis documentos dos demais programas; a exclusividade do boleto é aplicada no **tipo de gasto**, não na matriz documental.

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

Divergência entre `resultadoBonif` armazenado e `bonusResult` canônico bloqueia a certificação. Chaves históricas `boletoInternet` são ignoradas pela avaliação canônica e não alteram as 27 colunas do Excel SME.

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
- ausência de linha, subitem, bonificação ou análise independente `boletoInternet`;
- opção `boleto_internet` visível em `Tipo de Gasto` somente em Educação Conectada;
- rejeição de `boleto_internet` fora de Educação Conectada;
- rejeição de escrita documental independente `boletoInternet`, inclusive por retificação e Pendência;
- gasto `boleto_internet` usando avaliação e Pendência de `notaFiscal`;
- chaves históricas `boletoInternet` preservadas, mas ignoradas pela consolidação;
- correspondência entre tela, serviço, estado e armazenamento;
- recarga preservando competência e resultado;
- certificação Excel sem divergências;
- ausência de `pageerror`.

## 12. Referências

- [`competencias.md`](competencias.md);
- [`timeline-unidade.md`](timeline-unidade.md);
- [`excel-integral-certification.md`](excel-integral-certification.md);
- [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md).
