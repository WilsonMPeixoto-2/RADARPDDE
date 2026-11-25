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

function setup(responses, { remote = true, realMarkup = false, dataClient = null } = {}) {
    const document = { activeElement: null };
    class Element {
        constructor(tag) {
            this.tagName = tag;
            if (['input', 'textarea', 'select'].includes(tag)) this.value = '';
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
        setAttribute(key, value) {
            this.attributes[key] = String(value);
            if (key === 'id') this.id = String(value);
            if (key === 'class') this.className = String(value);
            if (key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = String(value);
        }
        addEventListener(type, callback) { this[`on${type}`] = callback; }
        focus(options) { document.activeElement = this; this.focusOptions = options; }
        showModal() { this.open = true; }
        close() { this.open = false; }
    }
    // Ler as tags/IDs reais mantém a ordem documental de getElementById.
    // Não há mapa por ID que possa sobrescrever e esconder uma duplicidade.
    function realElements(markup) {
        return Array.from(markup.matchAll(/<([a-z][\w:-]*)\b([^>]*?)>/gi), match => {
            const element = new Element(match[1].toLowerCase());
            element.offset = match.index;
            for (const attribute of match[2].matchAll(/\b(id|class|aria-controls|data-[\w-]+)(?:="([^"]*)")?/g)) {
                element.setAttribute(attribute[1], attribute[2] || '');
            }
            element.hidden = /(?:^|\s)hidden(?:\s|$)/.test(match[2]);
            return element;
        });
    }
    const find = (elements, selector) => elements.find(element => selector.startsWith('#')
        ? element.id === selector.slice(1)
        : selector.startsWith('[') ? Object.hasOwn(element.attributes, selector.slice(1, -1))
            : element.tagName === selector) || null;
    const appMarkup = realMarkup ? fs.readFileSync(path.join(__dirname, '../../app.js'), 'utf8') : '';
    const indexMarkup = realMarkup ? fs.readFileSync(path.join(__dirname, '../../index.html'), 'utf8') : '';
    const panelMarkup = realMarkup ? appMarkup.match(/<section\b[^>]*id="quality-provisional-panel"[\s\S]*?<\/section>/)?.[0] : '';
    if (realMarkup) assert.ok(panelMarkup, 'Painel real do app deve ser encontrado');
    const panelElements = realElements(panelMarkup || '');
    const indexElements = realElements(indexMarkup);
    const pick = (selector, tag) => realMarkup ? find(panelElements, selector) : new Element(tag);
    const panel = pick('#quality-provisional-panel', 'section');
    const description = pick('p', 'p');
    const list = pick('[data-quality-list]', 'div');
    const toggle = pick('[data-quality-details]', 'button');
    const status = pick('[data-quality-compact-status]', 'span');
    const refresh = pick('[data-quality-refresh]', 'button');
    const create = pick('[data-quality-new]', 'button');
    description.textContent = 'Registre saídas do extrato enquanto a Ação Integrada correspondente ainda não foi identificada.';
    const selectors = new Map([
        ['#quality-provisional-summary-description', description], ['[data-quality-list]', list],
        ['[data-quality-details]', toggle], ['[data-quality-compact-status]', status],
        ['[data-quality-refresh]', refresh], ['[data-quality-new]', create]
    ]);
    panel.querySelector = selector => realMarkup ? find(panelElements, selector) : selectors.get(selector) || null;
    panel.append(description, list, toggle, status, refresh, create);
    const orderedElements = [...panelElements, ...indexElements];
    document.getElementById = id => realMarkup ? orderedElements.find(element => element.id === id) || null
        : id === 'quality-provisional-panel' ? panel : null;
    if (realMarkup) {
        const dialogMarkup = indexMarkup.match(/<dialog\b[^>]*id="quality-provisional-dialog"[\s\S]*?<\/dialog>/);
        assert.ok(dialogMarkup, 'Editor real do index deve ser encontrado');
        const dialogElements = indexElements.filter(element => element.offset >= dialogMarkup.index
            && element.offset < dialogMarkup.index + dialogMarkup[0].length);
        document.getElementById('quality-provisional-dialog').querySelector = selector => find(dialogElements, selector);
    }
    document.createElement = tag => new Element(tag);
    const queries = [];
    const client = dataClient || { from(table) {
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
    return { root, panel, description, list, toggle, status, refresh, create, queries, panelElements, indexElements };
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

test('Qualidade real: IDs do painel e formulário são únicos e o disclosure controla só a informação', () => {
    const ui = setup([], { realMarkup: true });
    const elements = [...ui.panelElements, ...ui.indexElements];
    const ids = elements.map(element => element.id).filter(id => id?.startsWith('quality-provisional-'));
    assert.equal(new Set(ids).size, ids.length, 'IDs reais da apresentação não podem colidir com campos do editor');
    const field = ui.root.document.getElementById('quality-provisional-description');
    assert.equal(field.tagName, 'input');
    assert.ok(ui.indexElements.includes(field));
    const controlled = ui.toggle.attributes['aria-controls'].split(/\s+/);
    assert.equal(controlled.length, 2);
    assert.equal(new Set(controlled).size, 2);
    for (const id of controlled) {
        const target = ui.root.document.getElementById(id);
        assert.ok(ui.panelElements.includes(target), `${id} deve pertencer à apresentação`);
        assert.notEqual(target, field, 'Disclosure não pode esconder ou alterar o campo editável');
    }
});

test('Qualidade real: descrição preenchida no input é enviada ao insert e ao formulário de identificação', async () => {
    const inserted = [];
    const persisted = [];
    const dataClient = { from(table) {
        assert.equal(table, 'quality_provisional_movements');
        const query = {};
        for (const method of ['select', 'eq', 'order']) query[method] = () => query;
        query.limit = async () => ({ data: persisted, error: null });
        query.insert = values => {
            inserted.push(JSON.parse(JSON.stringify(values)));
            persisted.push({ id: 'SAIDA-DESCRICAO', row_version: 1, status: 'open', ...values });
            return query;
        };
        query.maybeSingle = async () => ({ data: { id: 'SAIDA-DESCRICAO' }, error: null });
        return query;
    } };
    const ui = setup([], { realMarkup: true, dataClient });
    await ui.root.RadarQualityProvisional.hydrate(input);
    ui.create.onclick();
    const descriptionInput = ui.indexElements.find(element => element.tagName === 'input'
        && element.id === 'quality-provisional-description');
    assert.ok(descriptionInput, 'Campo real do editor deve ser encontrado por seu tipo e ID');
    const expected = 'Materiais para atividades escolares — descrição preservada';
    descriptionInput.value = expected;
    const doc = ui.root.document;
    doc.getElementById('quality-provisional-amount').value = '42.50';
    doc.getElementById('quality-provisional-reference').value = 'REF-SINTETICA';
    const dialog = doc.getElementById('quality-provisional-dialog');
    await dialog.querySelector('form').onsubmit({ preventDefault() {} });
    assert.equal(inserted.length, 1);
    assert.equal(inserted[0].description, expected);
    assert.equal(inserted[0].amount, 42.5);
    assert.equal(dialog.open, false);
    assert.match(ui.list.textContent, /Materiais para atividades escolares/);

    const opened = [];
    ui.root.openModalDadosNota = (...context) => { opened.push(context); return true; };
    const descendants = element => [element, ...element.children.flatMap(descendants)];
    const rendered = descendants(ui.list);
    rendered.find(element => element.tagName === 'select').value = 'LEITURA';
    rendered.find(element => element.tagName === 'button' && element.textContent === 'Identificar despesa').onclick();
    assert.deepEqual(opened, [['ESC-SINTETICA', '2026-05_LEITURA']]);
    assert.equal(doc.getElementById('nota-desc').value, expected);
    assert.equal(doc.getElementById('nota-quality-provisional-id').value, 'SAIDA-DESCRICAO');
    assert.equal(doc.getElementById('nota-quality-provisional-version').value, 1);
    assert.equal(doc.getElementById('nota-valor').value, 42.5);
});
