# Matriz de validade documental

**Atualizado em:** 3 de agosto de 2026

## 1. Finalidade

Definir quais arquivos controlam o estado presente e quais permanecem apenas como histórico, evidência ou apoio.

## 2. Classificações

| Classe | Significado |
|---|---|
| **Canônico** | controla o estado atual e deve ser atualizado quando o produto ou o roadmap muda |
| **Runbook vigente** | procedimento operacional autorizado |
| **Referência vigente** | contrato técnico ou funcional consultivo |
| **Decisão vigente** | regra duradoura aprovada |
| **Evidência** | comprova execução, auditoria ou validação específica |
| **Histórico executado** | plano ou relatório preservado após execução |
| **Superado** | não aplicável ao estado atual; não usar como fonte operacional |

## 3. Fontes canônicas atuais

| Documento | Classe | Observação |
|---|---|---|
| `AGENTS.md` | Canônico | regras permanentes e comportamento operacional |
| `README.md` | Canônico | visão executiva |
| `docs/CURRENT_STAGE.md` | Canônico | estado, ambientes, sequência e bloqueadores |
| `docs/ROADMAP_ATUALIZACOES_2026.md` | Canônico | manutenção técnica, modernização e evolução funcional |
| `docs/PROJECT_CONTEXT.md` | Canônico | produto, domínio e arquitetura |
| `docs/DECISION_LOG.md` | Canônico | decisões acumuladas |
| `docs/README.md` | Canônico | índice documental |
| `docs/reference/STATUS_DOCUMENTOS.md` | Canônico | validade documental |
| `docs/architecture/overview.md` | Referência vigente | arquitetura geral |
| `docs/architecture/data-flow.md` | Referência vigente | fluxo de dados |
| `docs/architecture/supabase.md` | Referência vigente | contratos Supabase |
| `docs/architecture/supabase-readiness.md` | Referência vigente | prontidão e hardening Supabase |
| `docs/architecture/testing.md` | Referência vigente | testes e gates |
| `docs/reference/DATA_DICTIONARY.md` | Referência vigente | entidades e invariantes |
| `docs/reference/SURFACES_CATALOG.md` | Referência vigente | superfícies e capacidades |

## 4. Ordem de precedência documental

1. código, migrations e testes da branch/commit analisado;
2. estado efetivo do Supabase e Vercel para informações mutáveis;
3. `docs/CURRENT_STAGE.md`;
4. `docs/ROADMAP_ATUALIZACOES_2026.md` para portfólio técnico e funcional;
5. `docs/PROJECT_CONTEXT.md` e `docs/DECISION_LOG.md`;
6. arquitetura, referências e runbooks vigentes;
7. evidências do mesmo SHA;
8. planos, relatórios e memórias históricas.

O roadmap não prova implementação. Status concluído deve apontar para código, PR, commit ou evidência correspondente.

## 5. Runbooks vigentes

| Documento | Situação |
|---|---|
| `docs/runbooks/SUPABASE_CONNECTION.md` | vigente; conexão, migrations e recuperação alinhadas |
| `docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md` | vigente; inclui gate descartável de restauração |
| `docs/runbooks/SUPABASE_REMOTE_PREFLIGHT.md` | vigente |
| `docs/runbooks/VERCEL_DEPLOY.md` | vigente; publicação controlada e correspondência de SHA |
| `docs/runbooks/MIGRATION_FIREBASE_SUPABASE.md` | vigente para planejamento de migração |
| `docs/runbooks/IMPORT_EXECUTION.md` | vigente quando houver pacote autorizado |
| `docs/runbooks/INCIDENT_RESPONSE.md` | vigente |

## 6. Decisões vigentes recentes

| Documento | Classe | Uso |
|---|---|---|
| `docs/decisions/ADR-035-node24-e-gate-remoto.md` | Decisão vigente | Node 24 e matriz remota |
| `docs/decisions/ADR-036-backup-restauracao-e-recurso-pago-auth.md` | Decisão vigente | gate de recuperação e exclusão de requisito dependente do plano Pro |
| `docs/decisions/ADR-037-integridade-de-referencias-dos-workflows.md` | Decisão vigente | referências locais dos workflows |
| `docs/decisions/ADR-038-atualizacoes-com-integracao-pertinente.md` | Decisão vigente | atualizações com ganho concreto e integração pertinente |
| `docs/decisions/ADR-039-evolucao-tecnologica-proativa.md` | Decisão vigente | proposta de tecnologia moderna durante qualquer tarefa quando houver ganho material |

## 7. Rodadas de atualização e evidências

| Documento | Classe | Uso |
|---|---|---|
| `docs/audits/2026-08-01-rodada-0-baseline.md` | Evidência | correção do workflow e baseline técnico |
| `docs/superpowers/plans/2026-08-01-rodada-0-preparacao-obrigatoria.md` | Histórico executado | plano da Rodada 0 |
| `docs/audits/2026-08-01-rodada-1-baixo-risco.md` | Evidência | ESLint, Acorn e integrações pertinentes |
| `docs/superpowers/specs/2026-08-01-rodada-2-busca-flutuantes-transicoes-design.md` | Histórico executado | design aprovado da Rodada 2 |
| `docs/superpowers/plans/2026-08-01-rodada-2-busca-flutuantes-transicoes.md` | Histórico executado | plano da Rodada 2 |
| `docs/audits/2026-08-01-rodada-2-busca-flutuantes-transicoes.md` | Evidência | validação funcional e técnica da Rodada 2 |
| `docs/evidence/releases/2026-08-02-rodadas-1-2-production.json` | Evidência | publicação das Rodadas 1 e 2 |
| `docs/superpowers/specs/2026-08-02-rodada-3b-supabase-cli-2-110-0-design.md` | Histórico executado | design da Rodada 3B |
| `docs/superpowers/plans/2026-08-02-rodada-3b-supabase-cli-2-110-0.md` | Histórico executado | plano da Rodada 3B |
| `docs/audits/2026-08-02-rodada-3b-supabase-cli-2-110-0.md` | Evidência | validação da CLI e restauração |
| `docs/evidence/releases/2026-08-02-supabase-cli-2-110-0.json` | Evidência | resultado estruturado da Rodada 3B |
| `docs/superpowers/specs/2026-08-03-rodada-4a-roadmap-atualizacoes-design.md` | Histórico executado após integração | design da Rodada 4A |
| `docs/superpowers/plans/2026-08-03-rodada-4a-roadmap-atualizacoes.md` | Histórico executado após integração | plano da Rodada 4A |
| `docs/audits/2026-08-03-rodada-4a-roadmap-atualizacoes.md` | Evidência | reconciliação das listas e ausência de impacto operacional |

## 8. Outras evidências atuais

| Documento | Classe | Uso |
|---|---|---|
| `docs/audits/2026-07-30-backup-restore-disposable.md` | Evidência | restauração equivalente e segurança do artefato |
| `docs/evidence/releases/2026-08-01-excel-sme-production.json` | Evidência | homologação desktop, publicação e smokes |
| `docs/audits/2026-07-30-node24-gate-remoto-perfis-viewports.md` | Evidência | runtime, perfis, viewports e correção móvel |
| `docs/audits/2026-07-29-reconciliacao-migration-sme-evidencias.md` | Evidência | reparo oficial da migration SME |
| `docs/audits/2026-07-29-rastreabilidade-migration-sme.md` | Evidência histórica resolvida | achado original |
| `docs/evidence/excel-certification/synthetic-manifest.json` | Evidência gerada | certificação sintética Excel |

## 9. Contratos executáveis

| Arquivo | Classe | Contrato |
|---|---|---|
| `.nvmrc` | Canônico executável | Node 24 |
| `.node-version` | Canônico executável | Node 24 |
| `package.json` | Canônico executável | runtime e scripts |
| `package-lock.json` | Canônico executável | dependências reproduzíveis |
| `.github/workflows/gate-remoto-perfis-viewports.yml` | Canônico executável | Auth/RLS e matriz papel × viewport |
| `.github/workflows/backup-restore-disposable.yml` | Canônico executável | dump, restauração, equivalência e evidência sanitizada |
| `scripts/verify-supabase-backup-restore.mjs` | Canônico executável | duas pilhas, funções, fingerprints e limpeza |
| `scripts/check-workflow-references.mjs` | Canônico executável | referências estáticas verificáveis nos workflows |
| `tests/unit/backup-restore-gate-contract.test.js` | Canônico executável | guardas, isolamento e vedação de dumps no artefato |
| `playwright.supabase-preview.config.js` | Canônico executável | Desktop, Pixel 7 e iPhone 15 |
| `tests/e2e/supabase-preview-profile-viewport.spec.js` | Canônico executável | cinco papéis em três viewports |
| `tests/unit/release-hardening-contract.test.js` | Canônico executável | Node, workflow e layout móvel |
| `src/styles/mobile-rendering-hotfix.css` | Canônico executável | perfil e logout sem sobreposição |

## 10. Planos e relatórios históricos

Arquivos em `docs/plans/`, `docs/reports/` e `docs/superpowers/plans/` permanecem históricos salvo indicação expressa.

- não tratá-los como prova de implementação;
- confrontá-los com código, banco, deployment e documentação canônica;
- não reescrever retrospectivamente planos;
- registrar execução e desvios em auditoria própria.

## 11. Documentos e afirmações superados

| Documento ou classe | Motivo |
|---|---|
| `CURRENT_STAGE.md` anterior a 3 de agosto de 2026 | não continha Rodadas 0, 1, 2 e 3B nem o roadmap consolidado |
| `docs/README.md` com estado de 30 de julho | anterior às rodadas de atualização |
| lista técnica isolada como próxima sequência integral | substituída pelo roadmap canônico das duas frentes |
| busca inteligente como sinônimo de central de comandos | Rodada 2 implementou busca no campo existente e adiou `Ctrl + K` |
| Supabase CLI 2.110.0 como pendência | concluída pela Rodada 3B |
| bootstraps anteriores à ativação | descrevem preparação, não Production atual |
| migration SME divergente como bloqueador | resolvido em 29 de julho de 2026 |
| faixa Node `>=24 <27` | substituída por `24.x` |
| workflow remoto legado fixo | substituído por Supabase descartável |
| backup/restauração como não testados | gate aprovado em ambiente descartável |
| checagem de credenciais comprometidas como requisito do plano Free | recurso restrito ao plano Pro ou superior; decisão ADR-036 |

## 12. Regra de manutenção

Mudança material deve atualizar no mesmo ciclo:

- contrato executável;
- teste de regressão;
- documento canônico afetado;
- roadmap técnico/funcional, quando aplicável;
- evidência da validação;
- classificação documental, quando houver documento novo ou superado.

Oportunidade tecnológica identificada e não executada deve ser registrada no roadmap com status e próxima decisão, sem ser tratada como autorização automática.
