'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('app não contém cliente, seed, tabelas ou sincronização Supabase legados', () => {
    const app = read('app.js');

    assert.doesNotMatch(app, /\bseedDatabaseSupabase\b/);
    assert.doesNotMatch(app, /\bpersistSingleTableSupabase\b/);
    assert.doesNotMatch(app, /\b(?:const|let|var)\s+supabaseClient\b/);
    assert.doesNotMatch(app, /\.from\(\s*['"](?:config|escolas|pendencias|contatos|logs|bens|verificacoes|programas|controladores|equipe_inventario|notas_registradas)['"]\s*\)/);
    assert.doesNotMatch(app, /Banco de dados do Supabase vazio/i);
});

test('bootstrap e persistência passam pelo gateway único', () => {
    const app = read('app.js');

    assert.match(app, /async function initializeRadarData\s*\(/);
    assert.match(app, /new window\.RadarDataService\.DataService\s*\(/);
    assert.match(app, /window\.RadarStatePort\.createStatePort\s*\(/);
    assert.match(app, /radarDataService\.bootstrap\s*\(/);
    assert.match(app, /radarDataService\.stageCompatibility\s*\(/);
    assert.match(app, /radarDataService\.persistSnapshot\s*\(/);
    assert.match(app, /window\.waitForRadarPersistence\s*=/);

    const persistBody = app.match(/function persist\([^)]*\)\s*\{([\s\S]*?)\n\}/)?.[1] || '';
    assert.doesNotMatch(persistBody, /localStorage\.(?:setItem|removeItem)/);
    assert.doesNotMatch(persistBody, /\.from\s*\(/);
});

test('módulos críticos são estáticos, ordenados e não carregados dinamicamente', () => {
    const html = read('index.html');
    const config = read('config.js');
    const orderedScripts = [
        'src/data/repository-contract.js',
        'vendor/ajv.js',
        'src/domain/json-contracts.js',
        'src/application/error-mapper.js',
        'src/data/local-storage-repository.js',
        'src/data/supabase-repository.js',
        'src/data/repository-factory.js',
        'src/data/snapshot-tools.js',
        'src/data/legacy-state-adapter.js',
        'src/data/state-bridge.js',
        'src/data/state-bridge-metadata.js',
        'src/application/state-port.js',
        'src/application/unit-of-work.js',
        'src/application/data-service.js',
        'app.js'
    ];
    let previous = -1;
    orderedScripts.forEach(script => {
        const index = html.indexOf(`src="${script}"`);
        assert.ok(index > previous, `${script} deve aparecer na ordem de bootstrap.`);
        previous = index;
        if (script !== 'app.js') {
            assert.doesNotMatch(config, new RegExp(`loadScript\\(['"]${script.replaceAll('/', '\\/')}['"]`));
        }
    });
});
