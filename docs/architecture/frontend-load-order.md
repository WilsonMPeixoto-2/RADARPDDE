# Ordem de carregamento e precedência do frontend

**Estado:** vigente  
**Atualizado em:** 7 de setembro de 2026

## 1. Finalidade

Registrar a composição atual do frontend antes de mover, fundir, remover ou adiar recursos. A ordem de bootstrap é parte do contrato funcional quando módulos envolvem handlers, aguardam serviços ou controlam uma superfície.

A aplicação combina:

1. HTML/CSS e domínios estáticos;
2. configuração pública e validação fail-closed;
3. carregador de extensões de `config.js`;
4. persistência e serviços;
5. `app.js`;
6. integrações pós-núcleo;
7. Auth, navegação e extensões de produto;
8. runtimes opcionais como Excel, busca e Floating UI.

## 2. Scripts estáticos principais

A ordem declarada no final de `index.html` é, em blocos:

### Domínio

- `competencia.js`;
- `estatisticas.js`;
- `fluxo-operacional.js`;
- `service-advisory.js`;
- `invoice-document-analysis.js`;
- `invoice-effects.js`;
- `pendencias.js`;
- `access-policy.js`;
- `global-search-index.js`;
- `retificacoes.js`.

### Configuração e dados

- `config.runtime.js`;
- `config.js`;
- contrato de repositório e AJV;
- contratos JSON e error mapper;
- `session-service.js` e `auth-bootstrap.js`;
- repositórios, snapshot/import/state bridge;
- `StatePort`, `UnitOfWork` e `DataService`;
- serviços de configuração, diretório, escola, Pendências, verificações, auditoria, NF e inventário.

O bundle do cliente Supabase **não é estático no HTML**. `auth-bootstrap.js` o carrega sob demanda quando a conexão remota está habilitada.

### Núcleo e integrações estáticas pós-núcleo

- `shared-interactions.js`;
- `app.js`;
- `view-transitions.js`;
- `global-search.js`;
- `floating-ui-bootstrap.js`;
- `auth-gate.js`.

## 3. CSS

`styles.css` continua sendo a folha-base.

As folhas complementares de interações, busca, Floating UI e transições são carregadas de forma não bloqueante pelo HTML. `config.js` instala as folhas específicas de mobile, Pendências, Retificações, Carteira, Dashboard e painel do Controlador com deduplicação por `data-radar-extension`.

O bootstrap de extensões de produto adiciona seus próprios estilos com `data-radar-product-style`.

Repetição textual de seletor não autoriza consolidação. Alteração de CSS exige computed styles/regressão visual nos breakpoints afetados.

## 4. `config.js` e readiness

`config.js` carrega `application-readiness.js` antes das extensões que dependem do estado do aplicativo.

`RadarApplicationReadiness` representa capacidades:

```text
authentication
data
application-services
ui-runtime
competence
navigation
```

O carregador de `config.js` não deve voltar a usar tempo como contrato de instalação.

A cadeia de Pendências é iniciada depois de `ui-runtime`; as ações que dependem dos serviços aguardam também `application-services`. Retificações e integridade do formulário de escola seguem o mesmo princípio.

Outras extensões que já conseguem se instalar de forma idempotente continuam sendo solicitadas pelo carregador, mas não podem criar segunda autoridade para navegação ou serviço.

## 5. Auth e navegação

`auth-gate.js` carrega serialmente:

```text
navigation-routes.js
→ navigation-policy.js
→ navigation-bootstrap.js
→ navigation-history.js
→ audit-data-gate.js
```

A aplicação da rota pendente espera as capacidades críticas necessárias, não um `setInterval`.

`painel-controlador-expressiva.js` não carrega `navigation-history.js`. Essa remoção encerra a autoridade concorrente encontrada na auditoria de 07/09.

`navigation-routes.js` inicia `product-extensions-bootstrap.js`. A ordem interna é documentada em [`product-extensions-load-order.md`](product-extensions-load-order.md).

## 6. Competência

`global-competence-selector.js` depende de dados e do contrato de competência. A instalação passou a aguardar readiness/eventos determinísticos. O seletor global não deve sondar continuamente `RadarDataContext`, `COMPETENCIAS` ou serviços para descobrir se já existem.

## 7. Dados do pós-login

O bootstrap remoto bloqueante carrega as entidades necessárias ao funcionamento geral. `administrativeLogs` é a única entidade retirada desse conjunto nesta frente.

Motivo: o Dashboard e as superfícies operacionais não precisam do histórico administrativo para iniciar.

A entidade é hidratada depois por `DataService.hydrateRemoteEntities()` com aplicação incremental segura e fila compartilhada com escritas remotas.

A tela Registros Internos depende de `audit-data`. Enquanto a hidratação não termina, exibe loading; em falha, restringe apenas essa superfície e oferece retry.

**Regra:** nenhum outro grupo de dados pode ser adiado sem consumidor mapeado, patch incremental seguro, semântica de falha da superfície e testes correspondentes.

## 8. Extensões e instaladores

Instaladores não devem criar polling para esperar `RadarApplicationServices` ou outras capacidades já representadas por eventos/Promises.

Na execução autenticada final de 07/09, os intervalos de readiness de 10/20/25/50 ms deixaram de existir no runtime observado. O único intervalo persistente observado foi de 30 s, compatível com `autoRefreshToken` do Supabase Auth.

`MutationObserver` pode permanecer quando observa DOM criado depois da instalação. Timer operacional real também pode permanecer. A regra é eliminar polling usado como substituto de contrato de prontidão, não proibir timers indiscriminadamente.

## 9. Runtimes opcionais

### Excel

`load-excel-export.js` continua assíncrono, recuperável e separado do caminho crítico da interface. A cadeia Excel mantém validação de contrato, timeout/retry e auditoria das exportações.

### Busca e Floating UI

Bundles locais são carregados sob demanda pelas respectivas integrações e possuem fallback funcional. Não fazem parte da autoridade de dados ou navegação.

## 10. Idempotência e precedência

Cada wrapper/carregador deve:

1. possuir uma autoridade clara;
2. deduplicar recurso/instalação;
3. preservar argumentos, retornos e efeitos da camada anterior;
4. não inventar estado de negócio paralelo;
5. reagir a readiness determinístico quando sua dependência ainda não existe;
6. degradar de acordo com sua criticidade;
7. possuir regressão que detecte inversão de ordem relevante.

## 11. Verificação

Mudança nesta arquitetura exige, conforme o alcance:

- testes de precedência e arquitetura;
- unitários dos loaders/wrappers;
- E2E de rotas e primeiras ações;
- perfis e viewports;
- Supabase real se dados/Auth forem afetados;
- inspeção de scripts/styles duplicados e timers de readiness;
- Lighthouse segundo a política vigente;
- revisão adversarial da composição final.

A auditoria estática não substitui execução. Ordem assíncrona e composição de wrappers precisam de prova no navegador.
