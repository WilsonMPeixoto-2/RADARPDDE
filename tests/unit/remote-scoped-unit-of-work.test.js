'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { UnitOfWork } = require('../../src/application/unit-of-work.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function clone(value) {
    return structuredClone(value);
}

function snapshot(entities) {
    return createSnapshotEnvelope(entities, {
        version: '1',
        importId: 'scoped-unit-of-work',
        exportedAt: '2026-09-13T04:00:00.000Z'
    });
}

test('gravação remota usa captura e exportação somente das entidades alteradas', async () => {
    const state = {
        verifications: [{
            id: '04.31.001::2026-09::BASIC',
            school_id: '04.31.001',
            competence_id: '2026-09',
            program_id: 'BASIC',
            bonification: {},
            analysis: {},
            bonus_result: null,
            payload: {}
        }],
        administrativeLogs: [],
        pendencyContacts: Array.from({ length: 25000 }, (_, index) => ({
            id: `contact-${index}`,
            school_id: '04.31.001',
            contact_date: '2026-09-01'
        }))
    };
    let fullCaptureCalls = 0;
    let fullExportCalls = 0;
    let scopedCaptureCalls = 0;
    let scopedExportCalls = 0;
    let restoreEntityCalls = 0;

    const statePort = {
        capture: async () => {
            fullCaptureCalls += 1;
            return clone(state);
        },
        exportCanonical: async () => {
            fullExportCalls += 1;
            return snapshot(clone(state));
        },
        applyCanonical: async () => undefined,
        restore: async () => undefined,
        captureEntities: async entities => {
            scopedCaptureCalls += 1;
            return Object.fromEntries(entities.map(entity => [entity, clone(state[entity] || [])]));
        },
        exportCanonicalEntities: async entities => {
            scopedExportCalls += 1;
            return snapshot(Object.fromEntries(
                entities.map(entity => [entity, clone(state[entity] || [])])
            ));
        },
        restoreEntities: async capture => {
            restoreEntityCalls += 1;
            Object.entries(capture || {}).forEach(([entity, records]) => {
                state[entity] = clone(records);
            });
        }
    };

    const unitOfWork = new UnitOfWork({ statePort });
    const result = await unitOfWork.run({
        name: 'verification:scoped-remote-write',
        changedEntities: ['verifications', 'administrativeLogs'],
        remotePersistence: true,
        deferLocalCommit: true,
        mutate: () => {
            state.verifications[0].bonus_result = 'Apto';
            state.administrativeLogs.push({
                id: 'log-1',
                school_id: '04.31.001',
                action: 'Avaliação atualizada',
                details: {},
                event_at: '2026-09-13T04:00:00.000Z'
            });
            return { ok: true };
        },
        persist: async ({ snapshot: next }) => {
            assert.deepEqual(
                Object.keys(next.entities).sort(),
                ['administrativeLogs', 'verifications']
            );
            assert.equal(next.entities.verifications[0].bonus_result, 'Apto');
            assert.equal(next.entities.administrativeLogs.length, 1);
            assert.equal(next.entities.pendencyContacts, undefined);
            return { remoteCommitConfirmed: true };
        }
    });

    assert.equal(result.remoteCommitConfirmed, true);
    assert.equal(fullCaptureCalls, 0, 'estado remoto não deve clonar toda a memória para rollback');
    assert.equal(fullExportCalls, 0, 'estado remoto não deve exportar snapshot global');
    assert.equal(scopedCaptureCalls, 1);
    assert.equal(scopedExportCalls, 1);
    assert.equal(restoreEntityCalls, 0);
});

test('falha antes do commit remoto restaura somente as entidades capturadas', async () => {
    const state = {
        verifications: [{ id: 'v1', bonus_result: '' }],
        pendencyContacts: Array.from({ length: 1000 }, (_, index) => ({ id: `c-${index}` }))
    };
    let restored = null;
    const statePort = {
        capture: async () => {
            throw new Error('captura global não deve ser usada');
        },
        exportCanonical: async () => {
            throw new Error('exportação global não deve ser usada');
        },
        applyCanonical: async () => undefined,
        restore: async () => {
            throw new Error('restore global não deve ser usado');
        },
        captureEntities: async entities => Object.fromEntries(
            entities.map(entity => [entity, clone(state[entity] || [])])
        ),
        exportCanonicalEntities: async entities => snapshot(Object.fromEntries(
            entities.map(entity => [entity, clone(state[entity] || [])])
        )),
        restoreEntities: async capture => {
            restored = clone(capture);
            Object.entries(capture || {}).forEach(([entity, records]) => {
                state[entity] = clone(records);
            });
        }
    };
    const unitOfWork = new UnitOfWork({ statePort });

    await assert.rejects(
        unitOfWork.run({
            name: 'verification:scoped-rollback',
            changedEntities: ['verifications'],
            remotePersistence: true,
            deferLocalCommit: true,
            mutate: () => {
                state.verifications[0].bonus_result = 'Alterado';
                throw new Error('falha induzida');
            },
            persist: async () => undefined
        }),
        /falha induzida/
    );

    assert.deepEqual(restored, { verifications: [{ id: 'v1', bonus_result: '' }] });
    assert.equal(state.verifications[0].bonus_result, '');
    assert.equal(state.pendencyContacts.length, 1000);
});
