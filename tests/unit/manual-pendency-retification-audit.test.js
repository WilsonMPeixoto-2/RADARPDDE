'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { PendencyService } = require('../../src/application/pendency-service.js');
const retification = require('../../src/integration/auditable-retification.js');

function createHarness() {
    const state = {
        pendencies: [{
            id: 'pend-manual-audit',
            escolaId: 'ESC-1',
            competencia: '2026-05',
            item: 'Extrato Conta Corrente',
            documentoKey: 'Extrato Conta Corrente',
            motivo: 'Documento ausente',
            responsavel: 'Escola',
            status: 'Aberta',
            dataAbertura: '2026-09-01',
            observacao: 'Observação antiga',
            historico: [{ id: 'evt-1', tipo: 'abertura' }],
            rowVersion: 4
        }],
        logs: []
    };
    const commands = [];
    let sequence = 0;
    const service = new PendencyService({
        dataService: {
            async execute(command) {
                commands.push(command.name);
                const value = await command.mutate();
                return { ok: true, value };
            }
        },
        getState: () => state,
        appendLog: (action, details, context = {}) => {
            const log = {
                id: `log-${++sequence}`,
                action,
                details,
                escolaId: context.escolaId
            };
            state.logs.unshift(log);
            return log;
        },
        getCurrentProfile: () => 'controlador',
        getAuthenticatedRole: () => 'controller',
        createId: prefix => `${prefix}-${++sequence}`,
        now: () => '2026-09-10T20:00:00.000Z'
    });
    retification.protectPendencyService(service);
    return { state, commands, service };
}

test('auditoria da retificação manual identifica campo, valor anterior e valor novo', async () => {
    const { state, service } = createHarness();

    await service.retifyManualDetails({
        pendencyId: 'pend-manual-audit',
        item: 'Extrato Investimento',
        reason: 'Documento ilegível',
        responsible: 'Verbas Federais',
        observation: 'Observação corrigida'
    });

    const details = state.logs[0].details;
    assert.match(details, /Item/i);
    assert.match(details, /Extrato Conta Corrente/);
    assert.match(details, /Extrato Investimento/);
    assert.match(details, /Motivo/i);
    assert.match(details, /Documento ausente/);
    assert.match(details, /Documento ilegível/);
    assert.match(details, /Responsável/i);
    assert.match(details, /Escola/);
    assert.match(details, /Verbas Federais/);
    assert.match(details, /Observação/i);
    assert.match(details, /Observação antiga/);
    assert.match(details, /Observação corrigida/);
});

test('retificação manual semanticamente idêntica não grava nem cria auditoria', async () => {
    const { state, commands, service } = createHarness();

    const result = await service.retifyManualDetails({
        pendencyId: 'pend-manual-audit',
        item: 'Extrato Conta Corrente',
        reason: 'Documento ausente',
        responsible: 'Escola',
        observation: 'Observação antiga'
    });

    assert.equal(result.ok, true);
    assert.equal(result.value.unchanged, true);
    assert.deepEqual(commands, []);
    assert.deepEqual(state.logs, []);
});
