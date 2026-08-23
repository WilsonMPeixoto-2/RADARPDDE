# Documentação do RADAR PDDE

**Estado de referência:** 23 de agosto de 2026  
**Classe documental:** Canônico — índice

## 1. Onde começar

O estado corrente fica em [`CURRENT_STAGE.md`](CURRENT_STAGE.md).

O documento principal para retomada futura é:

- [`handoff/2026-08-23-post-pr-193.md`](handoff/2026-08-23-post-pr-193.md)

Ele consolida o baseline efetivamente verificado após o merge do PR #193, a sequência #190–#193, decisões de produto preservadas, migrations, arquitetura incremental, ferramentas incorporadas, política das vulnerabilidades conhecidas e a frente limitada do PR #194.

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
2. [`CURRENT_STAGE.md`](CURRENT_STAGE.md);
3. [`handoff/2026-08-23-post-pr-193.md`](handoff/2026-08-23-post-pr-193.md);
4. [`superpowers/specs/2026-08-22-estabilizacao-avaliacoes-reais-design.md`](superpowers/specs/2026-08-22-estabilizacao-avaliacoes-reais-design.md);
5. [`superpowers/specs/2026-08-23-continuity-instrumentation-post-pr193-design.md`](superpowers/specs/2026-08-23-continuity-instrumentation-post-pr193-design.md);
6. [`DECISION_LOG.md`](DECISION_LOG.md);
7. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md);
8. [`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md);
9. [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md);
10. arquitetura ou runbook diretamente relacionado à tarefa.

## 3. Decisões atuais que não podem ser perdidas

### Escritas operacionais

Após #190–#193, o caminho normal usa persistência/retorno autoritativo e reconciliação incremental. `renderProntuario()` integral é fallback para erro, retorno incompleto ou inconsistência não reconciliável, não rotina de sucesso.

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

Quando o PR #194 estiver na `main`, a consulta local de métricas será somente leitura:

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
- [`handoff/2026-08-23-post-pr-193.md`](handoff/2026-08-23-post-pr-193.md) — checkpoint atual de continuidade;
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

O handoff de 23/08 substitui o snapshot de 18/08 **como porta de entrada**, sem apagar o valor histórico do documento anterior.

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

Na ausência de nova demanda real, defeito observado ou risco concreto, o RADAR não permanece “inacabado” apenas porque seria possível inventar mais uma rodada de mudanças.
