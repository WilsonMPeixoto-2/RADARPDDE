# Continuidade e instrumentação pós-PR #193 — Design

## Objetivo

Consolidar um ponto canônico de retomada após o merge do PR #193 e completar a integração da instrumentação de desempenho operacional já incorporada no ciclo de estabilização, sem alterar regras de negócio, schema, dados reais ou arquitetura principal.

## Baseline confirmado

- `main` após o merge do PR #193: `70a63f5cf53ed2dbb1e8d3ab54dd194f7082a576`.
- Vercel Production: deployment `dpl_6BwhhzJDEbUDrQpMptVCRxuRcLbk`, estado `READY`, ligado ao mesmo SHA da `main`.
- Supabase Production: projeto `scnryinorqeucbfkioxo`, com 41 migrations canônicas, incluindo as cinco migrations do PR #193.

Valores voláteis devem ser verificados novamente quando uma sessão futura depender deles.

## Continuidade documental

Será criado um handoff pós-PR #193 que registre:

- a sequência causal e técnica dos PRs #190, #191, #192 e #193;
- problemas que originaram a estabilização;
- decisões de produto preservadas e correções aceitas;
- arquitetura incremental vigente;
- estado de Production, Supabase e migrations no fechamento;
- ferramentas de qualidade e sua integração efetiva;
- riscos conhecidos aceitos e itens fora de escopo;
- critérios para reabrir decisões já consolidadas.

`CURRENT_STAGE.md`, `README.md`, `PROJECT_CONTEXT.md`, `DECISION_LOG.md` e a documentação de ordem de carregamento devem apontar para esse estado corrente sem apagar snapshots históricos.

## Ferramentas incorporadas no PR #193

### Já integradas

- `fast-check`: invariantes/propriedades em testes unitários.
- MSW: falhas, latência e retornos remotos controlados em testes.
- `dependency-cruiser`: gate arquitetural via `check:architecture`, incluído em `test:readiness`.

Essas ferramentas não receberão alterações artificiais apenas para produzir atividade. A documentação deve registrar que já estão conectadas aos gates existentes.

### Integração a concluir

`src/integration/operational-write-diagnostics.js` já implementa medição local, janela limitada e p50/p95, porém ainda não participa do bootstrap nem das escritas reais.

A integração deve:

1. carregar o diagnóstico antes das camadas que realizam escrita/reconciliação;
2. manter uma única probe compartilhada em memória;
3. medir as fases `click`, `feedback`, `rpcStart`, `rpcEnd`, `applyStart`, `applyEnd` e `stable`;
4. correlacionar o evento de UI, a persistência e a reconciliação local sem transportar dados de negócio;
5. expor somente `snapshot()` e `summary()` em `window.RadarOperationalWriteMetrics` como interface pública de diagnóstico;
6. não enviar métricas para Supabase, Vercel ou qualquer serviço externo;
7. não persistir métricas em storage;
8. limitar a janela de amostras;
9. operar em modo fail-open: falha da instrumentação jamais bloqueia a operação funcional;
10. preservar argumentos, retornos, erros e idempotência dos wrappers existentes.

### Performance API

A medição utiliza `performance.now()` quando disponível. Integração com `performance.mark()`/`performance.measure()` e `PerformanceObserver` pode ser usada apenas como mecanismo nativo local e efêmero. Nenhuma entrada deve acumular indefinidamente nem ser transmitida externamente.

## Segurança e privacidade da instrumentação

As amostras podem conter apenas:

- identificador sequencial efêmero;
- nome técnico do handler/operação;
- timestamps monotônicos das fases;
- durações calculadas.

Não coletar escola, usuário, e-mail, competência, programa, NF, pendência, texto digitado, UUID de entidade ou conteúdo de negócio.

## Dependências e vulnerabilidades conhecidas

As vulnerabilidades de pacotes/dependências já conhecidas e conscientemente aceitas permanecem sem ação corretiva nesta frente.

Não executar atualização forçada, `npm audit fix --force`, troca de biblioteca ou mudança de versão apenas para zerar relatório. O tratamento vigente é acompanhar versões futuras compatíveis e reavaliar quando houver correção segura/materialmente útil.

## Fora de escopo

- regra de negócio;
- layout e UX não relacionados ao feedback/diagnóstico já existente;
- otimização mobile;
- migrations ou alteração de schema;
- mutação de dados de Production;
- OpenTelemetry, `web-vitals`, ORM ou migração de framework;
- correção das vulnerabilidades aceitas;
- redução de thresholds de gates.

## Critérios de aceite

1. A instrumentação participa do bootstrap oficial em ordem determinística.
2. Uma escrita inline real pode produzir amostra completa com as sete fases.
3. A persistência mantém o comportamento anterior quando a probe está ausente ou falha.
4. A aplicação/reconciliação local mantém o comportamento anterior quando a probe está ausente ou falha.
5. `RadarOperationalWriteMetrics.snapshot()` e `.summary()` são somente leitura e não expõem dados de negócio.
6. Reinstalação/bootstrap repetido não cria probes, listeners ou wrappers duplicados.
7. A janela de amostras continua limitada e os percentis permanecem determinísticos.
8. Testes e gates proporcionais permanecem verdes.
9. A documentação canônica aponta para o estado pós-PR #193 e preserva os documentos anteriores como históricos.
