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
        const state = {
            operation: null,
            payload: null,
            filters: [],
            range: null,
            order: null,
            returning: false
        };
        const query = {
            select() {
                if (!state.operation) state.operation = 'select';
                else state.returning = true;
                return query;
            },
            order(column, options = {}) {
                state.order = { column, ascending: options.ascending !== false };
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
            update(payload) {
                state.operation = 'update';
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
                const matches = row => state.filters.every(([column, value]) => row[column] === value);

                if (state.operation === 'upsert') {
                    const incoming = Array.isArray(state.payload) ? state.payload : [state.payload];
                    const byId = new Map(data.map(row => [row.id, row]));
                    incoming.forEach(row => byId.set(row.id, row));
                    data = [...byId.values()];
                    tables.set(name, data);
                    resolve({ data: structuredClone(incoming), error: null });
                    return;
                }

                if (state.operation === 'update') {
                    const updated = [];
                    data = data.map(row => {
                        if (!matches(row)) return row;
                        const next = {
                            ...row,
                            ...state.payload,
                            row_version: Number(row.row_version || 1) + 1
                        };
                        updated.push(next);
                        return next;
                    });
                    tables.set(name, data);
                    resolve({ data: state.returning ? structuredClone(updated) : [], error: null });
                    return;
                }

                if (state.operation === 'delete') {
                    data = data.filter(row => !matches(row));
                    tables.set(name, data);
                    resolve({ data: structuredClone(data), error: null });
                    return;
                }

                data = data.filter(matches);
                if (state.order) {
                    const { column, ascending } = state.order;
                    data = data.slice().sort((left, right) => {
                        const comparison = String(left[column]).localeCompare(String(right[column]));
                        return ascending ? comparison : -comparison;
                    });
                }
                if (state.range) {
                    data = data.slice(state.range[0], state.range[1] + 1);
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

test('pagina todas as linhas em ordem determinística sem truncar coleções grandes', async () => {
    const rows = [5, 1, 3, 2, 4].map(id => ({ id: String(id), name: `Escola ${id}` }));
    const client = createSupabaseClient({ schools: rows });
    const repository = new SupabaseRepository({ client, pageSize: 2 });

    const loaded = await repository.load('schools');

    assert.deepEqual(loaded.map(row => row.id), ['1', '2', '3', '4', '5']);
    const selectCalls = client.calls.filter(call => call.table === 'schools' && call.operation === 'select');
    assert.deepEqual(selectCalls.map(call => call.range), [[0, 1], [2, 3], [4, 5]]);
});

test('grava coleções em lotes controlados', async () => {
    const client = createSupabaseClient();
    const repository = new SupabaseRepository({ client, writeBatchSize: 2 });
    const rows = [1, 2, 3, 4, 5].map(id => ({ id: String(id) }));

    await repository.save('schools', rows);

    const upserts = client.calls.filter(call => call.operation === 'upsert');
    assert.deepEqual(upserts.map(call => call.payload.length), [2, 2, 1]);
    assert.equal(client.dump('schools').length, 5);
});

test('atualiza com row_version e detecta conflito entre sessões', async () => {
    const client = createSupabaseClient({
        schools: [{ id: 's1', name: 'Original', row_version: 3 }]
    });
    const repository = new SupabaseRepository({ client });

    const updated = await repository.updateWithVersion(
        'schools',
        { id: 's1', name: 'Atualizada', row_version: 999 },
        3
    );

    assert.deepEqual(updated, { id: 's1', name: 'Atualizada', row_version: 4 });
    assert.deepEqual(client.dump('schools'), [{ id: 's1', name: 'Atualizada', row_version: 4 }]);

    await assert.rejects(
        repository.updateWithVersion('schools', { id: 's1', name: 'Conflito' }, 3),
        error => error instanceof RepositoryError
            && error.code === 'OPTIMISTIC_CONFLICT'
            && error.details.id === 's1'
    );
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
            registeredInvoices: [{ id: 'n1', school_id: 's1', linked_asset_id: 'a1' }],
            assets: [{ id: 'a1', school_id: 's1' }],
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
        'pendencies',
        'assets',
        'registered_invoices'
    ]);
    assert.deepEqual(result.skippedEntities, ['auditEvents']);
    assert.ok(IMPORT_ENTITY_ORDER.indexOf('competences') < IMPORT_ENTITY_ORDER.indexOf('appConfig'));
    assert.ok(IMPORT_ENTITY_ORDER.indexOf('assets') < IMPORT_ENTITY_ORDER.indexOf('registeredInvoices'));
    assert.deepEqual(NON_RESTORABLE_ENTITIES, ['auditEvents']);
});

test('remove registro por id', async () => {
    const client = createSupabaseClient({ pendencies: [{ id: 'p1' }, { id: 'p2' }] });
    const repository = new SupabaseRepository({ client });

    await repository.remove('pendencies', 'p1');

    assert.deepEqual(client.dump('pendencies'), [{ id: 'p2' }]);
});

test('executa RPCs atômicas de nota com versões e auditoria sem upserts paralelos', async () => {
    const rpcCalls = [];
    const client = createSupabaseClient();
    client.rpc = async (name, args) => {
        rpcCalls.push({ name, args: structuredClone(args) });
        return { data: { ok: true, name }, error: null };
    };
    const repository = new SupabaseRepository({ client });

    const saved = await repository.saveInvoiceWithEffects({
        invoice: { id: 'nota-1', school_id: 'ESC-1' },
        asset: { id: 'bem-1', school_id: 'ESC-1' },
        verificationPatch: { id: 'ver-1', analysis: {} },
        administrativeLog: { id: 'log-1', action: 'Nota Editada' },
        expectedInvoiceVersion: 2,
        expectedAssetVersion: 3,
        expectedVerificationVersion: 4
    });
    const removed = await repository.deleteInvoiceWithEffects({
        invoiceId: 'nota-1',
        expectedInvoiceVersion: 3,
        deleteLinkedAsset: true,
        expectedAssetVersion: 4,
        verificationPatch: { id: 'ver-1', analysis: {} },
        expectedVerificationVersion: 5,
        administrativeLog: { id: 'log-2', action: 'Nota Fiscal Removida' }
    });

    assert.deepEqual(saved, { ok: true, name: 'save_invoice_with_effects' });
    assert.deepEqual(removed, { ok: true, name: 'delete_invoice_with_effects' });
    assert.equal(rpcCalls.length, 2);
    assert.deepEqual(rpcCalls[0], {
        name: 'save_invoice_with_effects',
        args: {
            p_invoice: { id: 'nota-1', school_id: 'ESC-1' },
            p_asset: { id: 'bem-1', school_id: 'ESC-1' },
            p_verification_patch: { id: 'ver-1', analysis: {} },
            p_expected_invoice_version: 2,
            p_expected_asset_version: 3,
            p_expected_verification_version: 4,
            p_administrative_log: { id: 'log-1', action: 'Nota Editada' }
        }
    });
    assert.equal(rpcCalls[1].args.p_invoice_id, 'nota-1');
    assert.equal(rpcCalls[1].args.p_administrative_log.id, 'log-2');
    assert.equal(repository.capabilities().atomicInvoiceEffects, true);
    assert.equal(client.calls.length, 0);
});

test('traduz conflito otimista devolvido pela RPC para erro canônico', async () => {
    const client = createSupabaseClient();
    client.rpc = async () => ({
        data: null,
        error: { message: 'OPTIMISTIC_CONFLICT: registered_invoices/nota-1' }
    });
    const repository = new SupabaseRepository({ client });

    await assert.rejects(
        repository.saveInvoiceWithEffects({
            invoice: { id: 'nota-1', school_id: 'ESC-1' },
            expectedInvoiceVersion: 1
        }),
        error => error instanceof RepositoryError
            && error.code === 'OPTIMISTIC_CONFLICT'
            && error.operation === 'saveInvoiceWithEffects'
    );
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
