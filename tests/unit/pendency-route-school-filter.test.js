'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
    syncPendencyPageSchoolFilter
} = require('../../src/integration/navigation-bootstrap.js');

test('rota de Pendências sincroniza a escola com o estado real da Task 9 sem render intermediário', () => {
    const calls = [];
    const root = {
        RadarTask9PendencyPage: {
            getState: () => ({ filters: { schoolId: '' } }),
            setSchoolFilter(schoolId, options) {
                calls.push({ schoolId, options });
                return true;
            }
        }
    };

    assert.equal(syncPendencyPageSchoolFilter(root, '04.31.017'), true);
    assert.deepEqual(calls, [{
        schoolId: '04.31.017',
        options: { render: false }
    }]);
});

test('sincronização não rerenderiza nem repete alteração quando a escola já é a mesma', () => {
    const calls = [];
    const root = {
        RadarTask9PendencyPage: {
            getState: () => ({ filters: { schoolId: '04.31.017' } }),
            setSchoolFilter(schoolId, options) {
                calls.push({ schoolId, options });
                return true;
            }
        }
    };

    assert.equal(syncPendencyPageSchoolFilter(root, '04.31.017'), true);
    assert.deepEqual(calls, []);
});

test('Task 9 expõe setter dedicado para o filtro escolar da rota', () => {
    const source = fs.readFileSync(
        path.resolve(__dirname, '../../src/integration/task-9-pendencias-page.js'),
        'utf8'
    );

    assert.match(source, /function\s+setPendencySchoolFilter\s*\(/);
    assert.match(source, /setSchoolFilter:\s*setPendencySchoolFilter/);
});
