(function installRadarProntuarioConditionalReconciler(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) {
        root.RadarProntuarioConditionalReconciler = Object.freeze(api);
        if (root.document) {
            const attemptInstall = () => api.install(root);
            if (!attemptInstall() && root.document.readyState === 'loading') {
                root.document.addEventListener('DOMContentLoaded', attemptInstall, { once: true });
            }
            const interval = root.setInterval?.(() => {
                if (attemptInstall()) root.clearInterval?.(interval);
            }, 25);
            root.setTimeout?.(() => root.clearInterval?.(interval), 10000);
        }
    }
}(typeof window !== 'undefined' ? window : globalThis, function createProntuarioConditionalReconcilerApi() {
    'use strict';

    const INLINE_HANDLERS = Object.freeze([
        'toggleBonif',
        'changeAnaliseTecnica',
        'toggleInvoiceAdvisorySent',
        'changeInvoiceAdvisoryAnalysis',
        'toggleConsEnviada'
    ]);
    let installed = false;

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function stateOf(root) {
        const service = root?.RadarApplicationServices?.verifications
            || root?.RadarApplicationServices?.invoices;
        return typeof service?.getState === 'function' ? service.getState() : null;
    }

    function splitContext(root, compKey) {
        const parsed = root.RadarCompetencia?.splitCompetenciaContext?.(compKey) || {};
        const competence = text(parsed.competenciaKey || String(compKey).slice(0, 7));
        const programId = text(parsed.contextId || String(compKey).slice(8));
        return { competence, programId };
    }

    function compKeyForHandler(root, name, args) {
        if (name === 'toggleBonif' || name === 'changeAnaliseTecnica' || name === 'toggleConsEnviada') {
            return text(args[1]);
        }
        const state = stateOf(root);
        const invoiceId = text(args[0]);
        return text((state?.registeredInvoices || []).find(record => (
            String(record.id) === invoiceId
        ))?.compKey);
    }

    function schoolIdForHandler(name, args) {
        return text(
            name === 'toggleInvoiceAdvisorySent' || name === 'changeInvoiceAdvisoryAnalysis'
                ? args[1]
                : args[0]
        );
    }

    function programRows(root, programId) {
        return Array.from(root.document?.querySelectorAll?.(
            '#prontuario-verif-rows tr[data-program-id][data-document-key]'
        ) || []).filter(row => text(row.dataset.programId) === programId);
    }

    function syncConsolidationAction(root, schoolId, compKey, verification, rows) {
        const contextCell = rows[0]?.querySelector?.('td[rowspan]');
        const button = contextCell?.querySelector?.('button');
        if (!button) return false;
        const profile = text(root.getRadarAccessProfile?.()).toLocaleLowerCase('pt-BR');
        if (profile === 'inventario' || profile === 'sme') return false;

        const consolidated = Boolean(text(verification?.resultadoBonif || verification?.bonus_result));
        if (consolidated) {
            button.disabled = true;
            button.textContent = 'Consolidada';
            button.removeAttribute('onclick');
            button.onclick = null;
            button.dataset.radarConsolidationState = 'consolidated';
            return true;
        }

        button.disabled = false;
        button.textContent = 'Consolidar';
        button.removeAttribute('onclick');
        button.onclick = () => root.calcularEFecharBonificacao?.(schoolId, compKey);
        button.dataset.radarConsolidationState = 'open';
        return true;
    }

    function syncUnidentifiedExpenseAction(root, schoolId, compKey, verification, rows) {
        const noteRow = rows.find(row => row.dataset.documentKey === 'notaFiscal');
        if (!noteRow) return false;
        const profile = text(root.getRadarAccessProfile?.()).toLocaleLowerCase('pt-BR');
        const eligible = ['controlador', 'assistente'].includes(profile)
            && verification?.bonificacao?.notaFiscal !== 'Não se aplica'
            && (!verification?.resultadoBonif || profile === 'assistente');
        const actions = noteRow.querySelector?.('[data-unidentified-expense-actions]');
        const button = noteRow.querySelector?.('[data-register-unidentified-expense]');

        if (!eligible) {
            button?.remove();
            if (actions && actions.childElementCount === 0) actions.remove();
            return true;
        }

        root.RadarUnidentifiedExpenseUx?.enhance?.();
        return true;
    }

    function invoiceIdFromControl(control) {
        const source = text(control?.getAttribute?.('onchange'));
        const match = source.match(/changeInvoiceAdvisoryAnalysis\('([^']+)'/);
        return match ? match[1] : '';
    }

    function appendPendencyButton(root, container, label, action, pendency) {
        const button = root.document.createElement('button');
        button.type = 'button';
        button.className = action === 'reanalyze' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm';
        button.style.fontSize = '0.68rem';
        button.style.padding = '2px 6px';
        button.dataset.pendencyRef = root.encodePendencyIdReference?.(pendency.id) || String(pendency.id);
        button.dataset.radarServicePendencyAction = action;
        button.textContent = label;
        if (action === 'reanalyze') {
            button.addEventListener('click', () => root.abrirModalReanalisarPendencia?.(button));
        } else {
            button.addEventListener('click', () => root.abrirModalRegistrarNovoEnvio?.(button));
        }
        container.appendChild(button);
    }

    function syncServicePendencyControls(root, schoolId, compKey, verification, rows, state) {
        const row = rows.find(candidate => candidate.dataset.documentKey === 'consAssessoria');
        if (!row) return false;
        const { competence, programId } = splitContext(root, compKey);
        const profile = text(root.getRadarAccessProfile?.()).toLocaleLowerCase('pt-BR');
        const readOnlyProfile = profile === 'inventario' || profile === 'sme';
        const consolidatedLock = Boolean(verification?.resultadoBonif) && profile !== 'assistente';
        const capabilities = root.RadarAccessPolicy?.CAPABILITIES || {};
        const canRegister = root.hasRadarCapability?.(capabilities.REGISTER_CORRECTIVE_SUBMISSION) !== false;
        const canReanalyze = root.hasRadarCapability?.(capabilities.REANALYZE_PENDENCY) !== false;

        const legacyActive = (state.pendencies || []).find(pendency => (
            ['Aberta', 'Aguardando reanálise'].includes(pendency.status)
            && String(pendency.escolaId) === String(schoolId)
            && String(pendency.competenciaOrigem || pendency.competencia) === competence
            && String(pendency.programaId || '') === programId
            && pendency.documentoKey === 'consAssessoria'
            && !text(pendency.registeredInvoiceId || pendency.registered_invoice_id)
        )) || null;

        const invoices = (state.registeredInvoices || []).filter(invoice => (
            invoice.escolaId === schoolId
            && invoice.compKey === compKey
            && invoice.tipo === 'servico'
        ));

        Array.from(row.querySelectorAll('select[onchange*="changeInvoiceAdvisoryAnalysis"]')).forEach(select => {
            const invoiceId = invoiceIdFromControl(select);
            const invoice = invoices.find(record => String(record.id) === String(invoiceId));
            if (!invoice) return;
            const active = legacyActive || root.RadarServiceAdvisoryPendency?.findActiveForInvoice?.(
                root,
                state,
                invoice
            ) || null;
            const futureLock = select.dataset.futureCompetenceDisabled === 'true';
            select.disabled = readOnlyProfile || consolidatedLock || futureLock || Boolean(active);
            if (active) select.dataset.radarServicePendencyDisabled = 'true';
            else delete select.dataset.radarServicePendencyDisabled;

            const card = row.querySelector(`[data-service-advisory-invoice="${CSS.escape(String(invoice.id))}"]`);
            if (!card) return;
            card.querySelector('[data-radar-service-pendency-actions]')?.remove();
            if (!active) return;

            const container = root.document.createElement('div');
            container.dataset.radarServicePendencyActions = 'true';
            container.style.display = 'flex';
            container.style.flexWrap = 'wrap';
            container.style.gap = '4px';
            container.style.marginTop = '6px';

            const status = root.document.createElement('span');
            status.className = active.status === 'Aguardando reanálise'
                ? 'badge badge-warning'
                : 'badge badge-danger';
            status.textContent = active.status;
            container.appendChild(status);

            if (active.status === 'Aguardando reanálise' && canReanalyze) {
                appendPendencyButton(root, container, 'Reanalisar', 'reanalyze', active);
            }
            if (canRegister) {
                const label = root.getCorrectiveSubmissionActionLabel?.(active)
                    || (active.status === 'Aguardando reanálise' ? 'Substituir envio' : 'Registrar novo envio');
                if (label) appendPendencyButton(root, container, label, 'register', active);
            }
            card.appendChild(container);
        });
        return true;
    }

    function reconcile(root, schoolId, compKey) {
        const state = stateOf(root);
        if (!state || !root?.document || !schoolId || !compKey) return false;
        const { programId } = splitContext(root, compKey);
        if (!programId) return false;
        const rows = programRows(root, programId);
        if (!rows.length) return false;
        const verification = state.verifications?.[schoolId]?.[compKey] || {};

        syncConsolidationAction(root, schoolId, compKey, verification, rows);
        syncUnidentifiedExpenseAction(root, schoolId, compKey, verification, rows);
        root.RadarProntuarioOperationalUx?.enhance?.();
        syncServicePendencyControls(root, schoolId, compKey, verification, rows, state);
        return true;
    }

    function patchHandler(root, name) {
        const original = root?.[name];
        if (typeof original !== 'function') return false;
        if (original.__radarConditionalReconciler === true) return true;
        const wrapped = async function conditionalReconciledHandler(...args) {
            const schoolId = schoolIdForHandler(name, args);
            const compKeyBefore = compKeyForHandler(root, name, args);
            const result = await original.apply(this, args);
            const compKey = compKeyBefore || compKeyForHandler(root, name, args);
            if (compKey) reconcile(root, schoolId, compKey);
            return result;
        };
        Object.defineProperty(wrapped, '__radarConditionalReconciler', {
            value: true,
            enumerable: false
        });
        root[name] = wrapped;
        return true;
    }

    function patchRender(root) {
        const original = root?.renderProntuario;
        if (typeof original !== 'function') return false;
        if (original.__radarConditionalReconciler === true) return true;
        const wrapped = function renderProntuarioWithConditionalReconciliation(schoolId, ...args) {
            const result = original.call(this, schoolId, ...args);
            const activeCompetence = text(root.activeProntuarioCompetencia)
                || text(root.RadarGlobalCompetence?.getActiveCompetence?.());
            const state = stateOf(root);
            const school = (state?.schools || []).find(record => String(record.id) === String(schoolId));
            const programIds = school?.programasIds || [];
            programIds.forEach(programId => {
                if (activeCompetence) reconcile(root, schoolId, `${activeCompetence}_${programId}`);
            });
            return result;
        };
        Object.defineProperty(wrapped, '__radarConditionalReconciler', {
            value: true,
            enumerable: false
        });
        root.renderProntuario = wrapped;
        return true;
    }

    function install(root) {
        if (installed) return true;
        if (!root?.document
            || !root?.RadarApplicationServices
            || !root?.RadarOperationalWritePerformance
            || !root?.RadarServiceAdvisoryPendency) {
            return false;
        }
        const handlersReady = INLINE_HANDLERS.every(name => patchHandler(root, name));
        if (!handlersReady || !patchRender(root)) return false;
        installed = true;
        return true;
    }

    return Object.freeze({
        INLINE_HANDLERS,
        stateOf,
        splitContext,
        syncConsolidationAction,
        syncUnidentifiedExpenseAction,
        syncServicePendencyControls,
        reconcile,
        install
    });
}));
