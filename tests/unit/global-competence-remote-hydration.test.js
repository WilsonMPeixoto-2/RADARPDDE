'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '../..', file), 'utf8');

function harness() {
    const nodes = new Map();
    function node(id = '') {
        const value = { id, value: '', dataset: {}, children: [], inert: false,
            setAttribute(key, item) { this[key] = item; },
            replaceChildren(...children) { this.children = children; },
            appendChild(child) { this.children.push(child); },
            addEventListener() {}, removeAttribute() {}, classList: { add() {} } };
        if (id) nodes.set(id, value);
        return value;
    }
    node('global-competence-badge').dataset.radarCompetenceControl = 'true';
    ['global-competence-select', 'global-competence-label', 'exercise-select', 'main-container'].forEach(node);
    const requests = [], renders = [], alerts = [];
    const context = vm.createContext({
        console: { error() {} },
        document: { getElementById: id => nodes.get(id), createElement: () => node(),
            createDocumentFragment: () => node(), addEventListener() {} },
        localStorage: { getItem: () => null, setItem() {} },
        CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
        dispatchEvent() {}, addEventListener() {}, setInterval() { throw Error('runtime deve inicializar'); },
        clearInterval() {}, alert: value => alerts.push(value),
        switchView: (view, school) => renders.push({ view, school }),
        RadarDataContext: { ready: true },
        RadarCompetencia: { competenceKeyFromDate: () => '2026-09' },
        RadarApplicationServices: { data: {
            repository: { capabilities: () => ({ remote: true }) },
            currentOperationalCompetence: '2026-09',
            loadOperationalContext(key) { return new Promise((resolve, reject) => requests.push({ key, resolve, reject })); }
        } }
    });
    context.window = context;
    vm.runInContext(`const COMPETENCIAS = [{key:'2026-08'}, {key:'2026-09'}, {key:'2027-01'}];
        let config = {exercicios:['2026','2027'], competenciaFechamento:'2026-09'};
        let currentExercise = '2026'; let activeCompetenciaKey = ''; let activeProntuarioCompetencia = '';
        let currentView = 'prontuario'; let activeSchoolId = 'school-1';`, context);
    vm.runInContext(read('src/domain/competence-context.js'), context);
    vm.runInContext(read('src/integration/global-competence-selector.js'), context);
    return { context, nodes, requests, renders, alerts };
}

test('scripts reais inicializam domínio e seletor com bindings lexicais e preservam sua API pública', () => {
    const h = harness();
    assert.equal(h.context.RadarCompetenceContext.isInitialized(), true);
    assert.equal(h.context.RadarCompetenceContext.getState().activeKey, '2026-09');
    assert.equal(typeof h.context.RadarGlobalCompetenceSelector.refreshContext, 'function');
    assert.equal(typeof h.context.changeExercise, 'function');
    assert.equal(h.context.config, undefined);
});

test('troca no prontuário consulta o mês e preserva escola/visão somente após a confirmação', async () => {
    const h = harness();
    const app = read('app.js');
    vm.runInContext(app.slice(app.indexOf('function changeProntuarioCompetencia('), app.indexOf('// 14.2 Operações')), h.context);
    const pending = h.context.changeProntuarioCompetencia('school-1', '2026-08');
    assert.equal(h.requests[0].key, '2026-08');
    assert.equal(h.nodes.get('main-container').inert, true);
    assert.equal(h.renders.length, 0);
    h.requests[0].resolve({ stale: false });
    await pending;
    assert.deepEqual(h.renders, [{ view: 'prontuario', school: 'school-1' }]);
    assert.equal(h.nodes.get('main-container').inert, false);
    assert.equal(vm.runInContext('activeProntuarioCompetencia', h.context), '2026-08');
});

test('falha em outro exercício restaura competência confirmada e libera a interface sem nova consulta', async () => {
    const h = harness();
    h.context.changeExercise('2027');
    assert.equal(h.requests[0].key, '2027-01');
    h.requests[0].reject(Error('offline'));
    await h.context.RadarGlobalCompetenceSelector.whenHydrated();
    assert.equal(h.context.RadarCompetenceContext.getState().activeKey, '2026-09');
    assert.equal(h.requests.length, 1);
    assert.equal(h.alerts.length, 1);
    assert.equal(h.nodes.get('main-container').inert, false);
});
