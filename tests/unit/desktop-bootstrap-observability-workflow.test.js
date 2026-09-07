'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const workflow = fs.readFileSync(path.join(root, '.github/workflows/validate.yml'), 'utf8');

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
