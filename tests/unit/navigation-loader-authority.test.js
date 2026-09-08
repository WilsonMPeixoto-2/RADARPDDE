'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const authGate = fs.readFileSync(path.join(root, 'src/integration/auth-gate.js'), 'utf8');
const controllerPanel = fs.readFileSync(
  path.join(root, 'src/integration/painel-controlador-expressiva.js'),
  'utf8'
);

test('auth gate permanece a autoridade canônica para carregar navigation-history', () => {
  assert.match(authGate, /NAVIGATION_SCRIPTS[\s\S]*navigation-history\.js/);
  assert.match(authGate, /installNavigationModules/);
});

test('painel visual não injeta navigation-history em paralelo ao bootstrap canônico', () => {
  assert.doesNotMatch(
    controllerPanel,
    /loadIntegration\(['"]src\/integration\/navigation-history\.js['"]\)/
  );
});

test('painel ainda carrega o contexto de sessão do controlador que lhe pertence', () => {
  assert.match(
    controllerPanel,
    /loadIntegration\(['"]src\/integration\/controller-session-context\.js['"]\)/
  );
});
