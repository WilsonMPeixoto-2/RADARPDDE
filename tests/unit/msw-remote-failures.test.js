'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const contract = require('../../src/data/repository-contract.js');
const { DataService } = require('../../src/application/data-service.js');

let server;
let http;
let HttpResponse;
let delay;

const endpoint = 'https://radar.test/rest/v1/rpc/write';

function clone(value) {
    return structuredClone(value);
}

function snapshot(records) {
    return contract.createSnapshotEnvelope({ verifications: clone(records) }, {
        version: '1',
        importId: 'msw-test',
        exportedAt: '2026-08-23T12:00:00.000Z'
    });
}

function createHarness(remoteRecords = [{ id: 'V1', analysis: { extCC: 'before' } }]) {
    let localRecords = clone(remoteRecords);
    let currentRemote = clone(remoteRecords);
    let restoreCount = 0;
    let applyCount = 0;

    const statePort = {
        async capture() { return clone(localRecords); },
        async restore(capture) { localRecords = clone(capture); restoreCount += 1; },
        async exportCanonical() { return snapshot(localRecords); },
        async applyCanonical(next) {
            localRecords = clone(next.entities.verifications || []);
            applyCount += 1;
        }
    };
    const repository = {
        async load(entity) { return entity === 'verifications' ? clone(currentRemote) : []; },
        async save() {},
        async remove() {},
        async exportSnapshot() { return snapshot(currentRemote); },
        async restoreSnapshot(next) { currentRemote = clone(next.entities.verifications || []); },
        async healthCheck() { return { ok: true }; },
        capabilities() { return { remote: true, writable: true }; }
    };
    const service = new DataService({ repository, statePort });

    return {
        service,
        getLocal: () => clone(localRecords),
        setRemote: records => { currentRemote = clone(records); },
        getRestoreCount: () => restoreCount,
        getApplyCount: () => applyCount
    };
}

async function rpc(signal) {
    const response = await fetch(endpoint, { method: 'POST', signal });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const error = new Error(body.message || `HTTP ${response.status}`);
        error.code = body.code || `HTTP_${response.status}`;
        error.status = response.status;
        throw error;
    }
    return response.json();
}

function writeCommand(persist) {
    return {
        name: 'verification:msw-write',
        changedEntities: ['verifications'],
        mutate: () => ({ changed: true }),
        persist
    };
}

test.before(async () => {
    ({ http, HttpResponse, delay } = await import('msw'));
    ({ setupServer: createServer } = await import('msw/node'));
    server = createServer();
    server.listen({ onUnhandledRequest: 'error' });
});

test.afterEach(() => server.resetHandlers());
test.after(() => server.close());

test('500 remoto restaura o estado local e não confirma interface falsa', async () => {
    server.use(http.post(endpoint, () => HttpResponse.json(
        { code: 'REMOTE_FAILURE', message: 'falha simulada' },
        { status: 500 }
    )));
    const harness = createHarness();

    await assert.rejects(
        () => harness.service.execute(writeCommand(async () => {
            const state = harness.getLocal();
            state[0].analysis.extCC = 'mutated';
            return rpc();
        })),
        error => error?.code === 'REMOTE_FAILURE'
            || error?.code === 'TRANSACTION_FAILED'
            || error?.status === 500
    );
    assert.equal(harness.getRestoreCount(), 1);
    assert.equal(harness.getLocal()[0].analysis.extCC, 'before');
});

test('timeout remoto restaura a mutação otimista', async () => {
    server.use(http.post(endpoint, async () => {
        await delay(100);
        return HttpResponse.json({ ok: true });
    }));
    const harness = createHarness();

    await assert.rejects(
        () => harness.service.execute(writeCommand(() => rpc(AbortSignal.timeout(10)))),
        error => Boolean(error)
    );
    assert.equal(harness.getRestoreCount(), 1);
    assert.equal(harness.getLocal()[0].analysis.extCC, 'before');
});

test('conflito de row_version é tratado como falha e preserva o estado anterior', async () => {
    server.use(http.post(endpoint, () => HttpResponse.json(
        { code: 'OPTIMISTIC_CONFLICT', message: 'row_version divergente' },
        { status: 409 }
    )));
    const harness = createHarness();

    await assert.rejects(
        () => harness.service.execute(writeCommand(() => rpc())),
        error => Boolean(error)
    );
    assert.equal(harness.getRestoreCount(), 1);
    assert.equal(harness.getLocal()[0].analysis.extCC, 'before');
});

test('resposta autoritativa incompleta força reconciliação remota antes de estabilizar o estado', async () => {
    server.use(http.post(endpoint, () => HttpResponse.json({})));
    const harness = createHarness();
    harness.setRemote([{ id: 'V1', analysis: { extCC: 'remote-authoritative' } }]);

    const result = await harness.service.execute({
        ...writeCommand(() => rpc()),
        remoteResultIsAuthoritative: true,
        mutate: () => ({ changed: true })
    });

    assert.equal(result.ok, true);
    assert.equal(result.refreshPending, false);
    assert.equal(harness.getApplyCount(), 1);
    assert.equal(harness.getLocal()[0].analysis.extCC, 'remote-authoritative');
});
