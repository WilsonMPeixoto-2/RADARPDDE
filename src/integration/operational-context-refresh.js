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
        if (typeof root.switchView !== 'function') return false;
        const active = root.document?.querySelector?.('.nav-item.active[data-view]');
        const view = text(active?.dataset?.view || root.currentView || 'dashboard') || 'dashboard';
        const schoolId = text(root.activeProntuarioSchoolId || root.currentSchoolId);
        root.switchView(view, schoolId || undefined);
        return true;
    }

    function createController(root, service, options = {}) {
        const minIntervalMs = Number.isFinite(options.minIntervalMs)
            ? Math.max(0, options.minIntervalMs)
            : MIN_REFRESH_INTERVAL_MS;
        let lastRefreshAt = 0;
        let refreshPromise = null;

        async function refresh(reason = 'resume') {
            if (refreshPromise) return refreshPromise;
            if (!authenticated(root)) return { skipped: true, reason: 'unauthenticated' };
            const competenceKey = activeCompetence(root);
            if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(competenceKey)) {
                return { skipped: true, reason: 'invalid-competence' };
            }
            const now = Date.now();
            if ((now - lastRefreshAt) < minIntervalMs) {
                return { skipped: true, reason: 'throttled' };
            }
            lastRefreshAt = now;

            let run = null;
            run = Promise.resolve().then(async () => {
                const result = await service.loadOperationalContext(competenceKey, {
                    source: `session-${reason}-refresh`
                });
                if (result?.stale === true) return result;
                if (activeCompetence(root) !== competenceKey) return { ...result, stale: true };
                refreshCurrentView(root);
                if (typeof root.dispatchEvent === 'function' && typeof root.CustomEvent === 'function') {
                    root.dispatchEvent(new root.CustomEvent('radar:operational-context-refreshed', {
                        detail: { competenceKey, source: `session-${reason}-refresh` }
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

        return Object.freeze({
            refresh,
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
                refresh: async () => ({ skipped: true, reason: 'local-mode' })
            });
            return true;
        }

        const controller = createController(root, service);
        root.RadarOperationalContextRefreshController = controller;
        root.addEventListener?.('focus', () => {
            void controller.refresh('focus');
        });
        root.document.addEventListener?.('visibilitychange', () => {
            if (root.document.visibilityState !== 'visible') return;
            void controller.refresh('visibility');
        });

        root.__radarOperationalContextRefreshInstalled = true;
        return true;
    }

    return Object.freeze({
        MIN_REFRESH_INTERVAL_MS,
        activeCompetence,
        createController,
        install
    });
}));
