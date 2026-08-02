'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    keyActionFor,
    destinationForResult,
    shouldOpenForQuery
} = require('../../src/integration/global-search.js');

test('interpreta teclado de combobox sem criar atalho global', () => {
    assert.deepEqual(keyActionFor('ArrowDown', -1, 3), { type: 'move', index: 0 });
    assert.deepEqual(keyActionFor('ArrowUp', 0, 3), { type: 'move', index: 2 });
    assert.deepEqual(keyActionFor('Enter', 1, 3), { type: 'activate', index: 1 });
    assert.deepEqual(keyActionFor('Escape', 1, 3), { type: 'close', index: -1 });
    assert.equal(keyActionFor('k', -1, 3, { ctrlKey: true }), null);
});

test('abre o painel somente para consultas úteis', () => {
    assert.equal(shouldOpenForQuery('a'), false);
    assert.equal(shouldOpenForQuery('  Herbert  '), true);
});

test('traduz resultados apenas em destinos de consulta', () => {
    assert.deepEqual(destinationForResult({
        type: 'school',
        route: { view: 'prontuario', param: '04.31.026' }
    }), {
        view: 'prontuario',
        param: '04.31.026',
        filters: {}
    });

    assert.deepEqual(destinationForResult({
        type: 'pendency',
        route: { view: 'pendencias', filters: { escola: '04.31.026' } }
    }), {
        view: 'pendencias',
        param: null,
        filters: { escola: '04.31.026' }
    });

    assert.equal(destinationForResult({ type: 'action', mutation: true }), null);
});
