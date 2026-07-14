'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migration = fs.readFileSync(
    path.resolve(
        __dirname,
        '../../supabase/migrations/202607130007_configuration_audit_coverage.sql'
    ),
    'utf8'
);

const auditedTables = [
    'app_config',
    'programs',
    'controllers',
    'inventory_team_members',
    'competences',
    'school_programs'
];

test('audita parâmetros, cadastros e vínculos que alteram o comportamento do sistema', () => {
    auditedTables.forEach(tableName => {
        assert.match(
            migration,
            new RegExp(
                `create\\s+trigger\\s+${tableName}_capture_audit`
                + `[\\s\\S]*?after\\s+insert\\s+or\\s+update\\s+or\\s+delete`
                + `[\\s\\S]*?on\\s+public\\.${tableName}`
                + `[\\s\\S]*?for\\s+each\\s+row\\s+execute\\s+function\\s+public\\.capture_audit_event\\(\\)`,
                'i'
            )
        );
    });
});

test('não cria uma segunda função de auditoria paralela', () => {
    assert.doesNotMatch(migration, /create\s+(?:or\s+replace\s+)?function/i);
    assert.equal(
        (migration.match(/execute\s+function\s+public\.capture_audit_event\(\)/gi) || []).length,
        auditedTables.length
    );
});
