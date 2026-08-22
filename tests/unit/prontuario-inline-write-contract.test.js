'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(path.join(__dirname, '../../app.js'), 'utf8');

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

test('lançamentos inline não rerenderizam o prontuário completo após gravação', () => {
    const inlineHandlers = [
        'toggleBonif',
        'changeAnaliseTecnica',
        'toggleInvoiceAdvisorySent',
        'changeInvoiceAdvisoryAnalysis',
        'toggleConsEnviada'
    ];

    inlineHandlers.forEach(name => {
        const source = functionSource(name);
        assert.doesNotMatch(
            source,
            /\brenderProntuario\s*\(/,
            `${name} ainda reconstrói o prontuário completo`
        );
    });
});

test('grade do prontuário expõe alvos estáveis para atualização incremental', () => {
    const renderSource = functionSource('renderProntuarioVerificacoes');

    assert.match(renderSource, /data-program-id=/);
    assert.match(renderSource, /data-document-key=/);
    assert.match(renderSource, /data-program-status-summary=/);
    assert.match(renderSource, /data-service-advisory-sent=/);
    assert.match(renderSource, /data-service-advisory-analysis=/);
});
