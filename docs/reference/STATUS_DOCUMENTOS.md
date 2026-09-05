# Matriz de validade documental

**Atualizado em:** 5 de setembro de 2026  
**Classe documental:** referência canônica de classificação, não fila executável

> **ROTA OBRIGATÓRIA:** qualquer retomada começa em [`../../START_HERE.md`](../../START_HERE.md). O único plano executável vigente é [`../MASTER_PLAN_CURRENT.md`](../MASTER_PLAN_CURRENT.md).

## 1. Finalidade

Este arquivo informa **como usar** a documentação sem transformar arquivos históricos em instruções atuais. Ele não possui uma segunda ordem de leitura.

A regra é simples:

```text
START_HERE.md
→ CURRENT_STATE.md
→ MASTER_PLAN_CURRENT.md
→ PLAN_TRACEABILITY.md quando necessário
→ documentos específicos da tarefa
```

Se a `main` tiver avançado além da baseline indicada em `START_HERE.md`, os PRs posteriores precisam ser reconciliados antes de executar o plano.

## 2. Documentos correntes de continuidade

| Documento | Estado | Uso |
|---|---|---|
| `START_HERE.md` | **CORRENTE — porta única** | primeira leitura e verificação da baseline |
| `docs/CURRENT_STATE.md` | **CORRENTE** | fotografia do estado funcional e regras sensíveis |
| `docs/MASTER_PLAN_CURRENT.md` | **CORRENTE — único plano executável** | fila real de trabalho remanescente |
| `docs/PLAN_TRACEABILITY.md` | **CORRENTE** | origem, absorção e alteração do plano pelos hotfixes |
| `AGENTS.md` | **CORRENTE** | regras permanentes de trabalho, sem fila própria |
| `README.md` | **CORRENTE** | apresentação e redirecionamento para `START_HERE.md` |
| `docs/README.md` | **CORRENTE** | índice técnico, sem roteiro concorrente |
| `docs/PROJECT_CONTEXT.md` | **CORRENTE** | contratos funcionais/arquiteturais estáveis; subordinado a `START_HERE.md` |
| `docs/DECISION_LOG.md` | **CORRENTE COMO LEDGER** | decisões vigentes e sua sucessão; não define a fila |

## 3. Estado detalhado e histórico recente

| Documento | Estado | Regra de uso |
|---|---|---|
| `docs/CURRENT_STAGE.md` | **HISTÓRICO DETALHADO DE CHECKPOINTS** | consultar para investigação; não usar como próxima ação |
| `docs/handoff/2026-09-03-reconciliacao-documental-e-plano-mestre.md` | **HISTÓRICO** | checkpoint que levou ao plano de 03/09 |
| `docs/audits/2026-09-03-reauditoria-codigo-fonte-plano-remanescente.md` | **HISTÓRICO** | evidência do baseline de 03/09 |
| `docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md` | **HISTÓRICO — NÃO EXECUTAR** | plano correto de seu checkpoint, posteriormente emendado |
| `docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md` | **HISTÓRICO — NÃO EXECUTAR** | plano anterior ao de 03/09 |
| demais `handoff/`, `audits/`, `evidence/`, `reports/` e planos datados | **HISTÓRICO/EVIDÊNCIA** | abrir somente quando a rastreabilidade da tarefa exigir |

O fato de um documento ter sido “canônico” em seu checkpoint não o transforma em instrução corrente para sempre.

## 4. Linha recente de sucessão

O último plano reconciliado antes da sequência urgente foi o PR #253, em 03/09. Depois foram integrados:

```text
#254 → #256 → #257 → #258 → #260 → #261
```

Esses hotfixes foram absorvidos por `PLAN_TRACEABILITY.md` e pelo plano sucessor `MASTER_PLAN_CURRENT.md`.

O PR #262 foi **abortado e fechado sem merge**. Ele não integra a linha de decisão vigente.

## 5. Decisões e ADRs

ADRs continuam válidos no escopo que não foi posteriormente especializado ou substituído.

Regra de leitura:

- ADR vigente e sem emenda posterior: usar normalmente;
- ADR parcialmente alterado: preservar o núcleo e aplicar a emenda posterior documentada;
- ADR substituído: usar apenas para entender a história;
- dúvida entre ADR e hotfix posterior: consultar `PLAN_TRACEABILITY.md`, PR posterior e código resultante antes de qualquer alteração.

### Casos importantes já reconciliados

- ADR-049: histórica; `boleto_internet` hoje é tipo de gasto dentro de Notas Fiscais em Educação Conectada;
- ADR-050: núcleo da individualização por NF continua vigente, mas novo envio/reabertura/próximo ator foram especializados pelos PRs #254/#256;
- ADR-051: hardening adicional permanece deliberadamente adiado;
- ADR-052: autoridade separada dos fluxos críticos continua vigente.

## 6. Documentos arquiteturais

Arquitetura descreve contratos e decisões de desenho, mas arquivos datados precisam ser confrontados com o código corrente quando descrevem ordem física de bootstrap, nomes de módulos ou detalhes que podem mudar por hotfix.

Exemplo já reconciliado: `architecture/product-extensions-load-order.md` precisa refletir `critical-action-guard.js`, introduzido no PR #260, na ordem real do bootstrap.

## 7. Referências geradas e matrizes

- `reference/FUNCTIONAL_CONTRACT_MATRIX.md` e seus JSONs: inventário operacional/testável das operações; não substituem pré-condições detalhadas de uma regra de negócio;
- `reference/PRODUCT_SURFACE_CATALOG.md`: catálogo de superfícies e capacidades; confirmar código quando a tarefa alterar autorização;
- `reference/PRODUCT_DECISIONS.md`: **índice histórico substituído**; não receber novas decisões;
- dicionários Supabase: contrato técnico do schema, sujeito à baseline de migrations indicada nos documentos correntes.

Uma linha resumida de matriz não pode ser usada para inventar uma pré-condição ausente. Exemplo: “Encaminhar bem” aplica-se a um bem que realmente esteja no estado que exige encaminhamento; não significa que toda NF permanente deva nascer `Não encaminhada`.

## 8. O que um novo chat NÃO deve fazer

Um novo chat não deve:

- escolher o documento mais recente pelo nome e executá-lo;
- percorrer todos os handoffs procurando “próxima etapa”;
- considerar qualquer ocorrência de “plano corrente” dentro de um arquivo histórico como instrução atual;
- converter teste antigo em regra de negócio sem verificar a linhagem;
- usar uma frase resumida de um PR sem considerar suas pré-condições;
- alterar o produto para caber num plano anterior.

## 9. Manutenção obrigatória após novo hotfix

Todo hotfix funcional posterior à baseline deve, antes da retomada da fila planejada:

1. atualizar `CURRENT_STATE.md`;
2. registrar em `PLAN_TRACEABILITY.md` se concluiu, alterou, substituiu ou não afetou o plano;
3. atualizar `MASTER_PLAN_CURRENT.md` se o trabalho remanescente mudou;
4. atualizar a baseline em `START_HERE.md` quando aplicável;
5. corrigir qualquer documento corrente diretamente afetado pela nova decisão.

O plano se adapta à decisão posterior aprovada. A decisão posterior não é desfeita para fazer o código “voltar a combinar” com um plano histórico.
