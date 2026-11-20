# Resultados dos Testes Reproduzidos e Evidências de Execução

- **Data inicial:** 15/11/2026 | **Revalidação pós-revisão `009e9101` + `main@69954645`:** 19/11/2026
- **Ambiente de execução:** Windows 11 / PowerShell, Node.js `v24.22.3`, Playwright `1.65.1` Chromium headless (`desktop-chromium`), ESLint `10.15.0`, dependency-cruiser `18.8.0`, Lighthouse `13.6.0`, Supabase CLI `3.2.0`, `git config core.autocrlf false`
- **Clone isolado:** `C:\Users\Wilson\.gemini\antigravity\scratch\radarpdde-argon-20261115`
- **Branch testada:** `audit/antigravity-argon-prontuario-20261115` (sincronizada com `fix/prontuario-integrado-validado-20261115@20409c12` + `main@69954645` + correções de `fix/review-antigravity-t2-assessoria-20261118@009e9101` + 8º reparo de reconciliação/tipos/acessibilidade)

---

## 1. Síntese Geral por Nível de Teste (19/11/2026)

| Nível | Escopo | Comando Executado | Resultado | Observações / Limitações Reais |
|---|---|---|---|---|
| **Nível 1** | Sintaxe, matriz funcional, referências de workflows, arquitetura (`depcruise@18.8.0`), vendors, `stylelint`, `eslint@10.15.0`, alinhamento Supabase, tipos TS (`database.types.ts` com SHA-256 `e9ebed11...` = CI) e auditoria funcional | `npm run test:readiness` | **APROVADO (exit code 0)** | 0 vulnerabilidades em `npm ci`/`npm audit`, contratos sincronizados com `main@69954645` (Supabase CLI `3.2.0` + Lighthouse `13.6.0`). Log em [`evidencias/test-readiness.log`](evidencias/test-readiness.log). |
| **Nível 2** | Testes unitários Node.js (incluindo transição A-01 completa com checkbox/SVG/SME em `prontuario-conditional-reconciler.test.js`, `service-advisory-pendency.test.js`, `supabase-cli-v3-operational-contract.test.js`, `lighthouse-insight-opportunities.test.js`) | `npm run test:unit` | **APROVADO (1.436/1.436 no gate completo)** | Cobertura unitária integral verde (`fail: 0`). |
| **Nível 3** | Testes de integração Node.js | `npm run test:integration` | **APROVADO (8/8)** | `local-storage-repository.test.js`, `migration-cli.test.js`, `supabase-repository.test.js`, `verification-atomic-persistence.test.js`. |
| **Nível 4** | Banco de dados descartável / pgTAP (`operational-correction.test.sql` + `schema.test.sql`) | CI real Docker no PR #532 (`actions/runs/44310070849`) + contraprova criptográfica local do SHA-256 de `database.types.ts` | **74/74 pgTAP + todas as demais suítes pgTAP: APROVADO em Docker (`All tests successful. Result: PASS`)** | A falha seguinte do run `#44310070849` ocorreu exclusivamente em `check:generated` pela ordenação alfabética de `apply_operational_change` em `src/types/database.types.ts` — corrigida agora com match exato (`e9ebed11...`, 6042 tokens). **Auth/RLS + E2E autenticado no Docker ainda aguardam nova rodada CI/local.** |
| **Nível 5** | Concorrência SQL (`scripts/test-operational-correction-concurrency.sh`) | Inspeção estática + trava `pg_advisory_xact_lock` + `operational_correction_lock` | **Validado por inspeção estática; execução dinâmica pendente no gate Docker** | Requer execução no banco PostgreSQL descartável junto com cenários de chaves distintas e filho concorrente entre `preview` e `apply`. |
| **Nível 6** | Navegador Playwright E2E (`@playwright/test@1.65.1` — T1 layout, contraste escuro, governança SME, diálogo T2/T3, A-01 no navegador e retificação) | `npx playwright test` nas 10 suítes de Prontuário e Retificação (`--project=desktop-chromium`) | **APROVADO (46/46 testes verdes, incluindo 20/20 em `operational-correction-dialog.spec.js`)** | O 20º teste valida em Chromium real: transição incremental A-01 (`Editar análise` → `Visualizar pendência`), bloqueio do checkbox `Enviada à Assessoria`, abertura da gaveta com `Corrigir análise` e `Excluir pendência`, isolamento `inert` no modal T2, restauração pós-resolução e guarda SME. Continua com transporte RPC controlado (não substitui Auth/RLS com banco local + F5). Log em [`evidencias/playwright-22-tests.log`](evidencias/playwright-22-tests.log). |
| **Nível 7** | Inspeção visual, responsividade (390 px, 1280 px, 1440 px, 1920 px), contraste AA (claro/escuro) e acessibilidade por teclado | Asserções geométricas, de luminância, `aria-describedby`, `autofocus`, `inert` e contenção de scroll | **APROVADO nos testes automatizados; pendente aceite visual humano final** | No CI completo `#44310070862` (262 pass, 69 skip, 1 fail), a única falha foi o snapshot golden pré-T1 `prontuario.png` em `global-visual-polish.spec.js:115` (diferença esperada de 2% pelo redesenho horizontal da T1; atualizar snapshot somente após aceite visual). |

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
