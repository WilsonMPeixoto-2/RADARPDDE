'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { AuthGate } = require('../../src/integration/auth-gate.js');

function createHarness() {
    const handlers = new Map();
    const fields = [
        { hidden: false },
        { hidden: false }
    ];
    const submit = {
        hidden: false,
        disabled: false,
        textContent: 'Entrar'
    };
    const form = {
        hidden: false,
        inert: false,
        attributes: {},
        dataset: {},
        addEventListener() {},
        querySelector(selector) {
            if (selector === '[type="submit"]') return submit;
            return null;
        },
        querySelectorAll(selector) {
            if (selector === '.form-group') return fields;
            return [];
        },
        setAttribute(name, value) { this.attributes[name] = value; },
        removeAttribute(name) { delete this.attributes[name]; }
    };
    const app = { inert: false };
    const description = { textContent: '' };
    const status = { textContent: '', dataset: {} };
    const classes = new Set();
    let reloads = 0;
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
            if (id === 'app-layout') return app;
            if (id === 'radar-auth-description') return description;
            if (id === 'radar-auth-status') return status;
            return null;
        },
        querySelector() { return null; }
    };
    const root = {
        RADAR_PDDE_CONFIG: { supabase: { connectionEnabled: true } },
        location: { reload() { reloads += 1; } },
        requestAnimationFrame(callback) { callback(); },
        addEventListener(type, handler) { handlers.set(type, handler); },
        console: { error() {} }
    };
    const gate = new AuthGate({ root, document });
    return {
        gate,
        handlers,
        fields,
        submit,
        form,
        app,
        description,
        status,
        classes,
        reloads: () => reloads,
        root
    };
}

test('falha após autenticação deixa de parecer senha inválida e oferece recarga segura', async () => {
    const harness = createHarness();
    harness.gate.initialize();
    harness.handlers.get('radar:auth-resolved')({
        detail: {
            authentication: {
                user: { id: 'controller-1', email: 'controller@radar.test' },
                authorization: {
                    role: 'controller',
                    profile: { label: 'Controlador' }
                }
            }
        }
    });

    assert.equal(harness.gate.phase, 'loading_data');

    let prevented = false;
    harness.handlers.get('unhandledrejection')({
        reason: Object.assign(new Error('detalhe interno sensível'), {
            code: 'BOOTSTRAP_FAILED'
        }),
        preventDefault() { prevented = true; }
    });

    assert.equal(prevented, true);
    assert.equal(harness.gate.phase, 'workspace_error');
    assert.equal(harness.app.inert, true);
    assert.equal(harness.form.hidden, false);
    assert.equal(harness.form.inert, false);
    assert.ok(harness.fields.every(field => field.hidden === true));
    assert.equal(harness.submit.hidden, false);
    assert.equal(harness.submit.textContent, 'Recarregar ambiente');
    assert.match(harness.description.textContent, /autenticação.*confirmada/i);
    assert.match(harness.status.textContent, /não foi possível carregar.*ambiente/i);
    assert.doesNotMatch(harness.status.textContent, /detalhe interno sensível/i);
    assert.equal(harness.status.dataset.type, 'error');
    assert.equal(harness.root.RADAR_STARTUP_DIAGNOSTICS.stage, 'post-auth-workspace');
    assert.equal(harness.root.RADAR_STARTUP_DIAGNOSTICS.code, 'BOOTSTRAP_FAILED');
    assert.equal(harness.root.RADAR_STARTUP_DIAGNOSTICS.message, undefined);

    await harness.gate.handleSubmit({
        preventDefault() {},
        currentTarget: harness.form
    });
    assert.equal(harness.reloads(), 1);
});

test('rejeição fora da fase de carregamento não é convertida em falso erro pós-login', () => {
    const harness = createHarness();
    harness.gate.initialize();

    let prevented = false;
    harness.handlers.get('unhandledrejection')({
        reason: new Error('falha independente'),
        preventDefault() { prevented = true; }
    });

    assert.equal(prevented, false);
    assert.equal(harness.gate.phase, 'resolving');
    assert.notEqual(harness.status.dataset.type, 'error');
});
