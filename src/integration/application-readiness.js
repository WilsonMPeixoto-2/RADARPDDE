(function installRadarApplicationReadiness(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (!root || root.RadarApplicationReadiness) return;

    const coordinator = api.createReadinessCoordinator({ root });
    root.RadarApplicationReadiness = Object.freeze(coordinator);

    const critical = ['authentication', 'data', 'application-services', 'competence', 'navigation'];
    critical.forEach(name => coordinator.define(name, { criticality: 'critical' }));
    coordinator.define('product-extensions', { criticality: 'critical' });

    const remoteEnabled = root.RADAR_PDDE_CONFIG?.supabase?.connectionEnabled === true;
    if (!remoteEnabled) coordinator.markReady('authentication');

    root.addEventListener?.('radar:auth-required', () => {
        if (root.RADAR_PDDE_CONFIG?.supabase?.connectionEnabled === true) {
            coordinator.markPending('authentication');
        }
    });
    root.addEventListener?.('radar:auth-resolved', () => coordinator.markReady('authentication'));
    root.addEventListener?.('radar:application-services-ready', () => coordinator.markReady('application-services'));
    root.addEventListener?.('radar:competence-change', () => {
        if (root.RadarCompetenceContext?.isInitialized?.() === true) {
            coordinator.markReady('competence');
        }
    });

    const existingDataContext = root.RadarDataContext;
    if (existingDataContext?.ready === true) {
        coordinator.markReady('data');
    } else {
        let dataContextValue = existingDataContext;
        const descriptor = Object.getOwnPropertyDescriptor(root, 'RadarDataContext');
        if (!descriptor || descriptor.configurable !== false) {
            Object.defineProperty(root, 'RadarDataContext', {
                configurable: true,
                enumerable: descriptor?.enumerable !== false,
                get() {
                    return dataContextValue;
                },
                set(value) {
                    dataContextValue = value;
                    if (value?.ready === true) coordinator.markReady('data');
                    Object.defineProperty(root, 'RadarDataContext', {
                        configurable: true,
                        enumerable: true,
                        writable: true,
                        value
                    });
                }
            });
        }
    }
}(typeof window !== 'undefined' ? window : globalThis, function createRadarApplicationReadinessApi() {
    'use strict';

    const VALID_STATUSES = new Set(['pending', 'ready', 'failed', 'degraded', 'restricted']);
    const VALID_CRITICALITY = new Set(['critical', 'restricted', 'optional']);

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function sanitizeReason(reason) {
        const value = text(reason || 'READINESS_FAILED')
            .replace(/https?:\/\/\S+/gi, '[url]')
            .replace(/[\r\n\t]+/g, ' ')
            .replace(/[^A-Za-z0-9_.:\- ]+/g, '')
            .slice(0, 160);
        return value || 'READINESS_FAILED';
    }

    function createReadinessError(capability, reason) {
        const error = new Error(`Capacidade ${capability} indisponível.`);
        error.code = 'READINESS_FAILED';
        error.capability = capability;
        error.reason = sanitizeReason(reason);
        return error;
    }

    function createReadinessCoordinator(options = {}) {
        const root = options.root || null;
        const states = new Map();
        const waiters = new Set();
        const listeners = new Set();

        function ensure(name) {
            const key = text(name);
            if (!key) throw new Error('Nome de capacidade de readiness é obrigatório.');
            if (!states.has(key)) {
                states.set(key, {
                    status: 'pending',
                    criticality: 'optional',
                    dependencies: [],
                    reason: ''
                });
            }
            return states.get(key);
        }

        function define(name, definition = {}) {
            const key = text(name);
            const current = ensure(key);
            const dependencies = [...new Set(
                (Array.isArray(definition.dependencies) ? definition.dependencies : [])
                    .map(text)
                    .filter(Boolean)
            )];
            const criticality = VALID_CRITICALITY.has(definition.criticality)
                ? definition.criticality
                : current.criticality;
            states.set(key, {
                ...current,
                criticality,
                dependencies
            });
            dependencies.forEach(ensure);
            publish(key);
            return snapshot()[key];
        }

        function stateFor(name) {
            const key = text(name);
            const value = ensure(key);
            return {
                status: value.status,
                criticality: value.criticality,
                dependencies: [...value.dependencies],
                ...(value.reason ? { reason: value.reason } : {})
            };
        }

        function snapshot() {
            const result = {};
            [...states.keys()].sort().forEach(name => {
                result[name] = Object.freeze(stateFor(name));
            });
            return Object.freeze(result);
        }

        function evaluate(waiter) {
            const names = waiter.names;
            for (const name of names) {
                const state = ensure(name);
                if (state.status === 'failed' || state.status === 'restricted') {
                    waiter.reject(createReadinessError(name, state.reason || state.status));
                    return true;
                }
                if (state.status !== 'ready') return false;
                for (const dependency of state.dependencies) {
                    const dependencyState = ensure(dependency);
                    if (dependencyState.status === 'failed' || dependencyState.status === 'restricted') {
                        waiter.reject(createReadinessError(
                            dependency,
                            dependencyState.reason || dependencyState.status
                        ));
                        return true;
                    }
                    if (dependencyState.status !== 'ready') return false;
                }
            }
            waiter.resolve(names.length === 1 ? stateFor(names[0]) : snapshot());
            return true;
        }

        function flushWaiters() {
            [...waiters].forEach(waiter => {
                if (evaluate(waiter)) waiters.delete(waiter);
            });
        }

        function publish(name) {
            const detail = Object.freeze({ capability: name, state: Object.freeze(stateFor(name)) });
            listeners.forEach(listener => {
                try {
                    listener(detail);
                } catch (_error) {
                    // Observadores de readiness nunca controlam a instalação funcional.
                }
            });
            if (root?.dispatchEvent && typeof root.CustomEvent === 'function') {
                root.dispatchEvent(new root.CustomEvent('radar:readiness-change', { detail }));
            }
            flushWaiters();
        }

        function mark(name, status, reason = '') {
            const key = text(name);
            if (!VALID_STATUSES.has(status)) throw new Error(`Status de readiness inválido: ${status}`);
            const current = ensure(key);
            states.set(key, {
                ...current,
                status,
                reason: status === 'ready' || status === 'pending' ? '' : sanitizeReason(reason)
            });
            publish(key);
            return stateFor(key);
        }

        function markPending(name) {
            return mark(name, 'pending');
        }

        function markReady(name) {
            return mark(name, 'ready');
        }

        function markFailed(name, reason) {
            return mark(name, 'failed', reason);
        }

        function markDegraded(name, reason) {
            return mark(name, 'degraded', reason);
        }

        function markRestricted(name, reason) {
            return mark(name, 'restricted', reason);
        }

        function isReady(name) {
            return ensure(name).status === 'ready';
        }

        function when(names) {
            const requested = [...new Set((Array.isArray(names) ? names : [names]).map(text).filter(Boolean))];
            if (requested.length === 0) return Promise.resolve(snapshot());
            requested.forEach(ensure);
            return new Promise((resolve, reject) => {
                const waiter = { names: requested, resolve, reject };
                if (!evaluate(waiter)) waiters.add(waiter);
            });
        }

        function subscribe(listener) {
            if (typeof listener !== 'function') return () => undefined;
            listeners.add(listener);
            return () => listeners.delete(listener);
        }

        return Object.freeze({
            define,
            markPending,
            markReady,
            markFailed,
            markDegraded,
            markRestricted,
            isReady,
            when,
            snapshot,
            subscribe
        });
    }

    return Object.freeze({
        createReadinessCoordinator,
        sanitizeReason
    });
}));