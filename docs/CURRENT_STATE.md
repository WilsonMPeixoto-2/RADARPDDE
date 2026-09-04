# RADAR PDDE — Estado corrente para continuidade

**Atualizado em:** 4 de setembro de 2026  
**Classe:** estado operacional corrente, curto e canônico  
**Main:** `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`  
**Baseline funcional em Production:** PR #260, merge `8fc58926565a72465980143f253f0a2fee4b8fc2`  
**Head funcional certificado antes do merge:** `c3d6fc2374476a4884cfebc2f4236e346ccf2700`

> Antes de usar este arquivo, leia [`../START_HERE.md`](../START_HERE.md). Se a `main` tiver avançado além do SHA acima, não execute automaticamente o plano: primeiro reconcilie os PRs posteriores.

## 1. Ambiente publicado

- Vercel Production do fechamento do PR #260: `dpl_EmgxYkMpprpY2wLTRFk4bJQA4L2e`, READY no merge funcional `8fc589...`;
- Supabase Production: 46 migrations;
- migration mais recente da baseline funcional: `20260904040000_functional_reliability_inventory_sync`;
- RPC patrimonial `save_asset_with_verification_and_log` presente na baseline;
- integridade registrada no fechamento do #260: `production_integrity_check()` com `totalIssues = 0`;
- o PR #261 alterou somente documentação e produziu a `main` `876c597...`; não alterou runtime nem banco.

Valores voláteis de deployment/ambiente devem ser reconsultados quando a tarefa depender deles.

## 2. Linha recente que define o estado atual

O último plano reconciliado antes da nova sequência de hotfixes foi o PR #253. Depois dele foram integrados:

`#254 → #256 → #257 → #258 → #260 → #261`.

Esses PRs prevalecem sobre o texto anterior do plano nas superfícies que alteraram.

O PR #262 foi fechado sem merge. Não integra a baseline e não deve ser usado para inferir regra vigente.

## 3. Regras sensíveis a regressão

### Pendências

- estados: `Aberta`, `Aguardando reanálise`, `Resolvida`, `Cancelada`;
- `Aberta` e `Aguardando reanálise` são estados ativos;
- novo envio não resolve a Pendência;
- é permitido registrar o primeiro envio corretivo e também substituir o envio mais recente enquanto a Pendência aguarda reanálise, sob os contratos atuais;
- reanálise correta resolve; incorreta reabre para ação da Escola;
- `Resolvida` e `Cancelada` podem ser reabertas quando a operação for autorizada;
- próximo ator documental: `Aberta → Escola`, `Aguardando reanálise → Controlador`, terminal → nenhum;
- cancelamento histórico não deve reaparecer como `canceled_at` atual depois de reabertura;
- bonificação, análise técnica e Pendência continuam dimensões independentes.

### Notas Fiscais / `a_identificar` / Assessoria

- análise/Pendência fiscal individual usa `registered_invoice_id`;
- `a_identificar` novo nasce tecnicamente `Incorreto` + Pendência individual obrigatória na mesma operação protegida;
- identificação posterior preserva o mesmo `registered_invoice_id`;
- não fazer backfill heurístico dos legados legítimos;
- Consulta Assessoria é individual por NF de serviço e o agregado mensal é recalculado pela precedência das análises individuais;
- `boleto_internet` é **tipo de gasto dentro de Notas Fiscais**, somente em Educação Conectada; não é documento autônomo.

### Capital e Inventário

- NF permanente cria/vincula o bem patrimonial;
- **com processo de inventário já cadastrado e número de NF:** bem novo entra `Encaminhada`, exibido como **Aguardando Inventariação**;
- **sem processo:** bem novo entra `Não encaminhada`;
- se um bem está `Não encaminhada`, não pode ir direto a `Inventariada`; nesse ramo a sequência é `Não encaminhada → Encaminhada → Inventariada`;
- `encampInventario` agregado: nenhum permanente = `Não se aplica`; algum não encaminhado = `Não`; todos encaminhados/inventariados = `Sim`;
- a análise técnica derivada não é aprovada automaticamente quando o conjunto patrimonial muda;
- Prontuário exibe NF, bem, valor e status pelo vínculo técnico `bemId`/`linked_asset_id`;
- encaminhamento posterior sincroniza bem + verificação + log atomicamente;
- número da NF de bem derivado não pode ser alterado isoladamente no cadastro patrimonial;
- novo envio, reanálise, encaminhamento e inventariação possuem contenção de gesto repetido durante operação em andamento; Nota Fiscal preserva seu guard existente.

### Outros guardrails já consolidados

- Declaração BB Ágil aceita N/A sob o contrato vigente; Pendência ativa bloqueia a troca para N/A;
- `RADAR PDDE` não aparece em comunicação oficial externa gerada;
- PDDE Básico aparece primeiro apenas na apresentação, sem alterar ordem persistida de programas;
- Pendências são passivo transversal e a tela pode trabalhar em todas as competências;
- Production é fail-closed;
- Supabase CLI 2.116.0 permanece rejeitado especificamente; versões futuras são avaliadas normalmente;
- Lighthouse desktop mantém seus thresholds; medição usa três rodadas + mediana;
- duas NFs de conteúdo idêntico podem ser despesas legítimas distintas.

## 4. Provas funcionais que já existem

O PR #260 deixou como baseline jornadas reais que devem ser preservadas e reaproveitadas:

- `tests/e2e/supabase-functional-reliability.spec.js`;
- `tests/e2e/supabase-invoice-lifecycle-reliability.spec.js`;
- `tests/e2e/supabase-verification-reliability.spec.js`;
- jornada autenticada de Pendências/reanálise;
- testes de `critical-action-guard`;
- pgTAP/RLS/Auth, backup/restauração, perfis/viewports, Excel, CodeQL, dependências e Lighthouse já fazem parte da infraestrutura de gate.

Teste verde não redefine regra de negócio. Quando houver conflito, primeiro verificar se o teste representa o contrato atual.

## 5. Trabalho realmente remanescente

O plano executável atual está em [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md). Em resumo, ainda permanecem:

1. retirar autoridade funcional que ainda vive em wrappers de performance;
2. substituir readiness essencial baseado em polling por contrato determinístico, preservando as extensões críticas atuais;
3. completar identidade segura/intenção/idempotência durável da NF normal, sem refazer guards imediatos já existentes;
4. unificar a projeção operacional de Pendências onde ainda há cálculo duplicado de data-base/idade/ação;
5. completar o caminho normal autoritativo/incremental de save/remove de NF sobre o contrato atual de NF ↔ bem ↔ verificação;
6. executar gate de equivalência das superfícies depois dessas mudanças;
7. instrumentar causalmente o bootstrap e otimizar somente se a medição justificar;
8. reexecutar o fechamento integral no SHA final.

## 6. Documentos de continuidade

- **Começar sempre em:** [`../START_HERE.md`](../START_HERE.md)
- **Plano executável:** [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md)
- **Por que o plano mudou:** [`PLAN_TRACEABILITY.md`](PLAN_TRACEABILITY.md)
- **Histórico detalhado anterior:** `CURRENT_STAGE.md`, handoffs, ADRs, audits e planos datados.

Documentação histórica é evidência de seu checkpoint. Ela não constitui uma segunda fila executável.
