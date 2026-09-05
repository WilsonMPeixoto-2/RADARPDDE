# Matriz de validade documental

**Atualizado em:** 5 de setembro de 2026  
**Classe documental:** referência canônica de classificação, não fila executável

> **ROTA OBRIGATÓRIA:** qualquer retomada começa em [`../../START_HERE.md`](../../START_HERE.md). O único plano executável vigente é [`../MASTER_PLAN_CURRENT.md`](../MASTER_PLAN_CURRENT.md).

## 1. Finalidade

Este arquivo informa **como usar** a documentação sem transformar arquivos históricos em instruções atuais. Ele não possui uma segunda ordem de leitura.

A rota corrente é:

```text
START_HERE.md
→ CURRENT_STATE.md
→ método adversarial
→ achados adversariais conhecidos
→ MASTER_PLAN_CURRENT.md
→ PLAN_TRACEABILITY.md quando necessário
→ documentos específicos da tarefa
```

Se a `main` tiver avançado além da baseline indicada em `START_HERE.md`, os PRs posteriores precisam ser reconciliados antes de executar o plano.

## 2. Documentos correntes de continuidade

| Documento | Estado | Uso |
|---|---|---|
| `START_HERE.md` | **CORRENTE — porta única** | primeira leitura e verificação da baseline |
| `docs/CURRENT_STATE.md` | **CORRENTE** | fotografia do estado funcional, regras sensíveis e defeitos conhecidos |
| `docs/architecture/adversarial-analysis-and-implementation-method.md` | **CORRENTE — método obrigatório** | protocolo de análise/implementação crítica e fechamento adversarial |
| `docs/audits/2026-09-05-astra-adversarial-findings.md` | **CORRENTE COMO LEDGER DE ACHADOS** | bugs, ambiguidades e riscos ainda não encerrados |
| `docs/MASTER_PLAN_CURRENT.md` | **CORRENTE — único plano executável** | fila real de trabalho remanescente |
| `docs/PLAN_TRACEABILITY.md` | **CORRENTE** | origem, absorção e alteração do plano pelos hotfixes/auditorias |
| `AGENTS.md` | **CORRENTE** | regras permanentes de trabalho e método mínimo |
| `docs/reference/TEST_GOVERNANCE.md` | **CORRENTE** | governança de testes sob o método adversarial |
| `README.md` | **CORRENTE** | apresentação e redirecionamento para `START_HERE.md` |
| `docs/README.md` | **CORRENTE** | índice técnico, sem roteiro concorrente |
| `docs/PROJECT_CONTEXT.md` | **CORRENTE** | contratos funcionais/arquiteturais estáveis; subordinado a `START_HERE.md` |
| `docs/DECISION_LOG.md` | **CORRENTE COMO LEDGER** | decisões vigentes e sua sucessão; não define a fila |

## 3. Estado detalhado e histórico recente

| Documento | Estado | Regra de uso |
|---|---|---|
| `docs/audits/2026-09-05-continuity-semantic-traceability-complete.md` | **HISTÓRICO/CANÔNICO PARA RECONCILIAÇÃO #253→#261** | válido para reconstrução documental/hotfixes, mas não prova ausência de defeitos desconhecidos |
| `docs/CURRENT_STAGE.md` | **HISTÓRICO DETALHADO DE CHECKPOINTS** | consultar para investigação; não usar como próxima ação |
| `docs/handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md` | **HISTÓRICO** | checkpoint que levou ao plano de 03/09 |
| `docs/audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md` | **HISTÓRICO** | evidência do baseline de 03/09 |
| `docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md` | **HISTÓRICO — NÃO EXECUTAR** | plano correto de seu checkpoint, posteriormente emendado |
| `docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md` | **HISTÓRICO — NÃO EXECUTAR** | plano anterior ao de 03/09 |
| demais `handoff/`, `audits/`, `evidence/`, `reports/` e planos datados | **HISTÓRICO/EVIDÊNCIA** | abrir somente quando a rastreabilidade da tarefa exigir |

O fato de um documento ter sido “canônico” ou “completo” em seu checkpoint não o transforma em instrução corrente para sempre nem em prova de ausência de bugs desconhecidos.

## 4. Linha recente de sucessão

O último plano reconciliado antes da sequência urgente foi o PR #253, em 03/09. Depois foram integrados:

```text
#254 → #256 → #257 → #258 → #260 → #261
```

Esses hotfixes foram absorvidos por `PLAN_TRACEABILITY.md` e pelo plano sucessor `MASTER_PLAN_CURRENT.md`.

O PR #262 foi **abortado e fechado sem merge**. Ele não integra a linha de decisão vigente.

O PR #263 continua documental/governança. Seu fechamento semântico inicial foi reaberto depois dos achados adversariais de 05/09.

## 5. Decisões e ADRs

ADRs continuam válidos no escopo que não foi posteriormente especializado ou substituído.

Regra de leitura:

- ADR vigente e sem emenda posterior: usar normalmente;
- ADR parcialmente alterado: preservar o núcleo e aplicar a emenda posterior documentada;
- ADR substituído: usar apenas para entender a história;
- dúvida entre ADR e hotfix posterior: consultar `PLAN_TRACEABILITY.md`, PR posterior e código resultante antes de qualquer alteração;
- ainda que ADR/código/testes concordem, aplicar método adversarial antes de declarar a funcionalidade correta em fluxo crítico.

### Casos importantes já reconciliados

- ADR-049: histórica; `boleto_internet` hoje é tipo de gasto dentro de Notas Fiscais em Educação Conectada;
- ADR-050: núcleo da individualização por NF continua vigente, mas novo envio/reabertura/próximo ator foram especializados pelos PRs #254/#256;
- ADR-051: hardening adicional permanece deliberadamente adiado;
- ADR-052: autoridade separada dos fluxos críticos continua vigente.

## 6. Documentos arquiteturais

Arquitetura descreve contratos e decisões de desenho, mas arquivos datados precisam ser confrontados com o código corrente quando descrevem ordem física de bootstrap, nomes de módulos ou detalhes que podem mudar por hotfix.

O protocolo adversarial atual exige também procurar implementações concorrentes, fallbacks executáveis, closures/callbacks e estados avançados que podem ser destruídos por operações posteriores.

## 7. Referências geradas e matrizes

- `reference/FUNCTIONAL_CONTRACT_MATRIX.md` e seus JSONs: inventário operacional/testável; não substituem pré-condições detalhadas;
- `reference/PRODUCT_SURFACE_CATALOG.md`: catálogo de superfícies/capacidades; confirmar código quando a tarefa alterar autorização;
- `reference/PRODUCT_DECISIONS.md`: **índice histórico substituído**; não receber novas decisões;
- dicionários Supabase: contrato técnico do schema, sujeito à baseline de migrations indicada nos documentos correntes.

Para RPC redefinida, uma matriz deve apontar para a **última definição efetiva da assinatura** ou registrar explicitamente a sucessão. Anchor em migration antiga não certifica o contrato atual.

Uma linha resumida de matriz não pode ser usada para inventar pré-condição ausente.

## 8. O que um novo chat NÃO deve fazer

Um novo chat não deve:

- escolher o documento mais recente pelo nome e executá-lo;
- percorrer handoffs procurando “próxima etapa”;
- considerar ocorrência de “plano corrente” dentro de arquivo histórico como instrução atual;
- converter teste antigo em regra de negócio sem verificar linhagem;
- usar frase resumida de PR sem pré-condições;
- alterar produto para caber num plano anterior;
- concluir “tudo correto” apenas porque CI/E2E estão verdes;
- encontrar uma implementação correta e parar sem procurar caminhos concorrentes;
- escolher unilateralmente uma semântica quando duas projeções atuais divergem.

## 9. Manutenção obrigatória após novo hotfix ou achado adversarial

Todo hotfix funcional posterior à baseline deve, antes da retomada da fila planejada:

1. atualizar `CURRENT_STATE.md`;
2. registrar em `PLAN_TRACEABILITY.md` se concluiu, alterou, substituiu ou não afetou o plano;
3. atualizar `MASTER_PLAN_CURRENT.md` se o trabalho remanescente mudou;
4. atualizar a baseline em `START_HERE.md` quando aplicável;
5. atualizar/encerrar o ledger de achados adversariais correspondente;
6. corrigir qualquer documento corrente diretamente afetado pela nova decisão.

Todo novo achado adversarial relevante, ainda que seja apenas ambiguidade/decisão de produto, deve ser registrado antes de encerrar a revisão.

O plano se adapta à decisão posterior aprovada. A decisão posterior não é desfeita para fazer o código “voltar a combinar” com um plano histórico.