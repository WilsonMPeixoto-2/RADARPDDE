# Matriz de validade documental

**Atualizado em:** 5 de agosto de 2026

## 1. Classificações

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

## 2. Baseline

```text
main: 30bdecc1116bbcd007448d21db57326b28d9a003
Vercel Production: dpl_FZe29TXs9DXeJSLg3bQCsgrgrinW — READY
commit público: 2e7b18ffa4b81300cf44c96ffde9c222cf98b895
Supabase: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
migrations em Production: 26
```

## 3. Fontes canônicas

- `AGENTS.md`;
- `README.md`;
- `docs/CURRENT_STAGE.md`;
- `docs/PROJECT_CONTEXT.md`;
- `docs/ROADMAP_ATUALIZACOES_2026.md`;
- `docs/DECISION_LOG.md`;
- `docs/README.md`;
- `docs/reference/STATUS_DOCUMENTOS.md`.

## 4. Matriz funcional ponta a ponta

| Arquivo | Classe | Uso |
|---|---|---|
| `docs/reference/functional-contract-matrix.json` | Contrato executável | perfis, superfícies, evidências e composição |
| `docs/reference/functional-contract-matrix/core.json` | Contrato executável | Auth, leitura, navegação e exportações |
| `docs/reference/functional-contract-matrix/configuration.json` | Contrato executável | configuração, escolas e equipe |
| `docs/reference/functional-contract-matrix/operations.json` | Contrato executável | verificações, pendências, notas, bens e auditoria |
| `docs/reference/functional-contract-matrix/technical.json` | Contrato executável | importação, monitoramento e integridade |
| `scripts/check-functional-contract-matrix.mjs` | Contrato executável | validação e geração |
| `tests/unit/functional-contract-matrix.test.js` | Contrato executável | regressões |
| `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md` | Gerado | visão das 41 operações |

Enquanto esta branch não for integrada, esses arquivos também são trabalho em andamento.

## 5. Referências vigentes

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

## 6. Procedimentos

| Documento | Classe |
|---|---|
| `docs/runbooks/SUPABASE_CONNECTION.md` | Runbook vigente |
| `docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md` | Runbook vigente |
| `docs/runbooks/SUPABASE_AUTH_BOOTSTRAP.md` | Procedimento histórico restrito |
| `docs/runbooks/SUPABASE_DATA_BOOTSTRAP.md` | Procedimento histórico restrito |

## 7. Garantias executáveis

- `.github/workflows/production-system-smoke.yml` — ambiente publicado e incidentes;
- `.github/workflows/production-data-integrity.yml` — vinte invariantes agregadas;
- `.github/workflows/gate-remoto-perfis-viewports.yml` — Auth/RLS e dispositivos;
- `.github/workflows/backup-restore-disposable.yml` — restauração equivalente;
- `.github/workflows/excel-sme-homologation.yml` — Excel SME;
- `supabase/migrations/202608040001_production_integrity_monitor.sql` — função privada de integridade;
- `scripts/check-production-data-integrity.mjs` — cliente sanitizado da auditoria.

## 8. PRs recentes

| PR | Estado |
|---:|---|
| 136 a 140 | integrados e publicados |
| 142 | integrado e publicado |
| 141 | integrado; migration aplicada no Supabase |
| matriz funcional | branch isolada, sem merge autorizado |

## 9. Afirmações superadas

Não usar como estado presente:

- Excel SME público com 30 colunas;
- incidente 404 ainda aberto;
- Gestão de Equipe sem correção de CORS/Auth;
- `app_config.row_version = 5` como valor atual;
- 25 migrations em Production;
- PR nº 141 aberto ou não aplicado;
- `f812e5db...` como `main` vigente;
- ausência de auditoria contínua de integridade;
- matriz funcional inexistente ou puramente manual.

## 10. Precedência

1. código, migrations e contratos executáveis;
2. Supabase e Vercel efetivos;
3. matriz funcional executável;
4. documentos canônicos;
5. decisões e referências vigentes;
6. evidências do mesmo SHA;
7. históricos.

## 11. Manutenção

Mudança funcional material atualiza a operação correspondente na matriz, o teste, o contrato técnico, o roadmap, a evidência e o estado de publicação.
