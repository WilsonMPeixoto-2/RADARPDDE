# Matriz de validade documental

**Classe documental:** Canônico  
**Atualizado em:** 13 de setembro de 2026

## 1. Finalidade e precedência

Este arquivo define quais documentos orientam o presente. Em conflito, aplicar:

1. código do SHA efetivamente analisado;
2. Supabase/Auth/RLS/RPCs e dados efetivos;
3. artefato Vercel publicado;
4. decisões/ADRs vigentes;
5. testes atuais do contrato;
6. documentos canônicos;
7. auditorias, handoffs, planos e memória histórica.

PR aberto, Preview ou documento antigo não altera Production.

## 2. Rota canônica vigente

| Arquivo | Classe | Uso |
|---|---|---|
| `AGENTS.md` | Canônico | roteador obrigatório |
| `docs/reference/SYSTEM_CANONICAL_MODEL.md` | Canônico | autoridades, fluxos e invariantes |
| `docs/reference/PRODUCT_SURFACE_CATALOG.md` | Referência vigente | superfícies e jornadas |
| `docs/CURRENT_STAGE.md` | Canônico | estado ao vivo e prioridade |
| `docs/handoff/2026-09-13-pr301-production-release.md` | Handoff corrente | fechamento pós-PR301 e Production |
| `docs/reference/ENGINEERING_METHOD.md` | Canônico | método de engenharia |
| `docs/reference/FRONTEND_USER_VALIDATION_GATE.md` | Canônico | prova de interface real |
| `docs/reference/TEST_GOVERNANCE.md` | Canônico | interpretação de testes |
| `docs/reference/functional-contract-matrix.json` e módulos | Contrato executável | cobertura funcional |
| `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md` | Gerado | visão humana da matriz |
| `docs/DECISION_LOG.md` e `docs/decisions/*.md` | Decisão vigente | regras especializadas |

## 3. PR #300 e PR #301

PR #300 está integrado e encerrou a correção arquitetural Supabase.

PR #301 também está **integrado**. Não deve mais ser tratado como Draft/trabalho em andamento.

Estado integrado:

- merge PR #301: `39cd984206b33c7d2a6d7084e23597f964235c9a`;
- candidato funcional certificado: `452d97267348957f7155fc77bb139a4adafd766b`;
- Production publicada sobre commit documental `de336d20f514818c42a3ad403720c6b606065868`, descendente direto do merge e sem mudança de runtime;
- deployment certificado: `dpl_DKGa7PqP6KqiDrrWeevReEhyrKLS`, `READY`.

## 4. Handoffs

Handoff corrente:

`docs/handoff/2026-09-13-pr301-production-release.md`

Classificação dos predecessores:

- `docs/handoff/2026-09-13-uat-operacional-certificacao-452d972.md` — **Histórico executado / evidência de certificação pré-merge**;
- `docs/handoff/2026-09-13-uat-operacional-checkpoint-4a7a41dc.md` — **Histórico executado / checkpoint intermediário**;
- `docs/handoff/2026-09-13-relatorio-tecnico-consolidado-pos-pr300-uat.md` — **Histórico executado / reconstrução detalhada da frente**.

Nenhum deles redefine o modelo canônico ou ADRs.

## 5. Auditorias

`docs/audits/UAT_OPERACIONAL_POS_RELEASE_2026-09-13.md` é evidência incremental da homologação e do fechamento em Production.

`docs/audits/SUPABASE_ARCHITECTURE_FINAL_2026-09-13.md` é evidência pré-merge do PR #300.

`docs/audits/ASTRA_AUDITORIA_RADAR_2026.md` é diário investigativo; achados intermediários podem ter sido corrigidos depois.

## 6. Cobertura `partial`

A classificação `partial` na matriz significa dívida de evidência específica, não defeito conhecido nem bloqueio automático.

A UAT do PR #301 fortaleceu abertura e ciclo fiscal de Pendência, novo envio/reanálise, contato, cancelamento/reabertura, consumo, serviço/Assessoria, `a_identificar`, Boleto Internet e persistência/reload.

Não promover artificialmente operações que ainda exigem autoria explícita, idempotência, negativas completas por perfil, reversão controlada ou observação recorrente em Production.

## 7. Production e smoke

Production pós-PR301:

- Vercel `READY`;
- domínio oficial HTTP 200;
- build `supabase-production` com 1020/1020 testes;
- logs do novo deployment sem `error`/`fatal` no intervalo pós-publicação;
- TinyFish confirmou tela de login e ausência de bloqueio público;
- TinyFish não autenticou por ausência de sessão/credencial segura, portanto não serve como prova pós-deploy de todos os perfis;
- Work/Astra havia comprovado login real e acesso ao Prontuário da Ary Barroso antes deste deploy.

Não confundir ausência de credencial técnica com falha do produto.

## 8. Contrato de persistência

```text
Supabase = fonte canônica persistente
memória/cache = projeção descartável permitida
localStorage != banco operacional paralelo
```

Convergência esperada:

```text
remoto persistido = projeção local = UI = estado após reload
```

## 9. Documentos históricos

Planos, audits, handoffs e backlogs não apontados por `CURRENT_STAGE.md` não formam fila automática. `PROJECT_CONTEXT.md` continua útil para contexto funcional, mas SHAs, PRs, deployments e próximos passos temporais cedem ao `CURRENT_STAGE.md`.

## 10. Manutenção

Ao mudar baseline, Production ou frente ativa:

- atualizar `CURRENT_STAGE.md`;
- atualizar este arquivo;
- apontar um único handoff corrente;
- preservar handoffs/auditorias antigos como histórico;
- não reescrever evidência antiga para parecer atual.
