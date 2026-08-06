'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    collectInstitutionalInput,
    normalizeProfile
} = require('../../src/integration/school-form-integrity.js');

function documentWith(values) {
    return {
        getElementById(id) {
            return Object.prototype.hasOwnProperty.call(values, id)
                ? { value: values[id] }
                : null;
        }
    };
}

test('completa o comando de cadastro com valores institucionais informados no formulário', () => {
    const input = collectInstitutionalInput(documentWith({
        'edit-school-code': 'ESC-999',
        'edit-designation': '04.01.999',
        'edit-denomination': 'Escola Municipal Nova',
        'edit-inep': '33099999',
        'edit-cnpj': '12.345.678/0001-90',
        'edit-sici': 'SICI-999'
    }), {
        controllerId: 'CTRL-1',
        initialCompetence: '2026-05'
    });

    assert.deepEqual(input, {
        id: 'ESC-999',
        designation: '04.01.999',
        denomination: 'Escola Municipal Nova',
        inep: '33099999',
        cnpj: '12.345.678/0001-90',
        sici: 'SICI-999',
        controllerId: 'CTRL-1',
        initialCompetence: '2026-05'
    });
});

test('preserva o id existente durante a edição', () => {
    const input = collectInstitutionalInput(documentWith({
        'edit-school-code': 'OUTRO-ID',
        'edit-designation': '04.01.001',
        'edit-denomination': 'Escola Original',
        'edit-inep': '33000001',
        'edit-cnpj': '00.000.000/0001-00',
        'edit-sici': 'SICI-001'
    }), { id: 'ESC-1' });

    assert.equal(input.id, 'ESC-1');
});

test('normaliza aliases do perfil assistente', () => {
    assert.equal(normalizeProfile('Assistente de Verbas Federais'), 'assistente');
    assert.equal(normalizeProfile('federal_assistant'), 'assistente');
});
