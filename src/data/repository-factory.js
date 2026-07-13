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
            && runtimeConfig.features?.legacyAppBridgeEnabled === true
            && runtimeConfig.supabase?.connectionEnabled === true;
    }

    function createRepository(runtimeConfig = {}, dependencies = {}) {
        const localRepository = dependencies.localRepository
            || new localApi.LocalStorageRepository({
                storage: dependencies.storage,
                keyPrefix: dependencies.keyPrefix,
                schemaVersion: dependencies.schemaVersion
            });

        if (!isSupabaseExplicitlyEnabled(runtimeConfig)) {
            return localRepository;
        }

        return new supabaseApi.SupabaseRepository({
            client: dependencies.supabaseClient,
            tableMap: dependencies.tableMap
        });
    }

    return Object.freeze({
        createRepository,
        isSupabaseExplicitlyEnabled
    });
}));
