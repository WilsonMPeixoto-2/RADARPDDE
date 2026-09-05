# Documentação do RADAR PDDE

> **Primeira leitura obrigatória:** [`../START_HERE.md`](../START_HERE.md).  
> Este índice localiza documentação técnica; **não define uma segunda ordem de retomada**.

## 1. Continuidade e método corrente

A rota operacional é:

1. [`../START_HERE.md`](../START_HERE.md) — baseline e porta única;
2. [`CURRENT_STATE.md`](CURRENT_STATE.md) — estado factual, regras e achados abertos;
3. [`architecture/adversarial-analysis-and-implementation-method.md`](architecture/adversarial-analysis-and-implementation-method.md) — princípios obrigatórios;
4. [`architecture/adversarial-analysis-replication-playbook.md`](architecture/adversarial-analysis-replication-playbook.md) — procedimento técnico reproduzível baseado nos artefatos Astra;
5. [`audits/2026-09-05-astra-adversarial-findings.md`](audits/2026-09-05-astra-adversarial-findings.md) — ledger corrente de bugs/ambiguidades/riscos;
6. [`audits/2026-09-05-astra-artifact-package-review.md`](audits/2026-09-05-astra-artifact-package-review.md) — estudo do pacote de evidências;
7. [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md) — **único plano executável vigente**;
8. [`PLAN_TRACEABILITY.md`](PLAN_TRACEABILITY.md) — origem e absorção quando necessário;
9. [`../AGENTS.md`](../AGENTS.md) — regras permanentes de agentes.

Se a `main` avançar além da baseline, primeiro reconciliar os PRs funcionais posteriores.

## 2. Estado e rastreabilidade

- [`CURRENT_STATE.md`](CURRENT_STATE.md) — estado funcional e P1/decisões abertas;
- [`PLAN_TRACEABILITY.md`](PLAN_TRACEABILITY.md) — impacto dos hotfixes e da auditoria Astra sobre o plano;
- [`DECISION_LOG.md`](DECISION_LOG.md) — ledger de decisões;
- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — contexto funcional amplo;
- [`CURRENT_STAGE.md`](CURRENT_STAGE.md) — histórico detalhado de checkpoints, não fila executável.

A auditoria de continuidade anterior, [`audits/2026-09-05-continuity-semantic-traceability-complete.md`](audits/2026-09-05-continuity-semantic-traceability-complete.md), continua útil para reconstruir #253→#261, mas **não é prova de ausência de bugs desconhecidos**.

## 3. Plano

### Vigente

- [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md) — única fila executável, iniciada pela Frente 0 adversarial.

### Históricos

- [`superpowers/plans/2026-09-03-plano-remanescente-source-first.md`](superpowers/plans/2026-09-03-plano-remanescente-source-first.md);
- [`superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md`](superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md);
- demais planos/handoffs datados.

Seus “próximos passos” não controlam a execução atual.

## 4. Testes e método adversarial

- [`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md) — testes como regressão conhecida + descoberta adversarial;
- [`architecture/adversarial-analysis-and-implementation-method.md`](architecture/adversarial-analysis-and-implementation-method.md) — mapa de autoridade, contraexemplos, estado avançado, composição real, SQL sucessor e fechamento;
- [`architecture/adversarial-analysis-replication-playbook.md`](architecture/adversarial-analysis-replication-playbook.md) — inventário, varredura, mapa AST/SQL, probes, normalização do ambiente e preservação progressiva de artefatos.

Regra central:

```text
gates conhecidos passaram
≠ produto provado sem defeitos desconhecidos
```

## 5. Arquitetura corrente

- [`architecture/competencias.md`](architecture/competencias.md) — contexto global + exceção transversal de Pendências;
- [`architecture/avaliacao-mensal.md`](architecture/avaliacao-mensal.md);
- [`architecture/modelo-operacional.md`](architecture/modelo-operacional.md);
- [`architecture/product-extensions-load-order.md`](architecture/product-extensions-load-order.md);
- [`architecture/testing.md`](architecture/testing.md);
- [`architecture/excel-export.md`](architecture/excel-export.md);
- [`architecture/excel-sme-mensal.md`](architecture/excel-sme-mensal.md);
- [`architecture/excel-xlsx-runtime.md`](architecture/excel-xlsx-runtime.md);
- [`architecture/excel-integral-certification.md`](architecture/excel-integral-certification.md).

A família Excel foi reconciliada em 05/09 para distinguir:

- workbook correto;
- ponto de entrada real correto;
- política temporal de XLSX institucional;
- contrato ainda aberto do CSV.

## 6. Achados adversariais abertos

Resumo:

- P1 `Inventariada → Encaminhada` ao salvar novamente NF vinculada;
- P1 auditoria pré-download do Excel SME;
- decisão idade total da Pendência × tempo do ator;
- decisão/investigação CSV × XLSX;
- renderer legado de Pendências;
- projeções duplicadas;
- readiness por Promise/capability;
- módulo de performance com autoridade funcional;
- testes/documentos históricos perigosos.

Usar o ledger, não reproduzir esta lista como fonte autônoma.

## 7. Supabase

- [`reference/SUPABASE_DATA_DICTIONARY.md`](reference/SUPABASE_DATA_DICTIONARY.md)
- [`reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](reference/SUPABASE_FUNCTIONAL_COVERAGE.md)
- [`reference/SUPABASE_PERMISSIONS_MATRIX.md`](reference/SUPABASE_PERMISSIONS_MATRIX.md)
- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md)
- [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md)

Baseline #260: 46 migrations. Para RPC, usar a última definição efetiva da assinatura.

## 8. Handoffs, auditorias e evidências

- `handoff/` — checkpoints;
- `audits/` — auditorias datadas;
- `evidence/` — evidências;
- `reports/` — relatórios;
- `superpowers/specs/` / `plans/` — desenhos e planos de seus ciclos.

São essenciais para rastreabilidade, mas novas sessões não devem percorrê-los aleatoriamente. `START_HERE.md` determina quando são necessários.

## 9. Manutenção após hotfix

Todo hotfix funcional deve:

1. reproduzir/classificar;
2. aplicar método adversarial;
3. atualizar [`CURRENT_STATE.md`](CURRENT_STATE.md);
4. atualizar [`PLAN_TRACEABILITY.md`](PLAN_TRACEABILITY.md);
5. atualizar [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md) se necessário;
6. atualizar documentos correntes afetados;
7. registrar o que foi tentado para provar que a correção ainda estava errada.

Não criar outro plano corrente paralelo.
