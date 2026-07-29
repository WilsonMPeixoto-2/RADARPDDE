# Cadeia de carregamento das extensões de produto

## 1. Finalidade

Este documento complementa `frontend-load-order.md` após a criação da timeline cronológica. Os números históricos daquela auditoria continuam descrevendo o baseline anterior; a cadeia registrada aqui é adicional e executa depois de `app.js`.

## 2. Motivação

A timeline precisa acessar funções e variáveis globais léxicas definidas pelo núcleo, inclusive `renderProntuario`, competência ativa e coleções operacionais. Por isso, domínio e integração não podem ser executados antes de `app.js`.

Também não se deve inserir novos scripts diretamente depois de `auth-gate.js`, pois esse módulo já inicia a composição assíncrona das rotas canônicas. A solução adotada cria um bootstrap idempotente acionado por `navigation-routes.js`.

## 3. Ordem efetiva

```text
index.html
→ app.js
→ auth-gate.js
→ navigation-routes.js
→ product-extensions-bootstrap.js
→ school-timeline.css
→ src/domain/school-timeline.js
→ src/integration/school-timeline.js
```

`navigation-routes.js` apenas injeta o bootstrap. O carregador registra:

```javascript
window.RadarProductExtensionsReady
```

O valor é uma `Promise` que resolve para `true` quando todas as extensões foram carregadas e inicializadas. Em falha, resolve para `false`, registra `RADAR_LAST_PRODUCT_EXTENSION_ERROR` e preserva a aplicação principal.

## 4. Idempotência

Cada camada possui marcador próprio:

- `data-radar-product-bootstrap` para o bootstrap;
- `data-radar-product-style` para folhas de estilo;
- `data-radar-product-script` para scripts;
- `__radarSchoolTimelineIntegrationInstalled` para a integração;
- `__radarTimelineWrapped` para o wrapper de `renderProntuario`.

A repetição do bootstrap não duplica folhas, scripts, observadores ou wrappers.

## 5. Composição com navegação

A cadeia de rotas e a timeline podem terminar em ordens relativas diferentes sem perder comportamento:

- quando a navegação envolve `renderProntuario` primeiro, a timeline captura o wrapper da navegação;
- quando a timeline envolve primeiro, a navegação captura o wrapper da timeline.

Em ambos os casos, o vínculo global é atualizado e cada wrapper mantém referência ao estágio anterior.

A nova aba não pertence à lista fechada histórica de `activateProntuarioTab`. A integração tenta a ativação canônica e, quando rejeitada, aplica a mesma alternância de classes dentro do escopo do Prontuário. Nenhuma rota nova é criada nesta entrega.

## 6. Segurança de renderização

A timeline é montada com:

- `document.createElement`;
- `textContent`;
- `append` e `appendChild`;
- `replaceChildren`;
- atributos e `dataset` definidos explicitamente.

Não é utilizado `innerHTML`. A extensão não aumenta o limite histórico de avisos `nounsanitized/property`.

## 7. Degradação segura

Se o bootstrap ou a timeline falharem:

- o Prontuário original continua disponível;
- nenhuma escrita é realizada;
- nenhuma tabela ou estado derivado é criado;
- o erro fica disponível para diagnóstico;
- os demais módulos de navegação e autenticação continuam independentes.

## 8. Verificação obrigatória

Mudanças nesta cadeia exigem:

1. readiness sem aumento do débito de lint;
2. testes unitários da projeção;
3. E2E da aba e dos recortes por perfil;
4. teste de precedência do frontend;
5. Playwright desktop, Android e iPhone;
6. Lighthouse mobile e desktop;
7. Supabase local e migration smoke, ainda que não exista alteração de banco;
8. confirmação de ausência de `pageerror`.

## 9. Regra de evolução

Novas extensões pós-`app.js` devem ser acrescentadas no vetor ordenado de `product-extensions-bootstrap.js` e possuir:

- API ou marcador de conclusão explícito;
- inicialização idempotente;
- degradação segura;
- documentação do pré-requisito global;
- testes de ordem e integração.

Não adicionar carregadores concorrentes sem ADR e sem demonstrar que o bootstrap atual não atende ao requisito.