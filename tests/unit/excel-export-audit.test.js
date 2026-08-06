'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { install } = require('../../src/integration/excel-export-audit.js');

function createRoot(options = {}) {
    const auditEvents = [];
    const legacyEvents = [];
    let exportCalls = 0;
    const root = {
        escolas: [],
        COMPETENCIAS: [],
        programas: [],
        verificacoes: {},
        pendencias: [],
        activeCompetenciaKey: '2026-05',
        alert() {},
        registerLog(action, details) {
            legacyEvents.push({ action, details });
        },
        radarAuditService: {
            async record(event) {
                if (options.failAuditAt === auditEvents.length) {
                    throw new Error('Falha simulada de auditoria.');
                }
                auditEvents.push(event);
                return { ok: true };
            }
        },
        RadarExcelExportIntegration: {
            exportXlsx() {
                exportCalls += 1;
                root.registerLog('Relatório Excel Exportado', 'legado');
                return { ok: true, fileName: 'relatorio.xlsx' };
            },
            async exportSmeXlsx() {
                exportCalls += 1;
                root.registerLog('Relatório Excel SME Exportado', 'legado');
                return { ok: true, fileName: 'sme.xlsx' };
            }
        }
    };
    return {
        root,
        auditEvents,
        legacyEvents,
        exportCalls: () => exportCalls
    };
}

test('registra início e conclusão antes de confirmar a exportação institucional', async () => {
    const harness = createRoot();
    assert.equal(install(harness.root), true);

    const result = await harness.root.exportDataExcel();

    assert.equal(result.ok, true);
    assert.equal(result.auditConfirmed, true);
    assert.equal(harness.exportCalls(), 1);
    assert.deepEqual(
        harness.auditEvents.map(event => event.action),
        ['Exportação Excel Iniciada', 'Relatório Excel Exportado']
    );
    assert.equal(harness.legacyEvents.length, 0);
});

test('aplica a mesma trilha obrigatória ao Excel SME', async () => {
    const harness = createRoot();
    install(harness.root);

    const result = await harness.root.exportDataExcelSme();

    assert.equal(result.ok, true);
    assert.equal(result.auditConfirmed, true);
    assert.deepEqual(
        harness.auditEvents.map(event => event.action),
        ['Exportação Excel Iniciada', 'Relatório Excel SME Exportado']
    );
    assert.equal(harness.legacyEvents.length, 0);
});

test('bloqueia o download quando o registro inicial não é persistido', async () => {
    const harness = createRoot({ failAuditAt: 0 });
    install(harness.root);

    const result = await harness.root.exportDataExcel();

    assert.equal(result.ok, false);
    assert.equal(result.auditFailed, true);
    assert.equal(harness.exportCalls(), 0);
});
