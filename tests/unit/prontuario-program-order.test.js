'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const modulePath = require.resolve('../../src/integration/prontuario-operational-ux.js');

function harness(programIds) {
    const originalDocument = globalThis.document;
    const originalApi = globalThis.RadarProntuarioOperationalUx;
    const originalRenderer = globalThis.renderProntuario;
    const originalCompetence = globalThis.RadarCompetencia;
    const rows = [];
    const originalNodes = new Map();
    const mutations = [];

    for (const programId of programIds) {
        const programRows = [];
        for (const documentKey of ['extCC', 'extINV']) {
            const contextCell = {
                querySelector() { return null; }
            };
            const row = {
                dataset: { programId, documentKey },
                programMarker: { programId, documentKey },
                classList: { add() {}, contains() { return false; } },
                querySelector(selector) {
                    return selector === 'td[rowspan]' && documentKey === 'extCC' ? contextCell : null;
                },
                querySelectorAll() { return []; }
            };
            rows.push(row);
            programRows.push(row);
        }
        originalNodes.set(programId, programRows);
    }

    const tbody = {
        insertBefore(row, reference) {
            mutations.push({ row, reference });
            const previous = rows.indexOf(row);
            assert.notEqual(previous, -1, 'the existing row must be moved, never recreated');
            rows.splice(previous, 1);
            const next = reference == null ? rows.length : rows.indexOf(reference);
            assert.notEqual(next, -1, 'reference row must belong to the same tbody');
            rows.splice(next, 0, row);
            return row;
        },
        appendChild(row) { return this.insertBefore(row, null); }
    };
    const document = {
        querySelectorAll(selector) {
            return selector === '#prontuario-verif-rows tr[data-program-id][data-document-key]'
                ? rows.slice() : [];
        },
        querySelector() { return null; },
        getElementById(id) {
            return id === 'prontuario-verif-rows' ? tbody : null;
        }
    };
    delete globalThis.RadarProntuarioOperationalUx;
    delete globalThis.renderProntuario;
    delete globalThis.RadarCompetencia;
    globalThis.document = document;
    delete require.cache[modulePath];
    require(modulePath);
    const api = globalThis.RadarProntuarioOperationalUx;

    return {
        enhance() {
            assert.equal(api.enhance(new Date('2026-10-18T12:00:00Z'), 'ESC-TEST'), true);
        },
        order() {
            return rows.filter(row => row.dataset.documentKey === 'extCC')
                .map(row => row.dataset.programId);
        },
        mutations,
        assertIntegrity() {
            for (const [id, groupRows] of originalNodes) {
                assert.deepEqual(rows.filter(row => row.dataset.programId === id), groupRows);
                assert.deepEqual(
                    groupRows.map(row => row.programMarker),
                    [{ programId: id, documentKey: 'extCC' }, { programId: id, documentKey: 'extINV' }]
                );
            }
        },
        cleanup() {
            delete require.cache[modulePath];
            if (originalDocument === undefined) delete globalThis.document;
            else globalThis.document = originalDocument;
            if (originalApi === undefined) delete globalThis.RadarProntuarioOperationalUx;
            else globalThis.RadarProntuarioOperationalUx = originalApi;
            if (originalRenderer === undefined) delete globalThis.renderProntuario;
            else globalThis.renderProntuario = originalRenderer;
            if (originalCompetence === undefined) delete globalThis.RadarCompetencia;
            else globalThis.RadarCompetencia = originalCompetence;
        }
    };
}

function verify(source, expected, expectedMoves = null) {
    const h = harness(source);
    try {
        h.enhance();
        assert.deepEqual(h.order(), expected);
        h.assertIntegrity();
        if (expectedMoves !== null) {
            assert.equal(h.mutations.length, expectedMoves * 2, 'only the necessary two-row program groups move');
        }
        const count = h.mutations.length;
        h.enhance();
        assert.deepEqual(h.order(), expected);
        assert.equal(h.mutations.length, count, 'repeated enhance must not move already ordered nodes');
        h.assertIntegrity();
    } finally {
        h.cleanup();
    }
}

test('ordena Básico, Qualidade e Equidade, mantendo a ordem relativa dos demais programas', () => {
    verify(
        ['RECURSOS', 'ADOLESCENCIAS', 'PROEC', 'CONECTADA', 'BASIC', 'ED_FAMILIA', 'LEITURA', 'TEMPO_APRENDER'],
        ['BASIC', 'CONECTADA', 'ADOLESCENCIAS', 'PROEC', 'ED_FAMILIA', 'LEITURA', 'TEMPO_APRENDER', 'RECURSOS']
    );
});

test('quando só o par Qualidade está invertido, move exclusivamente Educação Conectada', () => {
    verify(
        ['BASIC', 'PROEC', 'ADOLESCENCIAS', 'LEITURA', 'CONECTADA', 'TEMPO_APRENDER', 'RECURSOS'],
        ['BASIC', 'PROEC', 'CONECTADA', 'ADOLESCENCIAS', 'LEITURA', 'TEMPO_APRENDER', 'RECURSOS'],
        1
    );
});

test('não movimenta o DOM quando a ordem já está correta', () => {
    verify(
        ['BASIC', 'PROEC', 'CONECTADA', 'ADOLESCENCIAS', 'ED_FAMILIA', 'RECURSOS'],
        ['BASIC', 'PROEC', 'CONECTADA', 'ADOLESCENCIAS', 'ED_FAMILIA', 'RECURSOS'],
        0
    );
});

test('mantém ordem com apenas um dos dois programas especiais', () => {
    verify(['BASIC', 'ADOLESCENCIAS', 'PROEC', 'RECURSOS'],
        ['BASIC', 'ADOLESCENCIAS', 'PROEC', 'RECURSOS'], 0);
    verify(['BASIC', 'PROEC', 'CONECTADA', 'RECURSOS'],
        ['BASIC', 'PROEC', 'CONECTADA', 'RECURSOS'], 0);
});

test('coloca programas desconhecidos depois dos grupos conhecidos sem inventar categoria', () => {
    verify(['FUTURO_X', 'RECURSOS', 'BASIC', 'PROEC', 'ADOLESCENCIAS', 'CONECTADA', 'FUTURO_Y'],
        ['BASIC', 'PROEC', 'CONECTADA', 'ADOLESCENCIAS', 'RECURSOS', 'FUTURO_X', 'FUTURO_Y']);
});
