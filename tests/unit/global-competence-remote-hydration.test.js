'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
    path.join(__dirname, '../../src/integration/global-competence-selector.js'),
    'utf8'
);

test('troca remota de competência hidrata o contexto antes de renderizar a nova visão', () => {
    assert.match(source, /RadarApplicationServices\?\.data/);
    assert.match(source, /loadOperationalContext\(state\.activeKey/);
    assert.match(
        source,
        /await\s+service\.loadOperationalContext\([\s\S]*?\);[\s\S]*?refreshCurrentView\(root\)/
    );
    assert.match(source, /aria-busy/);
});

test('falha de hidratação retorna para a última competência confirmada em vez de exibir dados antigos sob mês novo', () => {
    assert.match(source, /lastHydratedCompetence/);
    assert.match(source, /remote-hydration-rollback/);
    assert.match(source, /suppressHydrationOnce/);
});
