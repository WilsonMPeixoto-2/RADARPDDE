'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const workflow = fs.readFileSync(
  path.join(root, '.github/workflows/production-authenticated-read.yml'),
  'utf8'
);
const spec = fs.readFileSync(
  path.join(root, 'tests/e2e/production-authenticated-read.spec.js'),
  'utf8'
);
const config = fs.readFileSync(
  path.join(root, 'playwright.production-authenticated-read.config.js'),
  'utf8'
);

test('workflow valida contratos em PR e só acessa Production quando explicitamente habilitado', () => {
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /vars\.RADAR_PRODUCTION_AUTH_READ_ENABLED == 'true'/);
  assert.match(workflow, /secrets\.RADAR_PRODUCTION_READ_ACCOUNTS_JSON/);
  assert.match(workflow, /github\.event_name != 'pull_request'/);
});

test('workflow não usa service role nem publica artefatos com dados de Production', () => {
  assert.doesNotMatch(workflow, /SERVICE_ROLE/i);
  assert.doesNotMatch(workflow, /upload-artifact/i);
  assert.doesNotMatch(workflow, /actions\/cache/i);
  assert.match(workflow, /rm -f -- "\$\{ACCOUNTS_FILE\}"/);
  assert.match(workflow, /persist-credentials: false/);
});

test('configuração remota desabilita trace, screenshot e vídeo', () => {
  assert.match(config, /trace: 'off'/);
  assert.match(config, /screenshot: 'off'/);
  assert.match(config, /video: 'off'/);
  assert.doesNotMatch(config, /webServer/);
});

test('suíte cobre as seis operações de leitura sem chamadas de escrita', () => {
  assert.match(spec, /signIn\(/);
  assert.match(spec, /proveGlobalSearch\(/);
  assert.match(spec, /proveDashboard\(/);
  assert.match(spec, /provePortfolio\(/);
  assert.match(spec, /proveSchoolRecord\(/);
  assert.match(spec, /provePendencies\(/);
  assert.match(spec, /page\.reload\(\)/);
  assert.doesNotMatch(spec, /\.insert\(/);
  assert.doesNotMatch(spec, /\.update\(/);
  assert.doesNotMatch(spec, /\.upsert\(/);
  assert.doesNotMatch(spec, /\.delete\(/);
});
