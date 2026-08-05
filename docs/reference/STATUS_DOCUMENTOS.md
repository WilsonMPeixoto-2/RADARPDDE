# Matriz de validade documental

**Atualizado em:** 5 de agosto de 2026

## 1. Finalidade

Definir quais arquivos controlam o estado atual e quais são contratos executáveis, referências, procedimentos, evidências ou históricos.

## 2. Classificações

| Classe | Significado |
|---|---|
| **Canônico** | controla estado, prioridade ou regra vigente |
| **Contrato executável** | fonte versionada validada automaticamente |
| **Gerado** | visão derivada; não editar manualmente |
| **Referência vigente** | descreve contrato técnico ou funcional atual |
| **Runbook vigente** | procedimento operacional autorizado |
| **Procedimento histórico restrito** | somente novo ambiente ou recuperação formal |
| **Decisão vigente** | regra duradoura aprovada |
| **Evidência** | comprova execução específica |
| **Trabalho em andamento** | pertence a branch ou PR ainda não integrado |
| **Histórico executado** | plano ou relatório preservado após execução |
| **Superado** | não usar para orientar o presente |

## 3. Baseline remoto

```text
main: 2e7b18ffa4b81300cf44c96ffde9c222cf98b895
Production: dpl_FZe29TXs9DXeJSLg3bQCsgrgrinW — READY
Supabase: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
migrations em Production: 25
PR #141: aberto em rascunho, independente
```

## 4. Fontes canônicas

| Documento | Uso |
|---|---|
| `AGENTS.md` | regras permanentes |
| `README.md` | visão executiva |
| `docs/CURRENT_STAGE.md` | estado e sequência |
| `docs/PROJECT_CONTEXT.md` | domínio e arquitetura |
| `docs/ROADMAP_ATUALIZACOES_2026.md` | prioridades |
| `docs/DECISION_LOG.md` | decisões |
| `docs/README.md` | índice |
| `docs/reference/STATUS_DOCUMENTOS.md` | validade documental |

## 5. Matriz funcional ponta a ponta

| Arquivo | Classe | Uso |
|---|---|---|
| `docs/reference/functional-contract-matrix.json` | Contrato executável | perfis, superfícies, evidências e composição |
| `docs/reference/functional-contract-matrix/core.json` | Contrato executável | Auth, leitura, navegação e exportações |
| `docs/reference/functional-contract-matrix/configuration.json` | Contrato executável | configuração, escolas e equipe |
| `docs/reference/functional-contract-matrix/operations.json` | Contrato executável | verificações, pendências, notas, bens e auditoria |
| `docs/reference/functional-contract-matrix/technical.json` | Contrato executável | importação, recuperação e monitoramento |
| `scripts/check-functional-contract-matrix.mjs` | Contrato executável | validação e geração |
| `tests/unit/functional-contract-matrix.test.js` | Contrato executável | regressões da matriz |
| `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md` | Gerado | visão legível das quarenta operações |

Enquanto a branch não for integrada, esses arquivos são também classificados como trabalho em andamento.

## 6. Referências vigentes

### Arquitetura

- `docs/architecture/README.md`;
- `docs/architecture/competencias.md`;
- `docs/architecture/avaliacao-mensal.md`;
- `docs/architecture/modelo-operacional.md`;
- `docs/architecture/timeline-unidade.md`;
- `docs/architecture/navigation-contextual.md`;
- `docs/architecture/testing.md`;
- `docs/architecture/supabase-readiness.md`;
- contratos Excel em `docs/architecture/excel-*.md`.

### Supabase e produto

- `docs/reference/SUPABASE_DATA_DICTIONARY.md`;
- `docs/reference/SUPABASE_FUNCTIONAL_COVERAGE.md`;
- `docs/reference/SUPABASE_INTEGRATION_AUDIT.md`;
- `docs/reference/SUPABASE_PERMISSIONS_MATRIX.md`;
- `docs/reference/PRODUCT_SURFACE_CATALOG.md`;
- `docs/reference/PRODUCT_DECISIONS.md`;
- `docs/reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md`.

## 7. Procedimentos

| Documento | Classe | Situação |
|---|---|---|
| `docs/runbooks/SUPABASE_CONNECTION.md` | Runbook vigente | conexão e diagnóstico |
| `docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md` | Runbook vigente | migrations, backup e rollback |
| `docs/runbooks/SUPABASE_AUTH_BOOTSTRAP.md` | Procedimento histórico restrito | primeiro administrador ou recuperação |
| `docs/runbooks/SUPABASE_DATA_BOOTSTRAP.md` | Procedimento histórico restrito | carga inicial concluída |

## 8. Decisões vigentes recentes

- `ADR-035` — Node 24 e gate perfil/viewport;
- `ADR-036` — backup/restauração;
- `ADR-037` — referências de workflows;
- `ADR-038` — atualizações intencionais;
- `ADR-039` — evolução proativa;
- `ADR-040` — garantia operacional contínua;
- `ADR-041` — confiabilidade ponta a ponta;
- `ADR-042` — reconciliação remota.

Os ADRs 040 a 042 foram integrados pelo PR nº 142.

## 9. Evidências recentes

| Documento | Uso |
|---|---|
| `docs/audits/2026-08-05-reconciliacao-documental-integral.md` | baseline do PR nº 142 |
| `docs/evidence/excel-certification/synthetic-manifest.json` | contrato Excel SME |
| `docs/audits/2026-07-30-backup-restore-disposable.md` | restauração equivalente |
| `docs/audits/2026-07-30-node24-gate-remoto-perfis-viewports.md` | runtime e matriz remota |
| `docs/audits/2026-07-29-reconciliacao-migration-sme-evidencias.md` | histórico de migration |

Evidência datada não prova permanência do ambiente.

## 10. PRs recentes

| PR | Classe | Estado |
|---:|---|---|
| nº 136 a 140 | histórico executado + evidência | integrados e publicados |
| nº 141 | trabalho em andamento | não integrado e não aplicado |
| nº 142 | histórico executado + documentos canônicos | integrado e publicado |
| matriz funcional | trabalho em andamento | branch isolada, sem merge autorizado |

## 11. Contratos executáveis gerais

- `package.json` e `package-lock.json`;
- `.nvmrc` e `.node-version`;
- serviços em `src/application/`;
- contrato e adaptadores em `src/data/`;
- Edge Function `team-account-management`;
- migrations e pgTAP;
- workflows de Production, perfis, backup e Excel;
- testes unitários, integração e E2E;
- matriz funcional e seu verificador.

## 12. Afirmações superadas

Não usar como estado presente:

- Excel SME público com 30 colunas;
- incidente 404 ainda aberto;
- Gestão de Equipe sem correção de CORS/Auth;
- `app_config.row_version = 5` como valor atual;
- 26 migrations em Production antes do PR nº 141;
- reconciliação documental ainda pendente;
- `f812e5db...` como `main` vigente;
- deployment anterior a `dpl_FZe29...` como Production atual;
- matriz funcional inexistente ou puramente manual.

## 13. Precedência

1. código, migrations e contratos executáveis;
2. Supabase e Vercel efetivos;
3. matriz funcional executável;
4. documentos canônicos;
5. decisões e referências vigentes;
6. evidências do mesmo SHA;
7. históricos.

## 14. Regra de manutenção

Mudança funcional material atualiza a operação correspondente na matriz, o teste, o contrato técnico, o roadmap, a evidência e o estado de publicação.
