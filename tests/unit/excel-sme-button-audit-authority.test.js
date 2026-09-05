'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const integration = require('../../src/integration/excel-export-integration.js');

function createButton() {
    let clickHandler = null;
    const button = {
        dataset: {},
        className: 'btn btn-primary',
        disabled: false,
        textContent: 'Base',
        title: '',
        classList: {
            add() {},
            remove() {}
        },
        removeAttribute() {},
        setAttribute() {},
        cloneNode() { return createButton(); },
        addEventListener(type, handler) {
            if (type === 'click') clickHandler = handler;
        },
        async click() {
            assert.equal(typeof clickHandler, 'function');
            await clickHandler({ target: button, currentTarget: button });
        }
    };
    return button;
}

test('botão Excel SME usa a autoridade auditada instalada depois da integração', async () => {
    const previous = globalThis.exportDataExcelSme;
    let auditedCalls = 0;
    globalThis.exportDataExcelSme = async options => {
        auditedCalls += 1;
        assert.equal(options.state.activeCompetenciaKey, '2026-07');
        return { ok: false, auditFailed: true };
    };

    try {
        const document = { querySelectorAll() { return []; } };
        const button = integration.createSmeButton(createButton(), {
            document,
            getState: () => ({
                activeCompetenciaKey: '2026-07',
                competencias: [{ key: '2026-07' }],
                escolas: [],
                programas: [],
                verificacoes: {},
                pendencias: []
            })
        });

        await button.click();
        assert.equal(auditedCalls, 1);
    } finally {
        if (previous === undefined) delete globalThis.exportDataExcelSme;
        else globalThis.exportDataExcelSme = previous;
    }
});
