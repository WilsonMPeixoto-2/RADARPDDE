'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    createPositionOptions,
    normalizeFloatingName,
    nextExpandedState
} = require('../../src/integration/floating-ui-bootstrap.js');

test('configura posicionamento com proteção de viewport', () => {
    const calls = [];
    const api = {
        offset(value) { calls.push(['offset', value]); return { name: 'offset' }; },
        flip(options) { calls.push(['flip', options]); return { name: 'flip' }; },
        shift(options) { calls.push(['shift', options]); return { name: 'shift' }; },
        size(options) { calls.push(['size', typeof options.apply]); return { name: 'size' }; }
    };

    const options = createPositionOptions(api, 'bottom-end');

    assert.equal(options.placement, 'bottom-end');
    assert.equal(options.strategy, 'fixed');
    assert.deepEqual(options.middleware.map(item => item.name), ['offset', 'flip', 'shift', 'size']);
    assert.deepEqual(calls.slice(0, 3), [
        ['offset', 8],
        ['flip', { padding: 8 }],
        ['shift', { padding: 8 }]
    ]);
});

test('aceita somente flutuantes conhecidos e mantém exclusividade', () => {
    assert.equal(normalizeFloatingName('alerts'), 'alerts');
    assert.equal(normalizeFloatingName('profile'), 'profile');
    assert.equal(normalizeFloatingName('search'), 'search');
    assert.equal(normalizeFloatingName('unknown'), null);
    assert.deepEqual(nextExpandedState('alerts', 'profile'), {
        alerts: false,
        profile: true,
        search: false
    });
});
