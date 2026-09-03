# Documentação do RADAR PDDE

**Estado de referência:** 3 de setembro de 2026
**Classe documental:** Canônico — índice

## 0. Frente ativa

A frente ativa é a **execução do plano remanescente source-first**. Depois da reconciliação pós-hotfix, o código-fonte foi reaberto em 03/09 no SHA `18150cc9` para reduzir a fila ao que ainda existe e preservar soluções posteriores mais avançadas.

Ler primeiro:

- [`superpowers/plans/2026-09-03-plano-remanescente-source-first.md`](superpowers/plans/2026-09-03-plano-remanescente-source-first.md) — plano executável corrente;
- [`CURRENT_STAGE.md`](CURRENT_STAGE.md) — estado corrente e próxima fase;
- [`audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md`](audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md) — evidência source-first;
- [`handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md`](handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md) — checkpoint antecedente;
- [`decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md`](decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md);
- [`decisions/ADR-052-autoridade-unica-fluxos-criticos.md`](decisions/ADR-052-autoridade-unica-fluxos-criticos.md);
- [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md).

**Atenção:** o plano de 26/08 e a estabilização de 31/08 permanecem referências históricas/técnicas, mas não constituem uma segunda fila de implementação.

## 1. Onde começar

O plano executável canônico atual é [`superpowers/plans/2026-09-03-plano-remanescente-source-first.md`](superpowers/plans/2026-09-03-plano-remanescente-source-first.md), produzido depois de nova leitura direta dos serviços, integrações, loaders, StatePort/DataService, RPCs e testes.

A auditoria-fonte está em [`audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md`](audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md).

O handoff [`2026-09-03-reconciliacao-documental-e-plano-mestre.md`](handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md) permanece como checkpoint imediatamente anterior. Os planos de 26/08–31/08 continuam preservados como histórico técnico, mas seus “próximos passos” não controlam mais a execução.

## 2. Ordem de leitura recomendada

1. [`../AGENTS.md`](../AGENTS.md);
2. [`superpowers/plans/2026-09-03-plano-remanescente-source-first.md`](superpowers/plans/2026-09-03-plano-remanescente-source-first.md);
3. [`CURRENT_STAGE.md`](CURRENT_STAGE.md);
4. [`audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md`](audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md);
5. [`handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md`](handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md);
6. [`decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md`](decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md) e [`ADR-052`](decisions/ADR-052-autoridade-unica-fluxos-criticos.md);
7. [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md) e [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md);
8. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) e [`DECISION_LOG.md`](DECISION_LOG.md);
9. [`handoff/2026-09-02-dependency-governance.md`](handoff/2026-09-02-dependency-governance.md) quando aplicável;
10. somente depois, planos/handoffs históricos de 26/08–31/08.

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

- [`superpowers/plans/2026-09-03-plano-remanescente-source-first.md`](superpowers/plans/2026-09-03-plano-remanescente-source-first.md) — plano executável corrente;
- [`CURRENT_STAGE.md`](CURRENT_STAGE.md) — estado corrente;
- [`audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md`](audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md) — evidência do escopo remanescente;
- [`handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md`](handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md) — checkpoint canônico antecedente;
- [`decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md`](decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md) — contrato vigente de NF/Pendências individuais;
- [`decisions/ADR-051-adiamento-hardening-registered-invoices.md`](decisions/ADR-051-adiamento-hardening-registered-invoices.md) — hardening adiado até após R9;
- [`decisions/ADR-052-autoridade-unica-fluxos-criticos.md`](decisions/ADR-052-autoridade-unica-fluxos-criticos.md) — autoridade/composição de fluxos críticos;
- [`handoff/2026-09-02-dependency-governance.md`](handoff/2026-09-02-dependency-governance.md) — governança vigente de dependências;
- [`superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md`](superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md) — contrato técnico histórico, não fila executável;
- [`superpowers/plans/2026-08-31-estabilizacao-arquitetural-jornadas-criticas.md`](superpowers/plans/2026-08-31-estabilizacao-arquitetural-jornadas-criticas.md) — referência arquitetural histórica absorvida por R1/R2/R4/R5;
- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — contratos funcionais/arquiteturais estáveis;
- [`DECISION_LOG.md`](DECISION_LOG.md) — decisões históricas e duradouras;
- [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md) — validade documental;
- [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md) — visão gerada do contrato funcional vigente;
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

O handoff pós-PR #215, o handoff de 26/08 e a reconciliação pós-hotfix são checkpoints históricos/canônicos de suas etapas. A porta de entrada executável corrente é o plano source-first de 03/09; documentos anteriores permanecem disponíveis para rastreabilidade, mas seus “próximos passos” não controlam mais a execução.

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

A reauditoria source-first foi concluída em 03/09. O próximo ponto real é **R1: retirar a autoridade funcional de consistência ainda alojada em wrappers de performance**. Depois seguem R2A–R2C, R3, R4, R5, o gate R6, R7/R8 e o fechamento R9.
