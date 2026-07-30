# Matriz de validade documental

**Atualizado em:** 29 de julho de 2026

## 1. Finalidade

Definir quais arquivos controlam o estado presente e quais permanecem apenas como histórico, evidência ou apoio.

## 2. Classificações

| Estado | Uso |
|---|---|
| **Vigente** | contrato ou procedimento aplicável ao estado atual |
| **Vigente com dado mutável** | estrutura vigente; números e estados remotos exigem nova consulta |
| **Vigente com gate pendente** | contrato válido, mas há ação externa não concluída |
| **Histórico** | retrato datado; não controla o presente |
| **Plano executado** | plano preservado; tarefas devem ser confrontadas com o estado atual |
| **Plano substituído** | não executar; outra frente ou PR prevaleceu |
| **Evidência gerada** | artefato reproduzível; regenerar pelo script, não editar manualmente |
| **Referência parcial** | conteúdo útil, mas não suficiente para decidir sozinho |
| **Procedimento histórico/restrito** | operação já executada ou excepcional; não repetir sem plano específico |

## 3. Documentos canônicos de entrada

| Documento | Estado | Observação |
|---|---|---|
| `README.md` | Vigente com dado mutável | visão executiva; SHAs e deployment têm data de corte |
| `docs/README.md` | Vigente | índice e ordem de leitura |
| `docs/CURRENT_STAGE.md` | Vigente com dado mutável | controla próxima decisão e bloqueadores |
| `docs/PROJECT_CONTEXT.md` | Vigente | regras de produto e arquitetura |
| `docs/DECISION_LOG.md` | Vigente | ADRs 001–033 |
| `docs/reference/STATUS_DOCUMENTOS.md` | Vigente | esta matriz |

Ordem mínima:

1. `README.md`;
2. `docs/README.md`;
3. `docs/CURRENT_STAGE.md`;
4. `docs/PROJECT_CONTEXT.md`;
5. `docs/DECISION_LOG.md`;
6. código e ambientes para qualquer dado mutável.

## 4. Arquitetura vigente

| Documento | Estado | Observação |
|---|---|---|
| `architecture/README.md` | Vigente | índice da pasta |
| `architecture/competencias.md` | Vigente | `closing_competence = 2026-12` já implementada |
| `architecture/avaliacao-mensal.md` | Vigente | regra canônica única |
| `architecture/modelo-operacional.md` | Vigente | projeção compartilhada |
| `architecture/timeline-unidade.md` | Vigente | projeção somente leitura |
| `architecture/navigation-contextual.md` | Vigente | retorno contextual publicado |
| `architecture/estatisticas.md` | Vigente | denominadores independentes |
| `architecture/retificacoes.md` | Vigente | histórico e correções operacionais |
| `architecture/frontend-load-order.md` | Vigente | arquitetura atual; números do manifesto são datados |
| `architecture/product-extensions-load-order.md` | Vigente | timeline e navegação contextual pós-`app.js` |
| `architecture/testing.md` | Vigente | readiness e gates cumulativos |
| `architecture/supabase-readiness.md` | Vigente com gate pendente | Supabase ativo; hardening ainda pendente |
| `architecture/excel-export.md` | Vigente com gate pendente | produto certificado; botão institucional ainda no CSV |
| `architecture/excel-workbook-plan.md` | Vigente | plano do workbook institucional |
| `architecture/excel-xlsx-runtime.md` | Vigente com gate pendente | renderer e integração reversível |
| `architecture/excel-sme-mensal.md` | Vigente com gate pendente | produto certificado; homologação manual pendente |
| `architecture/excel-integral-certification.md` | Vigente | certificação automatizada |
| `architecture/roadmap-pre-supabase.md` | Histórico | planejamento anterior à ativação remota |

## 5. Referências vigentes

| Documento | Estado | Observação |
|---|---|---|
| `reference/SUPABASE_DATA_DICTIONARY.md` | Vigente | resumo do schema efetivo; tipos gerados prevalecem |
| `reference/SUPABASE_PERMISSIONS_MATRIX.md` | Vigente | Auth, RLS e capacidades |
| `reference/SUPABASE_FUNCTIONAL_COVERAGE.md` | Vigente com gate pendente | cobertura atual e bloqueadores |
| `reference/PRODUCT_DECISIONS.md` | Referência parcial | decisões antigas devem ser confrontadas com ADRs |
| `reference/PRODUCT_SURFACE_CATALOG.md` | Referência parcial | catálogo datado de superfícies |
| `reference/CHANGE_CLASSIFICATION.md` | Vigente | classificação de mudanças e gates |
| `reference/DADOS_HOMOLOGACAO.md` | Referência parcial | massa de teste; não é dado operacional |
| `reference/SUPABASE_INTEGRATION_AUDIT.md` | Histórico | auditoria anterior à ativação atual |
| `reference/POST_PR22_PRIORITIZED_BACKLOG.md` | Histórico | backlog anterior aos ciclos atuais |

## 6. Runbooks

| Documento | Estado | Observação |
|---|---|---|
| `runbooks/SUPABASE_CONNECTION.md` | Vigente com gate pendente | Production ativa; proteção de senha e recuperação pendentes |
| `runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md` | Vigente com gate pendente | incorpora divergência SME; reparo ainda não executado |
| `runbooks/SUPABASE_DATA_BOOTSTRAP.md` | Procedimento histórico/restrito | carga inicial; não usar como rotina normal |
| `runbooks/SUPABASE_AUTH_BOOTSTRAP.md` | Procedimento histórico/restrito | primeiro admin; não repetir sem plano específico |

Runbook autoriza procedimento somente quando os gates e responsáveis nele previstos estiverem satisfeitos.

## 7. Auditorias recentes

| Documento | Estado | Finalidade |
|---|---|---|
| `audits/2026-07-29-alinhamento-documental-integral-pos-pr108.md` | Histórico vinculante da correção | reconciliação integral de documentos vigentes |
| `audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md` | Histórico | estado pós-Ciclos 1–5 |
| `audits/2026-07-29-rastreabilidade-migration-sme.md` | Histórico com gate atual | prova da divergência de identificador |
| `audits/2026-07-28-alinhamento-codigo-ambientes-documentacao.md` | Histórico | base da oficialização |
| auditorias anteriores | Histórico | retrato da data indicada |

Auditoria datada não substitui consulta atual ao ambiente, mas seus gates permanecem enquanto não houver evidência de superação.

## 8. Planos e especificações

### `docs/superpowers/specs/`

**Estado padrão:** Histórico.

Especificações registram desenho aprovado na data. Quando o recurso já foi implementado, o contrato vigente deve ser lido nos documentos de arquitetura e no código.

### `docs/superpowers/plans/`

**Estado padrão:** Plano executado ou Histórico.

Caixa não marcada em plano antigo não prova pendência atual. Conferir:

- `CURRENT_STAGE.md`;
- PRs e commits;
- auditoria posterior;
- código e ambientes.

Planos explicitamente marcados como substituídos não devem ser retomados.

## 9. Evidências

| Diretório | Estado | Regra |
|---|---|---|
| `evidence/frontend-precedence/` | Evidência gerada | regenerar com scripts de auditoria |
| `evidence/excel-certification/` | Evidência gerada | massa sintética e hashes |
| `evidence/global-baseline/` | Evidência gerada | linha de base datada |
| outros manifests/capturas | Evidência gerada ou Histórico | não editar manualmente |

## 10. Handoffs e relatórios

- `handoff/`: Histórico;
- `reports/`: Histórico;
- relatórios de estado antigo não controlam a próxima etapa;
- handoff deve apontar para `CURRENT_STAGE.md` e não repetir decisões divergentes.

## 11. Regras contra desatualização

1. documentos canônicos devem separar estado atual, histórico e pendência;
2. números remotos recebem data de corte;
3. contagens operacionais mutáveis não são invariantes arquiteturais;
4. nova entrega material atualiza arquitetura, decisão, estágio e evidência aplicáveis;
5. artefatos gerados são regenerados, não corrigidos manualmente;
6. plano antigo não é reaberto sem nova verificação;
7. código e ambientes prevalecem sobre memória e texto desatualizado;
8. nova migration de Production permanece bloqueada até reconciliação do histórico SME;
9. índice não deve apontar para arquivo inexistente.

## 12. Fonte de verdade para a próxima frente

Após o merge do alinhamento integral:

```text
CURRENT_STAGE.md
→ PROJECT_CONTEXT.md
→ DECISION_LOG.md
→ arquitetura da frente escolhida
→ código e ambientes
```

A escolha da próxima frente continua sendo decisão expressa do responsável pelo produto.
