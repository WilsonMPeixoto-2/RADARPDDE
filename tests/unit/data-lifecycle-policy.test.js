'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const contract = require('../../src/data/repository-contract.js');
const dataServiceApi = require('../../src/application/data-service.js');

const EXPECTED_REMOTE_BOOTSTRAP = Object.freeze([
    'appConfig',
    'programs',
    'controllers',
    'inventoryTeamMembers',
    'schools',
    'schoolPrograms',
    'competences',
    'verifications',
    'pendencies',
    'pendencyAttempts',
    'pendencyContacts',
    'assets',
    'registeredInvoices'
]);

test('todas as entidades persistentes declaram ciclo de vida e estratégia de carga remota', () => {
    assert.ok(contract.ENTITY_LIFECYCLE && typeof contract.ENTITY_LIFECYCLE === 'object');
    assert.deepEqual(
        Object.keys(contract.ENTITY_LIFECYCLE).sort(),
        [...contract.RADAR_ENTITIES].sort()
    );

    for (const entity of contract.RADAR_ENTITIES) {
        const policy = contract.ENTITY_LIFECYCLE[entity];
        assert.match(policy.growth, /^(bounded|scoped|workflow|append-only)$/);
        assert.match(policy.remoteLoad, /^(bootstrap|auth-only|on-demand|maintenance)$/);
        assert.equal(policy.remoteBrowserPersistence, false);
    }
});

test('histórico append-only nunca entra no bootstrap operacional remoto', () => {
    const appendOnly = Object.entries(contract.ENTITY_LIFECYCLE)
        .filter(([, policy]) => policy.growth === 'append-only')
        .map(([entity]) => entity);

    assert.ok(appendOnly.includes('administrativeLogs'));
    appendOnly.forEach(entity => {
        assert.notEqual(contract.ENTITY_LIFECYCLE[entity].remoteLoad, 'bootstrap');
        assert.equal(dataServiceApi.REMOTE_BOOTSTRAP_ENTITIES.includes(entity), false);
    });
});

test('bootstrap remoto é derivado da política central e não contém o histórico administrativo', () => {
    assert.deepEqual(contract.REMOTE_BOOTSTRAP_ENTITIES, EXPECTED_REMOTE_BOOTSTRAP);
    assert.deepEqual(dataServiceApi.REMOTE_BOOTSTRAP_ENTITIES, EXPECTED_REMOTE_BOOTSTRAP);
    assert.equal(dataServiceApi.REMOTE_BOOTSTRAP_ENTITIES, contract.REMOTE_BOOTSTRAP_ENTITIES);
});

test('coleções crescentes que permanecem no bootstrap declaram escopo operacional explícito', () => {
    const growingBootstrap = contract.REMOTE_BOOTSTRAP_ENTITIES.filter(entity => (
        ['scoped', 'workflow'].includes(contract.ENTITY_LIFECYCLE[entity].growth)
    ));

    assert.ok(growingBootstrap.includes('verifications'));
    assert.ok(growingBootstrap.includes('registeredInvoices'));
    assert.ok(growingBootstrap.includes('pendencies'));

    growingBootstrap.forEach(entity => {
        assert.ok(
            String(contract.ENTITY_LIFECYCLE[entity].scope || '').trim(),
            `${entity} precisa declarar o limite lógico de crescimento no bootstrap`
        );
    });
});
