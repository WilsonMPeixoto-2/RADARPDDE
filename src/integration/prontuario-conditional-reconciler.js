(function installRadarProntuarioConditionalReconciler(root, factory) {
    'use strict';

    const serviceAdvisory = typeof module !== 'undefined' && module.exports
        ? require('../domain/service-advisory.js')
        : root.RadarServiceAdvisory;
    const api = factory(serviceAdvisory);
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
}(typeof window !== 'undefined' ? window : globalThis, function createProntuarioConditionalReconcilerApi(
    serviceAdvisory
) {
    'use strict';

    if (!serviceAdvisory) {
        throw new Error('Domínio canônico de Assessoria obrigatório para a reconciliação do Prontuário.');
    }
    const { getServiceAdvisoryState } = serviceAdvisory;

    const INLINE_HANDLERS = Object.freeze([
        'toggleBonif',
        'changeAnaliseTecnica',
        'toggleInvoiceAdvisorySent',
        'changeInvoiceAdvisoryAnalysis',
        'toggleConsEnviada'
    ]);
    const suppressedSchools = new Map();
    let installed = false;
    let originalRenderProntuario = null;

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function diagnosticsApi(root) {
        const api = root?.RadarOperationalWriteDiagnostics;
        return api && typeof api === 'object' ? api : null;
    }

    function takeTrace(root, label) {
        try {
            return diagnosticsApi(root)?.take?.(root, label) ?? null;
        } catch (_error) {
            return null;
        }
    }

    function markTrace(root, id, phase) {
        if (id == null) return false;
        try {
            return diagnosticsApi(root)?.mark?.(root, id, phase) === true;
        } catch (_error) {
            return false;
        }
    }

    function invokeWithTrace(root, id, callback) {
        const diagnostics = diagnosticsApi(root);
        if (id == null || typeof diagnostics?.withActive !== 'function') return callback();
        return diagnostics.withActive(root, id, callback);
    }

    function scheduleStable(root, id) {
        if (id == null) return false;
        const finish = () => markTrace(root, id, 'stable');
        try {
            if (typeof root?.requestAnimationFrame === 'function') {
                root.requestAnimationFrame(finish);
                return true;
            }
            if (typeof root?.queueMicrotask === 'function') {
                root.queueMicrotask(finish);
                return true;
            }
            if (typeof queueMicrotask === 'function') {
                queueMicrotask(finish);
                return true;
            }
            if (typeof root?.setTimeout === 'function') {
                root.setTimeout(finish, 0);
                return true;
            }
        } catch (_error) {
            return false;
        }
        return finish();
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

    function currentRenderedCompetence(root) {
        const tab = root.document?.querySelector?.(
            '.comp-sub-tab.active[data-competence], .comp-sub-tab[aria-pressed="true"][data-competence]'
        );
        return text(tab?.dataset?.competence)
            || text(root.RadarGlobalCompetence?.getActiveCompetence?.());
    }

    function suppressProntuarioRender(schoolId) {
        const key = text(schoolId);
        if (!key) return () => {};
        suppressedSchools.set(key, (suppressedSchools.get(key) || 0) + 1);
        return () => {
            const next = (suppressedSchools.get(key) || 1) - 1;
            if (next <= 0) suppressedSchools.delete(key);
            else suppressedSchools.set(key, next);
        };
    }

    function handlerValue(handler) {
        const match = text(handler).match(/,\s*'([^']+)'\s*\)\s*;?\s*$/);
        return match ? match[1] : '';
    }

    function invoiceIdFromHandler(handler) {
        const match = text(handler).match(/(?:toggleInvoiceAdvisorySent|changeInvoiceAdvisoryAnalysis)\('([^']+)'/);
        return match ? match[1] : '';
    }

    function analysisStateClass(root, value) {
        if (typeof root?.RadarOperationalWriteFeedback?.analysisStateClass === 'function') {
            return root.RadarOperationalWriteFeedback.analysisStateClass(value);
        }
        return `analise-${text(value || 'Não analisado')
            .toLocaleLowerCase('pt-BR')
            .replace(/\s+/g, '-')
            .replace(/[()]/g, '')}`;
    }

    function setAnalysisControlClass(root, control, value) {
        if (!control?.classList) return;
        Array.from(control.classList)
            .filter(className => className.startsWith('analise-'))
            .forEach(className => control.classList.remove(className));
        control.classList.add(analysisStateClass(root, value));
    }

    function syncProgramSummary(root, summary, schoolId, competenceKey, programId) {
        if (!summary) return;
        if (typeof root.getProgramBonificationStatus === 'function'
            && typeof root.getProgramBonificationMeta === 'function') {
            const meta = root.getProgramBonificationMeta(
                root.getProgramBonificationStatus(schoolId, competenceKey, programId)
            );
            const badge = summary.querySelector('[data-status-dimension="bonificacao"]');
            if (badge && meta) {
                badge.className = `badge ${meta.badgeClass}`;
                badge.textContent = meta.label;
            }
        }
        if (typeof root.getProgramTechnicalStatus === 'function'
            && typeof root.getProgramTechnicalMeta === 'function') {
            const meta = root.getProgramTechnicalMeta(
                root.getProgramTechnicalStatus(schoolId, competenceKey, programId)
            );
            const badge = summary.querySelector('[data-status-dimension="analise"]');
            if (badge && meta) {
                badge.className = `badge ${meta.badgeClass}`;
                badge.textContent = meta.label;
            }
        }
    }

    function documentCellFromBonificationGroup(row) {
        const group = row?.querySelector?.('.btn-group-toggle');
        const bonificationCell = group?.closest?.('td');
        return {
            group,
            documentCell: bonificationCell?.previousElementSibling || null
        };
    }

    function syncFiscalNoteAction(root, row, schoolId, compKey, bonificationValue) {
        const { group, documentCell } = documentCellFromBonificationGroup(row);
        if (!documentCell) return;

        const existingButton = documentCell.querySelector(
            'button[data-radar-incremental-add-note], button[onclick*="openModalDadosNota"]'
        );
        const canEdit = Boolean(group && Array.from(
            group.querySelectorAll('button[onclick*="toggleBonif"]')
        ).some(button => !button.disabled));
        const shouldShow = bonificationValue === 'Sim' && canEdit;

        if (!shouldShow) {
            if (!existingButton) return;
            const wrapper = existingButton.parentElement;
            existingButton.remove();
            if (wrapper
                && wrapper.childElementCount === 0
                && text(wrapper.textContent) === '') {
                wrapper.remove();
            }
            return;
        }

        if (existingButton || typeof root?.openModalDadosNota !== 'function') return;

        const wrapper = root.document.createElement('div');
        wrapper.dataset.radarIncrementalFiscalNoteActions = 'true';
        wrapper.style.marginTop = '6px';
        wrapper.style.display = 'flex';
        wrapper.style.flexWrap = 'wrap';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '4px';

        const button = root.document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-secondary btn-sm';
        button.dataset.radarIncrementalAddNote = 'true';
        button.style.fontSize = '0.65rem';
        button.style.padding = '2px 6px';
        button.style.display = 'inline-flex';
        button.style.alignItems = 'center';
        button.style.marginBottom = '4px';
        button.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:2px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>Adicionar Nota';
        button.addEventListener('click', () => root.openModalDadosNota(schoolId, compKey));

        wrapper.appendChild(button);
        documentCell.appendChild(wrapper);
    }

    function syncServiceAdvisorySummary(row, bonificationValue) {
        const value = bonificationValue || 'Não';
        const toggle = row?.querySelector?.(
            '.invoice-summary-block.is-bonification .invoice-bonification-toggle.is-readonly'
        );
        if (toggle) {
            Array.from(toggle.querySelectorAll('span')).forEach(option => {
                option.classList.toggle('is-selected', text(option.textContent) === value);
            });
            toggle.setAttribute('aria-label', `Bonificação da Consulta Assessoria: ${value}`);
        }

        const summary = row?.querySelector?.(
            '.invoice-summary-block.is-bonification .invoice-document-status'
        );
        if (!summary) return;

        summary.classList.remove(
            'is-correct',
            'is-incorrect',
            'is-pending',
            'is-late',
            'badge-success',
            'badge-danger'
        );
        summary.classList.add(
            value === 'Sim'
                ? 'is-correct'
                : value === 'Não'
                    ? 'is-incorrect'
                    : 'is-pending'
        );
        summary.textContent = value;
    }

    function syncProgramDocumentState(root, schoolId, compKey, state, rows) {
        const { competence, programId } = splitContext(root, compKey);
        const verification = state.verifications?.[schoolId]?.[compKey] || {};
        const bonification = verification.bonificacao || verification.bonification || {};
        const analysis = verification.analise || verification.analysis || {};
        const feedback = root.RadarOperationalWriteFeedback;
        const activeClasses = feedback?.ACTIVE_CLASSES || ['active-sim', 'active-nao', 'active-naoseaplica'];
        const invoices = Array.isArray(state.registeredInvoices) ? state.registeredInvoices : [];
        const serviceNotes = invoices.filter(note => (
            note.escolaId === schoolId && note.compKey === compKey && note.tipo === 'servico'
        ));
        const legacyFallback = serviceNotes.length === 1
            ? {
                sent: bonification.consEnviada === true || bonification.consAssessoria === 'Sim',
                analysis: analysis.consAssessoria
            }
            : {};

        rows.forEach(row => {
            const documentKey = row.dataset.documentKey || '';
            const bonificationValue = bonification[documentKey] || '';
            const analysisValue = analysis[documentKey] || 'Não analisado';

            const group = row.querySelector?.('.btn-group-toggle');
            if (group) {
                Array.from(group.querySelectorAll('button[onclick*="toggleBonif"]')).forEach(button => {
                    activeClasses.forEach(className => button.classList.remove(className));
                    const value = feedback?.bonificationValueFromHandler?.(button.getAttribute('onclick'))
                        || handlerValue(button.getAttribute('onclick'));
                    if (value === bonificationValue) {
                        const activeClass = feedback?.bonificationActiveClass?.(value);
                        if (activeClass) button.classList.add(activeClass);
                    }
                });
            }

            const analysisControl = row.querySelector?.('select[onchange*="changeAnaliseTecnica"]');
            if (analysisControl) {
                analysisControl.value = analysisValue;
                setAnalysisControlClass(root, analysisControl, analysisValue);
                const bbAgilNaLocked = documentKey === 'declBBAgil'
                    && bonificationValue === 'Não se aplica';
                if (bbAgilNaLocked) {
                    analysisControl.disabled = true;
                    analysisControl.dataset.bbAgilNaLock = 'true';
                } else if (analysisControl.dataset.bbAgilNaLock === 'true') {
                    analysisControl.disabled = false;
                    delete analysisControl.dataset.bbAgilNaLock;
                }
            }

            if (documentKey === 'notaFiscal') {
                syncFiscalNoteAction(root, row, schoolId, compKey, bonificationValue);
            }

            if (documentKey === 'consAssessoria') {
                Array.from(row.querySelectorAll?.('input[onchange*="toggleInvoiceAdvisorySent"]') || []).forEach(control => {
                    const invoiceId = invoiceIdFromHandler(control.getAttribute('onchange'));
                    const note = serviceNotes.find(item => String(item.id) === String(invoiceId));
                    if (!note) return;
                    const advisory = getServiceAdvisoryState(note, legacyFallback);
                    control.checked = Boolean(advisory.sent);
                });
                Array.from(row.querySelectorAll?.('select[onchange*="changeInvoiceAdvisoryAnalysis"]') || []).forEach(control => {
                    const invoiceId = invoiceIdFromHandler(control.getAttribute('onchange'));
                    const note = serviceNotes.find(item => String(item.id) === String(invoiceId));
                    if (!note) return;
                    const advisory = getServiceAdvisoryState(note, legacyFallback);
                    control.value = advisory.analysis;
                    setAnalysisControlClass(root, control, advisory.analysis);
                });
                syncServiceAdvisorySummary(row, bonificationValue);
            }

            Array.from(row.querySelectorAll?.('.radar-write-pending') || []).forEach(control => {
                if (typeof feedback?.settlePending === 'function') feedback.settlePending(control);
                else control.classList?.remove?.('radar-write-pending');
            });
        });

        const summary = rows
            .map(row => row.querySelector?.('[data-program-status-summary]'))
            .find(Boolean);
        syncProgramSummary(root, summary, schoolId, competence, programId);
        return verification;
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

    function cardForInvoice(row, invoiceId) {
        return Array.from(row.querySelectorAll?.('[data-service-advisory-invoice]') || [])
            .find(card => String(card.dataset.serviceAdvisoryInvoice) === String(invoiceId)) || null;
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

    function appendRecoveryButton(root, container, invoice, schoolId, select) {
        const button = root.document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-secondary btn-sm';
        button.style.fontSize = '0.68rem';
        button.style.padding = '2px 6px';
        button.dataset.radarServicePendencyAction = 'recover-open';
        button.textContent = 'Abrir pendência';
        button.addEventListener('click', () => {
            root.changeInvoiceAdvisoryAnalysis?.(invoice.id, schoolId, 'Incorreto', select);
        });
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

        Array.from(row.querySelectorAll?.('select[onchange*="changeInvoiceAdvisoryAnalysis"]') || []).forEach(select => {
            const invoiceId = invoiceIdFromControl(select);
            const invoice = invoices.find(record => String(record.id) === String(invoiceId));
            if (!invoice) return;
            const linkedActive = root.RadarServiceAdvisoryPendency?.findActiveForInvoice?.(
                root,
                state,
                invoice
            ) || null;
            const active = legacyActive || linkedActive;
            const futureLock = select.dataset.futureCompetenceDisabled === 'true';
            select.disabled = readOnlyProfile || consolidatedLock || futureLock || Boolean(active);
            if (linkedActive) select.dataset.radarServicePendencyDisabled = 'true';
            else delete select.dataset.radarServicePendencyDisabled;

            const card = cardForInvoice(row, invoice.id);
            if (!card) return;
            card.querySelector('[data-radar-service-pendency-actions]')?.remove();
            if (legacyActive) return;

            const individualAnalysis = text(
                invoice.analiseConsultaAssessoria
                || invoice.payload?.analiseConsultaAssessoria
            ) || 'Não analisado';
            if (!linkedActive && individualAnalysis !== 'Incorreto') return;

            const container = root.document.createElement('div');
            container.dataset.radarServicePendencyActions = 'true';
            container.style.display = 'flex';
            container.style.flexWrap = 'wrap';
            container.style.gap = '4px';
            container.style.marginTop = '6px';

            if (linkedActive) {
                const status = root.document.createElement('span');
                status.className = linkedActive.status === 'Aguardando reanálise'
                    ? 'badge badge-warning'
                    : 'badge badge-danger';
                status.textContent = linkedActive.status;
                container.appendChild(status);

                if (linkedActive.status === 'Aguardando reanálise' && canReanalyze) {
                    appendPendencyButton(root, container, 'Reanalisar', 'reanalyze', linkedActive);
                }
                if (canRegister) {
                    const label = root.getCorrectiveSubmissionActionLabel?.(linkedActive)
                        || (linkedActive.status === 'Aguardando reanálise' ? 'Substituir envio' : 'Registrar novo envio');
                    if (label) appendPendencyButton(root, container, label, 'register', linkedActive);
                }
            } else if (!readOnlyProfile && !consolidatedLock && !futureLock) {
                appendRecoveryButton(root, container, invoice, schoolId, select);
            }
            if (container.childElementCount > 0) card.appendChild(container);
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

        const verification = syncProgramDocumentState(root, schoolId, compKey, state, rows);
        syncConsolidationAction(root, schoolId, compKey, verification, rows);
        syncUnidentifiedExpenseAction(root, schoolId, compKey, verification, rows);
        root.RadarProntuarioOperationalUx?.enhance?.();
        syncServicePendencyControls(root, schoolId, compKey, verification, rows, state);
        return true;
    }

    function reconcileRenderedPrograms(root, schoolId) {
        const activeCompetence = currentRenderedCompetence(root);
        const programIds = [...new Set(Array.from(root.document?.querySelectorAll?.(
            '#prontuario-verif-rows tr[data-program-id][data-document-key]'
        ) || []).map(row => text(row.dataset.programId)).filter(Boolean))];
        programIds.forEach(programId => {
            if (activeCompetence) reconcile(root, schoolId, `${activeCompetence}_${programId}`);
        });
    }

    function patchHandler(root, name) {
        const original = root?.[name];
        if (typeof original !== 'function') return false;
        if (original.__radarConditionalReconciler === true) return true;

        const wrapped = async function conditionalReconciledHandler(...args) {
            const traceId = takeTrace(root, name);
            const schoolId = schoolIdForHandler(name, args);
            const compKeyBefore = compKeyForHandler(root, name, args);
            const requiresFullProntuarioRender = name === 'toggleBonif'
                && text(args[2]) === 'notaFiscal';
            const release = requiresFullProntuarioRender
                ? (() => {})
                : suppressProntuarioRender(schoolId);
            let result;
            try {
                result = await invokeWithTrace(root, traceId, () => original.apply(this, args));
            } finally {
                release();
            }

            if (result === false) {
                if (!requiresFullProntuarioRender && originalRenderProntuario) {
                    originalRenderProntuario(schoolId);
                    reconcileRenderedPrograms(root, schoolId);
                }
                return false;
            }

            if (requiresFullProntuarioRender) {
                scheduleStable(root, traceId);
                return result;
            }

            const compKey = compKeyBefore || compKeyForHandler(root, name, args);
            if (compKey) {
                markTrace(root, traceId, 'applyStart');
                try {
                    reconcile(root, schoolId, compKey);
                } finally {
                    markTrace(root, traceId, 'applyEnd');
                }
            }
            scheduleStable(root, traceId);
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

        originalRenderProntuario = original.bind(root);
        const wrapped = function renderProntuarioWithConditionalReconciliation(schoolId, ...args) {
            if ((suppressedSchools.get(text(schoolId)) || 0) > 0) return false;
            const result = original.call(this, schoolId, ...args);
            reconcileRenderedPrograms(root, schoolId);
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
            || !root?.RadarServiceAdvisoryPendency) {
            return false;
        }
        if (!patchRender(root)) return false;
        const handlersReady = INLINE_HANDLERS.every(name => patchHandler(root, name));
        if (!handlersReady) return false;
        installed = true;
        return true;
    }

    return Object.freeze({
        INLINE_HANDLERS,
        stateOf,
        splitContext,
        currentRenderedCompetence,
        suppressProntuarioRender,
        syncProgramDocumentState,
        syncConsolidationAction,
        syncUnidentifiedExpenseAction,
        syncServicePendencyControls,
        reconcile,
        patchHandler,
        patchRender,
        install
    });
}));
