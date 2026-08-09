# Documentação do RADAR PDDE

**Estado de referência:** 9 de agosto de 2026  
**Classe documental:** Canônico — índice

## 1. Estado e precedência

O estado corrente fica em [`CURRENT_STAGE.md`](CURRENT_STAGE.md). A estratégia de validação fica em [`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md).

Regra de precedência:

```text
código do SHA analisado
→ Supabase/Vercel efetivos
→ contrato funcional e decisões vigentes
→ testes atuais que representam o contrato
→ documentação canônica
→ históricos e testes superados
```

Valores voláteis devem ser consultados no remoto quando necessários. Checkpoints datados preservam valores exatos do momento em que foram produzidos.

## 2. Ordem de leitura

1. [`../AGENTS.md`](../AGENTS.md);
2. [`CURRENT_STAGE.md`](CURRENT_STAGE.md);
3. [`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md);
4. [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md);
5. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md);
6. [`DECISION_LOG.md`](DECISION_LOG.md);
7. [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md);
8. [`architecture/README.md`](architecture/README.md).

## 3. Contratos executáveis

### Matriz funcional

- [`reference/functional-contract-matrix.json`](reference/functional-contract-matrix.json);
- `reference/functional-contract-matrix/*.json`;
- [`../scripts/check-functional-contract-matrix.mjs`](../scripts/check-functional-contract-matrix.mjs);
- [`../tests/unit/functional-contract-matrix.test.js`](../tests/unit/functional-contract-matrix.test.js);
- [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md) — visão gerada.

```bash
npm run generate:functional-matrix
npm run check:functional-matrix
```

A matriz contém 41 operações. A classificação `partial` indica apenas que pode existir prova adicional útil em contexto futuro; **não significa defeito nem bloqueio automático do produto**.

### Testes

[`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md) determina como interpretar e executar testes:

- teste não cria regra de negócio sozinho;
- falha é classificada antes de corrigir código;
- contrato superado é atualizado/removido, não imposto ao produto;
- validação é proporcional ao risco e à superfície alterada;
- evidência válida pode ser reaproveitada quando o código correspondente não mudou.

## 4. Documentos canônicos e referências principais

- [`CURRENT_STAGE.md`](CURRENT_STAGE.md) — estado corrente e gatilhos de nova validação;
- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — contrato funcional e arquitetural;
- [`DECISION_LOG.md`](DECISION_LOG.md) — decisões duradouras;
- [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md) — validade documental;
- [`reference/PRODUCT_SURFACE_CATALOG.md`](reference/PRODUCT_SURFACE_CATALOG.md) — superfícies, UX e ações;
- [`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md) — governança de validação;
- [`../AGENTS.md`](../AGENTS.md) — regras de trabalho.

## 5. Arquitetura

### Produto

- [`architecture/competencias.md`](architecture/competencias.md)
- [`architecture/avaliacao-mensal.md`](architecture/avaliacao-mensal.md)
- [`architecture/modelo-operacional.md`](architecture/modelo-operacional.md)
- [`architecture/timeline-unidade.md`](architecture/timeline-unidade.md)
- [`architecture/navigation-contextual.md`](architecture/navigation-contextual.md)
- [`architecture/testing.md`](architecture/testing.md), subordinado à governança atual quando houver divergência

### Frontend, Supabase e Excel

- [`architecture/frontend-load-order.md`](architecture/frontend-load-order.md)
- [`architecture/product-extensions-load-order.md`](architecture/product-extensions-load-order.md)
- [`architecture/supabase-readiness.md`](architecture/supabase-readiness.md)
- [`architecture/excel-export.md`](architecture/excel-export.md)
- [`architecture/excel-xlsx-runtime.md`](architecture/excel-xlsx-runtime.md)
- [`architecture/excel-sme-mensal.md`](architecture/excel-sme-mensal.md)
- [`architecture/excel-integral-certification.md`](architecture/excel-integral-certification.md)

`architecture/roadmap-pre-supabase.md` é histórico e não representa o estágio atual.

## 6. Supabase e permissões

- [`reference/SUPABASE_DATA_DICTIONARY.md`](reference/SUPABASE_DATA_DICTIONARY.md)
- [`reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](reference/SUPABASE_FUNCTIONAL_COVERAGE.md)
- [`reference/SUPABASE_INTEGRATION_AUDIT.md`](reference/SUPABASE_INTEGRATION_AUDIT.md)
- [`reference/SUPABASE_PERMISSIONS_MATRIX.md`](reference/SUPABASE_PERMISSIONS_MATRIX.md)
- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md)
- [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md)

Runbooks de bootstrap inicial de Auth/dados são procedimentos históricos restritos, não fluxo cotidiano de Production.

## 7. Estado pós-estabilização

Os PRs #166 a #170 consolidaram a rodada recente de competência global, permissões, Pendências, exportações e UX contextual. O baseline exato da rodada está registrado em `CURRENT_STAGE.md` como âncora histórica.

Não existe uma fila genérica de “testes faltantes” que mantenha o RADAR indefinidamente inacabado. Novas validações devem nascer de mudança real, risco concreto, defeito observado, release relevante ou UAT.

## 8. Histórico e evidências

Arquivos datados em `docs/audits/`, `docs/evidence/`, `docs/superpowers/`, `docs/handoff/` e `docs/reports/` registram seu momento histórico. Eles não devem ser reescritos para coincidir com o presente e não prevalecem sobre o código atual.

A reconciliação de 7 de agosto permanece como histórico do pós-PR #162. A reconciliação vigente de regras e testes está refletida diretamente nos documentos canônicos atualizados em 9 de agosto.

## 9. Continuidade

Mudança futura deve atualizar apenas os contratos, testes e documentos materialmente afetados. O fluxo recomendado é inspeção do código, mudança mínima, validação proporcional, classificação de eventuais falhas e confirmação do ambiente publicado quando aplicável.
