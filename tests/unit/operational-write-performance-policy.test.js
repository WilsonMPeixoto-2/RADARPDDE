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

    const serviceAdvisory = policy.decorateCommand({
        name: 'invoice:update-service-advisory',
        changedEntities: ['registeredInvoices', 'verifications', 'administrativeLogs'],
        persist
    });
    assert.equal(serviceAdvisory.remoteCommitIsAuthoritative, true);

    const calendar = policy.decorateCommand({
        name: 'configuration:save-calendar',
        changedEntities: ['appConfig', 'administrativeLogs'],
        persist
    });
    assert.equal(calendar.remoteResultIsAuthoritative, true);

    const invoice = policy.decorateCommand({
        name: 'invoice:save',
        changedEntities: ['registeredInvoices', 'assets', 'verifications', 'administrativeLogs'],
        persist
    });
    assert.equal(invoice.remoteCommitIsAuthoritative, undefined);
    assert.equal(invoice.remoteResultIsAuthoritative, undefined);

    const exercise = policy.decorateCommand({
        name: 'configuration:create-exercise',
        changedEntities: ['appConfig', 'competences', 'administrativeLogs'],
        persist
    });
    assert.equal(exercise.remoteCommitIsAuthoritative, undefined);
    assert.equal(exercise.remoteResultIsAuthoritative, undefined);

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

test('instalação aplica a política ao DataService compartilhado pelos serviços da aplicação', async () => {
    assert.equal(fs.existsSync(modulePath), true);
    const policy = require(modulePath);
    const received = [];
    const dataService = {
        execute: async command => {
            received.push(command);
            return command;
        }
    };
    const root = {
        RadarApplicationServices: {
            pendencies: { dataService },
            inventory: { dataService }
        }
    };

    assert.equal(policy.install(root), true);
    await dataService.execute({
        name: 'pendency:open',
        changedEntities: ['pendencies', 'administrativeLogs'],
        persist: async () => ({})
    });

    assert.equal(received.length, 1);
    assert.equal(received[0].remoteResultIsAuthoritative, true);
    assert.equal(dataService.__radarOperationalWritePerformance, true);
});
