'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    prepareAuthenticatedClient
} = require('../../src/integration/auth-bootstrap.js');

function remoteConfig() {
    return {
        dataMode: 'supabase-preview',
        supabase: {
            connectionEnabled: true,
            url: 'http://127.0.0.1:54321',
            publishableKey: 'sb_publishable_fixture'
        }
    };
}

test('modo local não cria cliente nem sessão remota', async () => {
    let createClientCalls = 0;
    const result = await prepareAuthenticatedClient({
        runtimeConfig: { dataMode: 'local', supabase: { connectionEnabled: false } },
        root: {
            supabase: { createClient() { createClientCalls += 1; } }
        }
    });

    assert.equal(createClientCalls, 0);
    assert.deepEqual(result, {
        client: null,
        sessionService: null,
        authentication: null
    });
});

test('modo remoto aguarda autenticação válida antes de devolver o cliente de dados', async () => {
    const client = { id: 'client' };
    let resolveAuthentication;
    const events = [];
    const sessionService = {
        async initialize() {
            return { status: 'signed_out' };
        },
        waitForAuthenticated() {
            return new Promise(resolve => { resolveAuthentication = resolve; });
        },
        onChange() {
            return () => {};
        }
    };
    const root = {
        supabase: { createClient: () => client },
        RadarSessionService: {
            SessionService: class {
                constructor() { return sessionService; }
            }
        },
        CustomEvent: class {
            constructor(type, options) {
                this.type = type;
                this.detail = options?.detail;
            }
        },
        dispatchEvent(event) { events.push(event); }
    };

    let settled = false;
    const pending = prepareAuthenticatedClient({ runtimeConfig: remoteConfig(), root })
        .then(result => {
            settled = true;
            return result;
        });
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(settled, false);
    assert.equal(events[0].type, 'radar:auth-required');
    resolveAuthentication({
        status: 'authenticated',
        user: { id: 'user-1', displayName: 'Controlador Local' },
        authorization: { role: 'controller', profile: { label: 'Controlador' } }
    });

    const result = await pending;
    assert.equal(result.client, client);
    assert.equal(result.sessionService, sessionService);
    assert.deepEqual(result.authentication, {
        user: { id: 'user-1', displayName: 'Controlador Local' },
        authorization: { role: 'controller', profile: { label: 'Controlador' } }
    });
    assert.equal(Object.hasOwn(result.authentication, 'session'), false);
});

test('sessão restaurada inválida é encerrada e volta ao gate sem liberar dados', async () => {
    let signOutCalls = 0;
    let resolveAuthentication;
    const events = [];
    const sessionService = {
        async initialize() {
            const error = new Error('Perfil inativo.');
            error.code = 'USER_INACTIVE';
            throw error;
        },
        async signOut() { signOutCalls += 1; },
        waitForAuthenticated() {
            return new Promise(resolve => { resolveAuthentication = resolve; });
        },
        onChange() { return () => {}; }
    };
    const root = {
        supabase: { createClient: () => ({}) },
        RadarSessionService: {
            SessionService: class {
                constructor() { return sessionService; }
            }
        },
        CustomEvent: class {
            constructor(type, options) {
                this.type = type;
                this.detail = options?.detail;
            }
        },
        dispatchEvent(event) { events.push(event); }
    };

    const pending = prepareAuthenticatedClient({ runtimeConfig: remoteConfig(), root });
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(signOutCalls, 1);
    assert.match(events[0].detail.message, /inativo/i);
    resolveAuthentication({
        status: 'authenticated',
        user: { id: 'user-2' },
        authorization: { role: 'federal_assistant' }
    });
    const result = await pending;
    assert.equal(result.authentication.authorization.role, 'federal_assistant');
});
