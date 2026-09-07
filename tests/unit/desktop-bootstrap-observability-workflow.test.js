'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const workflow = fs.readFileSync(
  path.join(root, '.github/workflows/desktop-bootstrap-observability.yml'),
  'utf8'
);
const config = fs.readFileSync(
  path.join(root, 'playwright.desktop-bootstrap-observability.config.js'),
  'utf8'
);

test('workflow dedicado só executa a auditoria na branch isolada atual', () => {
  assert.match(workflow, /audit\/desktop-bootstrap-observability-2026-09-07/);
  assert.doesNotMatch(workflow, /qa\/supabase-preview-gate-run/);
});

test('diagnóstico autenticado roda somente no projeto desktop e publica apenas o JSON sanitizado', () => {
  assert.match(workflow, /desktop-bootstrap-observability\.spec\.js/);
  assert.match(workflow, /--project=supabase-preview-desktop-chromium/);
  assert.match(workflow, /desktop-bootstrap-observability\.json/);
  assert.match(workflow, /name: desktop-bootstrap-observability-/);
});

test('configuração do diagnóstico desliga trace, screenshot e vídeo e usa somente Chromium desktop', () => {
  assert.match(config, /trace: 'off'/);
  assert.match(config, /screenshot: 'off'/);
  assert.match(config, /video: 'off'/);
  assert.match(config, /Desktop Chrome/);
  assert.doesNotMatch(config, /Pixel|iPhone|mobile/i);
});

test('workflow mede a branch atual contra Supabase local descartável sem credenciais de Production', () => {
  assert.match(workflow, /supabase:start/);
  assert.match(workflow, /supabase:reset/);
  assert.match(workflow, /bootstrap:auth-fixtures/);
  assert.match(workflow, /RADAR_AUTH_FIXTURE_PASSWORD/);
  assert.match(workflow, /playwright\.desktop-bootstrap-observability\.config\.js/);
  assert.doesNotMatch(workflow, /secrets\./);
  assert.doesNotMatch(workflow, /RADAR_DEPLOYMENT_URL/);
});
