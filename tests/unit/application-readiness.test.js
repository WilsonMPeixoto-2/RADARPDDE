'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const rootDir = path.resolve(__dirname, '../..');

function modulePath(relative) {
  return path.join(rootDir, relative);
}

function freshReadiness() {
  const target = modulePath('src/integration/application-readiness.js');
  delete require.cache[require.resolve(target)];
  return require(target).createReadinessCoordinator();
}

test('readiness resolve dependências sem polling e publica snapshot sanitizado', async () => {
  const readiness = freshReadiness();
  readiness.define('data', { criticality: 'critical' });
  readiness.define('competence', { dependencies: ['data'], criticality: 'critical' });

  const pending = readiness.when(['data', 'competence']);
  readiness.markReady('data');
  readiness.markReady('competence');
  await pending;

  const snapshot = readiness.snapshot();
  assert.equal(snapshot.data.status, 'ready');
  assert.deepEqual(snapshot.competence.dependencies, ['data']);
  assert.equal(JSON.stringify(snapshot).includes('password'), false);
});

test('readiness rejeita dependência crítica falha com código sanitizado', async () => {
  const readiness = freshReadiness();
  readiness.define('navigation', { criticality: 'critical' });
  const pending = readiness.when('navigation');
  readiness.markFailed('navigation', 'NAVIGATION_INSTALL_FAILED');
  await assert.rejects(pending, error => (
    error.code === 'READINESS_FAILED'
      && error.capability === 'navigation'
      && error.reason === 'NAVIGATION_INSTALL_FAILED'
  ));
});

test('config carrega o coordenador antes das extensões que dependem de readiness', () => {
  const config = fs.readFileSync(modulePath('config.js'), 'utf8');
  const readinessMatch = config.match(/loadScript\(\s*['"]src\/integration\/application-readiness\.js['"]\s*,\s*false\s*\)/);
  const readinessIndex = readinessMatch?.index ?? -1;
  const firstConsumer = config.indexOf("loadScript('src/integration/exercise-management.js', false)");
  assert.ok(readinessIndex >= 0);
  assert.ok(firstConsumer > readinessIndex);
  assert.match(config, /RadarApplicationReadinessReady/);
});

test('auth gate, competência global e histórico deixam de usar setInterval como contrato de prontidão', () => {
  for (const relative of [
    'src/integration/auth-gate.js',
    'src/integration/global-competence-selector.js',
    'src/integration/navigation-history.js'
  ]) {
    const source = fs.readFileSync(modulePath(relative), 'utf8');
    assert.doesNotMatch(source, /setInterval\s*\(/, `${relative} ainda usa polling de readiness`);
  }
});
