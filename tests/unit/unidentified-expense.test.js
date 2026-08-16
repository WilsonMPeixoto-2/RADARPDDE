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

test('cadastra despesa a identificar sem número de NF e sem efeitos derivados', async () => {
    const { state, service } = createHarness();

    const result = await service.save({
        schoolId: 'ESC-1',
        compKey: '2026-08_BASIC',
        description: 'Saída observada no extrato, documentação pendente',
        expenseType: 'a_identificar',
        invoiceNumber: '',
        amount: 850,
        profile: 'controlador'
    });

    assert.equal(result.value.invoice.tipo, 'a_identificar');
    assert.equal(result.value.invoice.numero, '');
    assert.equal(result.value.invoice.bemId, null);
    assert.equal(state.assets.length, 0);
    assert.equal(result.value.warnings.includes('SERVICE_ADVISORY_REQUIRED'), false);
    assert.equal(state.verifications['ESC-1']['2026-08_BASIC'].bonificacao.consAssessoria, 'Não se aplica');
    assert.equal(state.logs[0].action, 'Despesa a Identificar Cadastrada');
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

test('ao identificar como permanente, cria o bem e passa a exigir número', async () => {
    const { state, service } = createHarness();

    const created = await service.save({
        schoolId: 'ESC-1',
        compKey: '2026-08_BASIC',
        description: 'Equipamento visto no extrato',
        expenseType: 'a_identificar',
        invoiceNumber: '',
        amount: 1200,
        profile: 'controlador'
    });

    const identified = await service.save({
        id: created.value.invoice.id,
        schoolId: 'ESC-1',
        compKey: '2026-08_BASIC',
        description: 'Projetor multimídia',
        expenseType: 'permanente',
        invoiceNumber: 'NF-987',
        amount: 1200,
        profile: 'controlador'
    });

    assert.equal(identified.value.invoice.tipo, 'permanente');
    assert.equal(identified.value.invoice.numero, 'NF-987');
    assert.equal(state.assets.length, 1);
    assert.equal(identified.value.invoice.bemId, identified.value.asset.id);
});
