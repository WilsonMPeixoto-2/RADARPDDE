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

## 4. Tentativa 2: nova falha do baseline, em outro ponto

- **Job:** `112966118714`. A instalação do Chromium funcionou em 1 min 35 s e o backend subiu normalmente.
- **Falha:** 20 s depois do início do teste, ainda no login (`signIn`, linha 46 do spec). A regra `expect('#tab-verificacoes').toHaveCSS('opacity', '1')` recebeu `"0"` durante os 5 s de espera.
- **Captura de tela:** a unidade "Jornada operacional 1" está carregada e a tabela já aparece. Os botões de competência ainda estão esmaecidos, ou seja, a transição visual não tinha terminado.
- **Origem da linha:** commit `df4c0d68`, de 06/10, anterior ao #429. O #429 não alterou essa linha nem o login.
- **Histórico:** a mesma regra passou nas 6 execuções anteriores do baseline (runs 37655737551, 37655886850, 37656306919 e 37665993736) e no candidato deste mesmo run.
- **Leitura:** é uma instabilidade de tempo na preparação da sessão, antes de qualquer etapa de reconexão. Não indica regressão. Artefatos: `11505068769` (vídeos e capturas) e `11504703997` (métricas).

## 5. Tentativa 3 e critério de decisão

Disparei de novo `gh run rerun 37667249912 --failed` (tentativa 3, job `112969095865`).

- **Se passar:** merge do #429, porque todos os demais critérios já estão atendidos.
- **Se falhar outra vez no mesmo ponto:** **não faço o merge**. Nesse caso a instabilidade deixa de ser pontual e precisa ser tratada à parte, com espera mais robusta no `signIn`, num PR próprio.

## 6. Tarefa pausada a pedido do mantenedor (22:37 +03)

- **Tentativa 3:** às 22:36, depois de cerca de 21 min, o baseline continuava parado em `Instalar Chromium`. É o mesmo travamento do `apt` da tentativa 1. O provável é que o job seja cancelado pelo limite de 35 min. Deixei o run seguir sozinho: ele não altera nada além do próprio resultado.
- **Merge do #429:** **não foi feito**. O PR continua aberto, fora de Draft, `MERGEABLE`, head `d0d4739c`. O único bloqueio é o check "Uso real operacional" (run 37667249912).
- **Já concluído e preservado no remoto:**
  - contraprova (run 37665993736);
  - documentação do #429 (commit `d0d4739c`);
  - thread P2 do #427 respondida e resolvida;
  - relatórios desta pasta (branch `docs/auditoria-manus-2026-10-07`).
- **Para retomar:**
  1. Consultar o resultado da tentativa 3 do run 37667249912.
  2. Se o baseline ficou verde e a comparação passou, fazer o merge (merge commit, como no #427 e no #428).
  3. Se houve nova falha de infraestrutura ou de login, escolher entre rodar de novo (`gh run rerun 37667249912 --failed`) e corrigir a fragilidade num PR próprio.
  4. Em qualquer caso, depois abrir PR da branch `docs/auditoria-manus-2026-10-07` (somente documentação) ou incorporá-la aos documentos.
