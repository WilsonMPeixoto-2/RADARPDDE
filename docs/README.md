# Documentação do RADAR PDDE

**Estado de referência:** 7 de agosto de 2026  
**Classe documental:** Canônico — índice

## 1. Baseline

O estado corrente e o procedimento de revalidação ficam em [`CURRENT_STAGE.md`](CURRENT_STAGE.md). SHA da própria `main`, deployment e versão de Edge Function não devem ser congelados como “estado atual” em documento versionado, pois a própria atualização pode alterá-los. Valores exatos pertencem a checkpoints históricos datados.

Regra de precedência:

```text
código e contratos executáveis
→ Supabase/Vercel efetivos
→ evidências do mesmo SHA
→ decisões vigentes
→ documentação canônica
→ referências vigentes
→ históricos
```

## 2. Ordem de leitura

1. [`../AGENTS.md`](../AGENTS.md);
2. [`CURRENT_STAGE.md`](CURRENT_STAGE.md);
3. [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md);
4. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md);
5. [`ROADMAP_ATUALIZACOES_2026.md`](ROADMAP_ATUALIZACOES_2026.md);
6. [`DECISION_LOG.md`](DECISION_LOG.md);
7. [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md);
8. [`architecture/README.md`](architecture/README.md).

## 3. Matriz funcional ponta a ponta

### Fonte executável

- [`reference/functional-contract-matrix.json`](reference/functional-contract-matrix.json);
- `reference/functional-contract-matrix/*.json`;
- [`../scripts/check-functional-contract-matrix.mjs`](../scripts/check-functional-contract-matrix.mjs);
- [`../tests/unit/functional-contract-matrix.test.js`](../tests/unit/functional-contract-matrix.test.js);
- [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md) — visão gerada.

```bash
npm run generate:functional-matrix
npm run check:functional-matrix
```

A matriz contém 41 operações e integra o readiness. Após a reconciliação pós-PR #162, não há operação classificada como lacuna técnica ou decisão funcional pendente; as operações ainda não integralmente provadas permanecem `partial`.

## 4. Documentos canônicos

- [`CURRENT_STAGE.md`](CURRENT_STAGE.md) — guia canônico de estado corrente e revalidação;
- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — contrato funcional e arquitetural;
- [`ROADMAP_ATUALIZACOES_2026.md`](ROADMAP_ATUALIZACOES_2026.md) — sequência e prioridades;
- [`DECISION_LOG.md`](DECISION_LOG.md) — decisões duradouras;
- [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md) — validade documental;
- [`../README.md`](../README.md) — entrada do repositório;
- [`../AGENTS.md`](../AGENTS.md) — regras de trabalho.

## 5. Arquitetura

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

`architecture/roadmap-pre-supabase.md` é histórico e não representa o estágio atual.

## 6. Supabase e permissões

- [`reference/SUPABASE_DATA_DICTIONARY.md`](reference/SUPABASE_DATA_DICTIONARY.md)
- [`reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](reference/SUPABASE_FUNCTIONAL_COVERAGE.md)
- [`reference/SUPABASE_INTEGRATION_AUDIT.md`](reference/SUPABASE_INTEGRATION_AUDIT.md)
- [`reference/SUPABASE_PERMISSIONS_MATRIX.md`](reference/SUPABASE_PERMISSIONS_MATRIX.md)
- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md)
- [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md)

Os runbooks de bootstrap inicial de Auth/dados são procedimentos históricos restritos, não fluxo cotidiano de Production.

## 7. Garantias operacionais

A arquitetura vigente inclui:

- monitor geral de Production;
- incidentes automáticos;
- auditoria agregada de vinte invariantes;
- backup/restauração descartáveis;
- gate por perfil e viewport;
- matriz funcional executável;
- infraestrutura do smoke autenticado de leitura, desativada remotamente até provisionamento específico.

## 8. Decisões centrais

- [`decisions/ADR-040-garantia-operacional-contínua.md`](decisions/ADR-040-garantia-operacional-contínua.md)
- [`decisions/ADR-041-confiabilidade-funcional-ponta-a-ponta.md`](decisions/ADR-041-confiabilidade-funcional-ponta-a-ponta.md)
- [`decisions/ADR-042-reconciliacao-documental-remota.md`](decisions/ADR-042-reconciliacao-documental-remota.md)

## 9. Auditorias, evidências e planos

Regra permanente:

- arquivos datados em `docs/audits/` e `docs/evidence/` são registros do momento de sua produção;
- planos/specs em `docs/superpowers/` são históricos após execução ou continuam trabalho em andamento apenas quando sua branch/PR ainda estiver ativa;
- não reescrever baseline histórico para fazê-lo coincidir com o presente;
- registrar resolução posterior por referência ao PR/commit/migration correspondente.

A reconciliação atual está em [`audits/2026-08-07-reconciliacao-documental-integral-pos-pr162.md`](audits/2026-08-07-reconciliacao-documental-integral-pos-pr162.md).

## 10. Continuidade

A prioridade corrente é fechar a divergência documental/histórica do PR #156 e retomar a auditoria funcional remanescente a partir da `main` atual, sem repetir cegamente provas já absorvidas pelos PRs posteriores.

Mudança funcional material deve atualizar a operação correspondente na matriz, testes, contrato técnico, roadmap e evidência aplicável. Planos históricos não são reescritos para parecer atuais.
