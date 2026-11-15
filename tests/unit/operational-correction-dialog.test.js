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
