(function installRadarRepositoryFactory(root, factory) {
    'use strict';

    const localApi = typeof module !== 'undefined' && module.exports
        ? require('./local-storage-repository.js')
        : root.RadarLocalStorageRepository;
    const supabaseApi = typeof module !== 'undefined' && module.exports
        ? require('./supabase-repository.js')
        : root.RadarSupabaseRepository;
    const api = factory(localApi, supabaseApi);

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarRepositoryFactory = Object.freeze(api);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createRepositoryFactoryApi(localApi, supabaseApi) {
    'use strict';

    if (!localApi || !supabaseApi) {
        throw new Error('Os adaptadores local e Supabase devem ser carregados antes da factory.');
    }

    function isSupabaseExplicitlyEnabled(runtimeConfig = {}) {
        return runtimeConfig.dataMode !== 'local'
            && runtimeConfig.features?.supabaseRepositoryEnabled === true
            && runtimeConfig.supabase?.connectionEnabled === true;
    }

    function isProductionEnvironment(runtimeConfig = {}) {
        return String(runtimeConfig.environment || '').trim().toLowerCase() === 'production';
    }

    function assertProductionRepository(runtimeConfig = {}) {
        if (!isProductionEnvironment(runtimeConfig)) return true;
        if (isSupabaseExplicitlyEnabled(runtimeConfig)
            && runtimeConfig.dataMode === 'supabase-production'
            && runtimeConfig.productionActivationApproved === true) {
            return true;
        }

        const error = new Error('O RADAR PDDE está temporariamente indisponível. A conexão institucional não pôde ser validada.');
        error.code = 'PRODUCTION_REPOSITORY_UNAVAILABLE';
        throw error;
    }

    function createLocalRepository(dependencies = {}) {
        return dependencies.localRepository
            || new localApi.LocalStorageRepository({
                storage: dependencies.storage,
                keyPrefix: dependencies.keyPrefix,
                schemaVersion: dependencies.schemaVersion
            });
    }

    function createRepository(runtimeConfig = {}, dependencies = {}) {
        assertProductionRepository(runtimeConfig);

        if (!isSupabaseExplicitlyEnabled(runtimeConfig)) {
            return createLocalRepository(dependencies);
        }

        return new supabaseApi.SupabaseRepository({
            client: dependencies.supabaseClient,
            tableMap: dependencies.tableMap
        });
    }

    return Object.freeze({
        createRepository,
        createLocalRepository,
        isProductionEnvironment,
        isSupabaseExplicitlyEnabled,
        assertProductionRepository
    });
}));
