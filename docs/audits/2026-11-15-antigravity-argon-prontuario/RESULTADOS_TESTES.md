# Resultados dos Testes Reproduzidos e Evidências de Execução

- **Data:** 15/11/2026
- **Ambiente de execução:** Windows 11 / PowerShell, Node.js `v24.22.3`, Playwright Chromium headless (`desktop-chromium`), `git config core.autocrlf false`
- **Clone isolado:** `C:\Users\Wilson\.gemini\antigravity\scratch\radarpdde-argon-20261115`
- **Branch testada:** `audit/antigravity-argon-prontuario-20261115` (baseada em `origin/fix/prontuario-integrado-validado-20261115@b5cd2691`, com avaliação prévia também sobre `9eeedb50` e `6b4efb5d`)

---

## 1. Síntese Geral por Nível de Teste

| Nível | Escopo | Comando Executado | Resultado | Observações / Limitações Reais |
|---|---|---|---|---|
| **Nível 1** | Sintaxe, matriz funcional, referências de workflows, arquitetura (`depcruise`), vendors, `stylelint`, `eslint`, alinhamento Supabase, tipos TS e auditoria funcional | `npm run test:readiness` | **APROVADO (exit code 0)** | 44 operações na matriz funcional, 39 workflows, 209 módulos / 324 dependências sem violação, 0 erros de lint CSS/JS/E2E. |
| **Nível 2** | Testes unitários Node.js (incluindo novos testes de idempotência do cliente, diálogo e `pendency-correction.test.js`) | `npm run test:unit` e `node --test tests/unit/operational-correction-client.test.js tests/unit/operational-correction-dialog.test.js tests/unit/pendency-correction.test.js` | **APROVADO (1.412/1.412 no gate completo; 20/20 nos 3 arquivos focados)** | Cobertura unitária de `clear_analysis`, congelamento de payload no retry (`WeakMap`), `requiresLateCorrect` real, erro explícito em `targetId` inexistente e `AMBIGUOUS_ATTEMPT_TARGET`. |
| **Nível 3** | Testes de integração Node.js | `npm run test:integration` | **APROVADO (8/8)** | `local-storage-repository.test.js`, `migration-cli.test.js`, `supabase-repository.test.js`, `verification-atomic-persistence.test.js`. |
| **Nível 4** | Banco de dados descartável / pgTAP (`operational-correction.test.sql`) | Verificação estática local (`npm run check:supabase`, `npm run check:supabase-final`, `npm run typecheck:database`) + inspeção da evidência pgTAP do Manus (`wt-manus-audit`) | **Estático: APROVADO**<br>**Dinâmico PG17 (Manus): 59/59 aprovados** (60ª asserção adicionada nesta branch) | **Limitação de ambiente documentada:** este host Windows não possui `psql`, `pg_isready`, `docker` ou WSL instalados. O Supabase remoto institucional (`scnryinorqeucbfkioxo`) **não** foi utilizado para testes destrutivos, em cumprimento estrito à restrição de segurança. |
| **Nível 5** | Concorrência SQL (`scripts/test-operational-correction-concurrency.sh`) | Inspeção do script e da trava `pg_advisory_xact_lock` em `20261114000100_operational_correction_contract.sql:826` | **Validado por inspeção de código e evidência de `5a62a18b`** | O script lança duas sessões `psql` sincronizadas na barreira `/tmp/occ-barrier` com a mesma `operationKey` e comprova `1 committed + 1 replayed` e 1 linha no ledger. Reexecução dinâmica requer ambiente Linux/PostgreSQL local. |
| **Nível 6** | Navegador Playwright E2E (T1 layout, contraste escuro, governança SME, diálogo T2 e retificação legada) | `npx playwright test tests/e2e/operational-correction-dialog.spec.js tests/e2e/prontuario-correction-layout.spec.js tests/e2e/prontuario-dark-contrast-regression.spec.js tests/e2e/sme-access-governance.spec.js tests/e2e/evaluation-retification.spec.js --project=desktop-chromium` | **APROVADO (22/22 testes verdes em 8 workers)** | **Distinção metodológica obrigatória:** os 11 testes de `operational-correction-dialog.spec.js` exercitam o DOM real no Chromium com transporte RPC controlado (`executeRpc` simulado), e **não** substituem o teste E2E autenticado contra Supabase descartável. |
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
