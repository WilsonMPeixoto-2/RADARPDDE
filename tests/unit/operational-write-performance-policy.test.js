'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const observer = require('../../src/integration/operational-write-performance.js');

test('performance expõe somente instalação e tracing do DataService', () => {
    assert.deepEqual(
        Object.keys(observer).sort(),
        ['collectDataServices', 'install', 'patchDataService']
    );
    assert.equal(observer.decorateCommand, undefined);
    assert.equal(observer.syncProntuarioProgramUI, undefined);
    assert.equal(observer.patchInlineHandlers, undefined);
});

test('sem trace ativo o observador entrega exatamente o mesmo comando ao DataService', async () => {
    const received = [];
    const dataService = {
        execute: async command => {
            received.push(command);
            return command;
        }
    };
    const root = {
        RadarApplicationServices: {
            pendencies: { dataService },
            inventory: { dataService }
        }
    };
    const persist = async () => ({ ok: true });
    const command = {
        name: 'pendency:open',
        changedEntities: ['pendencies', 'administrativeLogs'],
        remoteResultIsAuthoritative: true,
        incrementalStateEntities: ['pendencies'],
        persist
    };

    assert.equal(observer.install(root), true);
    await dataService.execute(command);

    assert.equal(received.length, 1);
    assert.equal(received[0], command);
    assert.equal(received[0].persist, persist);
    assert.equal(received[0].remoteResultIsAuthoritative, true);
    assert.deepEqual(received[0].incrementalStateEntities, ['pendencies']);
    assert.equal(dataService.__radarOperationalWritePerformance, true);
});

test('com trace ativo o observador envolve somente persist e preserva toda política funcional', async () => {
    const marks = [];
    const received = [];
    const dataService = {
        execute: async command => {
            received.push(command);
            await command.persist({ sample: true });
            return command;
        }
    };
    const root = {
        RadarOperationalWriteDiagnostics: {
            active: () => 17,
            mark: (_root, id, phase) => {
                marks.push([id, phase]);
                return true;
            }
        },
        RadarApplicationServices: {
            verifications: { dataService }
        }
    };
    let persistedContext = null;
    const persist = async context => {
        persistedContext = context;
        return { ok: true };
    };
    const command = {
        name: 'verification:set-bonification',
        changedEntities: ['verifications', 'administrativeLogs'],
        remoteResultIsAuthoritative: true,
        incrementalStateEntities: ['verifications', 'administrativeLogs'],
        remoteRefreshExemptEntities: ['administrativeLogs'],
        persist
    };

    assert.equal(observer.install(root), true);
    await dataService.execute(command);

    assert.equal(received.length, 1);
    assert.notEqual(received[0].persist, persist);
    assert.equal(received[0].name, command.name);
    assert.deepEqual(received[0].changedEntities, command.changedEntities);
    assert.equal(received[0].remoteResultIsAuthoritative, true);
    assert.deepEqual(received[0].incrementalStateEntities, command.incrementalStateEntities);
    assert.deepEqual(received[0].remoteRefreshExemptEntities, ['administrativeLogs']);
    assert.deepEqual(persistedContext, { sample: true });
    assert.deepEqual(marks, [[17, 'rpcStart'], [17, 'rpcEnd']]);
});