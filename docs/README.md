# Documentação do RADAR PDDE

**Estado de referência:** 18 de agosto de 2026  
**Classe documental:** Canônico — índice

## 1. Onde começar

O estado corrente fica em [`CURRENT_STAGE.md`](CURRENT_STAGE.md).

O documento mais importante para uma retomada futura é o snapshot de encerramento:

- [`handoff/2026-08-18-encerramento-operacional.md`](handoff/2026-08-18-encerramento-operacional.md)

Ele consolida baseline técnico, regras de negócio, versões homologadas, Production, Supabase, segurança, testes e ressalvas conhecidas.

Regra de precedência:

```text
código do SHA analisado
→ Supabase/Vercel efetivos
→ decisões vigentes
→ testes atuais que representam o contrato
→ documentação canônica
→ históricos e testes superados
```

Valores voláteis devem ser consultados no remoto quando necessários. O snapshot preserva o estado exato do encerramento de 18/08/2026, não substitui verificação futura.

## 2. Ordem de leitura recomendada

1. [`../AGENTS.md`](../AGENTS.md);
2. [`CURRENT_STAGE.md`](CURRENT_STAGE.md);
3. [`handoff/2026-08-18-encerramento-operacional.md`](handoff/2026-08-18-encerramento-operacional.md);
4. [`decisions/ADR-044-pendencias-transversais.md`](decisions/ADR-044-pendencias-transversais.md);
5. [`decisions/ADR-045-production-fail-closed.md`](decisions/ADR-045-production-fail-closed.md);
6. [`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md);
7. [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md);
8. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md);
9. [`DECISION_LOG.md`](DECISION_LOG.md);
10. [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md);
11. [`architecture/README.md`](architecture/README.md).

## 3. Decisões recentes que não podem ser perdidas

### Pendências Operacionais

A competência global continua visível e persistente, mas a página de Pendências é transversal entre competências e abre em **Todas as competências**. O filtro mensal local é opcional.

Documento: [`decisions/ADR-044-pendencias-transversais.md`](decisions/ADR-044-pendencias-transversais.md).

### Production

Production usa Supabase e opera em modo **fail-closed**. Falha de configuração remota não pode ativar fallback silencioso para LocalStorage/seed. O bundle público de Production não deve carregar o seed legado de escolas/controladores.

Documento: [`decisions/ADR-045-production-fail-closed.md`](decisions/ADR-045-production-fail-closed.md).

### Desativação de Controlador

A carteira deve ser zerada antes da desativação. A desativação não redistribui escolas e preserva histórico. Ver ADR-043 no registro de decisões.

## 4. Contratos executáveis

### Matriz funcional

- [`reference/functional-contract-matrix.json`](reference/functional-contract-matrix.json);
- `reference/functional-contract-matrix/*.json`;
- [`../scripts/check-functional-contract-matrix.mjs`](../scripts/check-functional-contract-matrix.mjs);
- [`../tests/unit/functional-contract-matrix.test.js`](../tests/unit/functional-contract-matrix.test.js);
- [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md).

```bash
npm run generate:functional-matrix
npm run check:functional-matrix
```

A classificação `partial` não significa defeito automático. Ela indica apenas que pode existir prova adicional útil em contexto futuro.

### Testes

[`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md) determina como interpretar falhas:

- teste não cria regra de negócio sozinho;
- falha deve ser classificada antes de alterar produto;
- contrato superado é atualizado, não imposto ao sistema;
- validação é proporcional ao risco;
- evidência válida pode ser reaproveitada quando a superfície correspondente não mudou.

## 5. Documentos canônicos e referências principais

- [`CURRENT_STAGE.md`](CURRENT_STAGE.md) — estado corrente;
- [`handoff/2026-08-18-encerramento-operacional.md`](handoff/2026-08-18-encerramento-operacional.md) — snapshot de fechamento e retomada;
- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — contrato funcional e arquitetural estável;
- [`DECISION_LOG.md`](DECISION_LOG.md) — registro agregado de decisões históricas/duradouras;
- [`decisions/`](decisions/) — ADRs detalhadas;
- [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md) — validade documental;
- [`reference/PRODUCT_SURFACE_CATALOG.md`](reference/PRODUCT_SURFACE_CATALOG.md) — superfícies e UX;
- [`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md) — governança de validação;
- [`../AGENTS.md`](../AGENTS.md) — regras de trabalho.

## 6. Arquitetura

### Produto

- [`architecture/competencias.md`](architecture/competencias.md)
- [`architecture/avaliacao-mensal.md`](architecture/avaliacao-mensal.md)
- [`architecture/modelo-operacional.md`](architecture/modelo-operacional.md)
- [`architecture/timeline-unidade.md`](architecture/timeline-unidade.md)
- [`architecture/navigation-contextual.md`](architecture/navigation-contextual.md)
- [`architecture/testing.md`](architecture/testing.md)

### Frontend, Supabase e Excel

- [`architecture/frontend-load-order.md`](architecture/frontend-load-order.md)
- [`architecture/product-extensions-load-order.md`](architecture/product-extensions-load-order.md)
- [`architecture/supabase-readiness.md`](architecture/supabase-readiness.md)
- [`architecture/excel-export.md`](architecture/excel-export.md)
- [`architecture/excel-xlsx-runtime.md`](architecture/excel-xlsx-runtime.md)
- [`architecture/excel-sme-mensal.md`](architecture/excel-sme-mensal.md)
- [`architecture/excel-integral-certification.md`](architecture/excel-integral-certification.md)

Documentos de roadmap pré-Supabase são históricos e não representam o estágio atual.

## 7. Supabase e permissões

- [`reference/SUPABASE_DATA_DICTIONARY.md`](reference/SUPABASE_DATA_DICTIONARY.md)
- [`reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](reference/SUPABASE_FUNCTIONAL_COVERAGE.md)
- [`reference/SUPABASE_INTEGRATION_AUDIT.md`](reference/SUPABASE_INTEGRATION_AUDIT.md)
- [`reference/SUPABASE_PERMISSIONS_MATRIX.md`](reference/SUPABASE_PERMISSIONS_MATRIX.md)
- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md)
- [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md)

Runbooks de bootstrap inicial de Auth/dados são procedimentos históricos restritos, não fluxo cotidiano de Production.

## 8. Histórico e evidências

Arquivos datados em `docs/audits/`, `docs/evidence/`, `docs/superpowers/`, `docs/handoff/` e `docs/reports/` registram seu momento histórico. Eles não devem ser reescritos para coincidir com o presente e não prevalecem sobre código/ambiente atuais.

O snapshot de 18/08/2026 é a âncora documental do encerramento deste ciclo.

## 9. Continuidade

Mudança futura deve atualizar somente os contratos, ADRs, testes e documentos materialmente afetados.

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

Na ausência de nova demanda real, defeito observado ou risco concreto, o RADAR não permanece “inacabado” apenas porque seria tecnicamente possível inventar mais uma rodada de testes.
