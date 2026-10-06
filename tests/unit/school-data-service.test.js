'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { DataService } = require('../../src/application/data-service.js');
const { createStatePort } = require('../../src/application/state-port.js');
const bridge = require('../../src/data/state-bridge-metadata.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');
const { collections, envelope, emptyCollections } = require('../fixtures/school-operational-context.js');

function deferred() { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; }
const request = { shouldApply: () => true };

function harness() {
    const entities = Object.fromEntries(Object.keys(collections()).map(entity => [entity, [...collections()[entity], ...collections('T')[entity]]]));
    let memory = bridge.canonicalEntitiesToLegacyState(entities);
    const calls = [], patches = [];
    const storage = { length: 0, key: () => null, getItem: () => null, setItem() { throw new Error('Sem cache'); }, removeItem() {} };
    const port = createStatePort({ storage, readMemory: () => memory, writeMemory(next) { memory = next; },
        patchMemory(patch) { patches.push('global'); memory = { ...memory, ...patch }; },
        patchSchoolMemory(patch) { patches.push('school'); memory = { ...memory, ...patch }; } });
    const repository = {
        capabilities: () => ({ remote: true, schoolOperationalContext: true }),
        load: async () => [], save: async () => [], remove: async () => {},
        exportSnapshot: async () => createSnapshotEnvelope({}), restoreSnapshot: async () => {}, healthCheck: async () => ({}),
        async queryOperationalContext(options) { calls.push(['global', options]); return { competenceId: options.competenceId, entities }; },
        async querySchoolOperationalContext(options) { calls.push(['school', options]); return envelope(emptyCollections(), options); }
    };
    const service = new DataService({ repository, statePort: port });
    return { service, port, repository, entities, calls, patches, get memory() { return memory; } };
}

async function warmed() {
    const h = harness();
    await h.service.loadSchoolOperationalContext('S', '2026-08', request);
    h.calls.length = 0; h.patches.length = 0;
    return h;
}

test('primeira fatia estabelece cobertura global; segunda substitui só S sem leitura escondida', async () => {
    const h = harness();
    const first = await h.service.loadSchoolOperationalContext('S', '2026-08', request);
    assert.equal(first.fallback, true);
    assert.deepEqual(h.calls.map(call => call[0]), ['global']);
    const foreign = h.memory.pendencies.find(row => row.escolaId === 'T');
    const next = await h.service.loadSchoolOperationalContext('S', '2026-08', request);
    assert.equal(next.stale, false);
    assert.equal(next.fallback, false);
    assert.deepEqual(h.calls.map(call => call[0]), ['global', 'school']);
    assert.deepEqual(h.patches, ['global', 'school']);
    assert.equal(h.memory.pendencies.includes(foreign), true);
    assert.equal(h.memory.pendencies.some(row => row.escolaId === 'S'), false);
});

test('envelope incompleto com arrays parciais executa fallback global sem patch escolar', async () => {
    const h = await warmed();
    h.repository.querySchoolOperationalContext = async options => {
        h.calls.push(['school', options]);
        return envelope(emptyCollections(), { coverage: { ...envelope().coverage, complete: false } });
    };
    const result = await h.service.loadSchoolOperationalContext('S', '2026-08', request);
    assert.equal(result.fallback, true);
    assert.deepEqual(h.calls.map(call => call[0]), ['school', 'global']);
    assert.deepEqual(h.patches, ['global']);
    assert.equal(h.memory.pendencies.length, 2);
});

test('leitura global nova aborta a escolar anterior; resposta atrasada não apaga novo estado', async () => {
    const h = await warmed(), started = deferred(), response = deferred();
    let signal;
    h.repository.querySchoolOperationalContext = async options => { signal = options.signal; started.resolve(); return response.promise; };
    const old = h.service.loadSchoolOperationalContext('S', '2026-08', request);
    await started.promise;
    await h.service.loadOperationalContext('2026-09');
    response.resolve(envelope(emptyCollections()));
    assert.equal((await old).stale, true);
    assert.equal(signal.aborted, true);
    assert.equal(h.service.currentOperationalCompetence, '2026-09');
    assert.deepEqual(h.patches, ['global']);
});

test('troca de escola/geração rejeita fatia e também rejeita fallback atrasado', async () => {
    for (const incomplete of [false, true]) {
        const h = await warmed(), started = deferred(), response = deferred();
        let routeCurrent = true;
        h.repository.querySchoolOperationalContext = async () => { started.resolve(); return response.promise; };
        const pending = h.service.loadSchoolOperationalContext('S', '2026-08', { shouldApply: () => routeCurrent });
        await started.promise; routeCurrent = false;
        response.resolve(envelope(emptyCollections(), incomplete ? { coverage: { ...envelope().coverage, complete: false } } : {}));
        assert.equal((await pending).stale, true);
        assert.equal(h.patches.length, 0);
        assert.equal(h.calls.length, 0);
    }
});

test('intenção de escrita aborta leitura; próximo read aguarda escrita e restabelece cobertura global', async () => {
    const h = await warmed(), readStarted = deferred(), response = deferred(), writeStarted = deferred(), writeDone = deferred();
    h.repository.querySchoolOperationalContext = async () => { readStarted.resolve(); return response.promise; };
    const old = h.service.loadSchoolOperationalContext('S', '2026-08', request);
    await readStarted.promise;
    h.service.unitOfWork = { run: async () => { writeStarted.resolve(); await writeDone.promise;
        return { snapshot: createSnapshotEnvelope(h.entities), persisted: { verification: h.entities.verifications }, remoteCommitConfirmed: true }; } };
    const write = h.service.execute({ name: 'test-write', changedEntities: ['verifications'],
        remoteResultIsAuthoritative: true, mutate() {}, persist() {} });
    await writeStarted.promise;
    const next = h.service.loadSchoolOperationalContext('S', '2026-08', request);
    response.resolve(envelope(emptyCollections()));
    assert.equal((await old).stale, true);
    assert.equal(h.calls.length, 0);
    writeDone.resolve(); await write;
    const result = await next;
    assert.equal(result.fallback, true);
    assert.deepEqual(h.calls.map(call => call[0]), ['global']);
    assert.equal(h.memory.pendencies.length, 2);
});

test('mudança de competência ou históricos exige contexto global antes de aceitar fatia', async () => {
    for (const [competenceId, historyStatuses] of [['2026-09', []], ['2026-08', ['Resolvida', 'Cancelada']]]) {
        const h = await warmed();
        const result = await h.service.loadSchoolOperationalContext('S', competenceId, { ...request, historyStatuses });
        assert.equal(result.fallback, true);
        assert.deepEqual(h.calls.map(call => call[0]), ['global']);
        assert.deepEqual([...h.service.currentHistoricalStatuses].sort(), historyStatuses.sort());
    }
});

test('falha de rede ou envelope inválido não vira aplicação parcial nem fallback silencioso', async () => {
    for (const invalid of [false, true]) {
        const h = await warmed();
        h.repository.querySchoolOperationalContext = async () => {
            if (invalid) return envelope({ ...collections(), assets: null });
            throw new Error('timeout');
        };
        await assert.rejects(h.service.loadSchoolOperationalContext('S', '2026-08', request));
        assert.equal(h.patches.length, 0);
        assert.equal(h.calls.length, 0);
        assert.equal(h.memory.pendencies.length, 2);
    }
});

test('metadados da leitura global antiga não vencem geração aplicada mais nova', async () => {
    const h = await warmed(), started = deferred(), finish = deferred();
    const original = h.service.applyRemoteState.bind(h.service);
    let count = 0;
    h.service.applyRemoteState = async (...args) => {
        const result = await original(...args);
        if (++count === 1) { started.resolve(); await finish.promise; }
        return result;
    };
    const old = h.service.loadOperationalContext('2026-08');
    await started.promise;
    await h.service.loadOperationalContext('2026-09');
    finish.resolve();
    assert.equal((await old).stale, true);
    assert.equal(h.service.currentOperationalCompetence, '2026-09');
});

test('duas fatias usam a mesma autoridade de leitura e cobertura é atualizada após cada aceite', async () => {
    const h = await warmed(), started = deferred(), response = deferred();
    let count = 0;
    h.repository.querySchoolOperationalContext = async options => {
        if (++count === 1) { started.resolve(); return response.promise; }
        return envelope(collections('T'), options);
    };
    const old = h.service.loadSchoolOperationalContext('S', '2026-08', request);
    await started.promise;
    assert.equal((await h.service.loadSchoolOperationalContext('T', '2026-08', request)).stale, false);
    response.resolve(envelope(emptyCollections()));
    assert.equal((await old).stale, true);
    assert.equal(h.memory.pendencies.some(row => row.escolaId === 'S'), true);
    assert.equal(h.memory.pendencies.some(row => row.escolaId === 'T'), true);
    assert.deepEqual(h.patches, ['school']);
});
