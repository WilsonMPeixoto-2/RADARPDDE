'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    SessionError,
    SessionService
} = require('../../src/auth/session-service.js');

function queryResult(data, error = null) {
    const result = { data, error };
    const query = {
        select() { return query; },
        eq() { return query; },
        order() { return query; },
        then(resolve, reject) {
            return Promise.resolve(result).then(resolve, reject);
        }
    };
    return query;
}

function createClient(options = {}) {
    const user = options.user || {
        id: 'user-1',
        email: 'controller@radar.local',
        user_metadata: { name: 'Controlador Local' }
    };
    const session = options.session === undefined
        ? { access_token: 'fixture-token', user }
        : options.session;
    const signOutCalls = [];
    const listeners = [];
    const tables = {
        user_profiles: options.userProfiles || [],
        user_school_scopes: options.scopes || []
    };

    return {
        auth: {
            async getSession() {
                return { data: { session }, error: options.getSessionError || null };
            },
            async signInWithPassword() {
                return options.signInResult || { data: { session, user }, error: null };
            },
            async signOut() {
                signOutCalls.push(true);
                return { error: options.signOutError || null };
            },
            onAuthStateChange(callback) {
                listeners.push(callback);
                return { data: { subscription: { unsubscribe() {} } } };
            }
        },
        from(table) {
            return queryResult(tables[table] || [], options.tableErrors?.[table] || null);
        },
        async rpc(name) {
            assert.equal(name, 'current_app_role');
            return {
                data: options.databaseRole === undefined
                    ? (options.userProfiles?.find(item => item.active)?.profile_id || null)
                    : options.databaseRole,
                error: options.rpcError || null
            };
        },
        signOutCalls,
        listeners
    };
}

function activeProfile(profileId = 'controller', overrides = {}) {
    return {
        user_id: 'user-1',
        profile_id: profileId,
        controller_id: profileId === 'controller' ? 'controller-1' : null,
        inventory_member_id: profileId === 'inventory' ? 'inventory-1' : null,
        cre_scope: '4ª CRE',
        active: true,
        profiles: {
            id: profileId,
            label: profileId,
            active: true
        },
        ...overrides
    };
}

test('inicializa sem sessão e aguarda autenticação sem consultar dados institucionais', async () => {
    const client = createClient({ session: null });
    const service = new SessionService({ client });

    const state = await service.initialize();

    assert.deepEqual(state, {
        status: 'signed_out',
        session: null,
        user: null,
        authorization: null
    });
    assert.equal(service.getAuthorizationContext(), null);
});

test('autentica e devolve perfil, identidade e escopos sujeitos a RLS', async () => {
    const client = createClient({
        userProfiles: [activeProfile()],
        scopes: [
            { school_id: 'ESC-1', can_write: true },
            { school_id: 'ESC-2', can_write: false }
        ]
    });
    const service = new SessionService({ client });

    const state = await service.signIn({ email: 'controller@radar.local', password: 'fixture' });

    assert.equal(state.status, 'authenticated');
    assert.equal(Object.hasOwn(state.session, 'access_token'), false);
    assert.equal(state.user.displayName, 'Controlador Local');
    assert.equal(state.authorization.role, 'controller');
    assert.equal(state.authorization.controllerId, 'controller-1');
    assert.deepEqual(state.authorization.scopes, [
        { schoolId: 'ESC-1', canWrite: true },
        { schoolId: 'ESC-2', canWrite: false }
    ]);
    assert.equal(service.getAuthorizationContext().role, 'controller');
});

test('distingue usuário sem perfil, perfil inativo e perfis ativos duplicados', async () => {
    const scenarios = [
        { profiles: [], code: 'PROFILE_MISSING' },
        { profiles: [activeProfile('controller', { active: false })], code: 'USER_INACTIVE' },
        { profiles: [activeProfile('controller'), activeProfile('federal_assistant')], code: 'MULTIPLE_ACTIVE_PROFILES' }
    ];

    for (const scenario of scenarios) {
        const client = createClient({ userProfiles: scenario.profiles });
        const service = new SessionService({ client });
        await assert.rejects(
            service.restore(),
            error => error instanceof SessionError && error.code === scenario.code
        );
    }
});

test('recusa divergência entre perfil consultado e papel efetivo do banco', async () => {
    const service = new SessionService({
        client: createClient({
            userProfiles: [activeProfile('controller')],
            databaseRole: 'federal_assistant'
        })
    });

    await assert.rejects(
        service.restore(),
        error => error instanceof SessionError && error.code === 'AUTHORIZATION_INCONSISTENT'
    );
});

test('logout limpa contexto local somente depois de encerrar a sessão', async () => {
    const client = createClient({ userProfiles: [activeProfile()] });
    const service = new SessionService({ client });
    await service.restore();

    const state = await service.signOut();

    assert.equal(client.signOutCalls.length, 1);
    assert.equal(state.status, 'signed_out');
    assert.equal(service.getAuthorizationContext(), null);
});


test('timeout de consulta institucional após login não encerra a sessão do Supabase', async () => {
    const client = createClient({
        userProfiles: [activeProfile()],
        tableErrors: {
            user_profiles: { status: 500, code: '57014', message: 'statement timeout' }
        }
    });
    const service = new SessionService({ client });

    await assert.rejects(
        service.signIn({ email: 'controller@radar.local', password: 'fixture' }),
        error => error instanceof SessionError && error.code === 'AUTHORIZATION_UNAVAILABLE'
    );

    assert.equal(client.signOutCalls.length, 0);
    assert.equal(service.getAuthorizationContext(), null);
});

test('refresh do JWT com timeout de perfil bloqueia o ambiente sem emitir SIGNED_OUT fictício', async () => {
    const options = { userProfiles: [activeProfile()], tableErrors: {} };
    const client = createClient(options);
    const service = new SessionService({ client });
    await service.initialize();
    assert.equal(service.getState().status, 'authenticated');

    options.tableErrors.user_profiles = {
        status: 500, code: '57014', message: 'statement timeout'
    };
    client.listeners[0]('TOKEN_REFRESHED', {
        user: { id: 'user-1', email: 'controller@radar.local' }
    });
    await new Promise(resolve => setImmediate(resolve));

    const state = service.getState();
    assert.equal(state.status, 'authorization_unavailable');
    assert.equal(state.authorization, null);
    assert.equal(client.signOutCalls.length, 0);
});

test('falha temporária na restauração de sessão mantém credenciais no cliente sem acesso institucional', async () => {
    const client = createClient({
        getSessionError: { status: 503, code: 'NETWORK_ERROR', message: 'temporarily unavailable' }
    });
    const service = new SessionService({ client });
    await assert.rejects(
        service.restore(),
        error => error instanceof SessionError && error.code === 'SESSION_UNAVAILABLE'
    );
    assert.equal(service.getAuthorizationContext(), null);
    assert.equal(client.signOutCalls.length, 0);
});
