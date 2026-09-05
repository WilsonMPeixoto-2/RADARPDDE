'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { UnitOfWork } = require('../../src/application/unit-of-work.js');

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createMemoryStatePort() {
    let state = { successfulWrite: null, failingWrite: null };
    return {
        capture: async () => structuredClone(state),
        exportCanonical: async () => ({
            version: '1',
            importId: 'uow-concurrency',
            exportedAt: '2026-09-05T12:00:00.000Z',
            entities: { appConfig: [structuredClone(state)] }
        }),
        applyCanonical: async snapshot => {
            state = structuredClone(snapshot.entities.appConfig[0]);
        },
        commitCurrent: snapshot => {
            state = structuredClone(snapshot.entities.appConfig[0]);
        },
        restore: async capture => {
            state = structuredClone(capture);
        },
        read: () => structuredClone(state),
        mutate: patch => {
            state = { ...state, ...patch };
        }
    };
}

test('rollback de operação concorrente não pode apagar operação posterior já confirmada no mesmo UnitOfWork', async () => {
    const statePort = createMemoryStatePort();
    const uow = new UnitOfWork({ statePort });
    const order = [];

    const failing = uow.run({
        name: 'falha-lenta',
        changedEntities: ['appConfig'],
        mutate: () => {
            order.push('failing-mutate');
            statePort.mutate({ failingWrite: 'temporária' });
            return { kind: 'failing' };
        },
        persist: async () => {
            await delay(35);
            order.push('failing-reject');
            throw new Error('falha induzida');
        }
    });

    await delay(5);
    const successful = uow.run({
        name: 'sucesso-rápido',
        changedEntities: ['appConfig'],
        mutate: () => {
            order.push('successful-mutate');
            statePort.mutate({ successfulWrite: 'confirmada' });
            return { kind: 'successful' };
        },
        persist: async () => {
            order.push('successful-persist');
            return { ok: true };
        }
    });

    await assert.rejects(failing, /falha induzida/);
    await successful;

    assert.equal(statePort.read().successfulWrite, 'confirmada');
    assert.equal(statePort.read().failingWrite, null);
    assert.deepEqual(order, [
        'failing-mutate',
        'failing-reject',
        'successful-mutate',
        'successful-persist'
    ]);
});

test('falha na captura libera a fila para a próxima execução', async () => {
    const statePort = createMemoryStatePort();
    const originalCapture = statePort.capture;
    let captureCalls = 0;
    statePort.capture = async () => {
        captureCalls += 1;
        if (captureCalls === 1) throw new Error('falha de captura induzida');
        return originalCapture();
    };
    const uow = new UnitOfWork({ statePort });

    await assert.rejects(
        uow.run({
            name: 'captura-falha',
            changedEntities: ['appConfig'],
            mutate: () => ({ ok: false }),
            persist: async () => ({ ok: false })
        }),
        /falha de captura induzida/
    );

    const result = await uow.run({
        name: 'apos-captura-falha',
        changedEntities: ['appConfig'],
        mutate: () => {
            statePort.mutate({ successfulWrite: 'confirmada' });
            return { ok: true };
        },
        persist: async () => ({ ok: true })
    });

    assert.equal(result.value.ok, true);
    assert.equal(statePort.read().successfulWrite, 'confirmada');
    assert.equal(captureCalls, 2);
});
