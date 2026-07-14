'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { InventoryService } = require('../../src/application/inventory-service.js');

function createHarness() {
    const state = {
        schools: [{
            id: 'ESC-1',
            denominação: 'Escola Teste',
            processoInventario: 'PROC-2026/001'
        }],
        assets: [{
            id: 'bem-1',
            escolaId: 'ESC-1',
            competencia: '2026-05',
            item: 'Notebook',
            tipo: 'permanente',
            valor: 5000,
            notaFiscal: 'NF-001',
            status: 'Não encaminhada'
        }],
        logs: []
    };
    const calls = [];
    let sequence = 0;
    const service = new InventoryService({
        dataService: {
            async execute(command) {
                calls.push(command);
                return { ok: true, value: await command.mutate() };
            }
        },
        getState: () => state,
        appendLog: (action, details) => {
            const log = { id: `log-${++sequence}`, action, details };
            state.logs.unshift(log);
            return log;
        },
        createId: prefix => `${prefix}-${++sequence}`,
        now: () => new Date('2026-07-14T14:30:00.000Z')
    });
    return { state, calls, service };
}

test('atualiza documento do bem pelo gateway sem alterar outras propriedades', async () => {
    const harness = createHarness();
    await harness.service.updateAsset({
        assetId: 'bem-1',
        field: 'notaFiscal',
        value: 'NF-001-A',
        profile: 'controlador'
    });

    assert.equal(harness.state.assets[0].notaFiscal, 'NF-001-A');
    assert.equal(harness.state.assets[0].item, 'Notebook');
    assert.deepEqual(harness.calls[0].changedEntities, ['assets']);
});

test('encaminha capital somente com nota e processo e registra auditoria na mesma transação', async () => {
    const harness = createHarness();
    const result = await harness.service.forward({
        assetId: 'bem-1',
        profile: 'controlador'
    });

    assert.equal(result.value.asset.status, 'Encaminhada');
    assert.equal(harness.state.logs[0].action, 'Capital Encaminhado');
    assert.deepEqual(harness.calls[0].changedEntities, ['assets', 'administrativeLogs']);

    harness.state.assets[0].notaFiscal = '';
    await assert.rejects(
        harness.service.forward({ assetId: 'bem-1', profile: 'controlador' }),
        error => error.code === 'INVOICE_NUMBER_REQUIRED'
    );
});

test('conclui inventariação preservando responsável, observações e instante canônico', async () => {
    const harness = createHarness();
    const result = await harness.service.inventory({
        assetId: 'bem-1',
        responsible: 'Aylane',
        responsibleId: 'INV-1',
        notes: 'Tombamento conferido.',
        profile: 'inventario'
    });

    assert.equal(result.value.asset.status, 'Inventariada');
    assert.equal(result.value.asset.inventariadoPor, 'Aylane');
    assert.equal(result.value.asset.inventariadorId, 'INV-1');
    assert.equal(result.value.asset.observacoes, 'Tombamento conferido.');
    assert.equal(result.value.asset.dataInventariacao, '2026-07-14T14:30:00.000Z');
    assert.equal(harness.state.logs[0].action, 'Inventariação Concluída');
});

test('cria bem manual preservando competência, nota e estado derivado do processo', async () => {
    const harness = createHarness();
    const result = await harness.service.createAsset({
        schoolId: 'ESC-1',
        competence: '2026-07',
        description: 'Projetor',
        amount: 2500,
        invoiceNumber: 'NF-099',
        profile: 'controlador'
    });

    assert.equal(result.value.asset.status, 'Encaminhada');
    assert.equal(result.value.asset.competencia, '2026-07');
    assert.equal(result.value.asset.tipo, 'permanente');
    assert.equal(harness.state.logs[0].action, 'Bem Cadastrado');
});

