# Documentação do RADAR PDDE

**Estado de referência:** 24 de agosto de 2026
**Classe documental:** Canônico — índice

## 1. Onde começar

O estado corrente fica em [`CURRENT_STAGE.md`](CURRENT_STAGE.md).

O documento principal para retomada futura é:

- [`handoff/2026-08-24-pre-implementacao-plano-mestre.md`](handoff/2026-08-24-pre-implementacao-plano-mestre.md)

Ele consolida o baseline `4542bbf` após o merge do PR #194, os relatos de usuários, os defeitos confirmados, as regras que não devem mudar, o snapshot read-only do Supabase, a gestão de Pendências e o estágio exato antes de qualquer correção.

O plano textual executável e o relatório integral são:

- [`superpowers/plans/2026-08-24-plano-mestre-correcoes.md`](superpowers/plans/2026-08-24-plano-mestre-correcoes.md);
- [`reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx`](reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx).

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
2. [`CURRENT_STAGE.md`](CURRENT_STAGE.md);
3. [`handoff/2026-08-24-pre-implementacao-plano-mestre.md`](handoff/2026-08-24-pre-implementacao-plano-mestre.md);
4. [`superpowers/plans/2026-08-24-plano-mestre-correcoes.md`](superpowers/plans/2026-08-24-plano-mestre-correcoes.md);
5. [`reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx`](reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx);
6. [`handoff/2026-08-23-post-pr-193.md`](handoff/2026-08-23-post-pr-193.md);
7. [`DECISION_LOG.md`](DECISION_LOG.md);
8. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md);
9. [`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md);
10. [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md);
11. arquitetura ou runbook diretamente relacionado à tarefa.

## 3. Decisões atuais que não podem ser perdidas

### Escritas operacionais

Após #190–#193, o caminho normal usa persistência/retorno autoritativo e reconciliação incremental. `renderProntuario()` integral é fallback para erro, retorno incompleto ou inconsistência não reconciliável, não rotina de sucesso.

O diagnóstico de 24/08 encontrou lacunas específicas ainda abertas em `invoice:save`: submit repetido, ausência de no-op verdadeiramente semântico, dependência da extensão opcional para dispensar refresh de históricos e ausência de chave idempotente de servidor. O contrato continua vigente; a cobertura desse fluxo não deve ser presumida como completa.

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

A integração do PR #194 está na `main` do baseline `4542bbf`. A consulta local de métricas é somente leitura:

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
- [`handoff/2026-08-24-pre-implementacao-plano-mestre.md`](handoff/2026-08-24-pre-implementacao-plano-mestre.md) — checkpoint atual de continuidade;
- [`superpowers/plans/2026-08-24-plano-mestre-correcoes.md`](superpowers/plans/2026-08-24-plano-mestre-correcoes.md) — sequência de implementação;
- [`reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx`](reports/2026-08-24-plano-mestre-correcoes-radar-pdde.docx) — relatório integral versionado;
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

O handoff de 24/08 substitui o de 23/08 **como porta de entrada**, sem apagar o valor histórico dos documentos anteriores.

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

O estágio atual possui demanda real e defeitos confirmados. A retomada deve começar pela Etapa 0 e pelo PR 1 do plano mestre, sem misturar migration, reparo, idempotência ou redesign no primeiro PR.
