'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { install } = require('../../src/integration/critical-action-guard.js');

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

function createForm(label) {
    const attributes = new Map();
    const submit = { disabled: false, textContent: label };
    return {
        tagName: 'FORM',
        submit,
        getAttribute(name) {
            return attributes.has(name) ? attributes.get(name) : null;
        },
        setAttribute(name, value) {
            attributes.set(name, String(value));
        },
        removeAttribute(name) {
            attributes.delete(name);
        },
        querySelector(selector) {
            return selector === 'button[type="submit"]' ? submit : null;
        }
    };
}

function createRoot() {
    const submission = deferred();
    const reanalysis = deferred();
    const forward = deferred();
    const inventory = deferred();
    const calls = { submission: 0, reanalysis: 0, forward: [], inventory: 0 };
    const forms = {
        'form-registrar-envio': createForm('Registrar novo envio'),
        'form-reanalisar-pendencia': createForm('Confirmar reanálise'),
        'form-inventario-confirm': createForm('Confirmar inventariação')
    };
    const values = {
        'envio-pendencia-id': { value: 'PEND-1' },
        'reanalisar-pendencia-id': { value: 'PEND-1' },
        'inventario-bem-id': { value: 'BEM-1' }
    };
    const root = {
        document: {
            getElementById(id) {
                return forms[id] || values[id] || null;
            }
        },
        async confirmarRegistrarNovoEnvio() {
            calls.submission += 1;
            return submission.promise;
        },
        async confirmarReanalisePendencia() {
            calls.reanalysis += 1;
            return reanalysis.promise;
        },
        async encaminharCapital(assetId) {
            calls.forward.push(assetId);
            return forward.promise;
        },
        async salvarInventariacao() {
            calls.inventory += 1;
            return inventory.promise;
        }
    };
    return { root, calls, forms, submission, reanalysis, forward, inventory };
}

function fakeEvent(form) {
    return {
        currentTarget: form,
        prevented: 0,
        stopped: 0,
        preventDefault() { this.prevented += 1; },
        stopImmediatePropagation() { this.stopped += 1; }
    };
}

test('novo envio aceita somente uma chamada enquanto a primeira persiste e restaura a interface', async () => {
    const h = createRoot();
    assert.equal(install(h.root), true);
    const form = h.forms['form-registrar-envio'];
    const event = fakeEvent(form);

    const first = h.root.confirmarRegistrarNovoEnvio(event);
    const second = await h.root.confirmarRegistrarNovoEnvio(fakeEvent(form));

    assert.equal(second, false);
    assert.equal(h.calls.submission, 1);
    assert.equal(form.getAttribute('aria-busy'), 'true');
    assert.equal(form.submit.disabled, true);
    assert.equal(form.submit.textContent, 'Registrando…');

    h.submission.resolve(true);
    assert.equal(await first, true);
    assert.equal(form.getAttribute('aria-busy'), null);
    assert.equal(form.submit.disabled, false);
    assert.equal(form.submit.textContent, 'Registrar novo envio');
});

test('reanálise repetida da mesma pendência é contida antes da segunda gravação', async () => {
    const h = createRoot();
    install(h.root);
    const form = h.forms['form-reanalisar-pendencia'];

    const first = h.root.confirmarReanalisePendencia(fakeEvent(form));
    const second = await h.root.confirmarReanalisePendencia(fakeEvent(form));

    assert.equal(second, false);
    assert.equal(h.calls.reanalysis, 1);
    assert.equal(form.submit.textContent, 'Reanalisando…');
    h.reanalysis.resolve(true);
    await first;
    assert.equal(form.submit.textContent, 'Confirmar reanálise');
});

test('encaminhamento repetido do mesmo bem gera uma única chamada, sem bloquear outro bem', async () => {
    const h = createRoot();
    install(h.root);

    const first = h.root.encaminharCapital('BEM-1');
    const duplicate = await h.root.encaminharCapital('BEM-1');
    const other = h.root.encaminharCapital('BEM-2');

    assert.equal(duplicate, false);
    assert.deepEqual(h.calls.forward, ['BEM-1', 'BEM-2']);
    h.forward.resolve(true);
    assert.equal(await first, true);
    assert.equal(await other, true);
});

test('falha na inventariação libera nova tentativa e restaura botão', async () => {
    const h = createRoot();
    install(h.root);
    const form = h.forms['form-inventario-confirm'];
    const first = h.root.salvarInventariacao(fakeEvent(form));

    assert.equal(h.calls.inventory, 1);
    assert.equal(form.getAttribute('aria-busy'), 'true');
    assert.equal(form.submit.textContent, 'Inventariando…');

    h.inventory.reject(new Error('falha controlada'));
    await assert.rejects(first, /falha controlada/);
    assert.equal(form.getAttribute('aria-busy'), null);
    assert.equal(form.submit.disabled, false);
    assert.equal(form.submit.textContent, 'Confirmar inventariação');
});

test('instalação é idempotente e não empilha wrappers', () => {
    const h = createRoot();
    assert.equal(install(h.root), true);
    const firstWrapper = h.root.confirmarRegistrarNovoEnvio;
    assert.equal(install(h.root), true);
    assert.equal(h.root.confirmarRegistrarNovoEnvio, firstWrapper);
});
