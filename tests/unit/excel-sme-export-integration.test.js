'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const modelApi = require('../../src/domain/excel-sme-export-model.js');
const integration = require('../../src/integration/excel-export-integration.js');

function state(activeCompetenciaKey = '2026-07') {
    return {
        activeCompetenciaKey,
        competencias: [
            { key: '2026-05', label: 'Maio 2026' },
            { key: '2026-07', label: 'Julho 2026' }
        ],
        escolas: [{
            id: 'school-1',
            designação: '04.31.001',
            denominação: 'Escola Municipal Ary Barroso',
            programasIds: ['BASIC']
        }],
        programas: [{ id: 'BASIC', name: 'PDDE Básico' }],
        verificacoes: {
            'school-1': {
                '2026-05_BASIC': {
                    bonificacao: {
                        extCC: 'Não',
                        extINV: 'Sim',
                        notaFiscal: 'Não se aplica',
                        consAssessoria: 'Não se aplica',
                        declBBAgil: 'Sim',
                        encampInventario: 'Não se aplica'
                    },
                    resultadoBonif: 'inapta'
                },
                '2026-07_BASIC': {
                    bonificacao: {
                        extCC: 'Sim',
                        extINV: 'Sim',
                        notaFiscal: 'Não se aplica',
                        consAssessoria: 'Não se aplica',
                        declBBAgil: 'Sim',
                        encampInventario: 'Não se aplica'
                    },
                    resultadoBonif: 'apta'
                }
            }
        }
    };
}

function createSelect(value, options = {}) {
    return {
        value,
        hidden: options.hidden === true,
        style: {
            display: options.display || '',
            visibility: options.visibility || ''
        },
        dataset: {},
        getAttribute(name) {
            if (name === 'aria-hidden') return options.ariaHidden ? 'true' : null;
            return null;
        }
    };
}

function documentWithSelects(selects = []) {
    return {
        querySelectorAll(selector) {
            assert.match(selector, /radar-sme-competence|changeSMEMonth/);
            return selects;
        }
    };
}

function dataProperty(name) {
    return name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function matchesSelector(element, selector) {
    const dataMatch = /^\[data-([a-z0-9-]+)(?:="([^"]*)")?\]$/.exec(selector);
    if (dataMatch) {
        const property = dataProperty(dataMatch[1]);
        if (dataMatch[2] === undefined) return Object.hasOwn(element.dataset, property);
        return element.dataset[property] === dataMatch[2];
    }
    return false;
}

function createFakeElement(tagName = 'div') {
    const attributes = {};
    const listeners = new Map();
    const children = [];
    const classNames = new Set();
    const element = {
        tagName: String(tagName).toUpperCase(),
        dataset: {},
        style: {},
        title: '',
        disabled: false,
        textContent: '',
        parentElement: null,
        className: '',
        get children() { return children; },
        classList: {
            add(...names) {
                names.filter(Boolean).forEach(name => classNames.add(name));
                element.className = [...classNames].join(' ');
            },
            remove(...names) {
                names.forEach(name => classNames.delete(name));
                element.className = [...classNames].join(' ');
            },
            contains(name) { return classNames.has(name); }
        },
        setAttribute(name, value) {
            attributes[name] = String(value);
            if (name.startsWith('data-')) {
                element.dataset[dataProperty(name.slice(5))] = String(value);
            }
        },
        getAttribute(name) {
            return Object.hasOwn(attributes, name) ? attributes[name] : null;
        },
        removeAttribute(name) {
            delete attributes[name];
            if (name.startsWith('data-')) delete element.dataset[dataProperty(name.slice(5))];
        },
        appendChild(child) {
            child.parentElement = element;
            children.push(child);
            return child;
        },
        append(...items) {
            items.forEach(item => element.appendChild(item));
        },
        cloneNode() {
            const clone = createFakeElement(tagName);
            String(element.className || '').split(/\s+/).filter(Boolean).forEach(name => clone.classList.add(name));
            return clone;
        },
        addEventListener(type, handler) {
            const handlers = listeners.get(type) || [];
            handlers.push(handler);
            listeners.set(type, handlers);
        },
        async click() {
            const handlers = listeners.get('click') || [];
            for (const handler of handlers) {
                await handler({ target: element, currentTarget: element });
            }
        },
        querySelector(selector) {
            for (const child of children) {
                if (matchesSelector(child, selector)) return child;
                const nested = child.querySelector(selector);
                if (nested) return nested;
            }
            return null;
        },
        insertAdjacentElement(position, child) {
            if (position !== 'afterend' || !element.parentElement) return null;
            const siblings = element.parentElement.children;
            const index = siblings.indexOf(element);
            child.parentElement = element.parentElement;
            siblings.splice(index + 1, 0, child);
            return child;
        },
        remove() {
            if (!element.parentElement) return;
            const siblings = element.parentElement.children;
            const index = siblings.indexOf(element);
            if (index >= 0) siblings.splice(index, 1);
            element.parentElement = null;
        }
    };
    return element;
}

function assistantDashboardDocument(titleText = 'Painel do Assistente de Verbas Federais') {
    const header = createFakeElement('div');
    header.classList.add('page-header');
    const title = createFakeElement('h1');
    title.textContent = titleText;
    const redistribution = createFakeElement('button');
    redistribution.textContent = 'Redistribuir Escolas';
    header.appendChild(redistribution);
    const originalHeaderQuery = header.querySelector.bind(header);
    header.querySelector = selector => (
        selector === '.page-title h1' ? title : originalHeaderQuery(selector)
    );

    const document = {
        defaultView: {
            getComputedStyle(element) {
                return {
                    display: element.style.display || '',
                    visibility: element.style.visibility || ''
                };
            }
        },
        createElement,
        querySelector(selector) {
            if (selector === '#main-container .page-header') return header;
            if (selector === '#main-container .page-header .page-title h1') return title;
            return header.querySelector(selector);
        },
        querySelectorAll(selector) {
            if (/radar-sme-competence|changeSMEMonth/.test(selector)) return [];
            return [];
        }
    };

    function createElement(tagName) {
        return createFakeElement(tagName);
    }

    return { document, header, title, redistribution };
}

test('cria artefato SME mensal independente do Excel institucional', () => {
    const rendererApi = { async downloadWorkbook() {} };
    const artifacts = integration.createSmeExportArtifacts(
        state(),
        {},
        { modelApi, rendererApi }
    );

    assert.equal(artifacts.fileName, 'RADAR_PDDE_EXCEL_SME_07-2026.xlsx');
    assert.equal(artifacts.model.sheetName, 'JULHO');
    assert.equal(artifacts.model.rows.length, 1);
    assert.equal(integration.buildFileName('2026-07'), 'RADAR_PDDE_BONIFICACOES_07-2026.xlsx');
});

test('usa somente os dados da competência ativa no fluxo real de exportação', () => {
    const rendererApi = { async downloadWorkbook() {} };
    const maio = integration.createSmeExportArtifacts(
        state('2026-05'),
        {},
        { modelApi, rendererApi }
    );
    const julho = integration.createSmeExportArtifacts(
        state('2026-07'),
        {},
        { modelApi, rendererApi }
    );

    assert.equal(maio.fileName, 'RADAR_PDDE_EXCEL_SME_05-2026.xlsx');
    assert.equal(maio.model.sheetName, 'MAIO');
    assert.equal(maio.model.rows[0].basic_extCC, 'NÃO');
    assert.equal(julho.fileName, 'RADAR_PDDE_EXCEL_SME_07-2026.xlsx');
    assert.equal(julho.model.sheetName, 'JULHO');
    assert.equal(julho.model.rows[0].basic_extCC, 'SIM');
});

test('executa download pelo renderer exclusivo do Excel SME', async () => {
    let received = null;
    const rendererApi = {
        async downloadWorkbook(model, options) {
            received = { model, options };
            return { fileName: options.fileName, bytes: new Uint8Array([0x50, 0x4B]) };
        }
    };

    const result = await integration.exportSmeXlsx({
        state: state(),
        dependencies: { modelApi, rendererApi }
    });

    assert.equal(result.ok, true);
    assert.equal(received.model.sheetName, 'JULHO');
    assert.equal(received.options.fileName, 'RADAR_PDDE_EXCEL_SME_07-2026.xlsx');
});

test('resolve TODAS somente pelo único seletor SME visível', async () => {
    let received = null;
    const rendererApi = {
        async downloadWorkbook(model, options) {
            received = { model, options };
            return { fileName: options.fileName, bytes: new Uint8Array([0x50, 0x4B]) };
        }
    };
    const select = createSelect('2026-07');
    const document = documentWithSelects([select]);

    const resolution = integration.resolveSmeCompetence(state('TODAS'), document);
    assert.deepEqual(
        { ok: resolution.ok, competenceKey: resolution.competenceKey, code: resolution.code },
        { ok: true, competenceKey: '2026-07', code: null }
    );
    assert.equal(select.dataset.radarSmeCompetence, 'true');

    const result = await integration.exportSmeXlsx({
        state: state('TODAS'),
        document,
        dependencies: { modelApi, rendererApi }
    });

    assert.equal(result.ok, true);
    assert.equal(received.model.sheetName, 'JULHO');
});

test('não usa a primeira competência cadastrada como fallback', () => {
    const resolution = integration.resolveSmeCompetence(state('TODAS'), documentWithSelects([]));

    assert.equal(resolution.ok, false);
    assert.equal(resolution.competenceKey, null);
    assert.equal(resolution.code, 'SME_INVALID_COMPETENCE');
});

test('ignora seletor oculto e bloqueia competência não confirmada', () => {
    const resolution = integration.resolveSmeCompetence(
        state('TODAS'),
        documentWithSelects([createSelect('2026-07', { display: 'none' })])
    );

    assert.equal(resolution.ok, false);
    assert.equal(resolution.code, 'SME_INVALID_COMPETENCE');
});

test('bloqueia quando há mais de um seletor SME visível', () => {
    const resolution = integration.resolveSmeCompetence(
        state('TODAS'),
        documentWithSelects([createSelect('2026-05'), createSelect('2026-07')])
    );

    assert.equal(resolution.ok, false);
    assert.equal(resolution.code, 'SME_COMPETENCE_AMBIGUOUS');
});

test('bloqueia divergência entre estado mensal e seletor visível', async () => {
    let rendererCalls = 0;
    const rendererApi = {
        async downloadWorkbook() {
            rendererCalls += 1;
        }
    };
    const document = documentWithSelects([createSelect('2026-05')]);
    const resolution = integration.resolveSmeCompetence(state('2026-07'), document);

    assert.equal(resolution.ok, false);
    assert.equal(resolution.code, 'SME_COMPETENCE_MISMATCH');

    const result = await integration.exportSmeXlsx({
        state: state('2026-07'),
        document,
        dependencies: { modelApi, rendererApi }
    });

    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'SME_COMPETENCE_MISMATCH');
    assert.equal(rendererCalls, 0);
});

test('normalização permanece pura e nunca altera a competência global', () => {
    let changeCalls = 0;
    const previous = globalThis.changeSMEMonth;
    globalThis.changeSMEMonth = () => { changeCalls += 1; };
    try {
        const normalized = integration.normalizeSmeState(
            state('TODAS'),
            documentWithSelects([createSelect('2026-07')])
        );
        assert.equal(normalized.activeCompetenciaKey, '2026-07');
        assert.equal(changeCalls, 0);
    } finally {
        if (previous === undefined) delete globalThis.changeSMEMonth;
        else globalThis.changeSMEMonth = previous;
    }
});

test('reconhece somente competências mensais válidas', () => {
    assert.equal(integration.isMonthlyCompetence('2026-07'), true);
    assert.equal(integration.isMonthlyCompetence('TODAS'), false);
    assert.equal(integration.isMonthlyCompetence('2026-13'), false);
});

test('desabilita o botão em TODAS e habilita em competência mensal', () => {
    const attributes = {};
    const button = {
        dataset: {},
        disabled: false,
        title: '',
        setAttribute(name, value) { attributes[name] = value; }
    };

    assert.equal(integration.updateSmeButtonState(button, 'TODAS'), false);
    assert.equal(button.disabled, true);
    assert.equal(attributes['aria-disabled'], 'true');
    assert.match(button.title, /Selecione uma competência mensal/);

    assert.equal(integration.updateSmeButtonState(button, '2026-07'), true);
    assert.equal(button.disabled, false);
    assert.equal(attributes['aria-disabled'], 'false');
    assert.match(button.title, /07-2026/);
});

test('reconhece somente o dashboard inicial da Assistente', () => {
    const assistant = assistantDashboardDocument();
    const controller = assistantDashboardDocument();
    const otherPage = assistantDashboardDocument('Carteira de Escolas');

    assert.equal(integration.isAssistantDashboard(assistant.document, 'assistente'), true);
    assert.equal(integration.isAssistantDashboard(controller.document, 'controlador'), false);
    assert.equal(integration.isAssistantDashboard(otherPage.document, 'assistente'), false);
});

test('cria exatamente os dois botões Excel no dashboard da Assistente', async () => {
    const surface = assistantDashboardDocument();
    let institutionalCalls = 0;
    let smeCalls = 0;

    const group = integration.ensureAssistantExportActions({
        document: surface.document,
        profile: 'assistente',
        getState: () => state('2026-07'),
        exportInstitutional: async () => { institutionalCalls += 1; },
        exportSme: async () => { smeCalls += 1; }
    });

    assert.ok(group);
    assert.equal(group.dataset.radarAssistantExportActions, 'true');
    assert.equal(group.children.length, 2);
    const institutionalButton = group.querySelector('[data-radar-assistant-export="institutional"]');
    const smeButton = group.querySelector('[data-radar-assistant-export="sme"]');
    assert.ok(institutionalButton);
    assert.ok(smeButton);
    assert.equal(group.querySelector('[data-radar-export-format="csv"]'), null);
    assert.equal(institutionalButton.textContent, 'Relatório RADAR PDDE');
    assert.equal(smeButton.textContent, 'Excel SME');

    await institutionalButton.click();
    await smeButton.click();
    assert.equal(institutionalCalls, 1);
    assert.equal(smeCalls, 1);
});

test('não duplica o grupo de exportações em novas observações do DOM', () => {
    const surface = assistantDashboardDocument();
    const options = {
        document: surface.document,
        profile: 'assistente',
        getState: () => state('2026-07')
    };

    const first = integration.ensureAssistantExportActions(options);
    const second = integration.ensureAssistantExportActions(options);
    const groups = surface.header.children.filter(child => (
        child.dataset.radarAssistantExportActions === 'true'
    ));

    assert.equal(first, second);
    assert.equal(groups.length, 1);
});

test('remove o grupo quando o perfil deixa de ser Assistente', () => {
    const surface = assistantDashboardDocument();
    integration.ensureAssistantExportActions({
        document: surface.document,
        profile: 'assistente',
        getState: () => state('2026-07')
    });

    const result = integration.ensureAssistantExportActions({
        document: surface.document,
        profile: 'controlador',
        getState: () => state('2026-07')
    });

    assert.equal(result, null);
    assert.equal(surface.header.querySelector('[data-radar-assistant-export-actions="true"]'), null);
});

test('em TODAS desabilita somente o Excel SME no dashboard da Assistente', () => {
    const surface = assistantDashboardDocument();
    const group = integration.ensureAssistantExportActions({
        document: surface.document,
        profile: 'assistente',
        getState: () => state('TODAS')
    });

    const institutionalButton = group.querySelector('[data-radar-assistant-export="institutional"]');
    const smeButton = group.querySelector('[data-radar-assistant-export="sme"]');
    assert.equal(institutionalButton.disabled, false);
    assert.equal(smeButton.disabled, true);
    assert.equal(smeButton.getAttribute('aria-disabled'), 'true');
    assert.match(smeButton.title, /Selecione uma competência mensal/);
});

test('impede clique duplicado durante a geração institucional', async () => {
    const surface = assistantDashboardDocument();
    let calls = 0;
    let release;
    const pending = new Promise(resolve => { release = resolve; });
    const group = integration.ensureAssistantExportActions({
        document: surface.document,
        profile: 'assistente',
        getState: () => state('2026-07'),
        exportInstitutional: async () => {
            calls += 1;
            await pending;
        }
    });
    const button = group.querySelector('[data-radar-assistant-export="institutional"]');

    const firstClick = button.click();
    const secondClick = button.click();
    assert.equal(calls, 1);
    assert.equal(button.dataset.radarBusy, 'true');
    assert.equal(button.getAttribute('aria-busy'), 'true');
    release();
    await Promise.all([firstClick, secondClick]);
    assert.equal(button.dataset.radarBusy, 'false');
    assert.equal(button.getAttribute('aria-busy'), null);
});

test('instala a ação SME sem alterar a restauração do exportador legado', () => {
    let legacyCalls = 0;
    const fakeRoot = {
        exportDataExcel() { legacyCalls += 1; }
    };

    assert.equal(integration.install({ root: fakeRoot }), true);
    assert.equal(typeof fakeRoot.exportDataExcelSme, 'function');
    assert.equal(typeof fakeRoot.exportDataCsvLegacy, 'function');
    assert.equal(fakeRoot.exportDataCsvLegacy(), true);
    assert.equal(legacyCalls, 1);
    assert.equal(integration.uninstall(), true);
    assert.equal(typeof fakeRoot.exportDataExcelSme, 'undefined');
    fakeRoot.exportDataExcel();
    assert.equal(legacyCalls, 2);
});