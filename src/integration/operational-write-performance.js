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
            if (!attemptInstall()) {
                root.addEventListener?.('radar:application-services-ready', attemptInstall, { once: true });
            }
        }
    }
}(typeof window !== 'undefined' ? window : globalThis, function createOperationalWritePerformanceApi() {
    'use strict';

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

    function markTrace(root, id, phase) {
        if (id == null) return false;
        try {
            return diagnosticsApi(root)?.mark?.(root, id, phase) === true;
        } catch (_error) {
            return false;
        }
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
        dataService.execute = function executeWithOperationalWriteTracing(command = {}) {
            const traceId = activeTrace(root);
            if (traceId == null || typeof command?.persist !== 'function') {
                return originalExecute(command);
            }

            const originalPersist = command.persist;
            const persistThis = command;
            const traced = {
                ...command,
                persist: async function tracedOperationalPersist(...args) {
                    markTrace(root, traceId, 'rpcStart');
                    try {
                        return await originalPersist.apply(persistThis, args);
                    } finally {
                        markTrace(root, traceId, 'rpcEnd');
                    }
                }
            };
            return originalExecute(traced);
        };
        Object.defineProperty(dataService, '__radarOperationalWritePerformance', {
            value: true,
            configurable: false,
            enumerable: false,
            writable: false
        });
        return true;
    }

    function install(root) {
        const dataServices = collectDataServices(root);
        if (dataServices.length === 0) return false;
        return dataServices.every(service => patchDataService(service, root));
    }

    return Object.freeze({
        collectDataServices,
        patchDataService,
        install
    });
}));