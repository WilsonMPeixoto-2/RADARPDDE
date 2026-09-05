# RADAR PDDE — Estado corrente para continuidade

**Atualizado em:** 5 de setembro de 2026  
**Classe:** estado operacional corrente, curto e canônico  
**Baseline funcional reconciliada:** PR #260 / merge `8fc58926565a72465980143f253f0a2fee4b8fc2`  
**Head funcional certificado antes do merge:** `c3d6fc2374476a4884cfebc2f4236e346ccf2700`  
**Checkpoint documental de entrada:** PR #261 / `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`

> Antes de usar este arquivo, leia [`../START_HERE.md`](../START_HERE.md). O SHA corrente da `main` deve ser consultado no remoto; este documento não congela um SHA documental como autoridade eterna.

## 1. Ambiente publicado da última baseline funcional

No fechamento do PR #260:

- Vercel Production: `dpl_EmgxYkMpprpY2wLTRFk4bJQA4L2e`, READY no merge funcional `8fc589...`;
- Supabase Production: 46 migrations;
- migration mais recente: `20260904040000_functional_reliability_inventory_sync`;
- RPC patrimonial `save_asset_with_verification_and_log` presente;
- `production_integrity_check()` registrou `totalIssues = 0`.

O PR #261 alterou somente documentação. O PR #263 também é exclusivamente documental/governança e não altera runtime, schema ou Production.

Valores voláteis de deployment/ambiente devem ser reconsultados quando a tarefa depender deles.

## 2. Linha recente que define o estado atual

O último plano reconciliado antes da sequência urgente foi o PR #253. Depois dele foram integrados:

```text
#254 → #256 → #257 → #258 → #260 → #261
```

Esses PRs prevalecem sobre o texto anterior do plano nas superfícies que alteraram e foram absorvidos por `PLAN_TRACEABILITY.md` e `MASTER_PLAN_CURRENT.md`.

O PR #262 foi fechado sem merge. Não integra a baseline e não deve ser usado para inferir regra vigente.

## 3. Regras sensíveis a regressão

### Pendências

- estados: `Aberta`, `Aguardando reanálise`, `Resolvida`, `Cancelada`;
- `Aberta` e `Aguardando reanálise` são estados ativos;
- novo envio não resolve a Pendência;
- é permitido registrar o primeiro envio corretivo e substituir o envio mais recente enquanto a Pendência aguarda reanálise, conforme o contrato posterior ao PR #254;
- reanálise correta resolve; incorreta/arquivo indisponível reabre para ação da Escola;
- `Resolvida` e `Cancelada` podem ser reabertas quando autorizado;
- próximo ator: `Aberta → Escola`, `Aguardando reanálise → Controlador`, terminal → nenhum;
- cancelamento histórico não reaparece como `canceled_at` atual depois de reabertura;
- bonificação, análise técnica e Pendência permanecem dimensões independentes.

### Notas Fiscais / `a_identificar` / Assessoria

- análise/Pendência fiscal individual usa `registered_invoice_id`;
- `a_identificar` novo nasce tecnicamente `Incorreto` + Pendência individual obrigatória na mesma operação protegida;
- identificação posterior preserva o mesmo `registered_invoice_id`;
- não fazer backfill heurístico dos legados legítimos;
- Consulta Assessoria é individual por NF de serviço; agregado mensal é derivado do conjunto individual;
- `boleto_internet` é **tipo de gasto dentro de Notas Fiscais**, somente em Educação Conectada; não é documento autônomo.

### Capital e Inventário

- NF permanente cria/vincula o bem patrimonial;
- **com processo de inventário já cadastrado e número de NF:** bem novo entra `Encaminhada`, exibido como **Aguardando Inventariação**;
- **sem processo:** bem novo entra `Não encaminhada`;
- se um bem está `Não encaminhada`, não pode ir direto a `Inventariada`; nesse ramo a sequência é `Não encaminhada → Encaminhada → Inventariada`;
- `encampInventario`: nenhum permanente = `Não se aplica`; algum não encaminhado = `Não`; todos encaminhados/inventariados = `Sim`;
- a análise técnica derivada não é aprovada automaticamente quando o conjunto patrimonial muda;
- Prontuário exibe NF, bem, valor e status pelo vínculo técnico `bemId`/`linked_asset_id`;
- encaminhamento posterior sincroniza bem + verificação + log atomicamente;
- número da NF de bem derivado não pode ser alterado isoladamente no cadastro patrimonial;
- novo envio, reanálise, encaminhamento e inventariação possuem contenção de gesto repetido durante operação em andamento; Nota Fiscal preserva seu guard existente.

### Avaliação mensal e competência

- competência global é única via `RadarCompetenceContext`;
- Pendências é passivo transversal e pode trabalhar em Todas as competências;
- competências futuras podem ser vistas, mas não editadas nas operações mensais protegidas;
- Declaração BB Ágil aceita N/A quando cabível; Pendência ativa do mesmo documento bloqueia a troca para N/A;
- Extrato de Conta Corrente e Extrato de Investimento não usam N/A para conclusão;
- PDDE Básico aparece primeiro apenas na apresentação, sem alterar ordem persistida dos programas;
- consolidação e retificação permanecem operações distintas; retificação exige justificativa e histórico.

### Perfis, escolas e Gestão de Equipe

- Controlador não redistribui `controller_id` pela edição cadastral comum;
- Assistente opera transversalmente na CRE e administra carteira/equipe pelas operações autorizadas;
- SME possui visão gerencial e configurações/programas autorizados, mas não mutações operacionais de Pendências só por poder visualizar;
- Inventário opera o recorte patrimonial autorizado;
- `technical_admin` é papel técnico real; simulação visual não altera JWT;
- Gestão de Equipe usa `DirectoryService → TeamAccountGateway → team-account-management → Auth Admin + RPC`, com CORS/JWT/papel, lookup exato e compensação.

### Outros guardrails consolidados

- comunicação oficial externa gerada não expõe `RADAR PDDE`;
- Production é fail-closed;
- Supabase CLI 2.116.0 permanece rejeitado especificamente; versões futuras são avaliadas normalmente;
- Lighthouse desktop mantém thresholds atuais e metodologia de três rodadas + mediana;
- duas NFs de conteúdo idêntico podem ser despesas legítimas distintas;
- Excel SME mantém o contrato público de 27 colunas A:AA;
- XLSX de Pendências respeita filtros e não expõe IDs técnicos.

## 4. Provas funcionais que já existem

O PR #260 deixou como baseline jornadas reais que devem ser preservadas e reaproveitadas:

- `tests/e2e/supabase-functional-reliability.spec.js`;
- `tests/e2e/supabase-invoice-lifecycle-reliability.spec.js`;
- `tests/e2e/supabase-verification-reliability.spec.js`;
- jornada autenticada de Pendências/reanálise;
- testes de `critical-action-guard`;
- pgTAP/RLS/Auth, backup/restauração, perfis/viewports, Excel, CodeQL, dependências e Lighthouse.

Teste verde não redefine regra de negócio. Quando houver conflito, primeiro verificar se o teste representa o contrato atual.

## 5. Auditoria semântica de continuidade

A reconciliação completa de documentação, decisões, hotfixes e código está registrada em:

[`audits/2026-09-05-continuity-semantic-traceability-complete.md`](audits/2026-09-05-continuity-semantic-traceability-complete.md)

Ela substitui o ledger WIP usado durante a investigação. A auditoria não criou novas regras por inferência: quando uma afirmação não tinha suporte suficiente em decisão/código atual, ela não foi promovida a contrato corrente.

## 6. Trabalho realmente remanescente

O único plano executável está em [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md). Em resumo:

1. retirar autoridade funcional que ainda vive em wrappers de performance;
2. substituir readiness essencial baseado em polling/composição frágil por contrato determinístico, preservando extensões críticas;
3. completar identidade segura/intenção/idempotência durável da NF normal, sem refazer guards imediatos já existentes;
4. unificar a projeção operacional de Pendências onde ainda há cálculo duplicado de data-base/idade/ação;
5. completar o caminho normal autoritativo/incremental de save/remove de NF preservando NF ↔ bem ↔ verificação;
6. executar gate de equivalência das superfícies;
7. instrumentar causalmente o bootstrap e otimizar somente se medição justificar;
8. reexecutar fechamento integral no SHA final.

## 7. Documentos de continuidade

- **Começar sempre em:** [`../START_HERE.md`](../START_HERE.md)
- **Plano executável:** [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md)
- **Origem e absorção do plano:** [`PLAN_TRACEABILITY.md`](PLAN_TRACEABILITY.md)
- **Decisões correntes:** [`DECISION_LOG.md`](DECISION_LOG.md)
- **Contexto funcional:** [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md)
- **Histórico de checkpoints:** [`CURRENT_STAGE.md`](CURRENT_STAGE.md), handoffs, ADRs, audits e planos datados.

Documentação histórica é evidência de seu checkpoint. Não constitui segunda fila executável.