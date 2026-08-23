'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const reconciler = require('../../src/integration/prontuario-conditional-reconciler.js');

function createButton() {
    const attributes = new Map([['onclick', 'legacy()']]);
    return {
        disabled: false,
        textContent: '',
        onclick: null,
        dataset: {},
        removeAttribute(name) { attributes.delete(name); },
        getAttribute(name) { return attributes.get(name) || null; }
    };
}

function createProgramRows(button, noteRowOverride = {}) {
    const contextCell = { querySelector: selector => selector === 'button' ? button : null };
    const first = {
        dataset: { programId: 'BASIC', documentKey: 'extCC' },
        querySelector: selector => selector === 'td[rowspan]' ? contextCell : null,
        querySelectorAll: () => []
    };
    const note = {
        dataset: { programId: 'BASIC', documentKey: 'notaFiscal' },
        querySelector: () => null,
        querySelectorAll: () => [],
        ...noteRowOverride
    };
    return [first, note];
}

test('reabre e reconsolida a ação do programa a partir do estado autoritativo', () => {
    const button = createButton();
    const rows = createProgramRows(button);
    let consolidatedCalls = 0;
    const root = {
        getRadarAccessProfile: () => 'assistente',
        calcularEFecharBonificacao: () => { consolidatedCalls += 1; }
    };

    assert.equal(reconciler.syncConsolidationAction(
        root,
        'ESC-1',
        '2026-08_BASIC',
        { resultadoBonif: 'apta' },
        rows
    ), true);
    assert.equal(button.disabled, true);
    assert.equal(button.textContent, 'Consolidada');
    assert.equal(button.dataset.radarConsolidationState, 'consolidated');

    assert.equal(reconciler.syncConsolidationAction(
        root,
        'ESC-1',
        '2026-08_BASIC',
        { resultadoBonif: '' },
        rows
    ), true);
    assert.equal(button.disabled, false);
    assert.equal(button.textContent, 'Consolidar');
    assert.equal(button.dataset.radarConsolidationState, 'open');
    button.onclick();
    assert.equal(consolidatedCalls, 1);
});

test('remove A identificar em N/A e o recompõe quando a NF volta a ser aplicável', () => {
    let removed = 0;
    let actionContainerRemoved = 0;
    let enhanced = 0;
    const actionContainer = {
        childElementCount: 0,
        remove() { actionContainerRemoved += 1; }
    };
    const actionButton = { remove() { removed += 1; } };
    const button = createButton();
    const rows = createProgramRows(button, {
        querySelector(selector) {
            if (selector === '[data-unidentified-expense-actions]') return actionContainer;
            if (selector === '[data-register-unidentified-expense]') return actionButton;
            return null;
        }
    });
    const root = {
        getRadarAccessProfile: () => 'controlador',
        RadarUnidentifiedExpenseUx: { enhance: () => { enhanced += 1; } }
    };

    reconciler.syncUnidentifiedExpenseAction(
        root,
        'ESC-1',
        '2026-08_BASIC',
        { bonificacao: { notaFiscal: 'Não se aplica' }, resultadoBonif: '' },
        rows
    );
    assert.equal(removed, 1);
    assert.equal(actionContainerRemoved, 1);
    assert.equal(enhanced, 0);

    reconciler.syncUnidentifiedExpenseAction(
        root,
        'ESC-1',
        '2026-08_BASIC',
        { bonificacao: { notaFiscal: 'Sim' }, resultadoBonif: '' },
        rows
    );
    assert.equal(enhanced, 1);
});

test('pendência de Assessoria bloqueia apenas a NF vinculada e preserva a irmã', () => {
    const previousCss = global.CSS;
    global.CSS = { escape: value => String(value) };
    try {
        const selectA = {
            disabled: false,
            dataset: {},
            getAttribute: () => "changeInvoiceAdvisoryAnalysis('NF-A', 'ESC-1', this.value, this)"
        };
        const selectB = {
            disabled: false,
            dataset: {},
            getAttribute: () => "changeInvoiceAdvisoryAnalysis('NF-B', 'ESC-1', this.value, this)"
        };
        const row = {
            dataset: { programId: 'BASIC', documentKey: 'consAssessoria' },
            querySelectorAll: selector => selector.includes('changeInvoiceAdvisoryAnalysis')
                ? [selectA, selectB]
                : [],
            querySelector: () => null
        };
        const rows = [{
            dataset: { programId: 'BASIC', documentKey: 'extCC' },
            querySelector: () => null,
            querySelectorAll: () => []
        }, row];
        const state = {
            pendencies: [{
                id: 'P-A',
                escolaId: 'ESC-1',
                competenciaOrigem: '2026-08',
                programaId: 'BASIC',
                documentoKey: 'consAssessoria',
                registeredInvoiceId: 'NF-A',
                status: 'Aberta'
            }],
            registeredInvoices: [{
                id: 'NF-A', escolaId: 'ESC-1', compKey: '2026-08_BASIC', tipo: 'servico'
            }, {
                id: 'NF-B', escolaId: 'ESC-1', compKey: '2026-08_BASIC', tipo: 'servico'
            }]
        };
        const root = {
            getRadarAccessProfile: () => 'controlador',
            RadarCompetencia: {
                splitCompetenciaContext: () => ({ competenciaKey: '2026-08', contextId: 'BASIC' })
            },
            RadarAccessPolicy: { CAPABILITIES: {} },
            hasRadarCapability: () => true,
            RadarServiceAdvisoryPendency: {
                findActiveForInvoice: (_root, currentState, invoice) => currentState.pendencies.find(
                    pendency => pendency.registeredInvoiceId === invoice.id
                        && ['Aberta', 'Aguardando reanálise'].includes(pendency.status)
                ) || null
            }
        };

        reconciler.syncServicePendencyControls(
            root,
            'ESC-1',
            '2026-08_BASIC',
            { resultadoBonif: '' },
            rows,
            state
        );

        assert.equal(selectA.disabled, true);
        assert.equal(selectA.dataset.radarServicePendencyDisabled, 'true');
        assert.equal(selectB.disabled, false);
        assert.equal(selectB.dataset.radarServicePendencyDisabled, undefined);
    } finally {
        global.CSS = previousCss;
    }
});

test('reconcile reaplica restrição tardia e ações condicionais sem render integral', () => {
    const button = createButton();
    const rows = createProgramRows(button);
    let operationalEnhance = 0;
    let unidentifiedEnhance = 0;
    let fullRenderCalls = 0;
    const state = {
        verifications: {
            'ESC-1': {
                '2026-08_BASIC': {
                    bonificacao: { notaFiscal: 'Sim' },
                    analise: {},
                    resultadoBonif: ''
                }
            }
        },
        registeredInvoices: [],
        pendencies: []
    };
    const root = {
        document: {
            querySelectorAll: () => rows
        },
        RadarApplicationServices: {
            verifications: { getState: () => state }
        },
        RadarCompetencia: {
            splitCompetenciaContext: () => ({ competenciaKey: '2026-08', contextId: 'BASIC' })
        },
        getRadarAccessProfile: () => 'controlador',
        RadarUnidentifiedExpenseUx: { enhance: () => { unidentifiedEnhance += 1; } },
        RadarProntuarioOperationalUx: { enhance: () => { operationalEnhance += 1; } },
        RadarAccessPolicy: { CAPABILITIES: {} },
        hasRadarCapability: () => true,
        RadarServiceAdvisoryPendency: { findActiveForInvoice: () => null },
        renderProntuario: () => { fullRenderCalls += 1; }
    };

    assert.equal(reconciler.reconcile(root, 'ESC-1', '2026-08_BASIC'), true);
    assert.equal(operationalEnhance, 1);
    assert.equal(unidentifiedEnhance, 1);
    assert.equal(fullRenderCalls, 0);
});
