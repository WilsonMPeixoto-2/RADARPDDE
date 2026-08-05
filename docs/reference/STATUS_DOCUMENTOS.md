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
| **Procedimento histórico restrito** | somente novo ambiente ou recuperação formal |
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
| `AGENTS.md` | regras permanentes |
| `README.md` | visão executiva |
| `docs/CURRENT_STAGE.md` | estado e sequência |
| `docs/PROJECT_CONTEXT.md` | domínio e arquitetura |
| `docs/ROADMAP_ATUALIZACOES_2026.md` | prioridades e portfólio |
| `docs/DECISION_LOG.md` | decisões acumuladas |
| `docs/README.md` | índice documental |
| `docs/reference/STATUS_DOCUMENTOS.md` | validade dos arquivos |

## 5. Referências vigentes

### Arquitetura

| Documento | Contrato |
|---|---|
| `docs/architecture/README.md` | índice arquitetural |
| `docs/architecture/competencias.md` | competência global |
| `docs/architecture/avaliacao-mensal.md` | avaliação mensal |
| `docs/architecture/modelo-operacional.md` | projeção compartilhada |
| `docs/architecture/timeline-unidade.md` | timeline |
| `docs/architecture/navigation-contextual.md` | navegação e retorno |
| `docs/architecture/testing.md` | testes e gates |
| `docs/architecture/supabase-readiness.md` | prontidão do backend |
| `docs/architecture/excel-export.md` | relatório institucional |
| `docs/architecture/excel-xlsx-runtime.md` | runtime das exportações |
| `docs/architecture/excel-sme-mensal.md` | Excel SME de 27 colunas |
| `docs/architecture/excel-integral-certification.md` | certificação Excel/OOXML |

### Supabase e produto

| Documento | Contrato |
|---|---|
| `docs/reference/SUPABASE_DATA_DICTIONARY.md` | entidades e campos |
| `docs/reference/SUPABASE_FUNCTIONAL_COVERAGE.md` | cobertura funcional |
| `docs/reference/SUPABASE_INTEGRATION_AUDIT.md` | integração frontend–backend |
| `docs/reference/SUPABASE_PERMISSIONS_MATRIX.md` | papéis e escopos |
| `docs/reference/PRODUCT_SURFACE_CATALOG.md` | superfícies do produto |
| `docs/reference/PRODUCT_DECISIONS.md` | decisões funcionais |
| `docs/reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md` | ambientes e classes de dados |

## 6. Procedimentos

| Documento | Classe | Situação |
|---|---|---|
| `docs/runbooks/SUPABASE_CONNECTION.md` | Runbook vigente | conexão e diagnóstico remoto |
| `docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md` | Runbook vigente | migrations, backup, importação e rollback |
| `docs/runbooks/SUPABASE_AUTH_BOOTSTRAP.md` | Procedimento histórico restrito | primeiro administrador ou recuperação formal |
| `docs/runbooks/SUPABASE_DATA_BOOTSTRAP.md` | Procedimento histórico restrito | carga inicial já concluída |

## 7. Decisões recentes

| Documento | Uso |
|---|---|
| `docs/decisions/ADR-035-node24-e-gate-remoto.md` | Node 24 e matriz perfil/viewport |
| `docs/decisions/ADR-036-backup-restauracao-e-recurso-pago-auth.md` | recuperação e recurso dependente de plano |
| `docs/decisions/ADR-037-integridade-de-referencias-dos-workflows.md` | referências de workflows |
| `docs/decisions/ADR-038-atualizacoes-com-integracao-pertinente.md` | atualizações intencionais |
| `docs/decisions/ADR-039-evolucao-tecnologica-proativa.md` | avaliação tecnológica |
| `docs/decisions/ADR-040-garantia-operacional-contínua.md` | monitor e incidentes |
| `docs/decisions/ADR-041-confiabilidade-funcional-ponta-a-ponta.md` | critério funcional |
| `docs/decisions/ADR-042-reconciliacao-documental-remota.md` | precedência documental |

Os ADRs 040 a 042 pertencem à branch documental até eventual integração.

## 8. Evidências recentes

| Documento | Uso |
|---|---|
| `docs/audits/2026-08-05-reconciliacao-documental-integral.md` | baseline remoto desta revisão |
| `docs/evidence/excel-certification/synthetic-manifest.json` | contrato do Excel SME |
| `docs/audits/2026-07-30-backup-restore-disposable.md` | restauração equivalente |
| `docs/audits/2026-07-30-node24-gate-remoto-perfis-viewports.md` | runtime e matriz remota |
| `docs/audits/2026-07-29-reconciliacao-migration-sme-evidencias.md` | histórico de migration |

Evidência datada não prova permanência do ambiente.

## 9. PRs recentes

| PR | Classe | Estado |
|---:|---|---|
| nº 136 | histórico executado + evidência | integrado e publicado |
| nº 137 | histórico executado + evidência | integrado e publicado |
| nº 138 | histórico executado + evidência | integrado e publicado |
| nº 139 | histórico executado + evidência | integrado e publicado |
| nº 140 | histórico executado + evidência | integrado e publicado |
| nº 141 | trabalho em andamento | não integrado e não aplicado |

## 10. Contratos executáveis

| Arquivo | Contrato |
|---|---|
| `package.json` e `package-lock.json` | versões e scripts |
| `.nvmrc` e `.node-version` | Node 24 |
| `src/data/repository-contract.js` | persistência |
| `src/data/supabase-repository.js` | integração remota |
| `src/application/team-account-gateway.js` | Gestão de Equipe |
| `supabase/functions/team-account-management/` | contas server-side |
| `.github/workflows/production-system-smoke.yml` | monitor e incidentes |
| `.github/workflows/gate-remoto-perfis-viewports.yml` | Auth/RLS e dispositivos |
| `.github/workflows/backup-restore-disposable.yml` | restauração |
| `.github/workflows/excel-sme-homologation.yml` | homologação do Excel SME |
| `scripts/build-vercel.mjs` | artefato e manifestos |
| `tests/` e `supabase/tests/` | regressões e pgTAP |

## 11. Afirmações superadas

Não usar como estado presente:

- Excel SME público com 30 colunas;
- `SISTEMÁTICA PREENCHIDA` exportada;
- incidente 404 do template ainda aberto;
- PR nº 133 como próxima ação;
- deployment anterior como vigente;
- `app_config.row_version = 5` como valor atual;
- Gestão de Equipe sem correção de CORS/Auth;
- ausência de monitoramento contínuo;
- 26 migrations em Production antes do PR nº 141;
- Playwright 1.62.0, Node 24, backup ou gate remoto como pendentes;
- bootstrap inicial como procedimento cotidiano.

## 12. Documentos históricos

Planos, specs, relatórios e auditorias datados são históricos ou evidências, salvo classificação expressa.

- não tratá-los como estado atual;
- não reescrevê-los retrospectivamente;
- confrontá-los com código e ambientes;
- classificar arquivo de PR aberto como trabalho em andamento.

## 13. Precedência

1. código, migrations e contratos executáveis;
2. Supabase e Vercel efetivos;
3. documentos canônicos;
4. decisões e referências vigentes;
5. evidências do mesmo SHA;
6. históricos.

## 14. Regra de manutenção

Mudança material atualiza contrato, teste, documentação canônica, roadmap, evidência, validade documental e estado de publicação.
