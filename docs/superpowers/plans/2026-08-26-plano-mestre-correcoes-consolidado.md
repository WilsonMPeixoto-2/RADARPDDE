# RADAR PDDE 2026 — Plano mestre consolidado pós-auditoria

**Data:** 26/08/2026  
**Baseline:** `main` em `0965ba8d5749f2ed25b3563a65ebc5da413e7fa5`  
**Origem:** plano versionado no PR #199 + auditorias independentes posteriores + deliberações do responsável pelo produto + hotfix funcional PR #200.  
**Situação:** PR #200 concluído e incorporado à `main`; demais correções ainda pendentes.

> Este documento passa a ser a referência operacional consolidada para a execução desta frente. O PR #199 permanece como registro histórico do primeiro plano. O PR #195 continua integralmente fora desta frente.

---

## 1. Decisões de escopo já fechadas

### 1.1 Itens retirados do trabalho

Ficam expressamente fora desta frente, e não apenas adiados:

- o item anteriormente classificado como **P20 — autoridade de regra mais forte no frontend do que no servidor**;
- qualquer frente relativa a **proteção contra senhas vazadas/leaked-password protection**.

Esses temas não devem ser reintroduzidos em PRs futuros desta sequência sob outro nome, salvo nova decisão explícita do responsável pelo produto.

### 1.2 Regra sobre novas ferramentas/dependências

Por padrão, as correções serão implementadas com a stack já existente. Nova dependência só entra se resolver uma lacuna concreta não atendida adequadamente pelas ferramentas atuais e após avaliação explícita de benefício, risco e custo de manutenção.

Não instalar, como solução automática desta frente, novo framework frontend, gerenciador de estado, ORM, biblioteca genérica de retry, biblioteca de readiness ou outro loader.

### 1.3 Decisões recentes incorporadas

- **IDs:** o runtime atual já injeta `createPendencyClientId`, baseado em `crypto.randomUUID()` com fallback, em `InvoiceService`, `PendencyService` e `InventoryService` por meio de `transactionalDependencies`. Portanto, `Date.now()` não é a causa atual da duplicidade de notas. Entretanto, os fallbacks internos fracos (`prefix-Date.now()`) permanecem como dívida técnica e serão eliminados de forma coordenada no PR5, quando o intent/idempotência estabilizar a geração de IDs.
- **Readiness:** o PR3 usará registry **orientado a Promise/evento**, não polling periódico. Dependências serão declaradas, e falhas serão propagadas para capacidades dependentes sem interromper capacidades independentes.
- **Validação de Assessoria/bonificação:** não será introduzido Zod. O projeto já possui AJV e `json-contracts.js`; o PR2 centralizará enums/valores de domínio e estreitará os contratos AJV existentes quando aplicável.
- **Performance:** PERF-BOOT começa com instrumentação nativa (`performance.mark`, `performance.measure`, `PerformanceObserver`) e reaproveitamento do padrão já existente em `operational-write-diagnostics.js`. `web-vitals` fica apenas como decisão posterior, caso haja necessidade comprovada de RUM. `Server-Timing` só será considerado se a instrumentação mostrar gargalo server-side que justifique uma camada adicional de observabilidade.

---

## 2. Regras de negócio que não podem ser alteradas

- Pendências continuam visíveis independentemente da competência global.
- Pendência, análise técnica e bonificação permanecem dimensões distintas.
- `Sim + Incorreto + pendência` continua válido.
- Novo envio continua levando à reanálise.
- Despesa `A identificar` não é convertida automaticamente em `Não` ou `Incorreto`.
- Pendência ativa, isoladamente, não bloqueia consolidação.
- `Não analisado`, isoladamente, não bloqueia consolidação.
- Consulta Assessoria sem NF de serviço deve convergir para `Não se aplica` pela regra canônica.
- NF não será deduplicada apenas pelo conteúdo.
- PR #195 permanece fora desta frente.

---

## 3. Estado já corrigido — H0 / PR #200

**Status: concluído. Não reimplementar.**

Incidente tratado: usuários podiam receber `PENDENCY_REQUIRED` ao marcar análise documental como `Incorreto` porque a integração de abertura atômica podia não instalar a tempo ou ser interrompida por extensões opcionais.

Correção já incorporada:

- `PendencyService.open()` comporta `Incorreto + pendência` como operação atômica;
- `VerificationService` mantém a barreira contra `Incorreto` isolado;
- a integração de UI delega ao comando central;
- a integração crítica não desiste silenciosamente após dez segundos;
- o módulo é carregado antes das extensões opcionais;
- regressões foram adicionadas, inclusive com falha induzida de extensão posterior.

---

## 4. Ordem final de execução

```text
PR200 ✅
  ↓
G0 — baseline e governança
  ↓
PR1 — contenção do submit repetido + refresh mínimo
  ↓
PR2 — Assessoria canônica + enums/contratos AJV + no-op semântico
  ├────────────→ PR4 — reparo condicionado de dados
  ↓
PR3 — readiness sistêmico orientado a Promise/evento
  ↓
PR5 — idempotência real + intent estável + endurecimento de geração de IDs
  ↓
PR6 — contrato semântico único das Pendências
  ↓
PR6B — preservação da competência global em navegação transversal
  ├────────────→ PR7A — fila operacional
  └────────────→ PR7B — detalhe/reanálise/mobile/a11y

PR5 ───────────→ PR8 — escrita autoritativa/incremental completa
PR3 ───────────→ PR9 / PERF-BOOT — instrumentação e otimização

Após estabilização:
H1 restrito — qualidade operacional/CI/governança ainda aprovada
```

---

# 5. G0 — Congelar baseline e gates

## Objetivo

Garantir que cada PR parta de um estado remoto conhecido e que nenhum merge dependa apenas da impressão de que “os testes parecem verdes”.

## Ações

- registrar SHA da `main`, deployment Production e estado do Supabase Production;
- registrar contagens relevantes e candidatos atuais ao reparo de Assessoria;
- capturar baseline de chamadas e performance;
- revisar se branch protection/ruleset é viável;
- enquanto não houver enforcement automático, manter gate manual obrigatório.

## Não fazer

- nenhuma alteração funcional;
- nenhuma migration;
- nenhuma escrita em Production.

---

# 6. PR1 — Contenção imediata do submit repetido + refresh mínimo

## Problema

Duplo clique, Enter + clique ou repetição durante latência podem disparar mais de uma operação de NF/despesa.

## Correção

- trava síncrona antes do primeiro `await`;
- trava por formulário/intenção, não global;
- botão `Salvando…`, `disabled`, `aria-busy`;
- bloqueio de clique/Enter repetidos;
- restauração em `finally`;
- mover para o núcleo a dispensa segura de releitura de `administrativeLogs` em `invoice:save`/`invoice:remove`, sem depender da extensão de performance.

## Importante sobre IDs

A duplicidade não decorre de colisão de `Date.now()` no fluxo atual, porque `InvoiceService` recebe `createPendencyClientId` via `transactionalDependencies`. Não alterar a análise causal deste PR.

## Testes mínimos

- duplo clique;
- Enter + clique;
- erro de RPC;
- inclusão e edição;
- uma única chamada por gesto;
- extensão de performance ausente.

---

# 7. PR2 — Regra canônica da Consulta Assessoria + contratos AJV + no-op

## Objetivo

Eliminar fontes concorrentes de regra e impedir escrita sem alteração semântica.

## Regra canônica

Criar módulo de domínio puro, por exemplo `src/domain/service-advisory.js`, consumido por `InvoiceService`, `VerificationService` e demais consumidores.

Estados permitidos devem ser centralizados em constantes/enums do domínio, evitando strings espalhadas.

Exemplo conceitual:

```text
ENTREGA: Sim | Não | Não se aplica
ANÁLISE: Não analisado | Correto | Correto (Atrasado) | Incorreto
```

## Validação

Não adicionar Zod. Aproveitar AJV já presente no projeto e estreitar `json-contracts.js` quando a estrutura permitir, sem transformar contratos flexíveis legados em quebra retroativa sem migration.

## No-op semântico

Somente retornar `unchanged: true` quando não houver efeito persistente em:

- invoice;
- asset;
- verification;
- Consulta Assessoria;
- consolidação;
- demais efeitos derivados relevantes.

No verdadeiro no-op:

- zero RPC;
- zero log;
- zero incremento de versão;
- zero reabertura.

NF aparentemente igual + estado derivado inconsistente **não** é no-op.

---

# 8. PR3 — Readiness sistêmico orientado a Promise/evento

## Problema

O sistema possui múltiplos bootstraps, loaders, decorators, polling, `MutationObserver` e timeouts arbitrários. Uma falha pode deixar capacidades parcialmente instaladas.

## Decisão arquitetural

O registry de readiness deve ser **event-driven/Promise-driven**.

Conceito:

```javascript
readiness.register('capability-x', { dependencies: ['capability-y'] });
readiness.when('capability-x').then(...);
readiness.ready('capability-x', api);
readiness.fail('capability-x', error);
```

Para módulos independentes, usar estratégia equivalente a `Promise.allSettled()` em vez de uma cadeia em que o primeiro `reject` impede os seguintes.

## Estados

- `pending`;
- `ready`;
- `failed`;
- `degraded`, quando útil.

## Classes

- crítico;
- funcional restrito;
- opcional.

## Regras

- falha de A não impede B/C se independentes;
- falha crítica bloqueia apenas controles dependentes;
- diagnóstico/métrica é fail-open;
- não usar `setInterval(..., 20)` como mecanismo principal de readiness;
- não trocar timeout de 10 s por timeout maior como “solução”.

## Testes

- falha induzida em extensão opcional;
- dependência crítica ausente;
- dependente recebe falha;
- módulos independentes continuam;
- carregamento tardio resolvido por evento/Promise, sem polling.

---

# 9. PR4 — Reparo condicionado dos dados de Assessoria

## Dependência

Executar somente depois de PR2 publicado e validado em Production.

## Estratégia

`preflight + drift detection + pós-condição`.

1. identificar candidatos atuais;
2. registrar IDs/versões/estado;
3. validar elegibilidade pela regra canônica;
4. atualizar exatamente o conjunto autorizado;
5. verificar estado final.

O número histórico de quatro registros não é requisito fixo.

Casos válidos:

- preflight 4 → update 4;
- preflight 0 → update 0;
- parte já corrigida e estado final consistente.

Casos de abortar:

- drift entre preflight e update;
- contexto inesperado;
- predicado deixou de ser verdadeiro.

---

# 10. PR5 — Idempotência real + intent estável + IDs

## Problema

PR1 contém o gesto repetido no cliente, mas não cobre:

- retry de rede;
- resposta perdida depois do commit;
- duas abas;
- dois navegadores;
- concorrência real.

## Intent estável

Criar uma intenção única por gesto contendo, conforme operação:

- `operationKey`;
- `invoiceId`;
- `assetId`;
- `logId`;
- timestamp semântico;
- payload normalizado;
- expected versions;
- demais IDs derivados.

Retry deve reenviar a **mesma intenção**.

## Servidor

Registrar/reservar idempotência de forma transacional, associando:

- operação;
- chave;
- ator;
- hash da requisição;
- status;
- resultado.

Mesma chave + payload diferente deve ser rejeitada explicitamente.

## RPC

Criar versão explícita, como `save_invoice_with_effects_v2`, evitando overload ambíguo da assinatura atual.

## Endurecimento de IDs

Neste PR, substituir fallbacks internos baseados apenas em `Date.now()` por um gerador compartilhado robusto, alinhado ao padrão já usado por `createPendencyClientId` (`crypto.randomUUID()` com fallback seguro).

Isso é hardening e consistência arquitetural, não a causa do bug de duplo envio atual.

---

# 11. PR6 — Contrato semântico único das Pendências

## Autoridade

Usar `operational-projection.js` como fonte canônica para:

- início da etapa atual;
- idade;
- próximo ator;
- próxima ação;
- prioridade.

`pendencias-view-model.js`, `task-9-cross-view.js`, fila e detalhes devem consumir essa projeção e não recalcular a mesma semântica.

## Corrigir

- idade após reabertura;
- idade após reanálise;
- reabertura de `Resolvida`;
- reabertura de `Cancelada`;
- consistência entre telas.

---

# 12. PR6B — Preservação da competência global

## Problema

Abrir Pendência histórica por busca pode mudar silenciosamente a competência global.

## Regra

- abrir detalhe transversal da Pendência **não** altera competência global;
- abrir o Prontuário daquela Pendência **pode** mudar explicitamente para a competência correspondente.

## Testes

```text
Agosto → detalhe de Pendência de Março → fechar → continua Agosto
Agosto → Pendência de Março → abrir Prontuário → muda explicitamente para Março
```

---

# 13. PR7A — Fila operacional de Pendências

## Prioridade operacional

Para perfis capazes de reanalisar:

1. Para reanalisar;
2. Aguardando escola.

## Filtros principais

- Minha carteira / Todas;
- R.A.;
- Controlador quando aplicável;
- escola;
- idade da etapa.

## Filtros avançados

- programa;
- documento;
- erro;
- competência.

## UX

- uma ação principal coerente por estado;
- reduzir botões repetidos;
- agrupamento por escola opcional/secundário, sem perder prioridade cronológica.

---

# 14. PR7B — Detalhes, reanálise, mobile e acessibilidade

## Regra importante

Não remover `Ver detalhes` antes de o render base possuir integralmente:

- clique;
- foco;
- `tabindex`;
- Enter;
- Space;
- accessible name;
- prevenção de conflito com controles internos;
- retorno de foco.

Depois disso, avaliar redundância do botão.

## Melhorias

- hierarquia;
- labels/valores;
- espaçamento;
- tentativa/histórico;
- mobile;
- eliminação de duplicidades visuais.

---

# 15. PR8 — Escrita remota autoritativa e incremental

## Resultado remoto

A resposta precisa representar integralmente:

- invoice;
- asset;
- verification;
- administrative log;
- `deleted_asset_id`;
- versões;
- entidades alteradas.

## StatePort

Adicionar operações explícitas e pequenas de:

- upsert por ID;
- remoção por ID.

Caso crítico: permanente → não permanente deve remover o asset local quando o servidor o remove.

## Estado degradado

Se commit remoto foi confirmado mas aplicação local falhou:

- não declarar falsa falha de persistência;
- não repetir automaticamente a escrita;
- bloquear repetição insegura;
- tentar reconciliação segura;
- comunicar que o servidor salvou e a tela precisa atualizar.

---

# 16. PR9 / PERF-BOOT — Medir antes de otimizar

## Fase A — sem dependência nova

Reaproveitar o padrão já existente em `operational-write-diagnostics.js` e instrumentar:

1. page init;
2. auth start/end;
3. session;
4. cliente Supabase;
5. fetch start/end por grupo relevante;
6. normalização;
7. state apply;
8. primeiro render;
9. extensões ready;
10. estado visual estável;
11. time-to-useful-interaction.

Usar:

- `performance.now()`;
- `performance.mark()`;
- `performance.measure()`;
- `PerformanceObserver`;
- Lighthouse/Playwright para comparação sintética.

## Fase B — decidir sobre RUM

Somente depois de localizar o gargalo, avaliar `web-vitals` se houver necessidade real de medir usuários/dispositivos/redes reais.

A decisão deve incluir onde as métricas serão coletadas, retenção, volume e privacidade operacional.

## `Server-Timing`

Não implementar por padrão. Considerar apenas se as medições mostrarem que parte material da demora está dentro do servidor/RPC e houver benefício claro em decompor esse tempo.

---

# 17. H1 restrito — qualidade operacional aprovada

Pode incluir, se ainda necessário após os PRs funcionais:

- metodologia mais robusta de Lighthouse/CI;
- branch protection/ruleset e critérios obrigatórios de merge;
- limpeza de dívidas técnicas explicitamente aprovadas.

Não incluir:

- item P20 excluído;
- leaked-password protection;
- nova auditoria genérica de segurança fora do escopo decidido.

---

# 18. Critério de execução de cada PR

Cada PR deve seguir:

1. **revalidar a premissa** no SHA e Production atuais;
2. escrever/regenerar teste de regressão quando possível;
3. implementar a menor correção que resolve a causa;
4. revisar consumidores adjacentes;
5. executar testes focados;
6. executar gates proporcionais;
7. fazer revisão adversarial do diff;
8. somente então pedir/autorização para merge quando aplicável.

Revisão adversarial deve incluir, conforme o caso:

- duas abas;
- retry;
- resposta perdida;
- latência;
- perfil diferente;
- mobile;
- falha de dependência;
- estado remoto/local;
- migration rerun/drift.

---

# 19. Soluções explicitamente rejeitadas

- aumentar simplesmente timeout de dez segundos;
- deduplicar NF pelo conteúdo;
- exigir exatamente quatro linhas no reparo;
- remover `Ver detalhes` antes da acessibilidade base;
- ativar resposta autoritativa sem tratar remoções;
- criar terceira fonte semântica de Pendências;
- criar overload ambíguo da RPC atual;
- instalar Zod apenas para os estados de Assessoria;
- instalar `web-vitals` antes de existir hipótese e estratégia de coleta;
- introduzir `Server-Timing` sem evidência de gargalo server-side;
- misturar modernização geral de stack com esta frente de correções;
- reintroduzir P20 ou leaked-password protection sem nova decisão explícita.

---

# 20. Critério de convergência

O plano é considerado suficientemente convergido para implementação incremental porque as auditorias posteriores deixaram de encontrar novas famílias críticas a cada passe e passaram a concentrar os achados em poucas classes estáveis:

- escrita/idempotência;
- regra derivada;
- readiness;
- semântica/contexto de Pendências;
- reconciliação local;
- performance mensurável.

Novos bugs concretos encontrados durante a execução devem ser classificados como:

1. já mapeado;
2. extensão de problema já mapeado;
3. novo achado independente;
4. hipótese descartada/sem evidência.

Nenhum achado deve reabrir automaticamente decisões de escopo já fechadas.