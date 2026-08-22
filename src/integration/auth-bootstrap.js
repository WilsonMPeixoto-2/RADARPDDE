(function installRadarAuthBootstrap(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.RadarAuthBootstrap = Object.freeze(api);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createAuthBootstrapApi() {
    'use strict';

    const SUPABASE_CLIENT_SRC = 'vendor/supabase-client.js';
    const pendingClientLoads = typeof WeakMap === 'function' ? new WeakMap() : null;

    function emitAuthRequired(root, message) {
        if (typeof root?.dispatchEvent !== 'function' || typeof root?.CustomEvent !== 'function') return;
        root.dispatchEvent(new root.CustomEvent('radar:auth-required', {
            detail: { message: message || 'Entre para acessar o RADAR PDDE.' }
        }));
    }

    function emitAuthResolved(root, authentication) {
        if (!authentication
            || typeof root?.dispatchEvent !== 'function'
            || typeof root?.CustomEvent !== 'function') return;
        root.dispatchEvent(new root.CustomEvent('radar:auth-resolved', {
            detail: { authentication }
        }));
    }

    function publicAuthentication(state) {
        if (state?.status !== 'authenticated' || !state.user || !state.authorization) return null;
        return {
            user: structuredClone(state.user),
            authorization: structuredClone(state.authorization)
        };
    }

    function hasSupabaseClient(root) {
        return Boolean(root?.supabase && typeof root.supabase.createClient === 'function');
    }

    function ensureSupabaseClient(root = globalThis) {
        if (hasSupabaseClient(root)) return Promise.resolve(root.supabase);

        const documentRef = root?.document;
        if (!documentRef || typeof documentRef.createElement !== 'function') {
            return Promise.reject(new Error('Cliente Supabase indisponível para a conexão explicitamente ativada.'));
        }

        if (pendingClientLoads?.has(root)) return pendingClientLoads.get(root);

        const existing = typeof documentRef.querySelector === 'function'
            ? documentRef.querySelector('script[data-radar-supabase-client="true"]')
            : null;
        const script = existing || documentRef.createElement('script');

        const pending = new Promise((resolve, reject) => {
            const onLoad = () => {
                if (hasSupabaseClient(root)) {
                    resolve(root.supabase);
                    return;
                }
                reject(new Error('O bundle local do cliente Supabase foi carregado, mas não disponibilizou createClient.'));
            };
            const onError = () => reject(new Error('Não foi possível carregar o cliente Supabase local.'));

            if (typeof script.addEventListener === 'function') {
                script.addEventListener('load', onLoad, { once: true });
                script.addEventListener('error', onError, { once: true });
            } else {
                script.onload = onLoad;
                script.onerror = onError;
            }

            if (existing) return;

            script.src = SUPABASE_CLIENT_SRC;
            script.async = true;
            script.dataset.radarSupabaseClient = 'true';
            const parent = documentRef.head || documentRef.documentElement || documentRef.body;
            if (!parent || typeof parent.appendChild !== 'function') {
                reject(new Error('Documento indisponível para carregar o cliente Supabase local.'));
                return;
            }
            parent.appendChild(script);
        });

        if (pendingClientLoads) {
            pendingClientLoads.set(root, pending);
            pending.finally(() => pendingClientLoads.delete(root)).catch(() => null);
        }
        return pending;
    }

    async function prepareAuthenticatedClient(options = {}) {
        const runtimeConfig = options.runtimeConfig || {};
        const root = options.root || globalThis;
        if (runtimeConfig.supabase?.connectionEnabled !== true) {
            return {
                client: null,
                sessionService: null,
                authentication: null
            };
        }

        await ensureSupabaseClient(root);
        if (!root.supabase || typeof root.supabase.createClient !== 'function') {
            throw new Error('Cliente Supabase indisponível para a conexão explicitamente ativada.');
        }
        if (!root.RadarSessionService?.SessionService) {
            throw new Error('Serviço de sessão indisponível para a conexão explicitamente ativada.');
        }

        const client = root.supabase.createClient(
            runtimeConfig.supabase.url,
            runtimeConfig.supabase.publishableKey,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );
        const sessionService = new root.RadarSessionService.SessionService({ client });
        root.RadarSessionContext = Object.freeze({ service: sessionService });
        sessionService.onChange(state => {
            if (state.status !== 'signed_out') return;
            root.RadarAuthContext = null;
            emitAuthRequired(root, 'Sua sessão foi encerrada. Entre novamente para continuar.');
        });

        let state;
        try {
            state = await sessionService.initialize();
        } catch (error) {
            await sessionService.signOut().catch(() => null);
            emitAuthRequired(root, error?.message || 'A sessão atual não pôde ser validada.');
            state = await sessionService.waitForAuthenticated();
        }

        if (state.status !== 'authenticated') {
            emitAuthRequired(root, 'Entre para acessar o RADAR PDDE.');
            state = await sessionService.waitForAuthenticated();
        }

        const authentication = publicAuthentication(state);
        emitAuthResolved(root, authentication);
        return {
            client,
            sessionService,
            authentication
        };
    }

    return Object.freeze({
        emitAuthRequired,
        emitAuthResolved,
        publicAuthentication,
        ensureSupabaseClient,
        prepareAuthenticatedClient
    });
}));
