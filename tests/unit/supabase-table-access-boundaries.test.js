'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'src');

const SUPABASE_TABLES = new Set([
    'app_config',
    'programs',
    'profiles',
    'user_profiles',
    'user_school_scopes',
    'controllers',
    'inventory_team_members',
    'schools',
    'school_programs',
    'competences',
    'verifications',
    'pendencies',
    'pendency_attempts',
    'pendency_contacts',
    'assets',
    'registered_invoices',
    'administrative_logs',
    'data_import_runs',
    'audit_events'
]);

const AUTH_DIRECT_TABLES = new Set([
    'user_profiles',
    'user_school_scopes'
]);

function walk(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const absolute = path.join(directory, entry.name);
        return entry.isDirectory() ? walk(absolute) : [absolute];
    });
}

function directTableAccesses(source) {
    const accesses = [];
    const pattern = /\.from\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    let match;
    while ((match = pattern.exec(source))) {
        if (SUPABASE_TABLES.has(match[1])) accesses.push(match[1]);
    }
    return accesses;
}

function relative(file) {
    return path.relative(ROOT, file).split(path.sep).join('/');
}

test('acesso direto a tabelas Supabase fica confinado à camada de dados e ao escopo auth-only', () => {
    const violations = [];

    for (const file of walk(SRC).filter(candidate => candidate.endsWith('.js'))) {
        const filePath = relative(file);
        const tables = directTableAccesses(fs.readFileSync(file, 'utf8'));

        for (const table of tables) {
            if (filePath.startsWith('src/data/')) continue;
            if (filePath === 'src/auth/session-service.js' && AUTH_DIRECT_TABLES.has(table)) continue;
            violations.push(`${filePath} -> ${table}`);
        }
    }

    assert.deepEqual(
        violations,
        [],
        `Acesso direto a tabela Supabase fora das fronteiras permitidas:\n${violations.join('\n')}`
    );
});

test('serviço de sessão não amplia silenciosamente sua exceção para tabelas operacionais', () => {
    const sessionService = path.join(SRC, 'auth', 'session-service.js');
    const tables = new Set(directTableAccesses(fs.readFileSync(sessionService, 'utf8')));

    assert.deepEqual(
        [...tables].sort(),
        [...AUTH_DIRECT_TABLES].sort(),
        'Qualquer nova tabela acessada diretamente pelo serviço de sessão exige revisão arquitetural explícita.'
    );
});
