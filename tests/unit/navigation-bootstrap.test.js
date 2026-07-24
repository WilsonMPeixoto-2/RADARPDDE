'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    filterPendenciesBySchool,
    buildSchoolHref,
    extractSchoolIdFromOnclick,
    shouldHandleInternalClick,
    routeForProntuarioTab
} = require('../../src/integration/navigation-bootstrap.js');

test('filtra pendências ativas e resolvidas pela escola solicitada', () => {
    const pendencies = [
        { id: 1, escolaId: '04.31.026', status: 'Aberta' },
        { id: 2, escolaId: '04.31.018', status: 'Resolvida' },
        { id: 3, escolaId: '04.31.026', status: 'Resolvida' }
    ];
    assert.deepEqual(filterPendenciesBySchool(pendencies, '04.31.026').map(item => item.id), [1, 3]);
    assert.equal(filterPendenciesBySchool(pendencies, null), pendencies);
});

test('gera links diretos para prontuário e pendências da escola', () => {
    assert.equal(buildSchoolHref('04.31.026'), '/escolas/04.31.026');
    assert.equal(buildSchoolHref('04.31.026', 'pendencias'), '/escolas/04.31.026/pendencias');
});

test('extrai identificador de chamadas legadas do prontuário', () => {
    assert.equal(
        extractSchoolIdFromOnclick("switchView('prontuario', '04.31.026')"),
        '04.31.026'
    );
    assert.equal(extractSchoolIdFromOnclick("switchView('dashboard')"), null);
});

test('intercepta apenas clique primário simples em link interno', () => {
    assert.equal(shouldHandleInternalClick({
        defaultPrevented: false,
        button: 0,
        metaKey: false,
        ctrlKey: false,
        shiftKey: false,
        altKey: false
    }), true);
    for (const event of [
        { defaultPrevented: true, button: 0 },
        { defaultPrevented: false, button: 1 },
        { defaultPrevented: false, button: 0, ctrlKey: true },
        { defaultPrevented: false, button: 0, metaKey: true },
        { defaultPrevented: false, button: 0, shiftKey: true },
        { defaultPrevented: false, button: 0, altKey: true }
    ]) {
        assert.equal(shouldHandleInternalClick(event), false);
    }
});

test('traduz a aba do prontuário em rota canônica', () => {
    assert.deepEqual(routeForProntuarioTab('04.31.026', 'tab-pendencias'), {
        view: 'prontuario',
        param: '04.31.026',
        section: 'pendencias'
    });
    assert.deepEqual(routeForProntuarioTab('04.31.026', 'tab-capital'), {
        view: 'prontuario',
        param: '04.31.026',
        section: null
    });
});
