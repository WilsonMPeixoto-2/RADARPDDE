'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { LocalStorageRepository } = require('../../src/data/local-storage-repository.js');
const { RepositoryError } = require('../../src/data/repository-contract.js');
const { validateSnapshot } = require('../../src/data/snapshot-tools.js');

function createMemoryStorage() {
    const values = new Map();
    return {
        getItem(key) {
            return values.has(key) ? values.get(key) : null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        },
        removeItem(key) {
            values.delete(key);
        },
        clear() {
            values.clear();
        }
    };
}

test('salva e carrega coleções com clonagem defensiva', async () => {
    const repository = new LocalStorageRepository({
        storage: createMemoryStorage(),
        keyPrefix: 'test',
        schemaVersion: '2'
    });
    const source = [{ id: '04.31.001', name: 'Escola A' }];

    await repository.save('schools', source);
    source[0].name = 'Alterada fora do repositório';

    const loaded = await repository.load('schools');
    assert.deepEqual(loaded, [{ id: '04.31.001', name: 'Escola A' }]);

    loaded[0].name = 'Alterada depois da leitura';
    assert.deepEqual(await repository.load('schools'), [{ id: '04.31.001', name: 'Escola A' }]);
});

test('remove uma entidade sem afetar as demais', async () => {
    const repository = new LocalStorageRepository({ storage: createMemoryStorage() });
    await repository.save('schools', [{ id: '1' }]);
    await repository.save('pendencies', [{ id: 'p1' }]);

    await repository.remove('schools');

    assert.deepEqual(await repository.load('schools'), []);
    assert.deepEqual(await repository.load('pendencies'), [{ id: 'p1' }]);
});

test('exporta e restaura snapshot no formato canônico de migração', async () => {
    const storage = createMemoryStorage();
    const repository = new LocalStorageRepository({
        storage,
        keyPrefix: 'radar',
        schemaVersion: '7'
    });
    await repository.save('schools', [{ id: '1' }]);
    await repository.save('programs', [{ id: 'BASIC' }]);

    const snapshot = await repository.exportSnapshot({
        importId: 'local-001',
        exportedAt: '2026-07-13T12:00:00.000Z'
    });
    assert.equal(snapshot.format, 'radar-pdde-snapshot');
    assert.equal(snapshot.version, '7');
    assert.equal(snapshot.importId, 'local-001');
    assert.deepEqual(validateSnapshot(snapshot), { ok: true, errors: [] });
    assert.deepEqual(snapshot.entities.schools, [{ id: '1' }]);
    assert.deepEqual(snapshot.entities.programs, [{ id: 'BASIC' }]);

    storage.clear();
    await repository.restoreSnapshot(snapshot);

    assert.deepEqual(await repository.load('schools'), [{ id: '1' }]);
    assert.deepEqual(await repository.load('programs'), [{ id: 'BASIC' }]);
});

test('recusa entidade desconhecida', async () => {
    const repository = new LocalStorageRepository({ storage: createMemoryStorage() });

    await assert.rejects(
        repository.load('unknown_table'),
        error => error instanceof RepositoryError && error.code === 'UNKNOWN_ENTITY'
    );
});

test('health check não altera dados e informa modo local', async () => {
    const repository = new LocalStorageRepository({ storage: createMemoryStorage() });
    const health = await repository.healthCheck();

    assert.deepEqual(health, {
        ok: true,
        mode: 'local',
        writable: true
    });
});
