# Ordem de carregamento e precedência do frontend

**Estado:** vigente  
**Atualizado em:** 5 de agosto de 2026

## 1. Finalidade

Registrar a ordem efetiva de scripts, estilos e bootstraps antes de mover, fundir, remover ou renomear recursos.

A aplicação combina:

1. CSS e scripts estáticos do `index.html`;
2. configuração pública e validação fail-closed;
3. extensões ordenadas de `config.js`;
4. domínio, persistência e serviços;
5. núcleo `app.js`;
6. integrações modernas pós-núcleo;
7. Auth gate, navegação e extensões de produto;
8. runtime Excel assíncrono e recuperável.

## 2. Verificação reproduzível

```bash
npm run audit:frontend-precedence
npm run audit:frontend-precedence:check
npm run test:frontend-precedence
```

O manifesto em `docs/evidence/frontend-precedence/manifest.json` é gerado. Não editar contagens manualmente.

## 3. CSS

### Estático

1. `styles.css`;
2. `src/styles/shared-interactions.css`.

### Inserido por `config.js`

1. `src/styles/mobile-responsive.css`;
2. `src/styles/mobile-rendering-hotfix.css`;
3. `src/styles/task-9-pendencias.css`;
4. `src/styles/task-9-cross-view.css`;
5. `src/styles/task-10-11-pendency-actions.css`;
6. `src/styles/task-12-13-retificacoes.css`;
7. `src/styles/cycle-b-carteira.css`;
8. `src/styles/cycle-b-dashboard.css`;
9. `src/styles/cycle-b-dashboard-final.css`;
10. `src/styles/painel-controlador-expressiva.css`.

### Extensões de produto

`product-extensions-bootstrap.js` adiciona `src/styles/school-timeline.css`.

Repetição de seletor não prova conflito. Consolidação exige computed styles e regressão visual nos breakpoints.

## 4. Scripts estáticos antes de `app.js`

Ordem declarada em `index.html`:

### Domínio inicial

1. `src/domain/competencia.js`;
2. `src/domain/estatisticas.js`;
3. `src/domain/fluxo-operacional.js`;
4. `src/domain/pendencias.js`;
5. `src/domain/access-policy.js`;
6. `src/domain/global-search-index.js`;
7. `src/domain/retificacoes.js`, já marcado para deduplicação.

### Configuração

8. `config.runtime.js`;
9. `config.js`.

`config.js` valida ambiente, modo de dados, URL e chave publicável, bloqueia chave administrativa e registra extensões antes do bootstrap da aplicação.

### Cliente e persistência

10. `vendor/supabase-client.js`;
11. `src/data/repository-contract.js`;
12. `vendor/ajv.js`;
13. `src/domain/json-contracts.js`;
14. `src/application/error-mapper.js`;
15. `src/auth/session-service.js`;
16. `src/integration/auth-bootstrap.js`;
17. `src/data/local-storage-repository.js`;
18. `src/data/supabase-repository.js`;
19. `src/data/repository-factory.js`;
20. `src/data/snapshot-tools.js`;
21. `src/data/import-coordinator.js`;
22. `src/data/legacy-state-adapter.js`;
23. `src/data/state-bridge.js`;
24. `src/data/state-bridge-metadata.js`.

### Aplicação

25. `src/application/state-port.js`;
26. `src/application/unit-of-work.js`;
27. `src/application/data-service.js`;
28. `src/application/configuration-service.js`;
29. `src/application/directory-service.js`;
30. `src/application/school-service.js`;
31. `src/application/pendency-service.js`;
32. `src/application/verification-service.js`;
33. `src/application/audit-service.js`;
34. `src/application/invoice-service.js`;
35. `src/application/inventory-service.js`;
36. `src/integration/shared-interactions.js`.

### Núcleo

37. `app.js`.

## 5. Integrações estáticas pós-`app.js`

38. `src/integration/view-transitions.js`;
39. `src/integration/global-search.js`;
40. `src/integration/floating-ui-bootstrap.js`;
41. `src/integration/auth-gate.js`.

### View Transitions

- envolve navegação principal iniciada pelo usuário;
- respeita `prefers-reduced-motion`;
- não anima montagem inicial;
- degrada para navegação normal.

### Busca global

- usa `global-search-index.js` já carregado;
- carrega Fuse.js sob demanda;
- mantém fallback funcional;
- respeita o universo autorizado.

### Floating UI

- carrega o bundle local sob demanda;
- posiciona menus e resultados com fallback;
- fecha por Escape ou clique externo;
- restaura foco.

## 6. Extensões ordenadas por `config.js`

Scripts inseridos com `async = false`:

1. `src/domain/pendencias-view-model.js`;
2. `src/domain/operational-projection.js`;
3. `src/domain/retificacoes.js`;
4. `src/integration/mobile-navigation.js`;
5. `src/integration/modal-accessibility.js`;
6. `src/integration/task-9-pendencias-page.js`;
7. `src/integration/task-9-focus-bridge.js`;
8. `src/integration/task-9-cross-view.js`;
9. `src/integration/task-10-11-pendency-actions.js`;
10. `src/integration/task-12-13-retificacoes.js`;
11. `src/integration/cycle-b-carteira.js`;
12. `src/integration/cycle-b-dashboard.js`;
13. `src/integration/cycle-b-dashboard-result.js`;
14. `src/integration/task-10-alerts-competence.js`;
15. `src/integration/exercise-management.js`;
16. `src/integration/exercise-early-init.js`;
17. `src/integration/painel-controlador-expressiva.js`.

A marca `data-radar-extension` impede duplicação de `retificacoes.js`.

## 7. Runtime Excel

`config.js` insere `src/integration/load-excel-export.js` com `async = true`.

O bootstrap Excel versão 2.0.0 mantém estado `idle/loading/ready/failed`, timeout de 15 segundos, remoção de script fracassado e retry.

Módulos sequenciais:

1. `/src/domain/excel-export-model.js`;
2. `/src/domain/excel-workbook-plan.js`;
3. `/src/domain/excel-xlsx-renderer.js`;
4. `/src/domain/excel-sme-export-model.js`;
5. `/src/domain/excel-sme-template-renderer.js`;
6. `/src/domain/excel-sme-monthly-renderer.js`;
7. `/src/integration/excel-sme-runtime-loader.js`;
8. `/src/integration/excel-export-integration.js`.

Um `<script>` existente somente é aceito se o contrato global esperado estiver pronto. Falha, timeout ou contrato inválido remove o elemento e permite nova tentativa.

## 8. Auth, rotas e extensões de produto

Após `auth-gate.js`, a cadeia de navegação instala política, rotas, histórico e extensões pós-núcleo. O detalhe permanece em [`product-extensions-load-order.md`](product-extensions-load-order.md).

Resumo:

```text
auth-gate
→ navigation bootstrap/policy/routes/history
→ product-extensions-bootstrap
→ timeline
→ navigation-context-bootstrap
→ navigation-context
```

A aplicação operacional permanece inerte até a autorização terminar.

## 9. Composição de wrappers

Módulos podem envolver renderizadores globais. Cada wrapper deve:

- capturar a função anterior;
- instalar uma única camada;
- preservar argumentos, retorno e efeitos;
- marcar idempotência;
- evitar recursão;
- não criar estado paralelo.

Ordem incorreta pode capturar `undefined`, perder comportamento ou duplicar observadores.

## 10. Polling e observadores

`MutationObserver` e polling limitado sustentam compatibilidade com renderização tardia do núcleo. Remoção exige entrypoint explícito equivalente e testes de duplicidade, foco e responsividade.

## 11. Regras para mudança

1. não mover módulo antes de sua dependência;
2. não remover marcador de deduplicação sem inventário de consumidores;
3. não fundir CSS por repetição textual;
4. não tornar o loader Excel síncrono sem medir bootstrap;
5. não criar carregador concorrente sem ADR;
6. atualizar manifesto e este documento quando a ordem mudar;
7. executar readiness, precedência, E2E, mobile e Lighthouse;
8. verificar `pageerror`, scripts duplicados, wrappers e observadores;
9. confirmar assets no artefato Vercel;
10. registrar evidência no mesmo SHA.

## 12. Limites

A auditoria estática não substitui execução. Especificidade, herança, ordem de resolução assíncrona e wrappers somente são comprovados por inspeção de runtime e testes das superfícies afetadas.
