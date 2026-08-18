'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '../..');
const vercelConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'vercel.json'), 'utf8'));

function headerMap() {
    const rule = (vercelConfig.headers || []).find(item => item.source === '/(.*)');
    assert.ok(rule, 'deve existir regra global de headers');
    return new Map((rule.headers || []).map(item => [item.key.toLowerCase(), item.value]));
}

test('Vercel aplica headers de segurança compatíveis com o frontend atual', () => {
    const headers = headerMap();

    assert.equal(headers.get('x-content-type-options'), 'nosniff');
    assert.equal(headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.equal(headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.equal(headers.get('permissions-policy'), 'camera=(), microphone=(), geolocation=()');
    assert.equal(headers.has('content-security-policy'), false, 'CSP rígida fica fora desta etapa');
});
