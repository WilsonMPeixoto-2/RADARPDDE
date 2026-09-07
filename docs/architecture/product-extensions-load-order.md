# Cadeia de carregamento das extensões de produto

**Estado:** vigente  
**Atualizado em:** 7 de setembro de 2026

## 1. Finalidade

Registrar a composição efetiva das extensões executadas depois do núcleo da aplicação. A ordem é contrato: algumas integrações envolvem handlers e renderizadores já existentes, portanto uma troca de posição pode alterar o comportamento mesmo quando todos os arquivos continuam presentes.

A autoridade funcional não pertence ao módulo de performance. Desde o PR #282, `operational-write-performance.js` é somente observador da persistência instrumentada; política de consistência e resultado remoto pertence aos serviços/DataService.

## 2. Autoridades de carregamento

A navegação possui uma única cadeia canônica no `auth-gate.js`:

```text
navigation-routes.js
→ navigation-policy.js
→ navigation-bootstrap.js
→ navigation-history.js
→ audit-data-gate.js
```

`painel-controlador-expressiva.js` não carrega mais `navigation-history.js`.

`navigation-routes.js` inicia `product-extensions-bootstrap.js`. A instalação funcional não depende de polling: módulos que precisam dos serviços tentam instalar imediatamente e, quando os serviços ainda não existem, reagem ao marco determinístico `radar:application-services-ready` ou às capacidades do `RadarApplicationReadiness`.

## 3. Readiness central

`RadarApplicationReadiness` registra capacidades sem assumir regra de negócio. As capacidades centrais são:

- `authentication`;
- `data`;
- `application-services`;
- `ui-runtime`;
- `competence`;
- `navigation`.

Capacidades de superfície podem ser restritas sem bloquear toda a aplicação. `audit-data`, por exemplo, controla somente Registros Internos.

A prontidão central complementa, e não substitui, Promises específicas já válidas, como `RadarProductExtensionsReady` e `RadarNavigationContextReady`.

## 4. Cadeia de extensões de produto

`product-extensions-bootstrap.js` mantém carregamento sequencial dos scripts:

```text
01. atomic-analysis-pendency.js
02. domain/school-timeline.js
03. school-timeline.js
04. navigation-context-bootstrap.js
05. controller-guide.js
06. controller-guide-ready.js
07. unidentified-expense-ux.js
08. prontuario-operational-ux.js
09. operational-readiness-bridge.js
10. pendency-passive-queue-ux.js
11. invoice-history-lock.js
12. service-advisory-pendency.js
13. service-advisory-corrective-submission.js
14. critical-action-guard.js
15. operational-write-diagnostics.js
16. operational-write-performance.js
17. prontuario-conditional-reconciler.js
18. operational-write-feedback.js
```

Estilos associados continuam carregados pelo mesmo bootstrap, com marcador `data-radar-product-style` para idempotência.

`atomic-analysis-pendency.js` permanece primeiro porque o handler-base não pode aceitar `Incorreto` sem a proteção atômica. Os scripts críticos de Assessoria e `critical-action-guard.js` continuam fail-closed conforme ADR-052.

## 5. Composição funcional preservada

### Consulta Assessoria

```text
regra base
→ service-advisory-pendency
→ service-advisory-corrective-submission
```

Responsabilidades:

- abertura `Incorreto + Pendência` e reanálise: `service-advisory-pendency.js`;
- novo envio/tentativa corretiva: `service-advisory-corrective-submission.js`.

Nenhuma das duas deve reassumir silenciosamente a responsabilidade da outra.

### Prontuário e escritas inline

A composição relevante é:

```text
renderProntuario base
→ unidentified-expense-ux
→ prontuario-operational-ux
→ prontuario-conditional-reconciler
```

`operational-write-performance.js` pode envolver `DataService.execute()` exclusivamente para marcar início/fim de persistência quando existe trace. Ele não controla renderização, refresh, autoridade de commit ou política de entidades.

`prontuario-conditional-reconciler.js` continua responsável pela reconciliação visual incremental após a escrita, preservando fallback de render integral somente quando necessário.

`operational-write-feedback.js` coordena feedback visual e diagnóstico, sem criar estado de negócio paralelo.

## 6. Instalação determinística

Os instaladores de:

- `invoice-history-lock.js`;
- `operational-write-performance.js`;
- `prontuario-conditional-reconciler.js`;

não usam mais `setInterval` para descobrir os serviços. Cada um:

1. tenta instalar imediatamente;
2. se a dependência ainda não existe, aguarda uma vez `radar:application-services-ready`;
3. mantém idempotência própria.

A mesma direção foi aplicada à competência, navegação, ponte operacional e cadeia de Pendências. Polling não é contrato de readiness.

## 7. Dados tardios e superfícies

`administrativeLogs` não bloqueia mais o Dashboard. O `DataService` permite hidratação tardia apenas para entidades explicitamente classificadas como seguras para aplicação incremental. Nesta frente, somente `administrativeLogs` está autorizado.

`audit-data-gate.js` garante que Registros Internos não renderize histórico parcial: enquanto os logs não estiverem prontos, mostra loading; em falha, restringe apenas essa tela e permite retry.

Nova postergação de dados exige prova de consumidores, aplicação incremental segura e regressão da superfície correspondente. Não é permitido remover entidades do bootstrap inicial somente para melhorar uma métrica.

## 8. Idempotência

Marcadores e contratos relevantes incluem:

- `data-radar-product-style`;
- `data-radar-product-script`;
- `RadarProductExtensionsReady`;
- `RadarApplicationReadiness`;
- `__radarNavigationHistoryInstalled`;
- `__radarOperationalWritePerformance` nos DataServices;
- `__radarConditionalReconciler` / `__radarIncrementalInlineHandler`;
- `__radarOperationalWriteFeedbackInstalled`;
- singletons de diagnóstico/readiness por `window`.

Reexecução não pode duplicar script, estilo, listener, wrapper, observer, botão nem regra funcional.

## 9. Degradação

- falha de observabilidade/performance: fail-open, sem alterar a escrita;
- falha de extensão visual opcional: degrada sem substituir o erro funcional;
- falha de extensão crítica: fail-closed;
- falha de `audit-data`: restringe Registros Internos, não Dashboard;
- falha de autenticação/dados/navegação críticos: impede liberação normal da aplicação.

## 10. Verificação obrigatória

Mudanças nessa cadeia devem validar proporcionalmente:

- ordem de scripts e ausência de carregamento duplicado;
- testes unitários dos instaladores/wrappers;
- E2E de rotas, perfis e viewports;
- Supabase real quando o fluxo remoto é afetado;
- ausência de polling de readiness no runtime observado;
- CodeQL/saúde das dependências;
- Lighthouse conforme política vigente;
- revisão adversarial da autoridade de cada camada.

A observabilidade autenticada de 07/09/2026 confirmou que, após a correção, não há intervalos de readiness de 10/20/25/50 ms em execução. Um único intervalo de 30 s permaneceu observado, compatível com o `autoRefreshToken` intencional do Supabase Auth.
