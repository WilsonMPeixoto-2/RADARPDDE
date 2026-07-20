'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createSnapshot } = require('../../src/data/snapshot-tools.js');
const { RADAR_ENTITIES } = require('../../src/data/repository-contract.js');
const { SupabaseRepository } = require('../../src/data/supabase-repository.js');
const { bootstrapRemoteSnapshot } = require('../../scripts/lib/remote-bootstrap.mjs');

const SQL_PROFILE_BASELINE = Object.freeze([
    Object.freeze({ id: 'technical_admin', label: 'Administrador t\u00e9cnico', priority: 10, description: 'Administra\u00e7\u00e3o t\u00e9cnica e seguran\u00e7a do ambiente.', active: true }),
    Object.freeze({ id: 'sme_management', label: 'Gest\u00e3o SME', priority: 20, description: 'Leitura gerencial e administra\u00e7\u00e3o institucional.', active: true }),
    Object.freeze({ id: 'federal_assistant', label: 'Assistente de Verbas Federais', priority: 30, description: 'Opera\u00e7\u00e3o transversal de verbas federais.', active: true }),
    Object.freeze({ id: 'controller', label: 'Controlador', priority: 40, description: 'Opera\u00e7\u00e3o da carteira de escolas vinculada.', active: true }),
    Object.freeze({ id: 'inventory', label: 'Equipe de Invent\u00e1rio', priority: 50, description: 'Opera\u00e7\u00e3o patrimonial e de inventaria\u00e7\u00e3o.', active: true })
]);

function snapshot(entities = {}) {
    return createSnapshot(Object.fromEntries(RADAR_ENTITIES.map(entity => [entity, entities[entity] || []])), {
        importId: 'remote-flow',
        exportedAt: '2026-07-20T12:00:00.000Z'
    });
}

function createInMemoryRemote(initial = {}) {
    const entities = structuredClone(initial);
    const writes = [];
    return {
        writes,
        async exportSnapshot(options = {}) {
            const names = new Set([...Object.keys(entities), 'programs', 'schools', 'competences']);
            const exported = {};
            for (const entity of names) {
                const rows = structuredClone(entities[entity] || []);
                if (options.includeEmpty || rows.length) exported[entity] = rows;
            }
            return snapshot(exported);
        },
        async insertOnly(entity, batch) {
            writes.push({ entity, batch: structuredClone(batch) });
            const byId = new Map((entities[entity] || []).map(row => [row.id, row]));
            batch.forEach(row => byId.set(row.id, structuredClone(row)));
            entities[entity] = [...byId.values()];
            return batch;
        }
    };
}

function createSupabaseClientWithMetadata(seed = {}, options = {}) {
    const tables = new Map(Object.entries(seed).map(([name, rows]) => [name, structuredClone(rows)]));
    const calls = [];
    const table = name => {
        if (!tables.has(name)) tables.set(name, []);
        const state = { operation: null, payload: null, range: null, order: null };
        const query = {
            select() { state.operation ||= 'select'; return query; },
            order(column) { state.order = column; return query; },
            range(from, to) { state.range = [from, to]; return query; },
            insert(payload) { state.operation = 'insert'; state.payload = structuredClone(payload); return query; },
            upsert(payload) { state.operation = 'upsert'; state.payload = structuredClone(payload); return query; },
            then(resolve) {
                calls.push({ table: name, operation: state.operation, payload: structuredClone(state.payload) });
                let rows = tables.get(name);
                if (state.operation === 'insert') {
                    const incoming = Array.isArray(state.payload) ? state.payload : [state.payload];
                    const duplicate = incoming.some(row => rows.some(existing => existing.id === row.id));
                    if (duplicate || options.uniqueOnInsert === name) {
                        resolve({ data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } });
                        return;
                    }
                    const created = incoming.map((row, index) => ({
                        ...row,
                        ...((name === 'controllers' || name === 'inventory_team_members') && row.user_id === undefined
                            ? { user_id: null }
                            : {}),
                        row_version: 1,
                        created_at: `2026-07-20T12:00:0${index}.000Z`,
                        updated_at: `2026-07-20T12:00:0${index}.000Z`
                    }));
                    tables.set(name, [...rows, ...created]);
                    if (name !== 'audit_events') {
                        const audits = tables.get('audit_events') || [];
                        tables.set('audit_events', [...audits, ...created.map((row, index) => ({
                            id: `audit-${name}-${row.id}-${index}`,
                            table_name: name,
                            created_at: row.created_at
                        }))]);
                    }
                    resolve({ data: structuredClone(created), error: null });
                    return;
                }
                if (state.operation === 'upsert') {
                    resolve({ data: null, error: new Error('upsert must not be used by bootstrap') });
                    return;
                }
                if (state.order) rows = rows.slice().sort((left, right) => String(left[state.order]).localeCompare(String(right[state.order])));
                if (state.range) rows = rows.slice(state.range[0], state.range[1] + 1);
                resolve({ data: structuredClone(rows), error: null });
            }
        };
        return query;
    };
    return { from: table, calls, dump: name => structuredClone(tables.get(name) || []) };
}

test('reconcilia e permite reexecu\u00e7\u00e3o idempotente', async () => {
    const source = snapshot({
        competences: [{ id: '2026-07' }],
        programs: [{ id: 'PDDE' }],
        schools: [{ id: 'school-1', denomination: 'Escola real' }]
    });
    const repository = createInMemoryRemote();

    const first = await bootstrapRemoteSnapshot({ repository, snapshot: source, mode: 'import', batchSize: 2 });
    const writesAfterFirstRun = repository.writes.length;
    const second = await bootstrapRemoteSnapshot({ repository, snapshot: source, mode: 'import', batchSize: 2 });

    assert.equal(first.ok, true);
    assert.equal(first.reconciliation.ok, true);
    assert.equal(second.ok, true);
    assert.equal(second.writtenRows, 0);
    assert.equal(repository.writes.length, writesAfterFirstRun);
});

test('atravessa SupabaseRepository com metadados e auditoria gerada sem upsert', async () => {
    const client = createSupabaseClientWithMetadata({
        profiles: SQL_PROFILE_BASELINE.map(profile => ({ ...profile, row_version: 1 }))
    });
    const repository = new SupabaseRepository({ client });
    const source = snapshot({ schools: [{ id: 'school-1', denomination: 'Escola real', rowVersion: 99 }] });

    const first = await bootstrapRemoteSnapshot({ repository, snapshot: source, mode: 'import' });
    const second = await bootstrapRemoteSnapshot({ repository, snapshot: source, mode: 'import' });

    assert.equal(first.reconciliation.ok, true);
    assert.equal(second.writtenRows, 0);
    assert.equal(client.calls.some(call => call.operation === 'upsert'), false);
    assert.equal(client.dump('schools')[0].row_version, 1);
    assert.equal(client.dump('audit_events').length > 0, true);
});

test('normaliza user_id ausente e null somente nos defaults remotos permitidos', async () => {
    const client = createSupabaseClientWithMetadata({
        profiles: SQL_PROFILE_BASELINE.map(profile => ({ ...profile, row_version: 1 }))
    });
    const repository = new SupabaseRepository({ client });
    const source = snapshot({
        controllers: [{ id: 'controller-1', name: 'Controlador real' }],
        inventoryTeamMembers: [{ id: 'inventory-1', name: 'Inventario real' }]
    });

    const first = await bootstrapRemoteSnapshot({ repository, snapshot: source, mode: 'import' });
    const repeated = await bootstrapRemoteSnapshot({ repository, snapshot: source, mode: 'import' });
    const reconciled = await bootstrapRemoteSnapshot({ repository, snapshot: source, mode: 'reconcile' });

    assert.equal(first.reconciliation.ok, true);
    assert.equal(repeated.writtenRows, 0);
    assert.equal(reconciled.ok, true);
    assert.equal(client.dump('controllers')[0].user_id, null);
    assert.equal(client.dump('inventory_team_members')[0].user_id, null);
});

test('converte colisao insert-only do SupabaseRepository em conflito sem sobrescrever', async () => {
    const client = createSupabaseClientWithMetadata({}, { uniqueOnInsert: 'schools' });
    const repository = new SupabaseRepository({ client });
    const source = snapshot({ schools: [{ id: 'school-1', denomination: 'Escola real' }] });

    await assert.rejects(
        bootstrapRemoteSnapshot({ repository, snapshot: source, mode: 'import' }),
        error => error.code === 'DESTINATION_CONFLICT'
    );
    assert.equal(client.calls.some(call => call.operation === 'upsert'), false);
});
