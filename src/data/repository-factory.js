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

    const ADMINISTRATIVE_LOG_ENTITY = 'administrativeLogs';
    const DEFAULT_ADMINISTRATIVE_LOG_PAGE_SIZE = 100;
    const MAX_ADMINISTRATIVE_LOG_PAGE_SIZE = 200;
    const OPERATIONAL_BOOTSTRAP_SENTINELS = Object.freeze([
        'appConfig',
        'schools',
        'verifications',
        'registeredInvoices',
        ADMINISTRATIVE_LOG_ENTITY
    ]);

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

    function isOperationalBootstrapEntitySet(entities) {
        if (!Array.isArray(entities)) return false;
        const selected = new Set(entities.map(String));
        return OPERATIONAL_BOOTSTRAP_SENTINELS.every(entity => selected.has(entity));
    }

    function filterOperationalBootstrapEntities(entities) {
        if (!Array.isArray(entities) || !isOperationalBootstrapEntitySet(entities)) return entities;
        return entities.filter(entity => String(entity) !== ADMINISTRATIVE_LOG_ENTITY);
    }

    function administrativeLogPageSize(value) {
        const requested = Number.isInteger(value) && value > 0
            ? value
            : DEFAULT_ADMINISTRATIVE_LOG_PAGE_SIZE;
        return Math.min(requested, MAX_ADMINISTRATIVE_LOG_PAGE_SIZE);
    }

    function administrativeLogCursor(value) {
        if (!value || typeof value !== 'object') return null;
        const eventAt = String(value.eventAt || '').trim();
        const id = String(value.id || '').trim();
        if (!eventAt || !id) return null;
        if (Number.isNaN(Date.parse(eventAt))) {
            const error = new Error('Cursor temporal inválido para leitura de registros internos.');
            error.code = 'INVALID_ADMINISTRATIVE_LOG_CURSOR';
            throw error;
        }
        if (/[(),]/.test(id)) {
            const error = new Error('Cursor de registro inválido para leitura de registros internos.');
            error.code = 'INVALID_ADMINISTRATIVE_LOG_CURSOR';
            throw error;
        }
        return { eventAt, id };
    }

    class OperationalSupabaseRepository extends supabaseApi.SupabaseRepository {
        async queryAdministrativeLogs(options = {}) {
            const pageSize = administrativeLogPageSize(options.limit);
            const cursor = administrativeLogCursor(options.cursor);
            const table = this.tableFor(ADMINISTRATIVE_LOG_ENTITY);
            let query = this.client.from(table).select('*');

            const schoolId = String(options.schoolId || '').trim();
            const actorUserId = String(options.actorUserId || '').trim();
            if (schoolId && typeof query.eq === 'function') query = query.eq('school_id', schoolId);
            if (actorUserId && typeof query.eq === 'function') query = query.eq('actor_user_id', actorUserId);

            if (cursor && typeof query.or === 'function') {
                query = query.or(
                    `event_at.lt.${cursor.eventAt},and(event_at.eq.${cursor.eventAt},id.lt.${cursor.id})`
                );
            }
            if (typeof query.order === 'function') {
                query = query.order('event_at', { ascending: false });
                query = query.order('id', { ascending: false });
            }
            if (typeof query.limit === 'function') query = query.limit(pageSize + 1);

            const received = await this.execute(
                ADMINISTRATIVE_LOG_ENTITY,
                'queryAdministrativeLogs',
                query
            );
            const hasMore = received.length > pageSize;
            const records = received.slice(0, pageSize);
            const last = records[records.length - 1] || null;

            return {
                records,
                hasMore,
                cursor: hasMore && last
                    ? {
                        eventAt: String(last.event_at || last.created_at || ''),
                        id: String(last.id || '')
                    }
                    : null
            };
        }
    }

    function createRepository(runtimeConfig = {}, dependencies = {}) {
        assertProductionRepository(runtimeConfig);

        if (!isSupabaseExplicitlyEnabled(runtimeConfig)) {
            return createLocalRepository(dependencies);
        }

        return new OperationalSupabaseRepository({
            client: dependencies.supabaseClient,
            tableMap: dependencies.tableMap
        });
    }

    return Object.freeze({
        createRepository,
        createLocalRepository,
        isProductionEnvironment,
        isSupabaseExplicitlyEnabled,
        assertProductionRepository,
        filterOperationalBootstrapEntities,
        OperationalSupabaseRepository
    });
}));
