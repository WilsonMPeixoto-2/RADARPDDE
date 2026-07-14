(function bootstrapRadarConfiguration(root, factory) {
    'use strict';

    const api = factory();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (!root) return;

    root.RadarRuntimeConfig = Object.freeze(api);
    root.RADAR_PDDE_CONFIG = api.createRuntimeConfig({
        dataMode: api.DATA_MODES.LOCAL,
        productionActivationApproved: false,
        features: {
            supabaseRepositoryEnabled: false,
            legacyAppBridgeEnabled: false
        },
        supabase: {
            url: '',
            publishableKey: ''
        }
    });

    if (typeof document === 'undefined') return;

    // Carrega extensões isoladas sem modificar o arquivo principal da aplicação.
    (function loadRadarExtensions() {
        function loadStylesheet(href) {
            if (document.querySelector(`link[data-radar-extension="${href}"]`)) return;
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.dataset.radarExtension = href;
            document.head.appendChild(link);
        }

        function loadScript(src, async) {
            if (document.querySelector(`script[data-radar-extension="${src}"]`)) return;
            const script = document.createElement('script');
            script.src = src;
            script.async = async;
            script.dataset.radarExtension = src;
            document.head.appendChild(script);
        }

        loadStylesheet('src/styles/mobile-responsive.css');
        loadStylesheet('src/styles/mobile-rendering-hotfix.css');
        loadStylesheet('src/styles/task-9-pendencias.css');
        loadStylesheet('src/styles/task-9-cross-view.css');
        loadStylesheet('src/styles/task-10-11-pendency-actions.css');
        loadStylesheet('src/styles/task-12-13-retificacoes.css');
        loadStylesheet('src/styles/cycle-b-carteira.css');
        loadStylesheet('src/styles/cycle-b-dashboard.css');
        loadStylesheet('src/styles/cycle-b-dashboard-final.css');

        // Infraestrutura de persistência preparada, carregada passivamente.
        loadScript('src/data/repository-contract.js', false);
        loadScript('src/data/local-storage-repository.js', false);
        loadScript('src/data/supabase-repository.js', false);
        loadScript('src/data/repository-factory.js', false);
        loadScript('src/data/snapshot-tools.js', false);
        loadScript('src/data/legacy-state-adapter.js', false);
        loadScript('src/data/state-bridge.js', false);
        loadScript('src/data/state-bridge-metadata.js', false);

        loadScript('src/domain/pendencias-view-model.js', false);
        loadScript('src/domain/operational-projection.js', false);
        loadScript('src/domain/retificacoes.js', false);
        loadScript('src/integration/mobile-navigation.js', false);
        loadScript('src/integration/modal-accessibility.js', false);
        loadScript('src/integration/task-9-pendencias-page.js', false);
        loadScript('src/integration/task-9-focus-bridge.js', false);
        loadScript('src/integration/task-9-cross-view.js', false);
        loadScript('src/integration/task-10-11-pendency-actions.js', false);
        loadScript('src/integration/task-12-13-retificacoes.js', false);
        loadScript('src/integration/cycle-b-carteira.js', false);
        loadScript('src/integration/cycle-b-dashboard.js', false);
        loadScript('src/integration/cycle-b-dashboard-result.js', false);
        loadScript('src/integration/task-10-alerts-competence.js', false);
        loadScript('src/integration/exercise-management.js', false);
        loadScript('src/integration/exercise-early-init.js', false);
        loadScript('src/integration/load-excel-export.js', true);
    }());
}(typeof window !== 'undefined' ? window : globalThis, function createRadarRuntimeConfigApi() {
    'use strict';

    const DATA_MODES = Object.freeze({
        LOCAL: 'local',
        SUPABASE_PREVIEW: 'supabase-preview',
        SUPABASE_PRODUCTION: 'supabase-production'
    });

    const ALLOWED_MODES = new Set(Object.values(DATA_MODES));

    function decodeJwtPayload(value) {
        const parts = String(value || '').trim().split('.');
        if (parts.length < 2 || !parts[1]) return null;

        try {
            const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
            let jsonText;

            if (typeof atob === 'function') {
                jsonText = atob(padded);
            } else if (typeof Buffer !== 'undefined') {
                jsonText = Buffer.from(padded, 'base64').toString('utf8');
            } else {
                return null;
            }

            const payload = JSON.parse(jsonText);
            return payload && typeof payload === 'object' ? payload : null;
        } catch (error) {
            return null;
        }
    }

    function isForbiddenSupabaseKey(value) {
        const raw = String(value || '').trim();
        const normalized = raw.toLowerCase();
        const jwtPayload = decodeJwtPayload(raw);
        const jwtRole = String(jwtPayload?.role || '').trim().toLowerCase();

        return normalized.startsWith('sb_secret_')
            || normalized === 'service_role'
            || normalized.includes('"role":"service_role"')
            || normalized.includes("'role':'service_role'")
            || jwtRole === 'service_role';
    }

    function isValidSupabaseUrl(value) {
        if (!value) return false;
        try {
            const url = new URL(value);
            return ['https:', 'http:'].includes(url.protocol)
                && (url.hostname.endsWith('.supabase.co')
                    || ['localhost', '127.0.0.1'].includes(url.hostname));
        } catch (error) {
            return false;
        }
    }

    function isValidPublishableKey(value) {
        const key = String(value || '').trim();
        return key.startsWith('sb_publishable_') || key.startsWith('eyJ');
    }

    function deepFreeze(value) {
        if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
        Object.freeze(value);
        Object.values(value).forEach(deepFreeze);
        return value;
    }

    function createRuntimeConfig(input = {}) {
        const diagnostics = [];
        const requestedMode = ALLOWED_MODES.has(input.dataMode)
            ? input.dataMode
            : DATA_MODES.LOCAL;
        let dataMode = requestedMode;

        if (requestedMode === DATA_MODES.SUPABASE_PRODUCTION
            && input.productionActivationApproved !== true) {
            dataMode = DATA_MODES.LOCAL;
            diagnostics.push('Modo Supabase de produção bloqueado: falta autorização explícita.');
        }

        const rawUrl = String(input.supabase?.url || '').trim();
        const rawKey = String(input.supabase?.publishableKey || '').trim();

        if (isForbiddenSupabaseKey(rawKey)) {
            throw new Error('Chave secreta do Supabase não pode ser usada no frontend.');
        }

        const requestedRepository = input.features?.supabaseRepositoryEnabled === true;
        const requestedLegacyBridge = input.features?.legacyAppBridgeEnabled === true;
        const isLocal = dataMode === DATA_MODES.LOCAL;
        const validCredentials = isValidSupabaseUrl(rawUrl) && isValidPublishableKey(rawKey);
        const connectionEnabled = !isLocal
            && requestedRepository
            && requestedLegacyBridge
            && validCredentials;

        if (!isLocal && !validCredentials) {
            diagnostics.push('Conexão Supabase bloqueada: URL ou chave publicável inválida.');
        }
        if (!isLocal && (!requestedRepository || !requestedLegacyBridge)) {
            diagnostics.push('Conexão Supabase bloqueada: dupla autorização de feature flags incompleta.');
        }

        const config = {
            configVersion: 'supabase-readiness-v1',
            dataMode,
            activeRepository: connectionEnabled ? 'supabase' : 'local',
            productionActivationApproved: dataMode === DATA_MODES.SUPABASE_PRODUCTION
                && input.productionActivationApproved === true,
            features: {
                supabaseRepositoryEnabled: isLocal ? false : requestedRepository,
                legacyAppBridgeEnabled: isLocal ? false : requestedLegacyBridge
            },
            supabase: {
                url: connectionEnabled ? rawUrl : '',
                publishableKey: connectionEnabled ? rawKey : '',
                connectionEnabled
            },
            diagnostics
        };

        return deepFreeze(config);
    }

    return Object.freeze({
        DATA_MODES,
        createRuntimeConfig,
        isForbiddenSupabaseKey,
        isValidSupabaseUrl,
        isValidPublishableKey
    });
}));
