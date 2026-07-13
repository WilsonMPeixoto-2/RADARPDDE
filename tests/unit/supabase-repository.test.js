'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    SupabaseRepository,
    IMPORT_ENTITY_ORDER,
    NON_RESTORABLE_ENTITIES
} = require('../../src/data/supabase-repository.js');
const { createRepository } = require('../../src/data/repository-factory.js');
const { RepositoryError } = require('../../src/data/repository-contract.js');
const { validateSnapshot } = require('../../src/data/snapshot-tools.js');

function createSupabaseClient(seed = {}) {
    const tables = new Map(Object.entries(seed).map(([name, rows]) => [name, structuredClone(rows)]));
    const calls = [];

    function table(name) {
        if (!tables.has(name)) tables.set(name, []);
        const state = { operation: null, payload: null, filters: [] };
        const query = {
            select() {
                state.operation = 'select';
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
                calls.push({ table: name, ...structuredClone(state) });
                let data = tables.get(name);
                if (state.operation === 'upsert') {
                    const incoming = Array.isArray(state.payload) ? state.payload : [state.payload];
                    const byId = new Map(data.map(row => [row.id, row]));
                    incoming.forEach(row => byId.set(row.id, row));
                    data = [...byId.values()];
                    tables.set(name, data);
                } else if (state.operation === 'delete') {
                    data = data.filter(row => !state.filters.every(([column, value]) => row[column] === value));
                    tables.set(name, data);
                }
                resolve({ data: structuredClone(data), error: null });
            }
        };
        return query;
    }

    return {
        from: table,
        calls,
        dump(name) {
            return structuredClone(tables.get(name) || []);
        }
    };
}

test('carrega e grava por tabela sem executar seed automático', async () => {
    const client = createSupabaseClient({ schools: [{ id: '1', name: 'A' }] });
    const repository = new SupabaseRepository({ client });

    assert.deepEqual(await repository.load('schools'), [{ id: '1', name: 'A' }]);
    await repository.save('schools', [{ id: '2', name: 'B' }]);

    assert.deepEqual(client.dump('schools'), [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' }
    ]);
    assert.equal(client.calls.some(call => call.operation === 'insert'), false);
});

test('exporta snapshot remoto compatível com as ferramentas de reconciliação', async () => {
    const client = createSupabaseClient({
        schools: [{ id: '1', name: 'A' }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }]
    });
    const repository = new SupabaseRepository({ client });

    const snapshot = await repository.exportSnapshot({
        version: '7',
        importId: 'remote-001',
        exportedAt: '2026-07-13T12:00:00.000Z'
    });

    assert.equal(snapshot.format, 'radar-pdde-snapshot');
    assert.equal(snapshot.version, '7');
    assert.equal(snapshot.importId, 'remote-001');
    assert.deepEqual(validateSnapshot(snapshot), { ok: true, errors: [] });
});

test('restaura snapshot respeitando FKs e sem reimportar auditoria técnica', async () => {
    const client = createSupabaseClient();
    const repository = new SupabaseRepository({ client });

    const result = await repository.restoreSnapshot({
        format: 'radar-pdde-snapshot',
        version: '1',
        importId: 'ordered-import',
        exportedAt: '2026-07-13T12:00:00.000Z',
        entities: {
            pendencies: [{ id: 'p1', school_id: 's1' }],
            auditEvents: [{ id: '1', table_name: 'schools' }],
            appConfig: [{ id: 'global', closing_competence: '2026-05' }],
            schools: [{ id: 's1' }],
            programs: [{ id: 'BASIC' }],
            competences: [{ id: '2026-05' }]
        }
    });

    const upsertTables = client.calls
        .filter(call => call.operation === 'upsert')
        .map(call => call.table);

    assert.deepEqual(upsertTables, [
        'competences',
        'programs',
        'app_config',
        'schools',
        'pendencies'
    ]);
    assert.deepEqual(result.skippedEntities, ['auditEvents']);
    assert.ok(IMPORT_ENTITY_ORDER.indexOf('competences') < IMPORT_ENTITY_ORDER.indexOf('appConfig'));
    assert.deepEqual(NON_RESTORABLE_ENTITIES, ['auditEvents']);
});

test('remove registro por id', async () => {
    const client = createSupabaseClient({ pendencies: [{ id: 'p1' }, { id: 'p2' }] });
    const repository = new SupabaseRepository({ client });

    await repository.remove('pendencies', 'p1');

    assert.deepEqual(client.dump('pendencies'), [{ id: 'p2' }]);
});

test('recusa construção sem cliente Supabase válido', () => {
    assert.throws(
        () => new SupabaseRepository({ client: null }),
        error => error instanceof RepositoryError && error.code === 'MISSING_CLIENT'
    );
});

test('factory permanece em local sem dupla autorização', () => {
    const localRepository = { type: 'local' };
    const supabaseClient = createSupabaseClient();

    const selected = createRepository({
        dataMode: 'supabase-preview',
        features: {
            supabaseRepositoryEnabled: true,
            legacyAppBridgeEnabled: false
        },
        supabase: {
            connectionEnabled: false
        }
    }, {
        localRepository,
        supabaseClient
    });

    assert.equal(selected, localRepository);
    assert.equal(supabaseClient.calls.length, 0);
});

test('factory cria Supabase sem instanciar armazenamento local desnecessário', () => {
    const selected = createRepository({
        dataMode: 'supabase-preview',
        features: {
            supabaseRepositoryEnabled: true,
            legacyAppBridgeEnabled: true
        },
        supabase: {
            connectionEnabled: true
        }
    }, {
        supabaseClient: createSupabaseClient()
    });

    assert.ok(selected instanceof SupabaseRepository);
});
