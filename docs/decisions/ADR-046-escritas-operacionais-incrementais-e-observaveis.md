# ADR-046 — Escritas operacionais usam retorno autoritativo, reconciliação incremental e diagnóstico local

**Data:** 23 de agosto de 2026
**Status:** Aprovada; implementada parcialmente nos PRs #190–#194; lacunas específicas de `invoice:save` registradas em 24/08/2026

## Contexto

O fluxo de avaliação mensal apresentou latência operacional real. A investigação mostrou que a persistência no banco não era o principal gargalo: leituras remotas redundantes e reconstruções integrais do Prontuário prolongavam a estabilização percebida pelo usuário.

A sequência #190–#193 removeu essas causas sem migrar framework, reduzir segurança ou enfraquecer os contratos de persistência.

## Decisão

O caminho normal de uma escrita inline bem-sucedida é:

```text
interação
→ feedback visual imediato
→ persistência/RPC
→ retorno autoritativo
→ incorporação incremental do estado
→ reconciliação localizada escola + competência + programa
→ estabilização visual
```

`renderProntuario()` integral é fallback para bootstrap, navegação, erro, retorno incompleto ou inconsistência não reconciliável. Não deve ser executado após todo sucesso apenas por precaução.

Operação semanticamente idêntica ao estado atual é idempotente: não deve criar nova persistência, `row_version` ou log desnecessário.

## Lacunas confirmadas em 24/08/2026

A decisão continua vigente, mas o diagnóstico sobre a `main` `4542bbf` encontrou pontos ainda não cobertos no fluxo de despesas:

- o formulário não impede uma segunda submissão enquanto a primeira está pendente;
- cada execução de uma inclusão gera uma nova identidade;
- a edição não usa um planejador que compare despesa, bem, avaliação, Assessoria, consolidação e demais efeitos antes de decidir por no-op;
- a dispensa de refresh de `administrativeLogs` em `invoice:save` depende da instalação da extensão opcional de desempenho;
- a RPC não recebe chave idempotente de intenção para retry, duas abas ou perda de resposta;
- a resposta atual ainda não é suficiente para aplicação incremental segura em toda transição, especialmente remoção por `deleted_asset_id`.

Essas lacunas não revogam a arquitetura. Elas impedem classificar `invoice:save` como integralmente aderente até a execução de PR1, PR2, PR5, PR8A e PR8B do [`../superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md`](../superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md).

## Observabilidade local

O diagnóstico operacional pode medir as fases:

- `click`;
- `feedback`;
- `rpcStart`;
- `rpcEnd`;
- `applyStart`;
- `applyEnd`;
- `stable`.

As métricas são efêmeras, limitadas em memória e consultáveis somente localmente por `RadarOperationalWriteMetrics.snapshot()` e `summary()`.

Não há telemetria externa, persistência de métricas ou coleta de identificadores/conteúdo de negócio. A instrumentação é fail-open.

## Ferramentas

`fast-check`, MSW e `dependency-cruiser` são ferramentas de desenvolvimento/teste e não entram no bundle de runtime. A Performance API/PerformanceObserver nativa pode ser usada localmente sem serviço de observabilidade externo.

## Consequências

- consistência não depende de reconstruir toda a tela;
- latência de rede e aplicação local podem ser distinguidas;
- falha de diagnóstico não afeta a operação funcional;
- nova proposta de rerender integral, state library ou framework deve demonstrar necessidade material, não apenas preferência técnica.
