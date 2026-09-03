# Documentação do RADAR PDDE

**Estado de referência:** 3 de setembro de 2026
**Classe documental:** Canônico — índice

## 0. Frente ativa

A frente ativa é a **retomada reconciliada do plano mestre após o PR #249**. A reconciliação documental e funcional foi concluída em 03/09 diretamente contra `main`, Vercel Production e Supabase Production.

Ler primeiro:

- [`handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md`](handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md) — porta de entrada atual e matriz do que falta;
- [`CURRENT_STAGE.md`](CURRENT_STAGE.md) — estado corrente;
- [`handoff/2026-09-02-dependency-governance.md`](handoff/2026-09-02-dependency-governance.md) — manutenção de dependências vigente;
- [`decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md`](decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md);
- [`decisions/ADR-052-autoridade-unica-fluxos-criticos.md`](decisions/ADR-052-autoridade-unica-fluxos-criticos.md);
- [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md);
- [`architecture/pendency-excel-export.md`](architecture/pendency-excel-export.md);
- [`handoff/2026-08-31-pr237-fechamento-visual-e-ci.md`](handoff/2026-08-31-pr237-fechamento-visual-e-ci.md) — histórico imediatamente anterior.

**Atenção:** planos e handoffs anteriores não podem restaurar decisões superadas. O plano mestre de 26/08 continua como contrato técnico, mas sua ordem de execução foi reconciliada em 03/09 para retirar tarefas já atendidas e impedir regressões.

## 1. Onde começar

O estado corrente fica em [`CURRENT_STAGE.md`](CURRENT_STAGE.md).

O **checkpoint canônico atual** é:

- [`handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md`](handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md)

Esse handoff compara o plano mestre com código, Supabase e Vercel do baseline funcional auditado, registra o que já foi atendido ou superado e define a sequência restante sem restaurar decisões antigas.

Os checkpoints de 28/08 e 26/08 permanecem históricos e úteis para contexto:

- [`handoff/2026-08-28-pr211-hotfix-notas-fiscais.md`](handoff/2026-08-28-pr211-hotfix-notas-fiscais.md) — origem do hotfix de individualização;
- [`handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md`](handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md) — fotografia do plano pós-PR #200.

Nenhum deles controla mais a ordem corrente de execução.

O plano textual continua como **contrato técnico detalhado**, mas sua sequência executável é a reconciliada em 03/09:

- [`superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md`](superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md);
- [`reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.docx`](reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.docx);
- [`reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.sha256`](reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.sha256).

O handoff do Boleto Internet de 27/08 e o plano de 24/08 permanecem históricos: documentam decisões e diagnóstico da época, mas não orientam a execução corrente.

O handoff de 23/08 permanece histórico e necessário para compreender a estabilização #190–#194:

- [`handoff/2026-08-23-post-pr-193.md`](handoff/2026-08-23-post-pr-193.md)

O snapshot de 18/08 permanece histórico:

- [`handoff/2026-08-18-encerramento-operacional.md`](handoff/2026-08-18-encerramento-operacional.md)

Regra de precedência:

```text
código do SHA analisado
→ Supabase/Vercel efetivos
→ decisões vigentes
→ testes atuais que representam o contrato
→ documentação canônica
→ históricos, auditorias e testes superados
```

Valores voláteis sempre devem ser consultados no remoto quando a tarefa depender deles.

## 2. Ordem de leitura recomendada

1. [`../AGENTS.md`](../AGENTS.md);
2. [`handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md`](handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md);
3. [`CURRENT_STAGE.md`](CURRENT_STAGE.md);
4. [`decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md`](decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md);
5. [`decisions/ADR-052-autoridade-unica-fluxos-criticos.md`](decisions/ADR-052-autoridade-unica-fluxos-criticos.md);
6. [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md);
7. [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md);
8. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) e [`DECISION_LOG.md`](DECISION_LOG.md);
9. [`handoff/2026-09-02-dependency-governance.md`](handoff/2026-09-02-dependency-governance.md);
10. [`superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md`](superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md) para detalhes das etapas ainda vigentes;
11. somente depois, handoffs e evidências históricas anteriores.

A leitura do plano mestre deve começar pela seção de reconciliação de 03/09 adicionada ao próprio arquivo.

## 3. Decisões atuais que não podem ser perdidas

### Escritas operacionais

Após #190–#193, o caminho normal usa persistência/retorno autoritativo e reconciliação incremental. `renderProntuario()` integral é fallback para erro, retorno incompleto ou inconsistência não reconciliável, não rotina de sucesso.

O diagnóstico de 24/08 foi parcialmente absorvido pelos PRs #202/#206 e pelos hotfixes posteriores: o submit imediato possui guard, `invoice-effects.js` planeja efeitos e o no-op semântico já evita escrita sem mudança real. Permanecem como lacunas a idempotência durável de intenção no servidor (PR5) e a retirada das decisões essenciais de consistência que ainda dependem de wrappers/reconciliação parcial (PR3/PR8).

### Avaliação mensal

- bonificação, análise técnica e pendência são dimensões independentes;
- operação semanticamente idêntica é idempotente;
- N/A → Sim/Não reinicializa derivações incompatíveis;
- `bonus_result` diferencia campo ausente de limpeza explícita.

### Assessoria por NF

A consulta/análise é individual por Nota Fiscal. `Incorreto` + pendência é atômico, a pendência referencia `registered_invoice_id`, e reanálise afeta apenas a NF vinculada antes de recalcular o agregado.

### Pendências

Pendências são passivo transversal. A página abre em **Todas as competências** e o filtro local é opcional.

Documento: [`decisions/ADR-044-pendencias-passivo-transversal.md`](decisions/ADR-044-pendencias-passivo-transversal.md).

### Production

Production usa Supabase e opera **fail-closed**; falha remota não ativa LocalStorage/seed silenciosamente.

Documento: [`decisions/ADR-045-production-fail-closed.md`](decisions/ADR-045-production-fail-closed.md).

### Dependências conhecidas

As duas vulnerabilidades moderadas atualmente conhecidas na cadeia ExcelJS/UUID são risco conscientemente aceito neste momento. Não executar atualização forçada nem `npm audit fix --force`; acompanhar versões compatíveis e reavaliar quando o risco mudar.

## 4. Ferramentas de qualidade

Além dos gates históricos, o ciclo #193 incorporou:

- `fast-check` → `npm run test:properties`;
- MSW → `npm run test:network-failures`;
- `dependency-cruiser` → `npm run check:architecture` e `test:readiness`;
- Performance API/diagnóstico operacional local → integração runtime no PR #194.

A integração do PR #194 permanece na `main`; o baseline pós-PR #200 é `0965ba8`. A consulta local de métricas é somente leitura:

```javascript
window.RadarOperationalWriteMetrics.snapshot()
window.RadarOperationalWriteMetrics.summary()
```

Não há telemetria externa, persistência das métricas ou coleta de dados de negócio.

## 5. Contratos executáveis

### Matriz funcional

- [`reference/functional-contract-matrix.json`](reference/functional-contract-matrix.json);
- `reference/functional-contract-matrix/*.json`;
- [`../scripts/check-functional-contract-matrix.mjs`](../scripts/check-functional-contract-matrix.mjs);
- [`../tests/unit/functional-contract-matrix.test.js`](../tests/unit/functional-contract-matrix.test.js);
- [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md).

### Governança de testes

[`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md) determina que:

- teste não cria regra de negócio sozinho;
- falha deve ser classificada antes de alterar produto;
- contrato superado é atualizado, não imposto ao sistema;
- validação é proporcional ao risco;
- evidência válida pode ser reaproveitada quando a superfície correspondente não mudou.

## 6. Documentos canônicos e referências

- [`CURRENT_STAGE.md`](CURRENT_STAGE.md) — estado corrente;
- [`handoff/2026-08-30-pr215-fechamento-tecnico.md`](handoff/2026-08-30-pr215-fechamento-tecnico.md) — roteamento canônico corrente;
- [`handoff/2026-08-30-pr211-retomada-work.md`](handoff/2026-08-30-pr211-retomada-work.md) — histórico de retomada do PR #211;
- [`handoff/2026-08-28-pr211-hotfix-notas-fiscais.md`](handoff/2026-08-28-pr211-hotfix-notas-fiscais.md) — checkpoint operacional atual;
- [`superpowers/plans/2026-08-28-hotfix-individualizacao-notas-fiscais.md`](superpowers/plans/2026-08-28-hotfix-individualizacao-notas-fiscais.md) — plano executável do hotfix;
- [`decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md`](decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md) — contrato vigente;
- [`evidence/2026-08-29-pr211-classificacao-dados-legados.md`](evidence/2026-08-29-pr211-classificacao-dados-legados.md) — classificação autoritativa de legados e fixtures;
- [`handoff/2026-08-27-hotfix-boleto-internet.md`](handoff/2026-08-27-hotfix-boleto-internet.md) — histórico do PR #203, superado no modelo ativo pelos PRs #208/#209;
- [`handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md`](handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md) — checkpoint para retomada somente após o PR #211;
- [`superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md`](superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md) — sequência canônica de implementação;
- [`reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.docx`](reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.docx) — relatório integral versionado;
- [`handoff/2026-08-23-post-pr-193.md`](handoff/2026-08-23-post-pr-193.md) — checkpoint histórico anterior;
- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — contratos funcionais/arquiteturais estáveis;
- [`DECISION_LOG.md`](DECISION_LOG.md) — decisões históricas e duradouras;
- [`decisions/`](decisions/) — ADRs detalhadas;
- [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md) — validade documental;
- [`reference/PRODUCT_SURFACE_CATALOG.md`](reference/PRODUCT_SURFACE_CATALOG.md) — superfícies e UX;
- [`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md) — governança de validação;
- [`../AGENTS.md`](../AGENTS.md) — regras de trabalho.

## 7. Arquitetura e Supabase

### Produto/frontend

- [`architecture/competencias.md`](architecture/competencias.md)
- [`architecture/avaliacao-mensal.md`](architecture/avaliacao-mensal.md)
- [`architecture/modelo-operacional.md`](architecture/modelo-operacional.md)
- [`architecture/product-extensions-load-order.md`](architecture/product-extensions-load-order.md)
- [`architecture/testing.md`](architecture/testing.md)

### Supabase

- [`reference/SUPABASE_DATA_DICTIONARY.md`](reference/SUPABASE_DATA_DICTIONARY.md)
- [`reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](reference/SUPABASE_FUNCTIONAL_COVERAGE.md)
- [`reference/SUPABASE_PERMISSIONS_MATRIX.md`](reference/SUPABASE_PERMISSIONS_MATRIX.md)
- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md)
- [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md)

## 8. Histórico

Arquivos datados em `docs/audits/`, `docs/evidence/`, `docs/superpowers/`, `docs/handoff/` e `docs/reports/` preservam o momento em que foram produzidos. Eles não devem ser reescritos para coincidir com o presente e não prevalecem sobre o código/ambiente atual.

O handoff pós-PR #215 e o handoff de 26/08 são checkpoints históricos. A porta de entrada corrente é a reconciliação de 03/09; documentos anteriores permanecem disponíveis para rastreabilidade, mas seus “próximos passos” não controlam mais a execução.

## 9. Continuidade

Fluxo recomendado:

```text
verificar remoto
→ classificar demanda
→ branch isolada
→ mudança mínima
→ validação proporcional
→ classificar falhas
→ confirmar Production quando aplicável
→ atualizar documentação afetada
```

A reconciliação pós-hotfix foi concluída em 03/09. O próximo ponto real de implementação é o readiness sistêmico remanescente de PR3.1–PR3.3, preservando ADR-052 e a composição crítica já aprovada; depois seguem PR5, PR6, revisão focada de PR7A, PR8A/PR8B e PR9A/PR9C conforme a matriz canônica. PR1, PR2, PR6B, PR7B e PR9B não devem ser reimplementados; PR4 antigo foi superado.
