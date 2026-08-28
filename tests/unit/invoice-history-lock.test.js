'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { InvoiceService } = require('../../src/application/invoice-service.js');
const { protectService } = require('../../src/integration/invoice-history-lock.js');

function createHarness() {
    const verification = () => ({
        bonificacao: { notaFiscal: 'Sim', consAssessoria: 'Sim', consEnviada: true },
        analise: { notaFiscal: 'Correto', consAssessoria: 'Correto' },
        resultadoBonif: ''
    });
    const state = {
        schools: [
            { id: 'ESC-1', denominação: 'Escola Um', processoInventario: '' },
            { id: 'ESC-2', denominação: 'Escola Dois', processoInventario: '' }
        ],
        programs: [
            { id: 'BASIC', name: 'PDDE Básico' },
            { id: 'OTHER', name: 'Outro Programa' }
        ],
        verifications: {
            'ESC-1': {
                '2026-05_BASIC': verification(),
                '2026-06_BASIC': verification(),
                '2026-05_OTHER': verification()
            },
            'ESC-2': {
                '2026-05_BASIC': verification()
            }
        },
        registeredInvoices: [{
            id: 'NF-LOCKED',
            escolaId: 'ESC-1',
            compKey: '2026-05_BASIC',
            competencia: '2026-05',
            programaId: 'BASIC',
            desc: 'Serviço original',
            descricao: 'Serviço original',
            tipo: 'servico',
            numero: '100',
            valor: 300,
            bemId: null,
            consultaAssessoriaEnviada: true,
            analiseConsultaAssessoria: 'Correto',
            rowVersion: 1
        }],
        pendencies: [{
            id: 'PEND-HIST',
            escolaId: 'ESC-1',
            competencia: '2026-05',
            competenciaOrigem: '2026-05',
            programaId: 'BASIC',
            documentoKey: 'consAssessoria',
            registeredInvoiceId: 'NF-LOCKED',
            status: 'Resolvida'
        }],
        assets: [],
        logs: []
    };
    let sequence = 0;
    const dataService = {
        async execute(command) {
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
        now: () => '2026-08-23T18:15:00.000Z',
        reopenConsolidation: () => {}
    });
    protectService(service);
    return { state, service };
}

async function expectHistoryLock(action) {
    await assert.rejects(
        action,
        error => error?.code === 'INVOICE_HISTORY_LOCKED'
    );
}

test('NF com histórico de pendência de Assessoria não pode ser excluída', async () => {
    const { state, service } = createHarness();

    await expectHistoryLock(() => service.remove({
        id: 'NF-LOCKED',
        schoolId: 'ESC-1',
        profile: 'controlador'
    }));

    assert.equal(state.registeredInvoices.length, 1);
    assert.equal(state.logs.length, 0);
});

test('NF com histórico de pendência não pode deixar de ser serviço', async () => {
    const { state, service } = createHarness();

    await expectHistoryLock(() => service.save({
        id: 'NF-LOCKED',
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        description: 'Material convertido',
        expenseType: 'consumo',
        invoiceNumber: '100',
        amount: 300,
        profile: 'assistente'
    }));

    assert.equal(state.registeredInvoices[0].tipo, 'servico');
    assert.equal(state.logs.length, 0);
});

test('NF com histórico de pendência não pode mudar escola, competência ou programa', async () => {
    const targets = [
        { schoolId: 'ESC-2', compKey: '2026-05_BASIC' },
        { schoolId: 'ESC-1', compKey: '2026-06_BASIC' },
        { schoolId: 'ESC-1', compKey: '2026-05_OTHER' }
    ];

    for (const target of targets) {
        const { state, service } = createHarness();
        await expectHistoryLock(() => service.save({
            id: 'NF-LOCKED',
            schoolId: target.schoolId,
            compKey: target.compKey,
            description: 'Serviço original',
            expenseType: 'servico',
            invoiceNumber: '100',
            amount: 300,
            profile: 'assistente'
        }));
        assert.equal(state.registeredInvoices[0].escolaId, 'ESC-1');
        assert.equal(state.registeredInvoices[0].compKey, '2026-05_BASIC');
        assert.equal(state.logs.length, 0);
    }
});

test('NF com histórico de pendência continua permitindo correções não estruturais', async () => {
    const { state, service } = createHarness();

    await service.save({
        id: 'NF-LOCKED',
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        description: 'Serviço corrigido',
        expenseType: 'servico',
        invoiceNumber: '100-A',
        amount: 325.5,
        profile: 'assistente'
    });

    const invoice = state.registeredInvoices[0];
    assert.equal(invoice.escolaId, 'ESC-1');
    assert.equal(invoice.compKey, '2026-05_BASIC');
    assert.equal(invoice.tipo, 'servico');
    assert.equal(invoice.desc, 'Serviço corrigido');
    assert.equal(invoice.numero, '100-A');
    assert.equal(invoice.valor, 325.5);
    assert.equal(state.logs.length, 1);
});


test('NF com histórico individual de notaFiscal recebe a mesma trava estrutural', async () => {
    const { state, service } = createHarness();
    state.pendencies[0] = {
        ...state.pendencies[0],
        documentoKey: 'notaFiscal'
    };

    await expectHistoryLock(() => service.save({
        id: 'NF-LOCKED',
        schoolId: 'ESC-1',
        compKey: '2026-06_BASIC',
        description: 'Serviço original',
        expenseType: 'servico',
        invoiceNumber: '100',
        amount: 300,
        profile: 'assistente'
    }));

    await expectHistoryLock(() => service.remove({
        id: 'NF-LOCKED',
        schoolId: 'ESC-1',
        profile: 'controlador'
    }));

    assert.equal(state.registeredInvoices.length, 1);
    assert.equal(state.registeredInvoices[0].compKey, '2026-05_BASIC');
    assert.equal(state.logs.length, 0);
});


test('a_identificar com histórico notaFiscal pode ser identificado preservando o ID', async () => {
    const { state, service } = createHarness();
    state.registeredInvoices[0] = {
        ...state.registeredInvoices[0],
        tipo: 'a_identificar',
        numero: '',
        desc: 'Débito sem identificação',
        descricao: 'Débito sem identificação',
        consultaAssessoriaEnviada: undefined,
        analiseConsultaAssessoria: undefined
    };
    state.pendencies[0] = {
        ...state.pendencies[0],
        documentoKey: 'notaFiscal'
    };

    const result = await service.save({
        id: 'NF-LOCKED',
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        description: 'Material identificado',
        expenseType: 'consumo',
        invoiceNumber: 'NF-IDENTIFICADA',
        amount: 300,
        profile: 'controlador'
    });

    assert.equal(result.value.invoice.id, 'NF-LOCKED');
    assert.equal(state.registeredInvoices[0].tipo, 'consumo');
    assert.equal(state.registeredInvoices[0].numero, 'NF-IDENTIFICADA');
    assert.equal(state.pendencies[0].registeredInvoiceId, 'NF-LOCKED');
});
