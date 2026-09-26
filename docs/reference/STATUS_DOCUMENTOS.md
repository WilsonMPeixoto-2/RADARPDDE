# Matriz de validade documental

**Classe documental:** Canônico
**Atualizado em:** 26 de setembro de 2026

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
| docs/handoff/2026-09-25-desktop-expense-journey.md | Handoff histórico concluído | checkpoints preservados e adendo de encerramento |
| docs/handoff/2026-09-19-performance-sync-modernization.md | Handoff histórico concluído | modernização de performance/sincronização encerrada em 21/09 |
| docs/decisions/ADR-054-sincronizacao-operacional-realtime.md | Decisão vigente | contrato de sincronização entre sessões |
| docs/reference/ENGINEERING_METHOD.md | Canônico | método de engenharia |
| docs/reference/FRONTEND_USER_VALIDATION_GATE.md | Canônico | prova de interface real |
| docs/reference/TEST_GOVERNANCE.md | Canônico | interpretação de testes |
| docs/reference/functional-contract-matrix.json e módulos | Contrato executável | cobertura funcional |
| docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md | Gerado | visão humana da matriz |
| docs/DECISION_LOG.md e docs/decisions/*.md | Decisão vigente | regras especializadas |

## 3. Entrega e baseline operacional

A frente desktop/contexto escolar foi concluída tecnicamente em `2d21e752d8004e9c0343cca3978a84a46bf4609b`. O fechamento posterior é documental. O usuário autorizou a publicação em 26/09/2026 pelo PR #376, entrega única que contém #375; #375 está fechado sem merge e #377 é histórico técnico.

A base anterior à entrega é `bb7246438b8c6b72ef068b21bb40d492a7049af2`, deployment `dpl_BztNyEgnHjFxAKJvkPcQGeV6GGWm`. O resultado de publicação, SHA efetivo e deployment são registrados no PR #376 e manifesto público. Consultar `CURRENT_STAGE.md` e revalidar o ambiente; a aprovação pré-merge não substitui a confirmação do deployment.

A frente não altera schema, migrations, RPCs, RLS, serviços de domínio nem persistência canônica.

## 4. Handoff encerrado

Não há handoff corrente de implementação. `docs/handoff/2026-09-25-desktop-expense-journey.md` é histórico concluído, com adendo apontando o fechamento e preservando o checkpoint anterior. As antigas pendências nele descritas não formam fila atual.

A evidência `docs/evidence/2026-09-26-desktop-final-preview/README.md` preserva o momento de criação do Preview; a homologação posterior está no registro do #376 e em CURRENT_STAGE.md. O acesso direto ao Preview permaneceu limitado por SSO; a inspeção visual registrada é do Chromium do CI, do mesmo runtime.

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
