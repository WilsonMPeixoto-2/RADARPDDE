'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../../src/integration/quality-provisional-ux.js'), 'utf8');

function deferred() {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
}

function setup(responses, { remote = true } = {}) {
    const document = { activeElement: null };
    class Element {
        constructor(tag) {
            this.tagName = tag;
            this.children = [];
            this.dataset = {};
            this.attributes = {};
            this.className = '';
            this.hidden = false;
            this.isConnected = true;
            this.classList = {
                contains: name => this.className.split(/\s+/).includes(name),
                remove: name => this.classList.toggle(name, false),
                toggle: (name, enabled) => {
                    const names = new Set(this.className.split(/\s+/).filter(Boolean));
                    if (enabled) names.add(name); else names.delete(name);
                    this.className = [...names].join(' ');
                }
            };
        }
        set textContent(value) { this.text = String(value); this.children = []; }
        get textContent() { return (this.text || '') + this.children.map(child => child.textContent).join(''); }
        append(...nodes) { this.children.push(...nodes); }
        replaceChildren(...nodes) { this.text = ''; this.children = [...nodes]; }
        setAttribute(key, value) { this.attributes[key] = value; }
        addEventListener(type, callback) { this[`on${type}`] = callback; }
        focus(options) { document.activeElement = this; this.focusOptions = options; }
    }
    const panel = new Element('section');
    const description = new Element('p');
    const list = new Element('div');
    const toggle = new Element('button');
    const status = new Element('span');
    const refresh = new Element('button');
    const create = new Element('button');
    description.textContent = 'Registre saídas do extrato enquanto a Ação Integrada correspondente ainda não foi identificada.';
    const selectors = new Map([
        ['#quality-provisional-description', description], ['[data-quality-list]', list],
        ['[data-quality-details]', toggle], ['[data-quality-compact-status]', status],
        ['[data-quality-refresh]', refresh], ['[data-quality-new]', create]
    ]);
    panel.querySelector = selector => selectors.get(selector) || null;
    panel.append(description, list, toggle, status, refresh, create);
    document.getElementById = id => id === 'quality-provisional-panel' ? panel : null;
    document.createElement = tag => new Element(tag);
    const queries = [];
    const client = { from(table) {
        const calls = [['from', table]];
        queries.push(calls);
        const result = responses.shift();
        assert.ok(result, 'Somente as leituras previstas podem ocorrer');
        const query = {};
        for (const method of ['select', 'eq', 'order']) query[method] = (...args) => {
            calls.push([method, ...args]); return query;
        };
        query.limit = limit => { calls.push(['limit', limit]); return result; };
        return query;
    } };
    const root = { document,
        RadarApplicationServices: { data: { repository: { capabilities: () => ({ remote }) } } },
        RadarSessionContext: { service: { client } }
    };
    function Option(label, value) { const option = new Element('option'); option.textContent = label; option.value = value; return option; }
    vm.runInNewContext(source, { window: root, Option, Intl, Date });
    return { root, panel, description, list, toggle, status, refresh, create, queries };
}

const input = { schoolId: 'ESC-SINTETICA', competence: '2026-05', canEdit: true,
    programs: [{ id: 'LEITURA', name: 'PDDE Leitura' }] };

test('carregamento não presume ausência; vazio começa compacto e detalhes não gravam nem consultam de novo', async () => {
    const response = deferred();
    const ui = setup([response.promise]);
    const loading = ui.root.RadarQualityProvisional.hydrate(input);
    assert.equal(ui.panel.dataset.qualityState, 'loading');
    assert.equal(ui.panel.classList.contains('is-compact'), true);
    assert.equal(ui.status.textContent, 'Consultando…');
    assert.equal(ui.list.hidden, true);
    assert.doesNotMatch(ui.list.textContent, /Nenhuma saída/);
    assert.equal(typeof ui.create.onclick, 'function');
    assert.equal(typeof ui.refresh.onclick, 'function');

    response.resolve({ data: [], error: null });
    await loading;
    assert.equal(ui.panel.dataset.qualityState, 'empty');
    assert.equal(ui.status.textContent, 'Nenhuma saída provisória');
    assert.equal(ui.description.hidden, true);
    assert.equal(ui.toggle.attributes['aria-expanded'], 'false');
    ui.toggle.onclick();
    assert.equal(ui.toggle.attributes['aria-expanded'], 'true');
    assert.equal(ui.toggle.textContent, 'Recolher detalhes');
    assert.equal(ui.description.hidden, false);
    assert.equal(ui.list.hidden, false);
    assert.match(ui.list.textContent, /Nenhuma saída provisória registrada nesta competência\./);
    ui.toggle.onclick();
    assert.equal(ui.panel.classList.contains('is-compact'), true);
    assert.equal(ui.queries.length, 1);
    assert.deepEqual(ui.queries[0].filter(call => call[0] === 'eq'), [
        ['eq', 'school_id', 'ESC-SINTETICA'], ['eq', 'competence_id', '2026-05']
    ]);
    assert.equal(ui.queries[0][0][1], 'quality_provisional_movements');
    assert.equal(ui.queries[0].at(-1)[1], 200);
});

test('registros existentes ficam expostos com ações e foco permanece em controle disponível', async () => {
    const response = deferred();
    const ui = setup([response.promise]);
    const loading = ui.root.RadarQualityProvisional.hydrate(input);
    ui.toggle.focus();
    response.resolve({ data: [{ id: 'SAIDA-SINTETICA', status: 'open', amount: 25,
        description: 'Saída para conferir', document_reference: 'REF-1', observation: 'Informação preservada' }], error: null });
    await loading;
    assert.equal(ui.panel.dataset.qualityState, 'records');
    assert.equal(ui.panel.classList.contains('is-compact'), false);
    assert.equal(ui.panel.classList.contains('is-empty'), false);
    assert.equal(ui.toggle.hidden, true);
    assert.equal(ui.description.hidden, false);
    assert.equal(ui.list.hidden, false);
    assert.match(ui.list.textContent, /Saída para conferir/);
    assert.match(ui.list.textContent, /Informação preservada/);
    assert.match(ui.list.textContent, /Identificar despesaEditarExcluir/);
    assert.equal(ui.root.document.activeElement, ui.create);
    assert.equal(ui.create.focusOptions.preventScroll, true);
    assert.equal(ui.queries.length, 1);
});

test('erro de leitura fica visível e nunca é apresentado como ausência de saídas', async () => {
    const ui = setup([Promise.resolve({ data: null, error: { message: 'Consulta indisponível' } })]);
    await ui.root.RadarQualityProvisional.hydrate(input);
    assert.equal(ui.panel.dataset.qualityState, 'error');
    assert.equal(ui.panel.classList.contains('is-compact'), false);
    assert.equal(ui.list.hidden, false);
    assert.equal(ui.toggle.hidden, true);
    assert.match(ui.list.textContent, /Erro ao consultar registros: Consulta indisponível/);
    assert.doesNotMatch(ui.list.textContent, /Nenhuma saída/);
});

test('abrir detalhes em uma escola não expande automaticamente outra competência', async () => {
    const next = deferred();
    const ui = setup([Promise.resolve({ data: [], error: null }), next.promise]);
    await ui.root.RadarQualityProvisional.hydrate(input);
    ui.toggle.onclick();
    const loading = ui.root.RadarQualityProvisional.hydrate({ ...input, competence: '2026-06' });
    assert.equal(ui.toggle.attributes['aria-expanded'], 'false');
    assert.equal(ui.panel.classList.contains('is-compact'), true);
    next.resolve({ data: [], error: null });
    await loading;
    assert.equal(ui.description.hidden, true);
    assert.equal(ui.queries[1].find(call => call[0] === 'eq' && call[1] === 'competence_id')[2], '2026-06');
});

test('apresentação não amplia capacidade nem habilita consulta remota no modo local', async () => {
    for (const permissions of [{ remote: true, canEdit: false }, { remote: false, canEdit: true }]) {
        const ui = setup([], permissions);
        await ui.root.RadarQualityProvisional.hydrate({ ...input, canEdit: permissions.canEdit });
        assert.equal(ui.panel.hidden, true);
        assert.equal(ui.queries.length, 0);
    }
});
