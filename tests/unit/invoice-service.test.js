'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { InvoiceService } = require('../../src/application/invoice-service.js');

function createHarness(overrides = {}) {
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
        registeredInvoices: [],
        assets: [],
        logs: []
    };
    Object.assign(state, overrides.state || {});
    const calls = [];
    let sequence = 0;
    const dataService = {
        async execute(command) {
            calls.push(command);
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
        now: () => '2026-07-14T12:00:00.000Z',
        reopenConsolidation: (_schoolId, _compKey, verification, changed, profile) => {
            if (changed && profile === 'assistente' && verification.resultadoBonif) {
                verification.resultadoBonif = '';
            }
        }
    });
    return { state, calls, service };
}

test('cadastra gasto de consumo sem criar bem e registra uma única auditoria', async () => {
    const harness = createHarness();

    const result = await harness.service.save({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        description: 'Material pedagógico',
        expenseType: 'consumo',
        invoiceNumber: 'NF-001',
        amount: 150.5,
        profile: 'controlador'
    });

    assert.equal(harness.state.registeredInvoices.length, 1);
    assert.equal(harness.state.assets.length, 0);
    assert.equal(result.value.invoice.tipo, 'consumo');
    assert.equal(result.value.invoice.compKey, '2026-05_BASIC');
    assert.equal(harness.state.logs.length, 1);
    assert.equal(harness.state.logs[0].action, 'Gasto Consumo Cadastrado');
    assert.equal(typeof harness.calls[0].persist, 'function');
    assert.deepEqual(harness.calls[0].changedEntities, [
        'registeredInvoices',
        'assets',
        'verifications',
        'administrativeLogs'
    ]);
});

test('cadastra nota permanente, cria bem vinculado e preserva aviso de processo ausente', async () => {
    const harness = createHarness();

    const result = await harness.service.save({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        description: 'Notebook',
        expenseType: 'permanente',
        invoiceNumber: 'NF-002',
        amount: 5000,
        profile: 'controlador'
    });

    assert.equal(harness.state.assets.length, 1);
    assert.equal(result.value.invoice.bemId, result.value.asset.id);
    assert.equal(result.value.asset.status, 'Não encaminhada');
    assert.equal(result.value.warnings.includes('MISSING_INVENTORY_PROCESS'), true);
    assert.equal(harness.state.logs.length, 1);
    assert.equal(harness.state.logs[0].action, 'Bem Cadastrado');
});

test('edita nota permanente para serviço, remove bem derivado e exige consulta da assessoria', async () => {
    const harness = createHarness();
    harness.state.assets.push({
        id: 'bem-1',
        escolaId: 'ESC-1',
        competencia: '2026-05',
        item: 'PDDE Básico - Notebook',
        tipo: 'permanente',
        valor: 5000,
        notaFiscal: 'NF-002',
        status: 'Não encaminhada'
    });
    harness.state.registeredInvoices.push({
        id: 'nota-1',
        escolaId: 'ESC-1',
        compKey: '2026-05_BASIC',
        desc: 'Notebook',
        tipo: 'permanente',
        numero: 'NF-002',
        valor: 5000,
        bemId: 'bem-1',
        dataRegistro: '2026-07-13T10:00:00.000Z'
    });

    const result = await harness.service.save({
        id: 'nota-1',
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        description: 'Manutenção elétrica',
        expenseType: 'servico',
        invoiceNumber: 'NF-002-A',
        amount: 800,
        profile: 'assistente'
    });

    assert.equal(harness.state.assets.length, 0);
    assert.equal(result.value.invoice.bemId, null);
    assert.equal(result.value.warnings.includes('SERVICE_ADVISORY_REQUIRED'), true);
    assert.equal(
        harness.state.verifications['ESC-1']['2026-05_BASIC'].bonificacao.consAssessoria,
        'Não'
    );
    assert.equal(
        harness.state.verifications['ESC-1']['2026-05_BASIC'].analise.consAssessoria,
        'Não analisado'
    );
    assert.equal(harness.state.logs.length, 1);
    assert.equal(harness.state.logs[0].action, 'Nota Editada');
});

test('remove a última nota e restaura análise e assessoria sem deixar bem órfão', async () => {
    const harness = createHarness();
    const verification = harness.state.verifications['ESC-1']['2026-05_BASIC'];
    verification.bonificacao.consAssessoria = 'Não';
    verification.analise.consAssessoria = 'Incorreto';
    harness.state.assets.push({
        id: 'bem-1',
        escolaId: 'ESC-1',
        competencia: '2026-05',
        item: 'Equipamento',
        tipo: 'permanente',
        valor: 900,
        notaFiscal: 'NF-003',
        status: 'Não encaminhada'
    });
    harness.state.registeredInvoices.push({
        id: 'nota-1',
        escolaId: 'ESC-1',
        compKey: '2026-05_BASIC',
        desc: 'Serviço convertido',
        tipo: 'servico',
        numero: 'NF-003',
        valor: 900,
        bemId: 'bem-1',
        dataRegistro: '2026-07-13T10:00:00.000Z'
    });

    const result = await harness.service.remove({
        id: 'nota-1',
        schoolId: 'ESC-1',
        profile: 'controlador'
    });

    assert.equal(harness.state.registeredInvoices.length, 0);
    assert.equal(harness.state.assets.length, 0);
    assert.equal(verification.bonificacao.consAssessoria, 'Não se aplica');
    assert.equal(verification.analise.consAssessoria, 'Correto');
    assert.equal(verification.analise.notaFiscal, 'Não analisado');
    assert.equal(result.value.resetFiscalAnalysis, true);
    assert.equal(harness.state.logs.length, 1);
    assert.equal(harness.state.logs[0].action, 'Nota Fiscal Removida');
});

test('bloqueia nota consolidada para controlador e aceita assistente com reabertura', async () => {
    const harness = createHarness();
    harness.state.verifications['ESC-1']['2026-05_BASIC'].resultadoBonif = 'apta';

    await assert.rejects(
        harness.service.save({
            schoolId: 'ESC-1',
            compKey: '2026-05_BASIC',
            description: 'Material',
            expenseType: 'consumo',
            invoiceNumber: 'NF-004',
            amount: 10,
            profile: 'controlador'
        }),
        error => error.code === 'CONSOLIDATED_VERIFICATION'
    );

    await harness.service.save({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        description: 'Material',
        expenseType: 'consumo',
        invoiceNumber: 'NF-004',
        amount: 10,
        profile: 'assistente'
    });
    assert.equal(harness.state.verifications['ESC-1']['2026-05_BASIC'].resultadoBonif, '');
});
