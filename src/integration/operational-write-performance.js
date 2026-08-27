(function installRadarOperationalWritePerformance(root, factory) {
    'use strict';

    const api = factory();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarOperationalWritePerformance = Object.freeze(api);
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
}(typeof window !== 'undefined' ? window : globalThis, function createOperationalWritePerformanceApi() {
    'use strict';

    const RESULT_AUTHORITATIVE_COMMANDS = new Set([
        'pendency:open',
        'pendency:open-with-analysis',
        'pendency:register-attempt',
        'pendency:cancel',
        'pendency:reopen',
        'pendency:register-contact',
        'inventory:update-asset',
        'inventory:forward',
        'inventory:complete',
        'inventory:create',
        'school:assign-controller',
        'school:bulk-assign-controller',
        'directory:save-program',
        'directory:deactivate-program',
        'configuration:save-calendar'
    ]);

    const COMMIT_AUTHORITATIVE_COMMANDS = new Set([
        'pendency:reanalyze',
        'school:save',
        'invoice:update-service-advisory'
    ]);

    const INCREMENTAL_STATE_ENTITIES_BY_COMMAND = Object.freeze({
        'verification:set-bonification': Object.freeze(['verifications', 'administrativeLogs']),
        'verification:set-technical-analysis': Object.freeze(['verifications', 'administrativeLogs']),
        'verification:close-bonification': Object.freeze(['verifications', 'administrativeLogs']),
        'invoice:update-service-advisory': Object.freeze([
            'registeredInvoices',
            'verifications',
            'administrativeLogs'
        ])
    });

    const INLINE_HANDLER_NAMES = Object.freeze([
        'toggleBonif',
        'changeAnaliseTecnica',
        'toggleInvoiceAdvisorySent',
        'changeInvoiceAdvisoryAnalysis',
        'toggleConsEnviada'
    ]);

    const ALLOWED_REFRESH_EXEMPT_ENTITIES = new Set(['administrativeLogs']);
    const REFRESH_EXEMPT_ENTITIES_BY_COMMAND = Object.freeze({
        'configuration:create-exercise': Object.freeze(['administrativeLogs'])
    });

    const suppressedSchools = new Map();
    let originalRenderProntuario = null;

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function diagnosticsApi(root) {
        const api = root?.RadarOperationalWriteDiagnostics;
        return api && typeof api === 'object' ? api : null;
    }

    function activeTrace(root) {
        try {
            return diagnosticsApi(root)?.active?.(root) ?? null;
        } catch (_error) {
            return null;
        }
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

    function sanitizeRefreshExemptEntities(value) {
        if (!Array.isArray(value)) return [];
        return [...new Set(value.filter(entity => ALLOWED_REFRESH_EXEMPT_ENTITIES.has(entity)))];
    }

    function decorateCommand(command = {}) {
        if (!command || typeof command !== 'object' || Array.isArray(command)) return command;
        if (typeof command.persist !== 'function') return command;

        const name = text(command.name);
        let decorated = command;
        const declaredRefreshExemptEntities = Array.isArray(command.remoteRefreshExemptEntities)
            ? command.remoteRefreshExemptEntities
            : null;

        if (declaredRefreshExemptEntities) {
            const sanitized = sanitizeRefreshExemptEntities(declaredRefreshExemptEntities);
            const changed = sanitized.length !== declaredRefreshExemptEntities.length
                || sanitized.some((entity, index) => entity !== declaredRefreshExemptEntities[index]);
            if (changed) {
                decorated = { ...decorated };
                if (sanitized.length > 0) decorated.remoteRefreshExemptEntities = sanitized;
                else delete decorated.remoteRefreshExemptEntities;
            }
        }

        if (command.remoteResultIsAuthoritative !== true
            && command.remoteCommitIsAuthoritative !== true) {
            if (RESULT_AUTHORITATIVE_COMMANDS.has(name)) {
                decorated = { ...decorated, remoteResultIsAuthoritative: true };
            } else if (COMMIT_AUTHORITATIVE_COMMANDS.has(name)) {
                decorated = { ...decorated, remoteCommitIsAuthoritative: true };
            }
        }

        const incrementalEntities = INCREMENTAL_STATE_ENTITIES_BY_COMMAND[name];
        if (incrementalEntities && !Array.isArray(command.incrementalStateEntities)) {
            decorated = {
                ...decorated,
                incrementalStateEntities: [...incrementalEntities]
            };
        }

        const refreshExemptEntities = REFRESH_EXEMPT_ENTITIES_BY_COMMAND[name];
        if (refreshExemptEntities) {
            decorated = {
                ...decorated,
                remoteRefreshExemptEntities: [
                    ...new Set([
                        ...sanitizeRefreshExemptEntities(decorated.remoteRefreshExemptEntities),
                        ...refreshExemptEntities
                    ])
                ]
            };
        }

        return decorated;
    }

    function collectDataServices(root) {
        const services = root?.RadarApplicationServices;
        if (!services || typeof services !== 'object') return [];
        return [...new Set(
            Object.values(services)
                .map(service => service?.dataService)
                .filter(service => service && typeof service.execute === 'function')
        )];
    }

    function patchDataService(dataService, root) {
        if (!dataService || typeof dataService.execute !== 'function') return false;
        if (dataService.__radarOperationalWritePerformance === true) return true;

        const originalExecute = dataService.execute.bind(dataService);
        dataService.execute = function executeWithOperationalWritePolicy(command = {}) {
            const traceId = activeTrace(root);
            let decorated = decorateCommand(command);
            if (traceId != null && typeof decorated?.persist === 'function') {
                const originalPersist = decorated.persist;
                const persistThis = decorated;
                decorated = {
                    ...decorated,
                    persist: async function tracedOperationalPersist(...args) {
                        markTrace(root, traceId, 'rpcStart');
                        try {
                            return await originalPersist.apply(persistThis, args);
                        } finally {
                            markTrace(root, traceId, 'rpcEnd');
                        }
                    }
                };
            }
            return originalExecute(decorated);
        };
        Object.defineProperty(dataService, '__radarOperationalWritePerformance', {
            value: true,
            configurable: false,
            enumerable: false,
            writable: false
        });
        return true;
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

    function installRenderDispatcher(root) {
        if (originalRenderProntuario) return true;
        if (typeof root?.renderProntuario !== 'function') return false;
        originalRenderProntuario = root.renderProntuario.bind(root);
        root.renderProntuario = function incrementalRenderDispatcher(schoolId, ...args) {
            if ((suppressedSchools.get(text(schoolId)) || 0) > 0) return false;
            return originalRenderProntuario(schoolId, ...args);
        };
        return true;
    }

    function handlerValue(handler) {
        const match = text(handler).match(/,\s*'([^']+)'\s*\)\s*;?\s*$/);
        return match ? match[1] : '';
    }

    function invoiceIdFromHandler(handler) {
        const match = text(handler).match(/(?:toggleInvoiceAdvisorySent|changeInvoiceAdvisoryAnalysis)\('([^']+)'/);
        return match ? match[1] : '';
    }

    function getApplicationState(root) {
        const service = root?.RadarApplicationServices?.verifications
            || root?.RadarApplicationServices?.invoices;
        return typeof service?.getState === 'function' ? service.getState() : null;
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
        const summary = Array.from(row?.querySelectorAll?.('span.badge') || [])
            .find(element => text(element.textContent).startsWith('Resumo mensal:'));
        if (!summary) return;

        summary.classList.remove('badge-success', 'badge-danger');
        summary.classList.add(bonificationValue === 'Sim' ? 'badge-success' : 'badge-danger');
        summary.textContent = `Resumo mensal: ${bonificationValue || 'Não'}`;
    }

    function syncProntuarioProgramUI(root, schoolId, compKey) {
        const state = getApplicationState(root);
        if (!state || !root?.document) return false;
        const splitContext = root.RadarCompetencia?.splitCompetenciaContext?.(compKey) || {};
        const competenceKey = splitContext.competenciaKey || text(compKey).split('_')[0];
        const programId = splitContext.contextId || text(compKey).slice(competenceKey.length + 1);
        if (!programId) return false;

        const verification = state.verifications?.[schoolId]?.[compKey] || {};
        const bonification = verification.bonificacao || verification.bonification || {};
        const analysis = verification.analise || verification.analysis || {};
        const rows = Array.from(root.document.querySelectorAll('#prontuario-verif-rows tr[data-program-id]'))
            .filter(row => row.dataset.programId === programId);
        if (rows.length === 0) return false;

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

            const group = row.querySelector('.btn-group-toggle');
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

            const analysisControl = row.querySelector('select[onchange*="changeAnaliseTecnica"]');
            if (analysisControl) {
                analysisControl.value = analysisValue;
                setAnalysisControlClass(root, analysisControl, analysisValue);
            }

            if (documentKey === 'notaFiscal') {
                syncFiscalNoteAction(root, row, schoolId, compKey, bonificationValue);
            }

            if (documentKey === 'consAssessoria') {
                Array.from(row.querySelectorAll('input[onchange*="toggleInvoiceAdvisorySent"]')).forEach(control => {
                    const invoiceId = invoiceIdFromHandler(control.getAttribute('onchange'));
                    const note = serviceNotes.find(item => String(item.id) === String(invoiceId));
                    if (!note) return;
                    const advisory = root.RadarServiceAdvisory.getServiceAdvisoryState(note, legacyFallback);
                    control.checked = Boolean(advisory.sent);
                });
                Array.from(row.querySelectorAll('select[onchange*="changeInvoiceAdvisoryAnalysis"]')).forEach(control => {
                    const invoiceId = invoiceIdFromHandler(control.getAttribute('onchange'));
                    const note = serviceNotes.find(item => String(item.id) === String(invoiceId));
                    if (!note) return;
                    const advisory = root.RadarServiceAdvisory.getServiceAdvisoryState(note, legacyFallback);
                    control.value = advisory.analysis;
                    setAnalysisControlClass(root, control, advisory.analysis);
                });
                syncServiceAdvisorySummary(row, bonificationValue);
            }

            Array.from(row.querySelectorAll('.radar-write-pending')).forEach(control => {
                if (typeof feedback?.settlePending === 'function') feedback.settlePending(control);
                else control.classList.remove('radar-write-pending');
            });
        });

        const summary = rows
            .map(row => row.querySelector('[data-program-status-summary]'))
            .find(Boolean);
        syncProgramSummary(root, summary, schoolId, competenceKey, programId);
        return true;
    }

    function compKeyForHandler(root, name, args) {
        if (name === 'toggleBonif' || name === 'changeAnaliseTecnica' || name === 'toggleConsEnviada') {
            return text(args[1]);
        }
        const invoiceId = text(args[0]);
        const state = getApplicationState(root);
        return text((state?.registeredInvoices || []).find(note => String(note.id) === invoiceId)?.compKey);
    }

    function schoolIdForHandler(name, args) {
        return text(
            name === 'toggleInvoiceAdvisorySent' || name === 'changeInvoiceAdvisoryAnalysis'
                ? args[1]
                : args[0]
        );
    }

    function patchInlineHandler(root, name) {
        const original = root?.[name];
        if (typeof original !== 'function') return false;
        if (original.__radarIncrementalInlineHandler === true) return true;

        const wrapped = async function incrementalInlineHandler(...args) {
            const traceId = takeTrace(root, name);
            const schoolId = schoolIdForHandler(name, args);
            const compKeyBefore = compKeyForHandler(root, name, args);
            const release = suppressProntuarioRender(schoolId);
            let result;
            try {
                result = await invokeWithTrace(root, traceId, () => original.apply(this, args));
            } finally {
                release();
            }
            if (result === false) {
                if (originalRenderProntuario) originalRenderProntuario(schoolId);
                return false;
            }
            const compKey = compKeyBefore || compKeyForHandler(root, name, args);
            if (compKey) {
                markTrace(root, traceId, 'applyStart');
                try {
                    syncProntuarioProgramUI(root, schoolId, compKey);
                } finally {
                    markTrace(root, traceId, 'applyEnd');
                }
            }
            scheduleStable(root, traceId);
            return result;
        };
        Object.defineProperty(wrapped, '__radarIncrementalInlineHandler', {
            value: true,
            enumerable: false
        });
        root[name] = wrapped;
        return true;
    }

    function patchInlineHandlers(root) {
        if (!installRenderDispatcher(root)) return false;
        return INLINE_HANDLER_NAMES.every(name => patchInlineHandler(root, name));
    }

    function install(root) {
        const dataServices = collectDataServices(root);
        if (dataServices.length === 0) return false;
        const dataServicesPatched = dataServices.every(service => patchDataService(service, root));
        if (!dataServicesPatched) return false;
        if (!root?.document) return true;
        return patchInlineHandlers(root);
    }

    return Object.freeze({
        RESULT_AUTHORITATIVE_COMMANDS,
        COMMIT_AUTHORITATIVE_COMMANDS,
        INCREMENTAL_STATE_ENTITIES_BY_COMMAND,
        INLINE_HANDLER_NAMES,
        ALLOWED_REFRESH_EXEMPT_ENTITIES,
        REFRESH_EXEMPT_ENTITIES_BY_COMMAND,
        sanitizeRefreshExemptEntities,
        decorateCommand,
        collectDataServices,
        patchDataService,
        suppressProntuarioRender,
        syncProntuarioProgramUI,
        patchInlineHandlers,
        install
    });
}));