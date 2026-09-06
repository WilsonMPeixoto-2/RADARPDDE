'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const operationKey = require('../../src/domain/operation-key.js');

test('gera UUID v4 e preserva chave existente em retry', () => {
    let sequence = 0;
    const cryptoRef = {
        randomUUID() {
            sequence += 1;
            return sequence === 1
                ? '11111111-2222-4333-8444-555555555555'
                : 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
        }
    };

    const first = operationKey.create(cryptoRef);
    const second = operationKey.create(cryptoRef);

    assert.equal(first, '11111111-2222-4333-8444-555555555555');
    assert.equal(operationKey.reuse(first), first);
    assert.notEqual(second, first);
    assert.equal(operationKey.persistentId('nota', first), `nota-${first}`);
});

test('usa getRandomValues como fallback criptográfico', () => {
    const cryptoRef = {
        getRandomValues(bytes) {
            for (let index = 0; index < bytes.length; index += 1) bytes[index] = index + 1;
            return bytes;
        }
    };

    const key = operationKey.create(cryptoRef);
    assert.match(key, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});

test('falha fechado sem fonte criptográfica e rejeita chave inválida', () => {
    assert.throws(() => operationKey.create({}), /SECURE_RANDOM_UNAVAILABLE/);
    assert.throws(() => operationKey.reuse('nao-e-uuid'), /OPERATION_KEY_INVALID/);
});
