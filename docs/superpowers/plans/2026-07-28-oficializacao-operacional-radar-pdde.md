# Oficialização Operacional do RADAR PDDE — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** transformar o RADAR PDDE em sistema oficial utilizável pelos perfis reais, com competências de 2026 completas, avaliações mensais persistentes, histórico operacional íntegro e exportações Excel integralmente reconciliadas.

**Architecture:** preservar o contrato único de repositório e o Supabase como fonte canônica em Preview/Production. Introduzir um contexto mensal único consumido por todas as superfícies, manter regras de avaliação em domínio/serviço, construir uma projeção cronológica unificada sem duplicar dados e certificar exportações por reconciliação automatizada. Mudanças de navegação e aparência devem reutilizar o design system existente e não alterar a paleta nem decisões de produto consolidadas.

**Tech Stack:** JavaScript no navegador e Node.js 24, Supabase/PostgreSQL 17, RLS, RPCs transacionais, Playwright 1.61, Node Test Runner, TypeScript apenas para tipos gerados do banco, renderer OOXML próprio.

## Global Constraints

- O código-fonte e os ambientes implantados prevalecem sobre documentação histórica.
- Production usa `SupabaseRepository`; `LocalStorageRepository` permanece somente para rollback emergencial.
- Não alterar a paleta de cores nem descaracterizar decisões visuais vigentes.
- Não adicionar framework, ORM, biblioteca de estado, biblioteca de planilha ou dependência sem necessidade comprovada.
- Toda mutação deve respeitar Auth, RLS, `cre_scope`, autoria, auditoria e concorrência otimista por `row_version`.
- Controladores da mesma CRE colaboram transversalmente; carteira é responsabilidade principal, não barreira de acesso.
- Gestão SME permanece conforme ADR-022.
- Mobile deve preservar conteúdo, filtros e ações essenciais.
- Exportações Excel são produto final institucional e devem reconciliar integralmente com a informação canônica.
- Cada tarefa termina com teste automatizado, validação visual aplicável e commit isolado.

---

## Decomposição obrigatória

Este documento é o plano mestre. A execução deve ocorrer em sete subprojetos sequenciais, cada um com PR próprio e possibilidade de homologação independente:

1. contexto global de competência;
2. avaliação mensal e consolidação;
3. histórico cronológico operacional;
4. certificação das exportações Excel;
5. navegação contextual e retorno;
6. polimento editorial e visual;
7. homologação e liberação oficial.

Não agrupar subprojetos em um único PR.

---

### Task 1: Fixar a linha de base e transformar achados em testes de regressão

**Files:**
- Create: `tests/unit/officialization-baseline.test.js`
- Create: `tests/e2e/officialization-baseline.spec.js`
- Modify: `scripts/audit-functional-persistence.js`
- Modify: `docs/reference/PRODUCT_SURFACE_CATALOG.md`

**Interfaces:**
- Consumes: `window.RadarApplicationData`, `window.RadarAccessPolicy`, `COMPETENCIAS`, `activeCompetenciaKey`, `switchView`.
- Produces: inventário testável de superfícies, perfis, seletores mensais e exportadores que os subprojetos seguintes devem satisfazer.

- [ ] **Step 1: escrever teste unitário que reproduz a limitação atual**

```javascript
test('linha de base detecta competência ativa fixa em maio', () => {
    const source = fs.readFileSync('app.js', 'utf8');
    assert.match(source, /activeCompetenciaKey\s*=\s*['"]2026-05['"]/);
});
```

- [ ] **Step 2: escrever teste E2E que prova a ausência do seletor mensal global**

```javascript
test('header possui indicador, mas não seletor mensal global na linha de base', async ({ page }) => {
    await bootAuthorizedFixture(page, { role: 'controller' });
    await expect(page.locator('#global-competence-badge')).toBeVisible();
    await expect(page.locator('#global-competence-select')).toHaveCount(0);
});
```

- [ ] **Step 3: executar os testes e confirmar o estado observado**

Run:

```bash
node --test tests/unit/officialization-baseline.test.js
npx playwright test tests/e2e/officialization-baseline.spec.js --project=desktop-chromium
```

Expected: PASS, porque os testes documentam o comportamento anterior à correção.

- [ ] **Step 4: ampliar a auditoria funcional**

Adicionar ao relatório JSON:

```javascript
{
  competenceNavigation: {
    configuredCount,
    availableCount,
    activeKey,
    closingKey,
    hasGlobalMonthlySelector,
    viewsUsingActiveCompetence
  },
  excelCertification: {
    smeExporterInstalled,
    institutionalExporterInstalled,
    reconciliationGateInstalled
  }
}
```

- [ ] **Step 5: registrar o catálogo de superfícies afetadas**

Incluir Dashboard, Carteira, Competências, Pendências, Prontuário, Inventário, Registros Internos, Configurações SME, modais, alertas e exportações, com indicação de:

- usa competência global;
- possui controle local;
- permite mutação;
- perfis autorizados;
- rota/origem de retorno.

- [ ] **Step 6: executar readiness**

```bash
npm run test:readiness
```

Expected: PASS.

- [ ] **Step 7: commit**

```bash
git add tests/unit/officialization-baseline.test.js tests/e2e/officialization-baseline.spec.js scripts/audit-functional-persistence.js docs/reference/PRODUCT_SURFACE_CATALOG.md
git commit -m "test: fixar linha de base da oficialização"
```

---

### Task 2: Criar contexto global de competência como fonte única da navegação mensal

**Files:**
- Create: `src/domain/competence-context.js`
- Create: `tests/unit/competence-context.test.js`
- Modify: `src/integration/exercise-management.js`
- Modify: `src/integration/exercise-early-init.js`
- Modify: `src/data/state-bridge.js`
- Modify: `app.js`

**Interfaces:**
- Produces:

```javascript
RadarCompetenceContext.initialize({
  competences,
  currentExercise,
  closingCompetence,
  initialCompetence,
  storage
});

RadarCompetenceContext.getState();
// { exercise: '2026', activeKey: '2026-06', availableKeys: [...], closingKey: '2026-06' }

RadarCompetenceContext.select(key, { source, replaceHistory });
RadarCompetenceContext.subscribe(listener);
RadarCompetenceContext.getAvailableForExercise(exercise);
```

- Consumes: competências do `StateBridge`, configuração canônica e domínio `RadarCompetencia`.

- [ ] **Step 1: escrever testes de domínio**

```javascript
test('seleciona a competência de fechamento quando válida', () => {
  const context = createContext({
    competences: ['2026-01', '2026-02', '2026-06'],
    currentExercise: '2026',
    closingCompetence: '2026-06'
  });
  assert.equal(context.getState().activeKey, '2026-06');
});

test('não aceita competência inexistente ou de outro exercício', () => {
  const context = createContext({ competences: ['2026-01'], currentExercise: '2026' });
  assert.throws(() => context.select('2027-01'), { code: 'INVALID_COMPETENCE_SELECTION' });
});

test('preserva seleção válida da sessão sem ultrapassar as competências autorizadas', () => {
  const storage = memoryStorage({ radar_pdde_active_competence: '2026-08' });
  const context = createContext({ competences: all2026, currentExercise: '2026', storage });
  assert.equal(context.getState().activeKey, '2026-08');
});
```

- [ ] **Step 2: executar e confirmar falha**

```bash
node --test tests/unit/competence-context.test.js
```

Expected: FAIL com módulo inexistente.

- [ ] **Step 3: implementar módulo sem dependência de DOM**

Regras exatas:

1. competência deve existir na coleção canônica;
2. seleção deve pertencer ao exercício ativo;
3. seleção explícita do usuário prevalece sobre `closingCompetence` durante a sessão;
4. na primeira carga, usar seleção persistida válida; senão fechamento válido; senão competência cronologicamente mais recente disponível;
5. nunca usar constante mensal em `app.js`;
6. notificar assinantes uma única vez por alteração real;
7. persistir apenas a chave `YYYY-MM`, nunca o rótulo.

- [ ] **Step 4: remover inicialização fixa**

Substituir:

```javascript
let activeCompetenciaKey = '2026-05';
```

por leitura inicial segura:

```javascript
let activeCompetenciaKey = null;
```

Após o `StateBridge` carregar:

```javascript
const competenceState = window.RadarCompetenceContext.initialize({...}).getState();
activeCompetenciaKey = competenceState.activeKey;
```

- [ ] **Step 5: conectar exercício e competência**

`changeExercise(year)` deve chamar o contexto e não escrever diretamente em variável global:

```javascript
const next = RadarCompetenceContext.selectExercise(year);
currentExercise = next.exercise;
activeCompetenciaKey = next.activeKey;
```

- [ ] **Step 6: sincronizar alterações**

Registrar um assinante único:

```javascript
RadarCompetenceContext.subscribe(({ activeKey, exercise }) => {
  activeCompetenciaKey = activeKey;
  currentExercise = exercise;
  updateGlobalCompetenceIndicator();
  renderCurrentViewPreservingContext();
});
```

- [ ] **Step 7: executar testes**

```bash
node --test tests/unit/competence-context.test.js tests/unit/state-bridge.test.js tests/unit/configuration-service.test.js
npm run test:integration
```

Expected: PASS.

- [ ] **Step 8: commit**

```bash
git add src/domain/competence-context.js src/integration/exercise-management.js src/integration/exercise-early-init.js src/data/state-bridge.js app.js tests/unit/competence-context.test.js
git commit -m "feat: centralizar contexto global de competência"
```

---

### Task 3: Disponibilizar junho a dezembro de 2026 com regra explícita de abertura

**Files:**
- Create: `supabase/migrations/<timestamp>_competence_operational_availability.sql`
- Create: `supabase/tests/database/competence-operational-availability.test.sql`
- Modify: `src/application/configuration-service.js`
- Modify: `src/domain/json-contracts.js`
- Modify: `src/data/legacy-state-adapter.js`
- Modify: `src/types/database.types.ts` via geração
- Modify: `app.js`
- Modify: `docs/reference/SUPABASE_DATA_DICTIONARY.md`

**Architecture decision:** separar “competência existente”, “competência disponível para lançamento” e “competência fechada”. Não usar `closing_competence` como limite para esconder meses futuros.

**Schema produced:** adicionar à tabela `competences`:

```sql
operational_status text not null default 'available'
  check (operational_status in ('planned', 'available', 'closed'))
```

- [ ] **Step 1: escrever pgTAP antes da migration**

```sql
select has_column('public', 'competences', 'operational_status');
select col_not_null('public', 'competences', 'operational_status');
select results_eq(
  $$ select count(*)::bigint from public.competences where exercise = 2026 $$,
  array[12::bigint]
);
```

- [ ] **Step 2: executar local e confirmar falha**

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
```

Expected: FAIL na coluna ausente.

- [ ] **Step 3: implementar migration transacional**

Estado inicial autorizado para 2026:

```sql
update public.competences
set operational_status = case
  when id between '2026-01' and '2026-05' then 'closed'
  when id between '2026-06' and '2026-12' then 'available'
  else operational_status
end;
```

Não alterar nem apagar verificações existentes.

- [ ] **Step 4: atualizar contratos e adaptadores**

Formato canônico:

```javascript
{
  key: '2026-06',
  label: 'Junho 2026',
  bonifPrazo: '2026-07-15',
  operationalStatus: 'available'
}
```

- [ ] **Step 5: remover o filtro incorreto da tela mensal**

Substituir:

```javascript
COMPETENCIAS.filter(c => c.key <= config.competenciaFechamento)
```

por:

```javascript
RadarCompetenceContext.getAvailableForExercise(currentExercise)
```

A lista deve incluir `available` e `closed`; `planned` pode aparecer desabilitada somente quando decisão de produto determinar sua visibilidade.

- [ ] **Step 6: executar geração e gates**

```bash
npm run supabase:gen:types
npm run build:supabase-client
npm run build:ajv
npm run check:generated
npm run typecheck:database
npm run supabase:test:db
npm run test:readiness
```

Expected: PASS.

- [ ] **Step 7: commit**

```bash
git add supabase/migrations supabase/tests/database src/application/configuration-service.js src/domain/json-contracts.js src/data/legacy-state-adapter.js src/types/database.types.ts app.js docs/reference/SUPABASE_DATA_DICTIONARY.md
git commit -m "feat: disponibilizar competências operacionais de 2026"
```

---

### Task 4: Adicionar seletor mensal global em todas as superfícies e perfis

**Files:**
- Create: `src/integration/global-competence-selector.js`
- Create: `src/styles/global-competence-selector.css`
- Create: `tests/unit/global-competence-selector.test.js`
- Create: `tests/e2e/global-competence-selector.spec.js`
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/integration/mobile-navigation.js`
- Modify: `app.js`

**Interfaces:**

```javascript
RadarGlobalCompetenceSelector.install({
  selectId: 'global-competence-select',
  context: RadarCompetenceContext,
  format: RadarCompetencia.formatCompetencia
});
```

- [ ] **Step 1: escrever teste DOM unitário**

```javascript
test('renderiza todas as competências disponíveis e seleciona a ativa', () => {
  const select = renderSelector({ available: all2026, activeKey: '2026-08' });
  assert.equal(select.options.length, 12);
  assert.equal(select.value, '2026-08');
});
```

- [ ] **Step 2: escrever matriz E2E por perfil e superfície**

```javascript
for (const role of ['controller', 'federal_assistant', 'sme_management', 'inventory']) {
  for (const view of ['dashboard', 'escolas', 'competencias', 'pendencias', 'inventario', 'auditoria']) {
    test(`${role} altera competência em ${view}`, async ({ page }) => {
      await bootAuthorizedFixture(page, { role });
      await navigateToView(page, view);
      await page.locator('#global-competence-select').selectOption('2026-08');
      await expect(page.locator('#global-competence-select')).toHaveValue('2026-08');
      await expect(page.locator('#global-competence-label')).toContainText('Agosto');
    });
  }
}
```

Aplicar lista de superfícies permitidas por perfil; não testar navegação a telas proibidas.

- [ ] **Step 3: executar e confirmar falha**

```bash
node --test tests/unit/global-competence-selector.test.js
npx playwright test tests/e2e/global-competence-selector.spec.js --project=desktop-chromium
```

- [ ] **Step 4: substituir badge passivo por controle composto**

Estrutura:

```html
<div class="global-competence-control">
  <label for="global-competence-select">Competência</label>
  <select id="global-competence-select" aria-describedby="global-competence-help"></select>
  <span id="global-competence-help" class="sr-only">A seleção atualiza todas as telas e exportações mensais.</span>
</div>
```

Manter identidade visual atual; usar tokens existentes.

- [ ] **Step 5: garantir mobile**

Em largura reduzida, o controle deve continuar acessível no header móvel ou drawer, sem ocultar o valor ativo.

- [ ] **Step 6: evitar seletores concorrentes**

A tela `renderCompetencias()` pode manter um seletor contextual apenas se for o mesmo elemento sincronizado. Preferência: remover o controle duplicado da página e usar o global.

- [ ] **Step 7: executar matriz**

```bash
npm run test:e2e -- tests/e2e/global-competence-selector.spec.js
npm run test:mobile -- tests/e2e/global-competence-selector.spec.js
npm run test:readiness
```

- [ ] **Step 8: commit**

```bash
git add src/integration/global-competence-selector.js src/styles/global-competence-selector.css tests/unit/global-competence-selector.test.js tests/e2e/global-competence-selector.spec.js index.html styles.css src/integration/mobile-navigation.js app.js
git commit -m "feat: disponibilizar seletor mensal global"
```

---

### Task 5: Garantir que todas as projeções usem a mesma competência

**Files:**
- Modify: `src/domain/operational-projection.js`
- Modify: `src/integration/cycle-b-dashboard.js`
- Modify: `src/integration/cycle-b-dashboard-result.js`
- Modify: `src/integration/cycle-b-carteira.js`
- Modify: `src/integration/task-9-cross-view.js`
- Modify: `src/integration/task-10-alerts-competence.js`
- Modify: `app.js`
- Create: `tests/unit/competence-projection-consistency.test.js`
- Create: `tests/e2e/competence-cross-view-consistency.spec.js`

**Interface rule:** toda projeção mensal recebe `competenceKey` explicitamente. Nenhuma função de domínio lê variável global oculta.

```javascript
buildSchoolOperationalProjection({ school, competenceKey, state, profile });
```

- [ ] **Step 1: escrever teste de consistência entre projeções**

```javascript
test('dashboard, carteira e prontuário retornam o mesmo resultado mensal', () => {
  const dashboard = projectDashboard(fixture, '2026-08');
  const portfolio = projectPortfolio(fixture, '2026-08');
  const record = projectSchoolRecord(fixture.schoolId, fixture, '2026-08');
  assert.deepEqual(summary(dashboard), summary(portfolio));
  assert.deepEqual(summary(portfolio), summary(record));
});
```

- [ ] **Step 2: localizar leituras implícitas**

Executar busca:

```bash
rg "activeCompetenciaKey|competenciaFechamento|2026-05" app.js src tests
```

Classificar cada ocorrência como:

- adaptação de interface permitida;
- regra de domínio a refatorar;
- fixture/teste legítimo;
- constante proibida.

- [ ] **Step 3: alterar assinaturas e chamadas**

Cada renderizador recebe a chave do contexto no início e a repassa às projeções.

- [ ] **Step 4: validar navegação cruzada**

Fluxo E2E:

1. selecionar agosto;
2. abrir card de status no Dashboard;
3. chegar à Carteira filtrada;
4. abrir Prontuário;
5. abrir Pendência;
6. voltar;
7. confirmar agosto em todas as etapas.

- [ ] **Step 5: executar testes**

```bash
node --test tests/unit/competence-projection-consistency.test.js
npx playwright test tests/e2e/competence-cross-view-consistency.spec.js --project=desktop-chromium
npm run test:readiness
```

- [ ] **Step 6: commit**

```bash
git add src/domain/operational-projection.js src/integration/cycle-b-dashboard.js src/integration/cycle-b-dashboard-result.js src/integration/cycle-b-carteira.js src/integration/task-9-cross-view.js src/integration/task-10-alerts-competence.js app.js tests/unit/competence-projection-consistency.test.js tests/e2e/competence-cross-view-consistency.spec.js
git commit -m "refactor: unificar competência nas projeções operacionais"
```

---

### Task 6: Certificar a jornada de avaliação mensal e o resultado apta/inapta

**Files:**
- Modify: `src/application/verification-service.js`
- Modify: `src/domain/operational-projection.js`
- Modify: `src/data/supabase-repository.js`
- Modify: `app.js`
- Create: `tests/unit/monthly-evaluation-rules.test.js`
- Create: `tests/integration/monthly-evaluation-persistence.test.js`
- Create: `tests/e2e/monthly-evaluation-journey.spec.js`
- Modify: `supabase/tests/database/atomic-operations.test.sql`

**Produces:**

```javascript
VerificationService.saveMonthlyEvaluation({
  schoolId,
  competenceId,
  programId,
  bonification,
  analysis,
  expectedRowVersion
});
```

Result:

```javascript
{
  verification,
  derived: {
    bonusResult: 'apta' | 'inapta' | null,
    technicalStatus: 'not_started' | 'in_progress' | 'complete',
    openPendencyCount: number
  }
}
```

- [ ] **Step 1: formalizar tabela de decisão em teste**

Casos mínimos:

- todos os itens aplicáveis `Sim` → `apta`;
- qualquer item aplicável `Não` → `inapta`;
- somente `Não se aplica` nos itens autorizados → resultado conforme regra vigente e explicitamente testada;
- campo necessário vazio → sem consolidação;
- alteração após consolidação pela Assistente reabre estado conforme regra vigente;
- concorrência com `row_version` incorreta → erro explícito, sem sobrescrita.

- [ ] **Step 2: escrever integração de persistência**

Salvar, recarregar em novo repositório e comparar objeto canônico completo.

- [ ] **Step 3: garantir operação atômica**

Se salvar avaliação puder criar/atualizar pendências e notas correlatas, executar via RPC única. Nenhuma sequência parcialmente persistida deve permanecer após erro.

- [ ] **Step 4: escrever E2E por Controlador e Assistente**

Fluxo:

1. escolher competência;
2. abrir unidade;
3. preencher cada programa;
4. salvar;
5. observar feedback;
6. sair e entrar novamente;
7. confirmar dados;
8. confirmar status no Prontuário, Carteira, Dashboard e Competências;
9. confirmar autoria e auditoria.

- [ ] **Step 5: executar gates**

```bash
node --test tests/unit/monthly-evaluation-rules.test.js
npm run test:integration
npm run supabase:test:db
npx playwright test tests/e2e/monthly-evaluation-journey.spec.js --project=desktop-chromium
npm run test:readiness
```

- [ ] **Step 6: commit**

```bash
git add src/application/verification-service.js src/domain/operational-projection.js src/data/supabase-repository.js app.js tests/unit/monthly-evaluation-rules.test.js tests/integration/monthly-evaluation-persistence.test.js tests/e2e/monthly-evaluation-journey.spec.js supabase/tests/database/atomic-operations.test.sql
git commit -m "feat: certificar jornada de avaliação mensal"
```

---

### Task 7: Construir linha do tempo cronológica única da unidade

**Files:**
- Create: `src/domain/school-timeline.js`
- Create: `src/integration/school-timeline.js`
- Create: `src/styles/school-timeline.css`
- Create: `tests/unit/school-timeline.test.js`
- Create: `tests/e2e/school-timeline.spec.js`
- Modify: `app.js`
- Modify: `index.html`

**Consumes:** pendências, tentativas, contatos, verificações, logs administrativos, notas e bens já carregados pelo repositório.

**Produces:**

```javascript
buildSchoolTimeline({
  schoolId,
  competenceKey,
  pendencies,
  attempts,
  contacts,
  verifications,
  logs,
  invoices,
  assets,
  accessProfile
});
```

Evento normalizado:

```javascript
{
  id,
  occurredAt,
  type,
  title,
  description,
  actor,
  status,
  competenceKey,
  programId,
  pendencyId,
  visibility,
  sourceEntity,
  sourceId
}
```

- [ ] **Step 1: escrever testes de ordenação e deduplicação**

```javascript
test('ordena eventos do mais recente para o mais antigo com desempate estável', () => {});
test('não duplica abertura registrada em pendência e log administrativo', () => {});
test('mantém tentativa substituída no histórico', () => {});
test('oculta conteúdo técnico da Gestão SME sem apagar eventos permitidos', () => {});
```

- [ ] **Step 2: implementar projeção pura**

Não persistir uma tabela de timeline. A linha do tempo é uma projeção de entidades canônicas, evitando nova fonte de verdade.

- [ ] **Step 3: definir grupos visuais**

Tipos mínimos:

- avaliação mensal;
- abertura de pendência;
- contato/atendimento;
- novo envio;
- reanálise;
- resolução/cancelamento/reabertura;
- nota fiscal/despesa;
- encaminhamento/inventariação;
- alteração administrativa permitida.

- [ ] **Step 4: implementar acessibilidade**

Usar lista semântica, data/hora legível, ícone decorativo com `aria-hidden`, rótulo textual obrigatório e agrupamento opcional por dia/mês.

- [ ] **Step 5: escrever E2E de jornada completa**

Criar pendência, contato, envio incorreto, novo envio, reanálise correta e resolução; verificar seis eventos na ordem esperada e persistência após recarga.

- [ ] **Step 6: executar testes desktop/mobile**

```bash
node --test tests/unit/school-timeline.test.js
npx playwright test tests/e2e/school-timeline.spec.js --project=desktop-chromium --project=mobile-chromium
npm run test:readiness
```

- [ ] **Step 7: commit**

```bash
git add src/domain/school-timeline.js src/integration/school-timeline.js src/styles/school-timeline.css tests/unit/school-timeline.test.js tests/e2e/school-timeline.spec.js app.js index.html
git commit -m "feat: adicionar histórico cronológico da unidade"
```

---

### Task 8: Reconciliar banco, tela, modelo e arquivo Excel célula a célula

**Files:**
- Create: `src/domain/excel-reconciliation.js`
- Create: `scripts/certify-excel-exports.mjs`
- Create: `tests/fixtures/excel-certification/representative-state.json`
- Create: `tests/unit/excel-reconciliation.test.js`
- Create: `tests/integration/excel-production-parity.test.js`
- Create: `tests/e2e/excel-export-parity.spec.js`
- Modify: `src/domain/excel-sme-export-model.js`
- Modify: `src/integration/excel-export-integration.js`
- Modify: renderer do modelo editorial existente
- Modify: `package.json`
- Create: `docs/runbooks/EXCEL_CERTIFICATION.md`

**Produces:**

```javascript
reconcileExcelExport({ canonicalState, competenceKey, model, workbookEntries });
// { ok, comparedCells, divergences, sourceDigest, modelDigest, workbookDigest }
```

- [ ] **Step 1: criar fixture representativa**

Incluir:

- escola com Básico apenas;
- escola com Qualidade múltipla;
- escola com Equidade;
- todos os três grupos;
- valores `Sim`, `Não`, `Não se aplica` e vazio;
- escola fora de escopo da competência;
- resultado apta e inapta;
- competência anterior e posterior para provar isolamento mensal;
- caracteres acentuados e designações fora de ordem de entrada.

- [ ] **Step 2: escrever teste de matriz esperada**

Cada linha e coluna deve declarar origem exata:

```javascript
expectCell('E2', {
  schoolId: 'school-1',
  competenceKey: '2026-08',
  programGroup: 'BASIC',
  documentKey: 'extCC',
  expected: 'SIM'
});
```

- [ ] **Step 3: inspecionar OOXML gerado**

Ler `sheet1.xml`, converter referências A1 em matriz e comparar todas as células de dados, não apenas expressões regulares selecionadas.

- [ ] **Step 4: gerar manifesto de certificação**

Saída JSON:

```json
{
  "competenceKey": "2026-08",
  "schoolCount": 164,
  "comparedCells": 4212,
  "divergenceCount": 0,
  "sourceDigest": "sha256:...",
  "modelDigest": "sha256:...",
  "workbookDigest": "sha256:..."
}
```

- [ ] **Step 5: testar os dois produtos Excel**

Executar o mesmo pipeline para:

1. modelo SME institucional;
2. modelo editorial RADAR.

Nenhum exportador pode manter mapeamento independente das regras canônicas.

- [ ] **Step 6: criar comando obrigatório**

`package.json`:

```json
"test:excel-certification": "node scripts/certify-excel-exports.mjs"
```

Adicionar ao gate de release, não necessariamente a cada teste unitário rápido.

- [ ] **Step 7: homologar no Microsoft Excel desktop**

O runbook deve exigir:

- abertura sem mensagem de reparo;
- conferência de filtros, congelamento, impressão e acentuação;
- comparação de amostra estratificada com o site;
- preservação do arquivo e manifesto como evidência do release.

- [ ] **Step 8: executar**

```bash
node --test tests/unit/excel-reconciliation.test.js
npm run test:integration
npm run test:excel-certification
npx playwright test tests/e2e/excel-export-parity.spec.js --project=desktop-chromium
```

Expected: zero divergências.

- [ ] **Step 9: commit**

```bash
git add src/domain/excel-reconciliation.js scripts/certify-excel-exports.mjs tests/fixtures/excel-certification tests/unit/excel-reconciliation.test.js tests/integration/excel-production-parity.test.js tests/e2e/excel-export-parity.spec.js src/domain/excel-sme-export-model.js src/integration/excel-export-integration.js package.json docs/runbooks/EXCEL_CERTIFICATION.md
git commit -m "test: certificar paridade das exportações Excel"
```

---

### Task 9: Implementar navegação contextual e botões de voltar seguros

**Files:**
- Create: `src/domain/navigation-context.js`
- Create: `src/integration/contextual-back-navigation.js`
- Create: `src/styles/contextual-navigation.css`
- Create: `tests/unit/navigation-context.test.js`
- Create: `tests/e2e/contextual-back-navigation.spec.js`
- Modify: `src/integration/navigation-bootstrap.js`
- Modify: `src/integration/task-9-cross-view.js`
- Modify: `app.js`
- Modify: `index.html`

**Produces:**

```javascript
RadarNavigationContext.push({
  view,
  schoolId,
  pendencyId,
  competenceKey,
  filters,
  scrollAnchor
});
RadarNavigationContext.back({ fallbackView: 'dashboard' });
```

- [ ] **Step 1: escrever testes de pilha contextual**

```javascript
test('volta ao resultado filtrado sem perder competência', () => {});
test('não volta para modal fechado nem estado inválido', () => {});
test('usa fallback seguro quando acesso ao destino foi revogado', () => {});
```

- [ ] **Step 2: integrar com History API**

O estado deve conter apenas identificadores e filtros serializáveis. Não colocar objetos de dados completos em `history.state`.

- [ ] **Step 3: definir onde o botão aparece**

Obrigatório em:

- Prontuário aberto a partir de Carteira, Dashboard, Competências ou busca;
- detalhe de pendência;
- fluxos de drill-down do Dashboard;
- telas secundárias sem item principal correspondente na sidebar.

Não adicionar em:

- Dashboard raiz;
- telas cujo retorno natural já é a sidebar e não há contexto anterior;
- modais, que mantêm ação Fechar/Cancelar.

- [ ] **Step 4: preservar estado**

Ao voltar, restaurar:

- competência;
- perfil efetivo;
- filtros;
- consulta de busca;
- paginação/expansão relevante;
- foco e, quando possível, âncora de rolagem.

- [ ] **Step 5: executar desktop/mobile**

```bash
node --test tests/unit/navigation-context.test.js
npx playwright test tests/e2e/contextual-back-navigation.spec.js --project=desktop-chromium --project=mobile-chromium
```

- [ ] **Step 6: commit**

```bash
git add src/domain/navigation-context.js src/integration/contextual-back-navigation.js src/styles/contextual-navigation.css tests/unit/navigation-context.test.js tests/e2e/contextual-back-navigation.spec.js src/integration/navigation-bootstrap.js src/integration/task-9-cross-view.js app.js index.html
git commit -m "feat: adicionar navegação contextual segura"
```

---

### Task 10: Aplicar polimento editorial transversal sem alterar a identidade do produto

**Files:**
- Create: `docs/reference/EDITORIAL_UI_CHECKLIST.md`
- Create: `tests/e2e/editorial-visual-regression.spec.js`
- Modify: `styles.css`
- Modify: arquivos em `src/styles/` somente quando a superfície correspondente exigir
- Modify: renderizadores em `app.js` e `src/integration/` somente para estrutura semântica e classes

**Constraints:** nenhuma nova cor de marca; nenhuma troca de logomarca; nenhum redesenho estrutural que altere regras de produto.

- [ ] **Step 1: inventariar tokens existentes**

Registrar tipografia, escalas, espaçamento, bordas, raios, sombras, estados e ícones usados.

- [ ] **Step 2: escrever checklist objetivo**

Critérios por tela:

- título e subtítulo coerentes;
- hierarquia tipográfica;
- alinhamento de ações;
- densidade adequada;
- rótulos completos;
- estados vazios úteis;
- feedback de carregamento/erro/sucesso;
- foco visível;
- contraste;
- responsividade;
- consistência de ícones;
- ausência de mensagens de infraestrutura para o usuário final.

- [ ] **Step 3: criar screenshots de referência**

Cobrir os quatro perfis, desktop e mobile, nas principais superfícies e nos estados com dados/vazio/erro.

- [ ] **Step 4: aplicar mudanças por superfície**

Um commit por grupo coerente: header e navegação; tabelas/cartões; prontuário/timeline; pendências; Excel/relatórios; estados e mensagens.

- [ ] **Step 5: executar acessibilidade e regressão**

```bash
npx playwright test tests/e2e/editorial-visual-regression.spec.js
npm run test:mobile
npm run test:e2e
```

- [ ] **Step 6: commit final do subprojeto**

```bash
git add docs/reference/EDITORIAL_UI_CHECKLIST.md tests/e2e/editorial-visual-regression.spec.js styles.css src/styles app.js src/integration
git commit -m "style: consolidar polimento editorial do produto"
```

---

### Task 11: Fortalecer segurança operacional antes da liberação oficial

**Files:**
- Modify: `docs/runbooks/SUPABASE_CONNECTION.md`
- Create: `docs/runbooks/PRODUCTION_RELEASE.md`
- Create: `scripts/check-production-security.mjs`
- Create: `tests/unit/production-security-gate.test.js`
- Modify: `package.json`
- Modify: workflow de release/deployment controlado aplicável

- [ ] **Step 1: habilitar proteção contra senhas vazadas no Supabase Auth**

Registrar evidência da configuração sem copiar segredos.

- [ ] **Step 2: fixar major do Node operacional**

Alterar de faixa que permite nova major automática para contrato deliberado, por exemplo:

```json
"engines": { "node": ">=24 <25" }
```

A versão exata deve corresponder ao runtime validado na Vercel e no CI.

- [ ] **Step 3: criar gate de segurança**

O script deve falhar quando:

- runtime não for `supabase-production`;
- ativação não estiver aprovada;
- chave pública não usar o formato esperado;
- configuração expuser `service_role`, senha ou token secreto;
- advisors apresentarem alerta de segurança classificado como bloqueador;
- migrations de Production divergirem do repositório.

- [ ] **Step 4: adicionar comando**

```json
"check:production-security": "node scripts/check-production-security.mjs"
```

- [ ] **Step 5: testar**

```bash
node --test tests/unit/production-security-gate.test.js
npm run check:production-security
```

- [ ] **Step 6: commit**

```bash
git add docs/runbooks/SUPABASE_CONNECTION.md docs/runbooks/PRODUCTION_RELEASE.md scripts/check-production-security.mjs tests/unit/production-security-gate.test.js package.json .github/workflows
git commit -m "security: adicionar gate de liberação de produção"
```

---

### Task 12: Executar homologação final com usuários e massa controlada

**Files:**
- Create: `docs/runbooks/USER_ACCEPTANCE_TEST.md`
- Create: `docs/evidence/release-<version>/README.md`
- Create: `tests/e2e/official-user-journeys.spec.js`
- Modify: `docs/CURRENT_STAGE.md`
- Modify: `docs/DECISION_LOG.md`

**Journeys required:**

1. Controlador — selecionar competência, avaliar escola, abrir pendência, registrar contato, reanalisar e exportar;
2. Assistente — acompanhar equipe, atuar transversalmente, retificar e exportar;
3. Gestão SME — consultar bonificação, pendências e registros permitidos sem mutação;
4. Inventário — consultar escola, receber bem e concluir inventariação;
5. Administrador técnico — validar infraestrutura e simulação sem herdar funções operacionais indevidas.

- [ ] **Step 1: preparar massa de homologação descartável**

Usar prefixo `HML-<run-id>`, contas temporárias e cleanup obrigatório. Não contaminar dados institucionais.

- [ ] **Step 2: executar matriz E2E remota**

```bash
npx playwright test tests/e2e/official-user-journeys.spec.js --config=playwright.supabase-preview.config.js
```

- [ ] **Step 3: executar reconciliação Excel**

Gerar os dois arquivos de homologação, manifestos e hashes.

- [ ] **Step 4: realizar UAT orientado por roteiro**

Cada participante registra:

- perfil;
- jornada;
- resultado esperado;
- resultado observado;
- evidência;
- severidade de divergência;
- aprovação ou reprovação.

- [ ] **Step 5: validar restauração**

Comprovar backup lógico, restauração em ambiente descartável e reconciliação do estado restaurado.

- [ ] **Step 6: atualizar documentação final**

`CURRENT_STAGE.md` deve declarar uma das situações:

- liberado para operação oficial;
- liberado com restrições expressas;
- não liberado, com bloqueadores objetivos.

- [ ] **Step 7: executar gate cumulativo**

```bash
npm ci
npm audit --audit-level=high
npm run test:readiness
npm run test:e2e
npm run test:mobile
npm run supabase:test:db
npm run supabase:lint:db
npm run test:excel-certification
npm run check:production-security
npm run build:vercel
```

Expected: todos os comandos aprovados e zero divergências Excel.

- [ ] **Step 8: commit**

```bash
git add docs/runbooks/USER_ACCEPTANCE_TEST.md docs/evidence/release-* tests/e2e/official-user-journeys.spec.js docs/CURRENT_STAGE.md docs/DECISION_LOG.md
git commit -m "docs: registrar homologação da liberação oficial"
```

---

## Sequência de PRs

| PR | Escopo | Dependência | Critério de saída |
|---|---|---|---|
| 1 | Contexto e seletor global de competência | nenhuma | 12 meses acessíveis e estado preservado |
| 2 | Avaliação mensal e consolidação | PR 1 | jornada persiste e projeta status coerente |
| 3 | Timeline operacional | PR 2 | histórico íntegro e acessível |
| 4 | Certificação Excel | PR 2 | zero divergências banco–modelo–arquivo |
| 5 | Navegação contextual | PRs 1–3 | retorno preserva contexto |
| 6 | Polimento editorial | PRs 1–5 | matriz visual e acessível aprovada |
| 7 | Segurança, UAT e release | todos | gate cumulativo e decisão formal |

## Self-review

### Cobertura do pedido

- competências junho–dezembro: Tasks 2–4;
- seletor em todas as telas/perfis: Task 4;
- avaliações mensais e apta/inapta: Task 6;
- pendências, contatos e reanálises: Task 7 e jornada da Task 6;
- histórico cronológico profissional: Task 7;
- Excel SME e editorial com correspondência absoluta: Task 8;
- botões de voltar e preservação de contexto: Task 9;
- polimento visual/editorial: Task 10;
- segurança e liberação oficial: Tasks 11–12;
- documentação alinhada ao código: pacote documental anterior e Task 12.

### Gaps deliberadamente não absorvidos

A remodelagem estrutural de programas por exercício permanece fora deste plano mestre até que sua especificação funcional própria seja aprovada. A execução deste plano deve apenas preservar os programas vigentes e suas relações atuais.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md`.

Recommended execution mode: **subagent-driven development**, com um agente por tarefa, TDD, revisão de conformidade e revisão de qualidade antes de cada merge.
