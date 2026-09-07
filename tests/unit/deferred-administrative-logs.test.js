'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const rootDir = path.resolve(__dirname, '../..');
const {
  DataService,
  REMOTE_BOOTSTRAP_ENTITIES
} = require('../../src/application/data-service.js');
const {
  RepositoryError,
  createSnapshotEnvelope
} = require('../../src/data/repository-contract.js');

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function createRemoteRepository(options = {}) {
  const events = options.events || [];
  const logRead = options.logRead || null;
  return {
    capabilities: () => ({ mode: 'supabase', remote: true, canImportLegacy: false }),
    load: async entity => {
      events.push(`load:${entity}`);
      if (entity === 'administrativeLogs' && logRead) return logRead.promise;
      return [];
    },
    save: async () => [],
    remove: async () => ({ removed: 0 }),
    exportSnapshot: async exportOptions => {
      events.push(`bootstrap:${(exportOptions.entities || []).join(',')}`);
      const entities = Object.fromEntries((exportOptions.entities || []).map(entity => [entity, []]));
      return createSnapshotEnvelope(entities, {
        importId: 'remote-bootstrap-test',
        exportedAt: '2026-09-07T06:00:00.000Z'
      });
    },
    restoreSnapshot: async () => undefined,
    healthCheck: async () => ({ ok: true, mode: 'supabase' })
  };
}

function createStatePort(events = []) {
  let canonical = createSnapshotEnvelope({}, {
    importId: 'memory',
    exportedAt: '2026-09-07T06:00:00.000Z'
  });
  return {
    capture: async () => ({ memory: {}, storage: {} }),
    restore: async () => undefined,
    exportCanonical: async () => structuredClone(canonical),
    applyCanonical: async snapshot => {
      canonical = structuredClone(snapshot);
      events.push('apply:canonical');
      return {};
    },
    applyEntities: async (snapshot, entities) => {
      events.push(`apply:${entities.join(',')}`);
      entities.forEach(entity => {
        canonical.entities[entity] = structuredClone(snapshot.entities?.[entity] || []);
      });
      return {};
    }
  };
}

test('bootstrap remoto libera a aplicação sem esperar administrativeLogs', async () => {
  assert.equal(REMOTE_BOOTSTRAP_ENTITIES.includes('administrativeLogs'), false);

  const events = [];
  const logRead = deferred();
  const repository = createRemoteRepository({ events, logRead });
  const statePort = createStatePort(events);
  const service = new DataService({ repository, statePort });

  const result = await service.bootstrap();

  assert.equal(result.importedLegacy, false);
  const bootstrapEvent = events.find(event => event.startsWith('bootstrap:'));
  assert.ok(bootstrapEvent);
  assert.equal(bootstrapEvent.includes('administrativeLogs'), false);
  assert.equal(events.includes('load:administrativeLogs'), true);

  logRead.resolve([{ id: 'log-1', action: 'Teste', created_at: '2026-09-07T06:00:00.000Z' }]);
  const hydrated = await service.hydrateRemoteEntities(['administrativeLogs']);
  assert.equal(hydrated.ok, true);
});

test('hidratação tardia de administrativeLogs usa patch incremental e compartilha a fila das escritas remotas', async () => {
  const events = [];
  const logRead = deferred();
  const repository = createRemoteRepository({ events, logRead });
  const statePort = createStatePort(events);
  const unitOfWork = {
    run: async () => {
      events.push('execute:start');
      throw new RepositoryError('EXPECTED_TEST_STOP', 'Fim controlado do teste.', {
        operation: 'test'
      });
    }
  };
  const service = new DataService({ repository, statePort, unitOfWork });

  const hydration = service.hydrateRemoteEntities(['administrativeLogs']);
  const execution = service.execute({
    name: 'audit:record:test',
    changedEntities: ['administrativeLogs'],
    mutate: () => ({ ok: true })
  });

  await Promise.resolve();
  assert.equal(events.includes('execute:start'), false);

  logRead.resolve([{ id: 'log-1', action: 'Teste', created_at: '2026-09-07T06:00:00.000Z' }]);
  const hydrated = await hydration;
  assert.equal(hydrated.ok, true);
  assert.deepEqual(hydrated.entities, ['administrativeLogs']);
  assert.ok(events.includes('apply:administrativeLogs'));
  assert.equal(events.includes('apply:canonical'), false);

  await assert.rejects(execution, error => error.code === 'EXPECTED_TEST_STOP');
  assert.ok(events.indexOf('execute:start') > events.indexOf('apply:administrativeLogs'));
});

test('hidratação tardia rejeita entidades que ainda não têm aplicação incremental segura', async () => {
  const repository = createRemoteRepository();
  const statePort = createStatePort();
  const service = new DataService({ repository, statePort });

  await assert.rejects(
    () => service.hydrateRemoteEntities(['schools']),
    error => error.code === 'UNSAFE_REMOTE_HYDRATION_ENTITY'
  );
});

test('gate de Registros Internos é instalado antes da liberação autenticada sem bloquear o Dashboard', () => {
  const gate = fs.readFileSync(path.join(rootDir, 'src/integration/audit-data-gate.js'), 'utf8');
  const authGate = fs.readFileSync(path.join(rootDir, 'src/integration/auth-gate.js'), 'utf8');

  assert.match(gate, /['"]audit-data['"]/);
  assert.match(gate, /RadarAuditDataReady/);
  assert.match(gate, /administrativeLogs/);
  assert.match(gate, /renderAuditoria/);
  assert.match(gate, /markRestricted/);
  assert.match(authGate, /\/src\/integration\/audit-data-gate\.js/);

  const waitStart = authGate.indexOf('function waitForAuthorizedData');
  const waitEnd = authGate.indexOf('function installNavigationModules');
  assert.ok(waitStart >= 0 && waitEnd > waitStart);
  const waitBody = authGate.slice(waitStart, waitEnd);
  assert.doesNotMatch(waitBody, /['"]audit-data['"]/);
});
