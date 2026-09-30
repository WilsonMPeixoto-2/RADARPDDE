# Matriz de validade documental

**Classe documental:** Canônico  
**Atualizado em:** 30 de setembro de 2026

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
| docs/CURRENT_STAGE.md | Canônico | estado funcional e prioridade; head/deployment exatos devem ser revalidados ao vivo quando relevantes |
| docs/handoff/2026-09-30-pos-publicacao-pr397-retomada.md | **Handoff corrente** | publicação concluída do #397, provas por SHA, limites e continuidade em Preview |
| docs/handoff/2026-09-30-pr397-independencia-despesas-bonificacao.md | Histórico concluído do candidato | checkpoints anteriores à publicação; bloqueios e instruções pré-merge foram superados pelo encerramento |
| docs/evidence/2026-09-30-pr397-production-release/README.md e JSONs | Evidência concluída da publicação | merge, SQL aplicado, deployment, smoke sem escrita e backup verificado; não representam novos testes em Production |
| docs/handoff/2026-09-28-prod-ux-08-drawer-clipping.md | Pendência separada de retomada | investigação visual isolada da composição do drawer global, com gate outside-in |
| docs/decisions/ADR-055-independencia-despesas-bonificacao.md | Decisão vigente implementada | propriedade de campos e capacidades de despesas independentes da consolidação |
| docs/handoff/2026-09-28-prod-func-09-date-business-investigation.md | Histórico concluído | PR #392 integrado; data 27/09 confirmada em Production sem nova escrita |
| docs/handoff/2026-09-27-post-abc-expense-baseline-audit.md | Histórico concluído | baseline pós-A+B+C homologada; origem dos achados PROD-FUNC-09 e PROD-UX-08 |
| docs/evidence/2026-09-27-pr378-tooling/DESIGN_TOOLING.md | Avaliação técnica datada / sucessor obrigatório após fila corretiva | leitura obrigatória antes da próxima frente ampla de evolução visual; ferramentas e versões devem ser revalidadas antes de adoção |
| docs/handoff/2026-09-26-tooling-modernization-a-b.md | Histórico concluído A/B | integrado e publicado pelo PR #378; não é handoff corrente |
| docs/handoff/2026-09-25-desktop-expense-journey.md | Handoff histórico concluído | checkpoints preservados e adendo de encerramento |
| docs/handoff/2026-09-19-performance-sync-modernization.md | Handoff histórico concluído | modernização de performance/sincronização encerrada em 21/09 |
| docs/decisions/ADR-054-sincronizacao-operacional-realtime.md | Decisão vigente | contrato de sincronização entre sessões |
| docs/reference/ENGINEERING_METHOD.md | Canônico | método de engenharia |
| docs/reference/FRONTEND_USER_VALIDATION_GATE.md | Canônico | prova de interface real |
| docs/reference/TEST_GOVERNANCE.md | Canônico | interpretação de testes |
| docs/reference/functional-contract-matrix.json e módulos | Contrato executável | cobertura funcional |
| docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md | Gerado | visão humana da matriz |
| docs/DECISION_LOG.md e docs/decisions/*.md | Decisão vigente | regras especializadas |

## 3. Frente corrente e baseline operacional

A/B foram integradas e publicadas no #378; C1 foi concluída no #384; C2 no #385; C3 no #386. **A + B + C estão encerradas.**

A baseline funcional que comprovou o encerramento da C3 é:

- merge funcional `e6b692a97dd5148877c788da11e0c8ae4c8fcd19`;
- Production de encerramento `dpl_vp8YKMA9pGDMZD7RQRjQDM8qkYC5`, `READY`;
- manifesto no mesmo SHA e em `supabase-production`;
- smoke com 50 assets válidos e bloqueio anônimo `blocked-401`.

Commits posteriores exclusivamente documentais não reabrem uma fase encerrada nem representam, por si, mudança funcional do RADAR. Como a `main` pode avançar por manutenção documental e a Vercel pode publicar esses commits, o head e o deployment exatos devem ser consultados ao vivo quando forem necessários para uma nova entrega.

A **Fase D ainda não foi iniciada e está deliberadamente adiada** enquanto a frente funcional/visual principal de Despesa a identificar/Pendências é fechada pelos achados atuais.

A baseline principal dessa jornada foi homologada. `PROD-FUNC-09` foi encerrado pelo PR #392 e confirmado em Production no merge `8284a02faf3d9381ad42e66b6d93677d396e8515`; a data civil e o instante técnico ficaram coerentes na tentativa original, sem escrita. O #397 foi integrado no merge `a5e200e5c3d7955cea0a6122bde1904469771ac3` e publicado com SQL compatível, preservando a leitura contextual do #396. A evidência de publicação está em `docs/evidence/2026-09-30-pr397-production-release/`; a retomada corrente está em `docs/handoff/2026-09-30-pos-publicacao-pr397-retomada.md`. A CI de 45 checks e os 20 ciclos reais descartáveis pertencem ao candidato `0e149e1...`; o smoke do novo deployment em Production foi observacional, sem CRUD. `PROD-UX-08` permanece separado e não foi homologado pelo #397. NAV-01/UX-04 são a próxima rodada solicitada em Preview, ainda não executada nesta entrega.

O servidor canônico e suas correções não alteraram schema, migrations, RPCs, RLS, serviços de domínio, layout ou persistência canônica.

**Sucessão prevista:** depois de encerrar `PROD-FUNC-09`, `PROD-UX-08` e os refinamentos imediatos que permanecerem válidos, a próxima decisão de produto deve recuperar `docs/evidence/2026-09-27-pr378-tooling/DESIGN_TOOLING.md` antes de abrir uma frente ampla de layout/design. Essa obrigação preserva o debate sobre Figma, design system, tokens, componentização, iconografia, tipografia, galeria de estados e tooling visual sem transformar a avaliação datada em adoção automática.

## 4. Handoff corrente e histórico

Handoff corrente:

- `docs/handoff/2026-09-30-pos-publicacao-pr397-retomada.md` — entrega publicada, mapa de evidências reutilizáveis, limites do smoke e próxima rodada de Preview.

Pendência separada de retomada: `docs/handoff/2026-09-28-prod-ux-08-drawer-clipping.md` — diagnóstico visual dirigido do clipping desktop. Não executar nem declarar encerrada dentro do #397.

Handoffs históricos concluídos:

- `docs/handoff/2026-09-30-pr397-independencia-despesas-bonificacao.md` — preserva a investigação e os checkpoints do candidato; a consolidação posterior encerrou dependências, publicação e backup;
- `docs/handoff/2026-09-28-prod-func-09-date-business-investigation.md` — formatter de data civil corrigido e confirmado em Production pelo PR #392;
- `docs/handoff/2026-09-27-post-abc-expense-baseline-audit.md` — baseline pós-A+B+C homologada, preservada como contexto e evidência;
- `docs/handoff/2026-09-26-tooling-modernization-a-b.md`;
- `docs/handoff/2026-09-25-desktop-expense-journey.md`;
- demais handoffs anteriores. As antigas pendências descritas neles não formam fila atual.

`docs/evidence/2026-09-27-phase-c3-codeql.md` registra a reprodução RED → GREEN e a correção dos achados da C3. É evidência técnica histórica da entrega; o fechamento remoto, merge e publicação estão registrados no PR #386 e consolidados em `CURRENT_STAGE.md`.

## 5. Handoffs anteriores

Passam a ser classificados como históricos executados, entre outros:

- docs/handoff/2026-09-14-pr306-final-maintenance.md;
- docs/handoff/2026-09-13-pr301-production-release.md;
- docs/handoff/2026-09-13-uat-operacional-certificacao-452d972.md;
- docs/handoff/2026-09-13-uat-operacional-checkpoint-4a7a41dc.md;
- docs/handoff/2026-09-13-relatorio-tecnico-consolidado-pos-pr300-uat.md.

Eles preservam rastreabilidade, mas não formam fila automática de execução.

## 6. Decisão vigente de sincronização

A ADR-054 permanece referência vigente para sincronização operacional:

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

Planos, audits, handoffs e backlogs não apontados por `CURRENT_STAGE.md` não formam fila automática.

`PROJECT_CONTEXT.md` continua útil para contexto funcional, mas SHAs, PRs, deployments, migrations e próximos passos temporais cedem ao estado efetivo e a `CURRENT_STAGE.md`.

## 9. Manutenção

Ao mudar baseline funcional ou frente ativa:

- atualizar `CURRENT_STAGE.md`;
- atualizar este arquivo;
- atualizar `docs/README.md` quando a rota de retomada ou o estado de fase mudar;
- apontar no máximo um handoff corrente;
- registrar ADR quando a mudança for arquitetural e durável;
- preservar handoffs/auditorias antigos como histórico;
- não reescrever evidência antiga para parecer atual;
- distinguir baseline funcional de head/deployment técnico ao vivo;
- não criar ciclos de commits apenas para registrar no próprio repositório o SHA/deployment gerado por uma alteração exclusivamente documental.
