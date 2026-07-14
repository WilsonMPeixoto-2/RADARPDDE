'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { ImportCoordinator, createMemoryCheckpointStore } = require('../../src/data/import-coordinator.js');
const { LocalStorageRepository } = require('../../src/data/local-storage-repository.js');
const { createSnapshot } = require('../../src/data/snapshot-tools.js');

function storage() {
    const values = new Map();
    return {
        getItem: key => values.has(key) ? values.get(key) : null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: key => values.delete(key)
    };
}

function sourceSnapshot(importId = 'import-test') {
    return createSnapshot({
        competences: [{ id: '2028-01', label: 'Janeiro 2028', exercise: 2028 }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
        appConfig: [{ id: 'global', exercises: ['2028'], closing_competence: '2028-01', settings: {} }],
        schools: [{ id: 's1', designation: '04.99.001', denomination: 'Escola Teste', cre: '4ª CRE' }],
        schoolPrograms: [{ id: 'sp1', school_id: 's1', program_id: 'BASIC', active: true }]
    }, { importId, version: '1', exportedAt: '2026-07-14T12:00:00.000Z' });
}

test('plano valida referências, produz hash e respeita a ordem de dependência', async () => {
    const target = new LocalStorageRepository({ storage: storage(), keyPrefix: 'target' });
    const coordinator = new ImportCoordinator({ targetRepository: target, checkpointStore: createMemoryCheckpointStore() });
    const plan = await coordinator.plan(sourceSnapshot());

    assert.equal(plan.ok, true);
    assert.match(plan.hash, /^[a-f0-9]{64}$/);
    assert.deepEqual(plan.entityOrder.slice(0, 4), ['competences', 'programs', 'appConfig', 'controllers']);
    assert.equal(plan.counts.schools, 1);
    assert.deepEqual(plan.referenceErrors, []);
});

test('interrupção salva checkpoint e retomada não duplica lotes', async () => {
    const target = new LocalStorageRepository({ storage: storage(), keyPrefix: 'target' });
    const checkpoints = createMemoryCheckpointStore();
    const coordinator = new ImportCoordinator({ targetRepository: target, checkpointStore: checkpoints, batchSize: 1 });
    const snapshot = sourceSnapshot('resume-test');

    await assert.rejects(
        coordinator.import(snapshot, { failAfterBatches: 2 }),
        error => error.code === 'IMPORT_INTERRUPTED'
    );
    const interrupted = await checkpoints.load('resume-test');
    assert.equal(interrupted.completedBatches.length, 2);

    const completed = await coordinator.import(snapshot);
    assert.equal(completed.status, 'reconciled');
    assert.equal(completed.resumed, true);
    assert.equal(completed.reconciliation.ok, true);
    assert.equal((await target.load('schools')).length, 1);
});

test('reconciliação divergente bloqueia conclusão e rollback restaura o snapshot anterior', async () => {
    const target = new LocalStorageRepository({ storage: storage(), keyPrefix: 'target' });
    await target.save('schools', [{ id: 'old', designation: 'old', denomination: 'Anterior', cre: '4ª CRE' }]);
    const coordinator = new ImportCoordinator({ targetRepository: target, checkpointStore: createMemoryCheckpointStore() });
    const snapshot = sourceSnapshot('rollback-test');

    const result = await coordinator.import(snapshot);
    assert.equal(result.status, 'reconciled');
    await target.save('schools', [{ id: 'tampered', designation: 'x', denomination: 'Divergente', cre: '4ª CRE' }]);

    await assert.rejects(
        coordinator.reconcile(snapshot),
        error => error.code === 'IMPORT_RECONCILIATION_FAILED'
    );
    const rolledBack = await coordinator.rollback('rollback-test');
    assert.equal(rolledBack.status, 'rolled_back');
    assert.deepEqual(await target.load('schools'), [{ id: 'old', designation: 'old', denomination: 'Anterior', cre: '4ª CRE' }]);
});


test('falha de promoção preserva a causa original quando o rollback remoto não está disponível', async () => {
    const target = new LocalStorageRepository({ storage: storage(), keyPrefix: 'target' });
    target.promoteImportSnapshot = async () => {
        const error = new Error('PROMOTION_FAILED: constraint violation');
        error.code = 'PROMOTION_FAILED';
        throw error;
    };
    target.rollbackImport = async () => {
        const error = new Error('IMPORT_ROLLBACK_UNAVAILABLE: promotion-test');
        error.code = 'IMPORT_ROLLBACK_UNAVAILABLE';
        throw error;
    };
    const coordinator = new ImportCoordinator({
        targetRepository: target,
        checkpointStore: createMemoryCheckpointStore()
    });

    await assert.rejects(
        coordinator.import(sourceSnapshot('promotion-test')),
        error => error.code === 'PROMOTION_FAILED'
            && error.message.includes('constraint violation')
            && error.details?.rollbackCode === 'IMPORT_ROLLBACK_UNAVAILABLE'
    );
});
