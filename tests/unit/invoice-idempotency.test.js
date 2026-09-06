'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { InvoiceService } = require('../../src/application/invoice-service.js');

const OPERATION_KEY = '11111111-2222-4333-8444-555555555555';

function createHarness(sequenceRef) {
    const state = {
        schools: [{ id: 'ESC-1', denominação: 'Escola Teste', processoInventario: '' }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
        verifications: {
            'ESC-1': {
                '2026-05_BASIC': {
                    id: 'ESC-1::2026-05::BASIC',
                    rowVersion: 8,
                    bonificacao: { notaFiscal: 'Sim', consAssessoria: 'Não se aplica', consEnviada: false },
                    analise: { notaFiscal: 'Correto', consAssessoria: 'Correto' },
                    resultadoBonif: ''
                }
            }
        },
        registeredInvoices: [],
        assets: [],
        pendencies: [],
        logs: []
    };
    const commands = [];
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
            const log = { id: `log-${++sequenceRef.value}`, action, details };
            state.logs.unshift(log);
            return log;
        },
        createId: prefix => `${prefix}-${++sequenceRef.value}`,
        now: () => '2026-09-06T06:30:00.000Z',
        reopenConsolidation: () => undefined
    });
    return { state, commands, service };
}

function saveInput() {
    return {
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        description: 'Material pedagógico',
        expenseType: 'consumo',
        invoiceNumber: 'NF-RETRY-001',
        amount: 250,
        profile: 'controlador',
        operationKey: OPERATION_KEY
    };
}

test('retry da mesma intenção conserva identidades locais e encaminha a mesma chave ao repositório', async () => {
    const sequenceRef = { value: 0 };
    const first = createHarness(sequenceRef);
    const second = createHarness(sequenceRef);

    const firstResult = await first.service.save(saveInput());
    const secondResult = await second.service.save(saveInput());

    assert.equal(firstResult.value.invoice.id, secondResult.value.invoice.id);
    assert.equal(firstResult.value.auditLog.id, secondResult.value.auditLog.id);
    assert.equal(firstResult.value.operationKey, OPERATION_KEY);
    assert.equal(secondResult.value.operationKey, OPERATION_KEY);

    const rpcCalls = [];
    await first.commands[0].persist({
        repository: {
            capabilities: () => ({ atomicInvoiceEffects: true }),
            saveInvoiceWithEffects: async input => {
                rpcCalls.push(input);
                return { invoice: { id: firstResult.value.invoice.id } };
            }
        },
        snapshot: {
            entities: {
                registeredInvoices: [{ id: firstResult.value.invoice.id }],
                assets: [],
                verifications: [{ id: firstResult.value.verificationId }],
                administrativeLogs: [{ id: firstResult.value.auditLog.id }]
            }
        },
        value: firstResult.value,
        defaultPersist: async () => ({ fallback: true })
    });

    assert.equal(rpcCalls.length, 1);
    assert.equal(rpcCalls[0].operationKey, OPERATION_KEY);
});

test('duas intenções diferentes com conteúdo igual continuam produzindo despesas distintas', async () => {
    const sequenceRef = { value: 0 };
    const first = createHarness(sequenceRef);
    const second = createHarness(sequenceRef);

    const firstResult = await first.service.save(saveInput());
    const secondResult = await second.service.save({
        ...saveInput(),
        operationKey: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    });

    assert.notEqual(firstResult.value.invoice.id, secondResult.value.invoice.id);
    assert.notEqual(firstResult.value.auditLog.id, secondResult.value.auditLog.id);
});
