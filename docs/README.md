# Documentação do RADAR PDDE

**Estado de referência:** 5 de agosto de 2026

Este diretório separa estado corrente, contratos vigentes, decisões, runbooks, planos e evidências históricas.

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

1. [`../AGENTS.md`](../AGENTS.md) — regras permanentes de execução;
2. [`CURRENT_STAGE.md`](CURRENT_STAGE.md) — estado, ambientes e sequência;
3. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — produto e arquitetura;
4. [`ROADMAP_ATUALIZACOES_2026.md`](ROADMAP_ATUALIZACOES_2026.md) — prioridades e portfólio;
5. [`DECISION_LOG.md`](DECISION_LOG.md) — decisões duradouras;
6. [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md) — validade dos arquivos;
7. [`architecture/README.md`](architecture/README.md) — contratos por área;
8. [`audits/2026-08-05-reconciliacao-documental-integral.md`](audits/2026-08-05-reconciliacao-documental-integral.md) — baseline desta reconciliação.

## 3. Documentos canônicos

- [`CURRENT_STAGE.md`](CURRENT_STAGE.md)
- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md)
- [`ROADMAP_ATUALIZACOES_2026.md`](ROADMAP_ATUALIZACOES_2026.md)
- [`DECISION_LOG.md`](DECISION_LOG.md)
- [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md)
- [`../README.md`](../README.md)
- [`../AGENTS.md`](../AGENTS.md)

## 4. Arquitetura vigente

### Produto e fluxo

- [`architecture/competencias.md`](architecture/competencias.md)
- [`architecture/avaliacao-mensal.md`](architecture/avaliacao-mensal.md)
- [`architecture/modelo-operacional.md`](architecture/modelo-operacional.md)
- [`architecture/timeline-unidade.md`](architecture/timeline-unidade.md)
- [`architecture/navigation-contextual.md`](architecture/navigation-contextual.md)
- [`architecture/testing.md`](architecture/testing.md)

### Frontend e integração

- [`architecture/frontend-load-order.md`](architecture/frontend-load-order.md)
- [`architecture/product-extensions-load-order.md`](architecture/product-extensions-load-order.md)
- [`architecture/supabase-readiness.md`](architecture/supabase-readiness.md)

### Excel

- [`architecture/excel-export.md`](architecture/excel-export.md)
- [`architecture/excel-workbook-plan.md`](architecture/excel-workbook-plan.md)
- [`architecture/excel-xlsx-runtime.md`](architecture/excel-xlsx-runtime.md)
- [`architecture/excel-sme-mensal.md`](architecture/excel-sme-mensal.md)
- [`architecture/excel-integral-certification.md`](architecture/excel-integral-certification.md)

O Excel SME público possui 27 colunas A:AA. O template-fonte de 30 colunas é apenas base visual.

## 5. Supabase e permissões

- [`reference/SUPABASE_DATA_DICTIONARY.md`](reference/SUPABASE_DATA_DICTIONARY.md)
- [`reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](reference/SUPABASE_FUNCTIONAL_COVERAGE.md)
- [`reference/SUPABASE_INTEGRATION_AUDIT.md`](reference/SUPABASE_INTEGRATION_AUDIT.md)
- [`reference/SUPABASE_PERMISSIONS_MATRIX.md`](reference/SUPABASE_PERMISSIONS_MATRIX.md)
- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md)
- [`runbooks/SUPABASE_AUTH_BOOTSTRAP.md`](runbooks/SUPABASE_AUTH_BOOTSTRAP.md)
- [`runbooks/SUPABASE_DATA_BOOTSTRAP.md`](runbooks/SUPABASE_DATA_BOOTSTRAP.md)
- [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md)

A lista acima corresponde aos arquivos efetivamente existentes. Referências antigas a runbooks inexistentes foram removidas.

## 6. Catálogos de produto

- [`reference/PRODUCT_SURFACE_CATALOG.md`](reference/PRODUCT_SURFACE_CATALOG.md)
- [`reference/PRODUCT_DECISIONS.md`](reference/PRODUCT_DECISIONS.md)
- [`reference/CHANGE_CLASSIFICATION.md`](reference/CHANGE_CLASSIFICATION.md)
- [`reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md`](reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md)

## 7. Correções e garantias recentes

### Excel SME

- PR nº 136 — runtime, assets e botões no dashboard da Assistente;
- PR nº 137 — 27 colunas, designação textual, bordas e cabeçalho;
- [`architecture/excel-sme-mensal.md`](architecture/excel-sme-mensal.md).

### Gestão de Equipe

- PR nº 138 — CORS, Auth, vínculos históricos, cadastro, edição, redistribuição e desativação;
- [`reference/SUPABASE_PERMISSIONS_MATRIX.md`](reference/SUPABASE_PERMISSIONS_MATRIX.md).

### Monitoramento de Production

- PR nº 139 — monitor geral;
- PR nº 140 — incidentes automáticos;
- planos históricos:
  - [`superpowers/plans/2026-08-04-garantia-operacional-production-fase-1.md`](superpowers/plans/2026-08-04-garantia-operacional-production-fase-1.md), quando existente no repositório;
  - [`superpowers/plans/2026-08-04-alertas-incidentes-production.md`](superpowers/plans/2026-08-04-alertas-incidentes-production.md).

### Integridade dos dados

O PR nº 141 permanece em andamento. Seu plano e seus contratos pertencem à branch do PR até eventual integração.

## 8. Runbooks operacionais existentes

| Documento | Finalidade |
|---|---|
| [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md) | conexão, estado remoto e validação |
| [`runbooks/SUPABASE_AUTH_BOOTSTRAP.md`](runbooks/SUPABASE_AUTH_BOOTSTRAP.md) | identidades, perfis e escopos |
| [`runbooks/SUPABASE_DATA_BOOTSTRAP.md`](runbooks/SUPABASE_DATA_BOOTSTRAP.md) | importação inicial e reconciliação |
| [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md) | migrations, dry-run, aplicação e rollback |

## 9. Evidências atuais

- [`audits/2026-08-05-reconciliacao-documental-integral.md`](audits/2026-08-05-reconciliacao-documental-integral.md)
- [`evidence/excel-certification/synthetic-manifest.json`](evidence/excel-certification/synthetic-manifest.json)
- [`audits/2026-07-30-backup-restore-disposable.md`](audits/2026-07-30-backup-restore-disposable.md)
- [`audits/2026-07-30-node24-gate-remoto-perfis-viewports.md`](audits/2026-07-30-node24-gate-remoto-perfis-viewports.md)
- [`audits/2026-07-29-reconciliacao-migration-sme-evidencias.md`](audits/2026-07-29-reconciliacao-migration-sme-evidencias.md)

Evidência datada comprova o evento correspondente; não substitui o estado corrente.

## 10. Prioridade documental e funcional

```text
reconciliação documental
→ matriz funcional por perfil/tela/ação
→ smoke autenticado de leitura
→ provas controladas de escrita e compensação
→ integridade contínua dos dados
→ atualizações menores
→ UAT e liberação
```

## 11. Regra de atualização

Mudança material deve atualizar no mesmo ciclo:

- código ou contrato executável;
- teste de regressão;
- documentos canônicos afetados;
- roadmap;
- evidência do mesmo SHA;
- matriz de validade documental;
- estado de integração e publicação.

Planos e auditorias históricas não são reescritos para parecer atuais. Quando superados, recebem classificação explícita e apontam para a fonte vigente.
