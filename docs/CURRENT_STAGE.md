# RADAR PDDE — estado atual e retomada

**Classe documental:** Canônico — estado mutável
**Atualizado em:** 25 de setembro de 2026

## Baseline confirmada

- `main` observada nesta rodada: `bb7246438b8c6b72ef068b21bb40d492a7049af2` (merge do PR #374). Inclui os PRs #370–#374: jornada de Despesa a identificar, polimento visual, atualização do modelo documental e feedback por etapa.
- A última baseline de **runtime publicada confirmada pelos documentos anteriores** é `6dd4b92367dfa7f9f45e3a9db49ebde5b21807c7` (#371). A `main` avançou depois; o deploy efetivo precisa ser conferido novamente antes de qualquer afirmação sobre Production. O deployment então registrado foi `dpl_6V1cQ9FvLdy9bQXgpd2TruxczT81`.
- Production usa Supabase como persistência canônica. A arquitetura de performance/sincronização dos PRs #327–#344 continua vigente: RLS set-based, leitura contextual, prioridade de escrita, cancelamento de leituras obsoletas e invalidação Realtime seguida de releitura. Não alterar esses contratos na frente atual.

## Frente ativa: auditoria da jornada desktop de Despesa a identificar

O PR [#375](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/375) está **aberto e em draft** no head `b1b115be3bc5041e7a514d5745e6291a4324381b`, base `main`. Trata NAV-01 (filtro de escola em Pendências) e UX-04 (largura do drawer mobile); o último commit corrige a fixture desktop do teste NAV-01, que começava sem Pendências. O próprio PR condiciona merge e Production à validação do Preview pelo responsável pelo produto. Não tratá-lo como integrado nem promovê-lo antes disso.

A continuação dos achados UX-01, UX-02, UX-03, UX-05, UX-06 e D-01 está no PR [#376](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/376), **draft, empilhado sobre a branch do #375**. O primeiro checkpoint remoto de implementação é `a2915d2d1aadb08b128b88d4e810c082eb8923b2`; a integração com o novo head do #375 e a restauração do rótulo aprovado estão em `27f2af29768bd90b3c1127b5b728b4fc8a6beb64`. O foco de aceitação é desktop. Esta frente modifica apenas apresentação, cópia e contexto visual, preservando o mesmo lançamento, a mesma Pendência, as transições e os serviços existentes.

O estado de execução, comandos de validação, commits remotos, pontos pendentes e instruções de integração estão no **handoff corrente**:

`docs/handoff/2026-09-25-desktop-expense-journey.md`

## Critério de conclusão desta frente

1. UX-01: o modal de edição deixa explícito que retifica o lançamento existente e mantém a Pendência.
2. UX-02: o modal de despesa mostra escola, competência e programa; o modal de envio já tinha esse contexto e deve mantê-lo.
3. UX-03: a descrição provisória identifica o registro na lista desktop, com o estado provisório abaixo.
4. UX-05: Prontuário apresenta as Pendências ativas da escola; Pendências operacionais declara seu escopo transversal e histórico, sem unificar métricas deliberadamente distintas.
5. UX-06: reanálise destaca a despesa/documento exato e a tentativa atual antes de pedir resultado.
6. D-01: este arquivo e o handoff refletem a baseline real e os PRs ativos.
7. E2E desktop, inspeção visual e checks afetados passam no SHA final. Registrar impedimentos como pendentes; não interpretar build como homologação visual.

## Rota de leitura

1. `AGENTS.md`;
2. `docs/reference/SYSTEM_CANONICAL_MODEL.md`;
3. `docs/reference/PRODUCT_SURFACE_CATALOG.md`;
4. este arquivo;
5. `docs/handoff/2026-09-25-desktop-expense-journey.md`;
6. `docs/reference/ENGINEERING_METHOD.md` e `FRONTEND_USER_VALIDATION_GATE.md`;
7. `docs/reference/STATUS_DOCUMENTOS.md` e matriz funcional para as operações afetadas.

A modernização de performance/sincronização foi encerrada em 21/09. Suas medições, PRs e limites históricos permanecem em `docs/handoff/2026-09-19-performance-sync-modernization.md` e `docs/decisions/ADR-054-sincronizacao-operacional-realtime.md`; esse handoff anterior não é mais a frente corrente.
