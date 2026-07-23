'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { DataService } = require('../../src/application/data-service.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function snapshot(entities) {
    return createSnapshotEnvelope(entities, {
        version: '1', importId: 'remote-state-authority', exportedAt: '2026-07-22T22:00:00.000Z'
    });
}

function clone(value) { return structuredClone(value); }

test('modo remoto adia commit local e aplica o retorno versionado do banco sem gravar snapshot autoritativo no cache', async () => {
    const beforeVerification = {
        id: '04.10.001::2026-05::BASIC', school_id: '04.10.001', competence_id: '2026-05',
        program_id: 'BASIC', bonification: { extCC: '' }, analysis: {}, payload: {}, row_version: 1
    };
    let current = snapshot({ verifications: [beforeVerification], administrativeLogs: [] });
    let persisted = false;
    let commitCalls = 0;
    const applyCalls = [];

    const databaseVerification = {
        ...beforeVerification,
        bonification: { extCC: 'Sim' },
        row_version: 2
    };
    const databaseLog = {
        id: 'log-remote-1', school_id: '04.10.001', action: 'Bonificação Alterada',
        user_identifier: 'controlador', profile_name: 'Controlador', details: {},
        event_at: '2026-07-22T22:01:00.000Z'
    };

    const repository = {
        capabilities: () => ({ mode: 'supabase', remote: true, writable: true }),
        load: async entity => {
            if (persisted) throw new Error(`refresh unavailable for ${entity}`);
            return entity === 'verifications' ? [clone(beforeVerification)] : [];
        },
        save: async () => [],
        remove: async () => ({ removedId: null }),
        exportSnapshot: async () => snapshot({ verifications: [clone(beforeVerification)], administrativeLogs: [] }),
        restoreSnapshot: async () => undefined,
        healthCheck: async () => ({ ok: true })
    };
    const statePort = {
        capture: async () => clone(current),
        exportCanonical: async () => clone(current),
        commitCurrent: () => { commitCalls += 1; },
        applyCanonical: async (next, options) => {
            current = clone(next);
            applyCalls.push(clone(options || {}));
        },
        restore: async captured => { current = clone(captured); }
    };
    const service = new DataService({ repository, statePort });

    const result = await service.execute({
        name: 'verification:set-bonification',
        changedEntities: ['verifications', 'administrativeLogs'],
        mutate: () => {
            current.entities.verifications[0].bonification.extCC = 'Sim';
            return { verificationId: beforeVerification.id };
        },
        persist: async () => {
            persisted = true;
            return { verification: clone(databaseVerification), administrative_log: clone(databaseLog) };
        }
    });

    assert.equal(commitCalls, 0);
    assert.equal(current.entities.verifications[0].row_version, 2);
    assert.equal(current.entities.administrativeLogs[0].id, 'log-remote-1');
    assert.ok(applyCalls.length >= 1);
    assert.equal(applyCalls.every(call => call.persistStorage === false), true);
    assert.equal(result.refreshPending, true);
    assert.equal(result.persisted.verification.row_version, 2);
});

test('StatePort aplica retorno remoto apenas em memória quando persistStorage é false', async () => {
    const { createStatePort } = require('../../src/application/state-port.js');
    let setItemCalls = 0;
    let memory = { schools: [] };
    const restoreCalls = [];
    const storage = {
        length: 0,
        key: () => null,
        getItem: () => null,
        setItem: () => { setItemCalls += 1; },
        removeItem: () => undefined
    };
    const bridge = {
        LEGACY_STORAGE_MAP: {},
        BRIDGE_METADATA_STORAGE_KEY: 'radar_pdde_bridge_metadata',
        exportLegacySnapshot: () => ({ snapshot: snapshot({}) }),
        restoreCanonicalSnapshotToLegacyStorage: (next, _storage, options) => {
            restoreCalls.push(clone(options));
            return { state: { schools: clone(next.entities.schools || []) } };
        }
    };
    const port = createStatePort({
        storage,
        bridge,
        readMemory: () => memory,
        writeMemory: next => { memory = clone(next); }
    });
    const next = snapshot({ schools: [{ id: '04.10.001', row_version: 3 }] });

    await port.applyCanonical(next, { persistStorage: false });

    assert.equal(setItemCalls, 0);
    assert.equal(restoreCalls.length, 1);
    assert.equal(restoreCalls[0].dryRun, true);
    assert.equal(memory.schools[0].row_version, 3);
});
