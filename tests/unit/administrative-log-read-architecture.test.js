'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const factory = require('../../src/data/repository-factory.js');

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

const BOOTSTRAP_ENTITIES = Object.freeze([
    'appConfig',
    'programs',
    'controllers',
    'inventoryTeamMembers',
    'schools',
    'schoolPrograms',
    'competences',
    'verifications',
    'pendencies',
    'pendencyAttempts',
    'pendencyContacts',
    'assets',
    'registeredInvoices',
    'administrativeLogs'
]);

test('repositório Supabase expõe leitura paginada e contextual de logs administrativos', () => {
    const repository = factory.createRepository(remoteRuntime(), {
        supabaseClient: minimalClient()
    });

    assert.equal(typeof repository.queryAdministrativeLogs, 'function');
});

test('bootstrap operacional exclui somente administrativeLogs da carga inicial', () => {
    assert.equal(typeof factory.filterOperationalBootstrapEntities, 'function');

    const filtered = factory.filterOperationalBootstrapEntities(BOOTSTRAP_ENTITIES);

    assert.deepEqual(filtered, BOOTSTRAP_ENTITIES.filter(entity => entity !== 'administrativeLogs'));
    assert.equal(filtered.includes('verifications'), true);
    assert.equal(filtered.includes('registeredInvoices'), true);
    assert.equal(filtered.includes('pendencies'), true);
});

test('consulta explícita de administrativeLogs não é confundida com bootstrap', () => {
    const explicit = ['administrativeLogs'];
    assert.deepEqual(factory.filterOperationalBootstrapEntities(explicit), explicit);
});

test('exportSnapshot do bootstrap não lê administrativeLogs e snapshots explícitos continuam lendo', async () => {
    const repository = factory.createRepository(remoteRuntime(), {
        supabaseClient: minimalClient()
    });
    const loaded = [];
    repository.load = async entity => {
        loaded.push(entity);
        return [];
    };

    await repository.exportSnapshot({ includeEmpty: true, entities: BOOTSTRAP_ENTITIES });

    assert.equal(loaded.includes('administrativeLogs'), false);
    assert.equal(loaded.includes('verifications'), true);
    assert.equal(loaded.includes('registeredInvoices'), true);

    loaded.length = 0;
    await repository.exportSnapshot({ includeEmpty: true, entities: ['administrativeLogs'] });
    assert.deepEqual(loaded, ['administrativeLogs']);
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
