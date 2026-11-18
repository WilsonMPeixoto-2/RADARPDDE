# Relatório de Auditoria Técnica Independente — Frente Prontuário Visual e Correção Integrada (T0–T6)

- **Data inicial:** 15/11/2026 | **Atualização e reconciliação de branches:** 17/11/2026
- **Agente auditor:** Argon (Antigravity IDE)
- **Branch exclusiva desta auditoria e propostas:** `audit/antigravity-argon-prontuario-20261115`
- **SHAs auditados e reconciliados:**
  - `main`: atualizado de `4011a2b8` para **`58ca0c0a507fb42ee512ace95ab766edaa1f2243`** em 17/11/2026 (incorporando apenas os PRs de manutenção de ferramentas `#524` `74f92c08` e `#526` `58ca0c0a`; intocado quanto a T0–T6)
  - `fix/prontuario-integrado-validado-20261115`: auditado em `9eeedb50` → `b5cd2691` → `e26058bc` → **`20409c12591090b3b422ae014afb8cdf880bd387`** (branch oficial de execução T0–T6, que incorporou seletivamente os 6 reparos de `1cb118fd`, elevou o plano SQL para **74 asserções pgTAP** em `8361c5ee` e consolidou a documentação canônica de retomada em `ac3cc1b9`..`20409c12`)
  - `audit/gemini-revisao-critica-e-sugestoes-20261115`: auditado inicialmente em `6b4efb5d` e reauditado na recriação sobre `20409c12` em `7d6629a0` → **`d55747b9eac12b77a546bb955de397375321439d`**
  - `chore/supabase-cli3-2-remote-safety-20261117`: **`7414b21ef1b6f16e0fd919fbd85033733e3a5535`** (Draft de migração para Supabase CLI `3.2.0` — issue #530; mantida separada)
  - `chore/deps-browser-validation-blocked-20261117`: **`baf158ab26442b5de5eff285e12302a30ed9c681`** (Draft bloqueada por advisory upstream de `picomatch@4.0.7` — issue #528; mantida separada)
  - `fix/pendencias-paragrafos-legiveis-20261116` (`37de3033`, PR #522 Draft) e `hotfix/production-auth-timeout-recovery-20261116` (`ed2054a3`, PR #523 Draft): frentes isoladas, não misturadas a T0–T6
  - `audit/manus-auditoria-frente-integrada-20261114` (`a87e9e0e`), `audit/manus-t1-astra-reconstruida-20261114` (`300ac6d1`), `audit/manus-sugestoes-correcao-20261114` (`f0fa7335`) e `feat/prontuario-correcao-integrada-20261114` (`182b7949`): referências históricas

---

## 1. Resumo Executivo

1. **Integridade de isolamento e sincronização preservada:** Nenhuma alteração de T0–T6 foi publicada em `main`, no projeto Supabase institucional (`scnryinorqeucbfkioxo`) ou na Vercel. A branch `audit/antigravity-argon-prontuario-20261115` foi integralmente sincronizada com `fix/prontuario-integrado-validado-20261115@20409c12` e com `main@58ca0c0a`.
2. **Avaliação da integração oficial (`fix/prontuario-integrado-validado-20261115` até `20409c12`):**
   - Concordamos integralmente com o saneamento documental realizado em 16/11/2026 (`ac3cc1b9`..`20409c12`) nos documentos obrigatórios (`AGENTS.md`, `docs/CURRENT_STAGE.md`, `docs/reference/STATUS_DOCUMENTOS.md`, `docs/reference/PRONTUARIO_PLANO_TRANSICAO_INTEGRAL_T0_T6.md`, `docs/superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md`, `docs/handoff/2026-11-15-prontuario-integracao-verificada.md` e `docs/audits/2026-11-16-reconciliacao-branches-codigo-documentacao-t0-t6.md`).
   - Os 6 reparos de código e testes que havíamos desenvolvido em `1cb118fd` já foram incorporados à branch oficial (`25ed80ea`..`8361c5ee`), junto com a **74ª asserção pgTAP** (`T2: prévia da análise individual inclui versões das NFs irmãs do agregado`).
   - A distinção central registrada em `20409c12` é exata: **T2 e T3 já possuem código candidato conectado na UI e no SQL (sob flag OFF por padrão), mas ainda exigem homologação real no Docker local (74 pgTAP + Auth/RLS + persistência pós-F5 + segunda sessão + aceite visual do proprietário) antes de iniciar T4 e T5.**
3. **Avaliação da branch `audit/gemini-revisao-critica-e-sugestoes-20261115` (`7d6629a0` → `d55747b9`) e das branches de manutenção de 17/11/2026:**
   - Na mensagem inicial (`7d6629a0`), o parecer do Gemini atribuiu genericamente a falha dos 6 PRs do Dependabot aos scripts `check:generated`, `audit:inventory` e `audit:exceljs-policy`. No commit subsequente **`d55747b9`** (`17/11/2026 01:54 BRT`), o próprio relatório na branch corrigiu o diagnóstico com base nos logs de CI (`actions/runs/43864109099` e `actions/runs/43864153266`): a causa imediata nos testes unitários eram os **contratos de versão exata fixados em `tests/unit/tooling-contract.test.js` e `tests/unit/supabase-modernization.test.js`**, além do inventário `dependency-health/npm-audit.json` e `docs/TECHNOLOGY_CAPABILITIES_TRACKER.md`.
   - **Fato novo ocorrido em 17/11/2026 na `main` (`74f92c08` e `58ca0c0a`):** as atualizações seguras de ferramentas recomendadas já foram homologadas e mescladas na `main` através do **PR #524 (`74f92c08`)** (`@playwright/test@1.65.1`, `msw@3.0.6`, `knip@6.45.1`, `prettier@3.10.1`, `puppeteer-core@25.17.0`) e do **PR #526 (`58ca0c0a`)** (`eslint@10.15.0`, `dependency-cruiser@18.8.0`), zerando as vulnerabilidades do `npm audit` e mantendo o `supabase` CLI em `2.122.0`.
   - Concordamos também em **não instalar pacotes novos** no frontend e em aguardar antes de incorporar a migração Major `supabase` CLI `3.2.0` (`chore/supabase-cli3-2-remote-safety-20261117@7414b21e`, issue #530) ou `lighthouse@13.6.0` (`chore/deps-browser-validation-blocked-20261117@baf158ab`, bloqueada pelo advisory upstream de `picomatch@4.0.7`, issue #528).

---

## 2. Histórico Consolidado das Contribuições desta Branch (`audit/antigravity-argon-prontuario-20261115`)

### 2.1. Contribuições de 15/11/2026 (`1cb118fd` — já incorporadas em `fix/prontuario-integrado-validado-20261115@20409c12`)

1. **Preservação das caixinhas de Pendências candidatas (`src/integration/operational-correction-dialog.js`):** removido o reset prematuro `candidatePendencyIds = []` dentro de `renderPlan(view)` que apagava os checkboxes ao marcar a última Pendência candidata em `AMBIGUOUS_CONSEQUENCE`.
2. **Retorno à fila de Pendências Operacionais após confirmação (`src/integration/operational-correction-dialog.js`):** `synchronizeConfirmed()` detecta `.pendency-page-header` e chama `root.renderPendencias()` em vez de `root.renderProntuario(target.schoolId)`.
3. **Preservação da 1ª análise direta em 1 clique (`app.js`):** `changeInvoiceDocumentAnalysis` e `changeInvoiceAdvisoryAnalysis` só abrem o modal de retificação quando `previousValue !== 'Não analisado'`.
4. **Exibição da identificação atual da NF na exclusão de Pendência (`app.js`) e em todas as projeções (`pendencias-view-model.js`, `task-9-pendencias-page.js`, `task-9-cross-view.js`, `global-search-index.js`):** motivada pela constatação somente-leitura de **43 registros reais** em `scnryinorqeucbfkioxo` em que a NF foi editada após a abertura da Pendência.
5. **Ordem visual consistente dos botões na linha da NF (`src/integration/auditable-retification.js`):** `Editar lançamento` posicionado via `prepend` à esquerda de `Excluir`.
6. **Captura de `row_version` das NFs irmãs e `FOR UPDATE` em `pendency_attempts` (`supabase/migrations/20261114000100_operational_correction_contract.sql`):** coberto pela **74ª asserção pgTAP** (`8361c5ee`).

### 2.2. Novo Refinamento de UI e Acessibilidade em 17/11/2026 (Pronto em `audit/antigravity-argon-prontuario-20261115`)

| # | Escopo | Achado | Solução Aplicada e Verificada |
|---|---|---|---|
| **7** | `app.js`, `src/integration/service-advisory-pendency.js`, `src/integration/prontuario-conditional-reconciler.js`, `src/integration/operational-correction-dialog.js`, `src/integration/auditable-retification.js`, `src/styles/unidentified-expense-ux.css`, `src/styles/evaluation-retification-ui.css`, `tests/unit/service-advisory-pendency.test.js`, `tests/unit/prontuario-conditional-reconciler.test.js`, `tests/e2e/operational-correction-dialog.spec.js` | 1. Em `src/integration/service-advisory-pendency.js` (`patchUi`), o wrapper `changeInvoiceAdvisoryAnalysisPerInvoice` substituía `window.changeInvoiceAdvisoryAnalysis` sem verificar `RadarOperationalCorrectionDialog.canUse(root)` nem o `legacyFallback` de NF única, contornando o diálogo T2 ao alterar o `<select>` de uma linha de Consulta à Assessoria já analisada.<br>2. Em `src/integration/prontuario-conditional-reconciler.js`, a reconciliação incremental após a 1ª análise de `consAssessoria` (`Não analisado` → `Correto`) não atualizava a classe `is-correct`/`is-late`/`is-incorrect`/`is-pending` do `<select>` nem injetava o botão `Editar análise` em `.invoice-document-action`.<br>3. Nas linhas de **Consulta à Assessoria** (`service-advisory-row` em `app.js:10791`), faltava o botão explícito `Editar análise` na coluna `Ação`, e os botões repetidos `Editar análise` e `Visualizar pendência` precisavam de `aria-describedby` apontando para `fiscal-invoice-title-<id>` / `advisory-invoice-title-<id>` (`modern-web-guidance`: `accessibility`).<br>4. Os diálogos modais precisavam de `overscroll-behavior: contain` no modal e `overflow: hidden; overscroll-behavior: contain` no backdrop, `autofocus`/foco inicial na ação segura `Cancelar` em confirmações destrutivas (`delete_invoice`, `delete_pendency` e `confirmInvoiceTypeChange`), e `input:not(:disabled)` no ciclo de foco `Tab` (`modern-web-guidance`: `dialog`). | 1. Conectada a delegação a `openInvoiceOperationalCorrection` em `service-advisory-pendency.js` quando `previous !== 'Não analisado'` e `value !== 'Incorreto'`, preservando a 1ª análise em 1 clique.<br>2. Sincronizados o botão `Editar análise` e as classes de status do `<select>` em `prontuario-conditional-reconciler.js`.<br>3. Adicionado botão `Editar análise` em `service-advisory-row` e `aria-describedby` em `Editar análise` e `Visualizar pendência` (`app.js`).<br>4. Aplicado `overscroll-behavior: contain` nos modais/backdrops, foco inicial seguro em `Cancelar` nas confirmações destrutivas e `input:not(:disabled)` na captura de `Tab`.<br>5. Provado por **2 novos testes unitários** (`1.418/1.418 PASS`) e pelo **19º teste Playwright E2E** em `tests/e2e/operational-correction-dialog.spec.js` (**19/19 PASS**). |

---

## 3. Verificação Crítica das Demais Branches do Repositório (17/11/2026)

| Branch | HEAD Conferido | Situação e Decisão para nossa Branch |
|---|---|---|
| `fix/prontuario-integrado-validado-20261115` | `20409c12` | **Mesclada integralmente.** Contém o código candidato T1–T3, as 74 asserções pgTAP preparadas e toda a documentação canônica reconciliada em 16/11. |
| `main` | `58ca0c0a` | **Mesclada integralmente.** Incorpora os PRs `#524` (`74f92c08`) e `#526` (`58ca0c0a`) de 17/11/2026 (Playwright `1.65.1`, MSW `3.0.6`, Knip `6.45.1`, Prettier `3.10.1`, Puppeteer `25.17.0`, ESLint `10.15.0`, dependency-cruiser `18.8.0`, 0 vulnerabilidades `npm audit`). |
| `audit/gemini-revisao-critica-e-sugestoes-20261115` | `d55747b9` | **Analisada e reconciliada.** Concordamos com o diagnóstico final de `d55747b9` sobre `tooling-contract.test.js`, com os limites de `Ajv`/`fast-check`/`@axe-core/playwright` e com a prioridade de homologar T1–T3 no Docker antes de T4/T5. |
| `chore/supabase-cli3-2-remote-safety-20261117` | `7414b21e` | **Não mesclar agora.** Migração candidata para Supabase CLI `3.2.0` (issue #530), ainda em Draft e com bloqueio de `npm audit` em devDependencies (`picomatch@4.0.7`, issue #528). Manter `supabase@2.122.0` durante a homologação de T1–T5. |
| `chore/deps-browser-validation-blocked-20261117` | `baf158ab` | **Não mesclar agora.** Atualiza `@axe-core/playwright@4.14.1` e `lighthouse@13.6.0`, mas introduz o mesmo bloqueio upstream `picomatch@4.0.7` (issue #528). |
| `fix/pendencias-paragrafos-legiveis-20261116` | `37de3033` (PR #522) | **Mantida separada (Draft).** Altera `src/styles/task-9-pendencias.css`; avaliar colisão visual apenas durante a homologação das gavetas T2/T3. |
| `hotfix/production-auth-timeout-recovery-20261116` | `ed2054a3` (PR #523) | **Mantida separada (Draft).** Hotfix isolado de recuperação de autenticação; não faz parte do escopo T0–T6. |
