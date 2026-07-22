'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { cloneValue } = require('../../src/data/repository-contract.js');

test('cloneValue usa representação JSON quando structuredClone rejeita funções do estado da interface', () => {
    const source = {
        schoolId: '04.10.001',
        verification: {
            bonification: { extCC: 'Sim' },
            analysis: { extCC: 'Não analisado' }
        },
        onRender() {
            return 'valor exclusivo da interface';
        }
    };

    const cloned = cloneValue(source);

    assert.deepEqual(cloned, {
        schoolId: '04.10.001',
        verification: {
            bonification: { extCC: 'Sim' },
            analysis: { extCC: 'Não analisado' }
        }
    });
    assert.notEqual(cloned, source);
    assert.notEqual(cloned.verification, source.verification);
});
