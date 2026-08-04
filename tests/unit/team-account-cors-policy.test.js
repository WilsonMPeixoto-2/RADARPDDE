'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const policyModule = import(pathToFileURL(
    path.resolve(__dirname, '../../supabase/functions/_shared/cors-policy.mjs')
).href);

const PRODUCTION_ORIGIN = 'https://radarpdde-fix.vercel.app';

test('preflight aceita a origem canônica de produção mesmo sem variável personalizada', async () => {
    const { corsHeadersForOrigin } = await policyModule;
    const headers = corsHeadersForOrigin(PRODUCTION_ORIGIN, '');

    assert.equal(headers['Access-Control-Allow-Origin'], PRODUCTION_ORIGIN);
    assert.equal(headers['Access-Control-Allow-Methods'], 'POST, OPTIONS');
    assert.match(headers['Access-Control-Allow-Headers'], /authorization/i);
    assert.equal(headers.Vary, 'Origin');
});

test('preflight aceita origem local explicitamente configurada', async () => {
    const { corsHeadersForOrigin } = await policyModule;
    const localOrigin = 'http://127.0.0.1:4175';
    const headers = corsHeadersForOrigin(localOrigin, localOrigin);

    assert.equal(headers['Access-Control-Allow-Origin'], localOrigin);
});

test('configuração aceita várias origens delimitadas por vírgula ou espaço', async () => {
    const { allowedOrigins } = await policyModule;
    const origins = allowedOrigins('https://hml.example.gov.br, http://127.0.0.1:4175\nhttps://qa.example.gov.br');

    assert.equal(origins.has('https://hml.example.gov.br'), true);
    assert.equal(origins.has('http://127.0.0.1:4175'), true);
    assert.equal(origins.has('https://qa.example.gov.br'), true);
    assert.equal(origins.has(PRODUCTION_ORIGIN), true);
});

test('origem não autorizada é recusada sem fallback permissivo', async () => {
    const { corsHeadersForOrigin } = await policyModule;

    assert.throws(
        () => corsHeadersForOrigin('https://origem-maliciosa.example', '*'),
        error => error instanceof Error
            && error.message.includes('ORIGIN_DENIED')
    );
});

test('origens inválidas, com credenciais ou protocolos não HTTP são ignoradas', async () => {
    const { allowedOrigins } = await policyModule;
    const origins = allowedOrigins('*, null, javascript:alert(1), https://usuario:senha@example.com');

    assert.equal(origins.has('*'), false);
    assert.equal(origins.has('null'), false);
    assert.equal(origins.has('javascript:alert(1)'), false);
    assert.equal(origins.has('https://example.com'), false);
});
