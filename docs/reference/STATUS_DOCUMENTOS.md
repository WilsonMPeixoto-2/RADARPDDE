# Matriz de validade documental

**Classe documental:** Canônico  
**Atualizado em:** 13 de setembro de 2026

## 1. Finalidade

Este documento define quais arquivos orientam o presente, quais servem como contexto e como resolver conflitos entre documentação, código e ambientes.

A documentação separa deliberadamente:

- modelo durável do produto;
- leitura humana das superfícies;
- estado mutável do projeto;
- handoff corrente da frente ativa;
- método/gates permanentes;
- decisões especializadas;
- evidência e histórico.

O objetivo é impedir que um chat ou ferramenta futura reconstrua o RADAR a partir de um PR antigo, auditoria intermediária ou memória isolada.

## 2. Precedência

Para determinar comportamento atual:

1. código do SHA analisado;
2. Supabase/Auth/RLS/RPCs/Edge Functions e dados efetivos;
3. artefato Vercel correspondente;
4. decisões funcionais vigentes/ADRs supervenientes;
5. testes atuais que representam o contrato vigente;
6. documentos canônicos e referências vigentes;
7. auditorias, evidências, planos, handoffs e memória histórica.

PR aberto, Preview, plano histórico ou documento antigo não altera a baseline da `main`/Production.

O handoff corrente apontado por `CURRENT_STAGE.md` possui precedência apenas para reconstruir o detalhe temporal da frente ativa. Ele não redefine regra funcional durável nem prevalece sobre código/Supabase/Vercel revalidados.

## 3. Classes

| Classe | Significado |
|---|---|
| **Canônico** | controla leitura, estado, regra geral ou validade vigente |
| **Contrato executável** | fonte versionada validada automaticamente |
| **Gerado** | visão derivada; não editar manualmente |
| **Referência vigente** | descreve contrato técnico/funcional durável |
| **Runbook vigente** | procedimento operacional atual |
| **Decisão vigente** | regra aprovada até substituição/revogação expressa |
| **Handoff corrente** | contexto detalhado temporário da frente ativa, apontado por `CURRENT_STAGE.md` |
| **Evidência** | comprova execução/achado em data, SHA e ambiente específicos |
| **Trabalho em andamento** | branch/PR não integrado; não redefine Production |
| **Histórico executado** | plano/handoff/auditoria preservado após sua etapa |
| **Superado** | não orientar o presente salvo investigação histórica |

Só pode existir um handoff corrente por frente global no roteamento principal.

## 4. Rota canônica obrigatória

| Arquivo | Classe | Uso |
|---|---|---|
| `AGENTS.md` | Canônico | roteador obrigatório e regras de trabalho |
| `docs/reference/SYSTEM_CANONICAL_MODEL.md` | Canônico | autoridades, fluxos, estados e invariantes |
| `docs/reference/PRODUCT_SURFACE_CATALOG.md` | Referência vigente | modelo mental do usuário e superfícies |
| `docs/CURRENT_STAGE.md` | Canônico | Production, estado mutável, prioridade e PRs correntes |
| handoff apontado por `CURRENT_STAGE.md` | Handoff corrente | detalhe temporal da frente ativa |
| `docs/reference/ENGINEERING_METHOD.md` | Canônico | método permanente de engenharia |
| `docs/reference/FRONTEND_USER_VALIDATION_GATE.md` | Canônico | prova obrigatória pela interface real |
| `docs/reference/STATUS_DOCUMENTOS.md` | Canônico | esta matriz de validade |
| `docs/reference/TEST_GOVERNANCE.md` | Canônico | interpretação de falhas e testes |
| `docs/PROJECT_CONTEXT.md` | Referência detalhada com trechos temporais históricos | contexto funcional; SHAs/PRs/deployment cedem ao CURRENT_STAGE |
| `docs/DECISION_LOG.md` | Referência vigente | decisões duradouras |
| `docs/decisions/*.md` | Decisão vigente conforme status | ADR especializada |
| `docs/reference/functional-contract-matrix.json` e módulos | Contrato executável | operações/cobertura |
| `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md` | Gerado | visão da matriz JSON |
| `docs/reference/SUPABASE_DATA_DICTIONARY.md` | Referência vigente | resumo do schema |
| `docs/reference/SUPABASE_PERMISSIONS_MATRIX.md` | Referência vigente | autorização por perfil/camada |

## 5. Handoff corrente em 13/09/2026

Enquanto a frente do PR #301 estiver ativa, o handoff corrente é:

`docs/handoff/2026-09-13-uat-operacional-certificacao-452d972.md`

Ele deve ser lido imediatamente após `CURRENT_STAGE.md`.

Para reconstrução completa do ciclo, usar como predecessor:

`docs/handoff/2026-09-13-relatorio-tecnico-consolidado-pos-pr300-uat.md`

O antigo `docs/handoff/2026-09-13-uat-operacional-checkpoint-4a7a41dc.md` permanece como **Histórico executado / evidência intermediária**. Ele não é mais a instrução temporal corrente.

Nenhum handoff substitui `SYSTEM_CANONICAL_MODEL.md`, `PRODUCT_SURFACE_CATALOG.md`, ADRs ou código vigente.

## 6. Estado documental da frente atual

### PR #300

O PR #300 foi integrado. O baseline funcional de aplicação é `1a149174ed4a14d2fc9f92aff57d1957e8538e89`. Merges documentais posteriores podem deixar a `main` numericamente à frente sem mudar runtime.

`docs/audits/SUPABASE_ARCHITECTURE_FINAL_2026-09-13.md` é evidência/histórico do candidato pré-merge.

`docs/audits/ASTRA_AUDITORIA_RADAR_2026.md` é evidência investigativa incremental; checkpoints internos podem descrever defeitos posteriormente corrigidos.

### PR #301

O PR #301 permanece **Trabalho em andamento / Draft** até integração. A certificação funcional corrente refere-se ao candidato `452d97267348957f7155fc77bb139a4adafd766b`; commits documentais posteriores não alteram essa conclusão funcional por si sós.

Arquivos operacionais da frente:

- `docs/superpowers/plans/2026-09-13-homologacao-operacional-observabilidade.md` — plano de execução;
- `docs/audits/UAT_OPERACIONAL_POS_RELEASE_2026-09-13.md` — diário de evidências da UAT;
- `docs/handoff/2026-09-13-relatorio-tecnico-consolidado-pos-pr300-uat.md` — predecessor detalhado;
- `docs/handoff/2026-09-13-uat-operacional-certificacao-452d972.md` — handoff corrente.

No candidato funcional `452d972...`, passaram:

- Ciclos funcionais reais com Supabase;
- E2E Playwright completo;
- Supabase readiness;
- confiabilidade funcional com Supabase real;
- perfis/viewports;
- retificação auditável;
- validação geral;
- CodeQL;
- saúde de dependências.

A homologação integral pré-production passou migrations, Supabase/Auth/RLS/pgTAP, dependências/segurança, backup/restauração, prontidão, Playwright e Excel. Seu vermelho final decorre apenas do job Lighthouse desktop. Por decisão operacional desta frente, performance não bloqueia a reabertura funcional.

A PR #301 também contém duas alterações funcionais reais que não devem ser tratadas como “só testes”:

1. resolução de assets do logo a partir da raiz em `src/integration/mobile-navigation.js`;
2. preservação explícita de `p_expected_asset_version: null` em novo envio de Pendência fiscal sem bem vinculado, evitando quebra da assinatura RPC.

## 7. Cobertura funcional e operações `partial`

A classificação `partial` da matriz significa que uma prova adicional específica ainda é desejável/necessária para aquele contrato; não significa bug conhecido ou bloqueio automático.

A UAT do PR #301 adicionou evidência forte para:

- abertura fiscal/Assessoria;
- novo envio e reanálise;
- cancelamento/reabertura de Pendência;
- registro de contato;
- consumo;
- serviço/Assessoria individualizada;
- `a_identificar`;
- Boleto Internet;
- persistência/reload.

Não reclassificar automaticamente operações que ainda exigem autoria explícita, idempotência, negativas completas por perfil, reversão controlada ou monitor recorrente de Production.

Ações administrativas raras de Configurações SME, programas e redistribuição de carteira continuam protegidas por E2E/serviços/RLS, mas algumas permanecem `partial` por falta do ensaio controlado específico descrito na própria matriz. Isso é dívida de evidência, não defeito funcional conhecido.

## 8. Production e smoke autenticado

O código de `tests/e2e/production-authenticated-read.spec.js` está preparado para cinco perfis e verifica login, leituras autorizadas, Dashboard, busca, Carteira, Prontuário, Pendências, reload, logout e ausência de mutações.

Esse smoke depende de contas técnicas protegidas em Production. Run verde com a etapa autenticada ignorada por ausência dessas contas **não** prova todos os perfis.

Nesta frente, Work/Astra comprovou pelo menos um login real no site oficial e acesso ao Prontuário da Ary Barroso. Houve mensagem transitória de falha de escopos antes da recuperação da sessão; classificar como ocorrência transitória, não como bloqueio permanente sem reprodução.

## 9. Documentos históricos que não controlam a fila

- `docs/superpowers/plans/*` — históricos, salvo plano explicitamente associado à frente ativa;
- `docs/audits/*` — evidência de auditoria e SHA correspondente;
- `docs/handoff/*` — checkpoints do seu momento, exceto o único handoff corrente apontado por `CURRENT_STAGE.md`;
- `docs/evidence/*` — prova localizada;
- `docs/history/*` — snapshots preservados;
- roadmaps/backlogs antigos — não controlam a fila atual.

Nenhum item histórico deve ser interpretado como tarefa ainda aberta sem confronto com `CURRENT_STAGE.md`, modelo canônico, código e ambiente atuais.

## 10. PROJECT_CONTEXT e trechos temporais

`docs/PROJECT_CONTEXT.md` contém contratos e contexto úteis, mas seus SHAs, estado de PR, contagens, deployment e “próximo passo” cedem a `CURRENT_STAGE.md` e ao handoff corrente.

## 11. Contrato de persistência/cache

```text
Supabase = fonte canônica persistente no modo remoto
memória/cache do navegador = projeção operacional descartável permitida
localStorage = não pode funcionar como segundo banco operacional em Production/Supabase
```

Convergência esperada:

```text
remoto persistido = projeção local = UI = estado após reload
```

É regressão quando o estado local mascara falha remota, sobrevive como verdade concorrente, força carregamento global crescente ou impede que reload recupere a autoridade Supabase.

## 12. Cadeia documental vigente

```text
AGENTS
→ modelo canônico
→ catálogo de superfícies
→ CURRENT_STAGE
→ handoff corrente
→ predecessor, se necessário
→ método/gates
→ matriz/ADRs/referências especializadas
→ históricos
```

## 13. Regra de manutenção obrigatória

Todo novo documento canônico deve atualizar, conforme aplicável, `AGENTS.md`, `docs/README.md`, este arquivo, `SYSTEM_CANONICAL_MODEL.md`, `PRODUCT_SURFACE_CATALOG.md` e `CURRENT_STAGE.md`.

Quando uma frente precisar de contexto temporário detalhado:

- preferir handoff/evidência datado;
- nomeá-lo em `CURRENT_STAGE.md` como único handoff corrente;
- não hardcodar seu nome em `AGENTS.md`;
- retirar/substituir o vínculo ao encerrar a frente;
- preservar arquivos anteriores sem reescrita retrospectiva.

## 14. Preservação histórica

Não reescrever auditoria, ADR, evidência ou handoff antigo para fazê-lo parecer atual. Quando o presente mudar, atualizar os documentos mutáveis/canônicos e registrar explicitamente a substituição.
