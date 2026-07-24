(function installRadarNavigationPolicy(root, factory) {
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
        root.RadarNavigationPolicy = Object.freeze(api);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createNavigationPolicyApi(routesApi) {
    'use strict';

    const INVENTORY_BLOCKED_VIEWS = new Set(['competencias', 'pendencias', 'auditoria']);

    function normalize(route) {
        if (!routesApi) throw new Error('Contrato de rotas do RADAR não carregado.');
        return routesApi.normalizeRoute(route);
    }

    function hasSchool(schools, schoolId) {
        return Array.isArray(schools)
            && schools.some(school => String(school?.id || '') === String(schoolId || ''));
    }

    function resolveAuthorizedRoute(route, context = {}) {
        const profile = String(context.profile || 'controlador');
        const schools = Array.isArray(context.schools) ? context.schools : [];
        const normalized = normalize(route);

        if (normalized.view === 'sme-config' && profile !== 'sme') {
            return normalize({ valid: true, view: 'dashboard' });
        }
        if (normalized.view === 'equipe' && profile !== 'assistente') {
            return normalize({ valid: true, view: 'dashboard' });
        }
        if (profile === 'inventario' && INVENTORY_BLOCKED_VIEWS.has(normalized.view)) {
            return normalize({ valid: true, view: 'dashboard' });
        }

        if (normalized.view === 'prontuario') {
            if (!hasSchool(schools, normalized.param)) {
                return normalize({ valid: true, view: 'escolas' });
            }
            if (normalized.section === 'pendencias' && ['inventario', 'sme'].includes(profile)) {
                return normalize({
                    valid: true,
                    view: 'prontuario',
                    param: normalized.param
                });
            }
        }

        if (normalized.view === 'pendencias' && normalized.filters?.escola) {
            if (!hasSchool(schools, normalized.filters.escola)) {
                return normalize({ valid: true, view: 'escolas' });
            }
        }

        return normalized;
    }

    return Object.freeze({
        INVENTORY_BLOCKED_VIEWS,
        resolveAuthorizedRoute
    });
}));
