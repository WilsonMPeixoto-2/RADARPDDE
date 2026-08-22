'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { DataService } = require('../../src/application/data-service.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function snapshot() {
    return createSnapshotEnvelope({
        registeredInvoices: [],
        administrativeLogs: []
    }, {
        version: '1',
        importId: 'refresh-exemption-contract',
        exportedAt: '2026-08-22T03:00:00.000Z'
    });
}

function service() {
    const current = snapshot();
    return new DataService({
        repository: {
            capabilities: () => ({ mode: 'supabase', remote: true }),
            load: async () => [],
            exportSnapshot: async () => structuredClone(current),
            save: async () => [],
            remove: async () => ({ removedId: null }),
            restoreSnapshot: async () => undefined,
            healthCheck: async () => ({ ok: true, mode: 'supabase' })
        },
        statePort: {
            capture: async () => ({ memory: structuredClone(current), storage: {} }),
            exportCanonical: async () => structuredClone(current),
            applyCanonical: async () => undefined,
            restore: async () => undefined
        }
    });
}

test('somente histórico administrativo append-only pode ser dispensado do refresh remoto', async () => {
    await assert.rejects(
        service().execute({
            name: 'unsafe-refresh-exemption',
            changedEntities: ['registeredInvoices', 'administrativeLogs'],
            remoteRefreshExemptEntities: ['registeredInvoices'],
            mutate: () => ({ ok: true }),
            persist: async () => ({})
        }),
        error => error.code === 'VALIDATION_FAILED'
            && /remoteRefreshExemptEntities/.test(error.message)
    );
});
