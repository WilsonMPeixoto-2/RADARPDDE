'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { inspectJavaScript } = require('../../scripts/audit-functional-persistence.js');

test('auditoria funcional aceita scripts clássicos e módulos ES', () => {
    const result = inspectJavaScript([
        {
            file: 'classic.js',
            source: "function classicHandler() { return localStorage.getItem('radar_pdde_theme'); }"
        },
        {
            file: 'module.js',
            source: "import { createClient } from '@supabase/supabase-js'; export { createClient };"
        }
    ]);

    assert.ok(result.storageKeys.includes('radar_pdde_theme'));
    assert.ok(Array.isArray(result.mutationFunctions));
});
