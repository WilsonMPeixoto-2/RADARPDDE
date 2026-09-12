'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { DataService } = require('../../src/application/data-service.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function snapshotWithProgram() {
    return createSnapshotEnvelope({
        programs: [{
            id: 'BASIC',
            name: 'PDDE Básico',
            description: '',
            active: true,
            row_version: 1
        }]
    }, {
        importId: 'bootstrap-storage-policy',
        exportedAt: '2026-09-11T21:00:00.000Z'
    });
}

function repositoryFor(remote) {
    const snapshot = snapshotWithProgram();
    return {
        capabilities: () => ({
            mode: remote ? 'supabase' : 'local',
            remote,
            canImportLegacy: !remote
        }),
        load: async () => [],
        save: async (_entity, records) => structuredClone(records),
        remove: async () => ({ removed: 0 }),
        exportSnapshot: async () => structuredClone(snapshot),
        restoreSnapshot: async () => undefined,
        healthCheck: async () => ({ ok: true, mode: remote ? 'supabase' : 'local' })
    };
}

function statePortHarness() {
    const applications = [];
    return {
        applications,
        port: {
            exportCanonical: async () => snapshotWithProgram(),
            applyCanonical: async (snapshot, options) => {
                applications.push({
                    snapshot: structuredClone(snapshot),
                    options: options === undefined ? undefined : structuredClone(options)
                });
                return {};
            }
        }
    };
}

test('bootstrap remoto hidrata somente a memória e não replica o snapshot Supabase no localStorage', async () => {
    const harness = statePortHarness();
    const service = new DataService({
        repository: repositoryFor(true),
        statePort: harness.port
    });

    await service.bootstrap();

    assert.equal(harness.applications.length, 1);
    assert.deepEqual(harness.applications[0].options, {
        persistStorage: false,
        source: 'remote-bootstrap'
    });
});

test('bootstrap local preserva a persistência de compatibilidade existente', async () => {
    const harness = statePortHarness();
    const service = new DataService({
        repository: repositoryFor(false),
        statePort: harness.port
    });

    await service.bootstrap();

    assert.equal(harness.applications.length, 1);
    assert.equal(harness.applications[0].options, undefined);
});
