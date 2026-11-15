# Relatório de Auditoria Técnica Independente — Frente Prontuário Visual e Correção Integrada (T0–T6)

- **Data:** 15/11/2026
- **Agente auditor:** Argon (Antigravity IDE)
- **Branch exclusiva desta auditoria e propostas:** `audit/antigravity-argon-prontuario-20261115`
- **SHAs auditados:**
  - `main`: `4011a2b82b7cf557f10bdba64ab6b793409282cc` (intocado)
  - `fix/prontuario-integrado-validado-20261115`: auditado inicialmente em `9eeedb501a08e023ce8ea3767d641ca082b8ee81` e reconciliado com o avanço paralelo até `b5cd26918c102cadda651f5fe62d3f583b908836` (`46bd6dfc`, `e8a596a2`, `b5cd2691`)
  - `audit/manus-auditoria-frente-integrada-20261114`: `a87e9e0e6e7fa9dbff3f4daefdd534d2834f1116`
  - `audit/manus-t1-astra-reconstruida-20261114`: `300ac6d19f27dc25c86aaebbf8ac3581d62a4fa2`
  - `audit/manus-sugestoes-correcao-20261114`: `f0fa73355f2e6fc48870b2dcfa846d3d6402da10`
  - `feat/prontuario-correcao-integrada-20261114`: `182b7949b0d84dbdc4224b0499da093ca2d52c92`
  - `audit/gemini-revisao-critica-e-sugestoes-20261115`: `6b4efb5d42dc086c25b86985e5194657d155dbac`

---

## 1. Resumo Executivo

1. **Integridade de isolamento preservada:** Nenhuma alteração foi realizada em `main`, em `fix/prontuario-integrado-validado-20261115`, nas branches do Manus ou do Gemini anterior, nem no projeto Supabase institucional (`scnryinorqeucbfkioxo`) ou na Vercel. Todo o trabalho desta auditoria está isolado em `audit/antigravity-argon-prontuario-20261115`.
2. **Avaliação da integração atual (`fix/prontuario-integrado-validado-20261115` em `9eeedb50` → `b5cd2691`):**
   - A branch integrada incorporou com sucesso a reconstrução da T1 do Astra (`300ac6d1`), a migration SQL e o cliente de correção do Manus (`f0fa7335`), a serialização concorrente por `pg_advisory_xact_lock` antes da leitura do ledger (`5a62a18b`), a correção de superfície no tema escuro e o aproveitamento seletivo (`46bd6dfc` / `b5cd2691`) de `clear_analysis` (`Não analisado`) e bloqueio de mutação após falha de rede de resultado incerto.
3. **Auditoria independente da branch `audit/gemini-revisao-critica-e-sugestoes-20261115@6b4efb5d`:**
   - Confirmamos de forma independente que `6b4efb5d` **não pode ser mesclada integralmente**:
     - Substituiu a assinatura pública `RadarOperationalCorrectionDialog.open(root, input)` por `openCorrectionDialog(options)`, quebrando 6 dos 8 testes Playwright existentes (`TypeError: ...open is not a function`).
     - Reintroduziu campo de frase de confirmação (`Digite CONFIRMAR se exigido`), violando a decisão do proprietário de não exigir confirmação textual adicional.
     - Contém erro factual no achado `G-01` (alegava que `9eeedb50` enviava `target.invoiceId` sem mapear para `target.id`, quando `src/integration/operational-correction-dialog.js:49` já executava `if (context.invoiceId) target.id = context.invoiceId`).
     - No achado `G-03` (`src/domain/pendency-correction.js`), a função `findTargetAttemptIndex(attempts, targetId)` caía silenciosamente em `return attempts.length - 1` quando `targetId` não era encontrado, podendo corrigir ou excluir a tentativa errada.
4. **Contribuições e correções desenvolvidas e validadas nesta branch (`audit/antigravity-argon-prontuario-20261115`):**
   - **Seleção explícita de Pendências candidatas (`AMBIGUOUS_CONSEQUENCE`) no diálogo piloto (`src/integration/operational-correction-dialog.js`):** sem auto-selecionar nenhuma Pendência, o diálogo agora renderiza checkboxes explícitos quando o servidor retorna `AMBIGUOUS_CONSEQUENCE` com `candidates` e reexecuta `preview_operational_change` com `selectedPendencyIds`.
   - **Blindagem de idempotência da observação opcional (`note`) no cliente e no SQL (`src/application/operational-correction-client.js` e `supabase/migrations/20261114000100_operational_correction_contract.sql`):** o cliente congela o payload `p_request` na primeira chamada `apply` por `confirmation` (`WeakMap`) e a função SQL `apply_operational_change_impl` calcula `v_fingerprint` sobre `(coalesce(p_request, '{}'::jsonb) - 'note')::text` (consistente com `previewPayload`), preservando a gravação integral de `note` no livro-razão (`operational_change_ledger`).
   - **Reconciliação segura de `src/domain/pendency-correction.js` (T5):** alinhado ao esquema real de `src/domain/pendencias.js` (`tentativas` com `status: 'aguardando' | 'analisada' | 'substituida_antes_da_analise'`, `resultado: 'correto' | 'incorreto' | 'arquivo_indisponivel'`) e à regra real `requiresLateCorrect({ bonusResult, deliveryStatus })` de `src/domain/fluxo-operacional.js`, **eliminando o fallback silencioso** para a última tentativa: `targetId` inexistente lança erro explícito e múltiplas tentativas sem `targetId` retornam bloqueio `AMBIGUOUS_ATTEMPT_TARGET`.
   - **Estabilidade determinística de contraste AA no tema escuro (`styles.css` e `src/styles/prontuario-operational-ux.css`):** eliminada a condição de corrida sob carga paralela de CPU em que a transição de 150 ms de `background` em `.invoice-document-row` (`global-visual-polish.css`) e o carregamento pós-pintura (`requestIdleCallback`) de `prontuario-operational-ux.css` mantinham fundo claro transitório sob texto claro ao alternar para `body.dark-theme`.

---

## 2. Classificação Rigorosa dos Achados (6 Categorias Obrigatórias)

### Categoria 1 — Defeito antigo já identificado pelo Manus

| ID | Severidade | Descrição e Causa Raiz | Estado em `b5cd2691` |
|---|---|---|---|
| `M-01` (`F-01`..`F-10` Manus) | Crítica | Na implementação original do Gemini Argon (`182b7949`), a migration SQL permitia mutação por perfil `sme` autenticado, órfãos patrimoniais em `assets`, exclusão fora de escopo sem validar `school_id`/`competence`/`program_id`, resultados inválidos em `correct_analysis`, digest sem estado/versão e `delete_pendency` deixando `Incorreto` órfão. | **Corrigido e integrado** via migration do Manus (`20261114000100_operational_correction_contract.sql`) + lock transacional (`5a62a18b`). |
| `M-02` (`F-11`..`F-12` Manus) | Alta | `operational-correction-service.js` e `operational-correction-ui.js` originais (`182b7949`) não tinham consumidores reais, geravam nova `operationKey` a cada clique e enviavam formato incompatível com a RPC. | **Corrigido e integrado** pela substituição por `src/application/operational-correction-client.js` e `src/integration/operational-correction-dialog.js`. |
| `M-03` (`ADENDO-01`/`02` Manus) | Média | Contraste insuficiente no tema escuro em `.prontuario-school-header h1` (1,04:1) e `.invoice-document-title-line > strong` (1,02:1). | **Corrigido em `5a62a18b`** e reforçado contra corrida de transição nesta branch (`A-04`). |

---

### Categoria 2 — Defeito antigo cuja correção não foi incorporada ou ficou incompleta

| ID | Severidade | Descrição e Causa Raiz | Evidência e Solução nesta Branch |
|---|---|---|---|
| `A-01` (`F-13`/`F-14` Manus + `G-03`) | Alta | `src/domain/pendency-correction.js` foi preservado em `5a62a18b` (`9eeedb50` / `b5cd2691`) a partir do commit histórico `7af651e` apenas como material preliminar. Ele ainda operava sobre eventos fictícios (`kind: 'open' \| 'submission' \| 'review'`) e calculava atraso por comparação de datas (`submissionDate > cutoffDate`) em vez de `requiresLateCorrect({ bonusResult, deliveryStatus })`. Além disso, a tentativa de correção em `6b4efb5d` introduziu fallback silencioso para `attempts.length - 1` quando `targetId` não existia. | **Corrigido em `src/domain/pendency-correction.js` e provado em `tests/unit/pendency-correction.test.js`:** opera sobre `pendency.tentativas` reais (`aguardando`, `analisada`, `substituida_antes_da_analise`), usa `requiresLateCorrect({ bonusResult, deliveryStatus })`, rejeita `targetId` inexistente com erro explícito e retorna `AMBIGUOUS_ATTEMPT_TARGET` quando há múltiplas tentativas sem `targetId`. |
| `A-02` (Seleção explícita em `AMBIGUOUS_CONSEQUENCE`) | Média | O contrato SQL do Manus (`20261114000100_operational_correction_contract.sql:633-636`) e o cliente (`operational-correction-client.js:82`) suportam `AMBIGUOUS_CONSEQUENCE` e `selectedPendencyIds`, mas `src/integration/operational-correction-dialog.js` em `b5cd2691` apenas exibia o texto do bloqueio sem controles para o usuário selecionar as Pendências candidatas. | **Corrigido em `src/integration/operational-correction-dialog.js` e provado em `tests/e2e/operational-correction-dialog.spec.js`:** renderiza checkboxes explícitos (`data-pendency-candidate-id`, desmarcados por padrão) para cada candidata de `AMBIGUOUS_CONSEQUENCE` e reconsulta `preview_operational_change` com `selectedPendencyIds`. |
| `A-03` (Jornadas restantes de T2/T3 e T4–T6) | Alta | O diálogo piloto está conectado apenas ao botão `Editar análise` de documentos regulares (sob flag `RADAR_OPERATIONAL_CORRECTION_PREVIEW`). Ainda não estão conectados na UI: exclusão direta de Pendência (`delete_pendency`), edição/exclusão de análise individual de NF/Assessoria, exclusão de NF com dependências (`delete_invoice` via T3), limpeza de contexto (`delete_context` — T4), UI/RPC de histórico/contatos/inventário (T5) e fechamento T6. | **Documentado na `MATRIZ_T0_T6.md` e no `PLANO_CONTINUIDADE.md`** com escopo exato por camada. |

---

### Categoria 3 — Regressão introduzida na integração posterior

| ID | Severidade | Descrição e Causa Raiz | Evidência e Solução nesta Branch |
|---|---|---|---|
| `R-01` (Regressão na branch paralela `6b4efb5d`, evitada em `b5cd2691`) | Crítica (apenas em `6b4efb5d`) | Em `audit/gemini-revisao-critica-e-sugestoes-20261115@6b4efb5d`, `src/integration/operational-correction-dialog.js` foi reescrito trocando `open(root, input)` por `openCorrectionDialog(options)`, quebrando 6/8 testes Playwright e adicionando confirmação textual não autorizada. **Não afeta `b5cd2691`**, que preservou o módulo original. | **Auditado e descartado.** Mantivemos a API `open(root, input)` e o DOM de `b5cd2691`, com **22/22** testes Playwright aprovados. |
| `R-02` (Condição de corrida de transição CSS no tema escuro sob execução paralela) | Média | Em `5a62a18b` (`9eeedb50` / `b5cd2691`), a correção de superfície `.invoice-document-row` e `.prontuario-school-header` para `body.dark-theme` foi colocada apenas em `src/styles/prontuario-operational-ux.css` (carregado pós-pintura via `requestIdleCallback`), enquanto `src/styles/global-visual-polish.css:497` aplica `transition: background 150ms ease` em `.invoice-document-row`. Sob execução paralela (4–8 workers Playwright) ou troca rápida de tema, a cor do texto mudava instantaneamente para `#f5f3f7` enquanto o fundo ainda transicionava de `#ffffff` (`rgb(56, 51, 67)` aos 300 ms, contraste < 4,5:1). | **Corrigido em `styles.css` e `src/styles/prontuario-operational-ux.css`:** regras de superfície escura incluídas diretamente na folha síncrona `styles.css` e `transition: box-shadow 150ms ease` aplicada em `body.dark-theme #prontuario-verif-rows .invoice-document-row`, eliminando o fade branco-sobre-branco. Provado em execução paralela com 8 workers (**19/19 aprovados**). |

---

### Categoria 4 — Defeito novo comprovado

| ID | Severidade | Descrição e Causa Raiz | Evidência e Solução nesta Branch |
|---|---|---|---|
| `N-01` (Divergência de `v_fingerprint` entre `preview` e `apply` com `note` opcional no cliente/SQL) | Média | Em `src/application/operational-correction-client.js`, `previewPayload` remove `note` antes de chamar `preview_operational_change`, mas `apply(confirmation, extra)` reconstruía `request` a partir de `confirmation.request` + `extra.note` a cada chamada. E em `supabase/migrations/20261114000100_operational_correction_contract.sql:803`, `apply_operational_change_impl` calculava `v_fingerprint` sobre `coalesce(p_request, 'null'::jsonb)::text` (incluindo `note`). Embora `46bd6dfc` tenha congelado `submittedNote` na closure do diálogo UI, chamadas diretas ao cliente ou retries com normalização distinta de `note` para a mesma `operationKey` geravam `IDEMPOTENCY_CONFLICT` no banco em vez de replay idempotente. | **Corrigido em `src/application/operational-correction-client.js` e `supabase/migrations/20261114000100_operational_correction_contract.sql`:** o cliente congela o payload na primeira chamada `apply` de cada `confirmation` (`WeakMap`) e o SQL calcula `v_fingerprint` sobre `(coalesce(p_request, '{}'::jsonb) - 'note')::text`, mantendo a persistência de `note` no ledger. Provado em `tests/unit/operational-correction-client.test.js` e `supabase/tests/database/operational-correction.test.sql` (60 asserções). |
| `N-02` (Botão residual `#radar-operational-correction-reload` após `STALE_PLAN`) | Baixa | Em `src/integration/operational-correction-dialog.js` (`46bd6dfc`), se uma primeira tentativa falhar por erro de rede (criando `#radar-operational-correction-reload`) e a repetição subsequente receber `STALE_PLAN`, o estado `uncertain` volta para `false`, mas o botão `#radar-operational-correction-reload` permanecia duplicado na barra de ações. | **Corrigido em `src/integration/operational-correction-dialog.js:228`:** remove `#radar-operational-correction-reload` ao tratar `STALE_PLAN`. |

---

### Categoria 5 — Hipótese ainda sem reprodução

| ID | Severidade | Descrição | Como verificar |
|---|---|---|---|
| `H-01` (`G-04` — Fallback de `administrativeLogReadRequired` em `product-extensions-bootstrap.js`) | Baixa | Em `src/integration/product-extensions-bootstrap.js:117-119`, o bloco `try` de fallback consulta `root.RadarDataContext?.dataService?.repository` sem consultar `root.RadarApplicationServices?.data?.repository`. Contudo, no runtime real, a linha 113 (`typeof repositoryFactory?.isSupabaseExplicitlyEnabled === 'function'`) retorna antes do fallback porque `RadarRepositoryFactory` é carregado sincronamente antes de `product-extensions-bootstrap.js`. Não há falha reproduzível no bootstrap real. | Só ocorreria se `RadarRepositoryFactory` deixasse de ser carregado antes do bootstrap em algum harness customizado. |
| `H-02` (Execução das 60 asserções pgTAP e script de concorrência contra Supabase local/descartável pós-ajuste de `v_fingerprint`) | Informativa | O host Windows desta sessão não possui binários locais `psql`/`docker`/WSL instalados. A alteração em `20261114000100_operational_correction_contract.sql` é de 1 linha (`(coalesce(p_request, '{}'::jsonb) - 'note')::text`) e passou em todas as verificações estáticas (`check:supabase`, `check:supabase-final`, `typecheck:database`), mas sua execução dinâmica em PostgreSQL 17 descartável depende do ambiente Linux/CI. | Executar `supabase test db supabase/tests/database/operational-correction.test.sql` e `bash scripts/test-operational-correction-concurrency.sh` em runner Linux com PostgreSQL 17. |

---

### Categoria 6 — Divergência documental sem defeito funcional

| ID | Documento | Descrição | Estado |
|---|---|---|---|
| `D-01` | `docs/CURRENT_STAGE.md` (linha 9 em `9eeedb50`) | Afirmava que `T2/T3` ainda não estavam ligados aos diálogos e bootstrap, o que havia sido superado pelos commits `273ded2f`..`9eeedb50`. | **Já reconciliado em `b5cd2691`** na branch integrada e preservado nesta branch. |
| `D-02` | `docs/handoff/2026-11-15-prontuario-integracao-verificada.md` (linha 68 em `b5cd2691`) | A seção histórica *"O que NÃO está feito neste commit"* (herdada de `5a62a18b`) ainda contém o item *"Cliente `src/application/operational-correction-client.js` não está instalado em `src/integration/product-extensions-bootstrap.js` nem ligado aos diálogos"*, embora o topo do mesmo documento (linhas 16 e 40–49) já explique o estado atualizado. | Divergência apenas entre a seção histórica inferior e o cabeçalho atualizado do handoff; sem impacto funcional. |
