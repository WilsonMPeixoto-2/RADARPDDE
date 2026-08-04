const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const moduleUrl = pathToFileURL(
  path.resolve(__dirname, '../../scripts/manage-production-incident.mjs')
).href;

async function subject() {
  return import(moduleUrl);
}

function issue(number, overrides = {}) {
  return {
    number,
    title: '[Incidente automático] Falha no monitoramento de Production',
    body: '<!-- radar-production-monitor-incident -->\nEstado: falha',
    created_at: '2026-08-04T20:00:00Z',
    pull_request: null,
    ...overrides
  };
}

test('reconhece somente issues automáticas com título e marcador exatos', async () => {
  const { findProductionMonitorIncidents } = await subject();
  const incidents = findProductionMonitorIncidents([
    issue(11),
    issue(12, { title: 'Falha em Production' }),
    issue(13, { body: 'Issue humana sem marcador' }),
    issue(14, { pull_request: { url: 'https://api.github.test/pulls/14' } })
  ]);

  assert.deepEqual(incidents.map(item => item.number), [11]);
});

test('constrói corpo sanitizado preservando a primeira detecção', async () => {
  const { buildProductionIncidentBody } = await subject();
  const body = buildProductionIncidentBody({
    firstDetectedAt: '2026-08-04T20:00:00Z',
    observedAt: '2026-08-04T21:00:00Z',
    commitSha: '5da29bc909c10944fc1808fd66c754fed1f92e21',
    eventName: 'schedule',
    coreStatus: 1,
    preflightStatus: 0,
    runUrl: 'https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/123'
  });

  assert.match(body, /<!-- radar-production-monitor-incident -->/u);
  assert.match(body, /Primeira detecção: `2026-08-04T20:00:00Z`/u);
  assert.match(body, /Última detecção: `2026-08-04T21:00:00Z`/u);
  assert.match(body, /Smoke geral: `1`/u);
  assert.match(body, /Preflight: `0`/u);
  assert.doesNotMatch(body, /token|authorization|sb_publishable_/iu);
});

test('cria incidente quando uma falha ocorre sem issue aberta', async () => {
  const { reconcileProductionIncident } = await subject();
  const calls = [];
  const api = async (method, pathName, body) => {
    calls.push({ method, pathName, body });
    if (method === 'GET') return [];
    if (method === 'POST' && pathName.endsWith('/issues')) return { number: 31 };
    throw new Error(`Chamada inesperada: ${method} ${pathName}`);
  };

  const result = await reconcileProductionIncident({
    status: 'failure',
    repository: 'WilsonMPeixoto-2/RADARPDDE',
    commitSha: '5da29bc909c10944fc1808fd66c754fed1f92e21',
    eventName: 'schedule',
    coreStatus: 1,
    preflightStatus: 0,
    runUrl: 'https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/123',
    observedAt: '2026-08-04T21:00:00Z',
    api
  });

  assert.deepEqual(result, { action: 'created', issueNumbers: [31] });
  assert.equal(calls[1].method, 'POST');
  assert.equal(calls[1].body.title, '[Incidente automático] Falha no monitoramento de Production');
});

test('atualiza a issue mais antiga em falha recorrente sem criar comentários horários', async () => {
  const { reconcileProductionIncident } = await subject();
  const calls = [];
  const api = async (method, pathName, body) => {
    calls.push({ method, pathName, body });
    if (method === 'GET') return [
      issue(42, { created_at: '2026-08-04T20:30:00Z' }),
      issue(41, { created_at: '2026-08-04T20:00:00Z' })
    ];
    if (method === 'PATCH' && pathName.endsWith('/issues/41')) return { number: 41 };
    throw new Error(`Chamada inesperada: ${method} ${pathName}`);
  };

  const result = await reconcileProductionIncident({
    status: 'failure',
    repository: 'WilsonMPeixoto-2/RADARPDDE',
    commitSha: '5da29bc909c10944fc1808fd66c754fed1f92e21',
    eventName: 'schedule',
    coreStatus: 1,
    preflightStatus: 1,
    runUrl: 'https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/124',
    observedAt: '2026-08-04T22:00:00Z',
    api
  });

  assert.deepEqual(result, { action: 'updated', issueNumbers: [41] });
  assert.equal(calls.filter(call => call.method === 'POST').length, 0);
  assert.match(calls[1].body.body, /Primeira detecção: `2026-08-04T20:00:00Z`/u);
});

test('comenta e fecha todas as issues automáticas após recuperação', async () => {
  const { reconcileProductionIncident } = await subject();
  const calls = [];
  const api = async (method, pathName, body) => {
    calls.push({ method, pathName, body });
    if (method === 'GET') return [issue(51), issue(52)];
    return {};
  };

  const result = await reconcileProductionIncident({
    status: 'success',
    repository: 'WilsonMPeixoto-2/RADARPDDE',
    commitSha: '5da29bc909c10944fc1808fd66c754fed1f92e21',
    eventName: 'schedule',
    coreStatus: 0,
    preflightStatus: 0,
    runUrl: 'https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/125',
    observedAt: '2026-08-04T23:00:00Z',
    api
  });

  assert.deepEqual(result, { action: 'closed', issueNumbers: [51, 52] });
  assert.equal(calls.filter(call => call.pathName.endsWith('/comments')).length, 2);
  assert.equal(calls.filter(call => call.method === 'PATCH' && call.body.state === 'closed').length, 2);
});
