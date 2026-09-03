# ADR-052 — Autoridade única e contrato executável para fluxos críticos

**Status:** Aprovada e implementada nos fluxos críticos atuais; expansão sistêmica planejada em R1/R2  
**Data:** 30 de agosto de 2026

## Contexto

A revisão completa do hotfix de individualização de Notas Fiscais revelou um padrão recorrente de manutenção: regras corretas podiam existir simultaneamente no núcleo, em integrações carregadas dinamicamente, em wrappers de interface e em RPCs, sem que a cadeia completa ficasse evidente em uma única leitura.

O caso concreto de Consulta Assessoria mostrou:

- `app.js` contém o handler-base e exige fail-closed para `Incorreto`;
- `service-advisory-pendency.js` é autoridade para abertura e reanálise individual;
- `service-advisory-corrective-submission.js` é autoridade para novo envio corretivo;
- `product-extensions-bootstrap.js` define a ordem funcional;
- `navigation-routes.js` instala o bootstrap de extensões;
- Supabase possui RPCs distintas para abertura, novo envio e reanálise.

Durante a auditoria, a separação pouco visível levou inicialmente à hipótese errada de que o novo envio corretivo não estava conectado. A investigação ampliada mostrou que a implementação já existia em outro módulo. Esse episódio confirma que apenas “ter o código correto em algum lugar” não é suficiente para manter confiabilidade entre PRs.

## Decisão

Todo fluxo crítico P0/P1 que atravesse interface, serviço, integração e backend deve obedecer cumulativamente aos seguintes contratos.

### 1. Autoridade explícita

Cada operação possui uma autoridade funcional identificável.

Para Consulta Assessoria:

| Operação | Autoridade funcional |
| --- | --- |
| edição ordinária de envio/análise | `InvoiceService.updateServiceAdvisory` |
| abertura `Incorreto + Pendência` | `service-advisory-pendency.js` |
| novo envio corretivo | `service-advisory-corrective-submission.js` |
| reanálise | `service-advisory-pendency.js` |
| persistência atômica | RPC específica correspondente |

Um módulo não deve assumir silenciosamente a responsabilidade já atribuída a outro.

### 2. Bootstrap crítico é contrato

A cadeia que instala extensões funcionais não é detalhe de implementação.

A CI deve verificar:

- `navigation-routes.js` instala `product-extensions-bootstrap.js`;
- `service-advisory-pendency.js` é carregado antes de `service-advisory-corrective-submission.js`;
- wrappers de diagnóstico/performance são carregados somente depois dos handlers funcionais finais;
- falha de carregamento deixa evidência explícita e não degrada silenciosamente para uma rota insegura.

### 3. Prova de instalação em navegador

Ao menos um E2E deve abrir a aplicação real do artefato de teste e comprovar:

- `RadarProductExtensionsReady === true`;
- nenhuma falha em `RADAR_LAST_PRODUCT_EXTENSION_ERROR`;
- marcadores das extensões críticas instalados no serviço efetivo.

Testar apenas os módulos isoladamente não substitui essa prova.

### 4. Regra funcional precisa sobreviver à composição

Para operações P0/P1, teste unitário do domínio, teste da RPC e E2E de layout não bastam isoladamente. Deve existir cobertura que atravesse a composição relevante:

```text
bootstrap
→ handler efetivo
→ serviço
→ snapshot/adapter
→ RPC
→ estado retornado
→ releitura/renderização
```

Quando Production for necessária para validar uma diferença de infraestrutura, usar smoke transacional controlado e rollback.

### 5. PR que toca fluxo crítico atualiza a matriz de autoridade

Mudança em qualquer operação P0/P1 deve verificar se alterou:

- autoridade;
- ordem de carregamento;
- RPC;
- entidade persistida;
- invariantes;
- regressões executáveis;
- documentação canônica.

A ausência de alteração deve ser explicitamente confirmada, não presumida.

## Atualização source-first de 03/09/2026

A reauditoria do código confirmou que esta ADR é baseline a preservar, não dívida a substituir.

- `RadarProductExtensionsReady` e `radar:application-services-ready` continuam válidos durante a migração;
- `service-advisory-pendency.js` e `service-advisory-corrective-submission.js` permanecem autoridades distintas e event-driven;
- R1 remove decisões de consistência de wrappers de performance antes de R2 classificar performance como capacidade opcional/diagnóstica;
- R2A–R2C expandem o contrato de readiness para o restante do sistema sem recolocar as operações de Assessoria em uma autoridade única artificial;
- falha de transporte de extensão independente deve ser isolada sem interromper capacidades que não dependem dela;
- polling só é removido quando existir sinal determinístico equivalente; `atomic-analysis-pendency` continua fail-closed.

Plano corrente: `docs/superpowers/plans/2026-09-03-plano-remanescente-source-first.md`.

## Consequências

- reduz risco de “correção da correção” causada por implementação correta porém desconectada;
- torna regressões de carregamento detectáveis pela CI;
- evita duplicação acidental de wrappers;
- facilita revisão futura ao tornar a autoridade pesquisável;
- não exige refatoração imediata de todo o `app.js`;
- não substitui ADR-041, ADR-042 ou ADR-050; operacionaliza essas decisões na composição do frontend.

## Implementação inicial

O PR aberto após a revisão pós-PR #215 adiciona:

- regressão unitária de autoridade e ordem das extensões críticas;
- E2E que comprova a instalação real da cadeia de Assessoria;
- ampliação da regressão de `rowVersion` em payloads de Pendência/tentativa;
- reconciliação documental do estado PR #211 → PR #214 → PR #215.

A duplicação inicialmente introduzida durante a investigação foi removida antes do merge, preservando a autoridade já existente em `service-advisory-corrective-submission.js`.
