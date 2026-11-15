# Plano de Continuidade — Integração Segura das Correções e Próximos Passos (T2–T6)

- **Data:** 15/11/2026
- **Branch de origem das propostas validadas:** `audit/antigravity-argon-prontuario-20261115`
- **Branch alvo de integração pelo proprietário ou pelo agente Astra:** `fix/prontuario-integrado-validado-20261115` (a partir de `b5cd2691`)

---

## 1. O que pode ser incorporado imediatamente de `audit/antigravity-argon-prontuario-20261115`

Diferentemente da branch `audit/gemini-revisao-critica-e-sugestoes-20261115@6b4efb5d` (que quebrava a API `open()` do diálogo e continha fallback silencioso em `findTargetAttemptIndex`), a branch `audit/antigravity-argon-prontuario-20261115` foi construída diretamente sobre **`b5cd2691`** (`fix/prontuario-integrado-validado-20261115`), preservando 100% da API pública, do DOM e dos testes existentes.

### Arquivos de código e testes prontos para incorporação direta (`git cherry-pick` ou `git merge --ff-only`):

1. **`src/integration/operational-correction-dialog.js` + `tests/e2e/operational-correction-dialog.spec.js` + `tests/unit/operational-correction-dialog.test.js`:**
   - Completa o suporte a `AMBIGUOUS_CONSEQUENCE` no diálogo piloto: quando `preview_operational_change` retorna `blockers` com `code === 'AMBIGUOUS_CONSEQUENCE'` e `candidates`, renderiza checkboxes explícitos (`data-pendency-candidate-id`, desmarcados por padrão — nunca auto-selecionados) e reexecuta a prévia enviando `selectedPendencyIds`.
   - Remove eventual botão `#radar-operational-correction-reload` caso uma repetição receba `STALE_PLAN`.
   - Exporta `ANALYSES` na interface pública congelada `{ ANALYSES, canUse, open }`.
2. **`src/application/operational-correction-client.js` + `tests/unit/operational-correction-client.test.js` + `supabase/migrations/20261114000100_operational_correction_contract.sql` + `supabase/tests/database/operational-correction.test.sql`:**
   - Congela o payload `p_request` na primeira chamada `apply(confirmation, extra)` por `confirmation` (`WeakMap`), impedindo que chamadas diretas ao cliente mutem o payload para a mesma `operationKey`.
   - Em `apply_operational_change_impl` (`20261114000100_operational_correction_contract.sql:803`), calcula `v_fingerprint` sobre `(coalesce(p_request, '{}'::jsonb) - 'note')::text`, alinhando o fingerprint de idempotência ao `previewPayload` enquanto continua gravando `p_request` e `note` integralmente em `operational_change_ledger`.
3. **`src/domain/pendency-correction.js` + `tests/unit/pendency-correction.test.js`:**
   - Substitui o artefato preliminar de T5 por uma implementação pura alinhada ao esquema real de `src/domain/pendencias.js` (`tentativas` com `status: 'aguardando' | 'analisada' | 'substituida_antes_da_analise'`, `resultado: 'correto' | 'incorreto' | 'arquivo_indisponivel'`) e à regra real `requiresLateCorrect({ bonusResult, deliveryStatus })` de `src/domain/fluxo-operacional.js`.
   - **Corrige o defeito apontado em `46bd6dfc` sobre `G-03`:** `resolveTargetAttemptIndex` jamais cai silenciosamente na última tentativa (`attempts.length - 1`). Se `targetId` não existir, lança erro explícito; se `targetId` for omitido quando há múltiplas tentativas, retorna `ambiguity: { code: 'AMBIGUOUS_ATTEMPT_TARGET', candidates }`.
4. **`styles.css` + `src/styles/prontuario-operational-ux.css`:**
   - Inclui as regras de superfície escura de `.prontuario-school-header` e `#prontuario-verif-rows .invoice-document-row` diretamente na folha síncrona `styles.css` e restringe a transição no tema escuro a `transition: box-shadow 150ms ease`, eliminando a falha intermitente de contraste AA sob execução paralela (`prontuario-dark-contrast-regression.spec.js`).

---

## 2. Sequência Recomendada para Concluir T2–T6 na Branch Integrada

### Passo 1 — Incorporar o incremento validado desta branch
```bash
git checkout fix/prontuario-integrado-validado-20261115
git cherry-pick <SHA_DO_COMMIT_DE_CODIGO_DA_BRANCH_AUDIT_ANTIGRAVITY_ARGON>
npm run test:readiness
npx playwright test tests/e2e/operational-correction-dialog.spec.js tests/e2e/prontuario-correction-layout.spec.js tests/e2e/prontuario-dark-contrast-regression.spec.js tests/e2e/sme-access-governance.spec.js tests/e2e/evaluation-retification.spec.js --project=desktop-chromium
```

### Passo 2 — Fechar as entradas restantes de UI de T2 e T3
1. **Análise individual de NF e Consulta Assessoria (`T2`):**
   - Em `app.js` (`beginInvoiceDocumentAnalysisEdit` / `changeInvoiceDocumentAnalysis` / `changeInvoiceAdvisoryAnalysis`), quando `RadarOperationalCorrectionDialog.canUse(window)` for verdadeiro, abrir `RadarOperationalCorrectionDialog.open(window, { context: { schoolId, competence, programId, documentKey, invoiceId: note.id, documentLabel }, currentValue })`.
2. **Exclusão de Pendência (`T2` — `delete_pendency`) e Exclusão de NF com dependências (`T3` — `delete_invoice`):**
   - Estender `RadarOperationalCorrectionDialog.open` (sem quebrar o modo padrão de análise) para aceitar `mode: 'delete_pendency' | 'delete_invoice'`, exibindo apenas a prévia dos efeitos (`describePlan`), o campo opcional `Observação (opcional)` e os botões `Cancelar` / `Revisar prévia` / `Confirmar exclusão`.
   - Em `app.js:10598`, permitir acionar a exclusão de NF via diálogo integrado mesmo quando `hasPendencyHistory === true` (desde que `RadarOperationalCorrectionDialog.canUse(window)` esteja ativo).

### Passo 3 — Validação E2E autenticada em Supabase descartável (Níveis 4, 5 e 6 reais)
1. Subir instância Supabase local/descartável (em runner Linux/Docker):
   - Executar `supabase test db supabase/tests/database/operational-correction.test.sql` (60 asserções) e `bash scripts/test-operational-correction-concurrency.sh`.
   - Executar teste Playwright autenticado com `RADAR_OPERATIONAL_CORRECTION_PREVIEW = true` contra o Supabase descartável real (sem mock de `executeRpc`), validando persistência após `page.reload()` (F5).

### Passo 4 — Evolução de T4, T5 (SQL/UI) e Fechamento T6
1. **T4:** Adicionar `delete_context`, `clear_bonification` e `reopen_consolidation` na migration SQL e conectar ao cabeçalho do programa.
2. **T5:** Conectar `src/domain/pendency-correction.js` (já reconciliado nesta branch) às novas ações SQL de histórico (`correct_submission`, `delete_submission`, `correct_review`, `delete_review`), contatos (`pendency_contacts`) e reversão de inventário (`assets`).
3. **T6:** Após homologação visual e funcional pelo proprietário, ativar a flag por padrão, reconciliar `SYSTEM_CANONICAL_MODEL.md`, `PRODUCT_SURFACE_CATALOG.md` e `STATUS_DOCUMENTOS.md`, e remover a rota temporária do topo de `AGENTS.md`.
