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
    const DEFAULT_DEBOUNCE_MS = 250;

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
        let everSubscribed = false;
        let destroyed = false;
        let lastStatus = 'IDLE';
        const metrics = {
            broadcastsReceived: 0,
            coalescedBroadcasts: 0,
            refreshesScheduled: 0,
            refreshAttempts: 0,
            refreshSucceeded: 0,
            refreshFailed: 0,
            retriesScheduled: 0,
            reconnectRefreshes: 0,
            lastBroadcastAt: null,
            lastRefreshAt: null,
            byEntity: Object.create(null)
        };

        function metricsSnapshot() {
            return Object.freeze({
                ...metrics,
                byEntity: Object.freeze({ ...metrics.byEntity })
            });
        }

        function clearScheduledRefresh() {
            if (timer == null) return;
            root.clearTimeout?.(timer);
            timer = null;
        }

        function scheduleRefresh(reason = 'realtime') {
            if (destroyed) return false;
            if (timer != null) metrics.coalescedBroadcasts += 1;
            clearScheduledRefresh();
            metrics.refreshesScheduled += 1;
            if (reason === 'realtime-retry') metrics.retriesScheduled += 1;
            if (reason === 'realtime-reconnect') metrics.reconnectRefreshes += 1;
            const schedule = typeof root.setTimeout === 'function'
                ? root.setTimeout.bind(root)
                : setTimeout;
            timer = schedule(() => {
                timer = null;
                metrics.refreshAttempts += 1;
                void Promise.resolve()
                    .then(() => refreshController.refresh(reason, { force: true }))
                    .then(result => {
                        metrics.lastRefreshAt = new Date().toISOString();
                        const needsRetry = result?.ok === false || result?.stale === true;
                        if (needsRetry) metrics.refreshFailed += 1;
                        else metrics.refreshSucceeded += 1;
                        if (!needsRetry || reason === 'realtime-retry') return;
                        scheduleRefresh('realtime-retry');
                    })
                    .catch(error => {
                        metrics.lastRefreshAt = new Date().toISOString();
                        metrics.refreshFailed += 1;
                        root.console?.warn?.('Falha ao reler contexto após invalidação Realtime.', error);
                        if (reason !== 'realtime-retry') scheduleRefresh('realtime-retry');
                    });
            }, debounceMs);
            return true;
        }

        function handleBroadcast(message = {}) {
            metrics.broadcastsReceived += 1;
            metrics.lastBroadcastAt = new Date().toISOString();
            const entity = String(message?.payload?.entity || message?.entity || 'unknown');
            metrics.byEntity[entity] = (metrics.byEntity[entity] || 0) + 1;
            scheduleRefresh('realtime');
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

        async function start() {
            if (destroyed || channel) return Boolean(channel);
            if (!authenticated(root)) return false;
            if (!client || typeof client.channel !== 'function') return false;
            if (!refreshController || typeof refreshController.refresh !== 'function') return false;

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
                return false;
            }

            channel
                .on('broadcast', { event: EVENT }, handleBroadcast)
                .subscribe(handleStatus);
            return true;
        }

        async function stop() {
            destroyed = true;
            clearScheduledRefresh();
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

        void controller.start().then(started => {
            if (!started) {
                const error = new Error('Sincronização operacional em tempo real indisponível.');
                emitStatus(root, 'UNAVAILABLE', error);
                root.console?.warn?.(error.message);
            }
        }).catch(error => {
            emitStatus(root, 'CHANNEL_ERROR', error);
            root.console?.warn?.('Sincronização operacional em tempo real falhou ao iniciar.', error);
        });
        return true;
    }

    return Object.freeze({
        TOPIC,
        EVENT,
        DEFAULT_DEBOUNCE_MS,
        authenticated,
        createController,
        install
    });
}));
