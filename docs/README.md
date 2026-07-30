# Documentação do RADAR PDDE

**Estado de referência:** 29 de julho de 2026

Este diretório separa contratos vigentes, procedimentos, decisões, planos históricos e evidências geradas.

## 1. Estado resumido

O RADAR PDDE está conectado ao Supabase Production autorizado e publicado na Vercel Production com `dataMode: supabase-production`.

Concluídos e publicados:

- governança da Gestão SME;
- competência global janeiro–dezembro;
- avaliação mensal canônica;
- timeline cronológica da unidade;
- certificação e integração dos dois produtos Excel;
- CSV legado preservado como fallback;
- navegação contextual e retorno seguro.

A liberação oficial ainda não foi declarada.

## 2. Entrada obrigatória

1. [`../AGENTS.md`](../AGENTS.md) — instruções operacionais e fontes de verdade;
2. [`CURRENT_STAGE.md`](CURRENT_STAGE.md) — estado, bloqueadores e próxima decisão;
3. [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — finalidade, perfis, arquitetura e contratos;
4. [`DECISION_LOG.md`](DECISION_LOG.md) — ADRs vigentes, implementadas e substituídas;
5. [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md) — validade e precedência dos documentos;
6. [`audits/2026-07-29-alinhamento-documental-integral-pos-pr108.md`](audits/2026-07-29-alinhamento-documental-integral-pos-pr108.md) — auditoria da reconciliação atual.

Para dado mutável, confirmar sempre código, Supabase e Vercel.

## 3. Arquitetura de produto

| Tema | Documento |
|---|---|
| índice de arquitetura | [`architecture/README.md`](architecture/README.md) |
| catálogo de superfícies | [`reference/PRODUCT_SURFACE_CATALOG.md`](reference/PRODUCT_SURFACE_CATALOG.md) |
| competências | [`architecture/competencias.md`](architecture/competencias.md) |
| avaliação mensal | [`architecture/avaliacao-mensal.md`](architecture/avaliacao-mensal.md) |
| projeção operacional | [`architecture/modelo-operacional.md`](architecture/modelo-operacional.md) |
| timeline | [`architecture/timeline-unidade.md`](architecture/timeline-unidade.md) |
| navegação contextual | [`architecture/navigation-contextual.md`](architecture/navigation-contextual.md) |
| estatísticas | [`architecture/estatisticas.md`](architecture/estatisticas.md) |
| retificações | [`architecture/retificacoes.md`](architecture/retificacoes.md) |
| relatório institucional | [`architecture/excel-export.md`](architecture/excel-export.md) |
| Excel SME mensal | [`architecture/excel-sme-mensal.md`](architecture/excel-sme-mensal.md) |
| runtime Excel | [`architecture/excel-xlsx-runtime.md`](architecture/excel-xlsx-runtime.md) |
| certificação Excel | [`architecture/excel-integral-certification.md`](architecture/excel-integral-certification.md) |

## 4. Arquitetura técnica

| Tema | Documento |
|---|---|
| persistência e Supabase | [`architecture/supabase-readiness.md`](architecture/supabase-readiness.md) |
| ordem do frontend | [`architecture/frontend-load-order.md`](architecture/frontend-load-order.md) |
| extensões pós-`app.js` | [`architecture/product-extensions-load-order.md`](architecture/product-extensions-load-order.md) |
| estratégia de testes | [`architecture/testing.md`](architecture/testing.md) |
| plano do workbook | [`architecture/excel-workbook-plan.md`](architecture/excel-workbook-plan.md) |

## 5. Decisões e referências

| Documento | Uso |
|---|---|
| [`DECISION_LOG.md`](DECISION_LOG.md) | fonte vigente das decisões duradouras |
| [`reference/PRODUCT_DECISIONS.md`](reference/PRODUCT_DECISIONS.md) | mapeamento histórico dos antigos IDs de decisão |
| [`reference/PRODUCT_SURFACE_CATALOG.md`](reference/PRODUCT_SURFACE_CATALOG.md) | superfícies S-01 a S-18 |
| [`reference/CHANGE_CLASSIFICATION.md`](reference/CHANGE_CLASSIFICATION.md) | classificação de achados e condutas |
| [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md) | classificação dos documentos |

## 6. Supabase

| Documento | Uso |
|---|---|
| [`reference/SUPABASE_DATA_DICTIONARY.md`](reference/SUPABASE_DATA_DICTIONARY.md) | resumo do schema vigente |
| [`reference/SUPABASE_PERMISSIONS_MATRIX.md`](reference/SUPABASE_PERMISSIONS_MATRIX.md) | Auth, RLS, perfis e escopos |
| [`reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](reference/SUPABASE_FUNCTIONAL_COVERAGE.md) | cobertura por fluxo |
| [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md) | operação e diagnóstico da conexão |
| [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md) | schema, reconciliação, dados e rollback |
| [`runbooks/SUPABASE_DATA_BOOTSTRAP.md`](runbooks/SUPABASE_DATA_BOOTSTRAP.md) | procedimento histórico/restrito de carga inicial |
| [`runbooks/SUPABASE_AUTH_BOOTSTRAP.md`](runbooks/SUPABASE_AUTH_BOOTSTRAP.md) | procedimento histórico/restrito do primeiro administrador |

### Gate vigente de migrations

A próxima migration de Production está bloqueada até a reconciliação do identificador da migration SME:

```text
local: 20260728182226
remoto: 20260728190344
```

O SQL é idêntico; o desvio é de histórico. O runbook incorpora o preflight e a estratégia de reparo suportado, mas nenhum reparo foi executado.

## 7. Vercel

O estado deve ser verificado por:

- deployment efetivamente associado ao projeto `radarpdde`;
- SHA e manifesto do artefato;
- configuração pública gerada pelo build;
- relatórios e auditorias datados;
- `vercel.json` para a política de deployments automáticos.

Preview e Production são artefatos distintos. Confirmar SHA, manifesto e ambiente antes de homologar.

## 8. Auditorias recentes

- [`audits/2026-07-29-alinhamento-documental-integral-pos-pr108.md`](audits/2026-07-29-alinhamento-documental-integral-pos-pr108.md);
- [`audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md`](audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md);
- [`audits/2026-07-29-rastreabilidade-migration-sme.md`](audits/2026-07-29-rastreabilidade-migration-sme.md);
- [`audits/2026-07-28-alinhamento-codigo-ambientes-documentacao.md`](audits/2026-07-28-alinhamento-codigo-ambientes-documentacao.md).

Auditorias são datadas. Seus gates permanecem até evidência de superação, mas estados remotos devem ser consultados novamente.

## 9. Planos, especificações e evidências

### Planos e especificações

- `superpowers/specs/`: desenho aprovado na data;
- `superpowers/plans/`: execução datada;
- caixas não marcadas em plano antigo não provam pendência atual;
- plano substituído não deve ser retomado.

### Evidências

- `evidence/`: manifests, hashes, capturas e inventários gerados;
- regenerar com o script canônico;
- não editar artefato gerado manualmente;
- distinguir evidência sintética de homologação real.

## 10. Bloqueadores atuais

1. reconciliar o histórico da migration SME;
2. habilitar proteção contra senhas vazadas;
3. fixar deliberadamente a major do Node;
4. testar backup e restauração;
5. abrir e homologar os arquivos no Microsoft Excel desktop;
6. executar matriz remota por perfil e viewport;
7. concluir UAT;
8. executar polimento editorial/visual;
9. registrar decisão formal de release.

## 11. Regra para a próxima tarefa

Antes de implementar:

1. ler `AGENTS.md` e `CURRENT_STAGE.md`;
2. confirmar que o objetivo não contradiz ADR vigente;
3. verificar código e ambientes;
4. declarar escopo e fora de escopo;
5. trabalhar em branch própria;
6. executar gates aplicáveis;
7. atualizar documentação e evidências no mesmo ciclo.
