'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const integration = require('../../src/integration/service-advisory-pendency.js');
const pendencyDomain = require('../../src/domain/pendencias.js');
const accessPolicy = require('../../src/domain/access-policy.js');

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
    const invoiceService = {
        getState: () => state,
        assertEditable: () => 'controlador',
        assertVerificationEditable: () => true,
        syncServiceRequirement(current, schoolId, compKey) {
            const notes = current.registeredInvoices.filter(note => (
                note.escolaId === schoolId && note.compKey === compKey && note.tipo === 'servico'
            ));
            const aggregate = require('../../src/application/invoice-service.js').aggregateServiceAdvisories(notes);
            const verification = current.verifications[schoolId][compKey];
            verification.bonificacao.consAssessoria = aggregate.delivery;
            verification.bonificacao.consEnviada = aggregate.sent;
            verification.analise.consAssessoria = aggregate.analysis;
            return aggregate;
        },
        reopenConsolidation: () => {},
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
        audit: () => ({ id: `audit-${++seq}`, dataHora: '2026-08-23T10:00:00.000Z' }),
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
        alert() {}
    };
    return { root, state, observation, invoiceService, pendencyService };
}

test('reconhece pendência de Assessoria somente quando existe identidade da NF', () => {
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

test('Incorreto abre contexto da NF sem persistir análise antes da confirmação', async () => {
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
    const harness = createRoot();
    integration.clearPendingContext();
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
