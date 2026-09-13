'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { SupabaseRepository } = require('../../src/data/supabase-repository.js');

function clientWithout(method) {
    let executed = false;
    const query = {
        select() { return this; },
        order() { return this; },
        range() { return this; },
        then(resolve) {
            executed = true;
            resolve({ data: [], error: null });
        }
    };
    delete query[method];
    return {
        client: { from() { return query; } },
        wasExecuted() { return executed; }
    };
}

async function expectMissingPageCapability(method) {
    const fake = clientWithout(method);
    const repository = new SupabaseRepository({
        client: fake.client,
        readRetry: { maxAttempts: 1, delayMs: 0 }
    });

    await assert.rejects(
        repository.loadPage('appConfig', 0, 1),
        error => error?.code === 'MISSING_BOUNDED_PAGE_QUERY'
            && error?.operation === 'loadPage'
    );
    assert.equal(fake.wasExecuted(), false);
}

test('loadPage falha fechado sem ordenação determinística', async () => {
    await expectMissingPageCapability('order');
});

test('loadPage falha fechado sem range explícito no servidor', async () => {
    await expectMissingPageCapability('range');
});
