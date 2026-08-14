# Cadeia de carregamento das extensões de produto

**Estado:** vigente  
**Atualizado em:** 14 de agosto de 2026

## 1. Finalidade

Registrar a cadeia que executa depois de `app.js`, quando funções e coleções do núcleo estão disponíveis. Complementa [`frontend-load-order.md`](frontend-load-order.md).

As integrações estáticas `view-transitions.js`, `global-search.js` e `floating-ui-bootstrap.js` também são carregadas após `app.js`, mas não pertencem ao bootstrap descrito aqui.

## 2. Pré-requisitos

Timeline, navegação contextual, Guia do Controlador e refinamentos pós-render do Prontuário dependem de:

- `app.js`;
- Auth gate e perfil aplicado;
- política e histórico de rotas;
- renderizadores de Prontuário, Carteira e Pendências;
- competência global.

Não podem ser antecipados para a fase de domínio inicial nem criar carregador concorrente.

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
   ├─ controller-guide.css
   ├─ controller-guide-theme.css
   ├─ prontuario-operational-ux.css
   ├─ src/domain/school-timeline.js
   ├─ src/integration/school-timeline.js
   ├─ src/integration/navigation-context-bootstrap.js
   │  ├─ aguarda RadarNavigationHistory
   │  └─ src/integration/navigation-context.js
   ├─ src/integration/controller-guide.js
   ├─ src/integration/controller-guide-ready.js
   │  └─ reaplica a integração do guia após RadarNavigationContextReady
   └─ src/integration/prontuario-operational-ux.js
      └─ decora o DOM final do Prontuário sem criar estado de negócio
```

A cadeia de navegação é instalada de forma idempotente pelo bootstrap acionado após o Auth gate. O Guia do Controlador é uma superfície de ajuda sem persistência de negócio e fica disponível para todos os perfis autenticados. A extensão `prontuario-operational-ux.js` é carregada por último para trabalhar sobre o DOM final produzido pelos wrappers anteriores.

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

Timeline, guia, refinamento do Prontuário e aplicação principal permanecem independentes de mutações de backend.

### Guia do Controlador

```javascript
window.RadarControllerGuide
```

O guia:

- injeta a opção `Guia do Controlador` após Pendências Operacionais;
- permanece visível para Controlador, Assistente, Gestão SME e Equipe de Inventário;
- mantém conteúdo orientado ao trabalho do Controlador sem ampliar capacidades do perfil que o consulta;
- utiliza capturas reais sanitizadas da linha de base visual já versionada no repositório;
- oferece busca interna e atalhos para as telas operacionais;
- usa `window.print()` com folha A4 e estilos próprios para permitir `Salvar como PDF` no navegador;
- não lê nem grava dados de negócio.

### Refinamento operacional do Prontuário

```javascript
window.RadarProntuarioOperationalUx
```

A integração:

- envolve `renderProntuario` depois dos wrappers já existentes;
- identifica o início de cada grupo pelo `rowspan` de competência/programa já produzido pelo núcleo;
- adiciona classes de apresentação para separar visualmente programas;
- move o `<label>` com o checkbox existente de envio à Assessoria para dentro da caixa da respectiva NF de serviço;
- preserva o mesmo `aria-label`, estado `checked` e handler `toggleInvoiceAdvisorySent()`;
- mantém os selects individuais de análise técnica e o resumo mensal na linha Consulta Assessoria;
- não cria, duplica, recalcula ou persiste estado de negócio.

## 5. Idempotência

Marcadores e contratos:

- `data-radar-product-bootstrap`;
- `data-radar-product-style`;
- `data-radar-product-script`;
- `data-radar-navigation-context`;
- `__radarSchoolTimelineIntegrationInstalled`;
- `__radarTimelineWrapped`;
- `__radarNavigationContextInstalled`;
- `__radarControllerGuideWrapped`;
- `window.RadarProntuarioOperationalUx`;
- promessas únicas de readiness.

Repetição não pode duplicar estilos, scripts, observadores, wrappers, botões nem controles de negócio. No refinamento do Prontuário, mover novamente o mesmo `<label>` para o mesmo cartão é idempotente e não cria um segundo checkbox.

## 6. Ordem interna

`product-extensions-bootstrap.js` carrega sequencialmente:

1. `/src/domain/school-timeline.js`;
2. `/src/integration/school-timeline.js`;
3. `/src/integration/navigation-context-bootstrap.js`;
4. `/src/integration/controller-guide.js`;
5. `/src/integration/controller-guide-ready.js`;
6. `/src/integration/prontuario-operational-ux.js`.

Os scripts usam `async = false` e são aguardados em sequência. Como a navegação contextual termina sua instalação de forma assíncrona, `controller-guide-ready.js` aguarda `RadarNavigationContextReady` e solicita novamente a instalação idempotente do wrapper do guia. O refinamento do Prontuário fica por último para envolver a versão final de `renderProntuario` e decorar o DOM depois dos demais efeitos pós-render.

## 7. Wrappers

Cada integração deve:

1. capturar a função anterior;
2. instalar uma única camada;
3. preservar argumentos, retorno e efeitos;
4. atualizar a referência global;
5. impedir recursão;
6. não criar estado de negócio paralelo.

O guia intercepta apenas a pseudo-visão local `guia-controlador`; ao usar seus atalhos, devolve a navegação às funções normais do RADAR. A disponibilidade transversal do guia não altera as regras de acesso das telas de destino.

`prontuario-operational-ux.js` não intercepta comandos: apenas chama o render anterior e depois reorganiza/classes o DOM resultante.

## 8. Renderização segura

Timeline e retorno contextual usam criação explícita de elementos, `textContent`, atributos e `dataset` controlados. O Guia do Controlador usa conteúdo editorial estático e caminhos de imagens versionados; nenhum dado operacional digitado pelo usuário é interpolado no HTML do guia.

O refinamento do Prontuário não usa `innerHTML` para reconstruir as notas ou controles. Ele localiza elementos já produzidos pelo núcleo, acrescenta classes e move o nó DOM do checkbox existente. Dessa forma, mantém o handler e evita criar uma segunda fonte visual ou funcional para o estado da Assessoria.

## 9. Degradação

Se uma extensão de apresentação falhar:

- Auth, rotas e núcleo continuam disponíveis;
- nenhuma escrita remota é disparada pela falha;
- as telas operacionais permanecem utilizáveis;
- o problema fica isolado na camada complementar.

Se `prontuario-operational-ux.js` não carregar, o Prontuário volta ao layout anterior: checkbox na linha Consulta Assessoria e separação visual original. A lógica e a persistência continuam funcionando pelo núcleo.

Se a navegação contextual falhar, o núcleo e o conteúdo do guia permanecem carregáveis, mas atalhos contextuais podem se limitar à navegação base.

## 10. Verificação proporcional

Para mudança restrita ao refinamento operacional do Prontuário, validar:

- carregamento da extensão e do CSS pela cadeia oficial;
- existência de um checkbox por NF de serviço dentro do cartão correto;
- inexistência de checkbox duplicado na linha Consulta Assessoria;
- manutenção dos selects individuais de análise técnica;
- manutenção do resumo mensal agregado;
- marcadores de início de programa para múltiplos programas;
- comportamento responsivo sem perda de conteúdo;
- ausência de nova regressão material nos gates automáticos do repositório.

Não é necessário repetir migrations, backup/restauração ou mutações Supabase quando nenhum contrato de dados, Auth, RLS, RPC ou persistência tiver sido alterado.

## 11. Evolução

Nova extensão pós-`app.js` deve declarar pré-requisitos, marcador de conclusão, idempotência, degradação, interação com wrappers e testes de ordem. Novo carregador concorrente exige ADR.
