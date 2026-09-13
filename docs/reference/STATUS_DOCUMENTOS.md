# Matriz de validade documental

**Classe documental:** Canônico  
**Atualizado em:** 13 de setembro de 2026

## 1. Finalidade

Este documento define quais arquivos podem orientar o presente, quais servem como contexto e como resolver conflito entre documentação, código e ambientes.

A documentação atual separa deliberadamente:

- modelo durável do produto;
- leitura humana das superfícies;
- estado mutável do projeto;
- handoff corrente da frente ativa;
- método/gates permanentes;
- decisões especializadas;
- evidência e histórico.

O objetivo é impedir que um chat ou ferramenta futura reconstrua o estado do RADAR a partir de um PR antigo, auditoria intermediária ou memória isolada.

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

O **handoff corrente** apontado por `CURRENT_STAGE.md` possui precedência apenas para reconstruir o detalhe temporal da frente ativa. Ele não pode redefinir uma regra funcional durável que pertença ao modelo canônico/ADR, nem prevalece sobre código/Supabase/Vercel revalidados.

## 3. Classes

| Classe | Significado |
|---|---|
| **Canônico** | controla leitura, estado, regra geral ou validade vigente |
| **Contrato executável** | fonte versionada validada automaticamente |
| **Gerado** | visão derivada; não editar manualmente |
| **Referência vigente** | descreve contrato técnico/funcional durável |
| **Runbook vigente** | procedimento operacional atual |
| **Decisão vigente** | regra aprovada até substituição/revogação expressa |
| **Handoff corrente** | contexto detalhado temporário da frente ativa, explicitamente apontado por `CURRENT_STAGE.md` |
| **Evidência** | comprova execução/achado em data, SHA e ambiente específicos |
| **Trabalho em andamento** | branch/PR não integrado; não redefine baseline |
| **Histórico executado** | plano/handoff/auditoria preservado após sua etapa |
| **Superado** | não orientar o presente salvo investigação histórica |

Só pode existir **um handoff corrente por frente global** no roteamento principal. Quando `CURRENT_STAGE.md` retirar a referência, o arquivo volta automaticamente à classe histórica/evidência.

## 4. Rota canônica obrigatória

| Arquivo | Classe | Uso |
|---|---|---|
| `AGENTS.md` | Canônico | roteador obrigatório e regras de trabalho |
| `docs/reference/SYSTEM_CANONICAL_MODEL.md` | Canônico | modelo integrado do produto, autoridades, fluxos, estados, diferenças deliberadas e invariantes |
| `docs/reference/PRODUCT_SURFACE_CATALOG.md` | Referência vigente / leitura obrigatória | modelo mental do usuário, finalidade de cada superfície, hierarquia visual, encontrabilidade e papel na jornada |
| `docs/CURRENT_STAGE.md` | Canônico | Production, estado mutável, prioridade e PRs correntes |
| handoff apontado por `CURRENT_STAGE.md` | Handoff corrente | panorama técnico detalhado necessário para retomar a frente ativa |
| `docs/reference/ENGINEERING_METHOD.md` | Canônico | método permanente de engenharia |
| `docs/reference/FRONTEND_USER_VALIDATION_GATE.md` | Canônico | prova obrigatória pela interface real |
| `docs/reference/STATUS_DOCUMENTOS.md` | Canônico | esta matriz de validade |
| `docs/reference/TEST_GOVERNANCE.md` | Canônico | interpretação de falhas e testes |
| `docs/PROJECT_CONTEXT.md` | Referência detalhada com trechos temporais históricos | contexto funcional/arquitetural; toda afirmação de SHA/PR/fila/deployment cede a `CURRENT_STAGE.md` |
| `docs/DECISION_LOG.md` | Referência vigente | decisões duradouras |
| `docs/decisions/*.md` | Decisão vigente conforme status | ADR específica prevalece no ponto especializado |
| `docs/reference/functional-contract-matrix.json` e módulos | Contrato executável | operações/cobertura; `sourceCommit` é evidência da geração |
| `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md` | Gerado | visão da matriz JSON |
| `docs/reference/SUPABASE_DATA_DICTIONARY.md` | Referência vigente | resumo do schema; schema remoto/tipos/migrations prevalecem |
| `docs/reference/SUPABASE_PERMISSIONS_MATRIX.md` | Referência vigente | autorização por perfil/camada |

## 5. Handoff corrente em 13/09/2026

Enquanto a frente do PR #301 estiver ativa, o handoff corrente é:

`docs/handoff/2026-09-13-relatorio-tecnico-consolidado-pos-pr300-uat.md`

Ele deve ser lido imediatamente após `CURRENT_STAGE.md`.

Seu papel é registrar:

- fechamento e Production do PR #300;
- arquitetura Supabase contextual;
- contrato de cache/projeção local;
- baseline de capacidade;
- `pg_stat_statements` e observabilidade;
- Supabase Advisors;
- dependências;
- estado do PR #301;
- primeira execução do novo UAT;
- falha atual do teste e sua classificação;
- matriz de testes ainda pendentes.

Ele **não** substitui `SYSTEM_CANONICAL_MODEL.md`, `PRODUCT_SURFACE_CATALOG.md`, ADRs ou código vigente.

## 6. Estado documental da frente atual

### PR #300

O PR #300 foi integrado. `main`/Production no baseline registrado em `CURRENT_STAGE.md` está em `1a149174ed4a14d2fc9f92aff57d1957e8538e89`.

`docs/audits/SUPABASE_ARCHITECTURE_FINAL_2026-09-13.md` é **Evidência / histórico executado do candidato pré-merge**. Frases internas como “aguarda integração” pertencem ao momento em que o relatório foi produzido e não definem o presente.

`docs/audits/ASTRA_AUDITORIA_RADAR_2026.md` é **Evidência investigativa incremental**. Checkpoints intermediários podem descrever defeitos posteriormente corrigidos.

### PR #301

O PR #301 é **Trabalho em andamento / Draft**. Ele não redefine a baseline de Production.

Sua documentação operacional corrente é:

- `docs/superpowers/plans/2026-09-13-homologacao-operacional-observabilidade.md` — plano de execução, classe Trabalho em andamento;
- `docs/handoff/2026-09-13-relatorio-tecnico-consolidado-pos-pr300-uat.md` — Handoff corrente enquanto apontado por `CURRENT_STAGE.md`.

A primeira execução do novo UAT registrou 4/5 testes aprovados; a única falha observada no checkpoint é uma expectativa visual do teste (`is-selected`) incompatível com a classe real (`active-sim`) e deve ser investigada/corrigida no teste antes de imputar defeito ao produto.

## 7. Documentos históricos que não controlam a fila

- `docs/superpowers/plans/*` — histórico de planejamento, exceto o plano explicitamente associado à frente ativa por `CURRENT_STAGE.md`/handoff corrente;
- `docs/audits/*` — evidência de auditoria e SHA correspondentes;
- `docs/handoff/*` — checkpoints do seu momento, exceto o único handoff corrente apontado por `CURRENT_STAGE.md`;
- `docs/evidence/*` — prova localizada;
- `docs/history/*` — snapshots preservados;
- `docs/reference/PRODUCT_DECISIONS.md` — índice histórico substituído pelo `DECISION_LOG.md` e decisões posteriores;
- `docs/reference/POST_PR22_PRIORITIZED_BACKLOG.md` e roadmaps antigos — não controlam a fila atual.

Nenhum item histórico deve ser interpretado como tarefa ainda aberta sem confronto com `CURRENT_STAGE.md`, modelo canônico, código e ambiente atuais.

R1–R9 permanecem identificadores históricos. Não formam fila automática.

## 8. PROJECT_CONTEXT e trechos temporais

`docs/PROJECT_CONTEXT.md` contém contratos e contexto ainda úteis, mas sua seção temporal registra o estado de 06/09 e menciona PRs/filas daquele momento.

Regra obrigatória:

- usar o arquivo para contexto funcional detalhado quando necessário;
- **não** usar seus SHAs, estado de PR, contagens, deployment ou “próximo passo” como estado atual;
- para qualquer informação temporal, consultar `CURRENT_STAGE.md` e o handoff corrente;
- em conflito de regra funcional, aplicar a precedência da seção 2.

Essa reclassificação evita reescrever um documento longo só para atualizar cronologia e evita que ele concorra com a fonte mutável correta.

## 9. ADR-051 e decisões especializadas

A ADR-051 continua vigente como adiamento deliberado do hardening estrutural de `registered_invoices`. Não classificar como resolvida nem antecipar migration sem o gatilho definido ou nova decisão explícita.

Demais ADRs vigentes prevalecem no ponto especializado até revogação/substituição expressa.

## 10. Contrato de persistência/cache reforçado em 13/09

A interpretação documental vigente é:

```text
Supabase = fonte canônica persistente no modo remoto
memória/cache do navegador = projeção operacional descartável permitida
localStorage = não pode funcionar como segundo banco operacional em Production/Supabase
```

Uso local é positivo quando reduz trabalho, melhora responsividade e mantém a convergência:

```text
remoto persistido = projeção local = UI = estado após reload
```

É regressão quando o estado local mascara falha remota, sobrevive como verdade concorrente, força carregamento global crescente ou impede que reload recupere a autoridade Supabase.

Essa interpretação é coerente com o código atual e não reabre a antiga decisão de Production em LocalStorage, que permanece superada.

## 11. Conflitos documentais reconciliados nesta atualização

Foram corrigidas as seguintes fontes de confusão:

- `CURRENT_STAGE.md` ainda dizia que PR #300 aguardava integração e que `main` estava em `2eff...`;
- a rota do README raiz não incluía `PRODUCT_SURFACE_CATALOG.md` apesar de ele já ser leitura obrigatória no roteador;
- não existia mecanismo explícito para promover temporariamente um único handoff de frente ativa sem transformá-lo em documento canônico permanente;
- `PROJECT_CONTEXT.md` podia ser lido como estado temporal corrente apesar de carregar checkpoints de 06/09;
- relatórios pré-merge podiam parecer contradizer o estado pós-merge se lidos fora da rota.

A solução é manter uma única cadeia:

```text
AGENTS
→ modelo canônico
→ catálogo de superfícies
→ CURRENT_STAGE
→ handoff corrente (quando houver)
→ método/gates
→ matriz/ADRs/referências especializadas
→ históricos
```

## 12. Regra de manutenção obrigatória

Todo novo documento classificado como canônico deve, na mesma entrega:

1. ser incluído em `AGENTS.md` se introduzir leitura obrigatória;
2. atualizar `docs/README.md`;
3. atualizar este arquivo;
4. atualizar `SYSTEM_CANONICAL_MODEL.md` se mudar regra, fluxo, autoridade ou invariante;
5. atualizar `PRODUCT_SURFACE_CATALOG.md` se mudar finalidade, jornada, ação, encontrabilidade ou semântica visual;
6. atualizar `CURRENT_STAGE.md` se mudar estado/prioridade;
7. reclassificar a fonte anterior que deixou de orientar o presente.

Quando uma frente precisar de contexto detalhado temporário:

- preferir um handoff/evidência datado;
- nomeá-lo em `CURRENT_STAGE.md` como único handoff corrente;
- não hardcodar seu nome em `AGENTS.md`;
- retirar/substituir o vínculo ao encerrar a frente;
- preservar o arquivo antigo sem reescrita retrospectiva.

## 13. Preservação histórica

Não reescrever auditoria, ADR, evidência ou handoff antigo para fazê-lo parecer atual. Quando o presente mudar:

- manter o histórico intacto;
- atualizar os documentos mutáveis/canônicos;
- registrar explicitamente a substituição ou refinamento;
- evitar que um agente futuro precise inferir sozinho qual documento venceu.
