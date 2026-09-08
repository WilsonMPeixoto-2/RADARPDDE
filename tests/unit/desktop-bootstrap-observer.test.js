'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  sanitizeUrl,
  summarizeRequests,
  summarizeDuplicateResources,
  sanitizeDiagnosticReport
} = require('../support/desktop-bootstrap-observer.js');

test('sanitizeUrl remove query e fragmento preservando apenas origem e caminho', () => {
  assert.equal(
    sanitizeUrl('https://example.supabase.co/rest/v1/registered_invoices?select=id&school_id=eq.04.10.001#x'),
    'https://example.supabase.co/rest/v1/registered_invoices'
  );
  assert.equal(sanitizeUrl('/src/integration/app.js?cache=123'), '/src/integration/app.js');
});

test('summarizeRequests agrega por método e caminho sem carregar payload', () => {
  const summary = summarizeRequests([
    {
      method: 'GET',
      url: 'https://example.supabase.co/rest/v1/pendencies?select=*',
      durationMs: 120.2,
      requestBody: 'PROIBIDO'
    },
    {
      method: 'GET',
      url: 'https://example.supabase.co/rest/v1/pendencies?select=id',
      durationMs: 80.8,
      responseBody: 'PROIBIDO'
    },
    {
      method: 'POST',
      url: 'https://example.supabase.co/auth/v1/token?grant_type=password',
      durationMs: 50
    }
  ]);

  assert.deepEqual(summary, [
    {
      method: 'GET',
      url: 'https://example.supabase.co/rest/v1/pendencies',
      count: 2,
      totalDurationMs: 201,
      maxDurationMs: 120.2
    },
    {
      method: 'POST',
      url: 'https://example.supabase.co/auth/v1/token',
      count: 1,
      totalDurationMs: 50,
      maxDurationMs: 50
    }
  ]);
  assert.doesNotMatch(JSON.stringify(summary), /PROIBIDO/);
});

test('summarizeDuplicateResources lista apenas recursos repetidos por tipo e URL sanitizada', () => {
  assert.deepEqual(
    summarizeDuplicateResources([
      { type: 'script', url: '/a.js?1' },
      { type: 'script', url: '/a.js?2' },
      { type: 'style', url: '/a.css' },
      { type: 'style', url: '/b.css' }
    ]),
    [{ type: 'script', url: '/a.js', count: 2 }]
  );
});

test('sanitizeDiagnosticReport elimina campos de conteúdo e mantém somente metadados técnicos permitidos', () => {
  const report = sanitizeDiagnosticReport({
    run: { kind: 'timing', profile: 'controller' },
    milestones: [{ name: 'dashboard-usable', atMs: 1234.5 }],
    requests: [{ method: 'GET', url: 'https://x/rest/v1/schools?select=*', durationMs: 25, payload: { school: 'segredo' } }],
    resources: [{ type: 'script', url: '/app.js?x=1', durationMs: 12 }],
    timers: [{ delayMs: 20, source: '/src/integration/a.js', arguments: ['segredo'] }],
    arbitrary: { confidential: 'não pode sair' }
  });

  const serialized = JSON.stringify(report);
  assert.doesNotMatch(serialized, /segredo|confidential|arbitrary|payload|arguments/);
  assert.match(serialized, /dashboard-usable/);
  assert.match(serialized, /\/rest\/v1\/schools/);
  assert.doesNotMatch(serialized, /select=/);
});
