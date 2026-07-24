'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const modelApi = require('../../src/domain/excel-sme-export-model.js');
const integration = require('../../src/integration/excel-export-integration.js');

function state() {
    return {
        escolas: [{
            id: 'school-1',
            designação: '04.10.001',
            denominação: 'EM EMA NEGRÃO DE LIMA',
            programasIds: ['BASIC']
        }],
        competencias: [{ key: '2026-01' }],
        programas: [{ id: 'BASIC', name: 'PDDE Básico' }],
        verificacoes: {
            'school-1': {
                '2026-01_BASIC': {
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

test('cria artefatos SME sem alterar o contrato do Excel institucional atual', () => {
    const rendererApi = { downloadWorkbook() {} };
    const artifacts = integration.createSmeExportArtifacts(
        state(),
        {},
        { modelApi, rendererApi }
    );

    assert.equal(artifacts.fileName, 'RADAR_PDDE_EXCEL_SME_2026.xlsx');
    assert.equal(artifacts.model.records.length, 1);
    assert.equal(artifacts.dependencies.rendererApi, rendererApi);
    assert.equal(integration.buildFileName('2026-05'), 'RADAR_PDDE_BONIFICACOES_05-2026.xlsx');
});

test('executa a geração assíncrona no renderizador exclusivo do modelo SME', async () => {
    let receivedModel = null;
    const rendererApi = {
        async downloadWorkbook(model, options) {
            receivedModel = model;
            return { fileName: options.fileName, bytes: new Uint8Array([0x50, 0x4B]) };
        }
    };

    const result = await integration.exportSmeXlsx({
        state: state(),
        dependencies: { modelApi, rendererApi },
        silent: true
    });

    assert.equal(result.ok, true);
    assert.equal(receivedModel.records.length, 1);
    assert.equal(result.download.fileName, 'RADAR_PDDE_EXCEL_SME_2026.xlsx');
});

test('configura botão secundário independente para o Excel SME', () => {
    const listeners = {};
    const attributes = {};
    const classes = new Set(['btn', 'btn-primary']);
    const primary = {
        cloneNode() {
            return {
                dataset: { radarXlsxEnhanced: 'true' },
                classList: {
                    add(value) { classes.add(value); },
                    remove(value) { classes.delete(value); }
                },
                removeAttribute(name) { delete attributes[name]; },
                setAttribute(name, value) { attributes[name] = value; },
                addEventListener(name, listener) { listeners[name] = listener; },
                textContent: '',
                title: '',
                disabled: false
            };
        }
    };

    const button = integration.createSmeButton(primary);

    assert.equal(button.dataset.radarSmeExport, 'true');
    assert.equal(button.dataset.radarExportFormat, 'xlsx-sme');
    assert.equal(button.textContent, 'Excel SME');
    assert.equal(classes.has('btn-secondary'), true);
    assert.equal(classes.has('btn-primary'), false);
    assert.equal(attributes['aria-label'], 'Gerar relatório no modelo Excel da SME');
    assert.equal(typeof listeners.click, 'function');
});

test('instala as três ações sem substituir o fluxo legado de restauração', () => {
    let legacyCalls = 0;
    const fakeRoot = {
        exportDataExcel() { legacyCalls += 1; }
    };

    assert.equal(integration.install({ root: fakeRoot }), true);
    assert.equal(typeof fakeRoot.exportDataExcel, 'function');
    assert.equal(typeof fakeRoot.exportDataExcelSme, 'function');
    assert.equal(typeof fakeRoot.exportDataCsvLegacy, 'function');
    assert.equal(fakeRoot.exportDataCsvLegacy(), true);
    assert.equal(legacyCalls, 1);
    assert.equal(integration.uninstall(), true);
    assert.equal(typeof fakeRoot.exportDataExcelSme, 'undefined');
    assert.equal(fakeRoot.exportDataExcel(), undefined);
    assert.equal(legacyCalls, 2);
});
