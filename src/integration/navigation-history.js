(function installRadarNavigationHistory(root, factory) {
    'use strict';

    let routesApi = root?.RadarNavigationRoutes || null;
    if (!routesApi && typeof module !== 'undefined' && module.exports) {
        routesApi = require('./navigation-routes.js');
    }

    const api = factory(routesApi);
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
}(typeof window !== 'undefined' ? window : globalThis, function createNavigationHistoryApi(routesApi) {
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

    function requireRoutes() {
        if (!routesApi) throw new Error('Contrato de rotas do RADAR não carregado.');
        return routesApi;
    }

    function normalizeParam(value) {
        if (value === undefined || value === null || value === '') return null;
        return String(value);
    }

    function normalizeFilters(filters) {
        const escola = String(filters?.escola || '').trim();
        return escola ? { escola } : {};
    }

    function createNavigationState(view, param = null, section = null, filters = {}) {
        const routes = requireRoutes();
        const normalizedView = VALID_VIEWS.has(String(view || '')) ? String(view) : 'dashboard';
        const route = routes.normalizeRoute({
            valid: true,
            view: normalizedView,
            param: normalizeParam(param),
            section,
            filters: normalizeFilters(filters)
        });
        return {
            radarNavigation: true,
            view: route.view,
            param: route.param,
            section: route.section,
            filters: { ...route.filters }
        };
    }

    function normalizeNavigationState(state) {
        if (!state || state.radarNavigation !== true) return null;
        return createNavigationState(
            state.view,
            state.param,
            state.section,
            state.filters
        );
    }

    function sameNavigationState(left, right) {
        const normalizedLeft = normalizeNavigationState(left);
        const normalizedRight = normalizeNavigationState(right);
        return Boolean(
            normalizedLeft
            && normalizedRight
            && normalizedLeft.view === normalizedRight.view
            && normalizedLeft.param === normalizedRight.param
            && normalizedLeft.section === normalizedRight.section
            && JSON.stringify(normalizedLeft.filters) === JSON.stringify(normalizedRight.filters)
        );
    }

    function routeFromNavigationState(state) {
        const routes = requireRoutes();
        const normalizedState = normalizeNavigationState(state);
        if (!normalizedState) return null;
        return routes.normalizeRoute({
            valid: true,
            view: normalizedState.view,
            param: normalizedState.param,
            section: normalizedState.section,
            filters: normalizedState.filters
        });
    }

    function getController(root) {
        return root?.__radarNavigationHistoryController || null;
    }

    function applyRouteWithController(controller, route) {
        const routes = requireRoutes();
        const normalizedRoute = routes.normalizeRoute(route);
        controller.restoringHistory = true;
        try {
            const result = controller.applyRoute(normalizedRoute);
            if (result && typeof result === 'object') {
                return routes.normalizeRoute({ valid: true, ...result });
            }
            return normalizedRoute;
        } finally {
            controller.restoringHistory = false;
        }
    }

    function commitRoute(root, controller, route, { replace = false } = {}) {
        const routes = requireRoutes();
        const normalizedRoute = routes.normalizeRoute(route);
        const nextState = createNavigationState(
            normalizedRoute.view,
            normalizedRoute.param,
            normalizedRoute.section,
            normalizedRoute.filters
        );
        const currentState = normalizeNavigationState(root.history.state);
        const url = routes.buildRoute(normalizedRoute);

        if (replace) {
            root.history.replaceState(nextState, '', url);
        } else if (!sameNavigationState(currentState, nextState)) {
            root.history.pushState(nextState, '', url);
        }
        controller.currentRoute = normalizedRoute;
        return normalizedRoute;
    }

    function install(root, options = {}) {
        if (!root || root.__radarNavigationHistoryInstalled) return false;
        if (!routesApi || typeof root.switchView !== 'function') return false;
        if (!root.history || typeof root.history.pushState !== 'function'
            || typeof root.history.replaceState !== 'function'
            || typeof root.addEventListener !== 'function') {
            return false;
        }

        const routes = requireRoutes();
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
        const applyRoute = typeof options.applyRoute === 'function'
            ? options.applyRoute
            : route => {
                if (typeof root.applyAuthorizedNavigationRoute === 'function') {
                    return root.applyAuthorizedNavigationRoute(route);
                }
                originalSwitchView(route.view, route.param);
                if (route.view === 'prontuario' && route.section === 'pendencias') {
                    root.activateProntuarioTab?.('tab-pendencias');
                }
                return route;
            };

        const parsedInitialRoute = routes.parseRoute(
            root.location?.pathname || '/',
            root.location?.search || ''
        );
        const initialRoute = routes.normalizeRoute(parsedInitialRoute);
        const controller = {
            ready: false,
            restoringHistory: false,
            pendingRoute: initialRoute,
            currentRoute: initialRoute,
            originalSwitchView,
            getActiveSchoolId,
            applyRoute
        };

        root.__radarNavigationHistoryController = controller;
        root.history.replaceState(
            createNavigationState(
                initialRoute.view,
                initialRoute.param,
                initialRoute.section,
                initialRoute.filters
            ),
            '',
            routes.buildRoute(initialRoute)
        );

        root.switchView = function switchViewWithHistory(view, param = null) {
            const result = originalSwitchView(view, param);
            if (!controller.ready || controller.restoringHistory) return result;

            const resolvedParam = String(view) === 'prontuario'
                ? (normalizeParam(param) || normalizeParam(getActiveSchoolId()))
                : normalizeParam(param);
            const nextRoute = routes.normalizeRoute({
                valid: true,
                view,
                param: resolvedParam,
                section: null,
                filters: {}
            });
            commitRoute(root, controller, nextRoute);
            return result;
        };

        root.addEventListener('popstate', event => {
            const stateRoute = routeFromNavigationState(event?.state);
            const route = stateRoute || routes.normalizeRoute(routes.parseRoute(
                root.location?.pathname || '/',
                root.location?.search || ''
            ));
            if (!controller.ready) {
                controller.pendingRoute = route;
                controller.currentRoute = route;
                return;
            }
            controller.currentRoute = applyRouteWithController(controller, route);
        });

        root.__radarNavigationHistoryInstalled = true;
        return true;
    }

    function applyPendingRoute(root) {
        const controller = getController(root);
        if (!controller) return false;
        const route = controller.pendingRoute || controller.currentRoute;
        const appliedRoute = applyRouteWithController(controller, route);
        controller.pendingRoute = null;
        controller.ready = true;
        commitRoute(root, controller, appliedRoute, { replace: true });
        return appliedRoute;
    }

    function navigate(root, route, options = {}) {
        const controller = getController(root);
        if (!controller) return false;
        const appliedRoute = options.apply === false
            ? requireRoutes().normalizeRoute(route)
            : applyRouteWithController(controller, route);
        controller.ready = true;
        commitRoute(root, controller, appliedRoute, { replace: options.replace === true });
        return appliedRoute;
    }

    function currentRoute(root) {
        const controller = getController(root);
        return controller ? { ...controller.currentRoute, filters: { ...controller.currentRoute.filters } } : null;
    }

    return Object.freeze({
        VALID_VIEWS,
        createNavigationState,
        normalizeNavigationState,
        sameNavigationState,
        install,
        applyPendingRoute,
        navigate,
        currentRoute
    });
}));
