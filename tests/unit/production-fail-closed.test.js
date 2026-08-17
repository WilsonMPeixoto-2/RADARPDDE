'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    assertProductionRepository,
    createRepository
} = require('../../src/data/repository-factory.js');

const validProduction = Object.freeze({
    environment: 'production',
    dataMode: 'supabase-production',
    productionActivationApproved: true,
    features: { supabaseRepositoryEnabled: true },
    supabase: { connectionEnabled: true }
});

test('Production rejeita fallback local quando a conexão institucional não está válida', () => {
    assert.throws(
        () => createRepository({
            environment: 'production',
            dataMode: 'local',
            productionActivationApproved: false,
            features: { supabaseRepositoryEnabled: false },
            supabase: { connectionEnabled: false }
        }, { localRepository: { kind: 'local' } }),
        error => error?.code === 'PRODUCTION_REPOSITORY_UNAVAILABLE'
            && /temporariamente indisponível/i.test(error.message)
    );
});

test('Production válida passa pelo guard institucional', () => {
    assert.equal(assertProductionRepository(validProduction), true);
});

test('Preview e ambiente local preservam o repositório local explícito', () => {
    const localRepository = { kind: 'local-fixture' };
    const preview = createRepository({
        environment: 'preview',
        dataMode: 'local',
        productionActivationApproved: false,
        features: { supabaseRepositoryEnabled: false },
        supabase: { connectionEnabled: false }
    }, { localRepository });
    const local = createRepository({
        environment: 'local',
        dataMode: 'local',
        productionActivationApproved: false,
        features: { supabaseRepositoryEnabled: false },
        supabase: { connectionEnabled: false }
    }, { localRepository });

    assert.equal(preview, localRepository);
    assert.equal(local, localRepository);
});
