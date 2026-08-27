'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const policy = require('../../src/integration/operational-write-performance.js');

const persist = async () => ({});

test('extensão mantém somente a isenção de refresh que ainda lhe pertence', () => {
    const decorated = policy.decorateCommand({
        name: 'configuration:create-exercise',
        changedEntities: ['administrativeLogs'],
        persist
    });

    assert.deepEqual(decorated.remoteRefreshExemptEntities, ['administrativeLogs']);
    assert.equal(decorated.remoteResultIsAuthoritative, undefined);
    assert.equal(decorated.remoteCommitIsAuthoritative, undefined);
});

test('extensão não sintetiza política de invoice e preserva declaração explícita do núcleo', () => {
    for (const name of ['invoice:save', 'invoice:remove']) {
        const implicit = policy.decorateCommand({
            name,
            changedEntities: ['registeredInvoices', 'administrativeLogs'],
            persist
        });
        assert.equal(
            implicit.remoteRefreshExemptEntities,
            undefined,
            `${name} não deve depender da extensão para declarar administrativeLogs`
        );

        const explicit = policy.decorateCommand({
            name,
            changedEntities: ['registeredInvoices', 'administrativeLogs'],
            remoteRefreshExemptEntities: ['administrativeLogs'],
            persist
        });
        assert.deepEqual(explicit.remoteRefreshExemptEntities, ['administrativeLogs'], name);
    }
});

test('isenção de refresh aceita somente o histórico administrativo append-only', () => {
    const decorated = policy.decorateCommand({
        name: 'invoice:save',
        changedEntities: ['registeredInvoices', 'administrativeLogs'],
        remoteRefreshExemptEntities: ['registeredInvoices', 'administrativeLogs'],
        persist
    });
    assert.deepEqual(decorated.remoteRefreshExemptEntities, ['administrativeLogs']);

    const genericUnsafe = policy.decorateCommand({
        name: 'audit:record',
        changedEntities: ['registeredInvoices'],
        remoteRefreshExemptEntities: ['registeredInvoices'],
        persist
    });
    assert.equal(genericUnsafe.remoteRefreshExemptEntities, undefined);

    const generic = policy.decorateCommand({
        name: 'audit:record',
        changedEntities: ['administrativeLogs'],
        persist
    });
    assert.equal(generic.remoteRefreshExemptEntities, undefined);
});
