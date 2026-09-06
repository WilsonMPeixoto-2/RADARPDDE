'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { DataService } = require('../../src/application/data-service.js');
const { UnitOfWork } = require('../../src/application/unit-of-work.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function createRemoteRepository() {
    let persistCalls = 0;
    const remoteSchools = [{ id: 'school-1', name: 'Escola Atualizada', row_version: 2 }];
    return {
        capabilities: () => ({ mode: 'supabase', remote: true, canImportLegacy: false }),
        load: async entity => entity === 'schools' ? structuredClone(remoteSchools) : [],
        save: async () => [],
        remove: async () => ({ removed: 0 }),
        exportSnapshot: async () => createSnapshotEnvelope({ schools: structuredClone(remoteSchools) }),
        restoreSnapshot: async () => undefined,
        healthCheck: async () => ({ ok: true, mode: 'supabase' }),
        persist: async () => {
            persistCalls += 1;
            return { schools: structuredClone(remoteSchools) };
        },
        getPersistCalls: () => persistCalls
    };
}

function createFailingStatePort() {
    const localSnapshot = createSnapshotEnvelope({
        schools: [{ id: 'school-1', name: 'Escola Antiga', row_version: 1 }]
    }, { importId: 'local-before' });
    return {
        capture: async () => ({ memory: 'before' }),
        restore: async () => undefined,
        exportCanonical: async () => structuredClone(localSnapshot),
        applyCanonical: async () => {
            throw new Error('Falha local sem código');
        }
    };
}

test('commit remoto confirmado com falha local sem code retorna sincronização pendente sem repetir a escrita', async () => {
    const repository = createRemoteRepository();
    const statePort = createFailingStatePort();
    const service = new DataService({
        repository,
        statePort,
        unitOfWork: new UnitOfWork({ statePort })
    });

    const result = await service.execute({
        name: 'invoice:save',
        changedEntities: ['schools'],
        remoteResultIsAuthoritative: true,
        mutate: () => ({ saved: true }),
        persist: async () => repository.persist()
    });

    assert.equal(result.ok, true);
    assert.equal(repository.getPersistCalls(), 1, 'a escrita remota não pode ser repetida');
    assert.equal(result.refreshPending, true);
    assert.equal(result.stateApplyErrorCode, 'LOCAL_STATE_APPLY_FAILED');
    assert.equal(result.stateSync?.status, 'failed');
    assert.equal(result.stateSync?.remoteCommitConfirmed, true);
    assert.equal(result.stateSync?.localStateApplied, false);
    assert.equal(result.stateSync?.refreshRequired, true);
});
