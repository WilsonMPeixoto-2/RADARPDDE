'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { InvoiceService } = require('../../src/application/invoice-service.js');

function createHarness() {
    const state = {
        schools: [{ id: 'ESC-1', denominação: 'Escola Teste', processoInventario: '' }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
        verifications: {
            'ESC-1': {
                '2026-05_BASIC': {
                    rowVersion: 8,
                    bonificacao: { notaFiscal: 'Sim', consAssessoria: 'Não se aplica', consEnviada: false },
                    analise: { notaFiscal: 'Correto', consAssessoria: 'Correto' },
                    resultadoBonif: ''
                }
            }
        },
        registeredInvoices: [{
            id: 'nota-1',
            rowVersion: 6,
            escolaId: 'ESC-1',
            compKey: '2026-05_BASIC',
            competencia: '2026-05',
            programaId: 'BASIC',
            desc: 'Notebook',
            descricao: 'Notebook',
            tipo: 'permanente',
            numero: 'NF-001',
            valor: 5000,
            bemId: 'bem-1',
            dataRegistro: '2026-08-20T12:00:00.000Z'
        }],
        assets: [{
            id: 'bem-1',
            rowVersion: 4,
            escolaId: 'ESC-1',
            competencia: '2026-05',
            item: 'PDDE Básico - Notebook',
            descricao: 'PDDE Básico - Notebook',
            tipo: 'permanente',
            valor: 5000,
            notaFiscal: 'NF-001',
            processoInventario: '',
            status: 'Não encaminhada'
        }],
        logs: []
    };
    const commands = [];
    let sequence = 0;
    const dataService = {
        async execute(command) {
            commands.push(command);
            const value = await command.mutate();
            return { ok: true, value };
        }
    };
    const service = new InvoiceService({
        dataService,
        getState: () => state,
        appendLog: (action, details) => {
            const log = { id: `log-${++sequence}`, action, details };
            state.logs.unshift(log);
            return log;
        },
        createId: prefix => `${prefix}-${++sequence}`,
        now: () => '2026-08-22T03:00:00.000Z',
        reopenConsolidation: () => undefined
    });
    return { state, commands, service };
}

test('transição de permanente para serviço leva a versão do bem removido para a RPC atômica', async () => {
    const harness = createHarness();
    const result = await harness.service.save({
        id: 'nota-1',
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        description: 'Manutenção elétrica',
        expenseType: 'servico',
        invoiceNumber: 'NF-001',
        amount: 800,
        profile: 'assistente'
    });

    assert.equal(harness.state.assets.length, 0);
    assert.equal(result.value.asset, null);
    assert.equal(result.value.removedAsset.id, 'bem-1');
    assert.equal(result.value.removedAsset.rowVersion, 4);

    const rpcCalls = [];
    await harness.commands[0].persist({
        repository: {
            capabilities: () => ({ atomicInvoiceEffects: true }),
            saveInvoiceWithEffects: async input => {
                rpcCalls.push(input);
                return { invoice: { id: 'nota-1' } };
            }
        },
        snapshot: {
            entities: {
                registeredInvoices: [{ id: 'nota-1' }],
                assets: [],
                verifications: [{ id: 'ESC-1::2026-05::BASIC' }],
                administrativeLogs: [{ id: result.value.auditLog.id }]
            }
        },
        value: result.value,
        defaultPersist: async () => ({ fallback: true })
    });

    assert.equal(rpcCalls.length, 1);
    assert.equal(rpcCalls[0].asset, null);
    assert.equal(rpcCalls[0].expectedAssetVersion, 4);
});
