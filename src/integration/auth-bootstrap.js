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

    function emitAuthRequired(root, message) {
        if (typeof root?.dispatchEvent !== 'function' || typeof root?.CustomEvent !== 'function') return;
        root.dispatchEvent(new root.CustomEvent('radar:auth-required', {
            detail: { message: message || 'Entre para acessar o RADAR PDDE.' }
        }));
    }

    function publicAuthentication(state) {
        if (state?.status !== 'authenticated' || !state.user || !state.authorization) return null;
        return {
            user: structuredClone(state.user),
            authorization: structuredClone(state.authorization)
        };
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

        return {
            client,
            sessionService,
            authentication: publicAuthentication(state)
        };
    }

    return Object.freeze({
        emitAuthRequired,
        publicAuthentication,
        prepareAuthenticatedClient
    });
}));
