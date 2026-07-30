# Arquitetura do RADAR PDDE

**Atualizado em:** 29 de julho de 2026

Esta pasta registra contratos técnicos e funcionais vigentes, além de alguns documentos históricos explicitamente classificados.

## Contratos vigentes de produto

- [`competencias.md`](competencias.md) — chave mensal, contexto global e disponibilidade de 2026;
- [`avaliacao-mensal.md`](avaliacao-mensal.md) — bonificação, análise técnica e pendências;
- [`modelo-operacional.md`](modelo-operacional.md) — projeção compartilhada das superfícies;
- [`timeline-unidade.md`](timeline-unidade.md) — linha do tempo derivada;
- [`navigation-contextual.md`](navigation-contextual.md) — rotas e retorno seguro;
- [`estatisticas.md`](estatisticas.md) — denominadores de escolas e programas;
- [`retificacoes.md`](retificacoes.md) — histórico e correções operacionais.

## Relatórios Excel

- [`excel-export.md`](excel-export.md) — relatório institucional histórico;
- [`excel-workbook-plan.md`](excel-workbook-plan.md) — plano declarativo do workbook;
- [`excel-xlsx-runtime.md`](excel-xlsx-runtime.md) — renderer OOXML e integração do runtime;
- [`excel-sme-mensal.md`](excel-sme-mensal.md) — produto mensal da SME;
- [`excel-integral-certification.md`](excel-integral-certification.md) — certificação célula a célula.

Estado atual:

- modelos e renderers implementados;
- certificação automatizada concluída;
- botão institucional ainda no CSV;
- homologação manual no Microsoft Excel desktop pendente.

## Frontend e integração

- [`frontend-load-order.md`](frontend-load-order.md) — ordem de recursos estáticos, `config.js`, loader Excel e extensões;
- [`product-extensions-load-order.md`](product-extensions-load-order.md) — timeline e navegação contextual pós-`app.js`;
- [`testing.md`](testing.md) — estratégia de testes e gates de qualidade.

## Persistência e segurança

- [`supabase-readiness.md`](supabase-readiness.md) — arquitetura vigente de Supabase em Preview/Production.

Referências complementares:

- [`../reference/SUPABASE_DATA_DICTIONARY.md`](../reference/SUPABASE_DATA_DICTIONARY.md);
- [`../reference/SUPABASE_PERMISSIONS_MATRIX.md`](../reference/SUPABASE_PERMISSIONS_MATRIX.md);
- [`../reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](../reference/SUPABASE_FUNCTIONAL_COVERAGE.md);
- [`../runbooks/SUPABASE_CONNECTION.md`](../runbooks/SUPABASE_CONNECTION.md);
- [`../runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](../runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md).

## Documento histórico

- [`roadmap-pre-supabase.md`](roadmap-pre-supabase.md) — planejamento anterior à ativação do backend remoto; não representa o estágio atual.

## Regra de precedência

1. código, migrations e tipos gerados;
2. ambientes efetivos;
3. ADRs vigentes;
4. contratos desta pasta;
5. planos, auditorias e evidências datados.

A classificação detalhada está em [`../reference/STATUS_DOCUMENTOS.md`](../reference/STATUS_DOCUMENTOS.md).
