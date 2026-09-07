'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(path.join(__dirname, '../../app.js'), 'utf8');
const reconcilerSource = fs.readFileSync(
    path.join(__dirname, '../../src/integration/prontuario-conditional-reconciler.js'),
    'utf8'
);
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

test('reconciliador funcional intercepta os handlers inline e evita rerender integral no sucesso', () => {
    [
        'toggleBonif',
        'changeAnaliseTecnica',
        'toggleInvoiceAdvisorySent',
        'changeInvoiceAdvisoryAnalysis',
        'toggleConsEnviada'
    ].forEach(name => {
        assert.match(reconcilerSource, new RegExp(`['\"]${name}['\"]`));
    });
    assert.match(reconcilerSource, /function patchHandler/);
    assert.match(reconcilerSource, /function reconcile/);
    assert.match(reconcilerSource, /suppressProntuarioRender/);
    assert.match(
        reconcilerSource,
        /name === 'toggleBonif'[\s\S]*args\[2\][\s\S]*notaFiscal/,
        'Notas Fiscais estruturadas devem continuar escapando da atualização incremental localizada.'
    );
    assert.doesNotMatch(performanceSource, /patchInlineHandlers|syncProntuarioProgramUI|suppressProntuarioRender/);
});

test('grade do prontuário expõe alvos estáveis para atualização incremental', () => {
    const renderSource = functionSource('renderProntuarioVerificacoes');

    assert.match(renderSource, /data-program-id=/);
    assert.match(renderSource, /data-document-key=/);
    assert.match(renderSource, /data-program-status-summary=/);
});

test('reconciliação incremental mantém o bloqueio visual da análise da Declaração BB Ágil em N/A', () => {
    const renderSource = functionSource('renderProntuarioVerificacoes');

    assert.match(renderSource, /data-bb-agil-na-lock="true"/);
    assert.match(reconcilerSource, /documentKey === 'declBBAgil'/);
    assert.match(reconcilerSource, /bonificationValue === 'Não se aplica'/);
    assert.match(reconcilerSource, /analysisControl\.disabled = true/);
    assert.match(reconcilerSource, /analysisControl\.dataset\.bbAgilNaLock = 'true'/);
    assert.match(reconcilerSource, /analysisControl\.disabled = false/);
    assert.match(reconcilerSource, /delete analysisControl\.dataset\.bbAgilNaLock/);
});