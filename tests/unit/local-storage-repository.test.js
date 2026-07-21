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

test('diagnostica uso aproximado e capacidade de escrita do armazenamento local', async () => {
    const storage = createMemoryStorage();
    const repository = new LocalStorageRepository({ storage, keyPrefix: 'radar-capacity' });
    await repository.save('schools', [{ id: 's1', denomination: 'Escola' }]);

    const diagnostic = await repository.diagnoseCapacity();
    assert.equal(diagnostic.ok, true);
    assert.equal(diagnostic.writable, true);
    assert.equal(diagnostic.mode, 'local');
    assert.equal(diagnostic.trackedEntities, 19);
    assert.equal(diagnostic.approximateBytes > 0, true);
});

test('trata QuotaExceededError lançando o código de erro apropriado', async () => {
    const brokenStorage = {
        getItem() { return null; },
        setItem() {
            const error = new Error('Quota exceeded');
            error.name = 'QuotaExceededError';
            throw error;
        },
        removeItem() {}
    };
    const repository = new LocalStorageRepository({ storage: brokenStorage });

    await assert.rejects(
        repository.save('schools', [{ id: '1' }]),
        error => error instanceof RepositoryError && error.code === 'QUOTA_EXCEEDED'
    );
});

test('restoreSnapshot garante consistência atômica com rollback na falha de quota', async () => {
    const storage = createMemoryStorage();
    const repository = new LocalStorageRepository({ storage });

    await repository.save('schools', [{ id: 'escola-original' }]);
    await repository.save('programs', [{ id: 'programa-original' }]);

    const brokenSnapshot = {
        format: 'radar-pdde-snapshot',
        version: '1',
        importId: 'err-01',
        entities: {
            schools: [{ id: 'nova-escola' }],
            programs: [{ id: 'novo-programa' }]
        }
    };

    // Forçar falha de quota especificamente quando salvar 'programs'
    let saveCount = 0;
    const interceptorStorage = {
        getItem(key) { return storage.getItem(key); },
        removeItem(key) { storage.removeItem(key); },
        setItem(key, value) {
            saveCount += 1;
            if (saveCount === 2) {
                const error = new Error('Storage full');
                error.name = 'QuotaExceededError';
                throw error;
            }
            storage.setItem(key, value);
        }
    };

    const interceptorRepository = new LocalStorageRepository({ storage: interceptorStorage });

    await assert.rejects(
        interceptorRepository.restoreSnapshot(brokenSnapshot),
        error => error instanceof RepositoryError && error.code === 'QUOTA_EXCEEDED'
    );

    // O rollback deve restaurar o estado original de TODAS as tabelas, inclusive da 'schools' que chegou a ser gravada
    assert.deepEqual(await repository.load('schools'), [{ id: 'escola-original' }]);
    assert.deepEqual(await repository.load('programs'), [{ id: 'programa-original' }]);
});
