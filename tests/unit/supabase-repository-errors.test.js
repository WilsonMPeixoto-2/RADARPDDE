'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { SupabaseRepository } = require('../../src/data/supabase-repository.js');
const { RepositoryError } = require('../../src/data/repository-contract.js');
const { toRepositoryError } = require('../../src/application/error-mapper.js');

function errorClient(error, data = null) {
    const query = {
        select() { return query; },
        order() { return query; },
        range() { return query; },
        upsert() { return query; },
        insert() { return query; },
        update() { return query; },
        delete() { return query; },
        eq() { return query; },
        then(resolve) { resolve({ data, error }); }
    };
    return { from() { return query; } };
}

function headers(values) {
    return { get(name) { return values[String(name).toLowerCase()] || null; } };
}

for (const scenario of [
    {
        name: 'preserva RLS/403 e request id',
        error: { status: 403, code: '42501', message: 'new row violates row-level security policy', context: { headers: headers({ 'x-request-id': 'req-rls' }) } },
        expected: { code: 'PERMISSION_DENIED', status: 403, postgresCode: '42501', requestId: 'req-rls' }
    },
    {
        name: 'preserva conflito 409/23505',
        error: { status: 409, code: '23505', message: 'duplicate key value violates unique constraint', requestId: 'req-conflict' },
        expected: { code: 'CONFLICT', status: 409, postgresCode: '23505', requestId: 'req-conflict' }
    },
    {
        name: 'preserva validação 22P02',
        error: { status: 400, code: '22P02', message: 'invalid input syntax for type uuid', requestId: 'req-validation' },
        expected: { code: 'VALIDATION_FAILED', status: 400, postgresCode: '22P02', requestId: 'req-validation' }
    },
    {
        name: 'classifica falha de rede sem apagar causa',
        error: new TypeError('Failed to fetch'),
        expected: { code: 'REMOTE_UNAVAILABLE', status: null, postgresCode: null, requestId: null }
    }
]) {
    test(scenario.name, async () => {
        const repository = new SupabaseRepository({ client: errorClient(scenario.error) });
        await assert.rejects(repository.loadPage('schools', 0, 1), error => {
            assert.ok(error instanceof RepositoryError);
            assert.equal(error.code, scenario.expected.code);
            assert.equal(error.status, scenario.expected.status);
            assert.equal(error.postgresCode, scenario.expected.postgresCode);
            assert.equal(error.requestId, scenario.expected.requestId);
            assert.equal(error.entity, 'schools');
            assert.equal(error.operation, 'loadPage');
            assert.equal(error.cause, scenario.error);
            assert.equal(error.details.status, scenario.expected.status);
            return true;
        });
    });
}

test('mapeador funcional preserva metadados técnicos do repositório', () => {
    const remote = Object.assign(new RepositoryError('CONFLICT', 'duplicate key', {
        operation: 'save',
        entity: 'pendencies',
        details: { status: 409, postgresCode: '23505', requestId: 'req-map' }
    }), {
        status: 409,
        postgresCode: '23505',
        requestId: 'req-map'
    });

    const mapped = toRepositoryError(remote);
    assert.equal(mapped.code, 'OPTIMISTIC_CONFLICT');
    assert.equal(mapped.status, 409);
    assert.equal(mapped.postgresCode, '23505');
    assert.equal(mapped.requestId, 'req-map');
    assert.equal(mapped.details.sourceCode, 'CONFLICT');
    assert.equal(mapped.details.requestId, 'req-map');
});

test('remove exige confirmação de uma linha afetada', async () => {
    const repository = new SupabaseRepository({ client: errorClient(null, []) });
    await assert.rejects(
        repository.remove('pendencies', 'p-404'),
        error => error instanceof RepositoryError
            && error.code === 'NOT_FOUND_OR_FORBIDDEN'
            && error.details.id === 'p-404'
    );
});
