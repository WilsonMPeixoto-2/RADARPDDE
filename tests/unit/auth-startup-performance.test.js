'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { SessionService } = require('../../src/auth/session-service.js');
const { SupabaseRepository } = require('../../src/data/supabase-repository.js');
const dataServiceApi = require('../../src/application/data-service.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

function activeProfile() {
    return {
        user_id: 'user-1',
        profile_id: 'controller',
        controller_id: 'controller-1',
        inventory_member_id: null,
        cre_scope: '4ª CRE',
        active: true,
        profiles: {
            id: 'controller',
            label: 'Controlador',
            active: true
        }
    };
}

function delayedQuery(name, result, gates, started) {
    const query = {
        select() { return query; },
        eq() { return query; },
        order() { return query; },
        then(resolve, reject) {
            started.push(name);
            return gates[name].promise
                .then(() => resolve({ data: result, error: null }), reject);
        }
    };
    return query;
}

test('inicia perfil, papel efetivo e escopos em paralelo ao restaurar a sessão', async () => {
    const user = { id: 'user-1', email: 'controller@radar.local' };
    const session = { access_token: 'fixture-token', user };
    const started = [];
    const gates = {
        profile: deferred(),
        role: deferred(),
        scopes: deferred()
    };
    const client = {
        auth: {
            async getSession() { return { data: { session }, error: null }; },
            async signInWithPassword() { return { data: { session }, error: null }; },
            async signOut() { return { error: null }; }
        },
        from(table) {
            if (table === 'user_profiles') {
                return delayedQuery('profile', [activeProfile()], gates, started);
            }
            if (table === 'user_school_scopes') {
                return delayedQuery('scopes', [{ school_id: 'ESC-1', can_write: true }], gates, started);
            }
            throw new Error(`Tabela inesperada: ${table}`);
        },
        async rpc(name) {
            assert.equal(name, 'current_app_role');
            started.push('role');
            await gates.role.promise;
            return { data: 'controller', error: null };
        }
    };
    const service = new SessionService({ client });

    const restoring = service.restore();
    await Promise.resolve();
    await Promise.resolve();

    assert.deepEqual([...new Set(started)].sort(), ['profile', 'role', 'scopes']);

    Object.values(gates).forEach(gate => gate.resolve());
    const state = await restoring;
    assert.equal(state.status, 'authenticated');
});

test('deduplica a validação disparada simultaneamente pelo login e pelo evento Auth', async () => {
    const user = { id: 'user-1', email: 'controller@radar.local' };
    const session = { access_token: 'fixture-token', user };
    let authListener = null;
    const calls = { profiles: 0, role: 0, scopes: 0 };

    function immediateQuery(kind, data) {
        const query = {
            select() { return query; },
            eq() { return query; },
            order() { return query; },
            then(resolve, reject) {
                calls[kind] += 1;
                return Promise.resolve({ data, error: null }).then(resolve, reject);
            }
        };
        return query;
    }

    const client = {
        auth: {
            async getSession() { return { data: { session: null }, error: null }; },
            async signInWithPassword() {
                authListener?.('SIGNED_IN', session);
                return { data: { session }, error: null };
            },
            async signOut() { return { error: null }; },
            onAuthStateChange(listener) {
                authListener = listener;
                return { data: { subscription: { unsubscribe() {} } } };
            }
        },
        from(table) {
            if (table === 'user_profiles') return immediateQuery('profiles', [activeProfile()]);
            if (table === 'user_school_scopes') return immediateQuery('scopes', []);
            throw new Error(`Tabela inesperada: ${table}`);
        },
        async rpc() {
            calls.role += 1;
            return { data: 'controller', error: null };
        }
    };
    const service = new SessionService({ client });
    await service.initialize();

    await service.signIn({ email: user.email, password: 'fixture' });
    await new Promise(resolve => setImmediate(resolve));

    assert.deepEqual(calls, { profiles: 1, role: 1, scopes: 1 });
});

test('exporta somente as entidades solicitadas e inicia leituras remotas concorrentemente', async () => {
    const selectedTables = ['schools', 'programs', 'competences', 'app_config'];
    const calls = [];
    let active = 0;
    let maxActive = 0;

    const client = {
        from(table) {
            const query = {
                select() { return query; },
                order() { return query; },
                range() { return query; },
                then(resolve) {
                    calls.push(table);
                    active += 1;
                    maxActive = Math.max(maxActive, active);
                    setTimeout(() => {
                        active -= 1;
                        resolve({ data: [], error: null });
                    }, 5);
                }
            };
            return query;
        }
    };
    const repository = new SupabaseRepository({ client, readConcurrency: 4 });

    const snapshot = await repository.exportSnapshot({
        includeEmpty: true,
        entities: ['schools', 'programs', 'competences', 'appConfig']
    });

    assert.deepEqual(calls.slice().sort(), selectedTables.slice().sort());
    assert.deepEqual(Object.keys(snapshot.entities), ['schools', 'programs', 'competences', 'appConfig']);
    assert.ok(maxActive > 1, `As leituras permaneceram sequenciais: concorrência máxima ${maxActive}.`);
    assert.ok(maxActive <= 4, `A concorrência excedeu o limite: ${maxActive}.`);
});

test('bootstrap remoto solicita apenas as entidades operacionais usadas pela aplicação', async () => {
    const { DataService, REMOTE_BOOTSTRAP_ENTITIES } = dataServiceApi;
    assert.ok(Array.isArray(REMOTE_BOOTSTRAP_ENTITIES));
    assert.equal(REMOTE_BOOTSTRAP_ENTITIES.includes('auditEvents'), false);
    assert.equal(REMOTE_BOOTSTRAP_ENTITIES.includes('userProfiles'), false);

    let exportOptions = null;
    const repository = {
        capabilities: () => ({ mode: 'supabase', remote: true, canImportLegacy: false }),
        load: async () => [],
        save: async () => [],
        remove: async () => ({ removed: 0 }),
        exportSnapshot: async options => {
            exportOptions = structuredClone(options);
            return createSnapshotEnvelope({}, {
                importId: 'remote-startup',
                exportedAt: '2026-07-30T12:00:00.000Z'
            });
        },
        restoreSnapshot: async () => ({ restoredEntities: 0 }),
        healthCheck: async () => ({ ok: true, mode: 'supabase' })
    };
    const statePort = {
        capture: async () => ({ memory: {}, storage: {} }),
        exportCanonical: async () => { throw new Error('Não deve importar estado local.'); },
        applyCanonical: async () => undefined,
        restore: async () => undefined
    };
    const service = new DataService({ repository, statePort });

    await service.bootstrap();

    assert.deepEqual(exportOptions.entities, REMOTE_BOOTSTRAP_ENTITIES);
    assert.equal(exportOptions.includeEmpty, true);
});
