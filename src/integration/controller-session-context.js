(function installRadarControllerSessionContext(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.RadarControllerSessionContext = Object.freeze(api);
        if (root.document) {
            if (!api.install(root)) {
                const interval = root.setInterval?.(() => {
                    if (api.install(root)) root.clearInterval?.(interval);
                }, 20);
                root.setTimeout?.(() => root.clearInterval?.(interval), 10000);
            }
        }
    }
}(typeof window !== 'undefined' ? window : globalThis, function createControllerSessionContextApi() {
    'use strict';

    function normalizeText(value) {
        return String(value || '').trim();
    }

    function activeControllers(records) {
        return (Array.isArray(records) ? records : []).filter(item => item && item.active !== false);
    }

    function resolveControllerId(options = {}) {
        const authorization = options.authorization || null;
        const authenticatedControllerId = normalizeText(authorization?.controllerId);
        if (authorization?.role === 'controller' && authenticatedControllerId) {
            return authenticatedControllerId;
        }

        const available = activeControllers(options.controllers);
        const fallbackId = normalizeText(options.fallbackId);
        if (fallbackId && available.some(item => normalizeText(item.id) === fallbackId)) {
            return fallbackId;
        }
        return normalizeText(available[0]?.id);
    }

    function resolveControllerRecord(options = {}) {
        const controllers = activeControllers(options.controllers);
        const id = resolveControllerId(options);
        const record = controllers.find(item => normalizeText(item.id) === id) || null;
        if (record) return record;

        if (options.authorization?.role === 'controller' && id) {
            const user = options.user || {};
            return {
                id,
                name: normalizeText(user.displayName) || normalizeText(user.email) || 'Controlador',
                email: normalizeText(user.email),
                active: true
            };
        }
        return null;
    }

    function filterControllerAlerts(options = {}) {
        const alerts = Array.isArray(options.alerts) ? options.alerts : [];
        const controllerId = normalizeText(options.controllerId);
        if (!controllerId) return [...alerts];

        const allowedSchoolIds = new Set(
            (Array.isArray(options.schools) ? options.schools : [])
                .filter(school => normalizeText(school?.controladorId) === controllerId)
                .map(school => normalizeText(school?.id))
                .filter(Boolean)
        );

        return alerts.filter(alert => {
            const schoolId = normalizeText(alert?.schoolId);
            return !schoolId || allowedSchoolIds.has(schoolId);
        });
    }

    function install(root, options = {}) {
        if (!root || root.__radarControllerSessionContextInstalled) return false;
        if (typeof root.getDefaultControladorId !== 'function') return false;

        const originalGetDefaultControllerId = root.getDefaultControladorId.bind(root);
        const originalGetDefaultController = typeof root.getDefaultControlador === 'function'
            ? root.getDefaultControlador.bind(root)
            : null;
        const originalGetCurrentUser = typeof root.getCurrentUser === 'function'
            ? root.getCurrentUser.bind(root)
            : null;
        const originalGetAlerts = typeof root.getAlerts === 'function'
            ? root.getAlerts.bind(root)
            : null;

        const getControllers = typeof options.getControllers === 'function'
            ? options.getControllers
            : () => {
                try {
                    return typeof controladores !== 'undefined' && Array.isArray(controladores)
                        ? controladores
                        : [];
                } catch (_error) {
                    return [];
                }
            };
        const getSchools = typeof options.getSchools === 'function'
            ? options.getSchools
            : () => {
                try {
                    return typeof escolas !== 'undefined' && Array.isArray(escolas)
                        ? escolas
                        : [];
                } catch (_error) {
                    return [];
                }
            };

        function currentAuthentication() {
            return root.RadarAuthContext || null;
        }

        root.getDefaultControladorId = function getAuthenticatedControllerId() {
            const authentication = currentAuthentication();
            return resolveControllerId({
                authorization: authentication?.authorization,
                controllers: getControllers(),
                fallbackId: originalGetDefaultControllerId()
            });
        };

        root.getDefaultControlador = function getAuthenticatedController() {
            const authentication = currentAuthentication();
            return resolveControllerRecord({
                authorization: authentication?.authorization,
                user: authentication?.user,
                controllers: getControllers(),
                fallbackId: originalGetDefaultControllerId()
            }) || originalGetDefaultController?.() || null;
        };

        if (originalGetCurrentUser) {
            root.getCurrentUser = function getAuthenticatedOperationalUser() {
                const authentication = currentAuthentication();
                if (authentication?.authorization?.role !== 'controller') {
                    return originalGetCurrentUser();
                }
                const controller = root.getDefaultControlador();
                return {
                    name: normalizeText(controller?.name)
                        || normalizeText(authentication.user?.displayName)
                        || normalizeText(authentication.user?.email)
                        || 'Controlador',
                    role: normalizeText(authentication.authorization.profile?.label) || 'Controlador'
                };
            };
        }

        if (originalGetAlerts) {
            root.getAlerts = function getControllerScopedAlerts() {
                const alerts = originalGetAlerts();
                const authentication = currentAuthentication();
                if (authentication?.authorization?.role !== 'controller') return alerts;
                return filterControllerAlerts({
                    alerts,
                    schools: getSchools(),
                    controllerId: root.getDefaultControladorId()
                });
            };
        }

        root.__radarControllerSessionContextInstalled = true;
        return true;
    }

    return Object.freeze({
        resolveControllerId,
        resolveControllerRecord,
        filterControllerAlerts,
        install
    });
}));