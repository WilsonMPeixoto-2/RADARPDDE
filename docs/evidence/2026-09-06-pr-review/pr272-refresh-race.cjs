// Audit-only: deterministic post-commit reconciliation race. No database/network.
const path = require('node:path');
const assert = require('node:assert/strict');
const repo = path.resolve(process.argv[2]);
const { DataService } = require(path.join(repo, 'src/application/data-service.js'));
const { createSnapshotEnvelope } = require(path.join(repo, 'src/data/repository-contract.js'));
const clone = structuredClone;
(async () => {
    let local = createSnapshotEnvelope({ schools: [
        { id: 's1', name: 'old A', row_version: 1 }, { id: 's2', name: 'old B', row_version: 1 }
    ] });
    let remote = clone(local.entities.schools);
    let releaseRead, signalRead;
    const readStarted = new Promise(resolve => { signalRead = resolve; });
    let firstApply = true;
    let writes = 0;
    const events = [];
    const statePort = { capture: async () => clone(local),
        restore: async value => { local = clone(value); },
        exportCanonical: async () => clone(local),
        applyCanonical: async (value, options) => {
            if (firstApply) { firstApply = false; events.push('A first apply fails'); throw new Error('local apply'); }
            local = clone(value); events.push(`apply ${options.source}`);
        } };
    const repository = { capabilities: () => ({ mode: 'supabase', remote: true }),
        load: async () => {
            const captured = clone(remote);
            events.push('A refresh response captured before B commit'); signalRead();
            await new Promise(resolve => { releaseRead = resolve; });
            return captured;
        }, save: async () => [], remove: async () => ({}),
        exportSnapshot: async () => createSnapshotEnvelope({ schools: clone(remote) }),
        restoreSnapshot: async () => {}, healthCheck: async () => ({ ok: true }) };
    const ds = new DataService({ repository, statePort });
    const command = (id, name) => ({ name: `audit:${id}`, changedEntities: ['schools'],
        remoteResultIsAuthoritative: true,
        mutate: () => { local.entities.schools.find(row => row.id === id).name = name; return {}; },
        persist: async () => {
            writes++;
            const row = remote.find(row => row.id === id);
            row.name = name; row.row_version++;
            events.push(`${id} remote commit`);
            return { schools: [clone(row)] };
        } });
    const promiseA = ds.execute(command('s1', 'new A'));
    await readStarted;
    const resultB = await ds.execute(command('s2', 'new B'));
    const afterB = clone(local.entities.schools);
    releaseRead();
    const resultA = await promiseA;
    assert.equal(writes, 2);
    assert.equal(afterB.find(row => row.id === 's2').name, 'new B');
    assert.equal(local.entities.schools.find(row => row.id === 's2').name, 'old B');
    assert.equal(remote.find(row => row.id === 's2').name, 'new B');
    assert.equal(resultA.stateSync.status, 'applied');
    assert.equal(resultB.stateSync.status, 'applied');
    console.log(JSON.stringify({ events, writes, afterB, finalLocal: local.entities.schools,
        remote, stateSyncA: resultA.stateSync, stateSyncB: resultB.stateSync }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
