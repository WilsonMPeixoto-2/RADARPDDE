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

    const ALLOWED_REFRESH_EXEMPT_ENTITIES = new Set(['administrativeLogs']);
    const REFRESH_EXEMPT_ENTITIES_BY_COMMAND = Object.freeze({
        'invoice:save': Object.freeze(['administrativeLogs']),
        'invoice:remove': Object.freeze(['administrativeLogs']),
        'configuration:create-exercise': Object.freeze(['administrativeLogs'])
    });

    function text(value) {
        return value == null ? '' : String(value).trim();
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

    function patchDataService(dataService) {
        if (!dataService || typeof dataService.execute !== 'function') return false;
        if (dataService.__radarOperationalWritePerformance === true) return true;

        const originalExecute = dataService.execute.bind(dataService);
        dataService.execute = function executeWithOperationalWritePolicy(command = {}) {
            return originalExecute(decorateCommand(command));
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
        dataServices.forEach(patchDataService);
        return true;
    }

    return Object.freeze({
        RESULT_AUTHORITATIVE_COMMANDS,
        COMMIT_AUTHORITATIVE_COMMANDS,
        ALLOWED_REFRESH_EXEMPT_ENTITIES,
        REFRESH_EXEMPT_ENTITIES_BY_COMMAND,
        sanitizeRefreshExemptEntities,
        decorateCommand,
        collectDataServices,
        patchDataService,
        install
    });
}));
