# Matriz de validade documental

**Atualizado em:** 5 de agosto de 2026

## 1. Finalidade

Definir quais arquivos controlam o estado atual e quais permanecem como referência, procedimento, evidência ou histórico.

## 2. Classificações

| Classe | Significado |
|---|---|
| **Canônico** | controla estado, prioridade ou regra vigente |
| **Referência vigente** | descreve contrato técnico ou funcional atual |
| **Runbook vigente** | procedimento operacional autorizado |
| **Decisão vigente** | regra duradoura aprovada |
| **Evidência** | comprova execução ou validação específica |
| **Trabalho em andamento** | pertence a branch ou PR ainda não integrado |
| **Histórico executado** | plano ou relatório preservado após execução |
| **Superado** | não usar para orientar o estado presente |

## 3. Baseline remoto

```text
main: f812e5dbf3aaa18fb9851948445b0820ac7a5435
Production: dpl_7G3Wmh1YiV4c4aXVwe2P5tN7N7Y4 — READY
Supabase: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
migrations em Production: 25
PR #141: aberto em rascunho, não integrado
```

## 4. Fontes canônicas

| Documento | Uso |
|---|---|
| `AGENTS.md` | regras permanentes para agentes e execução |
| `README.md` | visão executiva do produto |
| `docs/CURRENT_STAGE.md` | estado, ambientes e próxima sequência |
| `docs/PROJECT_CONTEXT.md` | domínio e arquitetura |
| `docs/ROADMAP_ATUALIZACOES_2026.md` | prioridades e portfólio |
| `docs/DECISION_LOG.md` | decisões acumuladas |
| `docs/README.md` | índice documental |
| `docs/reference/STATUS_DOCUMENTOS.md` | classificação dos documentos |

## 5. Referências vigentes

### Arquitetura

| Documento | Contrato |
|---|---|
| `docs/architecture/README.md` | índice arquitetural |
| `docs/architecture/competencias.md` | competência global |
| `docs/architecture/avaliacao-mensal.md` | avaliação por escola, mês e programa |
| `docs/architecture/modelo-operacional.md` | projeção compartilhada |
| `docs/architecture/timeline-unidade.md` | timeline derivada |
| `docs/architecture/navigation-contextual.md` | navegação e retorno |
| `docs/architecture/testing.md` | testes e gates |
| `docs/architecture/supabase-readiness.md` | prontidão do backend |
| `docs/architecture/excel-export.md` | relatório institucional |
| `docs/architecture/excel-sme-mensal.md` | Excel SME de 27 colunas |
| `docs/architecture/excel-integral-certification.md` | certificação Excel/OOXML |

### Supabase e produto

| Documento | Contrato |
|---|---|
| `docs/reference/SUPABASE_DATA_DICTIONARY.md` | entidades e campos |
| `docs/reference/SUPABASE_FUNCTIONAL_COVERAGE.md` | fluxos cobertos pelo backend |
| `docs/reference/SUPABASE_INTEGRATION_AUDIT.md` | auditoria atual da integração |
| `docs/reference/SUPABASE_PERMISSIONS_MATRIX.md` | papéis, ações e escopos |
| `docs/reference/PRODUCT_SURFACE_CATALOG.md` | superfícies do produto |
| `docs/reference/PRODUCT_DECISIONS.md` | decisões funcionais consolidadas |
| `docs/reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md` | ambientes e classes de dados |

## 6. Runbooks vigentes e existentes

| Documento | Situação |
|---|---|
| `docs/runbooks/SUPABASE_CONNECTION.md` | vigente; conexão e diagnóstico remoto |
| `docs/runbooks/SUPABASE_AUTH_BOOTSTRAP.md` | vigente; Auth, perfis e escopos |
| `docs/runbooks/SUPABASE_DATA_BOOTSTRAP.md` | vigente; importação e reconciliação |
| `docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md` | vigente; migrations e rollback |

Referências antigas a runbooks que não existem nessa árvore não devem ser usadas.

## 7. Decisões vigentes recentes

| Documento | Uso |
|---|---|
| `docs/decisions/ADR-035-node24-e-gate-remoto.md` | Node 24 e matriz perfil/viewport |
| `docs/decisions/ADR-036-backup-restauracao-e-recurso-pago-auth.md` | recuperação e recurso dependente de plano |
| `docs/decisions/ADR-037-integridade-de-referencias-dos-workflows.md` | referências de workflows |
| `docs/decisions/ADR-038-atualizacoes-com-integracao-pertinente.md` | atualizações intencionais |
| `docs/decisions/ADR-039-evolucao-tecnologica-proativa.md` | avaliação tecnológica |
| `docs/decisions/ADR-040-garantia-operacional-contínua.md` | monitor e incidentes de Production |
| `docs/decisions/ADR-041-confiabilidade-funcional-ponta-a-ponta.md` | critério de conclusão funcional |
| `docs/decisions/ADR-042-reconciliacao-documental-remota.md` | baseline e precedência documental |

Os ADRs 040 a 042 pertencem à branch documental até eventual integração.

## 8. Evidências recentes

| Documento | Classe | Uso |
|---|---|---|
| `docs/audits/2026-08-05-reconciliacao-documental-integral.md` | Evidência | baseline GitHub/Vercel/Supabase |
| `docs/evidence/excel-certification/synthetic-manifest.json` | Evidência gerada | contrato atual do Excel SME |
| `docs/audits/2026-07-30-backup-restore-disposable.md` | Evidência | restauração equivalente |
| `docs/audits/2026-07-30-node24-gate-remoto-perfis-viewports.md` | Evidência | runtime e matriz remota |
| `docs/audits/2026-07-29-reconciliacao-migration-sme-evidencias.md` | Evidência | histórico de migration reconciliado |

Evidência datada não prova que o ambiente permaneceu igual. Sempre confrontar com o baseline atual.

## 9. Cronologia dos PRs recentes

| PR | Classe documental | Estado funcional |
|---:|---|---|
| nº 136 | histórico executado + evidências | integrado e publicado |
| nº 137 | histórico executado + evidências | integrado e publicado |
| nº 138 | histórico executado + evidências | integrado e publicado |
| nº 139 | histórico executado + evidências | integrado e publicado |
| nº 140 | histórico executado + evidências | integrado e publicado |
| nº 141 | trabalho em andamento | não integrado e não aplicado em Production |

## 10. Contratos executáveis

| Arquivo | Contrato |
|---|---|
| `package.json` e `package-lock.json` | versões e comandos reproduzíveis |
| `.nvmrc` e `.node-version` | Node 24 |
| `src/data/repository-contract.js` | contrato de persistência |
| `src/data/supabase-repository.js` | integração remota |
| `src/application/team-account-gateway.js` | fronteira da Gestão de Equipe |
| `supabase/functions/team-account-management/` | operação server-side de contas |
| `.github/workflows/production-system-smoke.yml` | monitor geral e incidentes |
| `.github/workflows/gate-remoto-perfis-viewports.yml` | matriz Auth/RLS e dispositivos |
| `.github/workflows/backup-restore-disposable.yml` | restauração descartável |
| `.github/workflows/excel-sme-homologation.yml` | homologação automatizada do Excel SME |
| `scripts/build-vercel.mjs` | artefato público e manifestos |
| `tests/` e `supabase/tests/` | regressões unitárias, E2E e pgTAP |

## 11. Afirmações superadas

Não usar como estado presente:

- Excel SME público com 30 colunas;
- `SISTEMÁTICA PREENCHIDA` como coluna exportada;
- incidente HTTP 404 do template como aberto;
- PR nº 133 como próxima ação;
- deployments anteriores ao `dpl_7G3W...` como vigentes;
- `app_config.row_version = 5`;
- Gestão de Equipe sem correção de CORS e Auth;
- ausência de monitoramento contínuo de Production;
- 26 migrations como estado de Production antes da integração/aplicação do PR nº 141;
- Playwright 1.62.0 como alteração ainda não integrada;
- Node 24, backup/restauração ou gate perfil/viewport como pendentes.

## 12. Documentos históricos

Arquivos em `docs/plans/`, `docs/reports/`, `docs/superpowers/plans/`, `docs/superpowers/specs/` e auditorias datadas são históricos ou evidências, salvo classificação expressa em contrário.

- não tratá-los como prova de implementação atual;
- não reescrevê-los retrospectivamente;
- confrontá-los com código, banco, deployment e documentação canônica;
- classificar planos de PR aberto como trabalho em andamento.

## 13. Precedência

1. código, migrations e contratos executáveis da referência analisada;
2. Supabase e Vercel efetivos;
3. documentos canônicos;
4. decisões e referências vigentes;
5. evidências do mesmo SHA;
6. documentos históricos.

## 14. Regra de manutenção

Mudança material deve atualizar:

- contrato executável;
- teste de regressão;
- documentos canônicos afetados;
- roadmap;
- evidência;
- classificação documental;
- estado de integração e publicação.
