# Documentação do RADAR PDDE

> **Primeira leitura obrigatória:** [`../START_HERE.md`](../START_HERE.md).  
> Este índice ajuda a localizar documentação técnica, mas **não define uma segunda ordem de retomada**.

## 1. Continuidade corrente

A retomada operacional usa somente esta cadeia:

1. [`../START_HERE.md`](../START_HERE.md) — única porta de entrada;
2. [`CURRENT_STATE.md`](CURRENT_STATE.md) — estado factual corrente;
3. [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md) — **único plano executável vigente**;
4. [`PLAN_TRACEABILITY.md`](PLAN_TRACEABILITY.md) — reconciliação do plano do PR #253 com os PRs #254/#256/#257/#258/#260/#261;
5. [`../AGENTS.md`](../AGENTS.md) — regras permanentes de trabalho.

Se a `main` avançou além da baseline descrita em `START_HERE.md`, primeiro reconciliar os PRs posteriores. Não escolher automaticamente um plano datado.

## 2. Estado e rastreabilidade

- [`CURRENT_STATE.md`](CURRENT_STATE.md) — baseline, ambiente, regras sensíveis e trabalho realmente remanescente;
- [`PLAN_TRACEABILITY.md`](PLAN_TRACEABILITY.md) — por que R1–R9 mudou depois dos hotfixes;
- [`CURRENT_STAGE.md`](CURRENT_STAGE.md) — histórico detalhado dos checkpoints do projeto; útil para investigação, mas não é fila executável;
- [`DECISION_LOG.md`](DECISION_LOG.md) — decisões duradouras/históricas;
- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — contratos funcionais e arquiteturais amplos.

## 3. Plano vigente e planos históricos

### Vigente

- [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md) — única fila executável atual.

### Históricos

- [`superpowers/plans/2026-09-03-plano-remanescente-source-first.md`](superpowers/plans/2026-09-03-plano-remanescente-source-first.md) — plano correto do checkpoint de 03/09, posteriormente alterado pelos hotfixes #254/#256/#257/#258/#260;
- [`superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md`](superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md) — plano anterior, já substituído em 03/09;
- demais arquivos datados em `superpowers/plans/` — evidência de seus checkpoints.

Documentos históricos preservam intenção, REDs, riscos e decisões de sua época. Seus “próximos passos” não controlam a execução atual.

## 4. Decisões e contratos funcionais

- [`decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md`](decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md) — individualização fiscal/Pendências; ler em conjunto com os hotfixes posteriores registrados em `PLAN_TRACEABILITY.md`;
- [`decisions/ADR-052-autoridade-unica-fluxos-criticos.md`](decisions/ADR-052-autoridade-unica-fluxos-criticos.md) — autoridade/composição de fluxos críticos;
- [`decisions/ADR-051-adiamento-hardening-registered-invoices.md`](decisions/ADR-051-adiamento-hardening-registered-invoices.md) — hardening adiado para frente separada;
- [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md) — visão gerada da matriz funcional;
- [`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md) — governança dos testes;
- [`reference/CHANGE_CLASSIFICATION.md`](reference/CHANGE_CLASSIFICATION.md) — classes de achado.

**Atenção:** um ADR pode conter trechos que foram especializados por hotfix posterior. Quando isso ocorrer, a decisão posterior registrada na rastreabilidade prevalece na superfície modificada; não marcar o documento inteiro como inválido por causa de uma cláusula superada.

## 5. Arquitetura

- [`architecture/competencias.md`](architecture/competencias.md)
- [`architecture/avaliacao-mensal.md`](architecture/avaliacao-mensal.md)
- [`architecture/modelo-operacional.md`](architecture/modelo-operacional.md)
- [`architecture/product-extensions-load-order.md`](architecture/product-extensions-load-order.md)
- [`architecture/testing.md`](architecture/testing.md)

Documentação arquitetural datada deve ser confrontada com o bootstrap/código atual quando a tarefa depender de ordem real de extensões.

## 6. Supabase

- [`reference/SUPABASE_DATA_DICTIONARY.md`](reference/SUPABASE_DATA_DICTIONARY.md)
- [`reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](reference/SUPABASE_FUNCTIONAL_COVERAGE.md)
- [`reference/SUPABASE_PERMISSIONS_MATRIX.md`](reference/SUPABASE_PERMISSIONS_MATRIX.md)
- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md)
- [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md)

A baseline do PR #260 contém 46 migrations. Para quantidade/estado corrente além desse checkpoint, conferir o remoto.

## 7. Handoffs, auditorias e evidências

Diretórios:

- `handoff/` — checkpoints de transferência;
- `audits/` — auditorias datadas;
- `evidence/` — evidências de execução;
- `reports/` — relatórios;
- `superpowers/specs/` e `superpowers/plans/` — especificações e planos de seus ciclos.

Esses arquivos são fundamentais para rastreabilidade, mas não devem ser percorridos aleatoriamente por um novo agente. `START_HERE.md` determina quando uma fonte histórica é necessária.

## 8. Exportações

Contratos vigentes incluem:

- relatório institucional XLSX;
- Excel SME mensal de 27 colunas A:AA;
- CSV secundário/fallback quando previsto;
- XLSX editorial de Pendências com filtros atuais e sem IDs técnicos.

Alteração material de exportação exige a certificação correspondente; mudança sem relação com exportação não justifica recertificação indiscriminada.

## 9. Regra de manutenção documental

Quando um novo hotfix funcional for integrado:

1. atualizar [`CURRENT_STATE.md`](CURRENT_STATE.md);
2. registrar o impacto em [`PLAN_TRACEABILITY.md`](PLAN_TRACEABILITY.md);
3. atualizar [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md) quando o trabalho remanescente mudar;
4. manter [`../START_HERE.md`](../START_HERE.md) apontando para a baseline correta;
5. só então retomar a fila planejada.

Não criar outro “plano corrente” paralelo. Não adicionar nova ordem de leitura a README, handoff ou ADR.
