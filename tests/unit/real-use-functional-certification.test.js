'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const moduleUrl = pathToFileURL(
  path.resolve(__dirname, '../../scripts/check-real-use-functional-certification.mjs')
).href;

test('certificação exige uma linha para toda mutação funcional canônica', async () => {
  const { requiredOperationIds, validateCertification } = await import(moduleUrl);
  const matrix = {
    profiles: [{ id: 'controller', kind: 'functional' }],
    operations: [
      { id: 'INV-01', mode: 'write', allow: ['controller'] },
      { id: 'READ-01', mode: 'read', allow: ['controller'] }
    ]
  };

  assert.deepEqual(requiredOperationIds(matrix), ['INV-01']);
  assert.deepEqual(
    validateCertification(matrix, { schemaVersion: 1, operations: [] }),
    ['Operação funcional sem certificação: INV-01.']
  );
});

test('certificação rejeita linha incompleta de uso real', async () => {
  const { validateCertification } = await import(moduleUrl);
  const matrix = {
    profiles: [{ id: 'controller', kind: 'functional' }],
    operations: [{ id: 'INV-01', mode: 'write', allow: ['controller'] }]
  };
  const findings = validateCertification(matrix, {
    schemaVersion: 1,
    operations: [{ id: 'INV-01', area: 'Notas Fiscais' }]
  });

  assert.ok(findings.some(item => item.includes('userAction')));
  assert.ok(findings.some(item => item.includes('persistence')));
  assert.ok(findings.some(item => item.includes('reload')));
  assert.ok(findings.some(item => item.includes('result')));
});