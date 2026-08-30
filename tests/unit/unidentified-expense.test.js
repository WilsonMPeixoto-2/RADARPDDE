'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { InvoiceService } = require('../../src/application/invoice-service.js');
const fluxo = require('../../src/domain/fluxo-operacional.js');

function createHarness() {
    const state = {
        schools: [{ id: 'ESC-1', denominação: 'Escola Teste', processoInventario: '' }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
        verifications: {
            'ESC-1': {
                '2026-08_BASIC': {
                    bonificacao: { notaFiscal: 'Não', consAssessoria: 'Não se aplica', consEnviada: false },
                    analise: { notaFiscal: 'Não analisado', consAssessoria: 'Correto' },
                    resultadoBonif: ''
                }
            }
        },
        registeredInvoices: [],
        assets: [],
        logs: []
    };
    let sequence = 0;
    const service = new InvoiceService({
        dataService: {
            async execute(command) {
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
        now: () => '2026-08-16T12:00:00.000Z',
        reopenConsolidation: () => {}
    });
    return { state, service };
}

test('rota comum recusa despesa a identificar sem Pendência obrigatória', async () => {
    const { state, service } = createHarness();

    await assert.rejects(
        () => service.save({
            schoolId: 'ESC-1',
            compKey: '2026-08_BASIC',
            description: 'Saída observada no extrato, documentação pendente',
            expenseType: 'a_identificar',
            invoiceNumber: '',
            amount: 850,
            profile: 'controlador'
        }),
        error => error?.code === 'UNIDENTIFIED_EXPENSE_REQUIRES_PENDENCY'
    );

    assert.equal(state.registeredInvoices.length, 0);
    assert.equal(state.assets.length, 0);
});

test('tipos identificados continuam exigindo número da Nota Fiscal', async () => {
    const { service } = createHarness();

    for (const expenseType of ['consumo', 'permanente', 'servico']) {
        await assert.rejects(
            service.save({
                schoolId: 'ESC-1',
                compKey: '2026-08_BASIC',
                description: 'Despesa identificada',
                expenseType,
                invoiceNumber: '',
                amount: 100,
                profile: 'controlador'
            }),
            error => error.code === 'VALIDATION_FAILED'
        );
    }
});

test('despesa a identificar não satisfaz a exigência de Nota Fiscal para análise correta', () => {
    assert.equal(fluxo.shouldRequireFiscalNote({
        bonificacaoNotaFiscal: 'Sim',
        analiseValue: 'Correto',
        fiscalNotes: [{ tipo: 'a_identificar', numero: '', valor: 850 }]
    }), true);

    assert.equal(fluxo.shouldRequireFiscalNote({
        bonificacaoNotaFiscal: 'Sim',
        analiseValue: 'Correto',
        fiscalNotes: [{ tipo: 'consumo', numero: 'NF-123', valor: 850 }]
    }), false);
});

test('editor comum não transforma uma despesa identificada em “Despesa a identificar”', async () => {
    const { state, service } = createHarness();

    const created = await service.save({
        schoolId: 'ESC-1',
        compKey: '2026-08_BASIC',
        description: 'Material já identificado',
        expenseType: 'consumo',
        invoiceNumber: 'NF-123',
        amount: 120,
        profile: 'controlador'
    });

    await assert.rejects(
        () => service.save({
            id: created.value.invoice.id,
            schoolId: 'ESC-1',
            compKey: '2026-08_BASIC',
            description: 'Tentativa de voltar a despesa desconhecida',
            expenseType: 'a_identificar',
            invoiceNumber: '',
            amount: 120,
            profile: 'controlador'
        }),
        error => error?.code === 'UNIDENTIFIED_EXPENSE_REQUIRES_PENDENCY'
    );

    assert.equal(state.registeredInvoices[0].tipo, 'consumo');
    assert.equal(state.registeredInvoices[0].numero, 'NF-123');
});
