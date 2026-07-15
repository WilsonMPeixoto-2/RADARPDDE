'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { inspectJavaScript } = require('../../scripts/audit-functional-persistence.js');

test('auditoria funcional inclui a entrada empacotada do cliente Supabase', () => {
    const entrySource = fs.readFileSync(
        path.resolve(__dirname, '../../src/vendor/supabase-client-entry.js'),
        'utf8'
    );

    const result = inspectJavaScript([
        {
            file: 'classic.js',
            source: "function classicHandler() { return localStorage.getItem('radar_pdde_theme'); }"
        },
        {
            file: 'src/vendor/supabase-client-entry.js',
            source: entrySource
        }
    ]);

    assert.ok(result.storageKeys.includes('radar_pdde_theme'));
    assert.ok(Array.isArray(result.mutationFunctions));
});
