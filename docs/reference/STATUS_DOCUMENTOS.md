# Matriz de validade documental

**Atualizado em:** 5 de setembro de 2026  
**Classe documental:** referência canônica de classificação, não fila executável

> **ROTA OBRIGATÓRIA:** qualquer retomada começa em [`../../START_HERE.md`](../../START_HERE.md). O único plano executável vigente é [`../MASTER_PLAN_CURRENT.md`](../MASTER_PLAN_CURRENT.md).

## 1. Rota corrente

```text
START_HERE.md
→ CURRENT_STATE.md
→ método adversarial
→ playbook reproduzível
→ achados/evidências adversariais
→ MASTER_PLAN_CURRENT.md
→ PLAN_TRACEABILITY.md quando necessário
→ documentos específicos da tarefa
```

## 2. Documentos correntes

| Documento | Estado | Uso |
|---|---|---|
| `START_HERE.md` | **CORRENTE — porta única** | primeira leitura/baseline |
| `docs/CURRENT_STATE.md` | **CORRENTE** | estado funcional + achados abertos |
| `docs/architecture/adversarial-analysis-and-implementation-method.md` | **CORRENTE — obrigatório** | princípios adversariais |
| `docs/architecture/adversarial-analysis-replication-playbook.md` | **CORRENTE — obrigatório em auditoria crítica** | procedimento reproduzível extraído da execução Astra |
| `docs/audits/2026-09-05-astra-adversarial-findings.md` | **CORRENTE COMO LEDGER** | bugs, ambiguidades, dívidas e históricos classificados |
| `docs/audits/2026-09-05-astra-artifact-package-review.md` | **CORRENTE COMO EVIDÊNCIA/MÉTODO** | estudo dos 27 artefatos reais da auditoria Astra |
| `docs/MASTER_PLAN_CURRENT.md` | **CORRENTE — único plano executável** | fila real |
| `docs/PLAN_TRACEABILITY.md` | **CORRENTE** | origem e absorção |
| `AGENTS.md` | **CORRENTE** | regras permanentes de agentes |
| `docs/reference/TEST_GOVERNANCE.md` | **CORRENTE** | governança de testes |
| `docs/PROJECT_CONTEXT.md` | **CORRENTE** | contratos funcionais, subordinados à rota |
| `docs/DECISION_LOG.md` | **CORRENTE COMO LEDGER** | decisões; não é fila |

## 3. Arquitetura corrente corrigida após Astra

- `competencias.md`: contexto global único + filtro local transversal de Pendências;
- `excel-export.md`: XLSX institucional na competência ativa; CSV ainda precisa decisão; P1 de auditoria SME aberto;
- `excel-sme-mensal.md`: 27 colunas preservadas + P1 de composição registrado;
- `excel-xlsx-runtime.md`: removida equivalência automática CSV/XLSX;
- `excel-integral-certification.md`: workbook correto separado de composição correta do botão real.

## 4. Auditorias

### Corrente para achados

- `2026-09-05-astra-adversarial-findings.md` — ledger atual;
- `2026-09-05-astra-artifact-package-review.md` — evidência/método extraído do pacote.

### Histórica/canônica para continuidade

- `2026-09-05-continuity-semantic-traceability-complete.md` — reconstrução #253→#261. Continua útil, mas **não prova ausência de bugs desconhecidos**.

### Histórica

- `2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md` e demais auditorias de checkpoints anteriores.

## 5. Planos históricos

- `2026-09-03-plano-remanescente-source-first.md` — histórico, não executar;
- `2026-08-26-plano-mestre-correcoes-pos-auditoria.md` — histórico, não executar;
- demais planos/handoffs datados — evidência de checkpoint.

## 6. Linha de sucessão

```text
#253
→ #254 → #256 → #257 → #258 → #260 → #261
→ #263 documental em revisão
```

PR #262 foi abortado/fechado sem merge.

## 7. ADRs e migrations

ADRs continuam válidas apenas no escopo não especializado por decisão posterior.

Para SQL/RPC:

- migration antiga continua imutável;
- autoridade é a última definição efetiva da assinatura;
- matriz deve registrar evidência sucessora quando a RPC foi redefinida.

## 8. Sessão nova NÃO deve

- usar gate verde como prova de ausência de bug;
- validar só função isolada quando o usuário entra por outro caminho;
- ignorar segunda implementação/fallback/closure;
- usar migration antiga depois de sucessora;
- transformar fixture legado/adversarial em regra atual;
- omitir ambiguidade porque “não é bug”;
- executar plano histórico como fila corrente.

## 9. Após hotfix funcional

1. reproduzir/classificar;
2. aplicar método adversarial;
3. atualizar `CURRENT_STATE.md`;
4. atualizar `PLAN_TRACEABILITY.md`;
5. atualizar `MASTER_PLAN_CURRENT.md` se necessário;
6. atualizar documentos correntes afetados;
7. registrar o que foi tentado para provar que a correção ainda estava errada.
