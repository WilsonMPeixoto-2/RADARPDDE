'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    CONTRACT_NAMES,
    JSON_SCHEMAS,
    validateContract,
    assertContract,
    validateCanonicalRecord
} = require('../../src/domain/json-contracts.js');
const { RepositoryError } = require('../../src/data/repository-contract.js');

test('expõe contratos compartilhados para todos os payloads JSONB críticos', () => {
    assert.deepEqual(CONTRACT_NAMES, [
        'bonification',
        'analysis',
        'errors',
        'attempt',
        'cancellation',
        'resolution',
        'rectification',
        'auditDetails',
        'compatibilityPayload',
        'entityCounts',
        'reconciliationReport'
    ]);
    for (const name of CONTRACT_NAMES) {
        assert.equal(JSON_SCHEMAS[name].$id, `radar://contracts/${name}`);
    }
});

test('aceita formatos legados válidos e rejeita tipos estruturalmente inválidos', () => {
    assert.equal(validateContract('bonification', { ata: true, plano: 'N/A' }).ok, true);
    assert.equal(validateContract('analysis', { ata: 'Correto', plano: 'Não analisado' }).ok, true);
    assert.equal(validateContract('errors', ['Assinatura ausente', { codigo: 'VALOR', mensagem: 'Valor divergente' }]).ok, true);
    assert.equal(validateContract('attempt', {
        id: 'tentativa-1',
        numero: 1,
        status: 'aguardando',
        errosEncontrados: ['Assinatura ausente']
    }).ok, true);
    assert.equal(validateContract('rectification', {
        antes: { valor: 1 },
        depois: { valor: 2 },
        justificativa: 'Correção formal'
    }).ok, true);

    assert.equal(validateContract('bonification', []).ok, false);
    assert.equal(validateContract('analysis', 'Correto').ok, false);
    assert.equal(validateContract('errors', { mensagem: 'não é coleção' }).ok, false);
    assert.equal(validateContract('attempt', { numero: 0 }).ok, false);
    assert.equal(validateContract('entityCounts', { schools: -1 }).ok, false);
});

test('assertContract converte falha Ajv em erro funcional sem expor o payload', () => {
    assert.throws(
        () => assertContract('attempt', { id: '', numero: 0 }),
        error => error instanceof RepositoryError
            && error.code === 'VALIDATION_FAILED'
            && error.details.contract === 'attempt'
            && Array.isArray(error.details.errors)
            && !Object.hasOwn(error.details, 'value')
    );
});

test('valida os campos JSONB de registros canônicos antes da persistência', () => {
    assert.deepEqual(validateCanonicalRecord('verifications', {
        id: 'v1',
        bonification: { ata: true },
        analysis: { ata: 'Correto' },
        payload: { extensao: true }
    }), { ok: true, errors: [] });

    const invalid = validateCanonicalRecord('pendencyAttempts', {
        id: 'a1',
        errors: { incorreto: true },
        payload: {}
    });
    assert.equal(invalid.ok, false);
    assert.equal(invalid.errors[0].contract, 'errors');
});
