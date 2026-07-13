'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    createSnapshot,
    validateSnapshot,
    buildImportBatches,
    reconcileSnapshots
} = require('../../src/data/snapshot-tools.js');

test('cria snapshot canônico com IDs ordenados', () => {
    const snapshot = createSnapshot({
        schools: [{ id: '2' }, { id: '1' }],
        programs: [{ id: 'BASIC' }]
    }, {
        version: '1',
        importId: 'import-001',
        exportedAt: '2026-07-13T12:00:00.000Z'
    });

    assert.equal(snapshot.format, 'radar-pdde-snapshot');
    assert.equal(snapshot.version, '1');
    assert.equal(snapshot.importId, 'import-001');
    assert.deepEqual(snapshot.entities.schools.map(item => item.id), ['1', '2']);
});

test('valida estrutura e rejeita IDs duplicados', () => {
    const valid = createSnapshot({ schools: [{ id: '1' }] }, {
        version: '1',
        importId: 'ok',
        exportedAt: '2026-07-13T12:00:00.000Z'
    });
    assert.deepEqual(validateSnapshot(valid), { ok: true, errors: [] });

    const invalid = {
        ...valid,
        entities: {
            schools: [{ id: '1' }, { id: '1' }]
        }
    };
    const result = validateSnapshot(invalid);
    assert.equal(result.ok, false);
    assert.match(result.errors.join(' '), /duplicado/i);
});

test('gera lotes sem alterar a ordem canônica', () => {
    const snapshot = createSnapshot({
        schools: [{ id: '3' }, { id: '1' }, { id: '2' }]
    }, {
        version: '1',
        importId: 'batch',
        exportedAt: '2026-07-13T12:00:00.000Z'
    });

    const batches = buildImportBatches(snapshot, 2);
    assert.deepEqual(batches, [
        { entity: 'schools', batchIndex: 0, records: [{ id: '1' }, { id: '2' }] },
        { entity: 'schools', batchIndex: 1, records: [{ id: '3' }] }
    ]);
});

test('reconcilia contagens, ausências e registros divergentes', () => {
    const source = createSnapshot({
        schools: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }]
    }, {
        version: '1',
        importId: 'source',
        exportedAt: '2026-07-13T12:00:00.000Z'
    });
    const target = createSnapshot({
        schools: [{ id: '1', name: 'Alterada' }, { id: '3', name: 'C' }]
    }, {
        version: '1',
        importId: 'target',
        exportedAt: '2026-07-13T12:00:00.000Z'
    });

    const report = reconcileSnapshots(source, target);
    assert.equal(report.ok, false);
    assert.deepEqual(report.entities.schools.missingInTarget, ['2']);
    assert.deepEqual(report.entities.schools.unexpectedInTarget, ['3']);
    assert.deepEqual(report.entities.schools.changed, ['1']);
});
