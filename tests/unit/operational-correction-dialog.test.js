'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const dialog = require('../../src/integration/operational-correction-dialog.js');

test('correção integrada permanece desligada sem flag ou repositório remoto', () => {
    assert.equal(dialog.canUse({}), false);
    assert.equal(dialog.canUse({
        RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
        RadarOperationalCorrectionClient: { createOperationalCorrectionClient() {} },
        RadarDataContext: { repository: { executeRpc() {}, capabilities: () => ({ remote: false }) } }
    }), false);
});
test('falha de capabilities fecha a disponibilidade sem exceção', () => {
    assert.equal(dialog.canUse({
        RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
        RadarOperationalCorrectionClient: { createOperationalCorrectionClient() {} },
        RadarDataContext: {
            repository: { executeRpc() {}, capabilities: () => { throw new Error('Sem conexão'); } }
        }
    }), false);
});
test('flag explícita com RPC remota e cliente libera somente o diálogo', () => {
    assert.equal(dialog.canUse({
        RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
        RadarOperationalCorrectionClient: { createOperationalCorrectionClient() {} },
        RadarDataContext: { repository: { executeRpc() {}, capabilities: () => ({ remote: true }) } }
    }), true);
});

test('usa o repositório real publicado em RadarApplicationServices.data', () => {
    const repository = { executeRpc() {}, capabilities: () => ({ remote: true }) };
    const root = {
        RADAR_OPERATIONAL_CORRECTION_PREVIEW: true,
        RadarDataContext: Object.freeze({ ready: true, capabilities: { remote: true } }),
        RadarApplicationServices: Object.freeze({ data: { repository } }),
        RadarOperationalCorrectionClient: { createOperationalCorrectionClient() {} }
    };
    assert.equal(dialog.canUse(root), true);
});

test('inclui Não analisado (clear_analysis) nas opções suportadas pelo diálogo', () => {
    assert.equal(Array.isArray(dialog.ANALYSES), true);
    assert.equal(dialog.ANALYSES.includes('Não analisado'), true);
});
