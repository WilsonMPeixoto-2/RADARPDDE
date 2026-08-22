'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const modulePath = path.join(
    __dirname,
    '../../src/integration/operational-write-performance.js'
);

test('política de performance operacional existe e distingue RPCs seguras de fluxos que exigem reconciliação', () => {
    assert.equal(
        fs.existsSync(modulePath),
        true,
        'O módulo de política de performance operacional ainda não foi implementado.'
    );

    const policy = require(modulePath);
    assert.equal(typeof policy.decorateCommand, 'function');

    const persist = async () => ({});

    const pendency = policy.decorateCommand({
        name: 'pendency:register-attempt',
        changedEntities: ['pendencies', 'pendencyAttempts', 'verifications', 'administrativeLogs'],
        persist
    });
    assert.equal(pendency.remoteResultIsAuthoritative, true);
    assert.equal(pendency.remoteCommitIsAuthoritative, undefined);

    const reanalysis = policy.decorateCommand({
        name: 'pendency:reanalyze',
        changedEntities: ['pendencies', 'pendencyAttempts', 'verifications', 'administrativeLogs'],
        persist
    });
    assert.equal(reanalysis.remoteCommitIsAuthoritative, true);

    const inventory = policy.decorateCommand({
        name: 'inventory:update-asset',
        changedEntities: ['assets', 'administrativeLogs'],
        persist
    });
    assert.equal(inventory.remoteResultIsAuthoritative, true);

    const schoolSave = policy.decorateCommand({
        name: 'school:save',
        changedEntities: ['schools', 'schoolPrograms', 'administrativeLogs'],
        persist
    });
    assert.equal(schoolSave.remoteCommitIsAuthoritative, true);

    const invoice = policy.decorateCommand({
        name: 'invoice:save',
        changedEntities: ['registeredInvoices', 'assets', 'verifications', 'administrativeLogs'],
        persist
    });
    assert.equal(invoice.remoteCommitIsAuthoritative, undefined);
    assert.equal(invoice.remoteResultIsAuthoritative, undefined);

    const generic = policy.decorateCommand({
        name: 'audit:record',
        changedEntities: ['administrativeLogs']
    });
    assert.equal(generic.remoteCommitIsAuthoritative, undefined);
    assert.equal(generic.remoteResultIsAuthoritative, undefined);
});

test('política preserva declaração autoritativa explícita do comando', () => {
    assert.equal(fs.existsSync(modulePath), true);
    const policy = require(modulePath);
    const command = {
        name: 'verification:set-bonification',
        remoteResultIsAuthoritative: true,
        changedEntities: ['verifications', 'administrativeLogs'],
        persist: async () => ({})
    };
    const decorated = policy.decorateCommand(command);
    assert.equal(decorated.remoteResultIsAuthoritative, true);
    assert.equal(decorated.remoteCommitIsAuthoritative, undefined);
});
