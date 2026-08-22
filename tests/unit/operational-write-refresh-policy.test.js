'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const policy = require('../../src/integration/operational-write-performance.js');

const persist = async () => ({});

test('fluxos compostos preservam administrativeLogs já confirmados pela RPC', () => {
    for (const name of ['invoice:save', 'invoice:remove', 'configuration:create-exercise']) {
        const decorated = policy.decorateCommand({
            name,
            changedEntities: ['administrativeLogs'],
            persist
        });
        assert.deepEqual(decorated.remoteRefreshExemptEntities, ['administrativeLogs'], name);
        assert.equal(decorated.remoteResultIsAuthoritative, undefined, name);
        assert.equal(decorated.remoteCommitIsAuthoritative, undefined, name);
    }
});

test('isenção de refresh é aditiva e não afeta comandos sem política explícita', () => {
    const decorated = policy.decorateCommand({
        name: 'invoice:save',
        changedEntities: ['registeredInvoices', 'administrativeLogs'],
        remoteRefreshExemptEntities: ['registeredInvoices'],
        persist
    });
    assert.deepEqual(
        decorated.remoteRefreshExemptEntities,
        ['registeredInvoices', 'administrativeLogs']
    );

    const generic = policy.decorateCommand({
        name: 'audit:record',
        changedEntities: ['administrativeLogs'],
        persist
    });
    assert.equal(generic.remoteRefreshExemptEntities, undefined);
});
