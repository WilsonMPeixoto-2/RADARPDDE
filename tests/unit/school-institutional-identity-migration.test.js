'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const migrationPath = path.resolve(
    __dirname,
    '../../supabase/migrations/202608060003_school_institutional_identity.sql'
);
const sql = fs.readFileSync(migrationPath, 'utf8');

test('impede campos institucionais vazios', () => {
    assert.match(sql, /schools_institutional_identity_nonempty/);
    for (const field of ['designation', 'denomination', 'inep', 'cnpj', 'sici']) {
        assert.match(sql, new RegExp(`btrim\\(${field}\\) <> ''`));
    }
});

test('impede duplicidades normalizadas de INEP, CNPJ e SICI', () => {
    for (const field of ['inep', 'cnpj', 'sici']) {
        assert.match(sql, new RegExp(`schools_${field}_normalized_key`));
        assert.match(sql, new RegExp(`regexp_replace\\(lower\\(btrim\\(${field}\\)\\)`));
    }
});
