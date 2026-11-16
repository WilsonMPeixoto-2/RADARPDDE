# RADAR PDDE — Reconciliação final da branch Antigravity Argon
**Corte verificado:** 15/11/2026  
**Finalidade:** auditoria de continuidade; não autoriza merge, deployment ou alterações no banco institucional.

## 1. Fontes remotas efetivamente conferidas

| Referência | HEAD na consulta | Significado |
| --- | --- | --- |
| `audit/antigravity-argon-prontuario-20261115` | `52ff08718d12e7752d82c3dee1c19ba3ab73ff15` | Fonte isolada da auditoria, preservada sem escrita |
| `fix/prontuario-integrado-validado-20261115` | `a869b2dfd89097d866e908e4081b042bea8321e0` | Integração consolidada examinada e testada |
| `main` | `4011a2b8e2ce39e048d5ecb68026c9f041b74cb0` | Referência de Produção; não foi modificada neste trabalho |

O GitHub confirmou **nenhum commit novo na branch Antigravity após `52ff0871`**. Seu histórico mais recente é `5c2f80b1` (correções estruturais), `7802c0fb` (auditoria), `466810ff` (ação direta Limpar análise) e `52ff0871` (projeções e atalhos de NF). Não há novo pacote a ser incorporado neste corte.

O comparativo GitHub mostra branches **divergentes por decisão de governança**: as contribuições isoladas permanecem como prova, enquanto a integração principal contém versões selecionadas, revisadas e corrigidas. `git merge` ou `cherry-pick` integral seria incorreto.

## 2. Rastreabilidade de incorporações já concluídas

| Fonte Antigravity | Commit na integração | O que foi efetivamente integrado |
| --- | --- | --- |
| `5c2f80b1` e pacote `7802c0fb` | `e9bdfbbb` | Seleção explícita de Pendências candidatas, payload idempotente congelado, helper T5, contraste; **sem** relaxar fingerprint SQL |
| `466810ff` | `80280fcc` | Botão direto **Limpar análise**, prévia antes da confirmação e textos acessíveis; preservação da API `open` |
| `52ff0871` | `a869b2df` | Projeções de NF nas Pendências, Busca Global, Passivo e exportação, mais atalhos; correção de integridade para não sobrescrever `pendency.item` fora de transação |

**Contraprovas preservadas:** (a) a sugestão de ignorar `note` no fingerprint SQL foi recusada, pois permitiria replay para observação divergente; o contrato integrado conserva fingerprint integral e 61 testes pgTAP. (b) A mutação de `pendency.item` após `invoice:save` e durante render foi retirada; a visualização deriva as informações atuais por `registeredInvoiceId`, mas mantém o registro canônico e `documentSnapshot`. (c) Substituições por número textual coincidente foram eliminadas, para não alterar trechos incidentais da descrição.

**Alegações sobre Produção:** o Antigravity informou que encontrou 43 divergências históricas entre notas e Pendências e 62 migrations instaladas em consultas somente de leitura. Estes números são **relato daquele agente**, não auditoria independente realizada nesta revisão. Não confundir projeção atualizada nas telas com atualização de `public.pendencies` no banco.

## 3. Verificação independente do commit remoto

Realizado em **sandbox Vercel recém-criado**, importado diretamente do SHA `a869b2dfd89097d866e908e4081b042bea8321e0`. A `git status --porcelain` estava vazia antes dos testes; `node --check` dos módulos alterados e `npm ci --ignore-scripts --no-audit --no-fund` passaram.

| Comando / prova | Resultado real |
| --- | --- |
| `npm run test:readiness` | Exit 0, **1.414/1.414 unitários e 8/8 integrações**, verificações de Supabase/readiness/arquitetura aprovadas |
| `npx playwright test tests/e2e/invoice-auditable-retification.spec.js tests/e2e/invoice-retification-projections.spec.js tests/e2e/invoice-retification-discoverability.spec.js tests/e2e/task-9-pendencias.spec.js tests/e2e/operational-correction-dialog.spec.js tests/e2e/evaluation-retification-ui.spec.js tests/e2e/sme-access-governance.spec.js --project=desktop-chromium --workers=2 --reporter=line` | Exit 0: **40 aprovados, 1 ignorado, 0 falhas** |
| Inspeção individual dos 12 arquivos introduzidos por `a869b2df` | SHA Git de todos os arquivos conferido com os objetos esperados na branch remota |

**Escopo da prova:** testes Node e Playwright com fixtures e chamadas RPC controladas. O resultado **não comprova** persistência autenticada de `preview_operational_change`/`apply_operational_change` contra Supabase descartável com sessão real, transação, F5, duas sessões ou autorização de Produção. A 63ª migration T2/T3 é candidata local, **não aplicada no Supabase institucional**.

## 4. Decisão de revisão

**Nenhuma alteração nova de código é necessária pela comparação de HEADs:** a origem Antigravity não mudou desde a última consolidação. Não criar patches artificiais nem refazer os testes do Manus/Argon que já possuem evidência.

Apenas registrar este resultado de comparação e os testes efetivamente reexecutados nos documentos de continuidade da branch integrada. Manter todas as branches de auditoria intactas.

**Retomada única:** `fix/prontuario-integrado-validado-20261115` e [checkpoint canônico](../handoff/2026-11-15-prontuario-integracao-verificada.md), subordinados ao [plano Astra T0–T6](../superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md).

**Pendências realmente funcionais:** concluir T2 autenticado (análise, Pendências, assistências/NF, recibos e refresh), T3 exclusão causal de NF integrada à autoridade existente, T4 bonificação/contexto, T5 ações de histórico/contato/patrimônio persistidas e T6 homologação visual/funcional global. **Nenhum merge em main, deploy ou escrita no Supabase institucional foi executado.**
