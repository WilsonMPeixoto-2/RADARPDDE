'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const factory = require('../../src/data/repository-factory.js');
const contract = require('../../src/data/repository-contract.js');
const dataServiceApi = require('../../src/application/data-service.js');

function remoteRuntime() {
    return {
        environment: 'development',
        dataMode: 'supabase-development',
        features: { supabaseRepositoryEnabled: true },
        supabase: { connectionEnabled: true }
    };
}

function minimalClient() {
    return {
        from() {
            throw new Error('Nenhuma consulta deve ocorrer durante a construção do repositório.');
        }
    };
}

function memoryStorage(initialKeys = []) {
    const keys = [...initialKeys];
    return {
        get length() { return keys.length; },
        key(index) { return keys[index] ?? null; },
        removeItem(key) {
            const index = keys.indexOf(key);
            if (index >= 0) keys.splice(index, 1);
        },
        keys: () => [...keys]
    };
}

function queryClient(rows) {
    const calls = [];
    const builder = {
        select(value) {
            calls.push(['select', value]);
            return this;
        },
        order(column, options) {
            calls.push(['order', column, options]);
            return this;
        },
        limit(value) {
            calls.push(['limit', value]);
            return this;
        },
        eq(column, value) {
            calls.push(['eq', column, value]);
            return this;
        },
        or(value) {
            calls.push(['or', value]);
            return this;
        },
        then(resolve, reject) {
            return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
        }
    };
    return {
        calls,
        client: {
            from(table) {
                calls.push(['from', table]);
                return builder;
            }
        }
    };
}

test('repositório Supabase expõe leitura paginada e contextual de logs administrativos', () => {
    const repository = factory.createRepository(remoteRuntime(), {
        supabaseClient: minimalClient()
    });

    assert.equal(typeof repository.queryAdministrativeLogs, 'function');
});

test('bootstrap remoto exclui administrativeLogs pela política central, não por filtro oculto do repositório', () => {
    assert.equal(contract.ENTITY_LIFECYCLE.administrativeLogs.remoteLoad, 'on-demand');
    assert.equal(contract.REMOTE_BOOTSTRAP_ENTITIES.includes('administrativeLogs'), false);
    assert.equal(dataServiceApi.REMOTE_BOOTSTRAP_ENTITIES.includes('administrativeLogs'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(factory, 'filterOperationalBootstrapEntities'), false);
});

test('snapshots explícitos de administrativeLogs continuam disponíveis para manutenção e auditoria', async () => {
    const repository = factory.createRepository(remoteRuntime(), {
        supabaseClient: minimalClient()
    });
    const loaded = [];
    repository.load = async entity => {
        loaded.push(entity);
        return [];
    };

    await repository.exportSnapshot({ includeEmpty: true, entities: ['administrativeLogs'] });

    assert.deepEqual(loaded, ['administrativeLogs']);
});

test('modo Supabase remove apenas cópias antigas radar_pdde_repository antes do bootstrap', () => {
    const storage = memoryStorage([
        'radar_pdde_repository:administrativeLogs',
        'radar_pdde_repository:verifications',
        'radar_pdde_logs',
        'radar_pdde_verificacoes',
        'preferencia_visual'
    ]);

    factory.createRepository(remoteRuntime(), {
        supabaseClient: minimalClient(),
        storage
    });

    assert.deepEqual(storage.keys().sort(), [
        'preferencia_visual',
        'radar_pdde_logs',
        'radar_pdde_verificacoes'
    ].sort());
});

test('queryAdministrativeLogs usa limite, filtro por escola e cursor no servidor', async () => {
    const rows = [
        { id: 'LOG-3', school_id: '04.10.001', event_at: '2026-09-11T15:00:00Z' },
        { id: 'LOG-2', school_id: '04.10.001', event_at: '2026-09-11T14:00:00Z' },
        { id: 'LOG-1', school_id: '04.10.001', event_at: '2026-09-11T13:00:00Z' }
    ];
    const fake = queryClient(rows);
    const repository = factory.createRepository(remoteRuntime(), {
        supabaseClient: fake.client
    });

    const result = await repository.queryAdministrativeLogs({
        limit: 2,
        schoolId: '04.10.001',
        cursor: {
            eventAt: '2026-09-11T16:00:00Z',
            id: 'LOG-4'
        }
    });

    assert.deepEqual(result.records.map(record => record.id), ['LOG-3', 'LOG-2']);
    assert.equal(result.hasMore, true);
    assert.deepEqual(result.cursor, {
        eventAt: '2026-09-11T14:00:00Z',
        id: 'LOG-2'
    });
    assert.ok(fake.calls.some(call => call[0] === 'from' && call[1] === 'administrative_logs'));
    assert.ok(fake.calls.some(call => call[0] === 'eq' && call[1] === 'school_id' && call[2] === '04.10.001'));
    assert.ok(fake.calls.some(call => call[0] === 'limit' && call[1] === 3));
    assert.ok(fake.calls.some(call => call[0] === 'order' && call[1] === 'event_at' && call[2]?.ascending === false));
    assert.ok(fake.calls.some(call => call[0] === 'order' && call[1] === 'id' && call[2]?.ascending === false));
    assert.ok(fake.calls.some(call => call[0] === 'or' && String(call[1]).includes('event_at.lt.2026-09-11T16:00:00Z')));
});