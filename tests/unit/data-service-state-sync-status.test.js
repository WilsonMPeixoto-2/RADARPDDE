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

test('falha local transitória é reconciliada por leitura segura sem repetir a escrita remota', async () => {
    const repository = createRemoteRepository();
    const localSnapshot = createSnapshotEnvelope({
        schools: [{ id: 'school-1', name: 'Escola Antiga', row_version: 1 }]
    }, { importId: 'local-before' });
    let applyCalls = 0;
    const statePort = {
        capture: async () => ({ memory: 'before' }),
        restore: async () => undefined,
        exportCanonical: async () => structuredClone(localSnapshot),
        applyCanonical: async () => {
            applyCalls += 1;
            if (applyCalls === 1) throw new Error('Falha transitória local');
        }
    };
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

    assert.equal(repository.getPersistCalls(), 1);
    assert.equal(applyCalls, 2, 'deve tentar apenas uma leitura/aplicação corretiva');
    assert.equal(result.refreshPending, false);
    assert.equal(result.stateApplyErrorCode, null);
    assert.equal(result.stateSync?.status, 'applied');
    assert.equal(result.stateSync?.remoteCommitConfirmed, true);
    assert.equal(result.stateSync?.localStateApplied, true);
    assert.equal(result.stateSync?.refreshRequired, false);
});

test('falha somente na releitura remota mantém aplicação local distinta de erro de StatePort', async () => {
    const localSnapshot = createSnapshotEnvelope({
        schools: [{ id: 'school-1', name: 'Escola Antiga', row_version: 1 }]
    }, { importId: 'local-before' });
    const persistedSchools = [{ id: 'school-1', name: 'Escola Atualizada', row_version: 2 }];
    let persistCalls = 0;
    let loadCalls = 0;
    let applyCalls = 0;
    const repository = {
        capabilities: () => ({ mode: 'supabase', remote: true, canImportLegacy: false }),
        load: async () => {
            loadCalls += 1;
            throw new Error('Falha sintética de leitura remota');
        },
        save: async () => [],
        remove: async () => ({ removed: 0 }),
        exportSnapshot: async () => structuredClone(localSnapshot),
        restoreSnapshot: async () => undefined,
        healthCheck: async () => ({ ok: true, mode: 'supabase' })
    };
    const statePort = {
        capture: async () => ({ memory: 'before' }),
        restore: async () => undefined,
        exportCanonical: async () => structuredClone(localSnapshot),
        applyCanonical: async () => {
            applyCalls += 1;
        }
    };
    const service = new DataService({
        repository,
        statePort,
        unitOfWork: new UnitOfWork({ statePort })
    });

    const result = await service.execute({
        name: 'probe:non-authoritative',
        changedEntities: ['schools'],
        mutate: () => ({ saved: true }),
        persist: async () => {
            persistCalls += 1;
            return { schools: structuredClone(persistedSchools) };
        }
    });

    assert.equal(persistCalls, 1, 'a escrita confirmada não pode ser repetida por falha da releitura');
    assert.equal(loadCalls, 1, 'deve haver uma única tentativa corretiva de leitura');
    assert.equal(applyCalls, 1, 'o retorno persistido foi aplicado antes da releitura falhar');
    assert.equal(result.refreshPending, true);
    assert.equal(result.stateApplyErrorCode, null, 'falha de rede não pode ser rotulada como falha local');
    assert.equal(result.stateSync?.status, 'pending');
    assert.equal(result.stateSync?.remoteCommitConfirmed, true);
    assert.equal(result.stateSync?.localStateApplied, true);
    assert.equal(result.stateSync?.refreshRequired, true);
});
