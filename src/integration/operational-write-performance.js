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
        'directory:deactivate-program'
    ]);

    const COMMIT_AUTHORITATIVE_COMMANDS = new Set([
        'pendency:reanalyze',
        'school:save'
    ]);

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function decorateCommand(command = {}) {
        if (!command || typeof command !== 'object' || Array.isArray(command)) return command;
        if (command.remoteResultIsAuthoritative === true
            || command.remoteCommitIsAuthoritative === true
            || typeof command.persist !== 'function') {
            return command;
        }

        const name = text(command.name);
        if (RESULT_AUTHORITATIVE_COMMANDS.has(name)) {
            return { ...command, remoteResultIsAuthoritative: true };
        }
        if (COMMIT_AUTHORITATIVE_COMMANDS.has(name)) {
            return { ...command, remoteCommitIsAuthoritative: true };
        }
        return command;
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
        decorateCommand,
        collectDataServices,
        patchDataService,
        install
    });
}));
