'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    DATA_ERROR_MESSAGES,
    classifyError,
    toRepositoryError,
    withSafeReadRetry
} = require('../../src/application/error-mapper.js');

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

test('retry seletivo repete somente leituras seguras com falha transitória', async () => {
    let attempts = 0;
    const value = await withSafeReadRetry(async () => {
        attempts += 1;
        if (attempts < 3) throw new TypeError('network request failed');
        return 'ok';
    }, { maxAttempts: 3, delayMs: 0 });
    assert.equal(value, 'ok');
    assert.equal(attempts, 3);

    let deniedAttempts = 0;
    await assert.rejects(
        withSafeReadRetry(async () => {
            deniedAttempts += 1;
            throw Object.assign(new Error('RLS'), { code: '42501' });
        }, { maxAttempts: 3, delayMs: 0 }),
        /RLS/
    );
    assert.equal(deniedAttempts, 1);
});
