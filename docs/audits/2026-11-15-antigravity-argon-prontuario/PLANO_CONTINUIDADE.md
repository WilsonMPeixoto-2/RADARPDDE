# Plano de Continuidade — Reconciliação Integral das Branches e Próximos Passos (T2–T6)

- **Data de atualização:** 17/11/2026
- **Branch desta auditoria e evolução sincronizada:** `audit/antigravity-argon-prontuario-20261115`
- **Branches sincronizadas nesta atualização:**
  - `fix/prontuario-integrado-validado-20261115@20409c12591090b3b422ae014afb8cdf880bd387` (branch oficial da frente T0–T6)
  - `main@58ca0c0a507fb42ee512ace95ab766edaa1f2243` (PR #524 `74f92c08` + PR #526 `58ca0c0a` de 17/11/2026)
- **Branches paralelas conferidas e mantidas isoladas:**
  - `audit/gemini-revisao-critica-e-sugestoes-20261115@d55747b9` (relatório de sincronização `20409c1` e diagnóstico dos contratos de versão do Dependabot)
  - `chore/supabase-cli3-2-remote-safety-20261117@7414b21e` (Draft da migração candidata para `supabase` CLI `3.2.0` — issue #530; **não misturar** antes de concluir a homologação Docker de T2–T5)
  - `chore/deps-browser-validation-blocked-20261117@baf158ab` (Draft bloqueada por advisory upstream de `picomatch@4.0.7` em devDependencies — issue #528)
  - `fix/pendencias-paragrafos-legiveis-20261116@37de3033` (PR #522 Draft — quebras de parágrafo em observações de Pendências)
  - `hotfix/production-auth-timeout-recovery-20261116@ed2054a3` (PR #523 Draft — hotfix isolado de recuperação de autenticação)

---

## 1. O que já foi reconciliado entre as branches (até 17/11/2026)

1. **Incorporação das 6 correções do Antigravity (`1cb118fd`) na branch oficial (`fix/prontuario-integrado-validado-20261115@a8e47045` → `20409c12`):**
   - Os commits `25ed80ea`, `a83b8ed9`, `56f1fe53`, `7c0a471c`, `78a62de9` e `8361c5ee` incorporaram integralmente à branch oficial todas as correções de código e testes de `1cb118fd` e adicionaram a **74ª asserção pgTAP** (`T2: prévia da análise individual inclui versões das NFs irmãs do agregado` em `supabase/tests/database/operational-correction.test.sql`).
2. **Saneamento documental canônico (`ac3cc1b9`..`20409c12`, 16/11/2026):**
   - `AGENTS.md`, `docs/CURRENT_STAGE.md`, `docs/reference/STATUS_DOCUMENTOS.md`, `docs/reference/PRONTUARIO_PLANO_TRANSICAO_INTEGRAL_T0_T6.md`, `docs/superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md`, `docs/handoff/2026-11-15-prontuario-integracao-verificada.md` e `docs/audits/2026-11-16-reconciliacao-branches-codigo-documentacao-t0-t6.md` estão agora incorporados também nesta branch (`audit/antigravity-argon-prontuario-20261115`).
3. **Sincronização das atualizações seguras de ferramentas já homologadas na `main` em 17/11/2026 (`74f92c08` PR #524 e `58ca0c0a` PR #526):**
   - Enquanto os relatórios de 16/11 ainda registravam `main` em `4011a2b8` e propunham atualizar 5 pacotes de desenvolvimento futuramente, **em 17/11/2026 a `main` já recebeu e homologou os PRs #524 (`74f92c08`) e #526 (`58ca0c0a`)**:
     - `@playwright/test`: `1.65.0` → `1.65.1`
     - `msw`: `3.0.4` → `3.0.6` (versão mais recente que a `3.0.5` do PR #520)
     - `knip`: `6.44.1` → `6.45.1`
     - `prettier`: `3.9.10` → `3.10.1`
     - `puppeteer-core`: `25.16.0` → `25.17.0`
     - `eslint`: `10.14.0` → `10.15.0`
     - `dependency-cruiser`: `18.7.2` → `18.8.0`
   - Esses dois commits atualizam `package.json`, `package-lock.json`, `tests/unit/tooling-contract.test.js`, `docs/TECHNOLOGY_CAPABILITIES_TRACKER.md` e `dependency-health/npm-audit.json` (zerando vulnerabilidades no `npm audit`), mantendo `supabase` CLI na `2.122.0`. Já foram mesclados de forma limpa nesta branch.
4. **Refinamento complementar de UI e acessibilidade (`modern-web-guidance` — `dialog` e `accessibility`) aplicado nesta branch:**
   - **Botão explícito `Editar análise` nas linhas de Consulta à Assessoria (`service-advisory-row` em `app.js`):** quando `RadarOperationalCorrectionDialog.canUse(window)` está ativo, a linha de serviço já analisada sem Pendência ativa passa a exibir na coluna `Ação` o botão `Editar análise` (simétrico às linhas de Notas Fiscais), acionando `openInvoiceOperationalCorrection(note.id, esc.id, 'consAssessoria', this)`.
   - **Desambiguação acessível via `aria-describedby` (`app.js`):** os botões `Editar análise` de Notas Fiscais e de Consulta à Assessoria referenciam o título da respectiva NF (`fiscal-invoice-title-<id>` e `advisory-invoice-title-<id>`), mantendo o nome acessível exato `"Editar análise"` e fornecendo o contexto da NF para leitores de tela.
   - **Contenção de scroll e `autofocus` em confirmações modais (`src/styles/unidentified-expense-ux.css`, `src/styles/evaluation-retification-ui.css`, `src/integration/auditable-retification.js`):** aplicado `overscroll-behavior: contain` no modal e `overflow: hidden; overscroll-behavior: contain` no `::backdrop`, além de `autofocus` na ação segura `Cancelar` do `<dialog>` nativo `confirmInvoiceTypeChange`.
   - **Cobertura E2E ampliada (`tests/e2e/operational-correction-dialog.spec.js`):** **19/19 testes Playwright aprovados**.

---

## 2. Sequência de Execução Vigente (Alinhada a `docs/CURRENT_STAGE.md` e `20409c12`)

### Etapa 1 — Homologação integral de T1–T3 no Docker local (Prioridade Imediata)
1. **Não reimplementar o código de T2/T3 já conectado.**
2. Com Docker ativo, subir e resetar o Supabase descartável local:
   ```bash
   npm run supabase:start
   npm run supabase:reset
   npm run supabase:test:db
   ```
3. Executar as **74 asserções `pgTAP`** (`supabase/tests/database/operational-correction.test.sql`) e o ensaio de concorrência real (`scripts/test-operational-correction-concurrency.sh`) em PostgreSQL 17 local.
4. Executar os testes Playwright autenticados com o piloto habilitado em loopback (`RADAR_OPERATIONAL_CORRECTION_PREVIEW=true`, `RADAR_DATA_MODE=supabase-preview`, `RADAR_ENVIRONMENT=test`, `RADAR_SUPABASE_URL=http://127.0.0.1:54321`), validando:
   - Auth/RLS real por perfil (`controlador`, `assistente`, `inventario`, `sme`);
   - Persistência real após `F5` (`page.reload()`) e em segunda sessão;
   - Concorrência entre duas operações com chaves distintas e criação concorrente de dependente entre `preview` e `apply`;
   - Retorno de saída provisória do PDDE Qualidade ao excluir NF originada de identificação;
   - Reflexo em todos os consumidores (Prontuário, Pendências, Passivo, Inventário, Busca Global, Alertas, Timeline e Excel).
5. Submeter as janelas reais à navegação e aceite visual do proprietário.

### Etapa 2 — Implementação e homologação de T4 (Após o gate de T2/T3)
1. Implementar a edição pós-consolidação da bonificação com estado **"Alterações pendentes de consolidação"** e ação **"Consolidar alterações"** (conforme §7.1 da matriz de transição e contrato aprovado).
2. Implementar `clear_item_history` e `delete_context` na migration SQL, no cliente e na UI do Prontuário, com prévia completa de dependentes e proteção de contextos vizinhos.

### Etapa 3 — Implementação e homologação de T5 (Após T4)
1. Conectar `src/domain/pendency-correction.js` (já reconciliado e testado unitariamente) às RPCs transacionais de histórico de Pendências (`delete_attempt`/`correct_attempt`, `delete_review`/`correct_review`), contatos (`delete_contact`/`correct_contact`) e inventário (`correct_inventory`/`delete_asset`), padronizando a nomenclatura entre domínio e SQL.

### Etapa 4 — Homologação Global e Fechamento Canônico (T6)
1. Concluir os gates integrados no mesmo SHA, reconciliar `SYSTEM_CANONICAL_MODEL.md`, `PRODUCT_SURFACE_CATALOG.md`, `FUNCTIONAL_CONTRACT_MATRIX.md` e `STATUS_DOCUMENTOS.md`, e remover a rota temporária de `AGENTS.md` somente após autorização explícita de release.
