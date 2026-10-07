(function installRadarOperationalRealtimeInvalidation(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (!root) return;
    root.RadarOperationalRealtimeInvalidation = Object.freeze(api);

    const tryInstall = () => api.install(root);
    if (tryInstall()) return;

    const retry = () => {
        if (!tryInstall()) return;
        root.removeEventListener?.('radar:application-services-ready', retry);
        root.removeEventListener?.('radar:auth-resolved', retry);
    };
    root.addEventListener?.('radar:application-services-ready', retry);
    root.addEventListener?.('radar:auth-resolved', retry);
}(typeof window !== 'undefined' ? window : globalThis, function createOperationalRealtimeInvalidationApi() {
    'use strict';

    const TOPIC = 'radar:operational';
    const EVENT = 'operational-change';
    const DEFAULT_DEBOUNCE_MS = 2000;
    const SCHOOL_AGGREGATE_VIEWS = new Set(['dashboard', 'escolas', 'competencias']);
    const SCHOOL_SCOPED_ENTITIES = new Set([
        'verifications',
        'registered_invoices',
        'pendencies',
        'pendency_attempts',
        'assets'
    ]);

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function decideInvalidationAction({ route = null, payload = null } = {}) {
        const entity = text(payload?.entity);
        const schoolId = text(payload?.schoolId);
        if (!schoolId || !SCHOOL_SCOPED_ENTITIES.has(entity)) return 'global';
        // A superfície agregada é uma projeção da memória já carregada. A fatia
        // completa da escola atualiza essa projeção pelo refresh compartilhado.
        if (SCHOOL_AGGREGATE_VIEWS.has(text(route?.view))) return 'school';
        if (text(route?.view) !== 'prontuario') return 'global';
        const currentSchoolId = text(route?.param);
        if (!currentSchoolId) return 'global';
        return currentSchoolId === schoolId ? 'school' : 'defer';
    }

    function currentRoute(root) {
        try {
            return root?.RadarNavigationHistory?.currentRoute?.(root) || null;
        } catch (_error) {
            return null;
        }
    }

    function authenticated(root) {
        return Boolean(root?.RadarAuthContext?.user || root?.RadarAuthContext?.authorization);
    }

    function emitStatus(root, status, error = null) {
        if (typeof root?.dispatchEvent !== 'function' || typeof root?.CustomEvent !== 'function') return;
        root.dispatchEvent(new root.CustomEvent('radar:realtime-sync-status', {
            detail: Object.freeze({
                status: String(status || ''),
                error: error ? String(error?.message || error) : null
            })
        }));
    }

    function createController(root, options = {}) {
        const client = options.client;
        const refreshController = options.refreshController;
        const debounceMs = Number.isFinite(options.debounceMs)
            ? Math.max(0, options.debounceMs)
            : DEFAULT_DEBOUNCE_MS;
        let channel = null;
        let timer = null;
        let scheduledSchoolId = '';
        let everSubscribed = false;
        let destroyed = false;
        let startPromise = null;
        let lastStatus = 'IDLE';
        let dirtyGeneration = 0;
        const dirtySchools = new Map();
        const reconcilingSchools = new Map();
        const metrics = {
            broadcastsReceived: 0,
            coalescedBroadcasts: 0,
            refreshesScheduled: 0,
            refreshAttempts: 0,
            refreshSucceeded: 0,
            refreshFailed: 0,
            retriesScheduled: 0,
            reconnectRefreshes: 0,
            schoolRefreshesScheduled: 0,
            deferredSchoolInvalidations: 0,
            deferredSchoolReconciliations: 0,
            lastBroadcastAt: null,
            lastRefreshAt: null,
            byEntity: Object.create(null)
        };

        function metricsSnapshot() {
            return Object.freeze({
                ...metrics,
                dirtySchoolIds: Object.freeze([...dirtySchools.keys()].sort()),
                byEntity: Object.freeze({ ...metrics.byEntity })
            });
        }

        function markSchoolDirty(schoolId) {
            const normalized = text(schoolId);
            if (!normalized) return 0;
            dirtyGeneration += 1;
            dirtySchools.set(normalized, dirtyGeneration);
            metrics.deferredSchoolInvalidations += 1;
            return dirtyGeneration;
        }

        function captureDirtySnapshot(schoolId = '') {
            const normalized = text(schoolId);
            if (!normalized) return new Map(dirtySchools);
            const generation = dirtySchools.get(normalized);
            return generation == null ? new Map() : new Map([[normalized, generation]]);
        }

        function beginReconciliation(snapshot) {
            for (const [schoolId, generation] of snapshot.entries()) {
                reconcilingSchools.set(schoolId, generation);
            }
        }

        function endReconciliation(snapshot) {
            for (const [schoolId, generation] of snapshot.entries()) {
                if (reconcilingSchools.get(schoolId) === generation) {
                    reconcilingSchools.delete(schoolId);
                }
            }
        }

        function acknowledgeDirty(snapshot) {
            for (const [schoolId, generation] of snapshot.entries()) {
                if (dirtySchools.get(schoolId) === generation) {
                    dirtySchools.delete(schoolId);
                }
            }
        }

        function resultIsAuthoritative(result) {
            return result?.ok !== false
                && result?.stale !== true
                && result?.skipped !== true
                && result?.applied !== false;
        }

        function clearScheduledRefresh() {
            if (timer == null) return;
            root.clearTimeout?.(timer);
            timer = null;
        }

        function scheduleRefresh(reason = 'realtime', options = {}) {
            if (destroyed) return false;
            let schoolId = text(options.schoolId);
            // Um debounce agrupa todas as invalidações ainda não executadas.
            // Global domina escola; duas escolas exigem a cobertura global.
            if (timer != null && scheduledSchoolId !== schoolId) schoolId = '';
            if (timer != null && /^realtime(?:-school)?$/.test(reason)) metrics.coalescedBroadcasts += 1;
            clearScheduledRefresh();
            scheduledSchoolId = schoolId;
            metrics.refreshesScheduled += 1;
            if (schoolId) metrics.schoolRefreshesScheduled += 1;
            if (/-retry$/.test(reason)) metrics.retriesScheduled += 1;
            if (reason === 'realtime-reconnect') metrics.reconnectRefreshes += 1;
            const schedule = typeof root.setTimeout === 'function'
                ? root.setTimeout.bind(root)
                : setTimeout;
            timer = schedule(() => {
                timer = null;
                metrics.refreshAttempts += 1;
                const dirtyAtAttempt = captureDirtySnapshot(schoolId);
                beginReconciliation(dirtyAtAttempt);
                const runRefresh = schoolId && typeof refreshController.refreshSchool === 'function'
                    ? () => refreshController.refreshSchool(schoolId, reason, { force: true })
                    : () => refreshController.refresh(reason, { force: true });
                void Promise.resolve()
                    .then(runRefresh)
                    .then(result => {
                        metrics.lastRefreshAt = new Date().toISOString();
                        const needsRetry = result?.ok === false || result?.stale === true;
                        if (needsRetry) metrics.refreshFailed += 1;
                        else metrics.refreshSucceeded += 1;
                        if (resultIsAuthoritative(result)) acknowledgeDirty(dirtyAtAttempt);
                        if (!needsRetry || /-retry$/.test(reason)) return;
                        scheduleRefresh(
                            schoolId ? 'realtime-school-retry' : 'realtime-retry',
                            schoolId ? { schoolId } : {}
                        );
                    })
                    .catch(error => {
                        metrics.lastRefreshAt = new Date().toISOString();
                        metrics.refreshFailed += 1;
                        root.console?.warn?.('Falha ao reler contexto após invalidação Realtime.', error);
                        if (!/-retry$/.test(reason)) {
                            scheduleRefresh(
                                schoolId ? 'realtime-school-retry' : 'realtime-retry',
                                schoolId ? { schoolId } : {}
                            );
                        }
                    })
                    .finally(() => endReconciliation(dirtyAtAttempt));
            }, debounceMs);
            return true;
        }

        function handleBroadcast(message = {}) {
            metrics.broadcastsReceived += 1;
            metrics.lastBroadcastAt = new Date().toISOString();
            const payload = message?.payload || message || {};
            const entity = String(payload.entity || 'unknown');
            metrics.byEntity[entity] = (metrics.byEntity[entity] || 0) + 1;
            const action = decideInvalidationAction({ route: currentRoute(root), payload });
            if (action === 'defer') {
                markSchoolDirty(payload.schoolId);
                return;
            }
            if (action === 'school' && typeof refreshController.refreshSchool === 'function') {
                scheduleRefresh('realtime-school', { schoolId: payload.schoolId });
                return;
            }
            scheduleRefresh('realtime');
        }

        function handleNavigationCommitted(event) {
            if (!dirtySchools.size) return;
            const route = event?.detail?.route || currentRoute(root);
            if (!route) return;
            if (text(route.view) === 'prontuario') {
                const schoolId = text(route.param);
                const generation = dirtySchools.get(schoolId);
                if (generation == null) return;
                if (reconcilingSchools.get(schoolId) === generation) return;
                metrics.deferredSchoolReconciliations += 1;
                scheduleRefresh('realtime-deferred-navigation', { schoolId });
                return;
            }
            const uncoveredSchoolIds = [...dirtySchools].filter(([schoolId, generation]) => (
                reconcilingSchools.get(schoolId) !== generation
            )).map(([schoolId]) => schoolId);
            if (!uncoveredSchoolIds.length) return;
            metrics.deferredSchoolReconciliations += 1;
            const schoolId = SCHOOL_AGGREGATE_VIEWS.has(text(route.view))
                && uncoveredSchoolIds.length === 1 ? uncoveredSchoolIds[0] : '';
            scheduleRefresh('realtime-deferred-navigation', schoolId ? { schoolId } : {});
        }

        function handleStatus(status, error) {
            lastStatus = String(status || '');
            emitStatus(root, lastStatus, error || null);
            if (lastStatus === 'SUBSCRIBED') {
                const reconnect = everSubscribed;
                everSubscribed = true;
                if (reconnect) scheduleRefresh('realtime-reconnect');
                return;
            }
            if (lastStatus === 'CHANNEL_ERROR' || lastStatus === 'TIMED_OUT') {
                root.console?.warn?.('Canal de sincronização operacional indisponível.', error || lastStatus);
            }
        }

        root.addEventListener?.('radar:navigation-committed', handleNavigationCommitted);

        function start() {
            if (destroyed || channel) return Promise.resolve(Boolean(channel));
            if (startPromise) return startPromise;
            if (!authenticated(root)) return Promise.resolve(false);
            if (!client || typeof client.channel !== 'function') return Promise.resolve(false);
            if (!refreshController || typeof refreshController.refresh !== 'function') {
                return Promise.resolve(false);
            }

            let run = null;
            run = (async () => {
                try {
                    if (typeof client.realtime?.setAuth === 'function') {
                        await client.realtime.setAuth();
                    }
                    if (destroyed) return false;

                    channel = client.channel(TOPIC, {
                        config: {
                            private: true,
                            broadcast: { self: false }
                        }
                    });
                    if (!channel || typeof channel.on !== 'function' || typeof channel.subscribe !== 'function') {
                        channel = null;
                        handleStatus(
                            'UNAVAILABLE',
                            new Error('Sincronização operacional em tempo real indisponível.')
                        );
                        return false;
                    }

                    channel
                        .on('broadcast', { event: EVENT }, handleBroadcast)
                        .subscribe(handleStatus);
                    return true;
                } catch (error) {
                    channel = null;
                    handleStatus('CHANNEL_ERROR', error);
                    throw error;
                }
            })().finally(() => {
                if (startPromise === run) startPromise = null;
            });
            startPromise = run;
            return run;
        }

        async function stop() {
            destroyed = true;
            clearScheduledRefresh();
            root.removeEventListener?.('radar:navigation-committed', handleNavigationCommitted);
            const current = channel;
            channel = null;
            if (!current) return true;
            if (typeof client.removeChannel === 'function') {
                await client.removeChannel(current);
                return true;
            }
            if (typeof current.unsubscribe === 'function') {
                await current.unsubscribe();
            }
            return true;
        }

        return Object.freeze({
            start,
            stop,
            scheduleRefresh,
            getStatus: () => lastStatus,
            getChannel: () => channel,
            getMetrics: metricsSnapshot
        });
    }

    function install(root = globalThis) {
        if (!root?.document) return false;
        if (root.__radarOperationalRealtimeInvalidationInstalled === true) return true;
        if (!authenticated(root)) return false;

        const client = root.RadarSessionContext?.service?.client;
        const refreshController = root.RadarOperationalContextRefreshController;
        if (!client || !refreshController) return false;

        const controller = createController(root, { client, refreshController });
        root.RadarOperationalRealtimeInvalidationController = controller;
        root.__radarOperationalRealtimeInvalidationInstalled = true;

        const attemptStart = () => {
            void controller.start().then(started => {
                if (!started) {
                    root.console?.warn?.('Sincronização operacional em tempo real indisponível.');
                }
            }).catch(error => {
                root.console?.warn?.('Sincronização operacional em tempo real falhou ao iniciar.', error);
            });
        };
        const recoverInitialConnection = () => {
            if (!authenticated(root) || controller.getChannel()) return;
            attemptStart();
        };

        root.addEventListener?.('online', recoverInitialConnection);
        root.addEventListener?.('focus', recoverInitialConnection);
        attemptStart();
        return true;
    }

    return Object.freeze({
        TOPIC,
        EVENT,
        DEFAULT_DEBOUNCE_MS,
        authenticated,
        decideInvalidationAction,
        createController,
        install
    });
}));
