# RADAR PDDE — START HERE

**Esta é a única porta de entrada operacional do projeto.**

**Última baseline funcional reconciliada:** PR #260 / merge `8fc58926565a72465980143f253f0a2fee4b8fc2`  
**Checkpoint documental de entrada da reconciliação:** PR #261 / `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`  
**Consolidação de continuidade:** PR #263, exclusivamente documental/governança  
**Atualizado em:** 5 de setembro de 2026

> Se você é um novo chat, agente ou sessão retomando o RADAR PDDE, **não escolha um plano, handoff, ADR ou SHA antigo por conta própria antes de seguir este arquivo**.

## 1. Primeiro: consulte a `main` atual

Não existe mais um SHA documental fixo que deva ser tratado como “a main eterna”. Isso ficaria desatualizado no instante em que a própria documentação fosse integrada, uma pequena armadilha burocrática que não precisamos recriar.

Antes de analisar, planejar ou alterar o produto:

1. consulte a `main` remota atual;
2. confirme quais PRs funcionais foram integrados **depois da última baseline funcional reconciliada**;
3. PRs exclusivamente documentais, como #261 e #263, não mudam regra de negócio por si só;
4. se existir PR funcional posterior que ainda não esteja refletido em `CURRENT_STATE.md` e `PLAN_TRACEABILITY.md`, reconcilie-o antes de executar o plano;
5. se não existir mudança funcional não reconciliada, siga a ordem de leitura abaixo.

A referência funcional atual continua sendo o PR #260 até que um novo PR funcional, acompanhado da atualização documental obrigatória, estabeleça uma baseline sucessora.

## 2. Ordem obrigatória de leitura

Depois de verificar a `main`, leia nesta ordem:

1. [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) — o que existe hoje e quais regras são sensíveis a regressão;
2. [`docs/MASTER_PLAN_CURRENT.md`](docs/MASTER_PLAN_CURRENT.md) — **ÚNICO PLANO EXECUTÁVEL VIGENTE**;
3. [`docs/PLAN_TRACEABILITY.md`](docs/PLAN_TRACEABILITY.md) — somente quando precisar saber de onde veio uma tarefa, por que mudou ou qual hotfix a absorveu;
4. [`AGENTS.md`](AGENTS.md) — regras permanentes de trabalho, domínio e segurança contra regressão;
5. código, testes, ADRs, migrations, handoffs e auditorias **específicos da tarefa que será executada**.

Não existe outra ordem de leitura concorrente.

## 3. Regra de precedência

Para uma superfície modificada ao longo do tempo:

```text
última decisão funcional deliberada / hotfix posterior implementado
→ código e banco resultantes dessa decisão
→ testes que representam o contrato atual
→ documentação corrente reconciliada
→ documentação histórica do checkpoint anterior
```

Isso **não** significa que qualquer código atual é automaticamente correto. Significa que um documento antigo não pode ser usado para desfazer uma decisão posterior sem primeiro provar que a decisão posterior era um defeito.

Quando houver conflito não resolvível entre fontes atuais, classifique como dúvida e investigue. Não “corrija” o produto para a versão mais antiga apenas porque ela está descrita em um plano.

## 4. Linha recente de continuidade

O último plano corretamente reconciliado antes da sequência urgente foi o PR #253, em 03/09. Depois foram integrados:

```text
#254 → #256 → #257 → #258 → #260 → #261
```

Esses PRs foram reconciliados em [`docs/PLAN_TRACEABILITY.md`](docs/PLAN_TRACEABILITY.md) e originaram o plano sucessor atual.

### PR #262

O PR #262 foi **ABORTADO E FECHADO SEM MERGE**. Não integra `main`, Production ou a linha de decisão vigente. Testes/documentos exclusivos daquela branch não podem ser usados como contrato atual.

### PR #263

O PR #263 consolida documentação, rastreabilidade e proteções de continuidade. **Não altera runtime, banco, migration ou regra funcional do produto.** Seu próprio merge não exige “reconciliar o #263 contra o #263”; a reconciliação que ele contém já é seu conteúdo.

## 5. Planos históricos

Os seguintes planos são históricos e **não devem ser executados como fila atual**:

- `docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md` — foi o plano correto do checkpoint de 03/09 e depois foi emendado pelos hotfixes #254/#256/#257/#258/#260;
- `docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md` — plano anterior já substituído em 03/09;
- demais planos/handoffs datados explicam seus checkpoints e são usados apenas quando a rastreabilidade da tarefa exigir.

**A única fila executável atual é `docs/MASTER_PLAN_CURRENT.md`.**

## 6. Regra para novos hotfixes

Se um problema urgente interromper novamente o plano:

1. faça o hotfix a partir do código atual e preserve decisões vigentes;
2. no mesmo PR funcional, atualize `docs/CURRENT_STATE.md` e `docs/PLAN_TRACEABILITY.md`;
3. se o hotfix concluir, alterar ou substituir parte do plano, atualize `docs/MASTER_PLAN_CURRENT.md`;
4. atualize documentos correntes diretamente afetados pela nova regra;
5. não retome automaticamente a próxima etapa planejada enquanto essa reconciliação não estiver feita.

Um hotfix posterior é uma emenda ao plano. **O plano deve se adaptar ao hotfix deliberadamente aprovado, não o contrário.**

## 7. Regra para auditorias

Auditoria e mudança funcional são etapas separadas.

Durante uma auditoria:

- identificar comportamento atual;
- confrontar decisão vigente, código, banco e evidência;
- classificar divergências;
- não alterar regra apenas para satisfazer teste, matriz ou plano histórico;
- quando uma frase resumida tiver mais de uma interpretação, recuperar suas pré-condições antes de classificá-la como defeito.

Somente depois de um defeito atual estar comprovado deve existir correção funcional.

## 8. Resumo de retomada

```text
START_HERE.md
→ consultar main atual
→ verificar se há PR funcional posterior ainda não reconciliado
→ CURRENT_STATE.md
→ MASTER_PLAN_CURRENT.md
→ PLAN_TRACEABILITY.md somente se precisar da origem
→ código/testes/ADRs específicos da tarefa
→ executar
→ atualizar estado/rastreabilidade/plano no mesmo PR quando o resultado mudar a continuidade
```

Assim, uma sessão nova não precisa recuperar memória de chats anteriores para descobrir qual é a regra e qual é a próxima tarefa.