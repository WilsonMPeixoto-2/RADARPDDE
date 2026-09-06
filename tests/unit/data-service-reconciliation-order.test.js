'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { DataService } = require('../../src/application/data-service.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

const clone = structuredClone;

function remoteRepository(overrides = {}) {
    return {
        capabilities: () => ({ mode: 'supabase', remote: true, canImportLegacy: false }),
        load: async () => [],
        save: async () => [],
        remove: async () => ({ removed: 0 }),
        exportSnapshot: async () => createSnapshotEnvelope({}),
        restoreSnapshot: async () => undefined,
        healthCheck: async () => ({ ok: true, mode: 'supabase' }),
        ...overrides
    };
}

test('releitura corretiva de A não pode ultrapassar e sobrescrever a escrita B', async () => {
    let local = createSnapshotEnvelope({ schools: [
        { id: 's1', name: 'old A', row_version: 1 },
        { id: 's2', name: 'old B', row_version: 1 }
    ] });
    let remote = clone(local.entities.schools);
    let releaseRead;
    let signalRead;
    const readStarted = new Promise(resolve => { signalRead = resolve; });
    let firstApply = true;
    let writes = 0;

    const statePort = {
        capture: async () => clone(local),
        restore: async value => { local = clone(value); },
        exportCanonical: async () => clone(local),
        applyCanonical: async value => {
            if (firstApply) {
                firstApply = false;
                throw new Error('falha local inicial');
            }
            local = clone(value);
        }
    };
    const repository = remoteRepository({
        load: async () => {
            const captured = clone(remote);
            signalRead();
            await new Promise(resolve => { releaseRead = resolve; });
            return captured;
        },
        exportSnapshot: async () => createSnapshotEnvelope({ schools: clone(remote) })
    });
    const service = new DataService({ repository, statePort });
    const command = (id, name) => ({
        name: `test:${id}`,
        changedEntities: ['schools'],
        remoteResultIsAuthoritative: true,
        mutate: () => {
            local.entities.schools.find(row => row.id === id).name = name;
            return { id };
        },
        persist: async () => {
            writes += 1;
            const row = remote.find(item => item.id === id);
            row.name = name;
            row.row_version += 1;
            return { schools: [clone(row)] };
        }
    });

    const promiseA = service.execute(command('s1', 'new A'));
    await readStarted;

    let bSettled = false;
    const promiseB = service.execute(command('s2', 'new B')).finally(() => {
        bSettled = true;
    });
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(
        bSettled,
        false,
        'a escrita B deve aguardar a reconciliação local da escrita A na mesma instância'
    );

    releaseRead();
    const [resultA, resultB] = await Promise.all([promiseA, promiseB]);

    assert.equal(writes, 2, 'cada intenção deve persistir exatamente uma vez');
    assert.equal(local.entities.schools.find(row => row.id === 's1').name, 'new A');
    assert.equal(local.entities.schools.find(row => row.id === 's2').name, 'new B');
    assert.equal(remote.find(row => row.id === 's2').name, 'new B');
    assert.equal(resultA.stateSync.status, 'applied');
    assert.equal(resultB.stateSync.status, 'applied');
});

test('falha da aplicação local dentro do refresh permanece classificada como falha local', async () => {
    const localSnapshot = createSnapshotEnvelope({
        schools: [{ id: 'school-1', name: 'Escola Antiga', row_version: 1 }]
    });
    const remoteSchools = [{ id: 'school-1', name: 'Escola Atualizada', row_version: 2 }];
    let applyCalls = 0;
    let persistCalls = 0;
    let loadCalls = 0;

    const statePort = {
        capture: async () => clone(localSnapshot),
        restore: async () => undefined,
        exportCanonical: async () => clone(localSnapshot),
        applyCanonical: async () => {
            applyCalls += 1;
            if (applyCalls === 2) throw new Error('falha local durante refresh');
        }
    };
    const repository = remoteRepository({
        load: async entity => {
            loadCalls += 1;
            return entity === 'schools' ? clone(remoteSchools) : [];
        },
        exportSnapshot: async () => createSnapshotEnvelope({ schools: clone(remoteSchools) })
    });
    const service = new DataService({ repository, statePort });

    const result = await service.execute({
        name: 'invoice:save',
        changedEntities: ['schools'],
        mutate: () => ({ saved: true }),
        persist: async () => {
            persistCalls += 1;
            return { schools: clone(remoteSchools) };
        }
    });

    assert.equal(persistCalls, 1, 'a escrita remota não pode ser repetida');
    assert.equal(loadCalls, 1, 'deve haver somente a releitura necessária');
    assert.equal(applyCalls, 2);
    assert.equal(result.ok, true);
    assert.equal(result.refreshPending, true);
    assert.equal(result.stateApplyErrorCode, 'LOCAL_STATE_APPLY_FAILED');
    assert.equal(result.stateSync.status, 'failed');
    assert.equal(result.stateSync.remoteCommitConfirmed, true);
    assert.equal(result.stateSync.localStateApplied, false);
    assert.equal(result.stateSync.refreshRequired, true);
});
