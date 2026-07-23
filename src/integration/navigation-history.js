(function installRadarNavigationHistory(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.RadarNavigationHistory = Object.freeze(api);
        if (root.document) {
            if (!api.install(root)) {
                const interval = root.setInterval?.(() => {
                    if (api.install(root)) root.clearInterval?.(interval);
                }, 20);
                root.setTimeout?.(() => root.clearInterval?.(interval), 10000);
            }
        }
    }
}(typeof window !== 'undefined' ? window : globalThis, function createNavigationHistoryApi() {
    'use strict';

    const VALID_VIEWS = new Set([
        'dashboard',
        'escolas',
        'competencias',
        'pendencias',
        'inventario',
        'auditoria',
        'sme-config',
        'equipe',
        'prontuario'
    ]);

    function normalizeParam(value) {
        if (value === undefined || value === null || value === '') return null;
        return String(value);
    }

    function createNavigationState(view, param = null) {
        const normalizedView = VALID_VIEWS.has(String(view || '')) ? String(view) : 'dashboard';
        return {
            radarNavigation: true,
            view: normalizedView,
            param: normalizeParam(param)
        };
    }

    function normalizeNavigationState(state) {
        if (!state || state.radarNavigation !== true) return null;
        return createNavigationState(state.view, state.param);
    }

    function sameNavigationState(left, right) {
        const normalizedLeft = normalizeNavigationState(left);
        const normalizedRight = normalizeNavigationState(right);
        return Boolean(
            normalizedLeft
            && normalizedRight
            && normalizedLeft.view === normalizedRight.view
            && normalizedLeft.param === normalizedRight.param
        );
    }

    function install(root, options = {}) {
        if (!root || root.__radarNavigationHistoryInstalled) return false;
        if (typeof root.switchView !== 'function') return false;
        if (!root.history || typeof root.history.pushState !== 'function'
            || typeof root.history.replaceState !== 'function'
            || typeof root.addEventListener !== 'function') {
            return false;
        }

        const originalSwitchView = root.switchView.bind(root);
        const getActiveSchoolId = typeof options.getActiveSchoolId === 'function'
            ? options.getActiveSchoolId
            : () => {
                try {
                    return typeof activeSchoolId !== 'undefined' ? activeSchoolId : null;
                } catch (_error) {
                    return null;
                }
            };
        let restoringHistory = false;

        const initialState = normalizeNavigationState(root.history.state)
            || createNavigationState('dashboard');
        root.history.replaceState(initialState, '', root.location?.href || undefined);

        root.switchView = function switchViewWithHistory(view, param = null) {
            const result = originalSwitchView(view, param);
            if (restoringHistory) return result;

            const resolvedParam = String(view) === 'prontuario'
                ? (normalizeParam(param) || normalizeParam(getActiveSchoolId()))
                : normalizeParam(param);
            const nextState = createNavigationState(view, resolvedParam);
            const currentState = normalizeNavigationState(root.history.state);

            if (!sameNavigationState(currentState, nextState)) {
                root.history.pushState(nextState, '', root.location?.href || undefined);
            }
            return result;
        };

        root.addEventListener('popstate', event => {
            const state = normalizeNavigationState(event?.state);
            if (!state) return;
            restoringHistory = true;
            try {
                originalSwitchView(state.view, state.param);
            } finally {
                restoringHistory = false;
            }
        });

        root.__radarNavigationHistoryInstalled = true;
        return true;
    }

    return Object.freeze({
        VALID_VIEWS,
        createNavigationState,
        normalizeNavigationState,
        sameNavigationState,
        install
    });
}));