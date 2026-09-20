(function installRadarOperationalContextRefresh(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (!root) return;
    root.RadarOperationalContextRefresh = Object.freeze(api);

    const tryInstall = () => api.install(root);
    if (!tryInstall() && typeof root.addEventListener === 'function') {
        const onServicesReady = () => {
            if (!tryInstall()) return;
            root.removeEventListener('radar:application-services-ready', onServicesReady);
        };
        root.addEventListener('radar:application-services-ready', onServicesReady);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createOperationalContextRefreshApi() {
    'use strict';

    const MIN_REFRESH_INTERVAL_MS = 30000;

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function isRemoteDataService(service) {
        try {
            return Boolean(
                service
                && typeof service.loadOperationalContext === 'function'
                && service.repository?.capabilities?.().remote === true
            );
        } catch (_error) {
            return false;
        }
    }

    function activeCompetence(root) {
        try {
            return text(root.RadarCompetenceContext?.getState?.()?.activeKey)
                || text(root.activeCompetenciaKey);
        } catch (_error) {
            return text(root.activeCompetenciaKey);
        }
    }

    function authenticated(root) {
        try {
            if (typeof root.getAuthenticatedUserId === 'function') {
                return Boolean(text(root.getAuthenticatedUserId()));
            }
        } catch (_error) {
            return false;
        }
        return Boolean(root.RadarAuthContext);
    }

    function refreshCurrentView(root) {
        if (typeof root.RadarGlobalCompetenceSelector?.refreshCurrentView === 'function') {
            root.RadarGlobalCompetenceSelector.refreshCurrentView();
            return true;
        }
        if (typeof root.switchView !== 'function') return false;
        const active = root.document?.querySelector?.('.nav-item.active[data-view]');
        const view = text(active?.dataset?.view || root.currentView || 'dashboard') || 'dashboard';
        const schoolId = text(root.activeProntuarioSchoolId || root.currentSchoolId);
        root.switchView(view, schoolId || undefined);
        return true;
    }

    function hiddenByState(element) {
        if (!element) return true;
        if (element.hidden === true) return true;
        if (element.getAttribute?.('aria-hidden') === 'true') return true;
        if (element.hasAttribute?.('inert')) return true;
        const hiddenAncestor = element.closest?.('[hidden], [inert], [aria-hidden="true"]');
        if (hiddenAncestor) return true;
        const overlay = element.matches?.('.modal-overlay')
            ? element
            : element.closest?.('.modal-overlay');
        if (overlay && !overlay.classList?.contains?.('show')) return true;
        return false;
    }

    function dialogActuallyOpen(root, element) {
        if (!element || hiddenByState(element)) return false;
        if (element.id === 'radar-auth-gate' && authenticated(root)) return false;
        if (element.matches?.('dialog') && !element.hasAttribute?.('open')) return false;
        try {
            const style = root.getComputedStyle?.(element);
            if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
        } catch (_error) {
            // A visibilidade estrutural acima continua sendo a autoridade em ambientes sem layout.
        }
        return true;
    }

    function editing(root) {
        const document = root.document;
        const modalDialogs = Array.from(
            document?.querySelectorAll?.(
                '.modal-overlay.show, dialog[open], [role="dialog"][aria-modal="true"]'
            ) || []
        );
        if (modalDialogs.some(element => dialogActuallyOpen(root, element))) return true;
        return Boolean(document?.activeElement?.matches?.('input, textarea, select, [contenteditable="true"]')
            || document?.getElementById?.('main-container')?.inert);
    }

    function createController(root, service, options = {}) {
        const minIntervalMs = Number.isFinite(options.minIntervalMs)
            ? Math.max(0, options.minIntervalMs)
            : MIN_REFRESH_INTERVAL_MS;
        let lastRefreshAt = 0;
        let refreshPromise = null;
        let pendingRefreshReason = '';

        function markPending(reason) {
            pendingRefreshReason = text(reason) || pendingRefreshReason || 'editing';
            return pendingRefreshReason;
        }

        async function refresh(reason = 'resume', refreshOptions = {}) {
            if (refreshPromise) {
                markPending(reason);
                const currentRefresh = refreshPromise;
                return currentRefresh.then(() => flushPending('inflight-finished'));
            }
            if (!authenticated(root)) {
                pendingRefreshReason = '';
                return { skipped: true, reason: 'unauthenticated' };
            }
            if (editing(root)) {
                markPending(reason);
                return { skipped: true, reason: 'editing', pending: true };
            }
            const competenceKey = activeCompetence(root);
            if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(competenceKey)) {
                return { skipped: true, reason: 'invalid-competence' };
            }
            const now = Date.now();
            if (refreshOptions.force !== true && (now - lastRefreshAt) < minIntervalMs) {
                return { skipped: true, reason: 'throttled' };
            }

            // Este refresh consome qualquer pendência já conhecida. Invalidações
            // que chegarem depois deste ponto voltam a preencher pendingRefreshReason
            // e serão relidas quando a consulta em voo terminar.
            pendingRefreshReason = '';

            const startedAt = Date.now();
            let run = null;
            run = Promise.resolve().then(async () => {
                const result = await service.loadOperationalContext(competenceKey, {
                    source: `session-${reason}-refresh`,
                    historyStatuses: root.RadarTask9PendencyPage?.requestedHistoryStatuses?.() || [],
                    shouldApply: () => authenticated(root) && !editing(root)
                        && activeCompetence(root) === competenceKey
                });
                if (result?.stale === true) {
                    if (authenticated(root) && editing(root) && activeCompetence(root) === competenceKey) {
                        markPending(reason);
                    }
                    return result;
                }
                if (!authenticated(root)) return { ...result, stale: true };
                if (editing(root)) {
                    markPending(reason);
                    return { ...result, stale: true, pending: true };
                }
                if (activeCompetence(root) !== competenceKey) return { ...result, stale: true };

                refreshCurrentView(root);
                lastRefreshAt = Date.now();
                if (typeof root.dispatchEvent === 'function' && typeof root.CustomEvent === 'function') {
                    root.dispatchEvent(new root.CustomEvent('radar:operational-context-refreshed', {
                        detail: {
                            competenceKey,
                            source: `session-${reason}-refresh`,
                            durationMs: Math.max(0, lastRefreshAt - startedAt),
                            refreshedAt: new Date(lastRefreshAt).toISOString()
                        }
                    }));
                }
                return result;
            }).catch(error => {
                root.console?.warn?.('Não foi possível atualizar o contexto operacional ao retomar a sessão.', error);
                return { ok: false, error };
            }).finally(() => {
                if (refreshPromise === run) refreshPromise = null;
            });
            refreshPromise = run;
            return run;
        }

        async function flushPending(reason = 'editing-ended') {
            if (!pendingRefreshReason) return { skipped: true, reason: 'no-pending-refresh' };
            if (!authenticated(root)) {
                pendingRefreshReason = '';
                return { skipped: true, reason: 'unauthenticated' };
            }
            if (editing(root)) return { skipped: true, reason: 'editing', pending: true };

            const pendingReason = pendingRefreshReason;
            pendingRefreshReason = '';
            const result = await refresh(`${pendingReason}-${reason}`, { force: true });
            if (
                result?.ok === false
                || result?.stale === true
                || (result?.skipped === true && result.reason === 'editing')
            ) {
                markPending(pendingReason);
            }
            return result;
        }

        return Object.freeze({
            refresh,
            flushPending,
            hasPendingRefresh: () => Boolean(pendingRefreshReason),
            getLastRefreshAt: () => lastRefreshAt
        });
    }

    function install(root = globalThis) {
        if (!root?.document) return false;
        if (root.__radarOperationalContextRefreshInstalled === true) return true;
        const service = root.RadarApplicationServices?.data;
        if (!service) return false;

        if (!isRemoteDataService(service)) {
            root.__radarOperationalContextRefreshInstalled = true;
            root.RadarOperationalContextRefreshController = Object.freeze({
                refresh: async () => ({ skipped: true, reason: 'local-mode' }),
                flushPending: async () => ({ skipped: true, reason: 'local-mode' }),
                hasPendingRefresh: () => false
            });
            return true;
        }

        const controller = createController(root, service);
        root.RadarOperationalContextRefreshController = controller;

        const flushPending = reason => {
            if (!controller.hasPendingRefresh()) return;
            const schedule = typeof root.setTimeout === 'function'
                ? root.setTimeout.bind(root)
                : setTimeout;
            schedule(() => {
                void controller.flushPending(reason);
            }, 0);
        };

        root.addEventListener?.('focus', () => {
            void controller.refresh('focus');
        });
        root.document.addEventListener?.('visibilitychange', () => {
            if (root.document.visibilityState !== 'visible') return;
            void controller.refresh('visibility');
        });
        root.document.addEventListener?.('focusout', () => flushPending('focusout'));
        root.document.addEventListener?.('click', () => flushPending('click'));
        root.document.addEventListener?.('transitionend', event => {
            const target = event?.target;
            if (!target?.matches?.('.modal-overlay, dialog, [role="dialog"]')) return;
            flushPending('dialog-transition');
        });
        root.document.addEventListener?.('close', () => flushPending('dialog-close'), true);

        if (typeof root.MutationObserver === 'function') {
            const isDialogNode = node => Boolean(
                node?.matches?.('.modal-overlay, dialog, [role="dialog"][aria-modal="true"]')
                || node?.querySelector?.('.modal-overlay, dialog, [role="dialog"][aria-modal="true"]')
            );
            const observer = new root.MutationObserver(records => {
                if (!controller.hasPendingRefresh()) return;
                const relevant = records.some(record => {
                    const target = record?.target;
                    if (record?.type === 'childList') {
                        return Array.from(record.removedNodes || []).some(isDialogNode)
                            || Array.from(record.addedNodes || []).some(isDialogNode);
                    }
                    return Boolean(
                        target?.matches?.('.modal-overlay, dialog, [role="dialog"][aria-modal="true"], #main-container')
                        || target?.querySelector?.('[role="dialog"][aria-modal="true"]')
                    );
                });
                if (relevant) flushPending('dialog-state-change');
            });
            observer.observe(root.document.body || root.document.documentElement, {
                subtree: true,
                attributes: true,
                childList: true,
                attributeFilter: ['class', 'hidden', 'aria-hidden', 'inert', 'open']
            });
            root.__radarOperationalContextRefreshObserver = observer;
        }

        root.__radarOperationalContextRefreshInstalled = true;
        return true;
    }

    return Object.freeze({
        MIN_REFRESH_INTERVAL_MS,
        activeCompetence,
        hiddenByState,
        dialogActuallyOpen,
        editing,
        createController,
        install
    });
}));
