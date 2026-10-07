# Etapa 4: conclusão do PR #429 (relatório incremental)

**Data:** 07/10/2026, 21:30 (+03)
**Autorização:** "Executar tudo, incluindo o merge se tudo passar".
**Escopo:** apenas o PR #429, que mexe só em testes e documentos. Nada foi alterado em produto, banco, Auth/RLS ou Production.

## 1. Estado de partida, reconfirmado no GitHub

| Item | Valor |
|---|---|
| Head do PR | `4f87ef1c`, Draft, `MERGEABLE` / `CLEAN` |
| Checks do head | Todos `pass` (os dois *skipping* de Preview são condicionais) |
| `main` | `5152f435` (merge do #428) |
| Proteção de branch | Desativada; o merge depende dos critérios definidos aqui |
| Política de merge usada no repositório | Merge commit (o #427 e o #428 têm dois pais) |

## 2. GREEN nativo da prova causal, conferido nos artefatos

Fonte: `session-report.json` de cada variante, baixado do GitHub.

| Run | Evento | SHA | Rodadas | Baseline | Candidato | Antiga | Recuperação |
|---|---|---|---|---|---|---|---|
| [37655737551](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/37655737551) | dispatch | `829c3d10` | 40 | passou | passou | Não / v44 | Sim / v45 |
| [37655886850](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/37655886850) | PR | `829c3d10` | 400 | passou | passou | Não / v404 | Sim / v405 |
| [37656306919](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/37656306919) | PR | `4f87ef1c` | 400 | passou | passou | Não / v404 | Sim / v405 |

Nas 6 execuções:

- `oldHeldThroughReconnect`, `uiOldBeforeRecovery` e `uiConvergedAfterRecovery` deram `true`;
- a RPC de recuperação foi `read_operational_context`;
- a origem registrada foi `session-realtime-reconnect-inflight-finished-refresh`.

## 3. Contraprova do mecanismo final: conclusiva

- **Branch descartável:** `tmp/counterproof-pr429-2026-10-07`, commit `700f7af9` sobre `4f87ef1c`. A sabotagem é a mesma do RED e vale só no candidato: `loadOperationalContext` com origem `realtime-reconnect` retorna `skipped`.
- **Run:** [37665993736](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/37665993736), 40 rodadas.

| Variante | Resultado | Detalhe |
|---|---|---|
| Baseline | **passou** | Antiga Não/v44, recuperação Sim/v45, recarga concluída |
| Candidato (sabotado) | **falhou como exigido** | `stage: reconnect-counterproof`; `Expected "Sim"`, `Received undefined`, depois de 60 s esperando a resposta de recuperação; `recoveryReadsSuppressed: 1` |
| Comparação | falhou como consequência | `candidate: experiment is incomplete or failed (requires passed reload)`: o comparador se recusa a comparar uma execução que falhou |

- **Artefato do candidato:** `11502977073`, sha256 `abf1a553…f150225`.
- A branch temporária foi **apagada** depois de registrada; consultada em seguida, o GitHub responde `Branch not found`.
- Nenhum workflow de push dispara nesse tipo de branch. Só o dispatch manual rodou.

**Conclusão:** o teste novo não aprova a reconexão se a leitura real de recuperação não acontecer. O falso positivo apontado na crítica P2 está resolvido.

## 4. Documentação do PR atualizada

- **Commit:** `d0d4739c` — "docs: registrar GREEN nativo e contraprova do PR 429".
- **Conteúdo:** 6 arquivos, só documentação: `CURRENT_STAGE.md`, `docs/README.md`, evidências (`README.md` e `local-validation.json`), handoff e `STATUS_DOCUMENTOS.md`.
- **O que mudou:** a menção "GREEN nativo pendente" foi substituída pelos runs reais e pela contraprova. O registro original do checkpoint foi mantido como histórico.

## 5. Crítica P2 do PR #427

- **Thread:** `PRRT_kwDOTSIJkc6p63HK`.
- **Resposta publicada:** [comentário 4210508192](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/427#discussion_r4210508192), com link para o #429, os runs e a contraprova.
- **Situação:** `isResolved: true`.

## 6. Próximo passo (em andamento)

Tirar o #429 de Draft, esperar os checks do head `d0d4739c` e fazer o merge **somente** se:

- não houver conflito;
- todos os checks estiverem verdes;
- não houver revisão bloqueante.

O resultado final entra no relatório da Etapa 5.
