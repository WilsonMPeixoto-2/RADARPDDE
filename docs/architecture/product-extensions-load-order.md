# Cadeia de carregamento das extensões de produto

**Estado:** referência vigente  
**Atualizado em:** 7 de setembro de 2026  
**Fonte de verificação:** `src/integration/product-extensions-bootstrap.js` e módulos carregados no SHA reconstruído source-first

## 1. Finalidade

Registrar a ordem efetiva das extensões pós-`app.js` e as responsabilidades que dependem dessa composição.

Este documento complementa [`frontend-load-order.md`](frontend-load-order.md) e o [`SYSTEM_CANONICAL_MODEL.md`](../reference/SYSTEM_CANONICAL_MODEL.md).

A ordem é contrato quando uma extensão precisa encontrar outra já instalada. Ela não transforma wrappers de diagnóstico/performance em autoridade funcional.

## 2. Pré-requisitos

As extensões pressupõem, conforme a operação:

- `app.js` carregado;
- Auth e perfil efetivo;
- navegação/rotas;
- renderizadores principais;
- competência global;
- serviços publicados em `RadarApplicationServices` quando houver escrita.

## 3. Cadeia atual

O `auth-gate.js` solicita os módulos de navegação na ordem corrente e `navigation-routes.js` instala `product-extensions-bootstrap.js`.

Dentro do bootstrap de produto, a ordem atual de scripts é:

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

Estilos carregados pelo mesmo bootstrap:

- `school-timeline.css`;
- `controller-guide.css`;
- `controller-guide-theme.css`;
- `unidentified-expense-ux.css`;
- `prontuario-operational-ux.css`;
- `desktop-basic-monitors.css`;
- `pendency-passive-queue.css`;
- `operational-write-feedback.css`.

## 4. Extensões críticas

O bootstrap trata como críticas:

- `atomic-analysis-pendency.js`;
- `service-advisory-pendency.js`;
- `service-advisory-corrective-submission.js`;
- `critical-action-guard.js`.

Falha de uma extensão crítica não pode degradar silenciosamente para um fluxo inseguro.

`atomic-analysis-pendency.js` permanece primeiro porque `Incorreto` não pode cair no handler-base sem a proteção de Pendência atômica.

## 5. Consulta Assessoria

A separação de autoridade é deliberada:

```text
edição ordinária
→ InvoiceService.updateServiceAdvisory

abertura Incorreto + Pendência / reanálise
→ service-advisory-pendency.js

novo envio corretivo
→ service-advisory-corrective-submission.js
```

Nenhum módulo deve reassumir silenciosamente a responsabilidade do outro apenas para reduzir o número de arquivos.

## 6. `critical-action-guard.js`

Faz parte da cadeia crítica atual e deve permanecer posicionado depois das extensões funcionais de Assessoria e antes da instrumentação diagnóstica/performance.

Mudança nessa posição exige revalidar as ações críticas que protege e o comportamento real no navegador.

## 7. Diagnóstico e performance após PR #282

A documentação anterior a esta revisão descrevia `operational-write-performance.js` como portador de autoridade funcional de consistência. Isso está **superado**.

No código atual, `operational-write-performance.js`:

- coleta os `dataService` disponíveis;
- envolve `DataService.execute()` somente para medir persistência quando existe trace ativo;
- marca `rpcStart` e `rpcEnd`;
- delega integralmente a operação ao `DataService` original.

Ele **não**:

- decide commit autoritativo;
- escolhe política de reconciliação;
- substitui regra de negócio;
- define estado local canônico;
- cria caminho alternativo de persistência.

Portanto:

> performance é diagnóstico/tracing, não autoridade funcional.

Essa é a situação consolidada pelo PR #282 e confirmada diretamente no código desta reconstrução.

## 8. Diagnóstico operacional

`operational-write-diagnostics.js` carrega antes de `operational-write-performance.js`.

A instrumentação é local, efêmera e fail-open. Pode medir fases técnicas, mas não é estado de negócio e não deve armazenar conteúdo sensível da operação.

## 9. Readiness

### Extensões de produto

```javascript
window.RadarProductExtensionsReady
```

O bootstrap:

- evita duplicação;
- permite retry de scripts que falharam;
- registra falhas em `RADAR_PRODUCT_EXTENSION_FAILURES`;
- mantém `RADAR_LAST_PRODUCT_EXTENSION_ERROR` para diagnóstico;
- exige instalação das extensões críticas antes de considerar a cadeia segura.

O trabalho experimental do PR #284 sobre readiness permanece Draft/pausado e não redefine esta baseline enquanto não for integrado.

## 10. Regras de composição

Cada wrapper/extensão deve:

1. instalar uma única camada;
2. preservar argumentos, retorno e efeitos do alvo envolvido;
3. declarar dependências/posição;
4. impedir recursão e duplicação;
5. não criar estado de negócio paralelo;
6. degradar sem bloquear o núcleo quando sua função for apenas complementar;
7. permanecer fail-closed quando proteger ação crítica.

## 11. Idempotência de carregamento

O bootstrap usa marcadores de estilo/script e estado de carregamento para impedir duplicação. Repetir inicialização não pode duplicar:

- estilos;
- scripts;
- listeners;
- observadores;
- wrappers;
- probes;
- controles de negócio.

## 12. Validação obrigatória ao alterar esta cadeia

Mudança material exige, proporcionalmente:

- verificar ordem real no código;
- testar instalação idempotente;
- testar falha/retry quando aplicável;
- provar extensões críticas instaladas no navegador;
- executar as jornadas funcionais afetadas;
- testar primeira navegação/rota direta quando a mudança tocar readiness;
- aplicar `FRONTEND_USER_VALIDATION_GATE.md`;
- atualizar este documento, o modelo canônico e a matriz/ADR se a autoridade mudar.

Não remover timers, observers ou módulos apenas porque parecem redundantes em análise estática. Primeiro provar a função que exercem no runtime.
