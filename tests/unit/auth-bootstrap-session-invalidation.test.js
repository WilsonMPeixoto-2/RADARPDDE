'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { prepareAuthenticatedClient } = require('../../src/integration/auth-bootstrap.js');

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

function authenticatedState(id = 'user-1') {
    return {
        status: 'authenticated',
        user: { id },
        authorization: { role: 'controller', profile: { label: 'Controlador' } }
    };
}

function createRoot(sessionService) {
    const events = [];
    let reloads = 0;
    const root = {
        supabase: { createClient: () => ({ id: 'client' }) },
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
        dispatchEvent(event) { events.push(event); },
        setTimeout(callback) {
            callback();
            return 1;
        },
        location: {
            reload() { reloads += 1; }
        },
        RadarAuthContext: { authentication: true }
    };
    return { root, events, getReloads: () => reloads };
}

test('signed_out depois de sessão autenticada invalida memória e recarrega a aplicação', async () => {
    let onChangeHandler = null;
    const sessionService = {
        async initialize() { return authenticatedState(); },
        onChange(handler) {
            onChangeHandler = handler;
            return () => {};
        }
    };
    const harness = createRoot(sessionService);

    await prepareAuthenticatedClient({ runtimeConfig: remoteConfig(), root: harness.root });
    assert.equal(typeof onChangeHandler, 'function');

    onChangeHandler({ status: 'signed_out' });

    assert.equal(harness.root.RadarAuthContext, null);
    assert.equal(harness.getReloads(), 1);
    assert.equal(harness.events.at(-1).type, 'radar:auth-required');
});

test('estado inicial signed_out mostra o gate sem recarregar em loop; só uma sessão autenticada passa a exigir limpeza', async () => {
    let onChangeHandler = null;
    let resolveAuthentication;
    const sessionService = {
        async initialize() { return { status: 'signed_out' }; },
        waitForAuthenticated() {
            return new Promise(resolve => { resolveAuthentication = resolve; });
        },
        onChange(handler) {
            onChangeHandler = handler;
            return () => {};
        }
    };
    const harness = createRoot(sessionService);
    const pending = prepareAuthenticatedClient({ runtimeConfig: remoteConfig(), root: harness.root });
    await new Promise(resolve => setImmediate(resolve));

    onChangeHandler({ status: 'signed_out' });
    assert.equal(harness.getReloads(), 0);

    resolveAuthentication(authenticatedState('user-2'));
    await pending;
    onChangeHandler({ status: 'signed_out' });
    assert.equal(harness.getReloads(), 1);
});
