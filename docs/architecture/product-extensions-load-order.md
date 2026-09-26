# Cadeia de carregamento das extensões de produto

**Estado:** referência vigente  
**Atualizado em:** 26 de setembro de 2026  
**Fonte de verificação:** `src/integration/product-extensions-bootstrap.js`

## 1. Finalidade

Registrar a ordem efetiva das extensões pós-`app.js` e dos estilos do bootstrap de produto. A ordem é contrato quando uma camada depende de outra; diagnóstico/performance não ganham autoridade funcional por estarem na cadeia.

## 2. Scripts atuais

```text
01. src/integration/atomic-analysis-pendency.js
02. src/integration/administrative-log-read-model.js
03. src/domain/school-timeline.js
04. src/integration/school-timeline.js
05. src/integration/navigation-context-bootstrap.js
06. src/integration/controller-guide.js
07. src/integration/controller-guide-ready.js
08. src/integration/unidentified-expense-ux.js
09. src/integration/prontuario-operational-ux.js
10. src/integration/operational-readiness-bridge.js
11. src/integration/operational-context-refresh.js
12. src/integration/operational-realtime-invalidation.js
13. src/integration/pendency-passive-queue-ux.js
14. src/integration/invoice-history-lock.js
15. src/integration/service-advisory-pendency.js
16. src/integration/service-advisory-corrective-submission.js
17. src/integration/critical-action-guard.js
18. src/integration/operational-write-diagnostics.js
19. src/integration/operational-write-performance.js
20. src/integration/prontuario-conditional-reconciler.js
21. src/integration/operational-write-feedback.js
22. src/integration/prontuario-scroll-preservation.js
23. src/integration/auditable-retification.js
24. src/integration/evaluation-retification.js
25. src/integration/evaluation-retification-ui.js
```

## 3. Estilos atuais

```text
01. src/styles/school-timeline.css
02. src/styles/controller-guide.css
03. src/styles/controller-guide-theme.css
04. src/styles/unidentified-expense-ux.css
05. src/styles/prontuario-operational-ux.css
06. src/styles/desktop-basic-monitors.css
07. src/styles/pendency-passive-queue.css
08. src/styles/operational-write-feedback.css
09. src/styles/layout-responsive-2026.css
10. src/styles/inventory-icon-refinement.css
11. src/styles/evaluation-retification-ui.css
12. src/styles/sidebar-prontuario-polish.css
13. src/styles/global-visual-polish.css
```

`layout-responsive-2026.css` é posterior a `desktop-basic-monitors.css` e reconcilia geometria desktop. Testes geométricos devem aguardar a folha final estar carregada/aplicada.

## 4. Extensões críticas

O `criticalScripts` atual inclui:

- `atomic-analysis-pendency.js`;
- `administrative-log-read-model.js`;
- `operational-context-refresh.js`;
- `operational-realtime-invalidation.js`;
- `operational-write-feedback.js`;
- `prontuario-conditional-reconciler.js`;
- `prontuario-scroll-preservation.js`;
- `service-advisory-pendency.js`;
- `service-advisory-corrective-submission.js`;
- `critical-action-guard.js`;
- `auditable-retification.js`;
- `evaluation-retification.js`;
- `evaluation-retification-ui.js`.

Falha crítica não pode degradar silenciosamente para fluxo inseguro.

## 5. Autoridades relevantes

- `operational-context-refresh.js`: releitura contextual segura;
- `operational-realtime-invalidation.js`: invalidação/releitura; Broadcast não é estado canônico;
- `operational-write-diagnostics.js` e `operational-write-performance.js`: observação/medição, não regra de negócio;
- módulos de Assessoria preservam autoridades separadas para edição ordinária, Pendência/reanálise e novo envio;
- retificação auditável/evaluation/UI são camadas distintas e vigentes.

## 6. Readiness

`window.RadarProductExtensionsReady` representa a instalação dos scripts. Ele não é prova de que todas as folhas CSS já foram baixadas e aplicadas.

Por isso, teste de geometria deve sincronizar explicitamente CSS/fonte relevantes quando a medida depender deles.

## 7. Regras de composição

1. uma única instalação por camada;
2. preservar argumentos, retorno e efeitos;
3. declarar dependências;
4. impedir recursão/duplicação;
5. não criar estado de negócio paralelo;
6. fail-open apenas para complemento não crítico;
7. fail-closed para proteção crítica.

## 8. Validação

Ao mudar `scripts`, `styles` ou `criticalScripts`:
- atualizar este documento;
- testar idempotência/readiness;
- validar primeira navegação quando material;
- executar jornadas afetadas;
- aplicar `FRONTEND_USER_VALIDATION_GATE.md`.
