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

test('serviço permite que Assistente chegue à transação de reanálise', async () => {
    const { service, calls } = createService('assistente');

    await assert.rejects(
        () => service.reanalyze({ pendencyId: 'inexistente' }),
        error => error?.code === 'NOT_FOUND'
    );
    assert.equal(calls.length, 1);

    await service.open({});
    assert.equal(calls.length, 2);
});

test('administrador técnico mantém autoridade de reanálise mesmo simulando Gestão SME', async () => {
    const previousAuth = globalThis.RadarAuthContext;
    globalThis.RadarAuthContext = { authorization: { role: 'technical_admin' } };
    try {
        const { service, calls } = createService('sme');
        await assert.rejects(
            () => service.reanalyze({ pendencyId: 'inexistente' }),
            error => error?.code === 'NOT_FOUND'
        );
        assert.equal(calls.length, 1);
    } finally {
        if (previousAuth === undefined) delete globalThis.RadarAuthContext;
        else globalThis.RadarAuthContext = previousAuth;
    }
});
