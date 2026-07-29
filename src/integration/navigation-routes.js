(function installRadarNavigationRoutes(root, factory) {
    'use strict';

    function installProductExtensionsBootstrap(target) {
        if (!target?.document || target.RadarProductExtensionsReady) return;
        const src = '/src/integration/product-extensions-bootstrap.js';
        const existing = Array.from(target.document.scripts || []).find(script => (
            script.getAttribute?.('src') === src
            || script.dataset?.radarProductBootstrap === 'true'
        ));
        if (existing) return;
        const script = target.document.createElement('script');
        script.src = src;
        script.async = false;
        script.dataset.radarProductBootstrap = 'true';
        target.document.head.appendChild(script);
    }

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.RadarNavigationRoutes = Object.freeze(api);
        installProductExtensionsBootstrap(root);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createNavigationRoutesApi() {
    'use strict';

    const STATIC_ROUTE_TO_VIEW = Object.freeze({
        '/dashboard': 'dashboard',
        '/carteira': 'escolas',
        '/competencias': 'competencias',
        '/pendencias': 'pendencias',
        '/inventario': 'inventario',
        '/auditoria': 'auditoria',
        '/equipe': 'equipe',
        '/gestao-sme': 'sme-config'
    });

    const VIEW_TO_STATIC_ROUTE = Object.freeze(Object.entries(STATIC_ROUTE_TO_VIEW)
        .reduce((result, [path, view]) => {
            result[view] = path;
            return result;
        }, {}));

    const DASHBOARD_ROUTE = Object.freeze({
        valid: true,
        view: 'dashboard',
        param: null,
        section: null,
        filters: Object.freeze({}),
        canonicalPath: '/dashboard'
    });

    function normalizePathname(pathname) {
        const raw = String(pathname || '/').split(/[?#]/, 1)[0] || '/';
        const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`;
        if (withLeadingSlash === '/') return '/';
        return withLeadingSlash.replace(/\/+$/, '') || '/';
    }

    function decodeSchoolId(value) {
        if (!value) return null;
        try {
            const decoded = decodeURIComponent(value).trim();
            if (!decoded || decoded.includes('/')) return null;
            return decoded;
        } catch (_error) {
            return null;
        }
    }

    function encodeSchoolId(value) {
        const normalized = String(value || '').trim();
        if (!normalized || normalized.includes('/')) return null;
        return encodeURIComponent(normalized);
    }

    function normalizeFilters(view, filters = {}) {
        if (view !== 'pendencias') return {};
        const escola = String(filters?.escola || '').trim();
        return escola ? { escola } : {};
    }

    function createRoute({
        valid = true,
        view = 'dashboard',
        param = null,
        section = null,
        filters = {},
        canonicalPath = null
    } = {}) {
        return {
            valid: Boolean(valid),
            view: String(view || 'dashboard'),
            param: param == null || param === '' ? null : String(param),
            section: section == null || section === '' ? null : String(section),
            filters: normalizeFilters(view, filters),
            canonicalPath: canonicalPath || null
        };
    }

    function invalidRoute() {
        return createRoute({
            valid: false,
            view: 'dashboard',
            canonicalPath: '/dashboard'
        });
    }

    function buildCanonicalPath(view, param, section, filters) {
        if (view === 'prontuario') {
            const encodedSchoolId = encodeSchoolId(param);
            if (!encodedSchoolId) return '/dashboard';
            return section === 'pendencias'
                ? `/escolas/${encodedSchoolId}/pendencias`
                : `/escolas/${encodedSchoolId}`;
        }

        const basePath = VIEW_TO_STATIC_ROUTE[view];
        if (!basePath) return '/dashboard';
        if (view !== 'pendencias') return basePath;

        const normalizedFilters = normalizeFilters(view, filters);
        if (!normalizedFilters.escola) return basePath;
        const query = new URLSearchParams({ escola: normalizedFilters.escola });
        return `${basePath}?${query.toString()}`;
    }

    function parseRoute(pathname = '/', search = '') {
        const normalizedPath = normalizePathname(pathname);
        if (normalizedPath === '/') {
            return createRoute({
                view: 'dashboard',
                canonicalPath: '/dashboard'
            });
        }

        const staticView = STATIC_ROUTE_TO_VIEW[normalizedPath];
        if (staticView) {
            const filters = {};
            if (staticView === 'pendencias') {
                const query = new URLSearchParams(String(search || '').replace(/^\?/, ''));
                const escola = String(query.get('escola') || '').trim();
                if (escola) filters.escola = escola;
            }
            return createRoute({
                view: staticView,
                filters,
                canonicalPath: buildCanonicalPath(staticView, null, null, filters)
            });
        }

        const parts = normalizedPath.split('/').filter(Boolean);
        if (parts[0] !== 'escolas' || (parts.length !== 2 && parts.length !== 3)) {
            return invalidRoute();
        }

        const schoolId = decodeSchoolId(parts[1]);
        if (!schoolId) return invalidRoute();

        const section = parts.length === 3 ? parts[2] : null;
        if (section && section !== 'pendencias') return invalidRoute();

        return createRoute({
            view: 'prontuario',
            param: schoolId,
            section,
            canonicalPath: buildCanonicalPath('prontuario', schoolId, section, {})
        });
    }

    function normalizeRoute(route) {
        if (!route || route.valid === false) {
            return {
                ...DASHBOARD_ROUTE,
                filters: {}
            };
        }

        const view = String(route.view || '');
        if (view === 'prontuario') {
            const param = String(route.param || '').trim();
            const section = route.section === 'pendencias' ? 'pendencias' : null;
            const canonicalPath = buildCanonicalPath(view, param, section, {});
            if (canonicalPath === '/dashboard') {
                return {
                    ...DASHBOARD_ROUTE,
                    filters: {}
                };
            }
            return createRoute({
                view,
                param,
                section,
                canonicalPath
            });
        }

        if (!VIEW_TO_STATIC_ROUTE[view]) {
            return {
                ...DASHBOARD_ROUTE,
                filters: {}
            };
        }

        const filters = normalizeFilters(view, route.filters || {});
        return createRoute({
            view,
            filters,
            canonicalPath: buildCanonicalPath(view, null, null, filters)
        });
    }

    function buildRoute(navigationState) {
        return normalizeRoute(navigationState).canonicalPath;
    }

    return Object.freeze({
        STATIC_ROUTE_TO_VIEW,
        VIEW_TO_STATIC_ROUTE,
        parseRoute,
        buildRoute,
        normalizeRoute,
        normalizePathname
    });
}));