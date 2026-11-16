# Resultados dos Testes Reproduzidos e Evidências de Execução

- **Data:** 15/11/2026
- **Ambiente de execução:** Windows 11 / PowerShell, Node.js `v24.22.3`, Playwright Chromium headless (`desktop-chromium`), `git config core.autocrlf false`
- **Clone isolado:** `C:\Users\Wilson\.gemini\antigravity\scratch\radarpdde-argon-20261115`
- **Branch testada:** `audit/antigravity-argon-prontuario-20261115` (sincronizada com `origin/fix/prontuario-integrado-validado-20261115@e26058bc` + 6 correções de auditoria sobre T2/T3)

---

## 1. Síntese Geral por Nível de Teste

| Nível | Escopo | Comando Executado | Resultado | Observações / Limitações Reais |
|---|---|---|---|---|
| **Nível 1** | Sintaxe, matriz funcional, referências de workflows, arquitetura (`depcruise`), vendors, `stylelint`, `eslint`, alinhamento Supabase, tipos TS e auditoria funcional | `npm run test:readiness` | **APROVADO (exit code 0)** | 44 operações na matriz funcional, 39 workflows, 209 módulos / 324 dependências sem violação, 0 erros de lint CSS/JS/E2E. |
| **Nível 2** | Testes unitários Node.js (incluindo novos testes de idempotência do cliente, diálogo, `pendency-correction.test.js`, `runtime-config.test.js` e `runtime-config-generation.test.js`) | `npm run test:unit` | **APROVADO (1.416/1.416 no gate completo)** | Cobertura unitária de `clear_analysis`, congelamento de payload no retry (`WeakMap`), `requiresLateCorrect` real, erro explícito em `targetId` inexistente, `AMBIGUOUS_ATTEMPT_TARGET` e trava loopback `operationalCorrectionPilot`. |
| **Nível 3** | Testes de integração Node.js | `npm run test:integration` | **APROVADO (8/8)** | `local-storage-repository.test.js`, `migration-cli.test.js`, `supabase-repository.test.js`, `verification-atomic-persistence.test.js`. |
| **Nível 4** | Banco de dados descartável / pgTAP (`operational-correction.test.sql`) | Verificação estática local (`npm run check:supabase`, `npm run check:supabase-final`, `npm run typecheck:database`) + 73 asserções pgTAP preparadas | **Estático: APROVADO**<br>**Plano pgTAP: 73 asserções** | **Limitação de ambiente documentada:** este host Windows não possui `psql`, `pg_isready`, `docker` ou WSL instalados. O Supabase remoto institucional (`scnryinorqeucbfkioxo`) foi consultado apenas em modo estrito `SELECT` (`read_only=true`). |
| **Nível 5** | Concorrência SQL (`scripts/test-operational-correction-concurrency.sh`) | Inspeção do script e da trava `pg_advisory_xact_lock` + `operational_correction_lock` (agora cobrindo também `pendency_attempts` e NFs irmãs) | **Validado por inspeção de código e evidência de `5a62a18b`** | O script lança duas sessões `psql` sincronizadas na barreira `/tmp/occ-barrier` com a mesma `operationKey` e comprova `1 committed + 1 replayed` e 1 linha no ledger. Reexecução dinâmica requer ambiente Linux/PostgreSQL local. |
| **Nível 6** | Navegador Playwright E2E (T1 layout, contraste escuro, governança SME, diálogo T2/T3 e retificação) | `npx playwright test tests/e2e/operational-correction-dialog.spec.js tests/e2e/invoice-auditable-retification.spec.js --project=desktop-chromium` | **APROVADO (18/18 em `operational-correction-dialog.spec.js` após corrigir o reset de `candidatePendencyIds` que falhava em `e26058bc`)** | **Distinção metodológica obrigatória:** os 18 testes de `operational-correction-dialog.spec.js` exercitam o DOM real no Chromium com transporte RPC controlado (`executeRpc` simulado), e **não** substituem o teste E2E autenticado contra Supabase descartável. |
| **Nível 7** | Inspeção visual, responsividade (390 px, 1280 px, 1440 px, 1920 px), contraste AA (claro/escuro) e acessibilidade por teclado | Asserções geométricas e de luminância em `prontuario-correction-layout.spec.js`, `prontuario-dark-contrast-regression.spec.js` e `operational-correction-dialog.spec.js` | **APROVADO** | Em `9eeedb50`, `prontuario-dark-contrast-regression.spec.js` falhava sob execução paralela (contraste 1,10 / 3,80 aos 300 ms devido à transição de 150 ms de `.invoice-document-row` em `global-visual-polish.css`). Após a correção em `styles.css` e `src/styles/prontuario-operational-ux.css`, passou de forma determinística sob 8 workers. |

---

## 2. Detalhamento dos Testes Executados

### 2.1. Testes Unitários Focados (`20/20 PASS`)

Comando:
```powershell
node --test tests/unit/operational-correction-client.test.js tests/unit/operational-correction-dialog.test.js tests/unit/pendency-correction.test.js
```

Casos aprovados:
1. `buildRequest monta pedido canônico sem exigir justificativa`
2. `buildRequest rejeita ação desconhecida e alvos incompletos`
3. `buildRequest normaliza seleção explícita de Pendências e aceita nota opcional`
4. `describePlan traduz efeitos para o diálogo de confirmação`
5. `preview delega o plano ao servidor e não envia a nota para o cálculo do digest`
6. `apply envia digest e operationKey estáveis e reaproveita a chave em nova tentativa`
7. `prepareConfirmation impede aplicar plano bloqueado`
8. `erros do servidor viram mensagens orientadas ao usuário`
9. `apply exige recibo confirmado pelo servidor`
10. `apply congela o payload da requisicao na primeira tentativa para evitar IDEMPOTENCY_CONFLICT ao repetir com outra nota` *(novo)*
11. `correção integrada permanece desligada sem flag ou repositório remoto`
12. `falha de capabilities fecha a disponibilidade sem exceção`
13. `flag explícita com RPC remota e cliente libera somente o diálogo`
14. `usa o repositório real publicado em RadarApplicationServices.data`
15. `inclui Não analisado (clear_analysis) nas opções suportadas pelo diálogo` *(novo)*
16. `delete_review reabre a tentativa para aguardando e devolve Pendência para Aguardando reanálise (Controlador)` *(novo)*
17. `delete_submission remove a tentativa mais recente e preserva os erros da análise incorreta anterior` *(novo)*
18. `correct_review aplica Correto (Atrasado) quando bonificação consolidada teve entrega Não (regra real de fluxo-operacional.js)` *(novo)*
19. `targetId inexistente lança erro explícito e nunca modifica silenciosamente a última tentativa` *(novo)*
20. `múltiplas tentativas sem targetId retornam ambiguidade explícita sem mutar a Pendência` *(novo)*

### 2.2. Suíte Playwright E2E Chromium (`22/22 PASS`)

Comando:
```powershell
npx playwright test tests/e2e/operational-correction-dialog.spec.js tests/e2e/prontuario-correction-layout.spec.js tests/e2e/prontuario-dark-contrast-regression.spec.js tests/e2e/sme-access-governance.spec.js tests/e2e/evaluation-retification.spec.js --project=desktop-chromium --reporter=line
```

- `tests/e2e/operational-correction-dialog.spec.js`: **11/11 aprovados** (incluindo `resultado incerto de rede conserva intenção integral no retry e bloqueia nova prévia`, `G-02: limpar análise utiliza clear_analysis existente e preserva observação opcional` e o novo `AMBIGUOUS_CONSEQUENCE exige seleção explícita de Pendências candidatas sem pré-selecionar automaticamente`).
- `tests/e2e/prontuario-correction-layout.spec.js`: **4/4 aprovados** (1280 px, 1440 px, 1920 px, vínculos patrimoniais/fiscais, teclado e temas claro/escuro).
- `tests/e2e/prontuario-dark-contrast-regression.spec.js`: **1/1 aprovado** (contraste AA >= 4,5:1 determinístico em execução paralela).
- `tests/e2e/sme-access-governance.spec.js`: **3/3 aprovados**.
- `tests/e2e/evaluation-retification.spec.js`: **3/3 aprovados** (fluxo legado preservado quando a flag `RADAR_OPERATIONAL_CORRECTION_PREVIEW` está desativada).
- `tests/e2e/invoice-auditable-retification.spec.js`, `tests/e2e/invoice-retification-projections.spec.js` e `tests/e2e/invoice-retification-discoverability.spec.js`: **6/6 aprovados** (incluindo propagação do novo número e descrição da Nota Fiscal para `pendency.item`, fila e busca da tela de Pendências e `#pendency-detail-drawer`, preservando `documentSnapshot` histórico, além do botão de ação alternativa `Abrir Pendência deste lançamento`).

---

## 3. Auditoria Somente-Leitura no Supabase Remoto (`scnryinorqeucbfkioxo`) via MCP

Com a configuração MCP `read_only=true` fornecida pelo proprietário, executamos consultas exclusivamente de leitura (`SELECT`) sobre o projeto institucional `scnryinorqeucbfkioxo`:

1. **Estado das migrations remotas:** `supabase_migrations.schema_migrations` possui **62 migrations** aplicadas (última: `20261024120000_quality_provisional_movements`). A migration `20261114000100_operational_correction_contract.sql` ainda não foi aplicada em produção (`preview_operational_change = null`, `apply_operational_change = null`, `operational_change_ledger = null`).
2. **Compatibilidade de pré-requisitos PostgreSQL 17 em `scnryinorqeucbfkioxo`:** Confirmada a existência e assinatura exata de todas as funções exigidas por `20261114000100_operational_correction_contract.sql`:
   - `radar_private.current_app_role()`
   - `radar_private.can_write_school(text)`
   - `pg_catalog.sha256(bytea)`
   - `pg_catalog.txid_current_if_assigned()` e `pg_catalog.txid_current()`
   - `pg_catalog.hashtextextended(text, bigint)` e `pg_catalog.pg_advisory_xact_lock(bigint)`
3. **Integridade de FKs e Triggers em `scnryinorqeucbfkioxo`:**
   - `pendency_attempts.pendency_id -> pendencies.id` (`ON DELETE CASCADE`)
   - `pendency_contacts.pendency_id -> pendencies.id` (`ON DELETE SET NULL`)
   - `pendencies.registered_invoice_id -> registered_invoices.id` (`ON DELETE RESTRICT`)
   - `registered_invoices.linked_asset_id -> assets.id` (`ON DELETE SET NULL`)
   - `quality_provisional_movements.registered_invoice_id -> registered_invoices.id` (`ON DELETE SET NULL`)
   - Triggers `assets_protect_inventoried_terminal_delete` e `registered_invoices_protect_inventoried_delete` ativos e compatíveis com a trava `TERMINAL_INVENTORY_LOCK` da migration `20261114000100`.
4. **Evidência empírica de produção (43 registros reais com descompasso pós-edição de NF):**
   - A consulta `SELECT` cruzando `public.pendencies` e `public.registered_invoices` revelou **43 registros reais** em que a Nota Fiscal foi editada após a abertura da Pendência (ex.: `pend-b5e947bf` com `pendency_item = "Escola das Adolescências - NF: 550"` e `invoice_number = "2217"`; `pend-0d61ce75` com `pendency_item = "Notas Fiscais — 232"` e `invoice_number = "265"`; e notas com descrição `"APAGAR LANÇAMENTO"` / `"NOTA INDEVIDA - EXCLUIR"`), comprovando a necessidade real das correções de propagação automática e exclusão assistida implementadas nesta branch.
