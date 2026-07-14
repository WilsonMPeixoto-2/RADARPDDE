'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { LocalStorageRepository } = require('../../src/data/local-storage-repository.js');
const { SupabaseRepository } = require('../../src/data/supabase-repository.js');
const {
    REQUIRED_REPOSITORY_METHODS,
    assertRepositoryContract,
    createSnapshotEnvelope
} = require('../../src/data/repository-contract.js');

function createMemoryStorage() {
    const values = new Map();
    return {
        getItem: key => values.has(key) ? values.get(key) : null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: key => values.delete(key)
    };
}

function createSupabaseClient(seed = {}) {
    const tables = new Map(Object.entries(seed).map(([name, rows]) => [name, structuredClone(rows)]));

    function table(name) {
        if (!tables.has(name)) tables.set(name, []);
        const state = { operation: 'select', payload: null, filters: [], range: null };
        const query = {
            select() {
                return query;
            },
            order() {
                return query;
            },
            range(from, to) {
                state.range = [from, to];
                return query;
            },
            upsert(payload) {
                state.operation = 'upsert';
                state.payload = structuredClone(payload);
                return query;
            },
            delete() {
                state.operation = 'delete';
                return query;
            },
            eq(column, value) {
                state.filters.push([column, value]);
                return query;
            },
            then(resolve) {
                let rows = tables.get(name);
                const matches = row => state.filters.every(([column, value]) => row[column] === value);
                if (state.operation === 'upsert') {
                    const incoming = Array.isArray(state.payload) ? state.payload : [state.payload];
                    const byId = new Map(rows.map(row => [row.id, row]));
                    incoming.forEach(row => byId.set(row.id, structuredClone(row)));
                    rows = [...byId.values()];
                    tables.set(name, rows);
                    resolve({ data: structuredClone(incoming), error: null });
                    return;
                }
                if (state.operation === 'delete') {
                    rows = rows.filter(row => !matches(row));
                    tables.set(name, rows);
                    resolve({ data: [], error: null });
                    return;
                }
                rows = rows.filter(matches).sort((left, right) => String(left.id).localeCompare(String(right.id)));
                if (state.range) rows = rows.slice(state.range[0], state.range[1] + 1);
                resolve({ data: structuredClone(rows), error: null });
            }
        };
        return query;
    }

    return { from: table };
}

function createRepositories() {
    return [
        new LocalStorageRepository({ storage: createMemoryStorage(), keyPrefix: 'equivalence' }),
        new SupabaseRepository({ client: createSupabaseClient() })
    ];
}

test('contrato exige a mesma superfície pública dos dois adaptadores', () => {
    assert.deepEqual(REQUIRED_REPOSITORY_METHODS, [
        'load',
        'save',
        'remove',
        'exportSnapshot',
        'restoreSnapshot',
        'healthCheck',
        'capabilities'
    ]);

    createRepositories().forEach(repository => {
        assert.equal(assertRepositoryContract(repository), repository);
        REQUIRED_REPOSITORY_METHODS.forEach(method => {
            assert.equal(typeof repository[method], 'function', `${repository.constructor.name}.${method}`);
        });
    });
});

test('adaptadores preservam clonagem, exclusão por id, snapshot e health check equivalentes', async () => {
    for (const repository of createRepositories()) {
        const source = [{ id: 's1', name: 'Escola A' }, { id: 's2', name: 'Escola B' }];
        await repository.save('schools', source);
        source[0].name = 'Mutação externa';
        assert.equal((await repository.load('schools'))[0].name, 'Escola A');

        const loaded = await repository.load('schools');
        loaded[0].name = 'Outra mutação externa';
        assert.equal((await repository.load('schools'))[0].name, 'Escola A');

        await repository.remove('schools', 's1');
        assert.deepEqual(await repository.load('schools'), [{ id: 's2', name: 'Escola B' }]);

        const snapshot = await repository.exportSnapshot({
            includeEmpty: true,
            importId: 'equivalence',
            exportedAt: '2026-07-14T12:00:00.000Z'
        });
        assert.equal(snapshot.format, 'radar-pdde-snapshot');
        assert.equal(snapshot.entities.schools.length, 1);

        const health = await repository.healthCheck();
        assert.equal(health.ok, true);
        assert.equal(typeof repository.capabilities().mode, 'string');
    }
});

test('restauração rejeita snapshot inválido nos dois adaptadores', async () => {
    for (const repository of createRepositories()) {
        await assert.rejects(repository.restoreSnapshot({ entities: {} }));
    }
});

test('snapshot canônico vazio continua válido para detectar bootstrap sem seed remoto', () => {
    const snapshot = createSnapshotEnvelope({}, {
        importId: 'empty',
        exportedAt: '2026-07-14T12:00:00.000Z'
    });
    assert.deepEqual(snapshot.entities, {});
});
