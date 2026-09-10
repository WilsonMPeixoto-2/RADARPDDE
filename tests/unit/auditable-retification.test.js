'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { InvoiceService } = require('../../src/application/invoice-service.js');
const { PendencyService } = require('../../src/application/pendency-service.js');
const retification = require('../../src/integration/auditable-retification.js');

function createDataService(calls) {
    return {
        async execute(command) {
            calls.push(command);
            const value = await command.mutate();
            return { ok: true, value };
        }
    };
}

function createInvoiceHarness({ unidentified = false } = {}) {
    const invoiceId = unidentified ? 'nota-a-identificar' : 'nota-com-pendencia';
    const pendencyId = unidentified ? 'pend-a-identificar' : 'pend-nota';
    const state = {
        schools: [{
            id: 'ESC-1',
            denominação: 'Escola Teste',
            processoInventario: 'PROC-2026/001'
        }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
        verifications: {
            'ESC-1': {
                '2026-05_BASIC': {
                    bonificacao: {
                        notaFiscal: 'Sim',
                        consAssessoria: 'Não se aplica',
                        consEnviada: false,
                        encampInventario: 'Não se aplica'
                    },
                    analise: {
                        notaFiscal: 'Incorreto',
                        consAssessoria: 'Correto',
                        encampInventario: 'Correto'
                    },
                    resultadoBonif: '',
                    rowVersion: 2
                }
            }
        },
        registeredInvoices: [{
            id: invoiceId,
            escolaId: 'ESC-1',
            compKey: '2026-05_BASIC',
            competencia: '2026-05',
            programaId: 'BASIC',
            desc: unidentified ? 'Débito original' : 'Material original',
            descricao: unidentified ? 'Débito original' : 'Material original',
            tipo: unidentified ? 'a_identificar' : 'consumo',
            numero: unidentified ? 'REF-1' : 'NF-1',
            valor: unidentified ? 300 : 100,
            bemId: null,
            analiseDocumentoFiscal: 'Incorreto',
            dataRegistro: '2026-09-01T12:00:00.000Z',
            rowVersion: 3
        }],
        assets: [],
        pendencies: [{
            id: pendencyId,
            escolaId: 'ESC-1',
            competenciaOrigem: '2026-05',
            programaId: 'BASIC',
            documentoKey: 'notaFiscal',
            registeredInvoiceId: invoiceId,
            status: 'Aberta',
            item: unidentified ? 'Despesa a identificar' : 'Nota Fiscal',
            motivo: 'Documento ausente',
            observacao: 'Registro original',
            documentSnapshot: {
                registeredInvoiceId: invoiceId,
                tipo: unidentified ? 'a_identificar' : 'consumo',
                numero: unidentified ? 'REF-1' : 'NF-1',
                descricao: unidentified ? 'Débito original' : 'Material original',
                valor: unidentified ? 300 : 100
            }
        }],
        logs: []
    };
    const calls = [];
    let sequence = 0;
    const service = new InvoiceService({
        dataService: createDataService(calls),
        getState: () => state,
        appendLog: (action, details) => {
            const log = { id: `log-${++sequence}`, action, details };
            state.logs.unshift(log);
            return log;
        },
        getCurrentProfile: () => 'controlador',
        createId: prefix => `${prefix}-${++sequence}`,
        now: () => '2026-09-09T15:00:00.000Z',
        reopenConsolidation: () => {}
    });
    retification.protectInvoiceService(service);
    return { state, calls, service, invoiceId, pendencyId };
}

test('retifica NF com Pendência ativa preservando identidade, Pendência e snapshot histórico', async () => {
    const harness = createInvoiceHarness();
    const snapshotBefore = structuredClone(harness.state.pendencies[0].documentSnapshot);

    const result = await harness.service.save({
        id: harness.invoiceId,
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        description: 'Material corrigido',
        expenseType: 'consumo',
        invoiceNumber: 'NF-2',
        amount: 175.5,
        profile: 'controlador'
    });

    const invoice = harness.state.registeredInvoices[0];
    assert.equal(result.ok, true);
    assert.equal(invoice.id, harness.invoiceId);
    assert.equal(invoice.desc, 'Material corrigido');
    assert.equal(invoice.numero, 'NF-2');
    assert.equal(invoice.valor, 175.5);
    assert.equal(invoice.tipo, 'consumo');
    assert.equal(harness.state.pendencies.length, 1);
    assert.equal(harness.state.pendencies[0].id, harness.pendencyId);
    assert.equal(harness.state.pendencies[0].status, 'Aberta');
    assert.deepEqual(harness.state.pendencies[0].documentSnapshot, snapshotBefore);
    assert.equal(harness.state.logs[0].action, 'Nota Editada');
});

test('retificação com histórico rejeita mudança de tipo estrutural', async () => {
    const harness = createInvoiceHarness();

    await assert.rejects(
        () => harness.service.save({
            id: harness.invoiceId,
            schoolId: 'ESC-1',
            compKey: '2026-05_BASIC',
            description: 'Serviço indevido',
            expenseType: 'servico',
            invoiceNumber: 'NF-1',
            amount: 100,
            profile: 'controlador'
        }),
        error => error?.code === 'INVOICE_HISTORY_LOCKED'
    );
    assert.equal(harness.state.registeredInvoices[0].tipo, 'consumo');
});

test('retifica a_identificar sem alterar tipo, análise ou ciclo da Pendência', async () => {
    const harness = createInvoiceHarness({ unidentified: true });
    const snapshotBefore = structuredClone(harness.state.pendencies[0].documentSnapshot);

    await harness.service.save({
        id: harness.invoiceId,
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        description: 'Débito corrigido',
        expenseType: 'a_identificar',
        invoiceNumber: 'REF-2',
        amount: 400.25,
        profile: 'controlador'
    });

    const invoice = harness.state.registeredInvoices[0];
    assert.equal(invoice.id, harness.invoiceId);
    assert.equal(invoice.tipo, 'a_identificar');
    assert.equal(invoice.analiseDocumentoFiscal, 'Incorreto');
    assert.equal(invoice.desc, 'Débito corrigido');
    assert.equal(invoice.numero, 'REF-2');
    assert.equal(invoice.valor, 400.25);
    assert.equal(harness.state.pendencies[0].status, 'Aberta');
    assert.deepEqual(harness.state.pendencies[0].documentSnapshot, snapshotBefore);
});

test('retificação manual preserva ID, status e histórico e registra auditoria', async () => {
    const state = {
        schools: [{ id: 'ESC-1', denominação: 'Escola Teste' }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
        verifications: {},
        registeredInvoices: [],
        assets: [],
        pendencies: [{
            id: 'pend-manual',
            escolaId: 'ESC-1',
            competencia: '2026-05',
            item: 'Extrato Conta Corrente',
            documentoKey: 'Extrato Conta Corrente',
            motivo: 'Documento ausente',
            responsavel: 'Escola',
            status: 'Aberta',
            dataAbertura: '2026-09-01',
            observacao: 'Observação antiga',
            historico: [{ id: 'evt-1', tipo: 'abertura' }],
            rowVersion: 4
        }],
        logs: []
    };
    const calls = [];
    let sequence = 0;
    const service = new PendencyService({
        dataService: createDataService(calls),
        getState: () => state,
        appendLog: (action, details, context = {}) => {
            const log = { id: `log-${++sequence}`, action, details, escolaId: context.escolaId };
            state.logs.unshift(log);
            return log;
        },
        getCurrentProfile: () => 'controlador',
        getAuthenticatedRole: () => 'controller',
        createId: prefix => `${prefix}-${++sequence}`,
        now: () => '2026-09-09T15:00:00.000Z'
    });
    retification.protectPendencyService(service);

    const result = await service.retifyManualDetails({
        pendencyId: 'pend-manual',
        item: 'Extrato Investimento',
        reason: 'Documento ausente',
        responsible: 'Verbas Federais',
        observation: 'Observação corrigida'
    });

    const pendency = state.pendencies[0];
    assert.equal(result.ok, true);
    assert.equal(pendency.id, 'pend-manual');
    assert.equal(pendency.item, 'Extrato Investimento');
    assert.equal(pendency.documentoKey, 'Extrato Conta Corrente');
    assert.equal(pendency.responsavel, 'Verbas Federais');
    assert.equal(pendency.observacao, 'Observação corrigida');
    assert.equal(pendency.status, 'Aberta');
    assert.equal(pendency.historico.length, 1);
    assert.equal(state.logs[0].action, 'Pendência Retificada');
    assert.deepEqual(calls[0].changedEntities, ['pendencies', 'administrativeLogs']);
});

test('retificação manual rejeita opções novas fora do cadastro canônico', async () => {
    const state = {
        pendencies: [{
            id: 'pend-manual',
            escolaId: 'ESC-1',
            competencia: '2026-05',
            item: 'Extrato Conta Corrente',
            documentoKey: 'Extrato Conta Corrente',
            motivo: 'Documento ausente',
            responsavel: 'Escola',
            status: 'Aberta',
            observacao: 'Observação antiga',
            rowVersion: 1
        }]
    };
    const service = new PendencyService({
        dataService: createDataService([]),
        getState: () => state,
        appendLog: () => ({ id: 'log-1' }),
        getCurrentProfile: () => 'controlador',
        getAuthenticatedRole: () => 'controller'
    });
    retification.protectPendencyService(service);

    await assert.rejects(
        () => service.retifyManualDetails({
            pendencyId: 'pend-manual',
            item: 'Item inventado',
            reason: 'Documento ausente',
            responsible: 'Equipe CRE',
            observation: 'Observação corrigida'
        }),
        error => error?.code === 'VALIDATION_FAILED'
    );
});
