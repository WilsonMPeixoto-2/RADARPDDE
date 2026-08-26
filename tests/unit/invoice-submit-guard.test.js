'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const interactions = require('../../src/integration/shared-interactions.js');

function createHarness({ label = 'Salvar Gasto' } = {}) {
    const attributes = new Map();
    const submitButton = {
        disabled: false,
        textContent: label
    };
    const cancelButton = { disabled: false };
    const closeButton = { disabled: false };
    const modal = {
        querySelectorAll() {
            return [cancelButton, closeButton];
        }
    };
    const form = {
        id: 'form-dados-nota',
        setAttribute(name, value) {
            attributes.set(name, String(value));
        },
        getAttribute(name) {
            return attributes.has(name) ? attributes.get(name) : null;
        },
        querySelector(selector) {
            return selector === 'button[type="submit"]' ? submitButton : null;
        },
        querySelectorAll() {
            return [cancelButton];
        },
        closest(selector) {
            return selector === '.modal-overlay' ? modal : null;
        }
    };
    let prevented = 0;
    let stopped = 0;
    const event = {
        target: form,
        currentTarget: form,
        preventDefault() {
            prevented += 1;
        },
        stopImmediatePropagation() {
            stopped += 1;
        }
    };
    let calls = 0;
    const resolvers = [];
    const handler = () => {
        calls += 1;
        return new Promise(resolve => resolvers.push(resolve));
    };
    return {
        form,
        submitButton,
        cancelButton,
        closeButton,
        event,
        handler,
        calls: () => calls,
        prevented: () => prevented,
        stopped: () => stopped,
        release(value = true) {
            resolvers.splice(0).forEach(resolve => resolve(value));
        }
    };
}

test('guard de Nota Fiscal aceita somente uma intenção enquanto o primeiro save está pendente', async () => {
    const harness = createHarness();

    const first = interactions.guardInvoiceSubmission(harness.event, harness.handler);
    const second = interactions.guardInvoiceSubmission(harness.event, harness.handler);

    assert.equal(harness.calls(), 1, 'somente a primeira intenção pode alcançar o handler de gravação');
    assert.equal(harness.form.getAttribute('aria-busy'), 'true');
    assert.equal(harness.submitButton.disabled, true);
    assert.equal(harness.submitButton.textContent, 'Salvando…');
    assert.equal(harness.cancelButton.disabled, true);
    assert.equal(harness.closeButton.disabled, true);
    assert.equal(harness.prevented(), 2);
    assert.equal(harness.stopped(), 2);

    harness.release();
    const [firstResult, secondResult] = await Promise.all([first, second]);

    assert.equal(firstResult, true);
    assert.equal(secondResult, false);
    assert.equal(harness.form.getAttribute('aria-busy'), 'false');
    assert.equal(harness.submitButton.disabled, false);
    assert.equal(harness.submitButton.textContent, 'Salvar Gasto');
    assert.equal(harness.cancelButton.disabled, false);
    assert.equal(harness.closeButton.disabled, false);
});

test('guard preserva o rótulo Salvar Alterações após concluir uma edição', async () => {
    const harness = createHarness({ label: 'Salvar Alterações' });

    const pending = interactions.guardInvoiceSubmission(harness.event, harness.handler);
    assert.equal(harness.submitButton.textContent, 'Salvando…');
    harness.release('ok');

    assert.equal(await pending, 'ok');
    assert.equal(harness.submitButton.textContent, 'Salvar Alterações');
});

test('guard sempre restaura a interface quando o handler falha', async () => {
    const harness = createHarness();
    const error = new Error('Falha controlada PR1');

    await assert.rejects(
        interactions.guardInvoiceSubmission(harness.event, async () => {
            throw error;
        }),
        error
    );

    assert.equal(harness.form.getAttribute('aria-busy'), 'false');
    assert.equal(harness.submitButton.disabled, false);
    assert.equal(harness.submitButton.textContent, 'Salvar Gasto');
    assert.equal(harness.cancelButton.disabled, false);
    assert.equal(harness.closeButton.disabled, false);
});
