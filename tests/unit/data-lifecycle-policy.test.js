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
    'competences'
]);

const EXPECTED_CONTEXTUAL_OPERATIONAL = Object.freeze([
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
        assert.match(policy.remoteLoad, /^(bootstrap|context|auth-only|on-demand|maintenance)$/);
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

test('bootstrap remoto contém somente dados estruturais pequenos e estáveis', () => {
    assert.deepEqual(contract.REMOTE_BOOTSTRAP_ENTITIES, EXPECTED_REMOTE_BOOTSTRAP);
    assert.deepEqual(dataServiceApi.REMOTE_BOOTSTRAP_ENTITIES, EXPECTED_REMOTE_BOOTSTRAP);
    assert.equal(dataServiceApi.REMOTE_BOOTSTRAP_ENTITIES, contract.REMOTE_BOOTSTRAP_ENTITIES);
});

test('coleções operacionais crescentes são carregadas por contexto e nunca no login integralmente', () => {
    const contextual = Object.entries(contract.ENTITY_LIFECYCLE)
        .filter(([, policy]) => policy.remoteLoad === 'context')
        .map(([entity]) => entity);

    assert.deepEqual(contextual, EXPECTED_CONTEXTUAL_OPERATIONAL);
    contextual.forEach(entity => {
        assert.equal(contract.REMOTE_BOOTSTRAP_ENTITIES.includes(entity), false);
        assert.ok(
            String(contract.ENTITY_LIFECYCLE[entity].scope || '').trim(),
            `${entity} precisa declarar o contexto operacional de leitura`
        );
    });
});

test('dataImportRuns é workflow mutável e não recebe semântica append-only', () => {
    assert.equal(contract.ENTITY_LIFECYCLE.dataImportRuns.growth, 'workflow');
    assert.equal(contract.ENTITY_LIFECYCLE.dataImportRuns.remoteLoad, 'maintenance');
});
