# Navegação contextual e retorno seguro

## 1. Finalidade

A navegação contextual complementa as rotas canônicas do RADAR PDDE. Ela não cria um segundo roteador e não substitui o histórico do navegador.

O recurso resolve o retorno de telas de aprofundamento para a origem operacional real, preservando o contexto necessário para que o usuário continue o trabalho sem reconstruir manualmente a tela anterior.

## 2. Superfícies contextuais

São consideradas superfícies de aprofundamento:

- Prontuário da unidade;
- Pendências operacionais abertas a partir de Dashboard, Carteira ou Prontuário.

Telas raiz, como Dashboard, Carteira e Competências, não recebem botão de retorno contextual.

Modais continuam usando **Fechar** ou **Cancelar**. A navegação contextual não interfere nesses controles.

## 3. Componentes

### Histórico canônico

```text
src/integration/navigation-history.js
```

Continua responsável por URL canônica, histórico do navegador, autorização e fallback de rota.

### Contexto de retorno

```text
src/integration/navigation-context.js
```

É responsável por:

- capturar a origem antes da entrada em uma superfície contextual;
- manter uma pilha limitada na sessão;
- restaurar competência, rota, scrollport, posição e foco;
- inserir o botão **Voltar para …** por DOM seguro;
- usar Carteira como fallback quando a origem não existe.

### Bootstrap

```text
src/integration/navigation-context-bootstrap.js
```

Aguarda a instalação de `RadarNavigationHistory` e só então carrega o módulo contextual. O bootstrap é carregado por `src/integration/product-extensions-bootstrap.js`.

## 4. Contrato persistido

A pilha é mantida em `sessionStorage`:

```text
radar_pdde_navigation_return_context_v1
```

Cada item possui:

```javascript
{
  version: 1,
  capturedAt,
  origin: { view, param, section, filters },
  target: { view, param, section, filters },
  competenceKey,
  scrollTarget, // content-area ou window
  scrollY,
  focus: { id, schoolId, pendencyRef, action }
}
```

A pilha é limitada a 12 itens e existe somente durante a sessão da aba. Não é persistida no Supabase nem incorporada a logs administrativos. Contextos antigos sem `scrollTarget` permanecem compatíveis e usam `window` como fallback.

## 5. Captura

A origem é capturada quando a transição entra em `prontuario` ou `pendencias` a partir de outra tela. Não há nova captura quando a navegação ocorre entre abas do mesmo Prontuário.

Links canônicos `a[data-radar-route="true"]` são observados na fase de captura do evento. O próprio link acionado é usado como fonte prioritária do descritor de foco, evitando depender do foco automático dos navegadores móveis.

Chamadas legadas de `switchView()` permanecem cobertas por wrapper compatível.

## 6. Scrollport responsivo

No desktop, o layout principal usa `main.content-area` como área rolável. Em layouts móveis, a rolagem pode ocorrer em `window` e `document.scrollingElement`.

A captura detecta o scrollport efetivamente deslocado:

1. `main.content-area`, quando rolável e com posição própria;
2. `window` e `document.scrollingElement` como fallback.

O contexto armazena separadamente `scrollTarget` e `scrollY`. Na restauração, a posição é aplicada antes do foco e reaplicada depois dele para neutralizar deslocamentos residuais.

## 7. Retorno e foco

O retorno segue esta ordem:

1. retirar o último contexto da pilha;
2. restaurar a competência global;
3. navegar por `RadarNavigationHistory.navigate()`;
4. aguardar a renderização inicial;
5. restaurar scrollport e posição;
6. acompanhar por até 30 frames a representação visível do alvo;
7. aplicar foco com `preventScroll` quando o alvo aparece ou perde o foco;
8. refocar a nova representação quando a lista substitui o elemento durante a estabilização;
9. confirmar o alvo visível final;
10. reaplicar a posição do scrollport;
11. recalcular o botão contextual.

A vigilância possui limite determinístico, equivalente a uma janela curta de estabilização. A ausência do alvo não bloqueia a navegação nem cria repetição contínua.

A busca do foco usa `id`, referência da pendência, ação ou identificador da escola. Antes da seleção, candidatos ocultos são descartados quando apresentam:

- atributo `hidden`;
- `aria-hidden="true"` no elemento ou ancestral;
- estado `disabled`;
- `display: none` ou `visibility: hidden`;
- ausência de retângulo visível no layout.

Essa filtragem evita focar a tabela oculta no layout de cartões ou o cartão oculto no layout de tabela.

## 8. Fallback

Quando a tela é acessada diretamente, por nova aba, favorito ou URL compartilhada, o botão é exibido como **Voltar para Carteira**. O retorno navega para `/carteira`, leva o scrollport ativo ao topo e não cria entrada artificial na pilha.

## 9. Segurança e privacidade

O contexto armazena somente dados de interface necessários ao retorno. Não armazena nomes de pessoas, e-mails, telefones, observações, valores financeiros ou conteúdo documental.

A montagem do botão usa `createElement`, `textContent` e atributos controlados. Não utiliza `innerHTML`. A reaplicação é idempotente para não retroalimentar o `MutationObserver`.

## 10. Compatibilidade

O recurso preserva rotas canônicas, Voltar/Avançar do navegador, abertura em nova aba, autorização por perfil, seletor global de competência, filtros de origem e layouts desktop, Android e iPhone.

## 11. Testes

### Unidade

```text
tests/unit/navigation-context.test.js
tests/unit/navigation-context-delayed-focus.test.js
tests/unit/navigation-context-scrollport.test.js
tests/unit/navigation-context-visible-focus.test.js
tests/unit/navigation-context-focus-monitor.test.js
```

Comprovam normalização, pilha em sessão, competência, rotas, scrollports responsivos, foco tardio, seleção do alvo visível, substituição responsiva do elemento durante a estabilização, idempotência e fallback.

### Jornada

```text
tests/e2e/canonical-routes.spec.js
```

Comprova em desktop, Android e iPhone:

- abertura do Prontuário a partir da Carteira;
- presença do botão contextual;
- captura da escola, competência e scrollport efetivo;
- retorno para `/carteira`;
- preservação da competência;
- restauração da posição no scrollport real;
- foco na representação visível da unidade.

## 12. Critério de aceite

O ciclo somente pode ser mesclado quando readiness, migrations, Supabase local, Playwright desktop/Android/iPhone, Lighthouse e dependências estiverem aprovados no mesmo SHA documentado.
