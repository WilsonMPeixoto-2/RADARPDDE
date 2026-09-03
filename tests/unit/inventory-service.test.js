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
        registeredInvoices: [],
        verifications: {},
        assets: [{
            id: 'bem-1',
            escolaId: 'ESC-1',
            competencia: '2026-05',
            item: 'Notebook',
            tipo: 'permanente',
            valor: 5000,
            notaFiscal: 'NF-001',
            status: 'Não encaminhada',
            rowVersion: 4
        }],
        logs: []
    };
    const calls = [];
    const persisted = [];
    let sequence = 0;
    const repository = {
        async saveAssetWithLog(input) {
            persisted.push(input);
            return { ok: true };
        }
    };
    const service = new InventoryService({
        dataService: {
            async execute(command) {
                calls.push(command);
                const value = await command.mutate();
                if (typeof command.persist === 'function') {
                    await command.persist({
                        snapshot: {
                            entities: {
                                assets: state.assets.map(asset => ({ ...asset })),
                                administrativeLogs: state.logs.map(log => ({ ...log }))
                            }
                        },
                        repository,
                        defaultPersist: async () => ({ ok: true })
                    });
                }
                return { ok: true, value };
            }
        },
        getState: () => state,
        appendLog: (action, details, context = {}) => {
            const log = { id: `log-${++sequence}`, action, details, ...context };
            state.logs.unshift(log);
            return log;
        },
        createId: prefix => `${prefix}-${++sequence}`,
        now: () => new Date('2026-07-14T14:30:00.000Z')
    });
    return { state, calls, persisted, service };
}

test('atualiza somente a nota fiscal pelo comando versionado e registra auditoria', async () => {
    const harness = createHarness();
    await harness.service.updateAsset({
        assetId: 'bem-1',
        field: 'notaFiscal',
        value: 'NF-001-A',
        profile: 'controlador'
    });

    assert.equal(harness.state.assets[0].notaFiscal, 'NF-001-A');
    assert.equal(harness.state.assets[0].item, 'Notebook');
    assert.equal(harness.state.logs[0].action, 'Bem Patrimonial Atualizado');
    assert.deepEqual(harness.calls[0].changedEntities, ['assets', 'administrativeLogs']);
    assert.equal(harness.persisted.length, 1);
    assert.equal(harness.persisted[0].asset.id, 'bem-1');
    assert.equal(harness.persisted[0].expectedVersion, 4);
    assert.equal(harness.persisted[0].administrativeLog.id, harness.state.logs[0].id);
});

test('bloqueia alteração genérica de status, valor e processo', async () => {
    const harness = createHarness();

    for (const field of ['status', 'valor', 'processoInventario']) {
        await assert.rejects(
            harness.service.updateAsset({
                assetId: 'bem-1',
                field,
                value: 'alteração indevida',
                profile: 'controlador'
            }),
            error => error && error.code === 'VALIDATION_FAILED'
        );
    }

    assert.equal(harness.state.assets[0].status, 'Não encaminhada');
    assert.equal(harness.persisted.length, 0);
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

test('encaminhar bem vinculado sincroniza a verificação mensal sem aprovar análise por herança', async () => {
    const harness = createHarness();
    harness.state.registeredInvoices.push({
        id: 'nota-1',
        escolaId: 'ESC-1',
        compKey: '2026-05_BASIC',
        competencia: '2026-05',
        programaId: 'BASIC',
        tipo: 'permanente',
        numero: 'NF-001',
        valor: 5000,
        bemId: 'bem-1',
        rowVersion: 7
    });
    harness.state.verifications['ESC-1'] = {
        '2026-05_BASIC': {
            bonificacao: { encampInventario: 'Não' },
            analise: { encampInventario: 'Correto' },
            resultadoBonif: '',
            rowVersion: 6
        }
    };

    const result = await harness.service.forward({
        assetId: 'bem-1',
        profile: 'controlador'
    });

    assert.equal(result.value.asset.status, 'Encaminhada');
    assert.equal(result.value.inventoryDelivery, 'Sim');
    assert.equal(
        harness.state.verifications['ESC-1']['2026-05_BASIC'].bonificacao.encampInventario,
        'Sim'
    );
    assert.equal(
        harness.state.verifications['ESC-1']['2026-05_BASIC'].analise.encampInventario,
        'Não analisado'
    );
    assert.deepEqual(harness.calls[0].changedEntities, [
        'registeredInvoices',
        'assets',
        'verifications',
        'administrativeLogs'
    ]);
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
