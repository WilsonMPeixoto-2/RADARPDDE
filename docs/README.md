# Documentação do RADAR PDDE

**Estado de referência:** 5 de agosto de 2026

Este diretório separa estado corrente, contratos vigentes, decisões, procedimentos restritos, planos e evidências históricas.

## 1. Baseline atual

```text
main: f812e5dbf3aaa18fb9851948445b0820ac7a5435
Production: dpl_7G3Wmh1YiV4c4aXVwe2P5tN7N7Y4 — READY
commit publicado: f812e5dbf3aaa18fb9851948445b0820ac7a5435
Supabase: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
PostgreSQL: 17.6.1.147
migrations em Production: 25
Edge Function: team-account-management v95, ACTIVE, JWT obrigatório
```

O PR nº 141 está aberto em rascunho e não integra esse baseline.

## 2. Ordem de leitura

1. [`../AGENTS.md`](../AGENTS.md);
2. [`CURRENT_STAGE.md`](CURRENT_STAGE.md);
3. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md);
4. [`ROADMAP_ATUALIZACOES_2026.md`](ROADMAP_ATUALIZACOES_2026.md);
5. [`DECISION_LOG.md`](DECISION_LOG.md);
6. [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md);
7. [`architecture/README.md`](architecture/README.md);
8. [`audits/2026-08-05-reconciliacao-documental-integral.md`](audits/2026-08-05-reconciliacao-documental-integral.md).

## 3. Documentos canônicos

- [`CURRENT_STAGE.md`](CURRENT_STAGE.md)
- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md)
- [`ROADMAP_ATUALIZACOES_2026.md`](ROADMAP_ATUALIZACOES_2026.md)
- [`DECISION_LOG.md`](DECISION_LOG.md)
- [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md)
- [`../README.md`](../README.md)
- [`../AGENTS.md`](../AGENTS.md)

## 4. Arquitetura vigente

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

O Excel SME público possui 27 colunas A:AA. O template-fonte de 30 colunas é somente base visual.

## 5. Referências Supabase

- [`reference/SUPABASE_DATA_DICTIONARY.md`](reference/SUPABASE_DATA_DICTIONARY.md)
- [`reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](reference/SUPABASE_FUNCTIONAL_COVERAGE.md)
- [`reference/SUPABASE_INTEGRATION_AUDIT.md`](reference/SUPABASE_INTEGRATION_AUDIT.md)
- [`reference/SUPABASE_PERMISSIONS_MATRIX.md`](reference/SUPABASE_PERMISSIONS_MATRIX.md)

## 6. Procedimentos Supabase

### Runbooks vigentes

- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md)
- [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md)

### Procedimentos históricos e restritos

- [`runbooks/SUPABASE_AUTH_BOOTSTRAP.md`](runbooks/SUPABASE_AUTH_BOOTSTRAP.md) — somente novo projeto, recuperação formal ou reconciliação autorizada;
- [`runbooks/SUPABASE_DATA_BOOTSTRAP.md`](runbooks/SUPABASE_DATA_BOOTSTRAP.md) — carga inicial já concluída; não usar como rotina de Production.

## 7. Catálogos de produto

- [`reference/PRODUCT_SURFACE_CATALOG.md`](reference/PRODUCT_SURFACE_CATALOG.md)
- [`reference/PRODUCT_DECISIONS.md`](reference/PRODUCT_DECISIONS.md)
- [`reference/CHANGE_CLASSIFICATION.md`](reference/CHANGE_CLASSIFICATION.md)
- [`reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md`](reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md)

## 8. Correções recentes

### Excel SME

- PR nº 136 — runtime, assets e botões no dashboard da Assistente;
- PR nº 137 — 27 colunas, designação textual, bordas e cabeçalho;
- [`architecture/excel-sme-mensal.md`](architecture/excel-sme-mensal.md).

### Gestão de Equipe

- PR nº 138 — CORS, Auth, vínculos históricos, cadastro, edição, redistribuição e desativação;
- [`reference/SUPABASE_PERMISSIONS_MATRIX.md`](reference/SUPABASE_PERMISSIONS_MATRIX.md).

### Monitoramento

- PR nº 139 — monitor geral;
- PR nº 140 — incidentes automáticos;
- [`superpowers/plans/2026-08-04-monitoramento-production-fase-1.md`](superpowers/plans/2026-08-04-monitoramento-production-fase-1.md);
- [`superpowers/plans/2026-08-04-alertas-incidentes-production.md`](superpowers/plans/2026-08-04-alertas-incidentes-production.md).

### Integridade dos dados

O PR nº 141 permanece em andamento. Seus arquivos não são tratados como documentação integrada enquanto o PR estiver aberto.

## 9. Decisões recentes

- [`decisions/ADR-040-garantia-operacional-contínua.md`](decisions/ADR-040-garantia-operacional-contínua.md)
- [`decisions/ADR-041-confiabilidade-funcional-ponta-a-ponta.md`](decisions/ADR-041-confiabilidade-funcional-ponta-a-ponta.md)
- [`decisions/ADR-042-reconciliacao-documental-remota.md`](decisions/ADR-042-reconciliacao-documental-remota.md)

Esses três ADRs pertencem à branch documental até eventual integração.

## 10. Evidências atuais

- [`audits/2026-08-05-reconciliacao-documental-integral.md`](audits/2026-08-05-reconciliacao-documental-integral.md)
- [`evidence/excel-certification/synthetic-manifest.json`](evidence/excel-certification/synthetic-manifest.json)
- [`audits/2026-07-30-backup-restore-disposable.md`](audits/2026-07-30-backup-restore-disposable.md)
- [`audits/2026-07-30-node24-gate-remoto-perfis-viewports.md`](audits/2026-07-30-node24-gate-remoto-perfis-viewports.md)
- [`audits/2026-07-29-reconciliacao-migration-sme-evidencias.md`](audits/2026-07-29-reconciliacao-migration-sme-evidencias.md)

Evidência datada não substitui o estado corrente.

## 11. Prioridade

```text
reconciliação documental
→ matriz funcional por perfil/tela/ação
→ smoke autenticado de leitura
→ provas controladas de escrita e compensação
→ integridade contínua dos dados
→ atualizações menores
→ UAT e liberação
```

## 12. Regra de manutenção

Mudança material deve atualizar código, teste, documentos canônicos, roadmap, evidência, validade documental e estado de publicação.

Planos e auditorias históricos não são reescritos para parecer atuais; recebem classificação e apontam para a fonte vigente.
