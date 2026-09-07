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

test('proteção atômica instala por sinal determinístico e publica readiness crítico', () => {
  const source = fs.readFileSync(modulePath('src/integration/atomic-analysis-pendency.js'), 'utf8');
  assert.doesNotMatch(source, /setInterval\s*\(/, 'proteção atômica ainda depende de polling');
  assert.match(source, /RadarApplicationReadiness/);
  assert.match(source, /['"]atomic-analysis['"]/);
  assert.match(source, /['"]application-services['"]/);
  assert.match(source, /markReady(?:\?\.)?\(['"]atomic-analysis['"]\)/);
  assert.match(source, /markFailed(?:\?\.)?\(['"]atomic-analysis['"]/);
});

test('coordenador publica ui-runtime no marco determinístico do DOM', () => {
  const source = fs.readFileSync(modulePath('src/integration/application-readiness.js'), 'utf8');
  assert.match(source, /['"]ui-runtime['"]/);
  assert.match(source, /DOMContentLoaded/);
  assert.match(source, /markReady\(['"]ui-runtime['"]\)/);
});

test('carregador canônico espera ui-runtime antes de instalar a página de Pendências', () => {
  const config = fs.readFileSync(modulePath('config.js'), 'utf8');
  const waitIndex = config.indexOf("await readiness.when('ui-runtime')");
  const pageIndex = config.indexOf("await loadScript('src/integration/task-9-pendencias-page.js', false)");
  const focusIndex = config.indexOf("await loadScript('src/integration/task-9-focus-bridge.js', false)");
  assert.ok(waitIndex >= 0);
  assert.ok(pageIndex > waitIndex);
  assert.ok(focusIndex > pageIndex);
  assert.match(config, /RadarPendencyPageReady/);
  assert.match(config, /define\?\.\('pendency-page'/);
  assert.match(config, /dependencies:\s*\['ui-runtime'\]/);
  assert.match(config, /markReady\?\.\('pendency-page'\)/);
  assert.match(config, /markFailed\?\.\(\s*'pendency-page'/);
});
