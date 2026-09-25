# Matriz de validade documental

**Classe documental:** Canônico
**Atualizado em:** 21 de setembro de 2026

## 1. Finalidade e precedência

Este arquivo define quais documentos orientam o presente. Em conflito, aplicar:

1. código do SHA efetivamente analisado;
2. Supabase/Auth/RLS/RPCs/Realtime e dados efetivos;
3. artefato Vercel publicado;
4. decisões/ADRs vigentes;
5. testes atuais do contrato;
6. documentos canônicos;
7. auditorias, handoffs, planos e memória histórica.

PR aberto, Preview ou documento antigo não altera Production.

## 2. Rota canônica vigente

| Arquivo | Classe | Uso |
|---|---|---|
| AGENTS.md | Canônico | roteador obrigatório |
| docs/reference/SYSTEM_CANONICAL_MODEL.md | Canônico | autoridades, fluxos e invariantes |
| docs/reference/PRODUCT_SURFACE_CATALOG.md | Referência vigente | superfícies e jornadas |
| docs/CURRENT_STAGE.md | Canônico | estado ao vivo e prioridade |
| docs/handoff/2026-09-25-desktop-expense-journey.md | Handoff corrente | checkpoints da jornada desktop, PRs e verificações |
| docs/handoff/2026-09-19-performance-sync-modernization.md | Handoff histórico concluído | modernização de performance/sincronização encerrada em 21/09 |
| docs/decisions/ADR-054-sincronizacao-operacional-realtime.md | Decisão vigente | contrato de sincronização entre sessões |
| docs/reference/ENGINEERING_METHOD.md | Canônico | método de engenharia |
| docs/reference/FRONTEND_USER_VALIDATION_GATE.md | Canônico | prova de interface real |
| docs/reference/TEST_GOVERNANCE.md | Canônico | interpretação de testes |
| docs/reference/functional-contract-matrix.json e módulos | Contrato executável | cobertura funcional |
| docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md | Gerado | visão humana da matriz |
| docs/DECISION_LOG.md e docs/decisions/*.md | Decisão vigente | regras especializadas |

## 3. Baseline de Production

Os registros abaixo são históricos da janela de 21/09, não a descrição da `main` nem uma confirmação de Production em 25/09. A `main` observada está em `bb724643` (#374), com o PR #375 aberto e em draft; consulte `docs/CURRENT_STAGE.md`.

- baseline funcional/runtime conferido em 21/09 (#344): 75520d43a5ca9bc2607318cc6a70ba2a7494ca92;
- Vercel correspondente ao #344: dpl_FHt2mSxrzWbq491y497RDCuf7LsN, READY;
- Supabase: ACTIVE_HEALTHY;
- migrations remotas: 54;
- migration mais recente: 20260920013656_realtime_operational_invalidation;
- #344: instrumentação de jornadas integrada sem alteração de runtime;
- monitor, leitura autenticada e integridade agregada tiveram runs SUCCESS naquela janela; os vínculos estão no handoff histórico de performance/sincronização.

Esse baseline substitui como estado corrente os handoffs centrados em PR #301/#305/#306. Esses documentos continuam válidos como histórico do momento em que foram produzidos.

## 4. Handoff corrente

Handoff corrente:

docs/handoff/2026-09-25-desktop-expense-journey.md

Ele consolida achados da jornada desktop, estado do PR #375, commits da continuação e critérios de verificação.

## 5. Handoffs anteriores

Passam a ser classificados como históricos executados, entre outros:

- docs/handoff/2026-09-14-pr306-final-maintenance.md;
- docs/handoff/2026-09-13-pr301-production-release.md;
- docs/handoff/2026-09-13-uat-operacional-certificacao-452d972.md;
- docs/handoff/2026-09-13-uat-operacional-checkpoint-4a7a41dc.md;
- docs/handoff/2026-09-13-relatorio-tecnico-consolidado-pos-pr300-uat.md.

Eles preservam rastreabilidade, mas não formam fila automática de execução.

## 6. Decisão nova de sincronização

A ADR-054 passa a ser referência vigente para sincronização operacional:

- Broadcast privado apenas invalida;
- Supabase continua sendo a fonte canônica;
- RLS continua decidindo o que cada sessão pode ler;
- payload Realtime não transporta dados de negócio;
- edição em andamento não é atropelada;
- reconexão provoca releitura de recuperação;
- invalidação que chega durante leitura em voo exige nova releitura;
- falha transitória da releitura preserva pendência e recebe uma retry controlada;
- escrita que aborta leitura Realtime não elimina a necessidade de convergência;
- término da escrita drena refresh pendente quando necessário;
- Postgres Changes não é a estratégia principal desta frente.

## 7. Contrato atual de persistência e convergência

    Supabase = fonte canônica persistente
    memória/cache = projeção descartável permitida
    localStorage != banco operacional paralelo
    Broadcast = sinal de invalidação, não estado

Convergência esperada:

    remoto persistido = projeção local = UI = estado após reload

Entre sessões:

    sessão A grava
    → sessão B recebe invalidação
    → sessão B relê pela própria RLS
    → sessão B converge sem F5

Interleavings adicionais protegidos:

    Broadcast durante leitura em voo
    → nova releitura obrigatória

    releitura falha
    → pendência preservada + uma retry controlada

    escrita aborta leitura Realtime
    → stale/aborted preserva pendência
    → retry e drenagem pós-write restauram convergência

## 8. Documentos históricos

Planos, audits, handoffs e backlogs não apontados por CURRENT_STAGE.md não formam fila automática.

PROJECT_CONTEXT.md continua útil para contexto funcional, mas SHAs, PRs, deployments, migrations e próximos passos temporais cedem a CURRENT_STAGE.md.

## 9. Manutenção

Ao mudar baseline, Production ou frente ativa:

- atualizar CURRENT_STAGE.md;
- atualizar este arquivo;
- apontar um único handoff corrente;
- registrar ADR quando a mudança for arquitetural e durável;
- preservar handoffs/auditorias antigos como histórico;
- não reescrever evidência antiga para parecer atual;
- distinguir explicitamente branch/candidato de Production.
