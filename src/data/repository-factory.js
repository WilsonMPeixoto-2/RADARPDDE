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
    const OBSOLETE_LOCAL_REPOSITORY_PREFIX = 'radar_pdde_repository:';
    const DEFAULT_ADMINISTRATIVE_LOG_PAGE_SIZE = 100;
    const MAX_ADMINISTRATIVE_LOG_PAGE_SIZE = 200;
    const OPERATIONAL_COMPETENCE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
    const ACTIVE_PENDENCY_STATUSES = Object.freeze(['Aberta', 'Aguardando reanálise']);
    const ACTIVE_ASSET_STATUSES = Object.freeze(['Não encaminhada', 'Encaminhada']);
    const CHILD_QUERY_CHUNK_SIZE = 100;

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

    function cleanupObsoleteLocalRepositoryStorage(storage) {
        if (!storage
            || typeof storage.key !== 'function'
            || typeof storage.removeItem !== 'function') {
            return [];
        }
        const obsoleteKeys = [];
        const length = Number.isInteger(storage.length) ? storage.length : Number(storage.length || 0);
        for (let index = 0; index < length; index += 1) {
            const key = storage.key(index);
            if (typeof key === 'string' && key.startsWith(OBSOLETE_LOCAL_REPOSITORY_PREFIX)) {
                obsoleteKeys.push(key);
            }
        }
        obsoleteKeys.forEach(key => storage.removeItem(key));
        return obsoleteKeys;
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

    function operationalContextError(message, operation = 'queryOperationalContext') {
        const error = new Error(message);
        error.code = 'INVALID_OPERATIONAL_CONTEXT';
        error.operation = operation;
        return error;
    }

    function queryCapabilityError(method, operation) {
        const error = new Error(`A consulta operacional exige suporte a ${method}.`);
        error.code = 'MISSING_CONTEXTUAL_QUERY_CAPABILITY';
        error.operation = operation;
        return error;
    }

    function requireQueryMethod(query, method, operation) {
        if (!query || typeof query[method] !== 'function') {
            throw queryCapabilityError(method, operation);
        }
        return query;
    }

    function uniqueById(...collections) {
        const byId = new Map();
        collections.flat().forEach(record => {
            const id = String(record?.id || '').trim();
            if (id) byId.set(id, record);
        });
        return [...byId.values()].sort((left, right) => (
            String(left.id).localeCompare(String(right.id), 'pt-BR')
        ));
    }

    function chunks(values, size = CHILD_QUERY_CHUNK_SIZE) {
        const result = [];
        for (let offset = 0; offset < values.length; offset += size) {
            result.push(values.slice(offset, offset + size));
        }
        return result;
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

        async queryFilteredCollection(entity, configure, operation) {
            const table = this.tableFor(entity);
            const records = [];
            let cursor = null;

            while (true) {
                let query = this.client.from(table).select('*');
                query = configure(query) || query;
                requireQueryMethod(query, 'order', operation);
                query = query.order('id', { ascending: true });
                if (cursor !== null) {
                    requireQueryMethod(query, 'gt', operation);
                    query = query.gt('id', cursor);
                }
                requireQueryMethod(query, 'limit', operation);
                query = query.limit(this.pageSize);

                const page = await this.execute(entity, operation, query);
                records.push(...page);
                if (page.length < this.pageSize) break;

                const lastId = String(page[page.length - 1]?.id || '').trim();
                if (!lastId || lastId === cursor) {
                    throw queryCapabilityError('cursor id progressivo', operation);
                }
                cursor = lastId;
            }

            return uniqueById(records);
        }

        async queryByEquality(entity, column, value, operation) {
            return this.queryFilteredCollection(entity, query => {
                requireQueryMethod(query, 'eq', operation);
                return query.eq(column, value);
            }, operation);
        }

        async queryByIn(entity, column, values, operation) {
            const requested = [...new Set((values || []).map(String).filter(Boolean))];
            if (requested.length === 0) return [];
            const pages = await Promise.all(chunks(requested).map((batch, index) => (
                this.queryFilteredCollection(entity, query => {
                    requireQueryMethod(query, 'in', operation);
                    return query.in(column, batch);
                }, `${operation}:chunk-${index + 1}`)
            )));
            return uniqueById(...pages);
        }

        async queryOperationalContext(options = {}) {
            const competenceId = String(options.competenceId || '').trim();
            if (!OPERATIONAL_COMPETENCE_PATTERN.test(competenceId)) {
                throw operationalContextError('Informe uma competência mensal válida para carregar o contexto operacional.');
            }

            const [
                verifications,
                registeredInvoices,
                monthlyPendencies,
                activePendencies,
                monthlyAssets,
                activeAssets
            ] = await Promise.all([
                this.queryByEquality(
                    'verifications',
                    'competence_id',
                    competenceId,
                    'queryOperationalContext:verifications'
                ),
                this.queryByEquality(
                    'registeredInvoices',
                    'competence_id',
                    competenceId,
                    'queryOperationalContext:registeredInvoices'
                ),
                this.queryByEquality(
                    'pendencies',
                    'competence_origin',
                    competenceId,
                    'queryOperationalContext:monthlyPendencies'
                ),
                this.queryByIn(
                    'pendencies',
                    'status',
                    ACTIVE_PENDENCY_STATUSES,
                    'queryOperationalContext:activePendencies'
                ),
                this.queryByEquality(
                    'assets',
                    'competence_id',
                    competenceId,
                    'queryOperationalContext:monthlyAssets'
                ),
                this.queryByIn(
                    'assets',
                    'status',
                    ACTIVE_ASSET_STATUSES,
                    'queryOperationalContext:activeAssets'
                )
            ]);

            const pendencies = uniqueById(monthlyPendencies, activePendencies);
            const assets = uniqueById(monthlyAssets, activeAssets);
            const pendencyIds = pendencies.map(record => String(record.id));
            const [pendencyAttempts, pendencyContacts] = await Promise.all([
                this.queryByIn(
                    'pendencyAttempts',
                    'pendency_id',
                    pendencyIds,
                    'queryOperationalContext:pendencyAttempts'
                ),
                this.queryByIn(
                    'pendencyContacts',
                    'pendency_id',
                    pendencyIds,
                    'queryOperationalContext:pendencyContacts'
                )
            ]);

            return {
                competenceId,
                entities: {
                    verifications,
                    pendencies,
                    pendencyAttempts,
                    pendencyContacts,
                    assets,
                    registeredInvoices
                }
            };
        }
    }

    function createRepository(runtimeConfig = {}, dependencies = {}) {
        assertProductionRepository(runtimeConfig);

        if (!isSupabaseExplicitlyEnabled(runtimeConfig)) {
            return createLocalRepository(dependencies);
        }

        cleanupObsoleteLocalRepositoryStorage(dependencies.storage);
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
        cleanupObsoleteLocalRepositoryStorage,
        OperationalSupabaseRepository
    });
}));
