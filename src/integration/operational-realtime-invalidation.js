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
    const DEFAULT_REMOTE_MIN_INTERVAL_MS = 5000;
    const DEFAULT_OWN_RECONCILE_MS = 30000;

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function authenticated(root) {
        return Boolean(root?.RadarAuthContext?.user || root?.RadarAuthContext?.authorization);
    }

    function currentRoute(root) {
        try {
            return root?.RadarNavigationHistory?.currentRoute?.(root) || null;
        } catch (_error) {
            return null;
        }
    }

    function currentProntuarioSchoolId(root) {
        const route = currentRoute(root);
        if (text(route?.view) !== 'prontuario') return '';
        return text(route?.param);
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
        const remoteMinIntervalMs = Number.isFinite(options.remoteMinIntervalMs)
            ? Math.max(0, options.remoteMinIntervalMs)
            : DEFAULT_REMOTE_MIN_INTERVAL_MS;
        const ownReconcileMs = Number.isFinite(options.ownReconcileMs)
            ? Math.max(0, options.ownReconcileMs)
            : DEFAULT_OWN_RECONCILE_MS;
        let channel = null;
        let timer = null;
        let ownReconcileTimer = null;
        let everSubscribed = false;
        let destroyed = false;
        let startPromise = null;
        let lastStatus = 'IDLE';
        let lastSuccessfulRealtimeRefreshAt = 0;
        let dirtyGeneration = 0;
        const dirtySchools = new Map();
        const metrics = {
            broadcastsReceived: 0,
            ownBroadcastsIgnored: 0,
            ownReconciliationsScheduled: 0,
            ownReconciliationsCoalesced: 0,
            coalescedBroadcasts: 0,
            remoteRefreshesRateLimited: 0,
            refreshesScheduled: 0,
            refreshAttempts: 0,
            refreshSucceeded: 0,
            refreshFailed: 0,
            retriesScheduled: 0,
            reconnectRefreshes: 0,
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

        function clearScheduledRefresh() {
            if (timer == null) return;
            root.clearTimeout?.(timer);
            timer = null;
        }

        function clearOwnReconciliation() {
            if (ownReconcileTimer == null) return;
            root.clearTimeout?.(ownReconcileTimer);
            ownReconcileTimer = null;
        }

        function remoteIntervalRemaining(now = Date.now()) {
            const anchor = Math.max(lastSuccessfulRealtimeRefreshAt,
                Number(refreshController.getLastAttemptAt?.()) || 0,
                Number(refreshController.getLastRefreshAt?.()) || 0);
            if (remoteMinIntervalMs <= 0 || anchor <= 0) return 0;
            return Math.max(0, remoteMinIntervalMs - Math.max(0, now - anchor));
        }

        function remoteRefreshDelay() {
            return Math.max(debounceMs, remoteIntervalRemaining());
        }

        function captureDirtySchools() {
            return new Map(dirtySchools);
        }

        function acknowledgeDirtySchools(snapshot) {
            for (const [schoolId, generation] of snapshot.entries()) {
                if (dirtySchools.get(schoolId) === generation) dirtySchools.delete(schoolId);
            }
        }

        function markSchoolDirty(schoolId) {
            const normalized = text(schoolId);
            if (!normalized) return false;
            dirtyGeneration += 1;
            dirtySchools.set(normalized, dirtyGeneration);
            metrics.deferredSchoolInvalidations += 1;
            return true;
        }

        function shouldDeferSchool(payload = {}) {
            const schoolId = text(payload.schoolId);
            if (!schoolId) return false;
            const currentSchoolId = currentProntuarioSchoolId(root);
            return Boolean(currentSchoolId && currentSchoolId !== schoolId);
        }

        function routeNeedsDeferredRefresh(route = currentRoute(root)) {
            if (!dirtySchools.size || !route) return false;
            if (text(route.view) !== 'prontuario') return true;
            const schoolId = text(route.param);
            return Boolean(schoolId && dirtySchools.has(schoolId));
        }

        function scheduleRefresh(reason = 'realtime') {
            if (destroyed) return false;
            const realtimeBroadcast = reason === 'realtime';

            if (realtimeBroadcast && timer != null) {
                metrics.coalescedBroadcasts += 1;
                return true;
            }

            clearScheduledRefresh();
            metrics.refreshesScheduled += 1;
            if (reason === 'realtime-retry') metrics.retriesScheduled += 1;
            if (reason === 'realtime-reconnect') metrics.reconnectRefreshes += 1;
            const schedule = typeof root.setTimeout === 'function'
                ? root.setTimeout.bind(root)
                : setTimeout;
            const delay = realtimeBroadcast ? remoteRefreshDelay() : debounceMs;
            if (realtimeBroadcast && delay > debounceMs) {
                metrics.remoteRefreshesRateLimited += 1;
            }
            timer = schedule(() => {
                timer = null;
                if (realtimeBroadcast && remoteIntervalRemaining() > 0) {
                    scheduleRefresh(reason);
                    return;
                }
                metrics.refreshAttempts += 1;
                const dirtyAtAttempt = captureDirtySchools();
                void Promise.resolve()
                    .then(() => refreshController.refresh(reason, { force: true }))
                    .then(result => {
                        const completedAt = Date.now();
                        metrics.lastRefreshAt = new Date(completedAt).toISOString();
                        const needsRetry = result?.ok === false || result?.stale === true;
                        if (needsRetry) metrics.refreshFailed += 1;
                        else {
                            metrics.refreshSucceeded += 1;
                            lastSuccessfulRealtimeRefreshAt = completedAt;
                            acknowledgeDirtySchools(dirtyAtAttempt);
                            clearOwnReconciliation();
                        }
                        if (!needsRetry || reason === 'realtime-retry') return;
                        scheduleRefresh('realtime-retry');
                    })
                    .catch(error => {
                        metrics.lastRefreshAt = new Date().toISOString();
                        metrics.refreshFailed += 1;
                        root.console?.warn?.('Falha ao reler contexto após invalidação Realtime.', error);
                        if (reason !== 'realtime-retry') scheduleRefresh('realtime-retry');
                    });
            }, delay);
            return true;
        }

        function scheduleOwnReconciliation() {
            if (destroyed) return false;
            if (ownReconcileTimer != null) metrics.ownReconciliationsCoalesced += 1;
            clearOwnReconciliation();
            metrics.ownReconciliationsScheduled += 1;
            const schedule = typeof root.setTimeout === 'function'
                ? root.setTimeout.bind(root)
                : setTimeout;
            ownReconcileTimer = schedule(() => {
                ownReconcileTimer = null;
                scheduleRefresh('realtime-self-reconcile');
            }, ownReconcileMs);
            return true;
        }

        function isOwnBroadcast(message = {}) {
            const payload = message?.payload || message || {};
            const originUserId = text(payload.originUserId);
            const originClientInstanceId = text(payload.originClientInstanceId);
            const currentUserId = text(
                root?.RadarAuthContext?.user?.id
                || root?.RadarAuthContext?.authorization?.userId
            );
            const currentClientInstanceId = text(root?.RadarOperationalClientInstanceId);
            return Boolean(
                originUserId
                && originClientInstanceId
                && currentUserId
                && currentClientInstanceId
                && originUserId === currentUserId
                && originClientInstanceId === currentClientInstanceId
            );
        }

        function handleBroadcast(message = {}) {
            metrics.broadcastsReceived += 1;
            metrics.lastBroadcastAt = new Date().toISOString();
            const payload = message?.payload || message || {};
            const entity = String(payload.entity || 'unknown');
            metrics.byEntity[entity] = (metrics.byEntity[entity] || 0) + 1;
            if (isOwnBroadcast(message)) {
                metrics.ownBroadcastsIgnored += 1;
                scheduleOwnReconciliation();
                return;
            }
            if (shouldDeferSchool(payload)) {
                markSchoolDirty(payload.schoolId);
                return;
            }
            clearOwnReconciliation();
            scheduleRefresh('realtime');
        }

        function handleNavigationCommitted(event) {
            const route = event?.detail?.route || currentRoute(root);
            if (!routeNeedsDeferredRefresh(route)) return;
            metrics.deferredSchoolReconciliations += 1;
            clearOwnReconciliation();
            scheduleRefresh('realtime-deferred-navigation');
        }

        function handleStatus(status, error) {
            lastStatus = String(status || '');
            emitStatus(root, lastStatus, error || null);
            if (lastStatus === 'SUBSCRIBED') {
                const reconnect = everSubscribed;
                everSubscribed = true;
                if (reconnect) {
                    clearOwnReconciliation();
                    scheduleRefresh('realtime-reconnect');
                }
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
            clearOwnReconciliation();
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
        DEFAULT_REMOTE_MIN_INTERVAL_MS,
        DEFAULT_OWN_RECONCILE_MS,
        authenticated,
        currentRoute,
        currentProntuarioSchoolId,
        createController,
        install
    });
}));