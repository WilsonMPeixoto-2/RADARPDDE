# Cadeia de carregamento das extensões de produto

**Estado:** vigente  
**Atualizado em:** 29 de julho de 2026

## 1. Finalidade

Registrar a cadeia efetiva das extensões que precisam executar depois de `app.js`, quando as funções e coleções globais do núcleo legado já estão disponíveis.

Este documento complementa [`frontend-load-order.md`](frontend-load-order.md). O primeiro descreve as camadas gerais e as extensões declaradas por `config.js`; este descreve especificamente o bootstrap pós-`app.js`.

## 2. Motivação

Timeline e navegação contextual dependem de elementos produzidos por:

- `app.js`;
- autenticação e política de rotas;
- `RadarNavigationHistory`;
- renderizadores do Prontuário, Carteira e Pendências;
- contexto global de competência.

Esses módulos não podem ser antecipados para a fase estática sem quebrar seus pré-requisitos. Também não devem criar carregadores concorrentes.

## 3. Cadeia efetiva

```text
index.html
→ app.js
→ auth-gate.js
→ navigation-bootstrap.js
→ navigation-policy.js
→ navigation-routes.js
→ product-extensions-bootstrap.js
   ├─ school-timeline.css
   ├─ src/domain/school-timeline.js
   ├─ src/integration/school-timeline.js
   └─ src/integration/navigation-context-bootstrap.js
      ├─ aguarda RadarNavigationHistory
      └─ src/integration/navigation-context.js
```

`navigation-routes.js` injeta `product-extensions-bootstrap.js` uma única vez.

## 4. Promessas de readiness

### 4.1 Extensões de produto

```javascript
window.RadarProductExtensionsReady
```

Resolve para:

- `true`, quando os scripts declarados no vetor do bootstrap foram carregados;
- `false`, quando uma extensão falhou, preservando a aplicação principal.

A falha é registrada em:

```javascript
window.RADAR_LAST_PRODUCT_EXTENSION_ERROR
```

### 4.2 Navegação contextual

```javascript
window.RadarNavigationContextReady
```

O bootstrap aguarda até dez segundos pela instalação de `RadarNavigationHistory`. Em seguida, carrega `navigation-context.js` e instala a integração.

Falha ou timeout resolvem para `false` e registram:

```javascript
window.RADAR_LAST_CONTEXTUAL_NAVIGATION_ERROR
```

A timeline permanece independente da conclusão da navegação contextual.

## 5. Idempotência

Marcadores vigentes:

- `data-radar-product-bootstrap` — bootstrap pós-`app.js`;
- `data-radar-product-style` — folhas de estilo;
- `data-radar-product-script` — scripts do vetor ordenado;
- `data-radar-navigation-context` — script contextual;
- `__radarSchoolTimelineIntegrationInstalled` — integração da timeline;
- `__radarTimelineWrapped` — wrapper de `renderProntuario`;
- `__radarNavigationContextInstalled` — integração contextual;
- `RadarProductExtensionsReady` e `RadarNavigationContextReady` — promessas únicas.

Repetir a inicialização não pode duplicar estilos, scripts, observadores, wrappers ou botões.

## 6. Ordem interna

O vetor atual de scripts em `product-extensions-bootstrap.js` é:

1. `/src/domain/school-timeline.js`;
2. `/src/integration/school-timeline.js`;
3. `/src/integration/navigation-context-bootstrap.js`.

Cada script usa `async = false` e é aguardado pela redução sequencial de promessas. O módulo contextual carregado pelo último bootstrap também usa `async = false`.

A ordem garante que:

- o domínio da timeline exista antes de sua integração;
- a timeline envolva o Prontuário antes ou depois dos wrappers de rota sem recursão;
- a navegação contextual somente seja instalada após o histórico canônico.

## 7. Composição de wrappers

Timeline e navegação podem envolver renderizadores em ordens relativas distintas. Cada integração deve:

1. capturar a função anterior;
2. instalar um único wrapper;
3. preservar retorno, argumentos e efeitos do estágio anterior;
4. atualizar o vínculo global;
5. impedir recursão por marcador próprio.

Nenhuma extensão substitui as rotas canônicas nem cria fonte paralela de estado.

## 8. Segurança de renderização

Timeline e botão contextual usam DOM seguro:

- `document.createElement`;
- `textContent`;
- `append`, `appendChild` e `replaceChildren`;
- atributos e `dataset` controlados.

Não utilizar `innerHTML` com conteúdo operacional.

## 9. Degradação segura

Se uma extensão falhar:

- autenticação, rotas e aplicação principal continuam disponíveis;
- nenhuma escrita remota é disparada pelo bootstrap;
- o Prontuário original permanece utilizável;
- o erro fica disponível para diagnóstico;
- a falha não autoriza fallback silencioso para outra persistência.

## 10. Verificação obrigatória

Mudanças nesta cadeia exigem:

1. `npm run test:readiness`;
2. testes unitários dos domínios tocados;
3. E2E das superfícies envolvidas;
4. `npm run audit:frontend-precedence:check`;
5. `npm run test:frontend-precedence`;
6. Playwright desktop, Android e iPhone;
7. Lighthouse mobile e desktop;
8. confirmação de ausência de `pageerror`;
9. inspeção de duplicidade de scripts, wrappers e observadores.

## 11. Regra de evolução

Novas extensões pós-`app.js` devem entrar no vetor ordenado existente e possuir:

- pré-requisito global documentado;
- API ou marcador de conclusão;
- inicialização idempotente;
- degradação segura;
- testes de ordem e integração;
- documentação da interação com wrappers existentes.

Novo carregador concorrente exige ADR e prova de que o bootstrap atual não atende ao requisito.
