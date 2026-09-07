'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const workflow = fs.readFileSync(path.join(root, '.github/workflows/validate.yml'), 'utf8');
const config = fs.readFileSync(
  path.join(root, 'playwright.desktop-bootstrap-observability.config.js'),
  'utf8'
);

test('gate HML aceita a branch fresca da auditoria sem mover a branch histórica divergente', () => {
  assert.match(workflow, /audit\/desktop-bootstrap-observability-2026-09-07/);
  assert.match(workflow, /qa\/supabase-preview-gate-run/);
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

test('workflow serve o código da branch atual com a configuração pública validada do Preview', () => {
  assert.match(workflow, /config\.runtime\.js/);
  assert.match(workflow, /playwright\.desktop-bootstrap-observability\.config\.js/);
  assert.match(workflow, /current-branch|branch atual/i);
});
