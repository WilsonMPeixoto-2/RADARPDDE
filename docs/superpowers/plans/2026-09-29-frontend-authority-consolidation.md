# Autoridades Frontend, Readiness e Concentração — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduzir a fragilidade causada por concentração de responsabilidades, wrappers sucessivos e readiness implícito, sem rewrite de `app.js` e sem desmontar integrações funcionais já corretas.

**Architecture:** Primeiro produzir um mapa de autoridade e dependências do frontend atual. Depois consolidar o caso crítico conhecido de readiness atômico e criar guardrails para impedir nova sobreposição. Extrações de `app.js` serão oportunísticas e limitadas a clusters de baixo acoplamento comprovado, não uma refatoração em massa.

**Tech Stack:** JavaScript, dependency-cruiser 18.3.0, Knip 6.35.1, scripts de auditoria existentes, Node test runner, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-29-root-cause-consolidation-design.md`

## Global Constraints

- Não fazer rewrite de `app.js`.
- Não remover wrapper/timer apenas por existir.
- Não introduzir novo framework ou loader.
- Preservar ADR-052 e autoridades funcionais já documentadas.
- `product-extensions-bootstrap.js` continua sendo a autoridade da ordem de extensões.
- Readiness crítico deve provar instalação, não apenas carregamento do arquivo.
- `atomic-analysis-pendency` permanece fail-closed.
- `dependency-cruiser` e `knip` já estão instalados; não adicionar ferramenta equivalente antes de esgotá-los.
- `knip` nesta fase é diagnóstico; não usar `--fix`.

## Review Focus

- Mudança de ordem de scripts não pode capturar handler `undefined`.
- `Incorreto` nunca pode cair no handler-base sem Pendência atômica.
- Remoção de wrapper deve preservar argumentos, retorno, scroll, feedback e efeitos funcionais.
- Módulos que usam `MutationObserver` por conteúdo realmente tardio não devem ser confundidos com polling de instalação.
- Extração de código do núcleo não pode criar segunda fonte de estado.

---

### Task 1: Produzir o mapa atual de autoridades e sobreposições

**Files:**
- Create: `docs/architecture/frontend-authority-map.md`
- Refresh: `docs/evidence/global-baseline/repository-inventory.json`
- Read/validate: `docs/evidence/frontend-precedence/manifest.json`
- Read/validate: `docs/architecture/frontend-load-order.md`
- Read/validate: `docs/architecture/product-extensions-load-order.md`

**Interfaces:**
- Consumes: código real e manifests atuais.
- Produces: mapa por comportamento com autoridade, wrappers, readiness, observadores, estado tocado e consumidores.

- [ ] **Step 1: Atualizar inventário do repositório**

Run: `npm run audit:inventory`

Registrar tamanho atual de `app.js`, arquivos de integração e scripts carregados.

- [ ] **Step 2: Rodar ferramentas já instaladas**

Run:

```bash
npm run check:architecture
npm run analyze:unused
npm run audit:frontend-precedence
```

O resultado do Knip é diagnóstico; não excluir nada automaticamente.

- [ ] **Step 3: Mapear no documento, no mínimo, estes comportamentos**

- `switchView`;
- `renderProntuario`;
- `toggleBonif`;
- `changeAnaliseTecnica`;
- `toggleInvoiceAdvisorySent`;
- `changeInvoiceAdvisoryAnalysis`;
- `toggleConsEnviada`;
- bootstrap/readiness;
- aplicação do contexto operacional;
- feedback/busy;
- preservação de scroll;
- timeline;
- retificação.

Para cada comportamento, registrar:

- autoridade funcional pretendida;
- função original;
- wrappers na ordem efetiva;
- módulo que instala;
- evento/capacidade de readiness;
- estado lido/escrito;
- teste que protege o contrato.

- [ ] **Step 4: Classificar cada camada**

Categorias permitidas:

- autoridade funcional;
- adaptação de UX;
- compatibilidade temporária;
- diagnóstico/telemetria;
- redundância candidata.

Não remover nada ainda.

- [ ] **Step 5: Commit**

```bash
git add docs/architecture/frontend-authority-map.md docs/evidence/global-baseline/repository-inventory.json
git commit -m "docs: map frontend authorities and overlap"
```

### Task 2: Tornar o readiness atômico explícito e eliminar seu polling de instalação

**Files:**
- Modify: `src/integration/atomic-analysis-pendency.js:1-295`
- Modify: `src/integration/product-extensions-bootstrap.js:77-156`
- Test: `tests/unit/atomic-analysis-readiness.test.js`
- Test: `tests/e2e/atomic-analysis-pendency.spec.js`
- Test: `tests/unit/product-extensions-loader-resilience.test.js`
- Modify docs: `docs/architecture/product-extensions-load-order.md`

**Interfaces:**
- Produces: `RadarAtomicAnalysisPendency.install(root) -> boolean` disponível imediatamente após o script carregar.
- Produces: readiness final somente quando `RADAR_ATOMIC_ANALYSIS_READY === true`.

- [ ] **Step 1: Escrever teste falho para capacidade explícita**

Asserções:

- o módulo expõe `install` mesmo antes de conseguir instalar;
- `install()` é idempotente;
- ausência das dependências mantém `RADAR_ATOMIC_ANALYSIS_READY=false`;
- `product-extensions-bootstrap` não resolve `RadarProductExtensionsReady` enquanto a capacidade atômica não estiver instalada;
- não existe `setInterval` no módulo atômico após a mudança.

- [ ] **Step 2: Rodar teste e confirmar falha no desenho atual**

Run:

```bash
node --test   tests/unit/atomic-analysis-readiness.test.js   tests/unit/product-extensions-loader-resilience.test.js
```

Expected: FAIL no contrato explícito/polling.

- [ ] **Step 3: Refatorar o módulo atômico**

Separar definição da API de instalação efetiva:

- API publicada imediatamente;
- `install(root)` tenta ligar os patches;
- sucesso marca `RADAR_ATOMIC_ANALYSIS_READY=true`;
- falha deixa false sem timer interno;
- nenhuma rota insegura é habilitada.

- [ ] **Step 4: Incorporar a instalação ao gate central**

Em `installCriticalExtensions()`:

- chamar `RadarAtomicAnalysisPendency.install(root)`;
- exigir sucesso no retorno final;
- manter a ordem em que o script atômico é carregado primeiro.

- [ ] **Step 5: Rodar testes unitários e E2E atômico**

Run:

```bash
node --test tests/unit/atomic-analysis-readiness.test.js tests/unit/product-extensions-loader-resilience.test.js
npx playwright test tests/e2e/atomic-analysis-pendency.spec.js
```

Expected: PASS; sem polling; fail-closed preservado.

- [ ] **Step 6: Commit**

```bash
git add src/integration/atomic-analysis-pendency.js   src/integration/product-extensions-bootstrap.js   tests/unit/atomic-analysis-readiness.test.js   tests/unit/product-extensions-loader-resilience.test.js   docs/architecture/product-extensions-load-order.md
git commit -m "refactor: make atomic readiness deterministic"
```

### Task 3: Classificar e reduzir polling/readiness residual

**Files:**
- Modify selectively: módulos de `src/integration/` identificados no mapa como polling de instalação.
- Modify: `docs/architecture/frontend-load-order.md`
- Test: testes unitários correspondentes de cada módulo alterado.

**Interfaces:**
- Consumes: eventos determinísticos já existentes, especialmente `radar:application-services-ready`, `radar:auth-resolved` e bootstrap central.
- Produces: módulos instalados por sinal explícito, sem polling quando houver substituto seguro.

- [ ] **Step 1: Inventariar cada `setInterval` de instalação/readiness**

Para cada ocorrência registrar:

- dependência aguardada;
- evento determinístico existente;
- se o polling é fail-closed crítico;
- se o timer é runtime legítimo e não readiness.

- [ ] **Step 2: Escolher somente ocorrências com substituto determinístico**

Não converter todos de uma vez.

- [ ] **Step 3: Para cada módulo escolhido, escrever teste que prova instalação por evento**

O teste deve falhar se depender de avanço de relógio/polling.

- [ ] **Step 4: Remover o polling e conectar o evento/bootstrap existente**

Não criar evento novo se um contrato existente já expressar a dependência.

- [ ] **Step 5: Rodar readiness e precedência após cada módulo**

Run:

```bash
npm run test:readiness
npm run audit:frontend-precedence:check
npm run test:frontend-precedence
```

- [ ] **Step 6: Commit por grupo funcional, não por dezenas de módulos juntos**

### Task 4: Impedir nova concentração em `app.js`

**Files:**
- Modify: `docs/reference/ENGINEERING_METHOD.md`
- Modify: `AGENTS.md`
- Modify: `.dependency-cruiser.cjs` somente se o mapa revelar regra automatizável concreta.
- Optional create after evidence: `docs/architecture/app-js-decomposition-map.md`

**Interfaces:**
- Produces: regra de manutenção, não mudança funcional imediata.

- [ ] **Step 1: Registrar a política “não empilhar”**

Incluir explicitamente:

- nova função relevante não entra em `app.js` por padrão;
- exceção precisa justificar por que o núcleo é a autoridade correta;
- correção deve procurar camada superseded para remover;
- wrapper novo exige demonstrar que não existe ponto de extensão/autoridade melhor.

- [ ] **Step 2: Mapear clusters de `app.js`**

No mínimo:

- navegação;
- Dashboard;
- Carteira;
- Prontuário/Avaliação;
- Pendências;
- NF/despesas;
- inventário;
- equipe;
- exportação;
- modais/helpers.

Para cada cluster: linhas aproximadas, globals expostos, integrações consumidoras e acoplamento.

- [ ] **Step 3: Selecionar candidatos de baixo acoplamento**

Somente candidatos:

- puros ou quase puros;
- sem dependência de globals mutáveis espalhados;
- com testes existentes ou fáceis de isolar;
- tocados por uma frente real.

A saída desta task é uma fila priorizada, não uma extração em massa.

- [ ] **Step 4: Adicionar regra do dependency-cruiser apenas quando houver fronteira verificável**

Exemplo de gate aceitável: módulo de domínio/aplicação não pode importar integração/UI. Não inventar regra só para “ter arquitetura”.

- [ ] **Step 5: Commit documental/arquitetural**

### Task 5: Executar extrações oportunísticas, uma área por vez

**Files:**
- Determinados pelo mapa da Task 4.
- Create: módulo focado em `src/domain/`, `src/application/` ou `src/integration/` conforme responsabilidade.
- Test: teste unitário específico do cluster.

**Interfaces:**
- Cada extração deve declarar exatamente quais funções saem de `app.js` e qual API substitui os globals internos.

- [ ] **Step 1: Escolher um único cluster de baixo acoplamento**

Não combinar clusters.

- [ ] **Step 2: Escrever teste sobre comportamento existente antes de mover código**

- [ ] **Step 3: Mover a autoridade, não duplicá-la**

O código antigo deve ser removido ou reduzido a um adaptador deliberado. Não manter duas implementações funcionais.

- [ ] **Step 4: Rodar teste direcionado + E2E da superfície**

- [ ] **Step 5: Confirmar redução líquida de complexidade**

Critério: menos autoridade duplicada, não apenas mais arquivos.

- [ ] **Step 6: Commit e revisão antes do próximo cluster**

### Task 6: Gate final de arquitetura frontend

**Files:**
- Evidence: `docs/evidence/<date>-frontend-authority-consolidation/README.md`

- [ ] **Step 1: Rodar análise estática**

```bash
npm run check:architecture
npm run analyze:unused
npm run audit:frontend-precedence:check
npm run lint
npm run test:unit
```

- [ ] **Step 2: Rodar E2E das superfícies cujos handlers/wrappers mudaram**

- [ ] **Step 3: Validar no navegador**

Verificar:

- pageerror;
- scripts duplicados;
- wrappers instalados uma vez;
- readiness resolvido;
- nenhuma regressão funcional.

- [ ] **Step 4: Registrar o que foi removido**

A evidência deve listar não só o que foi adicionado, mas também quais polling/wrappers/código antigo foram efetivamente eliminados.
