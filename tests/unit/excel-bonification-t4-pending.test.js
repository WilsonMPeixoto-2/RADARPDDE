'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const exportModel = require('../../src/domain/excel-export-model.js');
const workbookPlan = require('../../src/domain/excel-workbook-plan.js');
const renderer = require('../../src/domain/excel-xlsx-renderer.js');

function state() {
    return {
        escolas: [{
            id: 'T4-ESCOLA', inep: '33000001', denominação: 'Escola de teste T4',
            designação: '04.31.001', programasIds: ['BASIC', 'CONECTADA']
        }],
        competencias: [{ key: '2026-06', label: 'Junho/2026' }],
        programas: [
            { id: 'BASIC', name: 'PDDE Básico' },
            { id: 'CONECTADA', name: 'Educação Conectada' }
        ],
        verificacoes: {
            'T4-ESCOLA': {
                '2026-06_BASIC': {
                    bonificacao: {
                        extCC: 'Sim', extINV: 'Sim', notaFiscal: 'Não se aplica',
                        consAssessoria: 'Não se aplica', declBBAgil: 'Sim',
                        encampInventario: 'Não se aplica'
                    },
                    resultadoBonif: 'apta'
                },
                '2026-06_CONECTADA': {
                    bonificacao: {
                        extCC: 'Sim', extINV: 'Não', notaFiscal: 'Sim',
                        consAssessoria: 'Não se aplica', declBBAgil: 'Sim',
                        encampInventario: 'Não se aplica'
                    },
                    resultadoBonif: 'inapta'
                }
            }
        },
        activeCompetenciaKey: '2026-06'
    };
}

function workbookXml(current) {
    const model = exportModel.buildExportModel(current);
    const plan = workbookPlan.createWorkbookPlan(model, {
        generatedAt: '2026-11-22T12:00:00.000Z',
        source: 'Regressão T4',
        temporalScope: 'Competência 2026-06',
        fileName: 'RADAR_T4_TESTE.xlsx'
    });
    const entries = renderer.inspectStoredZip(renderer.renderWorkbook(plan));
    return {
        model,
        sheet: new TextDecoder().decode(entries['xl/worksheets/sheet1.xml']),
        workbook: new TextDecoder().decode(entries['xl/workbook.xml'])
    };
}

function legacyCsv(current) {
    const source = fs.readFileSync(path.join(__dirname, '../../app.js'), 'utf8');
    const start = source.indexOf('function exportDataExcel() {');
    const end = source.indexOf('// 20. ALTERNADOR DE TEMA', start);
    assert.ok(start !== -1 && end > start, 'exportador CSV legado precisa existir');
    const body = source.slice(start, end);
    const captured = { csv: null };
    const document = {
        body: { appendChild() {}, removeChild() {} },
        createElement() { return { setAttribute() {}, click() {} }; }
    };
    class BlobCapture {
        constructor(parts) { captured.csv = parts.join(''); }
    }
    const ctx = {
        escolas: current.escolas, COMPETENCIAS: current.competencias,
        programas: current.programas, verificacoes: current.verificacoes,
        activeCompetenciaKey: current.activeCompetenciaKey,
        Blob: BlobCapture,
        URL: { createObjectURL: () => 'blob:t4', revokeObjectURL() {} },
        document,
        radarAuditService: { record: async () => ({ ok: true }) },
        reportRadarPersistenceError(error) { throw error; }
    };
    vm.runInNewContext(body + '\nexportDataExcel();', ctx);
    return captured.csv;
}

test('T4: workbook e CSV nunca publicam resultado anterior quando a reconsolidação está pendente', () => {
    const current = state();
    const subject = current.verificacoes['T4-ESCOLA']['2026-06_BASIC'];
    subject.bonificacao.notaFiscal = 'Não se aplica';
    subject.bonificacaoPendenteConsolidacao = true;
    // Estado intermediário possível durante a atualização incremental: resultado antigo ainda na memória.
    assert.equal(subject.resultadoBonif, 'apta');

    const { model, sheet, workbook } = workbookXml(current);
    assert.equal(model.equivalence.equivalent, true, 'CSV e XLSX usam o mesmo universo');
    assert.deepEqual(model.base.rows.map(row => row.programaId), ['CONECTADA']);
    assert.equal(model.optional.summary.byPrograma.length, 1);
    assert.equal(model.optional.summary.byPrograma[0].inaptas, 1);
    assert.match(workbook, /BONIFICACOES/);
    assert.match(sheet, /Educação Conectada/);
    assert.doesNotMatch(sheet, /PDDE Básico/);
    assert.doesNotMatch(sheet, />APTA</);

    const csv = legacyCsv(current);
    assert.match(csv, /Educação Conectada/);
    assert.doesNotMatch(csv, /PDDE Básico/);
    assert.doesNotMatch(csv, /;APTA(?:\r?\n|$)/);
});

test('T4: novo Excel volta a incluir apenas resultado reconsolidado e preserva programa vizinho', () => {
    const current = state();
    const subject = current.verificacoes['T4-ESCOLA']['2026-06_BASIC'];
    subject.bonificacao.notaFiscal = 'Não se aplica';
    subject.bonificacaoPendenteConsolidacao = true;
    // Novo cálculo canônico finalizado após correção.
    subject.bonificacao.notaFiscal = 'Não';
    subject.resultadoBonif = 'inapta';
    subject.bonificacaoPendenteConsolidacao = false;

    const { model, sheet } = workbookXml(current);
    assert.equal(model.equivalence.equivalent, true);
    assert.deepEqual(model.base.rows.map(row => [row.programaId, row.statusBonificacao]), [
        ['BASIC', 'INAPTA'], ['CONECTADA', 'INAPTA']
    ]);
    assert.match(sheet, /PDDE Básico/);
    assert.match(sheet, /Educação Conectada/);
    assert.doesNotMatch(sheet, />APTA</);

    const csv = legacyCsv(current);
    assert.match(csv, /PDDE Básico/);
    assert.match(csv, /Educação Conectada/);
    assert.doesNotMatch(csv, /;APTA(?:\r?\n|$)/);
});
