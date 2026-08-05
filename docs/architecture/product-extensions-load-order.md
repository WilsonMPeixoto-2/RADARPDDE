# Cadeia de carregamento das extensões de produto

**Estado:** vigente  
**Atualizado em:** 5 de agosto de 2026

## 1. Finalidade

Registrar a cadeia que executa depois de `app.js`, quando funções e coleções do núcleo estão disponíveis. Complementa [`frontend-load-order.md`](frontend-load-order.md).

As integrações estáticas `view-transitions.js`, `global-search.js` e `floating-ui-bootstrap.js` também são carregadas após `app.js`, mas não pertencem ao bootstrap de timeline e navegação contextual descrito aqui.

## 2. Pré-requisitos

Timeline e navegação contextual dependem de:

- `app.js`;
- Auth gate e perfil aplicado;
- política e histórico de rotas;
- renderizadores de Prontuário, Carteira e Pendências;
- competência global.

Não podem ser antecipadas para a fase de domínio inicial nem criar carregador concorrente.

## 3. Cadeia

```text
index.html
→ app.js
→ view-transitions.js
→ global-search.js
→ floating-ui-bootstrap.js
→ auth-gate.js
→ navigation-bootstrap.js
→ navigation-policy.js
→ navigation-routes.js
→ navigation-history.js
→ product-extensions-bootstrap.js
   ├─ school-timeline.css
   ├─ src/domain/school-timeline.js
   ├─ src/integration/school-timeline.js
   └─ src/integration/navigation-context-bootstrap.js
      ├─ aguarda RadarNavigationHistory
      └─ src/integration/navigation-context.js
```

A cadeia de navegação é instalada de forma idempotente pelo bootstrap acionado após o Auth gate.

## 4. Readiness

### Extensões de produto

```javascript
window.RadarProductExtensionsReady
```

Resolve `true` quando os scripts carregam e `false` em degradação segura. A falha fica em:

```javascript
window.RADAR_LAST_PRODUCT_EXTENSION_ERROR
```

### Navegação contextual

```javascript
window.RadarNavigationContextReady
```

Aguarda `RadarNavigationHistory`, carrega a integração e registra falha em:

```javascript
window.RADAR_LAST_CONTEXTUAL_NAVIGATION_ERROR
```

Timeline e aplicação principal permanecem disponíveis se a navegação contextual falhar.

## 5. Idempotência

Marcadores:

- `data-radar-product-bootstrap`;
- `data-radar-product-style`;
- `data-radar-product-script`;
- `data-radar-navigation-context`;
- `__radarSchoolTimelineIntegrationInstalled`;
- `__radarTimelineWrapped`;
- `__radarNavigationContextInstalled`;
- promessas únicas de readiness.

Repetição não pode duplicar estilos, scripts, observadores, wrappers ou botões.

## 6. Ordem interna

`product-extensions-bootstrap.js` carrega sequencialmente:

1. `/src/domain/school-timeline.js`;
2. `/src/integration/school-timeline.js`;
3. `/src/integration/navigation-context-bootstrap.js`.

Os scripts usam `async = false` e são aguardados em sequência. O módulo contextual somente instala após o histórico de navegação.

## 7. Wrappers

Cada integração deve:

1. capturar a função anterior;
2. instalar uma única camada;
3. preservar argumentos, retorno e efeitos;
4. atualizar a referência global;
5. impedir recursão;
6. não criar rota ou estado paralelo.

## 8. Renderização segura

Timeline e retorno contextual usam criação explícita de elementos, `textContent`, atributos e `dataset` controlados. Conteúdo operacional não deve ser interpolado diretamente em HTML.

## 9. Degradação

Se a extensão falhar:

- Auth, rotas e núcleo continuam disponíveis;
- nenhuma escrita remota é disparada;
- Prontuário original permanece utilizável;
- erro fica disponível para diagnóstico;
- não há troca silenciosa de repositório.

## 10. Verificação

Mudança exige:

- `npm run test:readiness`;
- unitários dos módulos tocados;
- precedência do frontend;
- E2E das superfícies;
- desktop, Android e iPhone;
- Lighthouse;
- ausência de `pageerror`;
- inspeção de scripts, wrappers e observadores duplicados.

## 11. Evolução

Nova extensão pós-`app.js` deve declarar pré-requisitos, marcador de conclusão, idempotência, degradação, interação com wrappers e testes de ordem. Novo carregador concorrente exige ADR.
