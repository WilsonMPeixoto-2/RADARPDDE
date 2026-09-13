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

function clientWithout(method) {
    return {
        from() {
            const builder = {
                select() { return this; },
                eq() { return this; },
                or() { return this; },
                order() { return this; },
                limit() { return this; },
                then(resolve, reject) {
                    return Promise.resolve({ data: [], error: null }).then(resolve, reject);
                }
            };
            delete builder[method];
            return builder;
        }
    };
}

async function expectMissingCapability(method, options = {}) {
    const repository = factory.createRepository(remoteRuntime(), {
        supabaseClient: clientWithout(method)
    });

    await assert.rejects(
        repository.queryAdministrativeLogs(options),
        error => error?.code === 'MISSING_CONTEXTUAL_QUERY_CAPABILITY'
            && error?.operation === 'queryAdministrativeLogs'
    );
}

test('auditoria remota falha fechada quando o cliente não oferece limite no servidor', async () => {
    await expectMissingCapability('limit', { limit: 25 });
});

test('auditoria remota falha fechada quando o cliente não oferece ordenação determinística', async () => {
    await expectMissingCapability('order', { limit: 25 });
});

test('auditoria remota falha fechada quando um filtro solicitado não pode ser aplicado no servidor', async () => {
    await expectMissingCapability('eq', { limit: 25, schoolId: '04.31.001' });
});

test('auditoria remota falha fechada quando o cursor não pode ser aplicado no servidor', async () => {
    await expectMissingCapability('or', {
        limit: 25,
        cursor: { eventAt: '2026-09-13T12:00:00Z', id: 'LOG-2' }
    });
});
