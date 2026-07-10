const test = require('node:test');
const assert = require('node:assert/strict');

const exportModel = require('../src/domain/excel-export-model.js');
const workbookPlan = require('../src/domain/excel-workbook-plan.js');
const renderer = require('../src/domain/excel-xlsx-renderer.js');
const integration = require('../src/integration/excel-export-integration.js');

function stateWithConsolidatedRows() {
    return {
        escolas: [{
            id: 'e1',
            inep: '33070440',
            denominação: 'Escola Municipal Ary Barroso',
            designação: '04.31.001',
            programasIds: ['BASIC']
        }],
        competencias: [{ key: '2026-05', label: 'Maio/2026' }],
        programas: [{ id: 'BASIC', name: 'PDDE Básico' }],
        verificacoes: {
            e1: {
                '2026-05_BASIC': {
                    bonificacao: {
                        extCC: 'Sim', extINV: 'Sim', notaFiscal: 'Não se aplica',
                        consAssessoria: 'Não se aplica', declBBAgil: 'Sim', encampInventario: 'Não se aplica'
                    },
                    resultadoBonif: 'apta'
                }
            }
        },
        activeCompetenciaKey: '2026-05'
    };
}

const dependencies = {
    modelApi: exportModel,
    planApi: workbookPlan,
    rendererApi: renderer
};

test('monta o novo Excel com nome derivado da competência ativa', () => {
    const artifacts = integration.createExportArtifacts(
        stateWithConsolidatedRows(),
        { generatedAt: '2026-07-10T12:00:00.000Z' },
        dependencies
    );

    assert.equal(artifacts.fileName, 'RADAR_PDDE_BONIFICACOES_05-2026.xlsx');
    assert.equal(artifacts.model.equivalence.equivalent, true);
    assert.equal(artifacts.model.base.rows.length, 1);
    assert.deepEqual(artifacts.plan.sheetOrder, [
        'BONIFICACOES', 'SINTESE', 'QUALIDADE_DADOS', 'METADADOS'
    ]);

    const bytes = renderer.renderWorkbook(artifacts.plan);
    assert.equal(bytes[0], 0x50);
    assert.equal(bytes[1], 0x4B);
});

test('bloqueia geração quando não existem bonificações consolidadas', () => {
    const state = stateWithConsolidatedRows();
    state.verificacoes.e1['2026-05_BASIC'].resultadoBonif = '';

    assert.throws(
        () => integration.createExportArtifacts(state, {}, dependencies),
        error => error && error.code === 'NO_CONSOLIDATED_ROWS'
    );
});

test('formata competência e nome do arquivo de modo estável', () => {
    assert.equal(integration.formatActiveCompetence('2026-05'), '05-2026');
    assert.equal(integration.formatActiveCompetence('TODAS'), 'TODAS');
    assert.equal(integration.buildFileName('2026-05'), 'RADAR_PDDE_BONIFICACOES_05-2026.xlsx');
});

test('preserva a função CSV legada ao instalar a integração', () => {
    let csvCalls = 0;
    const fakeRoot = {
        exportDataExcel() { csvCalls += 1; }
    };

    assert.equal(integration.install({ root: fakeRoot }), true);
    assert.equal(typeof fakeRoot.exportDataExcel, 'function');
    assert.equal(typeof fakeRoot.exportDataCsvLegacy, 'function');
    assert.equal(fakeRoot.exportDataCsvLegacy(), true);
    assert.equal(csvCalls, 1);
    assert.equal(integration.uninstall(), true);
});
