'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createSnapshot } = require('../../src/data/snapshot-tools.js');
const { bootstrapRemoteSnapshot } = require('../../scripts/lib/remote-bootstrap.mjs');

function snapshot(entities = {}) {
    return createSnapshot(entities, {
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
        async save(entity, batch) {
            writes.push({ entity, batch: structuredClone(batch) });
            const byId = new Map((entities[entity] || []).map(row => [row.id, row]));
            batch.forEach(row => byId.set(row.id, structuredClone(row)));
            entities[entity] = [...byId.values()];
            return batch;
        }
    };
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
