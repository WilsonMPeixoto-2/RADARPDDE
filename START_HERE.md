# RADAR PDDE — START HERE

**Esta é a única porta de entrada operacional do projeto.**

**Última baseline funcional reconciliada:** PR #260 / merge `8fc58926565a72465980143f253f0a2fee4b8fc2`  
**Checkpoint documental de entrada:** PR #261 / `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`  
**Consolidação de continuidade:** PR #263, exclusivamente documental/governança  
**Auditoria adversarial posterior:** 05/09/2026, com achados ainda não absorvidos em runtime  
**Atualizado em:** 5 de setembro de 2026

> Se você é um novo chat, agente ou sessão retomando o RADAR PDDE, **não escolha um plano, handoff, ADR ou SHA antigo antes de seguir este arquivo**.

> **Mudança metodológica obrigatória:** gates verdes, suíte verde, integridade atual saudável e documentação reconciliada não provam ausência de defeitos desconhecidos. Toda análise ou implementação crítica deve aplicar o método adversarial e seu playbook reproduzível.

## 1. Primeiro: consulte a `main` atual

Antes de analisar, planejar ou alterar:

1. consulte a `main` remota e o SHA exato;
2. confirme PRs funcionais integrados depois da baseline reconciliada;
3. diferencie `main`, PR candidato, PR documental e PR abortado;
4. se houver PR funcional posterior ainda não refletido em `CURRENT_STATE.md`/`PLAN_TRACEABILITY.md`, reconcilie antes de executar plano;
5. verifique defeitos/ambiguidades adversariais ainda abertos;
6. só então siga a ordem de leitura.

A referência funcional continua sendo #260 até que um PR funcional sucessor, acompanhado da documentação obrigatória, estabeleça nova baseline.

## 2. Ordem obrigatória de leitura

1. [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) — estado funcional, regras e defeitos conhecidos;
2. [`docs/architecture/adversarial-analysis-and-implementation-method.md`](docs/architecture/adversarial-analysis-and-implementation-method.md) — princípios obrigatórios;
3. [`docs/architecture/adversarial-analysis-replication-playbook.md`](docs/architecture/adversarial-analysis-replication-playbook.md) — procedimento técnico reproduzível extraído dos artefatos Astra;
4. [`docs/audits/2026-09-05-astra-adversarial-findings.md`](docs/audits/2026-09-05-astra-adversarial-findings.md) — ledger dos achados;
5. [`docs/audits/2026-09-05-astra-artifact-package-review.md`](docs/audits/2026-09-05-astra-artifact-package-review.md) — revisão dos artefatos reais da auditoria;
6. [`docs/MASTER_PLAN_CURRENT.md`](docs/MASTER_PLAN_CURRENT.md) — **ÚNICO PLANO EXECUTÁVEL VIGENTE**;
7. [`docs/PLAN_TRACEABILITY.md`](docs/PLAN_TRACEABILITY.md) — origem/absorção quando necessário;
8. [`AGENTS.md`](AGENTS.md) — regras permanentes de trabalho;
9. código, testes, ADRs, migrations e evidências específicos da tarefa.

Não existe outra ordem de leitura concorrente.

## 3. Regra de precedência

Para uma superfície alterada ao longo do tempo:

```text
última decisão funcional deliberada / hotfix posterior implementado
→ código e banco resultantes
→ testes que representam o contrato atual
→ documentação corrente reconciliada
→ histórico do checkpoint anterior
```

Isso **não** torna código atual automaticamente correto. Documento/teste antigo não pode revogar decisão posterior sem prova, e código posterior pode conter defeito que precisa ser reproduzido.

Quando fontes atuais concordarem, ainda é obrigatório tentar produzir contraexemplos e procurar autoridades concorrentes antes de chamar a revisão de completa.

## 4. Linha recente

Último plano corretamente reconciliado antes dos hotfixes: PR #253.

Depois foram integrados:

```text
#254 → #256 → #257 → #258 → #260 → #261
```

PR #262 foi **ABORTADO E FECHADO SEM MERGE** e não define regra vigente.

PR #263 é documental/governança. O fechamento semântico que havia sido registrado para ele foi **reaberto** após a auditoria adversarial encontrar defeitos, ambiguidades e artefatos obsoletos.

## 5. Planos históricos

- `docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md` — histórico do checkpoint de 03/09;
- `docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md` — histórico anterior;
- demais handoffs/auditorias/planos datados — evidência de seus checkpoints.

**A única fila executável é `docs/MASTER_PLAN_CURRENT.md`.**

## 6. Regra para novos hotfixes

1. partir do código atual;
2. reproduzir o defeito antes de corrigir;
3. aplicar método/playbook adversarial para procurar causa, segunda autoridade e efeitos laterais;
4. fazer TDD focal;
5. testar ponto de entrada real, persistência/reload e sequência adjacente quando materiais;
6. atualizar `CURRENT_STATE.md` e `PLAN_TRACEABILITY.md` no mesmo PR;
7. atualizar `MASTER_PLAN_CURRENT.md` se o trabalho remanescente mudou;
8. atualizar documentos correntes afetados;
9. só então retomar a fila.

## 7. Regra para auditorias

Uma auditoria crítica deve, proporcionalmente ao risco:

- gerar inventário mecânico amplo;
- registrar cobertura por arquivo/linha;
- mapear `UI real → handler → service → domínio → repository → RPC → persistência → reload → superfícies`;
- procurar segunda implementação, closure, wrapper, callback, fallback, renderer legado e chamada direta;
- testar `criar → avançar → voltar à origem → salvar/editar → reload`;
- combinar fluxos individualmente verdes em sequência;
- comparar a mesma entidade entre projeções;
- auditar os próprios testes/fixtures;
- resolver SQL/RPC pela última definição efetiva da assinatura;
- criar probes focalizados antes de suítes caras;
- coletar evidência remota sem confundi-la com prova de ausência de bug;
- salvar artefatos progressivamente para não perder trabalho por cota/contexto.

## 8. Regra para implementações

Implementação crítica herda o mesmo método:

```text
contraexemplo reproduzido
→ causa raiz
→ autoridades/consumidores laterais
→ RED
→ mudança mínima
→ GREEN focal
→ ponto de entrada real
→ persistência/reload
→ sequência adjacente
→ tentativa adversarial de quebrar a correção
→ gates amplos
```

Não misturar refatoração estética com hotfix, salvo quando a duplicação for a própria causa raiz.

## 9. Critério de fechamento

Antes de escrever **“fechamento confirmado”**, registrar explicitamente:

> **O que foi tentado para provar que ainda estava errado?**

Conforme o domínio, isso inclui:

- contraexemplos;
- sequências entre fluxos verdes;
- retorno à origem após estado avançado;
- caminhos paralelos procurados;
- falhas intermediárias injetadas;
- cross-view/projeções;
- reload/releitura;
- migrations sucessoras;
- classificação de testes/fixtures históricos.

Sem isso, a conclusão correta é apenas:

> **os gates conhecidos passaram**.

## 10. Resumo de retomada

```text
START_HERE
→ main/SHA/PRs
→ CURRENT_STATE
→ método adversarial
→ playbook reproduzível
→ achados/evidências Astra
→ MASTER_PLAN_CURRENT
→ código específico
→ investigar por contraexemplos
→ implementar somente o comprovado
→ tentar quebrar a própria solução
→ atualizar continuidade
```

A sessão futura não deve depender da memória de chats anteriores para saber nem a regra atual nem o padrão mínimo de qualidade da investigação.
