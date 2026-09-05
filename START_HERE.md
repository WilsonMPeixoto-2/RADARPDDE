# RADAR PDDE — START HERE

**Esta é a única porta de entrada operacional do projeto.**

**Última baseline funcional reconciliada:** PR #260 / merge `8fc58926565a72465980143f253f0a2fee4b8fc2`  
**Checkpoint documental de entrada da reconciliação:** PR #261 / `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`  
**Consolidação de continuidade:** PR #263, exclusivamente documental/governança  
**Auditoria adversarial posterior:** 05/09/2026, com achados ainda não absorvidos em runtime  
**Atualizado em:** 5 de setembro de 2026

> Se você é um novo chat, agente ou sessão retomando o RADAR PDDE, **não escolha um plano, handoff, ADR ou SHA antigo por conta própria antes de seguir este arquivo**.

> **Mudança metodológica obrigatória em 05/09/2026:** gates verdes, suíte verde e documentação reconciliada não podem mais ser tratados como prova de ausência de defeitos. Toda análise ou implementação crítica deve aplicar o método adversarial documentado em [`docs/architecture/adversarial-analysis-and-implementation-method.md`](docs/architecture/adversarial-analysis-and-implementation-method.md).

## 1. Primeiro: consulte a `main` atual

Não existe mais um SHA documental fixo que deva ser tratado como “a main eterna”. Isso ficaria desatualizado no instante em que a própria documentação fosse integrada.

Antes de analisar, planejar ou alterar o produto:

1. consulte a `main` remota atual;
2. confirme quais PRs funcionais foram integrados **depois da última baseline funcional reconciliada**;
3. PRs exclusivamente documentais, como #261 e #263, não mudam regra de negócio por si só;
4. se existir PR funcional posterior que ainda não esteja refletido em `CURRENT_STATE.md` e `PLAN_TRACEABILITY.md`, reconcilie-o antes de executar o plano;
5. verifique os achados adversariais ainda abertos antes de retomar frentes arquiteturais planejadas;
6. se não existir mudança funcional não reconciliada, siga a ordem de leitura abaixo.

A referência funcional atual continua sendo o PR #260 até que um novo PR funcional, acompanhado da atualização documental obrigatória, estabeleça uma baseline sucessora.

## 2. Ordem obrigatória de leitura

Depois de verificar a `main`, leia nesta ordem:

1. [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) — o que existe hoje e quais regras/defeitos conhecidos são sensíveis a regressão;
2. [`docs/architecture/adversarial-analysis-and-implementation-method.md`](docs/architecture/adversarial-analysis-and-implementation-method.md) — **método obrigatório para análise e implementação crítica**;
3. [`docs/audits/2026-09-05-astra-adversarial-findings.md`](docs/audits/2026-09-05-astra-adversarial-findings.md) — achados adversariais conhecidos e sua classificação;
4. [`docs/MASTER_PLAN_CURRENT.md`](docs/MASTER_PLAN_CURRENT.md) — **ÚNICO PLANO EXECUTÁVEL VIGENTE**;
5. [`docs/PLAN_TRACEABILITY.md`](docs/PLAN_TRACEABILITY.md) — somente quando precisar saber de onde veio uma tarefa, por que mudou ou qual hotfix a absorveu;
6. [`AGENTS.md`](AGENTS.md) — regras permanentes de trabalho, domínio e segurança contra regressão;
7. código, testes, ADRs, migrations, handoffs e auditorias **específicos da tarefa que será executada**.

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

A auditoria adversarial adiciona uma segunda obrigação: mesmo quando as fontes atuais concordam, tente produzir contraexemplos, localizar autoridades concorrentes e combinar fluxos individualmente verdes antes de concluir que o comportamento está correto.

## 4. Linha recente de continuidade

O último plano corretamente reconciliado antes da sequência urgente foi o PR #253, em 03/09. Depois foram integrados:

```text
#254 → #256 → #257 → #258 → #260 → #261
```

Esses PRs foram reconciliados em [`docs/PLAN_TRACEABILITY.md`](docs/PLAN_TRACEABILITY.md) e originaram o plano sucessor atual.

### PR #262

O PR #262 foi **ABORTADO E FECHADO SEM MERGE**. Não integra `main`, Production ou a linha de decisão vigente. Testes/documentos exclusivos daquela branch não podem ser usados como contrato atual.

### PR #263

O PR #263 consolida documentação, rastreabilidade e proteções de continuidade. **Não altera runtime, banco, migration ou regra funcional do produto.**

O fechamento semântico anteriormente registrado para o PR #263 foi **reaberto** depois que a auditoria adversarial encontrou novos defeitos, ambiguidades e artefatos obsoletos. O PR #263 continua sendo documental/governança e deve registrar esses achados, não corrigi-los silenciosamente no runtime.

## 5. Planos históricos

Os seguintes planos são históricos e **não devem ser executados como fila atual**:

- `docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md` — foi o plano correto do checkpoint de 03/09 e depois foi emendado pelos hotfixes #254/#256/#257/#258/#260;
- `docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md` — plano anterior já substituído em 03/09;
- demais planos/handoffs datados explicam seus checkpoints e são usados apenas quando a rastreabilidade da tarefa exigir.

**A única fila executável atual é `docs/MASTER_PLAN_CURRENT.md`.**

## 6. Regra para novos hotfixes

Se um problema urgente interromper novamente o plano:

1. faça o hotfix a partir do código atual e preserve decisões vigentes;
2. aplique o método adversarial para provar causa raiz e procurar efeitos laterais/autoridades concorrentes;
3. no mesmo PR funcional, atualize `docs/CURRENT_STATE.md` e `docs/PLAN_TRACEABILITY.md`;
4. se o hotfix concluir, alterar ou substituir parte do plano, atualize `docs/MASTER_PLAN_CURRENT.md`;
5. atualize documentos correntes diretamente afetados pela nova regra;
6. não retome automaticamente a próxima etapa planejada enquanto essa reconciliação não estiver feita.

Um hotfix posterior é uma emenda ao plano. **O plano deve se adaptar ao hotfix deliberadamente aprovado, não o contrário.**

## 7. Regra para auditorias e implementações

Auditoria e mudança funcional são etapas separadas, mas ambas usam o mesmo método adversarial.

Durante uma auditoria:

- identificar comportamento atual;
- confrontar decisão vigente, código, banco e evidência;
- fazer inventário mecânico amplo antes do aprofundamento quando o escopo justificar;
- procurar todas as implementações concorrentes da mesma regra;
- rastrear `UI real → handler → serviço → domínio → repository → RPC → persistência → reload → outras superfícies`;
- testar retorno à origem depois de um estado avançado;
- combinar fluxos individualmente verdes em sequência;
- procurar paths paralelos, fallbacks, closures, callbacks e renderers legados;
- classificar testes/fixtures como atuais, históricos, adversariais, mocks ou obsoletos;
- resolver RPC pela última definição efetiva da assinatura;
- comparar a mesma entidade entre projeções/telas;
- classificar divergências sem transformar ambiguidade em bug por conveniência;
- não alterar regra apenas para satisfazer teste, matriz ou plano histórico.

Durante uma implementação:

- reproduzir antes de corrigir;
- preservar estados posteriores e invariantes laterais;
- fazer TDD focal;
- testar composição pelo ponto de entrada real;
- testar persistência/reload quando material;
- tentar quebrar a própria correção antes de encerrar.

O método completo está em [`docs/architecture/adversarial-analysis-and-implementation-method.md`](docs/architecture/adversarial-analysis-and-implementation-method.md).

## 8. Regra para declarar fechamento

Antes de escrever “fechamento confirmado”, a evidência deve incluir não apenas os gates verdes, mas também uma seção explícita:

> **O que foi tentado para provar que ainda estava errado?**

Conforme o domínio, registrar contraexemplos, sequências entre fluxos, falhas intermediárias, caminhos paralelos, cross-view, migrations sucessoras e reload/releitura.

Sem essa etapa, a conclusão correta é apenas: **“os gates conhecidos passaram”**.

## 9. Resumo de retomada

```text
START_HERE.md
→ consultar main atual
→ verificar PR funcional posterior ainda não reconciliado
→ CURRENT_STATE.md
→ método adversarial
→ achados adversariais conhecidos
→ MASTER_PLAN_CURRENT.md
→ PLAN_TRACEABILITY.md somente se precisar da origem
→ código/testes/ADRs específicos da tarefa
→ analisar/implementar adversarialmente
→ tentar produzir contraexemplo
→ atualizar estado/rastreabilidade/plano no mesmo PR quando o resultado mudar a continuidade
```

Assim, uma sessão nova não depende da memória de chats anteriores para descobrir a regra, a próxima tarefa e, agora, **o padrão mínimo de qualidade da investigação**.