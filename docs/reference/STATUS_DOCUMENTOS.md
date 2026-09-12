# Matriz de validade documental

**Classe documental:** Canônico  
**Atualizado em:** 12 de setembro de 2026

## 1. Finalidade

Este documento define quais arquivos podem orientar o presente e quais servem apenas como contexto histórico.

A reconstrução source-first de 07/09 consolidou o conhecimento funcional em [`SYSTEM_CANONICAL_MODEL.md`](SYSTEM_CANONICAL_MODEL.md). A revisão de 08/09 tornou explícita também a leitura humana do produto em [`PRODUCT_SURFACE_CATALOG.md`](PRODUCT_SURFACE_CATALOG.md): finalidade das telas, jornada, hierarquia visual e diferenças legítimas entre projeções. O problema identificado não era falta de documentos, mas fragmentação e leitura fora da rota já existente.

## 2. Precedência

Para determinar comportamento atual:

1. código do SHA analisado;
2. Supabase/Auth/RLS/RPCs/Edge Functions e dados efetivos;
3. artefato Vercel correspondente;
4. decisões funcionais vigentes/ADRs supervenientes;
5. testes atuais que representam o contrato vigente;
6. documentos canônicos e referências vigentes da rota obrigatória;
7. auditorias, evidências, planos, handoffs e memória de conversa históricos.

PR aberto, Preview, plano histórico ou documento antigo não altera a baseline da `main`/Production.

## 3. Classes

| Classe | Significado |
|---|---|
| **Canônico** | controla leitura, estado, regra geral ou validade vigente |
| **Contrato executável** | fonte versionada validada automaticamente |
| **Gerado** | visão derivada; não editar manualmente |
| **Referência vigente** | descreve contrato técnico/funcional durável |
| **Runbook vigente** | procedimento operacional atual |
| **Decisão vigente** | regra aprovada até substituição/revogação expressa |
| **Evidência** | comprova execução/achado em data, SHA e ambiente específicos |
| **Trabalho em andamento** | branch/PR não integrado; não redefine baseline |
| **Histórico executado** | plano/handoff/auditoria preservado após sua etapa |
| **Superado** | não orientar o presente salvo investigação histórica |

## 4. Rota canônica obrigatória

| Arquivo | Classe | Uso |
|---|---|---|
| `AGENTS.md` | Canônico | roteador obrigatório e regras de trabalho |
| `docs/reference/SYSTEM_CANONICAL_MODEL.md` | Canônico | modelo integrado do produto, autoridades, fluxos, estados, diferenças deliberadas e invariantes |
| `docs/reference/PRODUCT_SURFACE_CATALOG.md` | Referência vigente / leitura obrigatória | modelo mental do usuário, finalidade de cada superfície, hierarquia visual, encontrabilidade e papel na jornada |
| `docs/CURRENT_STAGE.md` | Canônico | estado mutável, prioridade e PRs correntes |
| `docs/reference/ENGINEERING_METHOD.md` | Canônico | método permanente de engenharia |
| `docs/reference/FRONTEND_USER_VALIDATION_GATE.md` | Canônico | prova obrigatória pela interface real |
| `docs/reference/STATUS_DOCUMENTOS.md` | Canônico | esta matriz de validade |
| `docs/reference/TEST_GOVERNANCE.md` | Canônico | interpretação de falhas e testes |
| `docs/PROJECT_CONTEXT.md` | Referência vigente | contexto funcional/arquitetural detalhado; trechos temporais antigos cedem a CURRENT_STAGE/modelo canônico |
| `docs/DECISION_LOG.md` | Referência vigente | decisões duradouras |
| `docs/decisions/*.md` | Decisão vigente conforme status | ADR específica prevalece no ponto especializado |
| `docs/reference/functional-contract-matrix.json` e módulos | Contrato executável | operações/cobertura; `sourceCommit` é evidência da geração |
| `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md` | Gerado | visão da matriz JSON |
| `docs/reference/SUPABASE_DATA_DICTIONARY.md` | Referência vigente | resumo do schema; schema remoto/tipos/migrations prevalecem |
| `docs/reference/SUPABASE_PERMISSIONS_MATRIX.md` | Referência vigente | autorização por perfil/camada |

A inclusão do catálogo de superfícies na leitura obrigatória **não cria nova fonte concorrente**: o modelo canônico responde “o que é o sistema e quais regras o governam”; o catálogo responde “como cada parte aparece e funciona para o usuário”.

## 5. Documentos históricos que não controlam a fila

- `docs/superpowers/plans/*` — histórico de planejamento;
- `docs/audits/*` — evidência da auditoria e SHA correspondentes;
- `docs/handoff/*` — checkpoints do seu momento;
- `docs/evidence/*` — prova localizada;
- `docs/history/*` — snapshots preservados;
- `docs/reference/PRODUCT_DECISIONS.md` — índice histórico substituído pelo `DECISION_LOG.md` e decisões posteriores;
- `docs/reference/POST_PR22_PRIORITIZED_BACKLOG.md` e roadmaps antigos — não controlam a fila atual.

Nenhum item desses deve ser interpretado como tarefa ainda aberta sem confronto com `CURRENT_STAGE.md`, modelo canônico e código atual.

Documentos de produto históricos, inclusive o Plano do Lote 2 e dossiês de julho, podem explicar a origem de uma decisão visual/funcional. Eles não prevalecem sobre decisões e código posteriores, mas devem ser lidos quando a frente depender da intenção aprovada que originou uma superfície.

## 6. R1–R9 — classificação vigente

`CURRENT_STAGE.md`, na seção de 12/09, define a frente vigente: certificação da arquitetura de consultas Supabase na branch isolada. O quadro abaixo registra a classificação de 07/09 e não é fila automática de execução; especialmente, R5 não deve ser retomada por este registro histórico.

A classificação histórica de 07/09 era:

- **R1:** concluída pelo PR #282;
- **R2A:** parcialmente absorvida; resiliência relevante já preservada;
- **R2B/R2C:** pausadas/candidatas no PR #284, sem autorização de integração no estado atual;
- **R3:** materialmente atendida, sem reabrir regra já coberta por hotfixes posteriores;
- **R4:** encerrada sem mudança funcional; a diferença entre antiguidade histórica de Pendências e tempo da ação corrente é deliberada;
- **R5:** então frente funcional ativa, referente à convergência da interface de NF após save/remove;
- **R6:** gate posterior de equivalência;
- **R7:** instrumentação parcialmente antecipada, sem autorização de otimização;
- **R8:** condicional e pausada;
- **R9:** fechamento posterior.

R1–R9 são identificadores históricos, não fila automática.

## 7. PR #284

O PR #284 é trabalho em andamento **Draft/PAUSADO**. Não redefine a `main` e não deve ser usado como fonte de regra funcional vigente.

Sua investigação/diagnóstico podem ser reaproveitados quando a frente for retomada conforme `CURRENT_STAGE.md` e com o gate de frontend real.

## 8. ADR-051

A ADR-051 continua vigente como adiamento deliberado do hardening estrutural de `registered_invoices`. Não classificar como resolvida nem antecipar a migration sem o gatilho definido ou nova decisão explícita.

## 9. Conflitos documentais reconciliados em 07–08/09

A reconstrução identificou e corrigiu no roteamento canônico:

- `STATUS_DOCUMENTOS.md` ainda classificava R1 e R4 como pendentes, em conflito com `CURRENT_STAGE.md`;
- `AGENTS.md` acumulava estados temporais de PRs e checkpoints, tornando o próprio roteador suscetível a envelhecimento;
- a rota de leitura de `README.md`/`docs/README.md` ainda dava destaque excessivo a auditorias históricas;
- documentação de ordem de extensões anterior ao PR #282 ainda descrevia performance como portadora de autoridade funcional, embora o código atual já a limite a tracing/diagnóstico;
- a leitura obrigatória ainda não exigia reconstruir explicitamente a finalidade humana da tela antes da análise técnica, embora contratos históricos do produto já tivessem estabelecido essa prudência.

A correção estrutural é separar papéis: modelo do produto, leitura das superfícies, estado mutável, método, validade e histórico não devem competir pelo mesmo tipo de autoridade.

## 10. Regra de manutenção obrigatória

Todo novo documento classificado como canônico deve, na mesma entrega:

1. ser incluído em `AGENTS.md` se introduzir leitura obrigatória;
2. atualizar `docs/README.md`;
3. atualizar este arquivo;
4. atualizar `SYSTEM_CANONICAL_MODEL.md` se mudar regra, fluxo, autoridade ou invariante;
5. atualizar `PRODUCT_SURFACE_CATALOG.md` se mudar finalidade, jornada, ação, encontrabilidade ou semântica visual de uma superfície;
6. atualizar `CURRENT_STAGE.md` se mudar estado/prioridade;
7. reclassificar a fonte anterior que deixou de orientar o presente.

Não criar documentação canônica solta.

## 11. Preservação histórica

Não reescrever auditoria, ADR, evidência ou handoff antigo para fazê-lo parecer atual. Quando o presente mudar:

- manter o histórico intacto;
- atualizar os documentos mutáveis/canônicos;
- registrar explicitamente a substituição ou refinamento;
- evitar que um agente futuro precise inferir sozinho qual documento venceu.
