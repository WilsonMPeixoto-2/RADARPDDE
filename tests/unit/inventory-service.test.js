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
        capabilities: () => ({ atomicInvoiceEffects: true }),
        async saveAssetWithLog(input) {
            persisted.push({ kind: 'asset', ...input });
            return { ok: true };
        },
        async saveInvoiceWithEffects(input) {
            persisted.push({ kind: 'invoice-effects', ...input });
            return { ok: true };
        }
    };
    const service = new InventoryService({
        dataService: {
            async execute(command) {
                calls.push(command);
                const value = await command.mutate();
                if (typeof command.persist === 'function') {
                    const verifications = Object.entries(state.verifications).flatMap(([schoolId, contexts]) => (
                        Object.entries(contexts).map(([compKey, verification]) => {
                            const separator = compKey.indexOf('_');
                            const competence = separator >= 0 ? compKey.slice(0, separator) : compKey;
                            const programId = separator >= 0 ? compKey.slice(separator + 1) : '';
                            return {
                                id: `${schoolId}::${competence}::${programId}`,
                                school_id: schoolId,
                                competence_id: competence,
                                program_id: programId,
                                bonification: { ...(verification.bonificacao || {}) },
                                analysis: { ...(verification.analise || {}) },
                                bonus_result: verification.resultadoBonif || '',
                                row_version: verification.rowVersion || null
                            };
                        })
                    ));
                    await command.persist({
                        snapshot: {
                            entities: {
                                registeredInvoices: state.registeredInvoices.map(invoice => ({ ...invoice })),
                                verifications,
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

test('atualiza somente a nota fiscal pelo comando versionado e registra auditoria quando o bem é avulso', async () => {
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

test('bloqueia edição do número da NF no bem quando existe Nota Fiscal vinculada', async () => {
    const harness = createHarness();
    harness.state.registeredInvoices.push({
        id: 'invoice-1',
        escolaId: 'ESC-1',
        compKey: '2026-05_BASIC',
        competencia: '2026-05',
        programaId: 'BASIC',
        tipo: 'permanente',
        numero: 'NF-001',
        valor: 5000,
        bemId: 'bem-1',
        rowVersion: 3
    });

    await assert.rejects(
        harness.service.updateAsset({
            assetId: 'bem-1',
            field: 'notaFiscal',
            value: 'NF-OUTRA',
            profile: 'controlador'
        }),
        error => error && error.code === 'LINKED_INVOICE_FIELD_LOCKED'
    );

    assert.equal(harness.state.assets[0].notaFiscal, 'NF-001');
    assert.equal(harness.persisted.length, 0);
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

test('encaminhamento posterior de bem vinculado sincroniza Encaminhado para Inventariação no Prontuário', async () => {
    const harness = createHarness();
    harness.state.registeredInvoices.push({
        id: 'invoice-1',
        escolaId: 'ESC-1',
        compKey: '2026-05_BASIC',
        competencia: '2026-05',
        programaId: 'BASIC',
        tipo: 'permanente',
        numero: 'NF-001',
        valor: 5000,
        bemId: 'bem-1',
        rowVersion: 3
    });
    harness.state.verifications['ESC-1'] = {
        '2026-05_BASIC': {
            bonificacao: { encampInventario: 'Não' },
            analise: { encampInventario: 'Correto' },
            resultadoBonif: '',
            rowVersion: 7
        }
    };

    const result = await harness.service.forward({
        assetId: 'bem-1',
        profile: 'controlador'
    });

    assert.equal(result.value.asset.status, 'Encaminhada');
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
    assert.equal(harness.persisted[0].kind, 'invoice-effects');
    assert.equal(harness.persisted[0].expectedInvoiceVersion, 3);
    assert.equal(harness.persisted[0].expectedAssetVersion, 4);
    assert.equal(harness.persisted[0].expectedVerificationVersion, 7);
});

test('não permite concluir inventariação antes de o bem estar encaminhado', async () => {
    const harness = createHarness();

    await assert.rejects(
        harness.service.inventory({
            assetId: 'bem-1',
            responsible: 'Aylane',
            responsibleId: 'INV-1',
            notes: 'Tombamento conferido.',
            profile: 'inventario'
        }),
        error => error && error.code === 'ASSET_NOT_FORWARDED'
    );

    assert.equal(harness.state.assets[0].status, 'Não encaminhada');
    assert.equal(harness.persisted.length, 0);
});

test('conclui inventariação preservando responsável, observações e instante canônico', async () => {
    const harness = createHarness();
    harness.state.assets[0].status = 'Encaminhada';
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
