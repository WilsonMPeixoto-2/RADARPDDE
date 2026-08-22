'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { VerificationService } = require('../../src/application/verification-service.js');

test('alteração de bonificação declara que a RPC devolve o resultado remoto autoritativo', async () => {
    const commands = [];
    const service = new VerificationService({
        dataService: {
            execute: async command => {
                commands.push(command);
                return { ok: true };
            }
        },
        getState: () => ({ logs: [] }),
        ensureVerification: () => ({ bonificacao: {}, analise: {} }),
        appendLog: () => ({ id: 'log-test' }),
        getCurrentDate: () => new Date('2026-08-21T12:00:00-03:00')
    });

    await service.setBonification({
        profile: 'controlador',
        schoolId: '04.10.001',
        compKey: '2026-08_BASIC',
        documentKey: 'extCC',
        value: 'Sim'
    });

    assert.equal(commands.length, 1);
    assert.equal(commands[0].name, 'verification:set-bonification');
    assert.equal(commands[0].remoteResultIsAuthoritative, true);
});
