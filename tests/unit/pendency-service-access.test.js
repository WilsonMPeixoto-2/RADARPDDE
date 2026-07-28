'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const pendencyDomain = require('../../src/domain/pendencias.js');
const { PendencyService } = require('../../src/application/pendency-service.js');

function createService(profile) {
    const calls = [];
    const service = new PendencyService({
        dataService: {
            async execute(command) {
                calls.push(command);
                return command.mutate();
            }
        },
        domain: pendencyDomain,
        getState: () => ({
            pendencies: [],
            contacts: [],
            verifications: {},
            schools: [],
            programs: [],
            logs: []
        }),
        appendLog: () => null,
        getCurrentProfile: () => profile
    });
    return { service, calls };
}

test('serviço bloqueia todas as mutações de pendência para Gestão SME antes da transação', async () => {
    const { service, calls } = createService('sme');
    const operations = [
        () => service.open({}),
        () => service.registerAttempt({}),
        () => service.reanalyze({}),
        () => service.registerContact({}),
        () => service.cancel({}),
        () => service.reopen({}),
        () => service.updateStatus('cancel', {}, () => ({}), 'Cancelamento')
    ];

    for (const operation of operations) {
        await assert.rejects(
            operation,
            error => error?.code === 'FORBIDDEN' && error?.details?.profile === 'sme'
        );
    }
    assert.equal(calls.length, 0);
});

test('serviço também impede reanálise pelo Assistente sem bloquear outras operações válidas', async () => {
    const { service, calls } = createService('assistente');

    await assert.rejects(
        () => service.reanalyze({}),
        error => error?.code === 'FORBIDDEN'
    );
    assert.equal(calls.length, 0);

    await service.open({});
    assert.equal(calls.length, 1);
});
