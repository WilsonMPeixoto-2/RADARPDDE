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
