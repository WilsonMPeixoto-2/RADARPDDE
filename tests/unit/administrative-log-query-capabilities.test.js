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

function clientWithoutLimit() {
    return {
        from() {
            return {
                select() { return this; },
                order() { return this; },
                then(resolve, reject) {
                    return Promise.resolve({ data: [], error: null }).then(resolve, reject);
                }
            };
        }
    };
}

test('auditoria remota falha fechada quando o cliente não oferece limite no servidor', async () => {
    const repository = factory.createRepository(remoteRuntime(), {
        supabaseClient: clientWithoutLimit()
    });

    await assert.rejects(
        repository.queryAdministrativeLogs({ limit: 25 }),
        error => error?.code === 'MISSING_CONTEXTUAL_QUERY_CAPABILITY'
            && error?.operation === 'queryAdministrativeLogs'
    );
});
