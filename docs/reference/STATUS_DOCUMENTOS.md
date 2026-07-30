# Matriz de validade documental

**Atualizado em:** 30 de julho de 2026

## 1. Finalidade

Definir quais arquivos controlam o estado presente e quais permanecem apenas como histórico, evidência ou apoio.

## 2. Classificações

| Classe | Significado |
|---|---|
| **Canônico** | controla o estado atual e deve ser atualizado quando o produto muda |
| **Runbook vigente** | procedimento operacional autorizado |
| **Referência vigente** | contrato técnico ou funcional consultivo |
| **Evidência** | comprova uma execução, auditoria ou validação específica |
| **Histórico executado** | plano ou relatório preservado após execução |
| **Superado** | documento não aplicável ao estado atual; não usar como fonte operacional |

## 3. Fontes canônicas atuais

| Documento | Classe | Observação |
|---|---|---|
| `AGENTS.md` | Canônico | regras permanentes do repositório |
| `README.md` | Canônico | visão executiva e entrada do projeto |
| `docs/CURRENT_STAGE.md` | Canônico | estado material, gates e bloqueadores |
| `docs/PROJECT_CONTEXT.md` | Canônico | produto, domínio e arquitetura |
| `docs/DECISION_LOG.md` | Canônico | decisões arquiteturais vigentes |
| `docs/README.md` | Canônico | índice documental |
| `docs/architecture/overview.md` | Referência vigente | arquitetura geral |
| `docs/architecture/data-flow.md` | Referência vigente | fluxo de dados e persistência |
| `docs/architecture/supabase.md` | Referência vigente | contratos Supabase |
| `docs/architecture/testing.md` | Referência vigente | estratégia de testes e gates |
| `docs/reference/DATA_DICTIONARY.md` | Referência vigente | entidades, campos e invariantes |
| `docs/reference/SURFACES_CATALOG.md` | Referência vigente | superfícies e capacidades |
| `docs/reference/STATUS_DOCUMENTOS.md` | Canônico | validade dos documentos |

## 4. Runbooks vigentes

| Documento | Situação |
|---|---|
| `docs/runbooks/SUPABASE_CONNECTION.md` | vigente; 25 migrations e histórico SME reconciliado |
| `docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md` | vigente |
| `docs/runbooks/SUPABASE_REMOTE_PREFLIGHT.md` | vigente |
| `docs/runbooks/VERCEL_DEPLOY.md` | vigente |
| `docs/runbooks/MIGRATION_FIREBASE_SUPABASE.md` | vigente para planejamento de migração de dados |
| `docs/runbooks/IMPORT_EXECUTION.md` | vigente quando houver pacote autorizado |
| `docs/runbooks/INCIDENT_RESPONSE.md` | vigente |

## 5. Evidências atuais

| Documento | Classe | Uso |
|---|---|---|
| `docs/audits/2026-07-30-node24-gate-remoto-perfis-viewports.md` | Evidência | compatibilidade, fixação Node 24, gate remoto e correção móvel |
| `docs/audits/2026-07-29-reconciliacao-migration-sme-evidencias.md` | Evidência | reparo oficial e verificação da migration SME |
| `docs/audits/2026-07-29-rastreabilidade-migration-sme.md` | Evidência histórica resolvida | achado original; não é bloqueador atual |
| `docs/audits/2026-07-29-alinhamento-documental-integral-pos-pr108.md` | Evidência | reconciliação documental |
| `docs/audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md` | Evidência | reconstrução do estado pós-ciclos |
| `docs/evidence/excel/certification-manifest.json` | Evidência gerada | certificação sintética dos produtos Excel |
| `docs/evidence/excel/README.md` | Evidência | leitura do pacote Excel |

## 6. Contratos executáveis novos ou alterados

| Arquivo | Classe | Contrato |
|---|---|---|
| `.nvmrc` | Canônico executável | major Node 24 para nvm |
| `.node-version` | Canônico executável | major Node 24 para gerenciadores compatíveis |
| `package.json` | Canônico executável | `engines.node = 24.x` |
| `package-lock.json` | Canônico executável | reprodução da mesma major |
| `.github/workflows/gate-remoto-perfis-viewports.yml` | Canônico executável | Supabase descartável, Auth/RLS e matriz papel × viewport |
| `playwright.supabase-preview.config.js` | Canônico executável | Desktop Chrome, Pixel 7 e iPhone 15 |
| `tests/e2e/supabase-preview-profile-viewport.spec.js` | Canônico executável | cinco papéis em três viewports |
| `tests/unit/release-hardening-contract.test.js` | Canônico executável | Node, workflow e separação dos controles móveis |
| `src/styles/mobile-rendering-hotfix.css` | Canônico executável | layout móvel sem sobreposição entre perfil e logout |

## 7. Planos e relatórios históricos

Arquivos em `docs/plans/`, `docs/reports/` e `docs/superpowers/plans/` permanecem históricos salvo indicação expressa em contrário.

Regras:

- não tratá-los como prova de implementação;
- confrontá-los com código, banco, deployment e documentação canônica;
- não reescrever retrospectivamente o plano para parecer estado atual;
- registrar execução e desvios em auditoria própria.

## 8. Documentos superados

| Documento ou classe | Motivo |
|---|---|
| bootstraps de conexão anteriores à ativação | descrevem estado de preparação, não o Production atual |
| referências à migration SME divergente como bloqueador | achado resolvido em 29 de julho de 2026 |
| referências à faixa Node `>=24 <27` | contrato substituído por `24.x` |
| workflow remoto legado de homologação fixa | substituído pelo gate com Supabase descartável |
| workflows temporários de diagnóstico do PR #111 | removidos após validação |

## 9. Regra de precedência

Em conflito de informação, aplicar:

1. código, migrations e testes da `main`;
2. estado efetivo do Supabase e da Vercel para dados mutáveis;
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
