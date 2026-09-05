# RADAR PDDE — Plano mestre vigente pós-hotfixes

**Atualizado em:** 5 de setembro de 2026  
**Classe:** **ÚNICO PLANO EXECUTÁVEL VIGENTE**  
**Baseline funcional:** PR #260 / merge `8fc58926565a72465980143f253f0a2fee4b8fc2`  
**Checkpoint documental usado na reconciliação:** PR #261 / `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`  
**Origem:** plano source-first do PR #253 reconciliado com #254, #256, #257, #258, #260, #261 e achados adversariais de 05/09/2026.

> Leia primeiro [`../START_HERE.md`](../START_HERE.md). O SHA atual da `main` deve ser consultado no remoto. Se houver PR funcional posterior ainda não absorvido pela documentação corrente, reconcilie-o antes de executar esta fila.

> **Método obrigatório:** toda frente crítica usa [`architecture/adversarial-analysis-and-implementation-method.md`](architecture/adversarial-analysis-and-implementation-method.md). O fato de testes/CI estarem verdes não encerra a análise.

## 1. Objetivo

Concluir somente o trabalho técnico/funcional que continua real **depois** da estabilização do PR #260 e dos achados adversariais posteriores, preservando integralmente as decisões dos hotfixes.

O objetivo não é “terminar o plano antigo”. É terminar o produto atual sem reintroduzir mecanismos, etapas ou regras que os hotfixes já substituíram e sem voltar a confundir validação de regressões conhecidas com descoberta de defeitos desconhecidos.

## 2. Método obrigatório em cada frente

1. consultar a `main` e confirmar que não existe PR funcional posterior ainda não reconciliado;
2. reabrir o código-fonte atual da premissa;
3. produzir inventário/busca ampla quando o escopo justificar;
4. localizar produtores, consumidores, paths laterais e **segunda implementação** da mesma regra;
5. congelar os guardrails de `CURRENT_STATE.md`;
6. mapear `UI real → handler → service → domínio → repository → RPC → persistência → reload → superfícies relacionadas`;
7. procurar estado avançado que possa ser destruído por operação posterior na origem;
8. combinar fluxos individualmente verdes em sequência e tentar produzir contraexemplo;
9. quando houver mudança de código, reproduzir o defeito/dívida atual antes da correção;
10. implementar a menor mudança suficiente;
11. executar validação focal, composição real, persistência/reload e jornadas relacionadas;
12. revisar migrations pela última definição efetiva da assinatura quando aplicável;
13. atualizar `CURRENT_STATE.md` e `PLAN_TRACEABILITY.md` no mesmo PR funcional;
14. atualizar este plano se a entrega concluir, reduzir, reformular ou substituir trabalho remanescente;
15. antes do fechamento, registrar **o que foi tentado para provar que ainda estava errado**;
16. só então avançar.

**Proibido:** alterar regra atual apenas para satisfazer plano, ADR, matriz ou teste histórico; declarar encerrado apenas porque a suíte conhecida passou.

## 3. Guardrails que prevalecem sobre o plano anterior

Preservar:

- novo envio/substituição e reabertura conforme PR #254;
- próximo ator sincronizado conforme PR #256;
- análise fiscal e Consulta Assessoria individuais por `registered_invoice_id`;
- `a_identificar` atômico e sem backfill heurístico;
- `boleto_internet` como tipo de gasto dentro de Notas Fiscais em Educação Conectada;
- NF permanente + número + processo existente → bem `Encaminhada` / **Aguardando Inventariação**;
- NF permanente sem processo → bem `Não encaminhada`;
- somente o ramo `Não encaminhada` exige `Não encaminhada → Encaminhada → Inventariada`;
- agregação `encampInventario` do PR #257;
- vínculo visual NF ↔ bem do PR #258;
- sincronização patrimonial atômica e bloqueio da edição isolada da NF do PR #260;
- guards de gesto repetido já instalados;
- BB Ágil N/A;
- PDDE Básico primeiro apenas na apresentação;
- comunicação externa sem o nome interno;
- Production fail-closed;
- UI de Pendências e exportações homologadas fora de redesign oportunista.

A origem detalhada está em [`PLAN_TRACEABILITY.md`](PLAN_TRACEABILITY.md).

---

# Frente 0 — absorver achados adversariais antes da dívida arquitetural planejada

A auditoria de 05/09/2026 encontrou defeitos e ambiguidades que os gates anteriores não cobriam. Esta frente tem precedência sobre as Frentes 1–8.

## 0A. Reconciliar documentação e método no PR #263

**Escopo documental/governança, sem runtime.**

- institucionalizar o método adversarial;
- registrar achados conhecidos;
- corrigir documentos/testes-documentação que ainda ensinem regra superada;
- ajustar matriz/anchors para definições SQL sucessoras quando necessário;
- registrar que o fechamento semântico anterior foi reaberto;
- preservar a distinção entre bug, dívida arquitetural, histórico legítimo e decisão pendente.

**Gate:** nenhuma afirmação de “fechamento final” enquanto os achados abaixo estiverem fora do plano/estado corrente.

## 0B. Hotfix patrimonial — preservar bem já `Inventariada` ao salvar NF

**Defeito reproduzido:** `buildDesiredAsset` reaplica estado inicial no update e pode rebaixar bem `Inventariada` para `Encaminhada`, mantendo metadados de inventariação.

### Antes da correção

- reproduzir em Supabase descartável a jornada `criar NF → inventariar → salvar novamente a NF → reload`;
- caracterizar no-op;
- caracterizar edição de descrição/valor;
- caracterizar mudanças de tipo/contexto autorizadas;
- confirmar qual operação explícita, se alguma, pode legitimamente reabrir estágio patrimonial.

### Entrega

Separar regra de nascimento da regra de atualização de bem existente. Edição fiscal comum não desfaz inventariação concluída.

### Gate

```text
criar NF permanente
→ bem Encaminhada/Não encaminhada conforme processo
→ inventariar quando aplicável
→ salvar NF novamente
→ persistir
→ reload
→ bem continua Inventariada e metadados coerentes
```

## 0C. Hotfix exportação — auditoria deve preceder download no ponto de entrada real

**Inconsistência de composição reproduzida:** autoridade auditada bloqueia download quando a persistência inicial falha, mas o botão SME real pode usar rota privada que baixa antes da confirmação.

### Antes da correção

- reproduzir no botão real com falha deliberada da auditoria inicial;
- comprovar se o comportamento afeta somente SME ou também CSV/outros botões;
- mapear closures, wrappers e interceptações concorrentes.

### Entrega

Convergir o ponto de entrada real para a autoridade auditada, sem duplicar lógica.

### Gate

```text
clique real
→ auditoria inicial falha
→ zero download
→ UI informa falha
→ nova tentativa legítima continua possível
```

## 0D. Decisões/probes antes de implementação

### Idade total × espera do ator

Contraexemplo reproduzido mostra 35 dias em uma projeção e 1 dia em outra para a mesma Pendência após reanálise incorreta. Definir se são:

- uma única métrica que deve ser unificada;
- duas métricas legítimas com nomes distintos;
- uma métrica por superfície com contrato explícito.

Não mover código antes dessa decisão e de teste diferencial Dashboard/Carteira/Pendências.

### CSV × XLSX institucional

XLSX institucional atual usa competência global ativa por decisão posterior; CSV mantém caminho legado e política de auditoria/tempo diferente. Definir contrato antes de igualar ou separar.

## 0E. Dívidas de risco encontradas, sem hotfix automático

- renderer legado de Pendências com duas abas ainda potencialmente executável por fallback;
- duas derivações ativas de `encampInventario`;
- múltiplas projeções de data/idade/próximo ator;
- ramo fiscal agregado inalcançável dentro de API ativa;
- testes/títulos/fixtures que ainda ensinam regras antigas;
- manipulação direta de `activeCompetenciaKey` em cenário E2E histórico/sintético;
- documentação de competências/exportação anterior às decisões sucessoras.

Esses itens entram nas frentes correspondentes somente depois de caracterização. Não transformar duplicação em bug por reflexo.

---

# Frente 1 — retirar autoridade funcional dos wrappers de performance

## Problema atual confirmado

`src/integration/operational-write-performance.js` ainda injeta políticas como resultado/commit remoto autoritativo, entidades incrementais e refresh exemption. `prontuario-conditional-reconciler.js` ainda depende da presença dessa extensão.

Uma camada chamada “performance” ainda participa da correção funcional. Isso é dívida arquitetural, não motivo para alterar a regra de negócio observada pelo usuário.

## Entrega

- mover políticas funcionais para serviços/DataService/StatePort adequados;
- mover/sanitizar a whitelist de refresh exemption para a camada de dados;
- consolidar reconciliação funcional do Prontuário fora do módulo de performance, sem criar terceiro reconciliador;
- deixar `operational-write-performance.js` como observador fail-open de medição/diagnóstico;
- provar que sua ausência não muda persistência nem DOM funcional.

## Preservações pós-hotfix

Não romper `critical-action-guard.js`, novo envio/reanálise, NF ↔ Inventário, BB Ágil N/A, individualização fiscal ou Assessoria.

## Gate

Mesmas escritas e projeções funcionais com módulo de performance presente ou ausente, incluindo contraexemplo de ausência/falha da extensão.

---

# Frente 2 — readiness determinístico das capacidades

## Problema atual confirmado

A baseline ainda possui polling/composição tardia usados como instalação/readiness e não possui um contrato sistêmico único de `pending/ready/failed/degraded` por capacidade.

## Entrega

### 2A. Contrato mínimo e loader tolerante

- criar contrato mínimo de readiness com dependências e criticidade;
- preservar `RadarProductExtensionsReady` e `radar:application-services-ready` durante a migração;
- distinguir Promise publicada/script carregado de capacidade instalada;
- permitir que falha opcional/restrita não interrompa capacidades independentes;
- manter fail-closed onde a ausência de capacidade crítica torna a operação insegura.

### 2B. Capacidades críticas

Migrar primeiro autenticação/dados/autorização/navegação necessária, proteção atômica `Incorreto + Pendência`, Pendências necessárias à operação segura e instaladores de Assessoria.

### 2C. Capacidades opcionais/restritas

Classificar polling restante e remover apenas o que funciona como contrato de prontidão. `MutationObserver`, feedback visual, medição e timers legítimos não são dívida por definição.

## Preservação do PR #260

`critical-action-guard.js` e sua posição no bootstrap são capacidades funcionais a preservar e provar instaladas.

## Gate

Nenhuma prontidão essencial escondida em polling arbitrário; falha opcional não derruba operação independente; falha controlada de extensão não revive renderer/fluxo legado; fluxos críticos continuam protegidos.

---

# Frente 3 — identidade segura e idempotência durável da NF normal

## O que já foi resolvido

O PR #260 protege repetição **imediata** enquanto a operação está em andamento. Não reimplementar esse guard.

## Dívida atual confirmada

- existem fallbacks persistentes baseados em `Date.now()` em serviços;
- não há `InvoiceSaveIntent` durável para retry ambíguo;
- não há armazenamento server-side de idempotência da NF normal;
- não existe `save_invoice_with_effects_v2` com operation key e resultado composto completo.

## Entrega

### 3A. IDs persistentes seguros

Criar autoridade compartilhada para IDs de negócio com `crypto.randomUUID()` preferencial, fallback criptográfico seguro e falha explícita sem fonte adequada. Não substituir timestamps/IDs diagnósticos por ritual.

### 3B. Intenção de save

Ao aceitar o gesto legítimo, congelar operation key, payload normalizado, IDs e versões. Retry da mesma intenção reutiliza a chave; novo gesto legítimo cria outra.

### 3C. Idempotência server-side

Mesma chave + mesmo request + mesmo ator retorna o mesmo resultado; mesma chave com request diferente gera conflito. Duas chaves diferentes com conteúdo idêntico continuam podendo criar duas despesas legítimas.

### 3D. RPC v2 da NF normal

Criar `save_invoice_with_effects_v2` com idempotência, optimistic concurrency e resposta composta suficiente à reconciliação. Preservar v1 durante rollout e não absorver por conveniência as RPCs especializadas de Pendências/Assessoria.

## Gate

Retry ambíguo, concorrência, conflito de payload, isolamento por ator, rollback, RLS/grants e duas NFs idênticas com chaves distintas.

---

# Frente 4 — projeção operacional única de Pendências

## O que não deve ser reaberto

Salvo defeito comprovado, não mexer novamente em:

- estados/transições;
- substituição em `Aguardando reanálise`;
- reabertura de `Resolvida`/`Cancelada`;
- `canceled_at` terminal;
- `responsavel`/`proximoAtor`.

## Dívida atual confirmada

`pendencias-view-model.js` e `operational-projection.js` ainda possuem cálculos próprios de data-base, idade e próxima ação. A auditoria adversarial confirmou divergência executável de data/idade após retorno à Escola.

## Entrega

Somente depois da decisão da Frente 0D, criar/explicitar núcleo compartilhado para os conceitos realmente comuns. Se “idade total” e “tempo do ator” forem métricas distintas, preservar ambas explicitamente em vez de forçar igualdade.

## Gate

Dashboard, Carteira, Pendências e alertas concordam semanticamente para a mesma Pendência após abertura, envio, reanálise incorreta, resolução, cancelamento e reabertura, com diferenças editoriais/métricas deliberadas nomeadas e testadas.

---

# Frente 5 — save/remove normal de NF autoritativo e incremental

## Baseline a preservar

NF normal pode produzir/remover/atualizar bem, alterar `encampInventario`, reabrir análise derivada e atualizar o Prontuário. A convergência incremental precisa reproduzir **o contrato atual inteiro e preservar estados posteriores já concluídos**.

## Dívida atual confirmada

`invoice:save` e `invoice:remove` ainda não têm a resposta v2 completa prevista na Frente 3 para fechar o caminho normal sem releitura/renderização ampla.

## Entrega

- consumir resposta v2 completa;
- normalizar remoções autoritativas de invoice/asset;
- aplicar invoice, asset upsert/remove, verification e log no StatePort sem releitura quando a resposta estiver completa;
- atualizar localmente lista fiscal, resumo técnico, patrimônio, Assessoria e consolidação quando afetados;
- manter `renderProntuario()` integral apenas como fallback degradado;
- se o commit remoto estiver confirmado e a aplicação local falhar, informar que foi salvo no servidor e que a tela precisa ser atualizada, sem repetir a escrita automaticamente;
- não reaplicar regra de nascimento sobre estado patrimonial avançado.

## Gate

Criar/editar/remover e converter consumo ↔ permanente ↔ serviço, incluindo:

- permanente com processo existente → `Encaminhada` na criação;
- permanente sem processo → `Não encaminhada` na criação;
- bem já `Inventariada` permanece `Inventariada` após edição fiscal comum;
- múltiplos bens e agregação `encampInventario`;
- remoção do último permanente → N/A;
- no-op e log;
- zero refresh das entidades cobertas no caminho feliz;
- fallback seguro quando resposta/aplicação estiver incompleta;
- jornadas de persistência/reload do PR #260 continuam verdes;
- sequências cross-service adversariais também passam.

---

# Frente 6 — gate de equivalência das superfícies

Esta frente **não exige diff**.

Depois das Frentes 4 e 5, executar regressões de projeção/cross-view, quatro abas, busca/filtros, drawer/timeline, novo envio/reanálise/substituição/reabertura, XLSX de Pendências, perfis, acessibilidade/mobile quando material e Prontuário fiscal/patrimonial.

Adicionar comparação diferencial do mesmo registro entre superfícies e pelo menos um contraexemplo cross-flow por domínio crítico.

Se tudo passar, registrar a frente como concluída sem modificar o produto.

---

# Frente 7 — instrumentação causal e otimização condicionada

## 7A. Instrumentação

Medir, de forma local e fail-open, fronteiras reais do startup: auth, sessão, Supabase, leituras, normalização, StatePort, primeiro render, capacidades críticas e interação útil.

Sem PII/token/payload e sem transmissão externa. Relatório reproduzível com mediana, pior caso e dispersão.

## 7B. Otimização somente com causa medida

Uma otimização entra apenas com fase dominante, mecanismo causal, baseline, ruído e orçamento definidos antes do código. Se nenhuma hipótese superar ruído/custo, encerrar sem diff.

Não relaxar thresholds para fazer o gate passar.

---

# Frente 8 — fechamento integral e novo rebaseline

No SHA funcional final:

1. reconciliar `main`, Vercel e Supabase;
2. migrations/tipos e últimas definições efetivas de RPCs tocadas;
3. unitários/integração;
4. pgTAP/RLS/Auth;
5. banco limpo;
6. backup/restauração;
7. Playwright completo e jornadas reais;
8. perfis/viewports;
9. Excel/exportações, incluindo falha pré-download;
10. CodeQL/dependências;
11. Lighthouse;
12. matriz funcional;
13. revisão adversarial;
14. documentação de continuidade;
15. relatório explícito **“o que tentamos para provar que ainda estava errado?”**.

Reutilizar a infraestrutura de gates já existente. Não reconstruir o que o PR #260 deixou funcionando.

ADR-051 permanece em frente separada depois do fechamento, salvo nova decisão expressa.

## 4. Ordem executável

```text
Frente 0A — documentação/método/achados
→ Frente 0B — hotfix patrimonial Inventariada
→ Frente 0C — hotfix auditoria pré-download
→ Frente 0D — decisões/probes pendentes
→ Frente 1 — autoridade funcional fora de performance
→ Frente 2 — readiness determinístico
→ Frente 3 — IDs/intenção/idempotência da NF normal
→ Frente 4 — projeção de Pendências após decisão semântica
→ Frente 5 — convergência autoritativa/incremental de NF
→ Frente 6 — gate de equivalência adversarial
→ Frente 7A — instrumentação causal
→ Frente 7B — otimização somente se medida
→ Frente 8 — fechamento/rebaseline adversarial
```

**Esta é a única fila executável vigente.**