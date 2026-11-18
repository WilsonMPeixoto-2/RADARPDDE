# Resultados dos Testes Reproduzidos e Evidências de Execução

- **Data inicial:** 15/11/2026 | **Revalidação pós-sincronização (`20409c12` + `main@58ca0c0a`):** 17/11/2026
- **Ambiente de execução:** Windows 11 / PowerShell, Node.js `v24.22.3`, Playwright `1.65.1` Chromium headless (`desktop-chromium`), ESLint `10.15.0`, dependency-cruiser `18.8.0`, `git config core.autocrlf false`
- **Clone isolado:** `C:\Users\Wilson\.gemini\antigravity\scratch\radarpdde-argon-20261115`
- **Branch testada:** `audit/antigravity-argon-prontuario-20261115` (sincronizada com `origin/fix/prontuario-integrado-validado-20261115@20409c12` + `origin/main@58ca0c0a` + refinamento de botão `Editar análise` em Consulta à Assessoria e acessibilidade modal)

---

## 1. Síntese Geral por Nível de Teste (17/11/2026)

| Nível | Escopo | Comando Executado | Resultado | Observações / Limitações Reais |
|---|---|---|---|---|
| **Nível 1** | Sintaxe, matriz funcional, referências de workflows, arquitetura (`depcruise@18.8.0`), vendors, `stylelint`, `eslint@10.15.0`, alinhamento Supabase, tipos TS e auditoria funcional | `npm run test:readiness` | **APROVADO (exit code 0)** |Inclui os contratos atualizados de `tests/unit/tooling-contract.test.js` e `dependency-health/npm-audit.json` (0 vulnerabilidades) vindos de `main@58ca0c0a`. |
| **Nível 2** | Testes unitários Node.js (incluindo testes de idempotência do cliente, diálogo, `service-advisory-pendency.test.js`, `prontuario-conditional-reconciler.test.js`, `pendency-correction.test.js`, `runtime-config.test.js`, `runtime-config-generation.test.js` e `tooling-contract.test.js`) | `npm run test:unit` | **APROVADO (1.418/1.418 no gate completo)** | Cobertura unitária integral verde com as novas versões de ferramentas da `main@58ca0c0a`. |
| **Nível 3** | Testes de integração Node.js | `npm run test:integration` | **APROVADO (8/8)** | `local-storage-repository.test.js`, `migration-cli.test.js`, `supabase-repository.test.js`, `verification-atomic-persistence.test.js`. |
| **Nível 4** | Banco de dados descartável / pgTAP (`operational-correction.test.sql`) | Verificação estática local (`npm run check:supabase`, `npm run check:supabase-final`, `npm run typecheck:database`) + **74 asserções pgTAP preparadas** | **Estático: APROVADO**<br>**Plano pgTAP: 74 asserções** | Inclui a 74ª asserção (`8361c5ee`: `T2: prévia da análise individual inclui versões das NFs irmãs do agregado`). **A execução dinâmica das 74 asserções em PostgreSQL 17 local via Docker permanece como próximo gate obrigatório.** |
| **Nível 5** | Concorrência SQL (`scripts/test-operational-correction-concurrency.sh`) | Inspeção do script e da trava `pg_advisory_xact_lock` + `operational_correction_lock` (cobrindo `pendency_attempts` e NFs irmãs) | **Validado por inspeção estática; execução dinâmica pendente no gate Docker** | Requer execução no banco PostgreSQL 17 descartável junto com os cenários de chaves distintas e filho concorrente entre `preview` e `apply`. |
| **Nível 6** | Navegador Playwright E2E (`@playwright/test@1.65.1` — T1 layout, contraste escuro, governança SME, diálogo T2/T3 e retificação) | `npx playwright test` nas 10 suítes de Prontuário e Retificação (`--project=desktop-chromium`) | **APROVADO (45/45 testes verdes, incluindo 19/19 em `operational-correction-dialog.spec.js`)** | **Distinção metodológica obrigatória:** os 19 testes de `operational-correction-dialog.spec.js` exercitam o DOM real no Chromium com transporte RPC controlado (`executeRpc` simulado), e **não** substituem o teste E2E autenticado contra Supabase descartável com persistência pós-F5. |
| **Nível 7** | Inspeção visual, responsividade (390 px, 1280 px, 1440 px, 1920 px), contraste AA (claro/escuro) e acessibilidade por teclado | Asserções geométricas, de luminância e de associação `aria-describedby` / `autofocus` | **APROVADO nos testes automatizados; pendente aceite visual humano final** | Contraste AA >= 4,5:1 determinístico em execução paralela e botões `Editar análise` vinculados programaticamente aos títulos das NFs via `aria-describedby`. |

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
