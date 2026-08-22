'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(path.join(__dirname, '../../app.js'), 'utf8');
const performanceSource = fs.readFileSync(
    path.join(__dirname, '../../src/integration/operational-write-performance.js'),
    'utf8'
);

function functionSource(name) {
    const marker = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`, 'g');
    const match = marker.exec(appSource);
    assert.ok(match, `Função ${name} não encontrada em app.js`);
    const start = match.index;
    const next = appSource.slice(marker.lastIndex).search(/\n(?:async\s+)?function\s+[A-Za-z0-9_$]+\s*\(/);
    return next < 0
        ? appSource.slice(start)
        : appSource.slice(start, marker.lastIndex + next);
}

test('camada operacional intercepta os handlers inline e evita rerender integral no sucesso', () => {
    [
        'toggleBonif',
        'changeAnaliseTecnica',
        'toggleInvoiceAdvisorySent',
        'changeInvoiceAdvisoryAnalysis',
        'toggleConsEnviada'
    ].forEach(name => {
        assert.match(performanceSource, new RegExp(`['\"]${name}['\"]`));
    });
    assert.match(performanceSource, /patchInlineHandlers/);
    assert.match(performanceSource, /syncProntuarioProgramUI/);
    assert.match(performanceSource, /suppressProntuarioRender/);
});

test('grade do prontuário expõe alvos estáveis para atualização incremental', () => {
    const renderSource = functionSource('renderProntuarioVerificacoes');

    assert.match(renderSource, /data-program-id=/);
    assert.match(renderSource, /data-document-key=/);
    assert.match(renderSource, /data-program-status-summary=/);
});
