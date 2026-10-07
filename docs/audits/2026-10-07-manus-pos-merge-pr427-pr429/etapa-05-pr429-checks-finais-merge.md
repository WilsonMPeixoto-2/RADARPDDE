# Etapa 5: checks finais e merge do PR #429

**Situação:** em andamento. Registro feito às 22:08 (+03) de 07/10/2026.

## 1. Checks do head `d0d4739c` (commit que só altera documentos)

PR fora de Draft: `MERGEABLE`, sem revisões bloqueantes.

| Workflow | Run | Resultado |
|---|---|---|
| Supabase readiness | 37667250105 | sucesso |
| Testes E2E Playwright | 37667250203 | sucesso |
| Saúde das dependências | 37667249985 | sucesso |
| Validar RADAR PDDE | 37667249915 | sucesso |
| CodeQL | 37667249933 | sucesso |
| Confiabilidade funcional com Supabase real | 37667249943 | sucesso |
| Homologação integral pré-production | 37667249950 | sucesso |
| Ciclos funcionais reais com Supabase | 37667249881 | sucesso |
| Uso real operacional (400 rodadas) | 37667249912 | **cancelado** (tentativa 1) |

## 2. Diagnóstico do cancelamento

**Variante candidato: passou.** A prova causal ficou íntegra:

- resposta antiga retida: `Não`/v404;
- resposta de recuperação: `Sim`/v405, origem `session-realtime-reconnect-inflight-finished-refresh`;
- teste chegou ao `reload`.

**Variante baseline: cancelada pelo tempo limite de 35 minutos do job.** A falha ocorreu na preparação da máquina, antes de qualquer teste:

- o passo `Instalar Chromium` (`npx playwright install --with-deps chromium`) ficou parado no `apt` de 18:30:28 a 19:04:57 UTC, depois de baixar os índices `noble-security`;
- nenhum teste chegou a rodar nessa variante, e ela não gerou artefato.

**Comparação:** falhou como consequência, porque só existia o artefato do candidato.

**Conclusão:** falha de infraestrutura do runner (rede/espelho do apt). Não é falha do teste nem do produto. O baseline usa o produto fixo `d9bf67f7`, que o PR #429 não altera.

## 3. Ação tomada

Executei `gh run rerun 37667249912 --failed`, que repete só o job com falha. A tentativa 2 refaz o baseline e a comparação; o candidato aprovado na tentativa 1 é mantido. O merge só será feito se a tentativa 2 terminar com sucesso.
