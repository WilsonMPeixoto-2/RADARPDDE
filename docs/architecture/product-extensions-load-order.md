# Cadeia de carregamento das extensões de produto

**Estado:** vigente  
**Atualizado em:** 23 de agosto de 2026

## 1. Finalidade

Registrar a cadeia que executa depois de `app.js`, quando funções e coleções do núcleo estão disponíveis. Complementa [`frontend-load-order.md`](frontend-load-order.md).

Este documento descreve a ordem efetiva de `product-extensions-bootstrap.js` após os PRs #190–#194. A ordem é contrato porque várias extensões envolvem funções globais já existentes e dependem do wrapper anterior.

As integrações estáticas `view-transitions.js`, `global-search.js` e `floating-ui-bootstrap.js` também são carregadas após `app.js`, mas não pertencem ao bootstrap descrito aqui.

## 2. Pré-requisitos

As extensões de produto dependem de:

- `app.js`;
- Auth gate e perfil aplicado;
- política e histórico de rotas;
- renderizadores de Prontuário, Carteira e Pendências;
- competência global;
- serviços de aplicação publicados em `RadarApplicationServices` quando a extensão atua sobre escritas.

Não podem ser antecipadas para a fase de domínio inicial nem criar carregador concorrente.

## 3. Cadeia efetiva

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
   ├─ styles
   │  ├─ school-timeline.css
   │  ├─ controller-guide.css
   │  ├─ controller-guide-theme.css
   │  ├─ unidentified-expense-ux.css
   │  ├─ prontuario-operational-ux.css
   │  ├─ desktop-basic-monitors.css
   │  ├─ pendency-passive-queue.css
   │  └─ operational-write-feedback.css
   └─ scripts, sequencialmente
      01. src/domain/school-timeline.js
      02. src/integration/school-timeline.js
      03. src/integration/navigation-context-bootstrap.js
      04. src/integration/controller-guide.js
      05. src/integration/controller-guide-ready.js
      06. src/integration/unidentified-expense-ux.js
      07. src/integration/prontuario-operational-ux.js
      08. src/integration/operational-readiness-bridge.js
      09. src/integration/pendency-passive-queue-ux.js
      10. src/integration/atomic-analysis-pendency.js
      11. src/integration/invoice-history-lock.js
      12. src/integration/service-advisory-pendency.js
      13. src/integration/service-advisory-corrective-submission.js
      14. src/integration/operational-write-diagnostics.js
      15. src/integration/operational-write-performance.js
      16. src/integration/prontuario-conditional-reconciler.js
      17. src/integration/operational-write-feedback.js
```

Os scripts são criados com `async = false` e aguardados em sequência pela cadeia de Promises do bootstrap.

## 4. Motivos da ordem

### Timeline e navegação

`school-timeline.js`, `navigation-context-bootstrap.js`, Guia do Controlador e refinamentos de UX precisam encontrar o núcleo já inicializado. `controller-guide-ready.js` reaplica de forma idempotente a integração do guia depois de `RadarNavigationContextReady`.

### Extensões operacionais anteriores à escrita incremental

`atomic-analysis-pendency.js`, `invoice-history-lock.js`, `service-advisory-pendency.js` e `service-advisory-corrective-submission.js` definem/refinam contratos funcionais que devem existir antes de os wrappers de desempenho envolverem os handlers finais.

A separação de Assessoria é deliberada e agora protegida pela ADR-052:

- `service-advisory-pendency.js`: abertura `Incorreto + Pendência` e reanálise;
- `service-advisory-corrective-submission.js`: `registerAttempt()` / novo envio corretivo;
- nenhum dos dois deve reassumir silenciosamente a responsabilidade do outro;
- `navigation-routes.js` deve continuar instalando `product-extensions-bootstrap.js`;
- o E2E `critical-product-extensions.spec.js` comprova que a cadeia foi realmente instalada no navegador.

A ordem preserva:

```text
regra funcional final
→ instrumentação/política de escrita
→ reconciliação
→ feedback da interação
```



### Cadeias de wrappers que exigem ordem estável

A revisão pós-PR #215 confirmou que a ordem não é apenas otimização. Existem cadeias reais de substituição de handlers:

```text
closeModal
app.js
→ atomic-analysis-pendency
→ service-advisory-pendency

registerAttempt
PendencyService
→ service-advisory-corrective-submission

renderProntuario
app.js
→ unidentified-expense-ux
→ prontuario-operational-ux
→ operational-write-performance
→ prontuario-conditional-reconciler
```

Essas cadeias devem ser tratadas como composição deliberada. Inserir novo wrapper entre elas exige justificar a autoridade e atualizar a regressão `critical-product-extension-authority.test.js`. Um wrapper novo não pode substituir silenciosamente uma responsabilidade funcional já existente.

### Diagnóstico antes de performance

`operational-write-diagnostics.js` precisa carregar antes de `operational-write-performance.js` porque a camada de performance consulta a API global de diagnóstico no momento em que envolve DataServices e handlers.

O diagnóstico cria uma única probe por `window`, limitada em memória e fail-open. A interface pública é somente leitura:

```javascript
window.RadarOperationalWriteMetrics.snapshot()
window.RadarOperationalWriteMetrics.summary()
```

A interface interna de correlação permanece em `RadarOperationalWriteDiagnostics` e não deve ser usada como estado de negócio.

### Performance antes do reconciliador e feedback

`operational-write-performance.js` instala a política de retorno/commit autoritativo, envolve persistência quando há trace e preserva o caminho incremental das escritas inline.

`prontuario-conditional-reconciler.js` deve existir depois dessa política para atuar sobre o estado/DOM já orientado ao fluxo incremental sem reintroduzir render integral no caminho normal.

`operational-write-feedback.js` é carregado por último. Seu listener usa capture phase, por isso abre a amostra e aplica feedback visual antes de o handler inline executar, mesmo sendo o último script da cadeia. Em seguida o wrapper de performance consome o trace enfileirado para medir RPC, aplicação local e estabilização.

## 5. Caminho de uma escrita inline instrumentada

Para handlers suportados:

- `toggleBonif`;
- `changeAnaliseTecnica`;
- `toggleInvoiceAdvisorySent`;
- `changeInvoiceAdvisoryAnalysis`;
- `toggleConsEnviada`.

O fluxo normal é:

```text
capture click/change
→ diagnostics: click
→ feedback pendente imediato
→ diagnostics: feedback
→ wrapper inline consome trace
→ DataService persist
   ├─ diagnostics: rpcStart
   └─ diagnostics: rpcEnd
→ retorno autoritativo / estado local
→ diagnostics: applyStart
→ reconciliação escola + competência + programa
→ diagnostics: applyEnd
→ requestAnimationFrame/microtask
→ diagnostics: stable
```

Falha da instrumentação não bloqueia nenhuma dessas etapas. Se não existir probe, trace ou Performance API, a operação funcional segue normalmente.

## 6. Segurança e privacidade das métricas

A instrumentação operacional é exclusivamente local e efêmera.

Ela pode registrar apenas:

- id sequencial efêmero da amostra;
- nome técnico do handler;
- timestamps monotônicos das fases;
- durações calculadas.

Não registrar em métrica:

- escola;
- usuário/e-mail;
- competência;
- programa;
- NF;
- pendência;
- UUID de entidade;
- texto ou valor de negócio.

Não há envio para Supabase, Vercel ou terceiros, nem persistência em LocalStorage/IndexedDB.

`performance.mark()`/`performance.measure()` são usados quando disponíveis. Marcas usam apenas id efêmero e fase técnica, e são limpas ao encerrar a amostra. `PerformanceObserver`, quando suportado, serve apenas para consumir/limpar medidas locais.

## 7. Readiness

### Extensões de produto

```javascript
window.RadarProductExtensionsReady
```

Resolve `true` quando a cadeia carrega e `false` em degradação segura. A falha fica em:

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

### Diagnóstico operacional

```javascript
window.RadarOperationalWriteMetrics
```

É diagnóstico técnico somente leitura. A ausência dessa interface não torna o produto indisponível e não altera persistência.

## 8. Idempotência

Marcadores/contratos relevantes incluem:

- `data-radar-product-style`;
- `data-radar-product-script`;
- `__radarSchoolTimelineIntegrationInstalled`;
- `__radarTimelineWrapped`;
- `__radarNavigationContextInstalled`;
- `__radarControllerGuideWrapped`;
- `window.RadarProntuarioOperationalUx`;
- `__radarOperationalWritePerformance` nos DataServices;
- `__radarIncrementalInlineHandler` nos handlers;
- `__radarOperationalWriteFeedbackInstalled` no documento;
- singleton de `operational-write-diagnostics.js` por root;
- promessas únicas de readiness.

Repetição não pode duplicar estilos, scripts, observadores, probes, listeners, wrappers, botões nem controles de negócio.

A própria operação funcional também respeita idempotência semântica quando o contrato correspondente prevê que repetir o mesmo valor não gere nova persistência, `row_version` ou log.

## 9. Wrappers

Cada integração deve:

1. capturar a função anterior;
2. instalar uma única camada;
3. preservar argumentos, retorno e efeitos;
4. atualizar a referência global quando esse for o contrato da extensão;
5. impedir recursão/duplicação;
6. não criar estado de negócio paralelo;
7. degradar sem bloquear o núcleo quando sua responsabilidade for complementar.

A camada incremental não pode converter sucesso normal em `renderProntuario()` completo. O render integral é fallback para bootstrap, navegação, erro, retorno incompleto ou inconsistência não reconciliável.

## 10. Degradação

Se uma extensão apenas visual falhar, o núcleo deve permanecer utilizável sempre que o contrato permitir.

Se o diagnóstico operacional falhar:

- a escrita continua;
- nenhum erro de métrica substitui o erro/retorno funcional;
- nenhuma requisição remota adicional é criada para compensar;
- a ausência de amostra é preferível a bloquear a operação.

Se o retorno da persistência for insuficiente ou ocorrer erro real da operação, os fallbacks do fluxo funcional permanecem responsáveis pela recuperação/reconciliação. A instrumentação não inventa um caminho alternativo de consistência.

## 11. Verificação proporcional

Mudanças nessa cadeia devem validar pelo menos:

- ordem exata entre scripts dependentes;
- ausência de carregamento duplicado;
- sintaxe;
- testes unitários dos wrappers afetados;
- política incremental de escrita;
- arquitetura via `dependency-cruiser` quando aplicável;
- falhas/retornos remotos via MSW quando a persistência for alterada;
- invariantes via fast-check quando regras de domínio forem alteradas;
- ausência de regressão material nos gates do repositório.

Quando não houver mudança de schema, Auth, RLS, RPC ou dados, não é necessário criar migration nem executar escrita destrutiva em Production apenas para validar uma extensão de frontend.

## 12. Evolução

Nova extensão pós-`app.js` deve declarar pré-requisitos, posição na cadeia, marcador de conclusão, idempotência, degradação, interação com wrappers e testes de ordem.

Novo carregador concorrente, telemetria remota, state library ou mudança estrutural de framework exige motivação e decisão próprias. Não são consequência automática da instrumentação atual.
