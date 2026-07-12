# Task 8 — Separação de Indicadores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar de forma definitiva o resultado da bonificação, a situação da análise técnica e a existência de pendência documental, garantindo que combinações como `APTA + Incorreto + pendência ativa` sejam calculadas e exibidas sem contradição.

**Architecture:** O domínio passará a expor dois avaliadores puros e independentes: um para bonificação e outro para análise técnica. A aplicação consumirá esses avaliadores para calcular resumos por programa, competência e escola, mantendo pendências como terceira dimensão derivada de `pendencias.js`. Nenhum novo campo derivado será persistido; todos os indicadores serão calculados em tempo de execução a partir dos dados já existentes.

**Tech Stack:** JavaScript puro no navegador, módulos UMD existentes em `src/domain`, `node:test` para testes unitários, Playwright 1.61.0 para E2E, `localStorage` como persistência ativa, GitHub Actions e Vercel Preview.

## Global Constraints

- Trabalhar somente na branch `feature/ciclo-a-task-8-separacao-indicadores`, baseada no commit `84deb71abcc2b2c6e154f8694e853cdbb7f74362` da `main`.
- Não alterar regras de autorização por perfil; perfis e políticas serão definidos na configuração futura do Supabase.
- Não ativar, configurar ou redesenhar Supabase.
- Não alterar a exportação Excel, nomes de abas, colunas, granularidade ou regra de inclusão.
- Não adicionar dependências npm.
- Não alterar `INITIAL_DATA_VERSION` nem `radar_pdde_pendency_schema_version`.
- Não alterar a estrutura persistida em `localStorage`.
- Não criar campos persistidos para estados derivados de bonificação ou análise.
- Preservar notas fiscais, bens, pendências, tentativas, histórico e dados existentes.
- Não implementar cancelamento, reabertura, retificação administrativa ou as quatro abas finais de Pendências.
- Manter os rótulos canônicos: bonificação `APTA`, `INAPTA`, `Em apuração`, `Não lançada`; análise `Correto`, `Correto após o prazo`, `Incorreto`, `Em análise`, `Não analisado`.
- Merge na `main` e publicação em produção somente após autorização expressa de Wilson Peixoto.

---

## File Map

- `src/domain/fluxo-operacional.js`: avaliadores puros dos estados de bonificação e análise técnica.
- `tests/fluxo-operacional.test.js`: contrato unitário dos novos avaliadores e regressões contra a mistura anterior.
- `app.js`: adaptadores da interface, agregações por escola/competência, Dashboard, Carteira, Competências e Prontuário.
- `styles.css`: apresentação compacta dos dois indicadores no Prontuário e na Carteira, sem introduzir nova paleta.
- `tests/e2e/task-8-indicator-separation.spec.js`: jornadas completas que provam a independência das três dimensões.
- `tests/e2e/functional-core.spec.js`: somente ajustes de seletores ou textos que se tornarem necessários por causa da nova microcopy.
- `tests/e2e/pendency-cycle.spec.js`: somente ajustes de seletores ou textos necessários para preservar os cenários da Task 7.

---

### Task 1: Criar os avaliadores independentes no domínio

**Files:**
- Modify: `src/domain/fluxo-operacional.js:27-30, 73-130, 145-153`
- Modify: `tests/fluxo-operacional.test.js:8-17, 19-124`

**Interfaces:**
- Produces: `getProgramBonificationStatus(verification = {}) -> 'apta' | 'inapta' | 'em-apuracao' | 'nao-lancada'`
- Produces: `getProgramTechnicalAnalysisStatus(verification = {}) -> 'correto' | 'correto-atrasado' | 'incorreto' | 'em-analise' | 'nao-analisado'`
- Preserves: `evaluateBonification(bonificacao)` for the act of consolidation.
- Removes from consumers: `getProgramOperationalStatus(verificacao)`.

- [ ] **Step 1: Atualizar os imports dos testes para os dois novos avaliadores**

Substituir o import de `getProgramOperationalStatus` em `tests/fluxo-operacional.test.js` por:

```js
const {
    DOCUMENT_KEYS,
    buildPendencyContext,
    canRegisterFiscalNote,
    createEmptyVerification,
    evaluateBonification,
    getProgramBonificationStatus,
    getProgramTechnicalAnalysisStatus,
    pendencyMatchesContext,
    shouldRequireFiscalNote
} = require('../src/domain/fluxo-operacional.js');
```

- [ ] **Step 2: Escrever os testes vermelhos de bonificação independente**

Substituir os testes que codificam o estado misto por:

```js
test('mantém bonificação apta mesmo quando a análise técnica está incorreta', () => {
    assert.equal(getProgramBonificationStatus({
        bonificacao: COMPLETE_APTA_BONIFICATION,
        analise: { ...COMPLETE_ANALYSIS, consAssessoria: 'Incorreto' },
        resultadoBonif: 'apta'
    }), 'apta');
});

test('mantém bonificação inapta mesmo quando todas as análises estão corretas', () => {
    assert.equal(getProgramBonificationStatus({
        bonificacao: { ...COMPLETE_APTA_BONIFICATION, notaFiscal: 'Não' },
        analise: Object.fromEntries(DOCUMENT_KEYS.map(key => [key, 'Correto'])),
        resultadoBonif: 'inapta'
    }), 'inapta');
});

test('distingue bonificação não lançada de bonificação em apuração', () => {
    assert.equal(getProgramBonificationStatus(), 'nao-lancada');
    assert.equal(getProgramBonificationStatus(createEmptyVerification()), 'nao-lancada');
    assert.equal(getProgramBonificationStatus({
        ...createEmptyVerification(),
        bonificacao: { ...createEmptyVerification().bonificacao, notaFiscal: 'Sim' }
    }), 'em-apuracao');
});

test('pendência externa não interfere no resultado da bonificação', () => {
    const verification = {
        bonificacao: COMPLETE_APTA_BONIFICATION,
        analise: { ...COMPLETE_ANALYSIS, extCC: 'Incorreto' },
        resultadoBonif: 'apta'
    };
    const activePendency = { status: 'Aberta' };

    assert.equal(activePendency.status, 'Aberta');
    assert.equal(getProgramBonificationStatus(verification), 'apta');
});
```

- [ ] **Step 3: Escrever os testes vermelhos da análise técnica independente**

Adicionar:

```js
test('classifica análise técnica totalmente não analisada', () => {
    assert.equal(
        getProgramTechnicalAnalysisStatus(createEmptyVerification()),
        'nao-analisado'
    );
});

test('classifica análise técnica parcialmente iniciada', () => {
    const verification = createEmptyVerification();
    verification.analise.extCC = 'Correto';

    assert.equal(
        getProgramTechnicalAnalysisStatus(verification),
        'em-analise'
    );
});

test('prioriza análise incorreta sobre os demais estados técnicos', () => {
    assert.equal(getProgramTechnicalAnalysisStatus({
        analise: { ...COMPLETE_ANALYSIS, consAssessoria: 'Incorreto' }
    }), 'incorreto');
});

test('distingue análise correta no prazo de análise correta após o prazo', () => {
    const allCorrect = Object.fromEntries(DOCUMENT_KEYS.map(key => [key, 'Correto']));

    assert.equal(
        getProgramTechnicalAnalysisStatus({ analise: allCorrect }),
        'correto'
    );
    assert.equal(
        getProgramTechnicalAnalysisStatus({ analise: COMPLETE_ANALYSIS }),
        'correto-atrasado'
    );
});
```

- [ ] **Step 4: Executar os testes e confirmar a falha esperada**

Run:

```bash
node --test tests/fluxo-operacional.test.js
```

Expected: FAIL porque `getProgramBonificationStatus` e `getProgramTechnicalAnalysisStatus` ainda não existem.

- [ ] **Step 5: Implementar o avaliador de bonificação**

Adicionar em `src/domain/fluxo-operacional.js`, após `evaluateBonification`:

```js
function hasStartedValue(value) {
    return value !== undefined
        && value !== null
        && value !== ''
        && value !== false;
}

function getProgramBonificationStatus(verification = {}) {
    const result = normalizeText(verification.resultadoBonif);
    if (result === 'apta' || result === 'inapta') {
        return result;
    }

    const bonificacao = verification.bonificacao || {};
    const hasStarted = DOCUMENT_KEYS.some(key => hasStartedValue(bonificacao[key]));
    return hasStarted ? 'em-apuracao' : 'nao-lancada';
}
```

- [ ] **Step 6: Implementar o avaliador de análise técnica**

Adicionar:

```js
function getProgramTechnicalAnalysisStatus(verification = {}) {
    const analise = verification.analise || {};
    const values = DOCUMENT_KEYS.map(key => (
        normalizeText(analise[key]) || 'Não analisado'
    ));

    if (values.includes('Incorreto')) {
        return 'incorreto';
    }
    if (values.every(value => CORRECT_ANALYSES.has(value))) {
        return values.includes('Correto (Atrasado)')
            ? 'correto-atrasado'
            : 'correto';
    }
    if (values.every(value => value === 'Não analisado')) {
        return 'nao-analisado';
    }
    return 'em-analise';
}
```

- [ ] **Step 7: Remover o estado misto e exportar as novas funções**

Remover `getProgramOperationalStatus` e atualizar o objeto exportado para incluir:

```js
getProgramBonificationStatus,
getProgramTechnicalAnalysisStatus,
```

- [ ] **Step 8: Executar os testes unitários do módulo**

Run:

```bash
node --test tests/fluxo-operacional.test.js
```

Expected: PASS, sem testes restantes que esperem que análise `Incorreto` transforme bonificação `apta` em `inapta`.

- [ ] **Step 9: Executar toda a suíte unitária**

Run:

```bash
node --test tests/*.test.js
```

Expected: PASS, zero falhas.

- [ ] **Step 10: Commitar o contrato de domínio**

```bash
git add src/domain/fluxo-operacional.js tests/fluxo-operacional.test.js
git commit -m "feat: separar estados de bonificacao e analise"
```

---

### Task 2: Adaptar os agregadores da aplicação para bonificação e análise independentes

**Files:**
- Modify: `app.js:5100-5260`
- Modify: `app.js:9348-9393`

**Interfaces:**
- Consumes: `RadarFluxoOperacional.getProgramBonificationStatus(verification)`.
- Consumes: `RadarFluxoOperacional.getProgramTechnicalAnalysisStatus(verification)`.
- Produces: `getProgramBonificationStatus(escolaId, compKey, progId)`.
- Produces: `getProgramTechnicalStatus(escolaId, compKey, progId)`.
- Produces: `getProgramBonificationMeta(status)`.
- Produces: `getProgramTechnicalMeta(status)`.
- Produces: `getSchoolTechnicalAnalysisStatus(esc, compKey)`.
- Preserves for compatibility: school aggregate keys `apto`, `inapto`, `emAndamento`, `naoAnalisado`, `foraEscopo`, but with bonus-only meaning.

- [ ] **Step 1: Adicionar wrappers independentes por programa**

Substituir `getProgramVerificationStatus` por:

```js
function getProgramBonificationStatus(escolaId, compKey, progId) {
    const compProgKey = `${compKey}_${progId}`;
    return window.RadarFluxoOperacional.getProgramBonificationStatus(
        verificacoes[escolaId]?.[compProgKey]
    );
}

function getProgramTechnicalStatus(escolaId, compKey, progId) {
    const compProgKey = `${compKey}_${progId}`;
    return window.RadarFluxoOperacional.getProgramTechnicalAnalysisStatus(
        verificacoes[escolaId]?.[compProgKey]
    );
}
```

- [ ] **Step 2: Criar metadados de apresentação distintos**

Substituir `getProgramStatusMeta` por:

```js
function getProgramBonificationMeta(status) {
    const metas = {
        apta: { label: 'APTA', badgeClass: 'badge-success' },
        inapta: { label: 'INAPTA', badgeClass: 'badge-danger' },
        'em-apuracao': { label: 'Em apuração', badgeClass: 'badge-warning' },
        'nao-lancada': { label: 'Não lançada', badgeClass: 'badge-gray' }
    };
    return metas[status] || metas['nao-lancada'];
}

function getProgramTechnicalMeta(status) {
    const metas = {
        correto: { label: 'Correto', badgeClass: 'badge-success' },
        'correto-atrasado': { label: 'Correto após o prazo', badgeClass: 'badge-success' },
        incorreto: { label: 'Incorreto', badgeClass: 'badge-danger' },
        'em-analise': { label: 'Em análise', badgeClass: 'badge-warning' },
        'nao-analisado': { label: 'Não analisado', badgeClass: 'badge-gray' }
    };
    return metas[status] || metas['nao-analisado'];
}
```

- [ ] **Step 3: Tornar `getEscolasStats` exclusivamente orientado à bonificação**

No laço por programa, substituir o uso do estado misto por:

```js
const bonusStatus = getProgramBonificationStatus(e.id, compKey, progId);

if (bonusStatus === 'inapta') {
    inapto++;
    inaptoList.push(schoolProgRef);
} else if (bonusStatus === 'apta') {
    apto++;
    aptoList.push(schoolProgRef);
} else if (bonusStatus === 'em-apuracao') {
    emAndamento++;
    emAndamentoList.push(schoolProgRef);
} else {
    naoAnalisado++;
    naoAnalisadoList.push(schoolProgRef);
}
```

Manter os nomes internos do retorno para minimizar alterações fora do escopo, documentando que `emAndamento` significa bonificação em apuração e `naoAnalisado` significa bonificação não lançada.

- [ ] **Step 4: Criar o agregado técnico por escola**

Adicionar:

```js
function getSchoolTechnicalAnalysisStatus(esc, compKey) {
    if (!esc || !Array.isArray(esc.programasIds) || esc.programasIds.length === 0) {
        return 'nao-analisado';
    }

    const statuses = esc.programasIds.map(progId => (
        getProgramTechnicalStatus(esc.id, compKey, progId)
    ));

    if (statuses.includes('incorreto')) return 'incorreto';
    if (statuses.every(status => status === 'correto')) return 'correto';
    if (statuses.every(status => ['correto', 'correto-atrasado'].includes(status))) {
        return statuses.includes('correto-atrasado') ? 'correto-atrasado' : 'correto';
    }
    if (statuses.every(status => status === 'nao-analisado')) return 'nao-analisado';
    return 'em-analise';
}
```

- [ ] **Step 5: Tornar o status mensal do Prontuário exclusivamente orientado à bonificação**

Em `getCompMonthStatus`, remover `pAtivasComp` da decisão e usar:

```js
const programStatuses = esc.programasIds.map(progId => (
    getProgramBonificationStatus(escolaId, compKey, progId)
));

if (programStatuses.includes('inapta')) {
    return 'inapta';
}
if (programStatuses.length > 0 && programStatuses.every(status => status === 'apta')) {
    return 'apta';
}
if (programStatuses.some(status => ['apta', 'em-apuracao'].includes(status))) {
    return 'em-andamento';
}
return 'nao-lancado';
```

Não usar pendência ativa como motivo para devolver `inapta`.

- [ ] **Step 6: Atualizar todos os usos diretos do antigo helper**

Run:

```bash
grep -n "getProgramVerificationStatus\|getProgramOperationalStatus\|getProgramStatusMeta" app.js src/domain/fluxo-operacional.js tests/*.test.js
```

Expected antes da substituição: ocorrências residuais em `app.js`.

Substituir cada ocorrência conforme a dimensão efetivamente exibida:

- indicadores `APTA/INAPTA` → `getProgramBonificationStatus`;
- indicadores de conformidade técnica → `getProgramTechnicalStatus`;
- badges de bonificação → `getProgramBonificationMeta`;
- badges técnicos → `getProgramTechnicalMeta`.

- [ ] **Step 7: Verificar sintaxe e testes unitários**

```bash
node --check app.js
node --test tests/*.test.js
```

Expected: ambos com exit code 0.

- [ ] **Step 8: Commitar os adaptadores e agregadores**

```bash
git add app.js
git commit -m "refactor: separar agregados operacionais da task 8"
```

---

### Task 3: Corrigir Dashboard e Carteira para apresentar as três dimensões

**Files:**
- Modify: `app.js:5350-7300`
- Modify: `app.js:7300-7600`
- Modify: `styles.css` apenas se necessário para alinhamento dos novos indicadores.

**Interfaces:**
- Consumes: `getSchoolAggregateStatus(esc, compKey)` como resultado agregado de bonificação.
- Consumes: `getSchoolTechnicalAnalysisStatus(esc, compKey)`.
- Consumes: `RadarPendencias.isActivePendency(pendency)` e `RadarPendencias.getNextActor(pendency)`.
- Produces in `getEscolaOperationalData`: `situacao`, `analiseTecnica`, `analiseTecnicaMeta`, `pendenciasAbertas`, `proximaAcao`.

- [ ] **Step 1: Corrigir a microcopy dos painéis de bonificação**

Nos dashboards do Controlador, Assistente e SME, substituir textos que chamam a bonificação de análise:

```text
Análise em Andamento            -> Bonificação em apuração
Não Analisadas                  -> Bonificação não lançada
Progresso das Análises          -> Progresso da bonificação
Analisados (Concluídos)         -> Bonificações consolidadas
Em Andamento                    -> Em apuração
Não Analisada                   -> Não lançada
```

Não alterar cartões próprios de pendências ou inventário.

- [ ] **Step 2: Enriquecer `getEscolaOperationalData`**

Adicionar ao retorno:

```js
const analiseTecnica = getSchoolTechnicalAnalysisStatus(esc, activeCompetenciaKey);
const analiseTecnicaMeta = getProgramTechnicalMeta(analiseTecnica);
const nextActors = [...new Set(pendenciasAbertas.map(pendency => (
    pendency.responsavel
        || window.RadarPendencias.getNextActor(pendency)
        || 'Não definido'
)))];
const proximaAcao = pendenciasAbertas.length === 0
    ? 'Sem pendência ativa'
    : nextActors.join(' / ');
```

E no objeto retornado:

```js
situacao: getSchoolAggregateStatus(esc, activeCompetenciaKey),
analiseTecnica,
analiseTecnicaMeta,
pendenciasAbertas,
proximaAcao,
```

- [ ] **Step 3: Tornar explícito que o filtro de situação é de bonificação**

Alterar o label para:

```html
<label for="filter-escola-situacao">Situação da bonificação</label>
```

E as opções para:

```js
[
    { value: 'all', label: 'Todas' },
    { value: 'apto', label: 'Aptas' },
    { value: 'inapto', label: 'Inaptas' },
    { value: 'emAndamento', label: 'Em apuração' },
    { value: 'naoAnalisado', label: 'Não lançadas' },
    { value: 'foraEscopo', label: 'Fora do escopo' }
]
```

- [ ] **Step 4: Separar as colunas da Carteira**

Alterar o cabeçalho para oito colunas:

```html
<tr>
    <th>Unidade Escolar</th>
    <th>Identificação</th>
    <th>Diretor(a) Geral</th>
    <th>Controlador Responsável</th>
    <th>Bonificação</th>
    <th>Análise técnica</th>
    <th>Pendência / próxima ação</th>
    <th>Ações</th>
</tr>
```

Atualizar o `colspan` do estado vazio para `8`.

- [ ] **Step 5: Renderizar as dimensões separadamente na linha da escola**

Usar:

```js
const bonusBadge = getEscolaStatusBadgeClass(op.situacao);
const bonusLabel = getEscolaStatusLabel(op.situacao);
```

E renderizar:

```html
<td><span class="badge ${bonusBadge}">${bonusLabel}</span></td>
<td><span class="badge ${op.analiseTecnicaMeta.badgeClass}">${op.analiseTecnicaMeta.label}</span></td>
<td>
    ${op.hasPendencias
        ? `<span class="badge badge-warning">${op.pendenciasAbertas.length} ativa(s)</span><br><small>Próximo ator: ${escapeHtml(op.proximaAcao)}</small>`
        : '<span class="badge badge-gray">Sem pendência ativa</span>'}
</td>
```

A coluna de bonificação não deve consultar pendências nem análise técnica.

- [ ] **Step 6: Atualizar os labels agregados da escola**

Em `getEscolaStatusLabel`, usar:

```js
const labels = {
    apto: 'Apta',
    inapto: 'Inapta',
    emAndamento: 'Em apuração',
    naoAnalisado: 'Não lançada',
    foraEscopo: 'Fora do escopo'
};
```

- [ ] **Step 7: Verificar manualmente a coerência estrutural da Carteira**

Run local:

```bash
npm start
```

Abrir `http://127.0.0.1:4175`, acessar **Escolas / Carteira** e confirmar:

- uma escola pode exibir `Apta` na bonificação e `Incorreto` na análise;
- a pendência aparece em coluna própria;
- o filtro `Aptas` mantém escolas tecnicamente incorretas quando a bonificação é APTA;
- não há rolagem horizontal global; apenas a tabela pode rolar localmente em largura reduzida.

- [ ] **Step 8: Executar a suíte de regressão desktop existente**

```bash
npx playwright test tests/e2e/functional-core.spec.js --project=desktop-chromium
```

Expected: PASS; ajustes de texto devem ser feitos apenas nos testes que verificarem microcopy antiga.

- [ ] **Step 9: Commitar Dashboard e Carteira**

```bash
git add app.js styles.css tests/e2e/functional-core.spec.js
git commit -m "feat: separar indicadores no dashboard e carteira"
```

---

### Task 4: Separar os indicadores em Competências e Prontuário

**Files:**
- Modify: `app.js:7600-7690`
- Modify: `app.js:9348-10100`
- Modify: `styles.css` na seção de componentes de status.

**Interfaces:**
- Consumes: `getProgramBonificationStatus` e `getProgramBonificationMeta`.
- Consumes: `getProgramTechnicalStatus` e `getProgramTechnicalMeta`.
- Keeps: a grade documental individual, os botões de bonificação e o seletor técnico existentes.

- [ ] **Step 1: Corrigir a tabela de Competências**

Para cada programa, calcular:

```js
const bonusStatus = getProgramBonificationStatus(e.id, activeCompetenciaKey, progId);
const bonusMeta = getProgramBonificationMeta(bonusStatus);
const technicalStatus = getProgramTechnicalStatus(e.id, activeCompetenciaKey, progId);
const technicalMeta = getProgramTechnicalMeta(technicalStatus);
```

Renderizar a bonificação com:

```js
const bStatus = `<span class="badge ${bonusMeta.badgeClass}" style="font-size:0.65rem; padding:2px 4px; font-weight:500;">${bonusMeta.label}</span>`;
```

E a análise com:

```js
const aStatus = `<span class="badge ${technicalMeta.badgeClass}" style="font-size:0.65rem; padding:2px 4px; font-weight:500;">${technicalMeta.label}</span>`;
```

Remover a análise ad hoc baseada em `Object.values(v.analise)`.

- [ ] **Step 2: Corrigir a semântica dos pontos mensais do Prontuário**

No `title` de cada mês, substituir a expressão condicional por um mapeamento de bonificação:

```js
const monthStatusLabels = {
    apta: 'Apta',
    inapta: 'Inapta',
    'em-andamento': 'Em apuração',
    'nao-lancado': 'Não lançada',
    'out-of-scope': 'Fora de escopo'
};
```

Usar:

```html
title="${c.label} - Bonificação: ${monthStatusLabels[status]}"
```

Não incluir “Pendências” no título de `inapta`.

- [ ] **Step 3: Criar o resumo duplo por programa no Prontuário**

Antes do laço de documentos de cada programa, calcular:

```js
const bonusStatus = getProgramBonificationStatus(esc.id, c.key, progId);
const bonusMeta = getProgramBonificationMeta(bonusStatus);
const technicalStatus = getProgramTechnicalStatus(esc.id, c.key, progId);
const technicalMeta = getProgramTechnicalMeta(technicalStatus);
```

Substituir `bonifConsolidadoText` por:

```js
const programStatusSummary = `
    <div class="program-status-summary" data-program-status-summary="${escapeHtml(progId)}">
        <div>
            <span>Bonificação</span>
            <span class="badge ${bonusMeta.badgeClass}" data-status-dimension="bonificacao">${bonusMeta.label}</span>
        </div>
        <div>
            <span>Análise técnica</span>
            <span class="badge ${technicalMeta.badgeClass}" data-status-dimension="analise">${technicalMeta.label}</span>
        </div>
    </div>
`;
```

Manter abaixo desse bloco o botão `Consolidar` ou `Consolidada` já existente.

- [ ] **Step 4: Adicionar CSS mínimo para o resumo**

Adicionar em `styles.css`:

```css
.program-status-summary {
    display: grid;
    gap: 6px;
    margin-bottom: 8px;
}

.program-status-summary > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 0.72rem;
}

.program-status-summary > div > span:first-child {
    color: var(--text-muted);
}
```

Não introduzir cores novas; reutilizar as classes de badge existentes.

- [ ] **Step 5: Confirmar que pendências continuam uma dimensão autônoma**

Verificar no Prontuário que:

- o botão `Registrar novo envio` ou `Reanalisar` permanece na coluna de ações;
- a existência da pendência não altera o badge de bonificação;
- o seletor técnico continua bloqueado apenas pelas regras já existentes da Task 7;
- nenhuma regra de perfil foi modificada.

- [ ] **Step 6: Executar sintaxe e E2E de pendências**

```bash
node --check app.js
npx playwright test tests/e2e/pendency-cycle.spec.js --project=desktop-chromium
```

Expected: PASS.

- [ ] **Step 7: Commitar Competências e Prontuário**

```bash
git add app.js styles.css tests/e2e/pendency-cycle.spec.js
git commit -m "feat: exibir dimensoes separadas no prontuario"
```

---

### Task 5: Provar a separação com testes E2E dedicados

**Files:**
- Create: `tests/e2e/task-8-indicator-separation.spec.js`
- Modify only if required: `tests/e2e/functional-core.spec.js`
- Modify only if required: `tests/e2e/pendency-cycle.spec.js`

**Interfaces:**
- Uses DOM hooks: `[data-program-status-summary]`, `[data-status-dimension="bonificacao"]`, `[data-status-dimension="analise"]`.
- Uses application functions: `getSchoolAggregateStatus`, `getProgramBonificationStatus`, `getProgramTechnicalStatus`, `switchView`, `switchProfile`, `rebuildOperationalIndexes`, `persist`.

- [ ] **Step 1: Criar helper determinístico de cenário**

Criar o arquivo com:

```js
const { test, expect } = require('@playwright/test');

const DOCUMENT_KEYS = [
  'extCC',
  'extINV',
  'notaFiscal',
  'consAssessoria',
  'declBBAgil',
  'encampInventario'
];

async function seedSeparatedIndicators(page, options = {}) {
  return page.evaluate(({ documentKeys, seedOptions }) => {
    switchProfile('controlador');
    const competencia = activeCompetenciaKey;
    const escola = escolas.find(candidate => (
      Array.isArray(candidate.programasIds)
      && candidate.programasIds.includes('BASIC')
      && isCompetenceInScope(candidate.competenciaInicial, competencia)
    ));
    if (!escola) throw new Error('Escola determinística da Task 8 não encontrada.');

    const programaId = 'BASIC';
    const compProgKey = `${competencia}_${programaId}`;
    verificacoes[escola.id] = verificacoes[escola.id] || {};
    const verification = RadarFluxoOperacional.createEmptyVerification();
    verification.bonificacao = {
      extCC: 'Sim',
      extINV: 'Sim',
      notaFiscal: 'Não se aplica',
      consAssessoria: 'Não se aplica',
      declBBAgil: 'Sim',
      encampInventario: 'Não se aplica'
    };
    verification.analise = Object.fromEntries(documentKeys.map(key => [key, 'Correto']));
    verification.analise.extCC = seedOptions.analysisValue || 'Incorreto';
    verification.resultadoBonif = seedOptions.bonusResult || 'apta';
    verificacoes[escola.id][compProgKey] = verification;

    pendencias = pendencias.filter(item => !(
      item.escolaId === escola.id
      && item.competencia === competencia
      && item.programaId === programaId
      && item.documentoKey === 'extCC'
    ));

    if (seedOptions.withPendency) {
      pendencias.push(RadarPendencias.createDocumentPendency({
        id: 'pend-task-8-separation',
        escolaId: escola.id,
        competenciaOrigem: competencia,
        programaId,
        documentoKey: 'extCC',
        item: 'PDDE Básico - Extrato Conta Corrente',
        errosAtuais: ['Documento ilegível'],
        observacao: 'Pendência criada para provar a separação de dimensões.',
        dataAbertura: '2026-07-11'
      }, {
        eventId: 'event-task-8-separation',
        at: '2026-07-11T12:00:00.000Z',
        usuario: 'Controlador E2E',
        perfil: 'Controlador'
      }));
    }

    rebuildOperationalIndexes();
    persist();
    activeProntuarioCompetencia = competencia;
    switchView('prontuario', escola.id);

    return { escolaId: escola.id, competencia, programaId, compProgKey };
  }, { documentKeys: DOCUMENT_KEYS, seedOptions: options });
}
```

- [ ] **Step 2: Testar `APTA + Incorreto + pendência ativa` no Prontuário**

Adicionar:

```js
test.describe('Task 8 — indicadores independentes', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do desktop.');
    await page.goto('/');
  });

  test('mantém APTA com análise incorreta e pendência ativa', async ({ page }) => {
    const context = await seedSeparatedIndicators(page, { withPendency: true });
    const summary = page.locator(
      `[data-program-status-summary="${context.programaId}"]`
    ).first();

    await expect(summary.locator('[data-status-dimension="bonificacao"]')).toHaveText('APTA');
    await expect(summary.locator('[data-status-dimension="analise"]')).toHaveText('Incorreto');
    await expect(page.getByRole('tab', { name: /Pendências Ativas \(1\)/ })).toBeVisible();

    const aggregate = await page.evaluate(({ escolaId, competencia }) => {
      const escola = escolas.find(item => item.id === escolaId);
      return getSchoolAggregateStatus(escola, competencia);
    }, context);
    expect(aggregate).toBe('apto');
  });
});
```

- [ ] **Step 3: Testar INAPTA com análise correta**

Adicionar:

```js
test('mantém INAPTA mesmo com análise técnica correta', async ({ page }) => {
  const context = await seedSeparatedIndicators(page, {
    bonusResult: 'inapta',
    analysisValue: 'Correto'
  });
  const summary = page.locator(
    `[data-program-status-summary="${context.programaId}"]`
  ).first();

  await expect(summary.locator('[data-status-dimension="bonificacao"]')).toHaveText('INAPTA');
  await expect(summary.locator('[data-status-dimension="analise"]')).toHaveText('Correto');
});
```

- [ ] **Step 4: Testar a separação em Competências e Carteira**

Adicionar:

```js
test('exibe as dimensões separadas em Competências e Carteira', async ({ page }) => {
  const context = await seedSeparatedIndicators(page, { withPendency: true });

  await page.evaluate(() => switchView('competencias'));
  const schoolRow = page.locator('#main-container table.data-table tbody tr')
    .filter({ hasText: context.escolaId })
    .first();
  await expect(schoolRow).toContainText('APTA');
  await expect(schoolRow).toContainText('Incorreto');

  await page.evaluate(() => switchView('escolas'));
  const carteiraRow = page.locator('#main-container table.data-table tbody tr')
    .filter({ hasText: context.escolaId })
    .first();
  await expect(carteiraRow).toContainText('Apta');
  await expect(carteiraRow).toContainText('Incorreto');
  await expect(carteiraRow).toContainText('Próximo ator: Escola');
});
```

- [ ] **Step 5: Testar o filtro de bonificação**

Adicionar:

```js
test('filtro APTA não exclui escola apenas por análise incorreta', async ({ page }) => {
  const context = await seedSeparatedIndicators(page, { withPendency: true });

  await page.evaluate(() => switchView('escolas'));
  await page.locator('#filter-escola-situacao').selectOption('apto');
  const carteiraRow = page.locator('#main-container table.data-table tbody tr')
    .filter({ hasText: context.escolaId });

  await expect(carteiraRow).toHaveCount(1);
  await expect(carteiraRow).toContainText('Apta');
});
```

- [ ] **Step 6: Testar reanálise correta tardia sem alterar APTA**

Preparar uma pendência `Aguardando reanálise` com data posterior à competência, abrir o modal existente e selecionar `correto`. Depois verificar:

```js
await expect(summary.locator('[data-status-dimension="bonificacao"]')).toHaveText('APTA');
await expect(summary.locator('[data-status-dimension="analise"]')).toHaveText('Correto após o prazo');
expect(await page.evaluate(() => verificacoes[targetSchool][targetKey].resultadoBonif)).toBe('apta');
expect(await page.evaluate(() => pendencias.find(p => p.id === targetPendency).status)).toBe('Resolvida');
```

Reutilizar o padrão de seeding e interação já presente em `tests/e2e/pendency-cycle.spec.js`; não duplicar regras de perfil ou alterar o fluxo da Task 7.

- [ ] **Step 7: Executar o novo arquivo em estado vermelho e depois verde**

Antes de finalizar as telas:

```bash
npx playwright test tests/e2e/task-8-indicator-separation.spec.js --project=desktop-chromium
```

Expected inicial: FAIL nos seletores ou estados ainda não implementados.

Após implementar as telas:

```bash
npx playwright test tests/e2e/task-8-indicator-separation.spec.js --project=desktop-chromium
```

Expected final: PASS.

- [ ] **Step 8: Commitar a jornada E2E**

```bash
git add tests/e2e/task-8-indicator-separation.spec.js tests/e2e/functional-core.spec.js tests/e2e/pendency-cycle.spec.js
git commit -m "test: cobrir separacao de indicadores da task 8"
```

---

### Task 6: Revisão de escopo, validação integral e Preview

**Files:**
- Review: `src/domain/fluxo-operacional.js`
- Review: `tests/fluxo-operacional.test.js`
- Review: `app.js`
- Review: `styles.css`
- Review: `tests/e2e/task-8-indicator-separation.spec.js`
- Review only if changed: `tests/e2e/functional-core.spec.js`
- Review only if changed: `tests/e2e/pendency-cycle.spec.js`
- Review: `docs/superpowers/specs/2026-07-11-task-8-separacao-indicadores-design.md`
- Review: `docs/superpowers/plans/2026-07-11-task-8-separacao-indicadores.md`

**Interfaces:**
- Produces: branch pronta para PR em rascunho e Vercel Preview.
- Does not produce: merge na `main` ou deployment de produção.

- [ ] **Step 1: Confirmar ausência do estado misto**

```bash
grep -R "getProgramOperationalStatus\|getProgramVerificationStatus\|getProgramStatusMeta" -n app.js src tests || true
```

Expected: nenhuma ocorrência ativa. Comentários históricos também devem ser removidos para não gerar ambiguidade.

- [ ] **Step 2: Confirmar que análise e pendência não decidem APTA/INAPTA**

```bash
grep -n "analise.*inapta\|Incorreto.*inapta\|pAtivasComp.*inapta\|pendencias.*return 'inapta'" app.js src/domain/fluxo-operacional.js || true
```

Expected: nenhuma regra que converta análise incorreta ou pendência ativa em bonificação INAPTA.

- [ ] **Step 3: Executar sintaxe e testes unitários**

```bash
node --check app.js
node --check src/domain/fluxo-operacional.js
node --test tests/*.test.js
```

Expected: exit code 0 e zero falhas.

- [ ] **Step 4: Executar todos os E2E de desktop**

```bash
npx playwright test --project=desktop-chromium
```

Expected: PASS, incluindo `functional-core`, `pendency-cycle` e `task-8-indicator-separation`.

- [ ] **Step 5: Executar smoke mobile nos dois motores**

```bash
npm run test:mobile
```

Expected: PASS em Pixel 7/Chromium e iPhone 15/WebKit.

- [ ] **Step 6: Executar a bateria Playwright completa**

```bash
npm run test:e2e
```

Expected: PASS, zero falhas após retries.

- [ ] **Step 7: Auditar arquivos alterados contra a `main`**

```bash
git diff --name-only main...HEAD
```

Expected somente:

```text
app.js
styles.css
src/domain/fluxo-operacional.js
tests/fluxo-operacional.test.js
tests/e2e/task-8-indicator-separation.spec.js
tests/e2e/functional-core.spec.js       # somente se necessário
tests/e2e/pendency-cycle.spec.js        # somente se necessário
docs/superpowers/specs/2026-07-11-task-8-separacao-indicadores-design.md
docs/superpowers/plans/2026-07-11-task-8-separacao-indicadores.md
```

- [ ] **Step 8: Auditar restrições globais**

```bash
git diff main...HEAD -- package.json package-lock.json config.js

git diff main...HEAD -- app.js | grep -E "INITIAL_DATA_VERSION|currentProfile|supabase|exportDataExcel" || true
```

Expected:

- nenhum arquivo de dependência alterado;
- nenhuma mudança em `INITIAL_DATA_VERSION`;
- nenhuma mudança de autorização por perfil;
- nenhuma ativação de Supabase;
- nenhuma mudança da exportação Excel.

- [ ] **Step 9: Revisar a experiência no Preview**

Após push e criação do PR em rascunho, validar no Vercel Preview:

1. Dashboard: indicadores de bonificação não mudam por erro técnico.
2. Carteira: bonificação, análise e próxima ação aparecem separadas.
3. Competências: APTA e Incorreto podem coexistir na mesma linha.
4. Prontuário: resumo duplo por programa e ações de pendência preservadas.
5. Reanálise tardia: `Correto após o prazo` sem alteração de APTA.
6. Mobile: sem rolagem horizontal global e com tabela rolando localmente.
7. Excel: fluxo e arquivo de exportação inalterados.

- [ ] **Step 10: Criar PR em rascunho**

```bash
git push -u origin feature/ciclo-a-task-8-separacao-indicadores
```

Criar PR com:

```text
Título: Task 8 — separar bonificação, análise técnica e pendência
Base: main
Head: feature/ciclo-a-task-8-separacao-indicadores
Estado: Draft
```

Corpo mínimo:

```markdown
## Objetivo
Separar os indicadores de bonificação, análise técnica e pendência documental sem alterar dados persistidos.

## Regras comprovadas
- APTA + Incorreto + pendência ativa é uma combinação válida.
- Análise incorreta não altera bonificação.
- Pendência ativa não altera bonificação.
- Correção tardia altera apenas o resumo técnico.

## Fora de escopo
Perfis, Supabase, Excel, retificação e Tasks 9–16.

## Validação
- testes unitários;
- desktop Chromium;
- Pixel 7 Chromium;
- iPhone 15 WebKit;
- Vercel Preview.
```

- [ ] **Step 11: Não mesclar nem publicar em produção**

Parar após o Preview e apresentar a Wilson Peixoto:

- SHA final da branch;
- status dos workflows;
- URL do Preview;
- arquivos alterados;
- resultado da auditoria funcional, visual e institucional;
- eventuais riscos residuais.

Merge na `main` e produção somente após nova autorização expressa.
