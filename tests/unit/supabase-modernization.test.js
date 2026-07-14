'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');

function read(relativePath) {
    return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function exists(relativePath) {
    return fs.existsSync(path.join(ROOT, relativePath));
}

test('ferramentas Supabase modernas estão fixadas e reproduzíveis', () => {
    const pkg = JSON.parse(read('package.json'));

    ['supabase', '@supabase/supabase-js', 'esbuild'].forEach(dependency => {
        assert.equal(typeof pkg.devDependencies?.[dependency], 'string', `${dependency} deve estar em devDependencies.`);
        assert.match(pkg.devDependencies[dependency], /^\d+\.\d+\.\d+$/, `${dependency} deve usar versão exata.`);
    });

    assert.equal(pkg.scripts['supabase:start'], 'supabase start');
    assert.equal(pkg.scripts['supabase:stop'], 'supabase stop --no-backup');
    assert.equal(pkg.scripts['supabase:test:db'], 'supabase test db supabase/tests/database');
    assert.equal(pkg.scripts['supabase:gen:types'], 'supabase gen types typescript --local --schema public > src/types/database.types.ts');
    assert.equal(pkg.scripts['build:supabase-client'], 'node scripts/build-supabase-client.mjs');
    assert.equal(pkg.scripts['check:generated'], 'node scripts/check-generated-artifacts.js');
});

test('ambiente local, tipos, pgTAP e bundle do cliente estão versionados', () => {
    [
        'supabase/config.toml',
        'supabase/tests/database/schema.test.sql',
        'supabase/tests/database/rls.test.sql',
        'supabase/tests/database/invoice-rpc.test.sql',
        'src/types/database.types.ts',
        'src/vendor/supabase-client-entry.js',
        'vendor/supabase-client.js',
        'scripts/build-supabase-client.mjs',
        'scripts/check-generated-artifacts.js'
    ].forEach(file => assert.ok(exists(file), `${file} deve existir.`));
});

test('HTML não usa mais CDN flutuante do Supabase', () => {
    const html = read('index.html');
    assert.doesNotMatch(html, /cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2/i);
    assert.match(html, /<script\s+src=["']vendor\/supabase-client\.js["']><\/script>/i);
});

test('CI executa pgTAP, valida tipos e bundle gerados', () => {
    const workflow = read('.github/workflows/supabase-readiness.yml');
    assert.match(workflow, /npm\s+run\s+supabase:start/i);
    assert.match(workflow, /npm\s+run\s+supabase:test:db/i);
    assert.match(workflow, /npm\s+run\s+supabase:gen:types/i);
    assert.match(workflow, /npm\s+run\s+build:supabase-client/i);
    assert.match(workflow, /npm\s+run\s+check:generated/i);
});
