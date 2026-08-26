'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const APP_PATH = path.resolve(__dirname, '../../app.js');
const source = fs.readFileSync(APP_PATH, 'utf8');

function extractFunction(name) {
    const marker = `async function ${name}(`;
    const start = source.indexOf(marker);
    assert.notEqual(start, -1, `${name} deve existir em app.js`);
    const bodyStart = source.indexOf('{', start);
    let depth = 0;
    let quote = '';
    let escaped = false;
    for (let index = bodyStart; index < source.length; index += 1) {
        const char = source[index];
        if (quote) {
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === quote) {
                quote = '';
            }
            continue;
        }
        if (char === '"' || char === "'" || char === '`') {
            quote = char;
            continue;
        }
        if (char === '{') depth += 1;
        if (char === '}') {
            depth -= 1;
            if (depth === 0) return source.slice(start, index + 1);
        }
    }
    throw new Error(`Não foi possível extrair ${name}.`);
}

function createHarness({ label = 'Salvar Gasto' } = {}) {
    const attributes = new Map();
    const submitButton = {
        disabled: false,
        textContent: label,
        innerText: label
    };
    const cancelButton = { disabled: false };
    const form = {
        dataset: {},
        setAttribute(name, value) {
            attributes.set(name, String(value));
        },
        getAttribute(name) {
            return attributes.has(name) ? attributes.get(name) : null;
        },
        removeAttribute(name) {
            attributes.delete(name);
        },
        querySelector(selector) {
            if (selector === 'button[type="submit"]') return submitButton;
            if (selector.includes('btn-secondary')) return cancelButton;
            return null;
        },
        querySelectorAll(selector) {
            if (selector.includes('btn-secondary') || selector.includes('btn-close')) return [cancelButton];
            return [];
        }
    };
    const values = {
        'nota-id': { value: '' },
        'nota-escola-id': { value: 'ESC-1' },
        'nota-comp-key': { value: '2026-08_BASIC' },
        'nota-desc': { value: 'Material pedagógico' },
        'nota-tipo': { value: 'consumo' },
        'nota-numero': { value: 'NF-PR1' },
        'nota-valor': { value: '150.00' },
        'form-dados-nota': form
    };
    let calls = 0;
    const resolvers = [];
    const context = {
        invoiceSubmissionLocks: new WeakSet(),
        invoiceSubmissionUiState: new WeakMap(),
        getRadarAccessProfile: () => 'controlador',
        document: {
            getElementById(id) {
                return values[id] || null;
            },
            querySelector(selector) {
                if (selector === '#form-dados-nota button[type="submit"]') return submitButton;
                return null;
            }
        },
        radarInvoiceService: {
            save() {
                calls += 1;
                return new Promise(resolve => {
                    resolvers.push(() => resolve({ ok: true, value: { warnings: [] } }));
                });
            }
        },
        rebuildOperationalIndexes() {},
        closeModal() {},
        renderProntuario() {},
        updateAlertsBell() {},
        reportRadarActionError() {},
        alert() {},
        Set,
        Number,
        parseFloat,
        console
    };
    vm.createContext(context);
    vm.runInContext(`${extractFunction('salvarDadosNota')}; this.salvarDadosNota = salvarDadosNota;`, context);
    return {
        context,
        form,
        submitButton,
        cancelButton,
        calls: () => calls,
        releaseAll() {
            resolvers.splice(0).forEach(resolve => resolve());
        }
    };
}

function eventFor(form) {
    return {
        currentTarget: form,
        target: form,
        preventDefault() {}
    };
}

test('salvarDadosNota bloqueia a segunda entrada antes do primeiro await', async () => {
    const harness = createHarness();
    const event = eventFor(harness.form);

    const first = harness.context.salvarDadosNota(event);
    const second = harness.context.salvarDadosNota(event);

    assert.equal(harness.calls(), 1, 'somente a primeira intenção pode alcançar InvoiceService.save');
    assert.equal(harness.form.getAttribute('aria-busy'), 'true');
    assert.equal(harness.submitButton.disabled, true);
    assert.equal(harness.submitButton.textContent, 'Salvando…');
    assert.equal(harness.cancelButton.disabled, true);

    harness.releaseAll();
    await Promise.all([first, second]);

    assert.equal(harness.form.getAttribute('aria-busy'), 'false');
    assert.equal(harness.submitButton.disabled, false);
    assert.equal(harness.submitButton.textContent, 'Salvar Gasto');
    assert.equal(harness.cancelButton.disabled, false);
});

test('salvarDadosNota preserva o rótulo da edição após liberar o lock', async () => {
    const harness = createHarness({ label: 'Salvar Alterações' });
    harness.context.document.getElementById('nota-id').value = 'nota-1';
    const event = eventFor(harness.form);

    const pending = harness.context.salvarDadosNota(event);
    assert.equal(harness.submitButton.textContent, 'Salvando…');
    harness.releaseAll();
    await pending;

    assert.equal(harness.submitButton.textContent, 'Salvar Alterações');
});
