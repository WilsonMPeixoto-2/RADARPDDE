'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('proteção de análise incorreta é a primeira extensão funcional carregada', () => {
    const source = read('src/integration/product-extensions-bootstrap.js');
    const atomicIndex = source.indexOf("'/src/integration/atomic-analysis-pendency.js'");
    const firstOptionalIndex = source.indexOf("'/src/domain/school-timeline.js'");

    assert.notEqual(atomicIndex, -1);
    assert.notEqual(firstOptionalIndex, -1);
    assert.ok(
        atomicIndex < firstOptionalIndex,
        'a proteção atômica deve carregar antes das extensões opcionais'
    );
});

test('integração atômica não desiste silenciosamente após dez segundos', () => {
    const source = read('src/integration/atomic-analysis-pendency.js');

    assert.match(source, /RADAR_ATOMIC_ANALYSIS_READY/);
    assert.doesNotMatch(
        source,
        /setTimeout\s*\(\s*\(\)\s*=>\s*root\.clearInterval\(interval\)\s*,\s*10000\s*\)/
    );
});

test('PendencyService contém o comando atômico de pendência com análise', () => {
    const source = read('src/application/pendency-service.js');

    assert.match(source, /technicalAnalysisValue/);
    assert.match(source, /pendency:open-with-analysis/);
    assert.match(
        source,
        /\['pendencies', 'verifications', 'administrativeLogs'\]/
    );
    assert.match(source, /Análise incorreta e pendência aberta/);
});
