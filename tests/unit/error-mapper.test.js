'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    DATA_ERROR_MESSAGES,
    classifyError,
    toRepositoryError,
    showDataOperationError
} = require('../../src/application/error-mapper.js');
const { RepositoryError } = require('../../src/data/repository-contract.js');

test('traduz falhas técnicas para as categorias e mensagens funcionais obrigatórias', () => {
    assert.equal(classifyError({ status: 401 }), 'SESSION_EXPIRED');
    assert.equal(classifyError({ code: '42501' }), 'PERMISSION_DENIED');
    assert.equal(classifyError({ status: 409 }), 'OPTIMISTIC_CONFLICT');
    assert.equal(classifyError(new TypeError('Failed to fetch')), 'NETWORK_UNAVAILABLE');
    assert.match(DATA_ERROR_MESSAGES.IMPORT_RECONCILIATION_FAILED, /reconciliação/i);

    const error = toRepositoryError({ code: 'PGRST301', message: 'JWT expired' });
    assert.equal(error.code, 'SESSION_EXPIRED');
    assert.equal(error.message, DATA_ERROR_MESSAGES.SESSION_EXPIRED);
});


test('mensagem pública canoniza falha técnica e preserva orientação de validação de negócio', () => {
    const session = showDataOperationError(new RepositoryError(
        'SESSION_EXPIRED',
        'Sessão expirada durante o salvamento.',
        { operation: 'school:save' }
    ));
    assert.equal(session.code, 'SESSION_EXPIRED');
    assert.match(session.message, /sessão expirou/i);
    assert.match(session.message, /código do incidente/i);
    assert.equal(session.operation, 'school:save');

    const business = showDataOperationError(new RepositoryError(
        'FISCAL_NOTE_REQUIRED',
        'Cadastre pelo menos uma Nota Fiscal antes de marcar como Correto.',
        { operation: 'setTechnicalAnalysis' }
    ));
    assert.equal(business.code, 'VALIDATION_FAILED');
    assert.match(business.message, /cadastre pelo menos uma Nota Fiscal/i);
    assert.equal(business.operation, 'setTechnicalAnalysis');
    assert.equal(business.details.sourceCode, 'FISCAL_NOTE_REQUIRED');
});
