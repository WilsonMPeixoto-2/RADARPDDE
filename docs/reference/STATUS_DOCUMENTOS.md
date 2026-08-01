# Matriz de validade documental

**Atualizado em:** 1º de agosto de 2026

## 1. Finalidade

Definir quais arquivos controlam o estado presente e quais permanecem apenas como histórico, evidência ou apoio.

## 2. Classificações

| Classe | Significado |
|---|---|
| **Canônico** | controla o estado atual e deve ser atualizado quando o produto muda |
| **Runbook vigente** | procedimento operacional autorizado |
| **Referência vigente** | contrato técnico ou funcional consultivo |
| **Evidência** | comprova execução, auditoria ou validação específica |
| **Histórico executado** | plano ou relatório preservado após execução |
| **Superado** | não aplicável ao estado atual; não usar como fonte operacional |

## 3. Fontes canônicas atuais

| Documento | Classe | Observação |
|---|---|---|
| `AGENTS.md` | Canônico | regras permanentes |
| `README.md` | Canônico | visão executiva |
| `docs/CURRENT_STAGE.md` | Canônico | estado, gates e bloqueadores |
| `docs/PROJECT_CONTEXT.md` | Canônico | produto, domínio e arquitetura |
| `docs/DECISION_LOG.md` | Canônico | decisões acumuladas |
| `docs/README.md` | Canônico | índice documental |
| `docs/architecture/overview.md` | Referência vigente | arquitetura geral |
| `docs/architecture/data-flow.md` | Referência vigente | fluxo de dados |
| `docs/architecture/supabase.md` | Referência vigente | contratos Supabase |
| `docs/architecture/supabase-readiness.md` | Referência vigente | prontidão e hardening Supabase |
| `docs/architecture/testing.md` | Referência vigente | testes e gates |
| `docs/reference/DATA_DICTIONARY.md` | Referência vigente | entidades e invariantes |
| `docs/reference/SURFACES_CATALOG.md` | Referência vigente | superfícies e capacidades |
| `docs/reference/STATUS_DOCUMENTOS.md` | Canônico | validade documental |

## 4. Runbooks vigentes

| Documento | Situação |
|---|---|
| `docs/runbooks/SUPABASE_CONNECTION.md` | vigente; conexão, migrations e recuperação alinhadas |
| `docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md` | vigente; inclui gate descartável de restauração |
| `docs/runbooks/SUPABASE_REMOTE_PREFLIGHT.md` | vigente |
| `docs/runbooks/MIGRATION_FIREBASE_SUPABASE.md` | vigente para planejamento de migração |
| `docs/runbooks/IMPORT_EXECUTION.md` | vigente quando houver pacote autorizado |
| `docs/runbooks/INCIDENT_RESPONSE.md` | vigente |

## 5. Decisões e evidências atuais

| Documento | Classe | Uso |
|---|---|---|
| `docs/decisions/ADR-036-backup-restauracao-e-recurso-pago-auth.md` | Decisão vigente | gate de recuperação e exclusão de requisito dependente do plano Pro |
| `docs/audits/2026-07-30-backup-restore-disposable.md` | Evidência | restauração equivalente e segurança do artefato |
| `docs/evidence/releases/2026-08-01-excel-sme-production.json` | Evidência | homologação desktop, publicação Production, smokes e ausência de mudança no Supabase |
| `docs/decisions/ADR-035-node24-e-gate-remoto.md` | Decisão vigente | Node 24 e matriz remota |
| `docs/audits/2026-07-30-node24-gate-remoto-perfis-viewports.md` | Evidência | runtime, perfis, viewports e correção móvel |
| `docs/audits/2026-07-29-reconciliacao-migration-sme-evidencias.md` | Evidência | reparo oficial da migration SME |
| `docs/audits/2026-07-29-rastreabilidade-migration-sme.md` | Evidência histórica resolvida | achado original |
| `docs/audits/2026-07-29-alinhamento-documental-integral-pos-pr108.md` | Evidência | reconciliação documental |
| `docs/evidence/excel-certification/synthetic-manifest.json` | Evidência gerada | certificação sintética Excel |

## 6. Contratos executáveis

| Arquivo | Classe | Contrato |
|---|---|---|
| `.nvmrc` | Canônico executável | Node 24 |
| `.node-version` | Canônico executável | Node 24 |
| `package.json` | Canônico executável | runtime e scripts |
| `package-lock.json` | Canônico executável | dependências reproduzíveis |
| `.github/workflows/gate-remoto-perfis-viewports.yml` | Canônico executável | Auth/RLS e matriz papel × viewport |
| `.github/workflows/backup-restore-disposable.yml` | Canônico executável | dump, restauração, equivalência e evidência sanitizada |
| `scripts/verify-supabase-backup-restore.mjs` | Canônico executável | duas pilhas, fingerprints e limpeza |
| `tests/unit/backup-restore-gate-contract.test.js` | Canônico executável | guardas, isolamento e vedação de dumps no artefato |
| `playwright.supabase-preview.config.js` | Canônico executável | Desktop, Pixel 7 e iPhone 15 |
| `tests/e2e/supabase-preview-profile-viewport.spec.js` | Canônico executável | cinco papéis em três viewports |
| `tests/unit/release-hardening-contract.test.js` | Canônico executável | Node, workflow e layout móvel |
| `src/styles/mobile-rendering-hotfix.css` | Canônico executável | perfil e logout sem sobreposição |

## 7. Planos e relatórios históricos

Arquivos em `docs/plans/`, `docs/reports/` e `docs/superpowers/plans/` permanecem históricos salvo indicação expressa.

- não tratá-los como prova de implementação;
- confrontá-los com código, banco, deployment e documentação canônica;
- não reescrever retrospectivamente planos;
- registrar execução e desvios em auditoria própria.

## 8. Documentos e afirmações superados

| Documento ou classe | Motivo |
|---|---|
| bootstraps anteriores à ativação | descrevem preparação, não Production atual |
| migration SME divergente como bloqueador | resolvido em 29 de julho de 2026 |
| faixa Node `>=24 <27` | substituída por `24.x` |
| workflow remoto legado fixo | substituído por Supabase descartável |
| backup/restauração como não testados | gate aprovado em ambiente descartável |
| checagem de credenciais comprometidas como requisito do plano Free | recurso restrito ao plano Pro ou superior; decisão ADR-036 |
| workflows temporários do PR #111 | removidos após validação |

## 9. Regra de precedência

1. código, migrations e testes da `main`;
2. estado efetivo do Supabase e Vercel para dados mutáveis;
3. `CURRENT_STAGE.md`;
4. `PROJECT_CONTEXT.md` e `DECISION_LOG.md`;
5. arquitetura, referências e runbooks vigentes;
6. evidências do mesmo SHA;
7. planos, relatórios e memórias históricas.

## 10. Regra de manutenção

Mudança material deve atualizar no mesmo ciclo:

- contrato executável;
- teste de regressão;
- documento canônico afetado;
- evidência da validação;
- classificação documental, quando houver documento novo ou superado.
