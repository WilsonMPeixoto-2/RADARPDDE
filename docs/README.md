# Documentação do RADAR PDDE

**Estado de referência:** 3 de setembro de 2026
**Classe documental:** Canônico — índice

## 0. Frente ativa

A frente ativa é a **retomada reconciliada do plano mestre após os hotfixes**. A reconciliação foi feita contra código, migrations, testes e Production atuais; o plano de 26/08 não deve mais ser executado em sequência literal.

Ler primeiro:

- [`handoff/2026-09-03-reconciliacao-plano-mestre-pos-hotfixes.md`](handoff/2026-09-03-reconciliacao-plano-mestre-pos-hotfixes.md) — classificação atual de cada bloco do plano e sequência remanescente;
- [`audits/2026-09-03-documentacao-e-plano-mestre.md`](audits/2026-09-03-documentacao-e-plano-mestre.md) — auditoria objetiva da documentação e evidência da reconciliação;
- [`CURRENT_STAGE.md`](CURRENT_STAGE.md) — baseline mutável corrente;
- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — contratos funcionais/arquiteturais estáveis;
- [`DECISION_LOG.md`](DECISION_LOG.md), com ADR-053;
- [`decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md`](decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md);
- [`decisions/ADR-052-autoridade-unica-fluxos-criticos.md`](decisions/ADR-052-autoridade-unica-fluxos-criticos.md);
- [`handoff/2026-09-02-dependency-governance.md`](handoff/2026-09-02-dependency-governance.md);
- [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md).

Os handoffs PR #211/#215/#237 e os planos anteriores permanecem preservados como história/evidência. Seus “próximos passos” não prevalecem sobre a reconciliação de 03/09.

## 1. Onde começar

O estado corrente fica em [`CURRENT_STAGE.md`](CURRENT_STAGE.md).

A retomada do plano mestre é controlada por:

- [`handoff/2026-09-03-reconciliacao-plano-mestre-pos-hotfixes.md`](handoff/2026-09-03-reconciliacao-plano-mestre-pos-hotfixes.md);
- [`superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md`](superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md), agora com overlay explícito de reconciliação;
- [`superpowers/plans/2026-08-31-estabilizacao-arquitetural-jornadas-criticas.md`](superpowers/plans/2026-08-31-estabilizacao-arquitetural-jornadas-criticas.md), também reconciliado.

O plano de 26/08 continua útil para detalhes de intenção, gates e riscos. O que mudou é a sua **sequência executável**: hotfixes posteriores atenderam ou especializaram várias tarefas.

Planos/handoffs de 24/08, PR #200, PR #211, PR #215 e PR #237 continuam disponíveis para rastreabilidade, não para restaurar decisões antigas.

## 2. Ordem de leitura recomendada

1. [`../AGENTS.md`](../AGENTS.md);
2. [`handoff/2026-09-03-reconciliacao-plano-mestre-pos-hotfixes.md`](handoff/2026-09-03-reconciliacao-plano-mestre-pos-hotfixes.md);
3. [`CURRENT_STAGE.md`](CURRENT_STAGE.md);
4. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md);
5. [`DECISION_LOG.md`](DECISION_LOG.md) e ADRs 050/051/052/053;
6. [`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md);
7. [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md);
8. [`handoff/2026-09-02-dependency-governance.md`](handoff/2026-09-02-dependency-governance.md);
9. planos reconciliados de 26/08 e 31/08;
10. somente depois, handoffs e evidências históricas.

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

O handoff pós-PR #215 é a porta de entrada corrente. O handoff de 26/08 volta a orientar a execução somente depois da homologação autenticada final e da reconciliação pós-hotfix, sem apagar o valor histórico dos documentos anteriores.

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

O estágio atual fecha o conjunto PR #211/#214/#215, protege a composição crítica pela ADR-052 e aguarda somente a homologação autenticada final da interface. Depois disso, é obrigatório reconciliar o conjunto do hotfix com o plano mestre; somente então a execução retoma em PR3.1. PR1 e PR2 já foram concluídos e não devem ser reimplementados.
