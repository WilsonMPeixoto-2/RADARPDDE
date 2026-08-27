'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { InvoiceService } = require('../../src/application/invoice-service.js');

function createHarness({ withInvoice = false } = {}) {
    const state = {
        schools: [{
            id: 'ESC-1',
            denominação: 'Escola Teste',
            processoInventario: ''
        }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
        verifications: {
            'ESC-1': {
                '2026-05_BASIC': {
                    bonificacao: {
                        notaFiscal: 'Sim',
                        consAssessoria: 'Não se aplica',
                        consEnviada: false
                    },
                    analise: {
                        notaFiscal: 'Correto',
                        consAssessoria: 'Correto'
                    },
                    resultadoBonif: ''
                }
            }
        },
        registeredInvoices: withInvoice ? [{
            id: 'nota-1',
            escolaId: 'ESC-1',
            compKey: '2026-05_BASIC',
            desc: 'Material existente',
            tipo: 'consumo',
            numero: 'NF-EXISTENTE',
            valor: 50,
            bemId: null,
            dataRegistro: '2026-08-26T12:00:00.000Z'
        }] : [],
        assets: [],
        logs: []
    };
    const commands = [];
    let sequence = 0;
    const service = new InvoiceService({
        dataService: {
            async execute(command) {
                commands.push(command);
                const value = await command.mutate();
                return { ok: true, value };
            }
        },
        getState: () => state,
        appendLog: (action, details) => {
            const log = { id: `log-${++sequence}`, action, details };
            state.logs.unshift(log);
            return log;
        },
        createId: prefix => `${prefix}-${++sequence}`,
        now: () => '2026-08-26T12:00:00.000Z',
        reopenConsolidation: () => {}
    });
    return { service, commands };
}

test('invoice:save declara administrativeLogs como isento de refetch remoto no núcleo', async () => {
    const harness = createHarness();

    await harness.service.save({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        description: 'Material pedagógico',
        expenseType: 'consumo',
        invoiceNumber: 'NF-PR1',
        amount: 150,
        profile: 'controlador'
    });

    assert.equal(harness.commands.length, 1);
    assert.equal(harness.commands[0].name, 'invoice:save');
    assert.deepEqual(
        harness.commands[0].remoteRefreshExemptEntities,
        ['administrativeLogs']
    );
});

test('invoice:remove declara administrativeLogs como isento de refetch remoto no núcleo', async () => {
    const harness = createHarness({ withInvoice: true });

    await harness.service.remove({
        id: 'nota-1',
        schoolId: 'ESC-1',
        profile: 'controlador'
    });

    assert.equal(harness.commands.length, 1);
    assert.equal(harness.commands[0].name, 'invoice:remove');
    assert.deepEqual(
        harness.commands[0].remoteRefreshExemptEntities,
        ['administrativeLogs']
    );
});
