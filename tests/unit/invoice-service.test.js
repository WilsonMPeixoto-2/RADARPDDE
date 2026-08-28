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
        pendencies: [],
        logs: []
    };
    Object.assign(state, overrides.state || {});
    const calls = [];
    const reopenCalls = [];
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
        reopenConsolidation: (schoolId, compKey, verification, changed, profile) => {
            reopenCalls.push({ schoolId, compKey, changed, profile });
            if (changed && profile === 'assistente' && verification.resultadoBonif) {
                verification.resultadoBonif = '';
            }
        }
    });
    return { state, calls, reopenCalls, service };
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

test('edição semanticamente idêntica é no-op sem DataService, log ou reabertura', async () => {
    const harness = createHarness();
    harness.state.registeredInvoices.push({
        id: 'nota-1',
        escolaId: 'ESC-1',
        compKey: '2026-05_BASIC',
        competencia: '2026-05',
        programaId: 'BASIC',
        desc: 'Material pedagógico',
        descricao: 'Material pedagógico',
        tipo: 'consumo',
        numero: 'NF-001',
        valor: 150.5,
        bemId: null,
        dataRegistro: '2026-07-14T12:00:00.000Z',
        rowVersion: 4
    });

    const result = await harness.service.save({
        id: 'nota-1',
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        description: 'Material pedagógico',
        expenseType: 'consumo',
        invoiceNumber: 'NF-001',
        amount: 150.5,
        profile: 'controlador'
    });

    assert.equal(result.value.unchanged, true);
    assert.equal(result.value.invoice.id, 'nota-1');
    assert.deepEqual(result.value.warnings, []);
    assert.equal(harness.calls.length, 0);
    assert.equal(harness.state.logs.length, 0);
    assert.equal(harness.reopenCalls.length, 0);
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
    assert.equal(result.value.invoice.consultaAssessoriaEnviada, false);
    assert.equal(result.value.invoice.analiseConsultaAssessoria, 'Não analisado');
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

test('registra e analisa a consulta à Assessoria separadamente para cada nota de serviço', async () => {
    const harness = createHarness();

    const first = await harness.service.save({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        description: 'Manutenção elétrica',
        expenseType: 'servico',
        invoiceNumber: 'NF-SERV-1',
        amount: 800,
        profile: 'controlador'
    });
    const second = await harness.service.save({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        description: 'Manutenção hidráulica',
        expenseType: 'servico',
        invoiceNumber: 'NF-SERV-2',
        amount: 600,
        profile: 'controlador'
    });

    assert.equal(first.value.invoice.consultaAssessoriaEnviada, false);
    assert.equal(first.value.invoice.analiseConsultaAssessoria, 'Não analisado');
    assert.equal(second.value.invoice.consultaAssessoriaEnviada, false);
    assert.equal(second.value.invoice.analiseConsultaAssessoria, 'Não analisado');

    await harness.service.updateServiceAdvisory({
        id: first.value.invoice.id,
        schoolId: 'ESC-1',
        sent: true,
        analysis: 'Correto',
        profile: 'controlador'
    });

    const firstAfterReview = harness.state.registeredInvoices.find(note => (
        note.id === first.value.invoice.id
    ));
    const secondBeforeReview = harness.state.registeredInvoices.find(note => (
        note.id === second.value.invoice.id
    ));
    const verification = harness.state.verifications['ESC-1']['2026-05_BASIC'];

    assert.equal(firstAfterReview.consultaAssessoriaEnviada, true);
    assert.equal(firstAfterReview.analiseConsultaAssessoria, 'Correto');
    assert.equal(secondBeforeReview.consultaAssessoriaEnviada, false);
    assert.equal(secondBeforeReview.analiseConsultaAssessoria, 'Não analisado');
    assert.equal(verification.bonificacao.consAssessoria, 'Não');
    assert.equal(verification.bonificacao.consEnviada, false);
    assert.equal(verification.analise.consAssessoria, 'Não analisado');

    await harness.service.updateServiceAdvisory({
        id: second.value.invoice.id,
        schoolId: 'ESC-1',
        sent: true,
        analysis: 'Correto (Atrasado)',
        profile: 'controlador'
    });

    assert.equal(firstAfterReview.consultaAssessoriaEnviada, true);
    assert.equal(firstAfterReview.analiseConsultaAssessoria, 'Correto');
    assert.equal(secondBeforeReview.consultaAssessoriaEnviada, true);
    assert.equal(secondBeforeReview.analiseConsultaAssessoria, 'Correto (Atrasado)');
    assert.equal(verification.bonificacao.consAssessoria, 'Sim');
    assert.equal(verification.bonificacao.consEnviada, true);
    assert.equal(verification.analise.consAssessoria, 'Correto (Atrasado)');
    assert.match(harness.state.logs[0].details, /NF-SERV-2/);
});

test('repetir estado individual de Assessoria canônico é no-op sem DataService nem log', async () => {
    const harness = createHarness();
    const verification = harness.state.verifications['ESC-1']['2026-05_BASIC'];
    verification.bonificacao.consAssessoria = 'Sim';
    verification.bonificacao.consEnviada = true;
    verification.analise.consAssessoria = 'Correto';
    harness.state.registeredInvoices.push({
        id: 'nota-serv-1',
        escolaId: 'ESC-1',
        compKey: '2026-05_BASIC',
        tipo: 'servico',
        numero: 'NF-SERV-NOOP',
        consultaAssessoriaEnviada: true,
        analiseConsultaAssessoria: 'Correto'
    });

    const result = await harness.service.updateServiceAdvisory({
        id: 'nota-serv-1',
        schoolId: 'ESC-1',
        sent: true,
        analysis: 'Correto',
        profile: 'controlador'
    });

    assert.equal(result.value.unchanged, true);
    assert.equal(harness.calls.length, 0);
    assert.equal(harness.state.logs.length, 0);
    assert.equal(harness.reopenCalls.length, 0);
});

test('Assessoria individual igual não é no-op quando o agregado mensal está divergente', async () => {
    const harness = createHarness();
    const verification = harness.state.verifications['ESC-1']['2026-05_BASIC'];
    verification.bonificacao.consAssessoria = 'Não';
    verification.bonificacao.consEnviada = false;
    verification.analise.consAssessoria = 'Não analisado';
    harness.state.registeredInvoices.push({
        id: 'nota-serv-1',
        escolaId: 'ESC-1',
        compKey: '2026-05_BASIC',
        tipo: 'servico',
        numero: 'NF-SERV-CORRIGE',
        consultaAssessoriaEnviada: true,
        analiseConsultaAssessoria: 'Correto'
    });

    const result = await harness.service.updateServiceAdvisory({
        id: 'nota-serv-1',
        schoolId: 'ESC-1',
        sent: true,
        analysis: 'Correto',
        profile: 'controlador'
    });

    assert.equal(result.value.unchanged, false);
    assert.equal(harness.calls.length, 1);
    assert.equal(verification.bonificacao.consAssessoria, 'Sim');
    assert.equal(verification.bonificacao.consEnviada, true);
    assert.equal(verification.analise.consAssessoria, 'Correto');
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
    assert.equal(harness.reopenCalls.length, 0);
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


test('remoção real por Assistente reabre consolidação sem callback lateral e mantém um único log', async () => {
    const harness = createHarness();
    const verification = harness.state.verifications['ESC-1']['2026-05_BASIC'];
    verification.resultadoBonif = 'apta';
    harness.state.registeredInvoices.push({
        id: 'nota-remove-assistente',
        escolaId: 'ESC-1',
        compKey: '2026-05_BASIC',
        competencia: '2026-05',
        programaId: 'BASIC',
        desc: 'Material',
        descricao: 'Material',
        tipo: 'consumo',
        numero: 'NF-REMOVE-ASSIST',
        valor: 50,
        bemId: null,
        dataRegistro: '2026-07-14T12:00:00.000Z'
    });

    const result = await harness.service.remove({
        id: 'nota-remove-assistente',
        schoolId: 'ESC-1',
        profile: 'assistente'
    });

    assert.equal(result.value.verification.resultadoBonif, '');
    assert.equal(verification.resultadoBonif, '');
    assert.equal(harness.state.logs.length, 1);
    assert.match(harness.state.logs[0].details, /reaberta/i);
    assert.equal(harness.reopenCalls.length, 0);
});


test('nova Nota Fiscal nasce Não analisado e o resumo técnico passa a ser derivado', async () => {
    const harness = createHarness();
    const verification = harness.state.verifications['ESC-1']['2026-05_BASIC'];
    verification.analise.notaFiscal = 'Correto';

    const result = await harness.service.save({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        description: 'Material pedagógico',
        expenseType: 'consumo',
        invoiceNumber: 'NF-IND-001',
        amount: 120,
        profile: 'controlador'
    });

    assert.equal(result.value.invoice.analiseDocumentoFiscal, 'Não analisado');
    assert.equal(verification.analise.notaFiscal, 'Não analisado');
});

test('análise individual correta não contamina outra Nota Fiscal ainda não analisada', async () => {
    const harness = createHarness();
    const verification = harness.state.verifications['ESC-1']['2026-05_BASIC'];
    verification.analise.notaFiscal = 'Não analisado';
    harness.state.registeredInvoices.push(
        {
            id: 'nota-ind-a',
            escolaId: 'ESC-1',
            compKey: '2026-05_BASIC',
            competencia: '2026-05',
            programaId: 'BASIC',
            desc: 'Material A',
            descricao: 'Material A',
            tipo: 'consumo',
            numero: 'NF-A',
            valor: 100,
            analiseDocumentoFiscal: 'Não analisado'
        },
        {
            id: 'nota-ind-b',
            escolaId: 'ESC-1',
            compKey: '2026-05_BASIC',
            competencia: '2026-05',
            programaId: 'BASIC',
            desc: 'Material B',
            descricao: 'Material B',
            tipo: 'consumo',
            numero: 'NF-B',
            valor: 200,
            analiseDocumentoFiscal: 'Não analisado'
        }
    );

    await harness.service.updateDocumentAnalysis({
        id: 'nota-ind-a',
        schoolId: 'ESC-1',
        analysis: 'Correto',
        profile: 'controlador'
    });

    assert.equal(harness.state.registeredInvoices[0].analiseDocumentoFiscal, 'Correto');
    assert.equal(harness.state.registeredInvoices[1].analiseDocumentoFiscal, 'Não analisado');
    assert.equal(verification.analise.notaFiscal, 'Não analisado');
});

test('Incorreto não pode ser persistido diretamente sem Pendência individual', async () => {
    const harness = createHarness();
    harness.state.registeredInvoices.push({
        id: 'nota-ind-a',
        escolaId: 'ESC-1',
        compKey: '2026-05_BASIC',
        competencia: '2026-05',
        programaId: 'BASIC',
        desc: 'Material A',
        descricao: 'Material A',
        tipo: 'consumo',
        numero: 'NF-A',
        valor: 100,
        analiseDocumentoFiscal: 'Não analisado'
    });

    await assert.rejects(
        () => harness.service.updateDocumentAnalysis({
            id: 'nota-ind-a',
            schoolId: 'ESC-1',
            analysis: 'Incorreto',
            profile: 'controlador'
        }),
        error => error?.code === 'PENDENCY_REQUIRED'
    );
    assert.equal(harness.calls.length, 0);
    assert.equal(harness.state.registeredInvoices[0].analiseDocumentoFiscal, 'Não analisado');
});

test('rota comum não cria despesa a identificar sem Pendência atômica', async () => {
    const harness = createHarness();

    await assert.rejects(
        () => harness.service.save({
            schoolId: 'ESC-1',
            compKey: '2026-05_BASIC',
            description: 'Débito observado no extrato',
            expenseType: 'a_identificar',
            invoiceNumber: '',
            amount: 850,
            profile: 'controlador'
        }),
        error => error?.code === 'UNIDENTIFIED_EXPENSE_REQUIRES_PENDENCY'
    );

    assert.equal(harness.calls.length, 0);
    assert.equal(harness.state.registeredInvoices.length, 0);
    assert.equal(harness.state.pendencies.length, 0);
});

test('comando atômico cria despesa a identificar Incorreta já vinculada à Pendência', async () => {
    const harness = createHarness();
    const verification = harness.state.verifications['ESC-1']['2026-05_BASIC'];
    verification.analise.notaFiscal = 'Não analisado';

    const created = await harness.service.saveUnidentifiedExpenseWithPendency({
        schoolId: 'ESC-1',
        compKey: '2026-05_BASIC',
        description: 'Débito observado no extrato',
        expenseType: 'a_identificar',
        invoiceNumber: '',
        amount: 850,
        profile: 'controlador',
        pendencyObservation: 'Documento não apresentado.'
    });

    assert.equal(created.value.invoice.analiseDocumentoFiscal, 'Incorreto');
    assert.equal(created.value.pendency.status, 'Aberta');
    assert.equal(
        created.value.pendency.registeredInvoiceId,
        created.value.invoice.id
    );
    assert.equal(verification.analise.notaFiscal, 'Incorreto');
    assert.equal(harness.calls.length, 1);
});

test('Pendência fiscal ativa bloqueia editor e alteração técnica comuns', async () => {
    const harness = createHarness();
    harness.state.registeredInvoices.push({
        id: 'nota-locked',
        escolaId: 'ESC-1',
        compKey: '2026-05_BASIC',
        competencia: '2026-05',
        programaId: 'BASIC',
        desc: 'Material',
        descricao: 'Material',
        tipo: 'consumo',
        numero: 'NF-LOCK',
        valor: 100,
        analiseDocumentoFiscal: 'Incorreto'
    });
    harness.state.pendencies.push({
        id: 'pend-locked',
        escolaId: 'ESC-1',
        competencia: '2026-05',
        competenciaOrigem: '2026-05',
        programaId: 'BASIC',
        documentoKey: 'notaFiscal',
        registeredInvoiceId: 'nota-locked',
        status: 'Aberta'
    });

    await assert.rejects(
        () => harness.service.save({
            id: 'nota-locked',
            schoolId: 'ESC-1',
            compKey: '2026-05_BASIC',
            description: 'Material alterado',
            expenseType: 'consumo',
            invoiceNumber: 'NF-LOCK',
            amount: 100,
            profile: 'controlador'
        }),
        error => error?.code === 'ACTIVE_INVOICE_PENDENCY'
    );
    await assert.rejects(
        () => harness.service.updateDocumentAnalysis({
            id: 'nota-locked',
            schoolId: 'ESC-1',
            analysis: 'Correto',
            profile: 'controlador'
        }),
        error => error?.code === 'ACTIVE_INVOICE_PENDENCY'
    );

    assert.equal(harness.calls.length, 0);
    assert.equal(harness.state.registeredInvoices[0].analiseDocumentoFiscal, 'Incorreto');
});

test('atualização individual semanticamente idêntica é no-op', async () => {
    const harness = createHarness();
    const verification = harness.state.verifications['ESC-1']['2026-05_BASIC'];
    verification.analise.notaFiscal = 'Correto';
    harness.state.registeredInvoices.push({
        id: 'nota-noop-analysis',
        escolaId: 'ESC-1',
        compKey: '2026-05_BASIC',
        competencia: '2026-05',
        programaId: 'BASIC',
        desc: 'Material',
        descricao: 'Material',
        tipo: 'consumo',
        numero: 'NF-NOOP',
        valor: 100,
        analiseDocumentoFiscal: 'Correto'
    });

    const result = await harness.service.updateDocumentAnalysis({
        id: 'nota-noop-analysis',
        schoolId: 'ESC-1',
        analysis: 'Correto',
        profile: 'controlador'
    });

    assert.equal(result.value.unchanged, true);
    assert.equal(harness.calls.length, 0);
    assert.equal(harness.state.logs.length, 0);
});


test('legado agregado Incorreto com múltiplas NFs não fabrica estado individual anterior', async () => {
    const harness = createHarness();
    const verification = harness.state.verifications['ESC-1']['2026-05_BASIC'];
    verification.analise.notaFiscal = 'Incorreto';
    harness.state.registeredInvoices.push(
        {
            id: 'nota-legado-a',
            escolaId: 'ESC-1',
            compKey: '2026-05_BASIC',
            competencia: '2026-05',
            programaId: 'BASIC',
            desc: 'Material A',
            descricao: 'Material A',
            tipo: 'consumo',
            numero: 'NF-LEG-A',
            valor: 100
        },
        {
            id: 'nota-legado-b',
            escolaId: 'ESC-1',
            compKey: '2026-05_BASIC',
            competencia: '2026-05',
            programaId: 'BASIC',
            desc: 'Material B',
            descricao: 'Material B',
            tipo: 'consumo',
            numero: 'NF-LEG-B',
            valor: 200
        }
    );

    const result = await harness.service.updateDocumentAnalysis({
        id: 'nota-legado-a',
        schoolId: 'ESC-1',
        analysis: 'Correto',
        profile: 'controlador'
    });

    assert.equal(result.value.previous, 'Não analisado');
    assert.equal(harness.state.registeredInvoices[0].analiseDocumentoFiscal, 'Correto');
    assert.equal(
        Object.hasOwn(harness.state.registeredInvoices[1], 'analiseDocumentoFiscal'),
        false
    );
    assert.equal(verification.analise.notaFiscal, 'Não analisado');
});
