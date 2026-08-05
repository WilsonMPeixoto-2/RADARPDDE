# Documentação do RADAR PDDE

**Estado de referência:** 5 de agosto de 2026

Este diretório separa estado corrente, contratos executáveis, arquitetura, decisões, procedimentos e evidências históricas.

## 1. Baseline

```text
main: 2e7b18ffa4b81300cf44c96ffde9c222cf98b895
Production: dpl_FZe29TXs9DXeJSLg3bQCsgrgrinW — READY
commit publicado: 2e7b18ffa4b81300cf44c96ffde9c222cf98b895
Supabase: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
PostgreSQL: 17.6.1.147
migrations em Production: 25
Edge Function: team-account-management v95, ACTIVE, JWT obrigatório
```

O PR nº 141 permanece aberto em rascunho e independente.

## 2. Ordem de leitura

1. [`../AGENTS.md`](../AGENTS.md);
2. [`CURRENT_STAGE.md`](CURRENT_STAGE.md);
3. [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md);
4. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md);
5. [`ROADMAP_ATUALIZACOES_2026.md`](ROADMAP_ATUALIZACOES_2026.md);
6. [`DECISION_LOG.md`](DECISION_LOG.md);
7. [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md);
8. [`architecture/README.md`](architecture/README.md).

## 3. Fontes canônicas

- [`CURRENT_STAGE.md`](CURRENT_STAGE.md)
- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md)
- [`ROADMAP_ATUALIZACOES_2026.md`](ROADMAP_ATUALIZACOES_2026.md)
- [`DECISION_LOG.md`](DECISION_LOG.md)
- [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md)
- [`../README.md`](../README.md)
- [`../AGENTS.md`](../AGENTS.md)

## 4. Matriz funcional ponta a ponta

### Fonte executável

- [`reference/functional-contract-matrix.json`](reference/functional-contract-matrix.json) — perfis, superfícies, evidências e arquivos de operações;
- `reference/functional-contract-matrix/*.json` — quarenta operações críticas;
- [`../scripts/check-functional-contract-matrix.mjs`](../scripts/check-functional-contract-matrix.mjs) — validação e geração;
- [`../tests/unit/functional-contract-matrix.test.js`](../tests/unit/functional-contract-matrix.test.js) — regressões;
- [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md) — visão gerada.

Comandos:

```bash
npm run generate:functional-matrix
npm run check:functional-matrix
```

A matriz bloqueia referências quebradas, perfis incoerentes, permissões incompletas e mutações críticas sem releitura, concorrência ou compensação.

## 5. Arquitetura vigente

### Produto

- [`architecture/competencias.md`](architecture/competencias.md)
- [`architecture/avaliacao-mensal.md`](architecture/avaliacao-mensal.md)
- [`architecture/modelo-operacional.md`](architecture/modelo-operacional.md)
- [`architecture/timeline-unidade.md`](architecture/timeline-unidade.md)
- [`architecture/navigation-contextual.md`](architecture/navigation-contextual.md)
- [`architecture/testing.md`](architecture/testing.md)

### Frontend e Supabase

- [`architecture/frontend-load-order.md`](architecture/frontend-load-order.md)
- [`architecture/product-extensions-load-order.md`](architecture/product-extensions-load-order.md)
- [`architecture/supabase-readiness.md`](architecture/supabase-readiness.md)

### Excel

- [`architecture/excel-export.md`](architecture/excel-export.md)
- [`architecture/excel-workbook-plan.md`](architecture/excel-workbook-plan.md)
- [`architecture/excel-xlsx-runtime.md`](architecture/excel-xlsx-runtime.md)
- [`architecture/excel-sme-mensal.md`](architecture/excel-sme-mensal.md)
- [`architecture/excel-integral-certification.md`](architecture/excel-integral-certification.md)

O Excel SME público possui 27 colunas A:AA. O template de 30 colunas é somente fonte visual.

## 6. Supabase e permissões

- [`reference/SUPABASE_DATA_DICTIONARY.md`](reference/SUPABASE_DATA_DICTIONARY.md)
- [`reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](reference/SUPABASE_FUNCTIONAL_COVERAGE.md)
- [`reference/SUPABASE_INTEGRATION_AUDIT.md`](reference/SUPABASE_INTEGRATION_AUDIT.md)
- [`reference/SUPABASE_PERMISSIONS_MATRIX.md`](reference/SUPABASE_PERMISSIONS_MATRIX.md)
- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md)
- [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md)

Procedimentos históricos restritos:

- [`runbooks/SUPABASE_AUTH_BOOTSTRAP.md`](runbooks/SUPABASE_AUTH_BOOTSTRAP.md);
- [`runbooks/SUPABASE_DATA_BOOTSTRAP.md`](runbooks/SUPABASE_DATA_BOOTSTRAP.md).

## 7. Catálogos de produto

- [`reference/PRODUCT_SURFACE_CATALOG.md`](reference/PRODUCT_SURFACE_CATALOG.md)
- [`reference/PRODUCT_DECISIONS.md`](reference/PRODUCT_DECISIONS.md)
- [`reference/CHANGE_CLASSIFICATION.md`](reference/CHANGE_CLASSIFICATION.md)
- [`reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md`](reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md)

## 8. Cronologia recente

- PR nº 136 — runtime e assets do Excel SME;
- PR nº 137 — Excel SME de 27 colunas;
- PR nº 138 — Gestão de Equipe, CORS e Auth;
- PR nº 139 — monitor geral de Production;
- PR nº 140 — incidentes automáticos;
- PR nº 141 — integridade dos dados, ainda em rascunho;
- PR nº 142 — reconciliação documental integral, integrada e publicada;
- branch atual — matriz funcional executável.

## 9. Decisões centrais

- [`decisions/ADR-040-garantia-operacional-contínua.md`](decisions/ADR-040-garantia-operacional-contínua.md)
- [`decisions/ADR-041-confiabilidade-funcional-ponta-a-ponta.md`](decisions/ADR-041-confiabilidade-funcional-ponta-a-ponta.md)
- [`decisions/ADR-042-reconciliacao-documental-remota.md`](decisions/ADR-042-reconciliacao-documental-remota.md)

## 10. Evidências recentes

- [`audits/2026-08-05-reconciliacao-documental-integral.md`](audits/2026-08-05-reconciliacao-documental-integral.md)
- [`evidence/excel-certification/synthetic-manifest.json`](evidence/excel-certification/synthetic-manifest.json)
- [`audits/2026-07-30-backup-restore-disposable.md`](audits/2026-07-30-backup-restore-disposable.md)
- [`audits/2026-07-30-node24-gate-remoto-perfis-viewports.md`](audits/2026-07-30-node24-gate-remoto-perfis-viewports.md)
- [`audits/2026-07-29-reconciliacao-migration-sme-evidencias.md`](audits/2026-07-29-reconciliacao-migration-sme-evidencias.md)

Evidência datada não substitui o estado corrente.

## 11. Sequência

```text
reconciliação documental                         concluída
→ matriz funcional executável                   em andamento
→ smoke autenticado de leitura
→ escrita controlada, releitura e compensação
→ decisões/correções derivadas
→ integridade contínua dos dados
→ UAT e liberação
```

## 12. Regra de manutenção

Mudança funcional material deve atualizar o código, a operação correspondente na matriz, a evidência, os testes, o roadmap e o estado de publicação.

Planos e auditorias históricos não são reescritos para parecer atuais.
