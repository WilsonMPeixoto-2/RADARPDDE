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

test('mantém A identificar disponível independentemente da bonificação e consolidação', () => {
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
        { bonificacao: { notaFiscal: 'Não se aplica' }, resultadoBonif: 'apta' },
        rows
    );
    assert.equal(removed, 0);
    assert.equal(actionContainerRemoved, 0);
    assert.equal(enhanced, 1);

    reconciler.syncUnidentifiedExpenseAction(
        root,
        'ESC-1',
        '2026-08_BASIC',
        { bonificacao: { notaFiscal: 'Sim' }, resultadoBonif: '' },
        rows
    );
    assert.equal(enhanced, 2);
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


test('toggleBonif de Nota Fiscal preserva posição dentro do reconciliador sem alterar resultado funcional', async () => {
    const area = {
        scrollTop: 720,
        scrollLeft: 9,
        scrollTo({ top, left }) {
            this.scrollTop = top;
            this.scrollLeft = left;
        }
    };
    const calls = [];
    const root = {
        document: {
            querySelector(selector) {
                return selector === 'main.content-area' ? area : null;
            },
            querySelectorAll: () => []
        },
        RadarApplicationServices: {
            verifications: {
                getState: () => ({ verifications: {}, registeredInvoices: [], pendencies: [] })
            }
        },
        RadarServiceAdvisoryPendency: { findActiveForInvoice: () => null },
        RadarProntuarioScrollPreservation: {
            capture() {
                return { top: area.scrollTop, left: area.scrollLeft };
            },
            restore(_root, snapshot) {
                area.scrollTo(snapshot);
                return true;
            }
        },
        renderProntuario() {
            area.scrollTop = 0;
            return true;
        },
        async toggleBonif(...args) {
            calls.push(args);
            root.renderProntuario(args[0]);
            return true;
        },
        async changeAnaliseTecnica() { return true; },
        async toggleInvoiceAdvisorySent() { return true; },
        async changeInvoiceAdvisoryAnalysis() { return true; },
        async toggleConsEnviada() { return true; },
        RadarCompetencia: {
            splitCompetenciaContext: value => {
                const [competenciaKey, contextId] = String(value).split('_');
                return { competenciaKey, contextId };
            }
        },
        getRadarAccessProfile: () => 'controlador',
        RadarUnidentifiedExpenseUx: { enhance() {} },
        RadarProntuarioOperationalUx: { enhance() {} },
        RadarAccessPolicy: { CAPABILITIES: {} },
        hasRadarCapability: () => true,
        requestAnimationFrame(callback) {
            callback();
            return 1;
        }
    };

    assert.equal(reconciler.install(root), true);
    const result = await root.toggleBonif('ESC-1', '2026-08_BASIC', 'notaFiscal', 'Não se aplica');

    assert.equal(result, true);
    assert.deepEqual(calls, [['ESC-1', '2026-08_BASIC', 'notaFiscal', 'Não se aplica']]);
    assert.equal(area.scrollTop, 720);
    assert.equal(area.scrollLeft, 9);
});

test('syncServicePendencyControls sincroniza botão Editar análise na coluna Ação da Assessoria quando T2 está ativo', () => {
    const replacedNodes = [];
    const actionCell = {
        querySelector: () => null,
        replaceChildren(...nodes) {
            replacedNodes.splice(0, replacedNodes.length, ...nodes);
        }
    };
    const card = {
        dataset: { serviceAdvisoryInvoice: 'NF-A' },
        querySelector(selector) {
            if (selector === '.invoice-document-action') return actionCell;
            return null;
        }
    };
    const selectA = {
        disabled: false,
        dataset: {},
        getAttribute: () => "changeInvoiceAdvisoryAnalysis('NF-A', 'ESC-1', this.value, this)"
    };
    const row = {
        dataset: { programId: 'BASIC', documentKey: 'consAssessoria' },
        querySelectorAll(selector) {
            if (selector.includes('changeInvoiceAdvisoryAnalysis')) return [selectA];
            if (selector === '[data-service-advisory-invoice]') return [card];
            return [];
        },
        querySelector: () => null
    };
    const state = {
        pendencies: [],
        registeredInvoices: [{
            id: 'NF-A',
            escolaId: 'ESC-1',
            compKey: '2026-08_BASIC',
            tipo: 'servico',
            analiseConsultaAssessoria: 'Correto'
        }]
    };
    const openedCalls = [];
    const root = {
        document: {
            createElement(tag) {
                const attrs = new Map();
                const listeners = new Map();
                return {
                    tagName: tag.toUpperCase(),
                    type: '',
                    className: '',
                    innerHTML: '',
                    textContent: '',
                    setAttribute(k, v) { attrs.set(k, v); },
                    getAttribute(k) { return attrs.get(k) || null; },
                    addEventListener(evt, fn) { listeners.set(evt, fn); },
                    click() { listeners.get('click')?.(); }
                };
            }
        },
        getRadarAccessProfile: () => 'controlador',
        RadarCompetencia: {
            splitCompetenciaContext: () => ({ competenciaKey: '2026-08', contextId: 'BASIC' })
        },
        RadarAccessPolicy: { CAPABILITIES: {} },
        hasRadarCapability: () => true,
        RadarServiceAdvisoryPendency: { findActiveForInvoice: () => null },
        RadarOperationalCorrectionDialog: { canUse: () => true },
        openInvoiceOperationalCorrection(...args) { openedCalls.push(args); }
    };

    reconciler.syncServicePendencyControls(
        root,
        'ESC-1',
        '2026-08_BASIC',
        { resultadoBonif: '' },
        [row],
        state
    );

    assert.equal(replacedNodes.length, 1);
    assert.equal(replacedNodes[0].className, 'invoice-analysis-edit-button');
    assert.equal(replacedNodes[0].getAttribute('aria-describedby'), 'advisory-invoice-title-NF-A');
    replacedNodes[0].click();
    assert.deepEqual(openedCalls, [['NF-A', 'ESC-1', 'consAssessoria', replacedNodes[0]]]);
});

