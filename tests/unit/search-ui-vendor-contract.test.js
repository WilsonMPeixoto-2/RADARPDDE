'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
    return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('fixa e empacota as dependências de busca e posicionamento', () => {
    const pkg = JSON.parse(read('package.json'));

    assert.equal(pkg.devDependencies['fuse.js'], '7.5.0');
    assert.equal(pkg.devDependencies['@floating-ui/dom'], '1.8.0');
    assert.equal(pkg.scripts['build:search-ui-vendors'], 'node scripts/build-search-ui-vendors.mjs');
    assert.equal(pkg.scripts['check:search-ui-vendors'], 'node scripts/build-search-ui-vendors.mjs --check');

    assert.match(read('src/vendor/fuse-entry.js'), /globalThis\.Fuse\s*=\s*Fuse/);
    assert.match(read('src/vendor/floating-ui-entry.js'), /globalThis\.FloatingUIDOM/);
    assert.match(read('scripts/build-search-ui-vendors.mjs'), /vendor\/fuse\.js/);
    assert.match(read('scripts/build-search-ui-vendors.mjs'), /vendor\/floating-ui\.js/);
});

test('carrega Fuse.js e Floating UI somente no primeiro uso', () => {
    const html = read('index.html');
    const searchIntegration = read('src/integration/global-search.js');
    const floatingIntegration = read('src/integration/floating-ui-bootstrap.js');

    assert.doesNotMatch(html, /<script\s+src="vendor\/fuse\.js"/);
    assert.doesNotMatch(html, /<script\s+src="vendor\/floating-ui\.js"/);
    assert.match(searchIntegration, /vendor\/fuse\.js/);
    assert.match(floatingIntegration, /vendor\/floating-ui\.js/);
    assert.match(searchIntegration, /loadScriptOnce/);
    assert.match(floatingIntegration, /loadScriptOnce/);
});
