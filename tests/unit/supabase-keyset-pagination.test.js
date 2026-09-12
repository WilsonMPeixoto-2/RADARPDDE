'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { SupabaseRepository } = require('../../src/data/supabase-repository.js');

function cursorClient(pagesByCursor) {
    const calls = [];
    return {
        calls,
        client: {
            from(table) {
                const state = { afterId: null, limit: null };
                const builder = {
                    select(value) {
                        calls.push(['select', table, value]);
                        return this;
                    },
                    order(column, options) {
                        calls.push(['order', column, options]);
                        return this;
                    },
                    gt(column, value) {
                        state.afterId = String(value);
                        calls.push(['gt', column, String(value)]);
                        return this;
                    },
                    limit(value) {
                        state.limit = value;
                        calls.push(['limit', value]);
                        return this;
                    },
                    range(start, end) {
                        calls.push(['range', start, end]);
                        return this;
                    },
                    then(resolve, reject) {
                        const key = state.afterId || '__first__';
                        const rows = pagesByCursor[key] || [];
                        return Promise.resolve({ data: rows.slice(0, state.limit || rows.length), error: null })
                            .then(resolve, reject);
                    }
                };
                calls.push(['from', table]);
                return builder;
            }
        }
    };
}

test('load percorre coleções grandes por cursor de id e nunca por offset/range', async () => {
    const fake = cursorClient({
        __first__: [
            { id: 'A' },
            { id: 'B' }
        ],
        B: [
            { id: 'C' }
        ]
    });
    const repository = new SupabaseRepository({
        client: fake.client,
        pageSize: 2,
        readRetry: { maxAttempts: 1, delayMs: 0 }
    });

    const rows = await repository.load('schools');

    assert.deepEqual(rows.map(row => row.id), ['A', 'B', 'C']);
    assert.equal(fake.calls.some(call => call[0] === 'range'), false);
    assert.ok(fake.calls.some(call => call[0] === 'gt' && call[1] === 'id' && call[2] === 'B'));
    assert.ok(fake.calls.filter(call => call[0] === 'limit').every(call => call[1] === 2));
});

test('cursor progride de forma estritamente crescente entre páginas', async () => {
    const fake = cursorClient({
        __first__: [{ id: 'A' }, { id: 'B' }],
        B: [{ id: 'C' }, { id: 'D' }],
        D: []
    });
    const repository = new SupabaseRepository({
        client: fake.client,
        pageSize: 2,
        readRetry: { maxAttempts: 1, delayMs: 0 }
    });

    await repository.load('verifications');

    assert.deepEqual(
        fake.calls.filter(call => call[0] === 'gt').map(call => call[2]),
        ['B', 'D']
    );
});
