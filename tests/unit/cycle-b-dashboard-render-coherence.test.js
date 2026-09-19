'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const dashboard = fs.readFileSync(
    path.join(root, 'src/integration/cycle-b-dashboard.js'),
    'utf8'
);
const resultContext = fs.readFileSync(
    path.join(root, 'src/integration/cycle-b-dashboard-result.js'),
    'utf8'
);

test('Dashboard aplica o contexto visual final no mesmo ciclo do render base', () => {
    const renderer = dashboard.match(
        /function renderDashboardControladorEnhanced\(container\)\s*\{([\s\S]*?)\n\s*\}/
    )?.[1] || '';

    const baseIndex = renderer.indexOf('originalRenderDashboardControlador(container)');
    const projectionIndex = renderer.indexOf('enhanceDashboard()');
    const resultIndex = renderer.indexOf('RadarCycleBDashboardResult?.enhance?.()');

    assert.ok(baseIndex >= 0, 'render base continua sendo a autoridade inicial');
    assert.ok(projectionIndex > baseIndex, 'projeção Cycle B continua após o render base');
    assert.ok(resultIndex > projectionIndex, 'título e contexto final são aplicados antes de devolver o render');
});

test('decorador de resultado permanece idempotente para o observer de compatibilidade', () => {
    assert.match(resultContext, /if \(!title\)\s*\{/);
    assert.match(resultContext, /!firstText\.textContent\.startsWith\('Escolas e Carteiras'\)/);
    assert.match(resultContext, /if \(!status\)\s*\{/);
});
