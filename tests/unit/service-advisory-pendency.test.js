'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const pendencyDomain = require('../../src/domain/pendencias.js');
const accessPolicy = require('../../src/domain/access-policy.js');

function freshIntegration() {
    const resolved = require.resolve('../../src/integration/service-advisory-pendency.js');
    delete require.cache[resolved];
    return require(resolved);
}

function createRoot() {
    const state = {
        schools: [{ id: 'ESC-1' }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }],
        verifications: {
            'ESC-1': {
                '2026-08_BASIC': {
                    bonificacao: { notaFiscal: 'Sim', consAssessoria: 'Não', consEnviada: false },
                    analise: { notaFiscal: 'Correto', consAssessoria: 'Não analisado' },
                    resultadoBonif: '',
                    rowVersion: 4
                }
            }
        },
        registeredInvoices: [{
            id: 'NF-A',
            escolaId: 'ESC-1',
            compKey: '2026-08_BASIC',
            tipo: 'servico',
            numero: '100',
            valor: 300,
            consultaAssessoriaEnviada: false,
            analiseConsultaAssessoria: 'Não analisado',
            rowVersion: 2
        }, {
            id: 'NF-B',
            escolaId: 'ESC-1',
            compKey: '2026-08_BASIC',
            tipo: 'servico',
            numero: '200',
            valor: 400,
            consultaAssessoriaEnviada: false,
            analiseConsultaAssessoria: 'Não analisado',
            rowVersion: 2
        }],
        pendencies: [],
        logs: []
    };
    let seq = 0;
    const reopenCalls = [];
    const drawerCalls = [];
    const renderCalls = [];
    const invoiceService = {
        getState: () => state,
        assertEditable: () => 'controlador',
        assertVerificationEditable: () => true,
        syncServiceRequirement(current, schoolId, compKey) {
            const notes = current.registeredInvoices.filter(note => (
                note.escolaId === schoolId && note.compKey === compKey && note.tipo === 'servico'
            ));
            const aggregate = require('../../src/domain/service-advisory.js').deriveServiceAdvisory(notes);
            const verification = current.verifications[schoolId][compKey];
            verification.bonificacao.consAssessoria = aggregate.delivery;
            verification.bonificacao.consEnviada = aggregate.sent;
            verification.analise.consAssessoria = aggregate.analysis;
            return aggregate;
        },
        reopenConsolidation: (...args) => {
            reopenCalls.push(args);
        },
        async updateServiceAdvisory(input) {
            const note = state.registeredInvoices.find(item => item.id === input.id);
            if (input.analysis) note.analiseConsultaAssessoria = input.analysis;
            return { value: { invoice: note } };
        }
    };
    const dataService = {
        async execute(command) {
            const value = await command.mutate();
            return { ok: true, value };
        }
    };
    const pendencyService = {
        dataService,
        domain: pendencyDomain,
        getState: () => state,
        assertCapability: () => true,
        createId: prefix => `${prefix}-${++seq}`,
        now: () => '2026-08-23T10:00:00.000Z',
        audit: () => ({
            id: `audit-${++seq}`,
            dataHora: '2026-08-23T10:00:00.000Z',
            usuario: 'Controlador Teste',
            perfil: 'Controlador'
        }),
        appendSchoolLog: (_schoolId, action, details) => {
            const log = { id: `log-${++seq}`, action, details };
            state.logs.push(log);
            return log;
        },
        async open() { return { ok: true }; },
        async reanalyze() { return { ok: true }; }
    };
    const observation = { value: '' };
    const root = {
        document: {
            readyState: 'complete',
            getElementById: id => id === 'pend-obs' ? observation : null,
            addEventListener() {}
        },
        setInterval: () => 1,
        clearInterval() {},
        setTimeout: () => 1,
        RadarRepositoryContract: require('../../src/data/repository-contract.js'),
        RadarPendencias: pendencyDomain,
        RadarAccessPolicy: accessPolicy,
        RadarCompetencia: {
            splitCompetenciaContext: value => ({
                competenciaKey: value.slice(0, 7),
                contextId: value.slice(8)
            })
        },
        RadarInvoiceService: require('../../src/application/invoice-service.js'),
        RadarApplicationServices: {
            invoices: invoiceService,
            pendencies: pendencyService
        },
        getRadarAccessProfile: () => 'controlador',
        openNovaPendenciaModalWithDefaults: () => true,
        changeInvoiceAdvisoryAnalysis: async () => true,
        closeModal: () => true,
        rebuildOperationalIndexes() {},
        renderProntuario: schoolId => renderCalls.push(schoolId),
        openPendencyDrawer: pendencyId => drawerCalls.push(pendencyId),
        alert() {}
    };
    return {
        root,
        state,
        observation,
        invoiceService,
        pendencyService,
        reopenCalls,
        drawerCalls,
        renderCalls
    };
}

test('reconhece pendência de Assessoria somente quando existe identidade da NF', () => {
    const integration = freshIntegration();
    assert.equal(integration.isLinkedServiceAdvisoryPendency({
        documentoKey: 'consAssessoria',
        registeredInvoiceId: 'NF-A'
    }), true);
    assert.equal(integration.isLinkedServiceAdvisoryPendency({
        documentoKey: 'consAssessoria'
    }), false);
    assert.equal(integration.isLinkedServiceAdvisoryPendency({
        documentoKey: 'notaFiscal',
        registeredInvoiceId: 'NF-A'
    }), false);
});

test('integração não substitui a regra canônica de atualização da Assessoria', () => {
    const integration = freshIntegration();
    const harness = createRoot();
    const canonicalUpdate = harness.invoiceService.updateServiceAdvisory;

    assert.equal(integration.install(harness.root), true);
    assert.equal(harness.invoiceService.updateServiceAdvisory, canonicalUpdate);
});

test('pendência de uma NF abre o drawer sem bloquear a análise de outra NF', async () => {
    const integration = freshIntegration();
    const harness = createRoot();
    harness.state.pendencies.push(pendencyDomain.createDocumentPendency({
        id: 'PEND-NF-A',
        escolaId: 'ESC-1',
        competencia: '2026-08',
        programaId: 'BASIC',
        documentoKey: 'consAssessoria',
        registeredInvoiceId: 'NF-A',
        item: 'Consulta Assessoria — NF 100',
        erros: ['Dados divergentes'],
        observacao: 'Corrigir a consulta.',
        dataAbertura: '2026-08-23'
    }, {
        eventId: 'EVENT-PEND-NF-A',
        at: '2026-08-23T10:00:00.000Z',
        usuario: 'Controlador Teste',
        perfil: 'Controlador'
    }));

    assert.equal(integration.install(harness.root), true);

    const firstSelect = { value: 'Correto' };
    const blocked = await harness.root.changeInvoiceAdvisoryAnalysis(
        'NF-A', 'ESC-1', 'Correto', firstSelect
    );
    assert.equal(blocked, false);
    assert.equal(firstSelect.value, 'Não analisado');
    assert.deepEqual(harness.drawerCalls, ['PEND-NF-A']);
    assert.equal(harness.state.registeredInvoices[0].analiseConsultaAssessoria, 'Não analisado');

    const allowed = await harness.root.changeInvoiceAdvisoryAnalysis(
        'NF-B', 'ESC-1', 'Correto', { value: 'Correto' }
    );
    assert.equal(allowed, true);
    assert.equal(harness.state.registeredInvoices[1].analiseConsultaAssessoria, 'Correto');
    assert.deepEqual(harness.drawerCalls, ['PEND-NF-A']);
});

test('Incorreto abre contexto da NF sem persistir análise antes da confirmação', async () => {
    const integration = freshIntegration();
    const harness = createRoot();
    assert.equal(integration.install(harness.root), true);
    const select = { value: 'Incorreto' };

    const result = await harness.root.changeInvoiceAdvisoryAnalysis(
        'NF-A', 'ESC-1', 'Incorreto', select
    );

    assert.equal(result, true);
    assert.equal(select.value, 'Não analisado');
    assert.equal(harness.state.registeredInvoices[0].analiseConsultaAssessoria, 'Não analisado');
    assert.equal(integration.getPendingContext().registeredInvoiceId, 'NF-A');
    assert.match(harness.observation.value, /NF 100/);

    harness.root.closeModal('modal-nova-pendencia');
    assert.equal(integration.getPendingContext(), null);
    assert.equal(harness.state.registeredInvoices[0].analiseConsultaAssessoria, 'Não analisado');
});

test('confirmação atômica altera somente a NF alvo e cria pendência vinculada', async () => {
    const integration = freshIntegration();
    const harness = createRoot();
    assert.equal(integration.install(harness.root), true);
    await harness.root.changeInvoiceAdvisoryAnalysis('NF-A', 'ESC-1', 'Incorreto', { value: 'Incorreto' });

    const result = await harness.pendencyService.open({
        schoolId: 'ESC-1',
        competence: '2026-08',
        programId: 'BASIC',
        documentKey: 'consAssessoria',
        item: 'Consulta Assessoria — NF 100',
        errors: ['Dados divergentes'],
        observation: 'Corrigir a consulta.'
    });

    assert.equal(result.value.invoice.analiseConsultaAssessoria, 'Incorreto');
    assert.equal(harness.state.registeredInvoices[1].analiseConsultaAssessoria, 'Não analisado');
    assert.equal(harness.state.pendencies.length, 1);
    assert.equal(harness.state.pendencies[0].registeredInvoiceId, 'NF-A');
    assert.equal(harness.state.verifications['ESC-1']['2026-08_BASIC'].analise.consAssessoria, 'Incorreto');
});


test('abertura atômica consolidada reabre no mesmo efeito e mantém um único log persistível', async () => {
    const integration = freshIntegration();
    const harness = createRoot();
    const verification = harness.state.verifications['ESC-1']['2026-08_BASIC'];
    verification.resultadoBonif = 'apta';
    harness.root.getRadarAccessProfile = () => 'assistente';
    harness.invoiceService.assertEditable = () => 'assistente';

    assert.equal(integration.install(harness.root), true);
    await harness.root.changeInvoiceAdvisoryAnalysis(
        'NF-A',
        'ESC-1',
        'Incorreto',
        { value: 'Incorreto' }
    );

    const result = await harness.pendencyService.open({
        schoolId: 'ESC-1',
        competence: '2026-08',
        programId: 'BASIC',
        documentKey: 'consAssessoria',
        item: 'Consulta Assessoria — NF 100',
        errors: ['Dados divergentes'],
        observation: 'Corrigir a consulta.'
    });

    assert.equal(result.value.verification.resultadoBonif, '');
    assert.equal(verification.resultadoBonif, '');
    assert.equal(harness.reopenCalls.length, 0);
    assert.equal(harness.state.logs.length, 1);
    assert.equal(harness.state.logs[0].action, 'Análise incorreta e pendência aberta');
    assert.match(harness.state.logs[0].details, /reaberta/i);
});


test('reinstala a autoridade individual quando os serviços autenticados são recriados', async () => {
    const integration = freshIntegration();
    const first = createRoot();
    const second = createRoot();

    assert.equal(integration.install(first.root), true);
    const wrappedUi = first.root.changeInvoiceAdvisoryAnalysis;

    first.root.RadarApplicationServices = second.root.RadarApplicationServices;
    assert.equal(integration.install(first.root), true);

    assert.equal(
        second.pendencyService.__radarServiceAdvisoryPendency,
        true
    );
    assert.equal(first.root.changeInvoiceAdvisoryAnalysis, wrappedUi);

    const result = await first.root.changeInvoiceAdvisoryAnalysis(
        'NF-B',
        'ESC-1',
        'Correto',
        { value: 'Correto' }
    );

    assert.equal(result, true);
    assert.equal(second.state.registeredInvoices[1].analiseConsultaAssessoria, 'Correto');
    assert.equal(first.state.registeredInvoices[1].analiseConsultaAssessoria, 'Não analisado');
});
