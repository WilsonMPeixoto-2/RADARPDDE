'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const modelApi = require('../../src/domain/excel-sme-export-model.js');
const integration = require('../../src/integration/excel-export-integration.js');

function state(activeCompetenciaKey = '2026-07') {
    return {
        activeCompetenciaKey,
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
