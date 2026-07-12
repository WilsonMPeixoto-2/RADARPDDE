# Task 9 — Pendências visíveis, pesquisáveis e navegáveis — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a página de Pendências com quatro filas canônicas, busca e filtros globais, drawer de detalhes, timeline e navegação contextual preservada.

**Architecture:** Um módulo puro `src/domain/pendencias-view-model.js` prepara os registros, filtros, ordenação, contagens e timeline. `app.js` mantém apenas estado de navegação e integração com ações existentes. `styles.css` implementa tabela desktop, cartões mobile e drawer acessível sem novas dependências.

**Tech Stack:** JavaScript ES5/ES6 compatível com navegador, UMD/CommonJS, `node:test`, Playwright 1.61, HTML/CSS existentes.

## Global Constraints

- Não modificar Supabase, perfis, Excel ou regras de bonificação.
- Não implementar cancelamento ou reabertura nesta Task.
- Não adicionar dependências npm.
- Não alterar `INITIAL_DATA_VERSION`.
- Preservar registros legados e o mesmo `pendencyId`.
- Usar TDD: teste falhando antes de cada mudança de comportamento.
- Manter PR em rascunho; não fazer merge ou publicar sem autorização expressa.

---

### Task 1: View model puro de Pendências

**Files:**
- Create: `src/domain/pendencias-view-model.js`
- Create: `tests/pendencias-view-model.test.js`

**Interfaces:**
- Consumes: pendências canônicas ou legadas, escolas, programas, controladores, contatos e data de referência.
- Produces:
  - `normalizeSearchText(value)`
  - `buildPendencyRecords(input)`
  - `applyPendencyFilters(records, filters)`
  - `groupPendencyRecords(records)`
  - `sortPendencyRecords(records, status)`
  - `buildPendencyTimeline(record)`
  - `createPendencyPageModel(input)`

- [ ] **Step 1: escrever testes falhando de normalização e composição**

Criar testes para:

```js
assert.equal(normalizeSearchText('  Educação e Família  '), 'educacao e familia');
```

E para um registro documental completo:

```js
const [record] = buildPendencyRecords({
  pendencias: [PENDENCY],
  escolas: [SCHOOL],
  programas: [PROGRAM],
  controladores: [CONTROLLER],
  contatos: []
});

assert.equal(record.schoolName, SCHOOL.denominação);
assert.equal(record.programName, PROGRAM.name);
assert.equal(record.documentName, 'Extrato Conta Corrente');
assert.equal(record.nextActor, 'Escola');
assert.equal(record.nextAction, 'Entregar ou corrigir o documento');
```

- [ ] **Step 2: executar e confirmar RED**

```bash
node --test tests/pendencias-view-model.test.js
```

Resultado esperado: falha por módulo/funções ausentes.

- [ ] **Step 3: implementar o esqueleto UMD e composição mínima**

O módulo deve exportar exatamente as funções listadas e não acessar DOM, `localStorage` ou globais.

- [ ] **Step 4: executar e confirmar GREEN**

```bash
node --test tests/pendencias-view-model.test.js
```

Resultado esperado: todos os testes iniciais aprovados.

- [ ] **Step 5: adicionar testes falhando de busca, filtros e quatro grupos**

Cobrir:

```js
const model = createPendencyPageModel({
  ...FIXTURES,
  filters: { query: 'educacao familia', controllerId: 'ctrl-1' }
});
assert.equal(model.groups.aberta.filteredCount, 1);
assert.equal(model.groups.aguardando.filteredCount, 0);
assert.equal(model.groups.resolvida.totalCount, 1);
assert.equal(model.groups.cancelada.totalCount, 1);
```

- [ ] **Step 6: executar RED, implementar filtros e agrupamento, executar GREEN**

```bash
node --test tests/pendencias-view-model.test.js
```

- [ ] **Step 7: adicionar testes falhando de ordenação e antiguidade**

Verificar:

- abertas mais antigas primeiro;
- aguardando pelo último envio aguardando mais antigo;
- resolvidas por resolução mais recente;
- canceladas por cancelamento mais recente;
- datas inválidas não quebram o modelo.

- [ ] **Step 8: implementar ordenação e campos temporais, executar GREEN**

```bash
node --test tests/pendencias-view-model.test.js
```

- [ ] **Step 9: adicionar testes falhando de timeline combinada**

A timeline deve ordenar contatos e histórico do mais recente para o mais antigo e preservar `tentativaId`, erros e autoria.

- [ ] **Step 10: implementar timeline e executar suíte completa do módulo**

```bash
node --test tests/pendencias-view-model.test.js
```

- [ ] **Step 11: commit**

```bash
git add src/domain/pendencias-view-model.js tests/pendencias-view-model.test.js
git commit -m "feat: criar view model da pagina de pendencias"
```

---

### Task 2: Carregamento e estado da página

**Files:**
- Modify: `config.js`
- Modify: `app.js`
- Test: `tests/e2e/task-9-pendencias.spec.js`

**Interfaces:**
- Consumes: `window.RadarPendenciasViewModel`.
- Produces estado global isolado:
  - `pendencyPageState.activeTab`
  - `pendencyPageState.filters`
  - `pendencyPageState.selectedId`
  - `pendencyPageState.scrollTop`
  - `pendencyPageState.returnContext`

- [ ] **Step 1: criar E2E falhando que exige quatro abas**

O teste deve acessar `/`, trocar para o perfil controlador, abrir Pendências e exigir botões acessíveis com nomes:

```text
Abertas
Aguardando reanálise
Resolvidas
Canceladas
```

- [ ] **Step 2: executar RED**

```bash
npx playwright test tests/e2e/task-9-pendencias.spec.js --project=desktop-chromium
```

- [ ] **Step 3: carregar o novo módulo antes da aplicação de integração**

Adicionar em `config.js` carregamento síncrono de `src/domain/pendencias-view-model.js` antes de qualquer extensão que dependa dele.

- [ ] **Step 4: substituir o estado binário atual pelo estado canônico da página**

Manter defaults:

```js
const pendencyPageState = {
  activeTab: 'aberta',
  filters: {
    query: '', schoolId: '', competence: '', programId: '', documentKey: '',
    error: '', nextActor: '', controllerId: '', age: ''
  },
  selectedId: null,
  scrollTop: 0,
  returnContext: null
};
```

- [ ] **Step 5: renderizar quatro abas e painéis com contagens**

Usar `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `role="tabpanel"`.

- [ ] **Step 6: executar GREEN**

```bash
npx playwright test tests/e2e/task-9-pendencias.spec.js --project=desktop-chromium
```

- [ ] **Step 7: commit**

```bash
git add config.js app.js tests/e2e/task-9-pendencias.spec.js
git commit -m "feat: estruturar quatro filas de pendencias"
```

---

### Task 3: Busca global, filtros e ordenação operacional

**Files:**
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `tests/e2e/task-9-pendencias.spec.js`

**Interfaces:**
- Consumes: `createPendencyPageModel()`.
- Produces:
  - `updatePendencyPageFilter(name, value)`
  - `clearPendencyPageFilters()`
  - `removePendencyPageFilter(name)`
  - `activatePendencyTab(tabKey)`

- [ ] **Step 1: adicionar E2E falhando de busca sem acentos**

Pesquisar versão sem acentos de nome/programa e verificar contagens `X de Y` em todas as abas, sem troca automática de aba.

- [ ] **Step 2: executar RED**

```bash
npx playwright test tests/e2e/task-9-pendencias.spec.js --project=desktop-chromium -g "busca global"
```

- [ ] **Step 3: implementar campo de busca e resumo de resultados**

O campo deve ter label acessível `Pesquisar pendências` e `aria-describedby` apontando para resumo `aria-live="polite"`.

- [ ] **Step 4: executar GREEN**

- [ ] **Step 5: adicionar E2E falhando de filtros combinados e etiquetas removíveis**

Aplicar competência + responsável + antiguidade, remover uma etiqueta e limpar tudo.

- [ ] **Step 6: implementar filtros estruturados e etiquetas**

No desktop, barra expansível; no mobile, botão `Filtros` com quantidade ativa.

- [ ] **Step 7: executar E2E completo da Task 9 até aqui**

```bash
npx playwright test tests/e2e/task-9-pendencias.spec.js --project=desktop-chromium
```

- [ ] **Step 8: commit**

```bash
git add app.js styles.css tests/e2e/task-9-pendencias.spec.js
git commit -m "feat: adicionar busca e filtros globais de pendencias"
```

---

### Task 4: Tabela desktop e cartões mobile

**Files:**
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `tests/e2e/task-9-pendencias.spec.js`
- Modify: `tests/e2e/mobile-smoke.spec.js`

**Interfaces:**
- Produces markup com `data-pendency-ref`, `data-pendency-status` e ações contextuais.

- [ ] **Step 1: adicionar E2E desktop falhando para colunas e conteúdo canônico**

Exigir unidade, competência, programa/documento, erros, situação, próxima ação, última movimentação, tentativas e ações.

- [ ] **Step 2: executar RED**

- [ ] **Step 3: implementar tabela desktop a partir do view model**

Resumir erros em dois itens e `+N`; não usar `motivo` como única fonte.

- [ ] **Step 4: executar GREEN desktop**

- [ ] **Step 5: adicionar teste mobile falhando para cartões e ausência de overflow**

No Pixel 7 e iPhone 15:

```js
await expect(page.locator('.pendency-mobile-card')).toHaveCount(1);
expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
```

- [ ] **Step 6: implementar cartões mobile e estilos responsivos**

A tabela fica oculta abaixo de 700 px e os cartões passam a ser a superfície principal.

- [ ] **Step 7: executar desktop e mobile**

```bash
npx playwright test tests/e2e/task-9-pendencias.spec.js --project=desktop-chromium
npm run test:mobile
```

- [ ] **Step 8: commit**

```bash
git add app.js styles.css tests/e2e/task-9-pendencias.spec.js tests/e2e/mobile-smoke.spec.js
git commit -m "feat: apresentar filas de pendencias em tabela e cartoes"
```

---

### Task 5: Drawer acessível e timeline

**Files:**
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `tests/e2e/task-9-pendencias.spec.js`

**Interfaces:**
- Produces:
  - `openPendencyDetail(source)`
  - `closePendencyDetail(options)`
  - `renderPendencyDetailDrawer(model)`
  - `handlePendencyDrawerKeydown(event)`

- [ ] **Step 1: adicionar E2E falhando de abertura real do detalhe**

Ao clicar `Ver detalhes`, exigir drawer com escola, contexto documental, erros, tentativas e timeline.

- [ ] **Step 2: executar RED**

- [ ] **Step 3: implementar drawer desktop não modal**

A lista permanece visível e a linha/cartão selecionado recebe estado visual e `aria-current="true"`.

- [ ] **Step 4: executar GREEN desktop**

- [ ] **Step 5: adicionar E2E falhando de troca de seleção e preservação**

Abrir registro A, aplicar busca, selecionar B, fechar e verificar busca, aba e scroll preservados.

- [ ] **Step 6: implementar persistência de estado durante a sessão**

- [ ] **Step 7: adicionar E2E falhando de teclado e mobile**

Cobrir `Escape`, foco inicial, foco contido no mobile e devolução ao acionador.

- [ ] **Step 8: implementar comportamento mobile como diálogo de tela inteira**

- [ ] **Step 9: executar desktop e mobile**

```bash
npx playwright test tests/e2e/task-9-pendencias.spec.js --project=desktop-chromium
npm run test:mobile
```

- [ ] **Step 10: commit**

```bash
git add app.js styles.css tests/e2e/task-9-pendencias.spec.js
git commit -m "feat: adicionar drawer e timeline de pendencias"
```

---

### Task 6: Navegação contextual e correções de encontrabilidade

**Files:**
- Modify: `app.js`
- Modify: `tests/e2e/task-9-pendencias.spec.js`
- Modify: `tests/e2e/pendency-cycle.spec.js`

**Interfaces:**
- Produces:
  - `openPendencyInProntuario(source)`
  - `returnToPendencyPage()`
  - `restorePendencyPageContext(context)`

- [ ] **Step 1: adicionar E2E falhando de Pendências → documento exato → retorno**

Exigir que o Prontuário abra escola, competência, programa e documento corretos, destaque a linha e apresente `Voltar às Pendências`.

- [ ] **Step 2: executar RED**

- [ ] **Step 3: implementar contexto de navegação e retorno**

Transportar `pendencyId`, aba, filtros e scroll sem alterar persistência institucional.

- [ ] **Step 4: executar GREEN**

- [ ] **Step 5: atualizar jornada de duplicidade**

O teste existente deve exigir que a duplicidade abra o drawer do mesmo `pendencyId`, além de manter a seleção e o foco.

- [ ] **Step 6: corrigir passivo anterior**

Substituir `p.status === 'Aberta'` por `RadarPendencias.isActivePendency(p)` e exibir próximo ator.

- [ ] **Step 7: corrigir rótulo em Competências**

Substituir `N Abertas` por resumo textual correto de pendências ativas, distinguindo abertas e aguardando quando ambos existirem.

- [ ] **Step 8: corrigir cor semântica de Aguardando reanálise**

Usar badge informativo azul, com texto preservado.

- [ ] **Step 9: executar testes focados**

```bash
npx playwright test tests/e2e/task-9-pendencias.spec.js tests/e2e/pendency-cycle.spec.js --project=desktop-chromium
```

- [ ] **Step 10: commit**

```bash
git add app.js tests/e2e/task-9-pendencias.spec.js tests/e2e/pendency-cycle.spec.js
git commit -m "feat: preservar contexto na navegacao de pendencias"
```

---

### Task 7: QA, acessibilidade e regressão completa

**Files:**
- Modify when necessary: `app.js`, `styles.css`, tests affected by verified defects
- No permanent screenshots or reports inside the repository.

- [ ] **Step 1: executar sintaxe e testes unitários**

```bash
node --check app.js
node --check src/domain/pendencias-view-model.js
node --test tests/*.test.js
```

- [ ] **Step 2: executar Playwright completo**

```bash
npm run test:e2e
```

- [ ] **Step 3: executar auditoria textual**

Confirmar:

```bash
rg -n "Vencida|Resolver Pendência|Resolver" app.js src tests
```

A ocorrência `Resolver` não pode existir como ação direta da Task 9.

- [ ] **Step 4: validar requisitos da especificação**

Revisar um a um os dez critérios de aceite e registrar qualquer lacuna no PR.

- [ ] **Step 5: validar Preview do Vercel**

Fluxo alvo:

```text
Pendências → busca global → aba Aguardando reanálise → abrir drawer → abrir documento no Prontuário → voltar às Pendências com estado preservado
```

Verificar desktop, Pixel 7 e iPhone 15; console sem erros relevantes; nenhuma sobreposição, corte ou overflow global.

- [ ] **Step 6: abrir PR em rascunho**

O corpo deve informar:

- fontes canônicas;
- mudanças visíveis;
- arquitetura criada;
- testes e resultados exatos;
- Preview;
- riscos remanescentes;
- Excel, Supabase, perfis e bonificação não alterados;
- proibição de merge sem autorização.

- [ ] **Step 7: não fazer merge**

Aguardar autorização expressa de Wilson Peixoto.

---

## Self-review

- Cobertura da especificação: quatro abas, busca, filtros, ordenação, tabela, cartões, drawer, timeline, navegação, acessibilidade, estados vazios e correções associadas estão vinculados a tarefas específicas.
- Nenhum placeholder `TBD` ou `TODO` foi deixado.
- Assinaturas produzidas por tarefas anteriores são consumidas com os mesmos nomes nas tarefas posteriores.
- Escopo permanece dentro da Task 9 e das correções diretamente necessárias à encontrabilidade.
