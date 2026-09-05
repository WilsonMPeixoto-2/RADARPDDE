'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const audit = require('../../src/integration/excel-export-audit.js');

function createRoot() {
    let clickHandler = null;
    let exportCalls = 0;
    const root = {
        activeCompetenciaKey: '2026-07',
        COMPETENCIAS: [{ key: '2026-07', label: 'Julho 2026' }],
        escolas: [],
        programas: [],
        verificacoes: {},
        pendencias: [],
        alert() {},
        registerLog() {},
        radarAuditService: {
            async record() {
                throw new Error('falha induzida no registro inicial');
            }
        },
        RadarExcelExportIntegration: {
            async exportSmeXlsx() {
                exportCalls += 1;
                return { ok: true };
            },
            exportXlsx() {
                exportCalls += 1;
                return { ok: true };
            }
        },
        document: {
            addEventListener(type, handler, capture) {
                if (type === 'click' && capture === true) clickHandler = handler;
            }
        }
    };
    return {
        root,
        exportCalls: () => exportCalls,
        dispatchSmeClick: async () => {
            assert.equal(typeof clickHandler, 'function');
            let prevented = false;
            let stopped = false;
            const button = {
                dataset: { radarSmeExport: 'true', radarExportFormat: 'xlsx-sme' }
            };
            const event = {
                target: {
                    closest(selector) {
                        if (selector.includes('radar-sme-export')) return button;
                        return null;
                    }
                },
                preventDefault() { prevented = true; },
                stopImmediatePropagation() { stopped = true; }
            };
            await clickHandler(event);
            await new Promise(resolve => setImmediate(resolve));
            return { prevented, stopped };
        }
    };
}

test('clique no botão real Excel SME passa pela auditoria e não baixa se o registro inicial falhar', async () => {
    const harness = createRoot();
    assert.equal(audit.install(harness.root), true);

    const gesture = await harness.dispatchSmeClick();

    assert.equal(gesture.prevented, true);
    assert.equal(gesture.stopped, true);
    assert.equal(harness.exportCalls(), 0);
});
