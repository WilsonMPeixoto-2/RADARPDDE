# ADR-046 — Escritas operacionais usam retorno autoritativo, reconciliação incremental e diagnóstico local

**Data:** 23 de agosto de 2026  
**Status:** Aprovada e implementada nos PRs #190–#193; diagnóstico local integrado no PR #194

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
