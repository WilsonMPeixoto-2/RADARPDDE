'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { buildExportModel } = require('../src/domain/excel-export-model.js');
const { createWorkbookPlan } = require('../src/domain/excel-workbook-plan.js');

const input = {
    escolas: [{
        id: 'escola-1',
        inep: '33000001',
        denominação: 'Escola Municipal A',
        designação: '04.31.001',
        programasIds: ['BASIC']
    }],
    competencias: [{ key: '2026-01', label: 'Janeiro/2026' }],
    programas: [{ id: 'BASIC', name: 'PDDE Básico' }],
    verificacoes: {
        'escola-1': {
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

test('converte o modelo real de exportação no plano aprovado do workbook', () => {
    const exportModel = buildExportModel(input);
    const workbookPlan = createWorkbookPlan(exportModel, {
        generatedAt: '2026-07-10T06:00:00.000Z'
    });

    assert.equal(exportModel.equivalence.equivalent, true);
    assert.deepEqual(workbookPlan.sheetOrder, exportModel.sheetOrder);
    assert.equal(workbookPlan.sheets[0].table.rows.length, 1);
    assert.equal(workbookPlan.sheets[0].table.rows[0][11], 'APTA');
    assert.equal(workbookPlan.sheets[2].table.rows[0][0], 9);
});
