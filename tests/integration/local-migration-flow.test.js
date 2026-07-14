'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { ImportCoordinator, createMemoryCheckpointStore } = require('../../src/data/import-coordinator.js');
const { LocalStorageRepository } = require('../../src/data/local-storage-repository.js');
const { exportLegacySnapshot } = require('../../src/data/legacy-state-adapter.js');

function memoryStorage(seed = {}) {
    const values = new Map(Object.entries(seed));
    return {
        getItem: key => values.has(key) ? values.get(key) : null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: key => values.delete(key)
    };
}

test('fluxo local exporta, valida, importa, reconcilia e reverte sem dados sensíveis no relatório', async () => {
    const sourceStorage = memoryStorage({
        radar_pdde_config: JSON.stringify({ exercicios: ['2028'], competenciaFechamento: '2028-01' }),
        radar_pdde_programas: JSON.stringify([{ id: 'BASIC', name: 'PDDE Básico', active: true }]),
        radar_pdde_controladores: '[]',
        radar_pdde_equipe_inventario: '[]',
        radar_pdde_escolas: JSON.stringify([{
            id: 's1', designação: '04.99.001', denominação: 'Escola Migração', cre: '4ª CRE', programasIds: ['BASIC']
        }]),
        radar_pdde_verificacoes: '{}',
        radar_pdde_pendencias: '[]',
        radar_pdde_contatos: '[]',
        radar_pdde_bens: '[]',
        radar_pdde_notas_registradas: '[]',
        radar_pdde_logs: '[]',
        radar_pdde_data_version: 'integration'
    });
    const exported = exportLegacySnapshot(sourceStorage, {
        importId: 'integration-flow',
        version: '1',
        exportedAt: '2026-07-14T12:00:00.000Z'
    });
    const target = new LocalStorageRepository({ storage: memoryStorage(), keyPrefix: 'target' });
    const coordinator = new ImportCoordinator({ targetRepository: target, checkpointStore: createMemoryCheckpointStore(), batchSize: 2 });

    const dryRun = await coordinator.dryRun(exported.snapshot);
    assert.equal(dryRun.ok, true);
    const completed = await coordinator.import(exported.snapshot);
    assert.equal(completed.reconciliation.ok, true);
    assert.equal(completed.report.importId, 'integration-flow');
    assert.equal(JSON.stringify(completed.report).includes('Escola Migração'), false);
    assert.equal(JSON.stringify(completed.report).includes('04.99.001'), false);

    const rollback = await coordinator.rollback('integration-flow');
    assert.equal(rollback.status, 'rolled_back');
});
