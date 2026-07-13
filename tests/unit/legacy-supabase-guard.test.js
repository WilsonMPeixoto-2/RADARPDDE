'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');

test('integração Supabase direta e antiga permanece explicitamente bloqueada', () => {
    const appSource = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
    const configSource = fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8');

    assert.match(
        appSource,
        /legacyDirectSupabaseEnabled\s*=\s*runtimeConfig\.features\?\.legacyDirectSupabaseEnabled\s*===\s*true/
    );
    assert.match(
        appSource,
        /const\s+supabaseClient\s*=\s*\(legacyDirectSupabaseEnabled\s*&&/
    );
    assert.match(configSource, /legacyDirectSupabaseEnabled\s*:\s*false/);
});
