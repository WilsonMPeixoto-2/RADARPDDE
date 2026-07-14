'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.resolve(__dirname, '../../supabase/migrations/20260714220146_preconnection_reversible_import.sql');

test('substituição atômica do snapshot declara WHERE em todas as exclusões totais', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const functionStart = sql.indexOf('create or replace function public.apply_functional_snapshot');
    const functionEnd = sql.indexOf('revoke all on function public.apply_functional_snapshot', functionStart);
    const body = sql.slice(functionStart, functionEnd);
    const unsafeDeletes = [...body.matchAll(/delete\s+from\s+public\.[a-z_]+\s*;/gi)].map(match => match[0]);

    assert.deepEqual(unsafeDeletes, []);
    assert.equal((body.match(/delete\s+from\s+public\.[a-z_]+\s+where\s+true\s*;/gi) || []).length, 12);
});
