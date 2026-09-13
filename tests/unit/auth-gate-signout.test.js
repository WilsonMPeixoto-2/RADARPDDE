'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { AuthGate } = require('../../src/integration/auth-gate.js');

function createHarness(signOut) {
    let reloads = 0;
    let focused = 0;
    const status = { textContent: '', dataset: {} };
    const form = {
        hidden: true,
        inert: true,
        dataset: {},
        querySelectorAll: () => [],
        querySelector: () => null,
        setAttribute() {}
    };
    const app = { inert: false };
    const email = { focus() { focused += 1; } };
    const classes = new Set();
    const document = {
        body: { dataset: {} },
        documentElement: {
            classList: {
                add(value) { classes.add(value); },
                remove(value) { classes.delete(value); }
            }
        },
        getElementById(id) {
            if (id === 'radar-auth-form') return form;
            if (id === 'radar-auth-status') return status;
            if (id === 'app-layout') return app;
            if (id === 'radar-auth-email') return email;
            return null;
        },
        querySelector: () => null
    };
    const root = {
        RADAR_PDDE_CONFIG: { supabase: { connectionEnabled: true } },
        RadarSessionContext: { service: { signOut } },
        RadarAuthContext: Object.freeze({ user: { id: 'user-1' }, authorization: { role: 'controller' } }),
        location: { reload() { reloads += 1; } },
        requestAnimationFrame(callback) { callback(); }
    };
    return {
        gate: new AuthGate({ root, document }),
        root,
        status,
        reloads: () => reloads,
        focused: () => focused,
        classes
    };
}

test('logout remoto confirmado recarrega a página para destruir estado e caches da sessão anterior', async () => {
    let calls = 0;
    const harness = createHarness(async () => { calls += 1; });

    await harness.gate.handleSignOut();

    assert.equal(calls, 1);
    assert.equal(harness.root.RadarAuthContext, null);
    assert.equal(harness.reloads(), 1);
});

test('falha do logout remoto não finge encerramento nem libera troca de usuário sobre a sessão antiga', async () => {
    const error = Object.assign(new Error('falha remota'), { code: 'REMOTE_UNAVAILABLE' });
    const harness = createHarness(async () => { throw error; });
    const before = harness.root.RadarAuthContext;

    await harness.gate.handleSignOut();

    assert.equal(harness.root.RadarAuthContext, before);
    assert.equal(harness.reloads(), 0);
    assert.equal(harness.status.dataset.type, 'error');
    assert.match(harness.status.textContent, /encerrar.*sessão/i);
});

test('gate não inicia outra navegação quando a invalidação da sessão já agendou reload', async () => {
    const harness = createHarness(async () => { harness.root.RadarSessionInvalidated = true; });
    await harness.gate.handleSignOut();
    assert.equal(harness.reloads(), 0);
    assert.equal(harness.root.RadarAuthContext, null);
});
