# Cadeia de carregamento das extensões de produto

**Estado:** vigente para a baseline funcional do PR #260  
**Atualizado em:** 5 de setembro de 2026

> Para continuidade do projeto, comece em [`../../START_HERE.md`](../../START_HERE.md). Para a ordem física efetiva, `src/integration/product-extensions-bootstrap.js` do SHA corrente continua sendo a fonte executável; este documento deve acompanhá-lo.

## 1. Finalidade

Registrar a composição que executa depois de `app.js` e explicar quais partes da ordem são funcionais, quais são de diagnóstico e quais dívidas ainda pertencem ao plano atual.

## 2. Entrada pela navegação

`auth-gate.js` carrega os módulos de navegação na ordem prevista pelo contrato atual. `navigation-routes.js` instala dinamicamente `product-extensions-bootstrap.js`; portanto, as extensões não são um segundo aplicativo nem um carregador concorrente.

A rota pendente só é aplicada quando os pré-requisitos funcionais de dados, autorização, competência e histórico de navegação estão disponíveis.

## 3. Estilos carregados pelo bootstrap

A baseline atual carrega:

```text
school-timeline.css
controller-guide.css
controller-guide-theme.css
unidentified-expense-ux.css
prontuario-operational-ux.css
desktop-basic-monitors.css
pendency-passive-queue.css
operational-write-feedback.css
```

## 4. Ordem efetiva dos scripts no PR #260

A sequência atual em `product-extensions-bootstrap.js` é:

```text
01. src/integration/atomic-analysis-pendency.js
02. src/domain/school-timeline.js
03. src/integration/school-timeline.js
04. src/integration/navigation-context-bootstrap.js
05. src/integration/controller-guide.js
06. src/integration/controller-guide-ready.js
07. src/integration/unidentified-expense-ux.js
08. src/integration/prontuario-operational-ux.js
09. src/integration/operational-readiness-bridge.js
10. src/integration/pendency-passive-queue-ux.js
11. src/integration/invoice-history-lock.js
12. src/integration/service-advisory-pendency.js
13. src/integration/service-advisory-corrective-submission.js
14. src/integration/critical-action-guard.js
15. src/integration/operational-write-diagnostics.js
16. src/integration/operational-write-performance.js
17. src/integration/prontuario-conditional-reconciler.js
18. src/integration/operational-write-feedback.js
```

`critical-action-guard.js` foi incorporado pelo PR #260 e é parte da baseline atual. Qualquer documento ou teste que apresente a cadeia sem esse módulo descreve um checkpoint anterior.

## 5. Motivos funcionais da ordem

### Proteção atômica primeiro

`atomic-analysis-pendency.js` permanece o primeiro script funcional porque `Incorreto` não pode cair no handler-base sem a proteção que exige análise + Pendência quando o contrato assim determina.

### UX e navegação antes dos fluxos especializados

Timeline, contexto de navegação, Guia do Controlador e refinamentos do Prontuário dependem do núcleo já carregado. Eles não criam uma segunda fonte de dados.

### Assessoria mantém autoridades separadas

```text
service-advisory-pendency.js
→ abertura Incorreto + Pendência e reanálise

service-advisory-corrective-submission.js
→ novo envio/substituição corretiva
```

Nenhum desses módulos deve absorver silenciosamente a responsabilidade do outro.

### Guard de ação crítica antes do diagnóstico/performance

`critical-action-guard.js` protege as operações críticas adicionadas pelo PR #260 contra repetição do mesmo gesto enquanto a primeira chamada está em andamento. Ele precisa estar instalado antes das camadas de diagnóstico/performance que observam a escrita.

Na baseline atual, a proteção cobre novo envio, reanálise, encaminhamento e inventariação; o submit de Nota Fiscal preserva seu guard próprio já existente.

### Diagnóstico antes de performance

`operational-write-diagnostics.js` fornece correlação local/fail-open. Sua ausência não deve bloquear regra de negócio.

### Performance antes do reconciliador

Na baseline atual, `operational-write-performance.js` ainda injeta parte da política funcional de consistência e participa do caminho incremental. Isso é **dívida conhecida da Frente 1 do `MASTER_PLAN_CURRENT.md`**, não uma arquitetura a ser perpetuada apenas porque aparece aqui.

`prontuario-conditional-reconciler.js` é carregado depois e hoje ainda depende dessa composição. A Frente 1 deve retirar a autoridade funcional do módulo de performance preservando o comportamento atual.

### Feedback por último

`operational-write-feedback.js` fecha a cadeia. O listener em capture phase permite feedback imediato sem transformar feedback visual em autoridade de persistência.

## 6. Readiness corrente

`window.RadarProductExtensionsReady` representa a conclusão/degradação da cadeia atual.

Depois de carregar os scripts, o bootstrap também confirma a instalação das extensões críticas de Assessoria. Se a cadeia falhar, registra `RADAR_LAST_PRODUCT_EXTENSION_ERROR` e retorna degradação segura conforme o contrato vigente.

A baseline ainda carrega scripts sequencialmente por uma Promise encadeada; uma falha de transporte anterior pode impedir módulos independentes posteriores. **Essa é a dívida real da Frente 2 do plano vigente.** O plano não autoriza remover timers indiscriminadamente, apenas substituir readiness essencial baseado em polling/ordem frágil por um contrato determinístico.

## 7. Idempotência de instalação

O bootstrap e as integrações usam marcadores para evitar estilos, scripts, listeners, wrappers e observadores duplicados. Repetir a instalação não pode duplicar controles ou autoridade funcional.

Isso é diferente da idempotência durável de uma operação de negócio após resposta ambígua. O PR #260 resolveu repetição imediata em ações críticas; a dívida durável da NF normal continua na Frente 3.

## 8. Regra para alterações futuras

Mudança nesta cadeia exige:

1. conferir o bootstrap do SHA atual;
2. declarar dependências e criticidade do novo módulo;
3. preservar a autoridade única dos fluxos críticos;
4. testar ordem e instalação real no navegador;
5. atualizar este documento no mesmo PR se a ordem efetiva mudar;
6. atualizar `CURRENT_STATE.md` e `PLAN_TRACEABILITY.md` se a mudança alterar continuidade, regra ou plano.

Não criar outro carregador ou wrapper funcional apenas porque uma responsabilidade parece ausente sem antes procurar a autoridade atual.
