# Resultados dos Testes Reproduzidos e Evidências de Execução

- **Data inicial:** 15/11/2026 | **Revalidação completa + Docker CI autenticado T2/T3:** 20/11/2026
- **Ambiente de execução:** Windows 11 / PowerShell (Node.js `v24.22.3`, Playwright `1.65.1`) + **GitHub Actions Docker `ubuntu-26.04` com PostgreSQL 17 / Supabase local real** (`actions/runs/44669524893`, PR #534 Draft, commit `9c66e8e3`)
- **Clone isolado:** `C:\Users\Wilson\.gemini\antigravity\scratch\radarpdde-argon-20261115`
- **Branch testada:** `audit/antigravity-argon-prontuario-20261115` (sincronizada com `fix/prontuario-integrado-validado-20261115@20409c12` + `main@69954645` + `009e9101` + 8º e 9º reparos)

---

## 1. Síntese Geral por Nível de Teste (20/11/2026)

| Nível | Escopo | Comando Executado | Resultado | Observações / Limitações Reais |
|---|---|---|---|---|
| **Nível 1** | Sintaxe, matriz funcional, referências de workflows, arquitetura (`depcruise@18.8.0`), vendors, `stylelint`, `eslint@10.15.0`, alinhamento Supabase, tipos TS (`database.types.ts` SHA-256 `e9ebed11...` = CI) e auditoria funcional | `npm run test:readiness` (local + job `readiness` em `#44669524893`) | **APROVADO (exit code 0)** | 0 vulnerabilidades em `npm ci`/`npm audit`, `check:generated` e `typecheck:database` verdes em Docker e local. Log em [`evidencias/test-readiness.log`](evidencias/test-readiness.log). |
| **Nível 2** | Testes unitários Node.js (incluindo transição A-01 completa com checkbox/SVG/SME em `prontuario-conditional-reconciler.test.js`, `service-advisory-pendency.test.js`, `supabase-cli-v3-operational-contract.test.js`, `lighthouse-insight-opportunities.test.js`) | `npm run test:unit` | **APROVADO (1.436/1.436)** | Cobertura unitária integral verde (`fail: 0`). |
| **Nível 3** | Testes de integração Node.js | `npm run test:integration` | **APROVADO (8/8)** | `local-storage-repository.test.js`, `migration-cli.test.js`, `supabase-repository.test.js`, `verification-atomic-persistence.test.js`. |
| **Nível 4** | Banco de dados descartável / pgTAP (`operational-correction.test.sql` + `schema.test.sql` + 41 demais arquivos pgTAP) | `npm run supabase:test:db` em Docker CI (`actions/runs/44669524893`) | **APROVADO — 77/77 pgTAP em `operational-correction.test.sql` + 43/43 arquivos (`All tests successful. Result: PASS`)** | Inclui a correção `array_agg(distinct value order by value)` em `selectedPendencyIds` com 3 novas asserções (`OCC_DEDUP`) e `npm run supabase:lint:db` verde. |
| **Nível 5** | Concorrência e idempotência SQL real em PostgreSQL 17 sob barreira determinística | `node scripts/test-operational-correction-concurrency-local.mjs` em Docker CI (`actions/runs/44669524893`) | **APROVADO (3/3 casos determinísticos)** | Case 1: mesma `operationKey` simultânea -> 1 commit, 1 replay idempotente, 1 exclusão atômica (incluindo bem `Inventariada`). Case 2: duas `operationKey` distintas disputando o mesmo `planDigest` -> 1 vencedor, 1 rejeição limpa (`STALE_PLAN`/`PLAN_BLOCKED: NO_EFFECT`). Case 3: reutilização com payload alterado -> `IDEMPOTENCY_CONFLICT`. |
| **Nível 6A** | Navegador Playwright E2E **autenticado contra Supabase local Docker real** com `RADAR_OPERATIONAL_CORRECTION_PREVIEW=true` | `npx playwright test tests/e2e/supabase-operational-correction-local.spec.js --project=desktop-chromium` em Docker CI (`actions/runs/44669524893`) | **APROVADO (4/4 testes em 17,5 s, 0 retries, 0 `pageerror`)** | RPCs reais `/rest/v1/rpc/preview_operational_change` e `/rest/v1/rpc/apply_operational_change` em `127.0.0.1:54321`: (1) T2 documental `correct_analysis` + `clear_analysis` + `F5` + 2ª sessão `federal_assistant`; (2) T2 `consAssessoria` + A-01 real + `Corrigir análise` pela gaveta + `F5` + 2ª sessão; (3) T3 `delete_invoice` com Pendência preservando NF vizinha e `bonus_result = 'apta'` (ADR-055) + `F5` + 2ª sessão; (4) `sme` sem ações na UI e rejeitado no SQL com `AUTHORIZATION_DENIED`. Suítes padrão com flag OFF (`17/17` + `4/4`) também 100% aprovadas. Log em [`evidencias/ci-supabase-local-t2t3-44669524893.log`](evidencias/ci-supabase-local-t2t3-44669524893.log). |
| **Nível 6B** | Navegador Playwright E2E local (`@playwright/test@1.65.1` — T1 layout, contraste escuro, governança SME, diálogo T2/T3, A-01 e retificação) | `npx playwright test` nas 10 suítes locais (`--project=desktop-chromium`) | **APROVADO (46/46, sendo 20/20 em `operational-correction-dialog.spec.js`)** | Cobertura complementar de edge cases de UI/modal com transporte RPC controlado. Log em [`evidencias/playwright-22-tests.log`](evidencias/playwright-22-tests.log). |
| **Nível 7** | Inspeção visual, responsividade (390 px, 1280 px, 1440 px, 1920 px), contraste AA (claro/escuro) e acessibilidade por teclado | Asserções geométricas, luminância, `aria-describedby`, `autofocus`, `inert` e contenção de scroll | **APROVADO nos testes automatizados; pendente aceite visual humano final** | No workflow `Testes E2E Playwright`, a única diferença restante é o snapshot golden pré-T1 `prontuario.png` (`global-visual-polish.spec.js:115`, 2% de diff esperado pelo redesenho T1; atualizar apenas após aceite visual humano). |

---

## 2. Detalhamento dos Novos Testes Executados em 17/11/2026

### 2.1. Suíte Playwright E2E Chromium (`45/45 PASS` em 10 suítes)

- `tests/e2e/operational-correction-dialog.spec.js`: **19/19 aprovados** (incluindo `confirmação acionada na fila de Pendências re-renderiza renderPendencias sem sobrescrever com renderProntuario` e `linha de Consulta à Assessoria preserva 1ª análise em 1 clique, reconcilia botão Editar análise com aria-describedby e intercepta retificação no select e no botão para abrir diálogo T2`).
- `tests/e2e/prontuario-correction-layout.spec.js`: **4/4 aprovados** (1280 px, 1440 px, 1920 px, vínculos patrimoniais/fiscais, teclado e temas claro/escuro).
- `tests/e2e/prontuario-dark-contrast-regression.spec.js`: **1/1 aprovado** (contraste AA >= 4,5:1 determinístico).
- `tests/e2e/sme-access-governance.spec.js`: **3/3 aprovados**.
- `tests/e2e/evaluation-retification-ui.spec.js`: **4/4 aprovados** (fluxo legado preservado quando a flag `RADAR_OPERATIONAL_CORRECTION_PREVIEW` está desativada).
- `tests/e2e/invoice-auditable-retification.spec.js`, `tests/e2e/invoice-retification-projections.spec.js`, `tests/e2e/invoice-retification-discoverability.spec.js`, `tests/e2e/invoice-type-retification.spec.js` e `tests/e2e/pendency-manual-auditable-retification.spec.js`: **14/14 aprovados** nas suítes de projeção, classificação com `<dialog>` nativo e retificação auditável.

---

## 3. Auditoria Somente-Leitura no Supabase Remoto (`scnryinorqeucbfkioxo`) via MCP (Referência de 15/11/2026)

1. **Estado das migrations remotas:** `supabase_migrations.schema_migrations` possui **62 migrations** aplicadas (última: `20261024120000_quality_provisional_movements`). A migration `20261114000100_operational_correction_contract.sql` permanece exclusivamente candidata (não aplicada em produção).
2. **Compatibilidade de pré-requisitos PostgreSQL 17 em `scnryinorqeucbfkioxo`:** Confirmada a existência e assinatura exata de `radar_private.current_app_role()`, `radar_private.can_write_school(text)`, `pg_catalog.sha256(bytea)`, `pg_catalog.txid_current_if_assigned()`, `pg_catalog.hashtextextended(text, bigint)` e `pg_catalog.pg_advisory_xact_lock(bigint)`.
3. **Evidência empírica de produção (43 registros reais com descompasso pós-edição de NF):**
   - A consulta `SELECT` cruzando `public.pendencies` e `public.registered_invoices` identificou **43 registros reais** em que a Nota Fiscal foi editada após a abertura da Pendência, comprovando a necessidade real das projeções dinâmicas de NF atual e da exclusão assistida implementadas nesta frente.
