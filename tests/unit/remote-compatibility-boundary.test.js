'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { DataService } = require('../../src/application/data-service.js');
const { RepositoryError, createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function emptySnapshot() {
    return createSnapshotEnvelope({}, {
        version: '1',
        importId: 'remote-compatibility-boundary',
        exportedAt: '2026-09-13T03:20:00.000Z'
    });
}

function createHarness() {
    let commitCurrentCalls = 0;
    let exportSnapshotCalls = 0;
    const statePort = {
        captureSync: () => ({ memory: {}, storage: {} }),
        exportCanonicalSync: () => emptySnapshot(),
        commitCurrent: () => {
            commitCurrentCalls += 1;
        },
        restoreSync: () => undefined,
        capture: async () => ({ memory: {}, storage: {} }),
        exportCanonical: async () => emptySnapshot(),
        applyCanonical: async () => undefined,
        restore: async () => undefined
    };
    const repository = {
        capabilities: () => ({ mode: 'supabase', remote: true, writable: true }),
        load: async () => [],
        save: async () => [],
        remove: async () => ({ removed: 0 }),
        exportSnapshot: async () => {
            exportSnapshotCalls += 1;
            return emptySnapshot();
        },
        restoreSnapshot: async () => undefined,
        healthCheck: async () => ({ ok: true, mode: 'supabase' })
    };
    return {
        service: new DataService({ repository, statePort }),
        getCommitCurrentCalls: () => commitCurrentCalls,
        getExportSnapshotCalls: () => exportSnapshotCalls
    };
}

test('stageCompatibility remoto nunca grava coleções operacionais no armazenamento do navegador', () => {
    const harness = createHarness();

    const staged = harness.service.stageCompatibility({
        changedEntities: ['administrativeLogs'],
        name: 'legacy-export-log'
    });

    assert.equal(staged.changedEntities[0], 'administrativeLogs');
    assert.equal(harness.getCommitCurrentCalls(), 0);
});

test('persistSnapshot remoto rejeita o caminho legado antes de reler ou restaurar o banco inteiro', async () => {
    const harness = createHarness();

    await assert.rejects(
        harness.service.persistSnapshot(emptySnapshot(), ['administrativeLogs'], {
            name: 'legacy-export-log'
        }),
        error => error instanceof RepositoryError
            && error.code === 'REMOTE_SNAPSHOT_PERSISTENCE_FORBIDDEN'
    );

    assert.equal(harness.getExportSnapshotCalls(), 0);
});
