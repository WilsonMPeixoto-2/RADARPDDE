# Etapa 3 — PR #429: o que o Codex fez, o que descobriu, quando parou e o que falta

**Data da verificação:** 07/10/2026, 20:28 (horário de Brasília +3, igual ao das mensagens)
**Modo:** somente leitura. Nada foi alterado no GitHub, no Supabase, na Vercel ou no repositório.
**Fontes conferidas:** os prints enviados, a API do GitHub (commits, arquivos, runs, jobs e threads), os artefatos JSON dos runs, o diff real do PR e a análise do agente do ChatGPT.

## 1. Resumo

O Codex **não alterou o produto**. Ele descobriu que **a prova automatizada de reconexão do PR #427 podia passar pelo motivo errado** (falso positivo). Comprovou isso com um teste RED em Supabase real e reescreveu a prova para que ela só passe se a leitura de recuperação realmente acontecer. Depois publicou o PR #429 (Draft) e salvou um handoff. A cota acabou logo após esse último push, antes de ele ver qualquer resultado de CI.

Depois que ele parou, **todos os 9 workflows do head atual (`4f87ef1c`) terminaram verdes**, e a nova prova passou nas duas variantes (baseline e candidato) nas três execuções em que rodou. Para o merge, falta essencialmente: **uma contraprova do teste novo**, **atualizar os documentos que ainda dizem "GREEN pendente"** e **fechar a thread P2 do #427**.

## 2. Linha do tempo verificada

| Horário (+03) | Evento | Fonte |
|---|---|---|
| 19:41 | `4bb9428c` — registra a revisão causal pós-merge | commit |
| 19:42 | `b686c438` — commit **RED** temporário com sabotagem só no teste | commit |
| 19:42–19:46 | Run `37654112405`: baseline passou e candidato **falhou como esperado** | Actions |
| 19:45 | `8e741d98` — corrige duas referências ao smoke do #426 | commit |
| 19:57 | `829c3d10` — candidato final do teste (sabotagem removida) | commit |
| 20:01 | Dispatch diagnóstico de 40 rodadas `37655737551` | Actions |
| 20:02 | PR #429 aberto como Draft; CI do PR disparado | GitHub |
| 20:04:55 | `4f87ef1c` — "salvar checkpoint completo do PR 429 antes da interrupção" (push concluído) | commit/print |
| **≈20:05** | **A cota acabou.** Nenhuma ação do Codex depois disso | ausência de commits/ações |
| 20:09:57 | Diagnóstico de 40 rodadas: **sucesso** (baseline, candidato e comparação) | Actions |
| 20:15:28 | Gate sustentado de 400 rodadas em `829c3d10`: **sucesso** | Actions |
| 20:27:06 | Último gate sustentado no head `4f87ef1c`: **sucesso**; 9/9 workflows verdes | Actions |

Os runs de `829c3d10` marcados como *cancelled* foram cancelados automaticamente pelo push seguinte (concorrência por branch). Eles não são falhas.

## 3. O que ele descobriu

**O defeito estava no teste, não no RADAR.** O harness antigo só registrava a leitura HTTP do observador **depois** da latência ou da barreira artificial. Durante essa espera, a leitura existia, mas era invisível para a drenagem. O teste concluía então que não havia nenhuma leitura em voo. Quando essa leitura era liberada, ela consultava o banco já com "Sim" e a interface convergia, **mesmo sem a recuperação pós-reconexão**.

**Prova RED (`b686c438`, run `37654112405`)**, conferida no diff e no `red.json`:

- só no candidato, ele substituiu `loadOperationalContext` para ignorar chamadas com origem `realtime-reconnect`. Socket, `SUBSCRIBED` e contador `reconnectRefreshes` continuaram reais;
- resultado: `hiddenReadPassedDrain: true`, `originalUiAssertionPassed: true`, `recoveryReadsSuppressed: 1`. A asserção causal nova ("sem recovery a UI deve continuar Não") **falhou**, o que confirma o falso positivo;
- essa era exatamente a crítica P2 deixada no #427 (thread `PRRT_kwDOTSIJkc6p63HK`).

## 4. O que ele mudou (diff real: 13 arquivos, +459/−30, nenhum arquivo de produto)

| Arquivo | Mudança |
|---|---|
| `tests/support/operational-read-tracker.js` (novo) | Registra a leitura **na entrada da rota** e separa os estados *ativa*, *retida* e *finalizada/abortada* |
| `tests/unit/operational-read-tracker.test.js` (novo) | 5 testes: latência, retenção, abort, handler tardio, barreira ≠ HTTP terminado |
| `tests/e2e/operational-sustained-sessions.spec.js` | Nova prova causal de reconexão (detalhada abaixo) |
| `.github/workflows/operational-real-usage-gate.yml` | Filtro de paths passa a incluir `tests/support/operational-*.js` |
| `SUPABASE_INTEGRATION_AUDIT.md`, `SUPABASE_FUNCTIONAL_COVERAGE.md` | Retiram a exigência de "cinco identidades técnicas" e alinham ao #426 (1 a 5 contas reais) |
| `docs/handoff`, `docs/evidence`, `CURRENT_STAGE`, `README`, `STATUS_DOCUMENTOS` | Checkpoint e evidências |

**Nova prova de reconexão**, já confirmada nos artefatos do run `37655886850`:

1. Desconecta o socket real e espera zerar as leituras ativas não retidas.
2. Força uma leitura real e **retém a resposta SQL já obtida**: `Não`, `row_version 404`.
3. O escritor grava `Sim`. O observador continua mostrando `Não`.
4. Reconecta e exige `SUBSCRIBED`, aumento de `reconnectRefreshes` **e** de `refreshAttempts`, com refresh pendente.
5. Só então libera a resposta antiga. Ela continua `Não`, portanto **não pode explicar o "Sim"**.
6. Captura a nova leitura global: `Sim`, `row_version 405`, iniciada depois da reconexão. Ela fica retida enquanto o teste confirma que a UI ainda mostra `Não`.
7. Libera a resposta, e a UI vai para `Sim`. O teste confere ainda que a origem registrada contém `realtime-reconnect` e que a leitura não é *stale* nem abortada.

Valores gravados no artefato (as duas variantes são idênticas): `oldHeldThroughReconnect: true`, `uiOldBeforeRecovery: true`, `uiConvergedAfterRecovery: true`, `recoverySource: session-realtime-reconnect-inflight-finished-refresh`.

**Decisão técnica correta do Codex:** reter a leitura antiga *antes* do SQL até a nova terminar travaria o próprio teste, porque o controller usa *single-flight*. Por isso ele retém a **resposta** já consultada, e não a requisição.

## 5. Concordâncias e correções em relação à análise do ChatGPT

Concordo com o essencial: o diagnóstico está correto, o produto não foi alterado e o ponto de parada está identificado com precisão. Há quatro ajustes a fazer:

| Ponto do ChatGPT | Minha verificação |
|---|---|
| "Passou na prova real de 400 rodadas" | As 400 rodadas são da carga sustentada. **A reconexão acontece uma única vez por variante por execução** (`realtimeDisconnects = 1`). A evidência correta: a prova causal passou **3 vezes em cada variante** (6 execuções verdes, 0 falhas) |
| "Faltam mais duas repetições de 40 rodadas" | O código de teste é idêntico em `829c3d10` e `4f87ef1c` (o último commit só mexe em docs). As 3 execuções exigidas pelo plano **já estão cumpridas na prática**. Repetir seria custo redundante |
| "Um workflow ainda executando" | Terminou às 20:27 com **sucesso**. Agora são **9/9 verdes** no head |
| Hardening como pendência | Nunca rodou nesta branch (0 runs), mas o PR não toca no produto. Considero **opcional**, não bloqueante |

## 6. Observações críticas sobre a prova nova (sem bloqueio)

- **A prova não diferencia baseline de candidato.** As duas variantes passam. É uma prova de invariante (recuperação após reconexão), não de ganho. Isso é adequado ao objetivo.
- **Risco de instabilidade, não de falso positivo.** A captura "recovery" pega a *próxima* leitura depois do `connect`. Se uma leitura escolar entrar antes, o teste falha (`rpc` esperado global). Ele falha fechado. Hoje: 0 ocorrências em 6 execuções.
- **A sonda acrescenta uma leitura global** nas duas variantes. Isso está documentado em `limits` e não distorce a comparação.
- **Asserções dentro do handler de rota**: uma falha ali faz o `expect.poll` seguinte esgotar o tempo, então o teste falha (fail-closed). O `finally` libera as duas barreiras, o que evita travamento.

## 7. O que falta para concluir (em ordem)

1. **Contraprova do teste novo (essencial).** Em uma branch temporária a partir de `4f87ef1c`, reaplicar a mesma sabotagem do RED (ignorar `loadOperationalContext` com origem `realtime-reconnect`) e disparar o gate diagnóstico de 40 rodadas. **Resultado esperado: o candidato falha na captura de "recovery".** Depois, apagar a branch temporária. O PR #429 não é tocado.
2. **Atualizar os documentos do PR** (`handoff`, `evidence/README.md`, `local-validation.json`, `CURRENT_STAGE.md`, `STATUS_DOCUMENTOS.md`): trocar "GREEN nativo pendente" pelos runs `37655737551`, `37655886850` e `37656306919` e pelo resultado da contraprova. **Sem isso, a `main` passaria a registrar um estado falso.**
3. **Responder e resolver a thread P2 do #427** (`PRRT_kwDOTSIJkc6p63HK`, ainda aberta) com link para o #429.
4. Tirar o #429 de Draft e fazer o merge. Ele mexe só em testes e docs, então o impacto em Production é nulo.
5. (Opcional) rodar o `sync-hardening-targeted.yml`.

**Parecer:** o direcionamento do Codex está correto e o trabalho é tecnicamente sólido. **Não há regressão nem alteração de produto.** O PR está pronto para merge assim que os itens 1 a 3 forem concluídos.
