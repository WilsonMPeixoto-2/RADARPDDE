# RADAR PDDE — START HERE

**Esta é a única porta de entrada operacional do projeto.**

**Baseline documental conhecida:** `main` `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`  
**Baseline funcional publicada:** PR #260 / merge `8fc58926565a72465980143f253f0a2fee4b8fc2`  
**Atualizado em:** 4 de setembro de 2026

> Se você é um novo chat, agente ou sessão retomando o RADAR PDDE, **não escolha um plano, handoff ou ADR por conta própria antes de seguir este arquivo**.

## 1. Primeiro: verifique se a baseline mudou

Antes de analisar, planejar ou alterar o produto:

1. consulte a `main` remota;
2. compare o SHA atual com `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`;
3. se o SHA for o mesmo, siga a ordem de leitura abaixo;
4. se a `main` avançou, identifique **todos os PRs integrados depois desta baseline** e reconcilie seus efeitos antes de executar o plano corrente.

**Não continue automaticamente com documentação de 03/09 se a baseline tiver avançado.** Um hotfix posterior pode ter concluído, alterado ou substituído parte do plano.

## 2. Ordem obrigatória de leitura

Depois de verificar a baseline, leia nesta ordem:

1. [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) — o que existe hoje e quais regras recentes são sensíveis a regressão;
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

O último plano corretamente reconciliado antes da nova sequência de hotfixes foi o PR #253, em 03/09. Depois dele foram integrados:

`#254 → #256 → #257 → #258 → #260 → #261`.

Esses PRs foram reconciliados em [`docs/PLAN_TRACEABILITY.md`](docs/PLAN_TRACEABILITY.md) e originaram o plano sucessor atual.

### PR #262

O PR #262 foi **ABORTADO E FECHADO SEM MERGE**. Não integra `main`, Production ou a linha de decisão vigente. Testes/documentos exclusivos daquela branch não podem ser usados como contrato atual.

## 5. Planos históricos

Os seguintes planos são históricos e **não devem ser executados como fila atual**:

- `docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md` — foi o plano correto de seu checkpoint, depois superado pelos hotfixes #254/#256/#257/#258/#260 e pela reconciliação atual;
- `docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md` — plano anterior já substituído em 03/09;
- demais planos/handoffs datados explicam seus checkpoints e são usados apenas quando a rastreabilidade da tarefa exigir.

**A única fila executável atual é `docs/MASTER_PLAN_CURRENT.md`.**

## 6. Regra para novos hotfixes

Se um problema urgente interromper novamente o plano:

1. faça o hotfix a partir do código atual e preserve decisões vigentes;
2. no mesmo PR, ou imediatamente antes do próximo trabalho planejado, registre o impacto em `docs/CURRENT_STATE.md` e `docs/PLAN_TRACEABILITY.md`;
3. se o hotfix concluir, alterar ou substituir parte do plano, atualize `docs/MASTER_PLAN_CURRENT.md`;
4. não retome automaticamente a próxima etapa do plano enquanto essa reconciliação não estiver feita.

Um hotfix posterior é uma emenda ao plano. **O plano é que deve se adaptar ao hotfix deliberadamente aprovado, não o contrário.**

## 7. Regra para auditorias

Auditoria e mudança funcional são etapas separadas.

Durante uma auditoria:

- identificar comportamento atual;
- confrontar regra vigente, código e evidência;
- classificar achados;
- não alterar regra apenas para satisfazer teste/plano histórico.

Somente depois de um defeito atual estar comprovado deve existir correção funcional.

## 8. Resumo de retomada

```text
START_HERE.md
→ conferir SHA atual da main
→ CURRENT_STATE.md
→ MASTER_PLAN_CURRENT.md
→ PLAN_TRACEABILITY.md somente se precisar da origem
→ código/testes/ADRs específicos da tarefa
→ executar
→ atualizar estado/rastreabilidade/plano quando o resultado mudar a continuidade
```

Se uma sessão nova seguir esse fluxo, ela não precisa recuperar a memória de chats anteriores para descobrir qual plano é o atual.
