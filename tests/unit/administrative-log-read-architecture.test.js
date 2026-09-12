'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const factory = require('../../src/data/repository-factory.js');

function remoteRuntime() {
    return {
        environment: 'development',
        dataMode: 'supabase-development',
        features: { supabaseRepositoryEnabled: true },
        supabase: { connectionEnabled: true }
    };
}

function minimalClient() {
    return {
        from() {
            throw new Error('Nenhuma consulta deve ocorrer durante a construção do repositório.');
        }
    };
}

const BOOTSTRAP_ENTITIES = Object.freeze([
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
    'registeredInvoices',
    'administrativeLogs'
]);

test('repositório Supabase expõe leitura paginada e contextual de logs administrativos', () => {
    const repository = factory.createRepository(remoteRuntime(), {
        supabaseClient: minimalClient()
    });

    assert.equal(typeof repository.queryAdministrativeLogs, 'function');
});

test('bootstrap operacional exclui somente administrativeLogs da carga inicial', () => {
    assert.equal(typeof factory.filterOperationalBootstrapEntities, 'function');

    const filtered = factory.filterOperationalBootstrapEntities(BOOTSTRAP_ENTITIES);

    assert.deepEqual(filtered, BOOTSTRAP_ENTITIES.filter(entity => entity !== 'administrativeLogs'));
    assert.equal(filtered.includes('verifications'), true);
    assert.equal(filtered.includes('registeredInvoices'), true);
    assert.equal(filtered.includes('pendencies'), true);
});

test('consulta explícita de administrativeLogs não é confundida com bootstrap', () => {
    const explicit = ['administrativeLogs'];
    assert.deepEqual(factory.filterOperationalBootstrapEntities(explicit), explicit);
});
