# Documentação do RADAR PDDE

**Estado de referência:** 5 de agosto de 2026

## 1. Baseline

```text
main: 30bdecc1116bbcd007448d21db57326b28d9a003
Vercel Production: dpl_FZe29TXs9DXeJSLg3bQCsgrgrinW — READY
commit público: 2e7b18ffa4b81300cf44c96ffde9c222cf98b895
Supabase: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
PostgreSQL: 17.6.1.147
migrations em Production: 26
Edge Function: team-account-management v95, ACTIVE, JWT obrigatório
```

O PR nº 141 foi integrado e a migration de integridade foi aplicada. O frontend público permanece no commit do PR nº 142 porque a mudança posterior não alterou a interface.

## 2. Ordem de leitura

1. [`../AGENTS.md`](../AGENTS.md);
2. [`CURRENT_STAGE.md`](CURRENT_STAGE.md);
3. [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md);
4. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md);
5. [`ROADMAP_ATUALIZACOES_2026.md`](ROADMAP_ATUALIZACOES_2026.md);
6. [`DECISION_LOG.md`](DECISION_LOG.md);
7. [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md);
8. [`architecture/README.md`](architecture/README.md).

## 3. Matriz funcional ponta a ponta

### Fonte executável

- [`reference/functional-contract-matrix.json`](reference/functional-contract-matrix.json);
- `reference/functional-contract-matrix/*.json`;
- [`../scripts/check-functional-contract-matrix.mjs`](../scripts/check-functional-contract-matrix.mjs);
- [`../tests/unit/functional-contract-matrix.test.js`](../tests/unit/functional-contract-matrix.test.js);
- [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md) — visão gerada.

```bash
npm run generate:functional-matrix
npm run check:functional-matrix
```

A matriz contém 41 operações e integra o readiness. Ela bloqueia referências quebradas, perfis incoerentes, permissões incompletas e mutações críticas sem releitura, concorrência ou compensação.

## 4. Documentos canônicos

- [`CURRENT_STAGE.md`](CURRENT_STAGE.md)
- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md)
- [`ROADMAP_ATUALIZACOES_2026.md`](ROADMAP_ATUALIZACOES_2026.md)
- [`DECISION_LOG.md`](DECISION_LOG.md)
- [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md)
- [`../README.md`](../README.md)
- [`../AGENTS.md`](../AGENTS.md)

## 5. Arquitetura

### Produto

- [`architecture/competencias.md`](architecture/competencias.md)
- [`architecture/avaliacao-mensal.md`](architecture/avaliacao-mensal.md)
- [`architecture/modelo-operacional.md`](architecture/modelo-operacional.md)
- [`architecture/timeline-unidade.md`](architecture/timeline-unidade.md)
- [`architecture/navigation-contextual.md`](architecture/navigation-contextual.md)
- [`architecture/testing.md`](architecture/testing.md)

### Frontend, Supabase e Excel

- [`architecture/frontend-load-order.md`](architecture/frontend-load-order.md)
- [`architecture/product-extensions-load-order.md`](architecture/product-extensions-load-order.md)
- [`architecture/supabase-readiness.md`](architecture/supabase-readiness.md)
- [`architecture/excel-export.md`](architecture/excel-export.md)
- [`architecture/excel-xlsx-runtime.md`](architecture/excel-xlsx-runtime.md)
- [`architecture/excel-sme-mensal.md`](architecture/excel-sme-mensal.md)
- [`architecture/excel-integral-certification.md`](architecture/excel-integral-certification.md)

## 6. Supabase e permissões

- [`reference/SUPABASE_DATA_DICTIONARY.md`](reference/SUPABASE_DATA_DICTIONARY.md)
- [`reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](reference/SUPABASE_FUNCTIONAL_COVERAGE.md)
- [`reference/SUPABASE_INTEGRATION_AUDIT.md`](reference/SUPABASE_INTEGRATION_AUDIT.md)
- [`reference/SUPABASE_PERMISSIONS_MATRIX.md`](reference/SUPABASE_PERMISSIONS_MATRIX.md)
- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md)
- [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md)

## 7. Garantias operacionais

- PR nº 139 — monitor geral de Production;
- PR nº 140 — incidentes automáticos;
- PR nº 141 — auditoria agregada de vinte invariantes;
- PR nº 142 — reconciliação documental;
- Excel SME — 27 colunas, manifesto, OOXML e homologação desktop;
- Gestão de Equipe — CORS, Auth, RPC e compensação;
- backup/restauração descartáveis;
- gate por perfil e viewport.

## 8. Decisões centrais

- [`decisions/ADR-040-garantia-operacional-contínua.md`](decisions/ADR-040-garantia-operacional-contínua.md)
- [`decisions/ADR-041-confiabilidade-funcional-ponta-a-ponta.md`](decisions/ADR-041-confiabilidade-funcional-ponta-a-ponta.md)
- [`decisions/ADR-042-reconciliacao-documental-remota.md`](decisions/ADR-042-reconciliacao-documental-remota.md)

## 9. Sequência

```text
reconciliação documental                         concluída
→ integridade contínua dos dados                concluída
→ matriz funcional executável                   em andamento
→ smoke autenticado de leitura
→ escrita controlada, releitura e compensação
→ decisões e correções derivadas
→ UAT e liberação
```

## 10. Regra de manutenção

Mudança funcional material deve atualizar código, operação correspondente na matriz, evidência, testes, roadmap e estado de publicação. Planos históricos não são reescritos para parecer atuais.
