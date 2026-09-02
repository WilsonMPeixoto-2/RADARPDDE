'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const ExcelJS = require('exceljs');

const modelApi = require('../../src/domain/pendency-excel-export-model.js');
const renderer = require('../../src/domain/pendency-excel-renderer.js');

function record(overrides = {}) {
    return {
        id: overrides.id || 'pendency-1',
        status: overrides.status || 'Aberta',
        schoolName: overrides.schoolName || 'Escola Municipal Modelo',
        schoolDesignation: overrides.schoolDesignation || '04.10.001',
        ra: overrides.ra || '10ª R.A.',
        controllerName: overrides.controllerName || 'Controlador Modelo',
        competence: overrides.competence || '2026-08',
        programName: overrides.programName || 'PDDE Básico',
        documentName: overrides.documentName || 'Extrato da conta corrente',
        item: overrides.item || 'Documento mensal',
        errors: overrides.errors || ['Documento ausente'],
        observation: overrides.observation || 'Providenciar documento.',
        nextActor: overrides.nextActor || 'Escola',
        nextAction: overrides.nextAction || 'Aguardar regularização da unidade escolar',
        openedAt: overrides.openedAt || '2026-07-01T12:00:00.000Z',
        resolvedAt: overrides.resolvedAt || null,
        cancelledAt: overrides.cancelledAt || null,
        waitingSince: overrides.waitingSince || '2026-07-01T12:00:00.000Z',
        ageDays: overrides.ageDays ?? 35,
        attemptCount: overrides.attemptCount ?? 0,
        latestAwaitingAttempt: overrides.latestAwaitingAttempt || null,
        latestMovement: overrides.latestMovement || {
            at: '2026-08-28T14:30:00.000Z',
            type: 'abertura',
            label: 'Pendência aberta'
        },
        cancelJustification: overrides.cancelJustification || '',
        ...overrides
    };
}

function pageModelFixture() {
    const aberta = record({ id: 'open', status: 'Aberta', ageDays: 35 });
    const aguardando = record({
        id: 'await',
        status: 'Aguardando reanálise',
        nextActor: 'Controlador',
        nextAction: 'Reanalisar documento',
        ageDays: 8,
        attemptCount: 1,
        latestAwaitingAttempt: {
            dataRegistro: '2026-08-30T10:00:00.000Z',
            dataDisponibilizacao: '2026-08-29'
        }
    });
    const resolvida = record({
        id: 'resolved',
        status: 'Resolvida',
        ageDays: null,
        waitingSince: null,
        resolvedAt: '2026-08-31T09:00:00.000Z',
        errors: []
    });
    const cancelada = record({
        id: 'cancelled',
        status: 'Cancelada',
        ageDays: null,
        waitingSince: null,
        cancelledAt: '2026-08-20T09:00:00.000Z',
        cancelJustification: 'Lançamento duplicado'
    });
    return {
        groups: {
            aberta: { records: [aberta], counts: { filtered: 1, total: 1 } },
            aguardando: { records: [aguardando], counts: { filtered: 1, total: 1 } },
            resolvida: { records: [resolvida], counts: { filtered: 1, total: 1 } },
            cancelada: { records: [cancelada], counts: { filtered: 1, total: 1 } }
        },
        filteredTotal: 4,
        total: 4,
        activeTotal: 2
    };
}

test('modelo exporta todas as situações filtradas sem identificadores técnicos', () => {
    const model = modelApi.buildWorkbookModel({
        pageModel: pageModelFixture(),
        generatedAt: new Date('2026-09-02T18:00:00.000Z'),
        filterSummary: [{ label: 'Programa', value: 'PDDE Básico' }]
    });

    assert.equal(model.title, 'RELATÓRIO DE PENDÊNCIAS DO PDDE');
    assert.equal(model.fileName, 'RELATORIO_PENDENCIAS_PDDE_2026-09-02.xlsx');
    assert.deepEqual(model.rows.map(row => row.status), [
        'Aberta',
        'Aguardando reanálise',
        'Resolvida',
        'Cancelada'
    ]);
    assert.equal(model.summary.exported, 4);
    assert.equal(model.summary.active, 2);
    assert.equal(model.summary.schoolAction, 1);
    assert.equal(model.summary.controllerAction, 1);
    assert.equal(model.summary.overdue30, 1);
    assert.equal(model.filterSummary[0].value, 'PDDE Básico');
    assert.equal(model.columns.some(column => /(^id$|uuid|identificador)/i.test(column.key)), false);
});

test('renderer gera workbook editorial com resumo, base filtrável e semântica visual', async () => {
    const model = modelApi.buildWorkbookModel({
        pageModel: pageModelFixture(),
        generatedAt: new Date('2026-09-02T18:00:00.000Z'),
        filterSummary: [{ label: 'Programa', value: 'PDDE Básico' }]
    });

    const workbook = renderer.buildWorkbook(model, { ExcelJS });
    assert.deepEqual(workbook.worksheets.map(sheet => sheet.name), ['RESUMO', 'PENDÊNCIAS']);

    const summary = workbook.getWorksheet('RESUMO');
    const data = workbook.getWorksheet('PENDÊNCIAS');
    assert.equal(summary.getCell('A1').value, 'RELATÓRIO DE PENDÊNCIAS DO PDDE');
    assert.equal(summary.getCell('A1').font.name, 'Segoe UI');
    assert.equal(summary.getCell('A1').font.size, 16);
    assert.equal(data.getCell('A4').value, 'Situação');
    assert.equal(data.getCell('A4').font.color.argb, 'FFFFFF');
    assert.equal(data.getCell('A4').fill.fgColor.argb, '1B365D');
    assert.equal(data.autoFilter, 'A4:W8');
    assert.equal(data.views[0].state, 'frozen');
    assert.equal(data.views[0].xSplit, 3);
    assert.equal(data.views[0].ySplit, 4);

    assert.equal(data.getCell('A5').fill.fgColor.argb, 'FFF3CD');
    assert.equal(data.getCell('A7').fill.fgColor.argb, 'D1E7DD');
    assert.equal(data.getCell('P5').fill.fgColor.argb, 'F8D7DA');

    const bytes = await renderer.renderWorkbook(model, { ExcelJS });
    assert.ok(bytes.length > 1000);

    const reopened = new ExcelJS.Workbook();
    await reopened.xlsx.load(bytes);
    assert.deepEqual(reopened.worksheets.map(sheet => sheet.name), ['RESUMO', 'PENDÊNCIAS']);
    assert.equal(reopened.getWorksheet('PENDÊNCIAS').getCell('B5').value, 'Escola Municipal Modelo');
    assert.equal(reopened.getWorksheet('RESUMO').getCell('A1').value, 'RELATÓRIO DE PENDÊNCIAS DO PDDE');
});
