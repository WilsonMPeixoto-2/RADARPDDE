'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { DataService } = require('../../src/application/data-service.js');
const { VerificationService } = require('../../src/application/verification-service.js');
const { PendencyService } = require('../../src/application/pendency-service.js');
const { InvoiceService } = require('../../src/application/invoice-service.js');
const { ConfigurationService } = require('../../src/application/configuration-service.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

for (const [name, persist] of [
    ['verification', context => VerificationService.prototype.persistAtomicVerification(context, {})],
    ['pendency', context => PendencyService.prototype.persistPendencyCommand(context, {})],
    ['invoice-document', context => PendencyService.prototype.persistInvoiceDocumentCommand(context, {})],
    ['unidentified', context => InvoiceService.prototype.persistUnidentifiedExpenseWithPendency(context, {})],
    ['calendar', context => ConfigurationService.prototype.persistCalendar(context, {})]
]) {
    test(`${name}: fallback especializado remoto é bloqueado antes da primeira escrita e restaura memória`, async () => {
        let local = createSnapshotEnvelope({ schools: [{ id: 's1', name: 'Antes', row_version: 1 }] });
        const before = structuredClone(local);
        let writes = 0;
        let reads = 0;
        const repository = {
            capabilities: () => ({ remote: true }),
            load: async () => { reads += 1; return structuredClone(before.entities.schools); },
            save: async () => { writes += 1; },
            remove: async () => { writes += 1; },
            exportSnapshot: async () => structuredClone(before),
            restoreSnapshot: async () => { throw new Error('Não restaurar banco remoto'); },
            healthCheck: async () => ({ ok: true })
        };
        const statePort = {
            capture: async () => structuredClone(local),
            restore: async snapshot => { local = structuredClone(snapshot); },
            exportCanonical: async () => structuredClone(local),
            applyCanonical: async snapshot => { local = structuredClone(snapshot); }
        };
        const service = new DataService({ repository, statePort });

        await assert.rejects(service.execute({
            name,
            changedEntities: ['schools'],
            mutate: () => { local.entities.schools[0].name = 'Depois'; },
            persist
        }), error => error?.code === 'MISSING_REMOTE_CAPABILITY');

        assert.deepEqual(local.entities, before.entities);
        assert.equal(writes, 0);
        assert.equal(reads, 0, 'não inicia persistência genérica remota');
    });
}

test('fallback especializado continua permitido em repositório local', async () => {
    let local = createSnapshotEnvelope({ schools: [{ id: 's1', name: 'Antes', row_version: 1 }] });
    let writes = 0;
    const repository = {
        capabilities: () => ({ remote: false }),
        load: async () => [],
        save: async () => { writes += 1; },
        remove: async () => { writes += 1; },
        exportSnapshot: async () => structuredClone(local),
        restoreSnapshot: async snapshot => { local = structuredClone(snapshot); },
        healthCheck: async () => ({ ok: true })
    };
    const statePort = {
        capture: async () => structuredClone(local),
        restore: async snapshot => { local = structuredClone(snapshot); },
        exportCanonical: async () => structuredClone(local),
        applyCanonical: async snapshot => { local = structuredClone(snapshot); }
    };
    const service = new DataService({ repository, statePort });

    await service.execute({
        name: 'local-specialized',
        changedEntities: ['schools'],
        mutate: () => { local.entities.schools[0].name = 'Depois'; },
        persist: ({ defaultPersist }) => defaultPersist()
    });

    assert.ok(writes > 0, 'fallback local permanece funcional');
    assert.equal(local.entities.schools[0].name, 'Depois');
});
