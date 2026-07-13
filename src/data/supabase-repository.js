(function installSupabaseRepository(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('./repository-contract.js')
        : root.RadarRepositoryContract;
    const api = factory(contract);

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarSupabaseRepository = Object.freeze(api);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createSupabaseRepositoryApi(contract) {
    'use strict';

    if (!contract) {
        throw new Error('RadarRepositoryContract deve ser carregado antes do repositório Supabase.');
    }

    const {
        SNAPSHOT_FORMAT,
        RADAR_ENTITIES,
        RepositoryError,
        assertKnownEntity,
        cloneValue,
        normalizeCollection,
        createSnapshotEnvelope
    } = contract;

    const DEFAULT_TABLE_MAP = Object.freeze({
        appConfig: 'app_config',
        programs: 'programs',
        profiles: 'profiles',
        userProfiles: 'user_profiles',
        userSchoolScopes: 'user_school_scopes',
        controllers: 'controllers',
        inventoryTeamMembers: 'inventory_team_members',
        schools: 'schools',
        schoolPrograms: 'school_programs',
        competences: 'competences',
        verifications: 'verifications',
        pendencies: 'pendencies',
        pendencyAttempts: 'pendency_attempts',
        pendencyContacts: 'pendency_contacts',
        assets: 'assets',
        registeredInvoices: 'registered_invoices',
        administrativeLogs: 'administrative_logs',
        dataImportRuns: 'data_import_runs',
        auditEvents: 'audit_events'
    });

    const IMPORT_ENTITY_ORDER = Object.freeze([
        'competences',
        'programs',
        'appConfig',
        'controllers',
        'inventoryTeamMembers',
        'profiles',
        'schools',
        'schoolPrograms',
        'verifications',
        'pendencies',
        'pendencyAttempts',
        'pendencyContacts',
        'assets',
        'registeredInvoices',
        'administrativeLogs',
        'userProfiles',
        'userSchoolScopes',
        'dataImportRuns',
        'auditEvents'
    ]);

    const NON_RESTORABLE_ENTITIES = Object.freeze(['auditEvents']);
    const NON_RESTORABLE_SET = new Set(NON_RESTORABLE_ENTITIES);

    class SupabaseRepository {
        constructor(options = {}) {
            if (!options.client || typeof options.client.from !== 'function') {
                throw new RepositoryError(
                    'MISSING_CLIENT',
                    'Cliente Supabase válido é obrigatório.',
                    { operation: 'construct' }
                );
            }

            this.client = options.client;
            this.tableMap = Object.freeze({
                ...DEFAULT_TABLE_MAP,
                ...(options.tableMap || {})
            });
        }

        tableFor(entity) {
            assertKnownEntity(entity);
            const table = this.tableMap[entity];
            if (!table) {
                throw new RepositoryError(
                    'UNMAPPED_ENTITY',
                    `A entidade ${entity} não possui tabela Supabase configurada.`,
                    { entity }
                );
            }
            return table;
        }

        async execute(entity, operation, query) {
            try {
                const result = await query;
                if (result && result.error) {
                    throw result.error;
                }
                return cloneValue((result && result.data) || []);
            } catch (error) {
                if (error instanceof RepositoryError) throw error;
                throw new RepositoryError(
                    'SUPABASE_OPERATION_FAILED',
                    `Falha na operação ${operation} da entidade ${entity}.`,
                    { entity, operation, cause: error }
                );
            }
        }

        async load(entity) {
            const table = this.tableFor(entity);
            const data = await this.execute(
                entity,
                'load',
                this.client.from(table).select('*')
            );
            return normalizeCollection(data);
        }

        async save(entity, records) {
            const table = this.tableFor(entity);
            const collection = normalizeCollection(records);
            if (collection.length === 0) return [];

            await this.execute(
                entity,
                'save',
                this.client.from(table).upsert(collection)
            );
            return cloneValue(collection);
        }

        async remove(entity, id) {
            if (id === undefined || id === null || id === '') {
                throw new RepositoryError(
                    'MISSING_RECORD_ID',
                    'A exclusão Supabase exige um identificador explícito.',
                    { entity, operation: 'remove' }
                );
            }
            const table = this.tableFor(entity);
            await this.execute(
                entity,
                'remove',
                this.client.from(table).delete().eq('id', id)
            );
            return { removedId: id };
        }

        async exportSnapshot(options = {}) {
            const entities = {};
            for (const entity of RADAR_ENTITIES) {
                const records = await this.load(entity);
                if (records.length > 0 || options.includeEmpty === true) {
                    entities[entity] = records;
                }
            }

            return createSnapshotEnvelope(entities, {
                version: options.version || options.schemaVersion || '1',
                importId: options.importId,
                exportedAt: options.exportedAt
            });
        }

        async restoreSnapshot(snapshot) {
            if (!snapshot
                || typeof snapshot !== 'object'
                || snapshot.format !== SNAPSHOT_FORMAT
                || !snapshot.entities
                || typeof snapshot.entities !== 'object') {
                throw new RepositoryError(
                    'INVALID_SNAPSHOT',
                    'Snapshot Supabase inválido.',
                    { operation: 'restoreSnapshot' }
                );
            }

            const entityNames = Object.keys(snapshot.entities);
            entityNames.forEach(assertKnownEntity);
            const skippedEntities = entityNames
                .filter(entity => NON_RESTORABLE_SET.has(entity) && snapshot.entities[entity].length > 0)
                .sort();
            const orderIndex = new Map(IMPORT_ENTITY_ORDER.map((entity, index) => [entity, index]));
            const orderedEntities = entityNames
                .filter(entity => !NON_RESTORABLE_SET.has(entity))
                .slice()
                .sort((left, right) => (
                    (orderIndex.get(left) ?? Number.MAX_SAFE_INTEGER)
                    - (orderIndex.get(right) ?? Number.MAX_SAFE_INTEGER)
                ));

            for (const entity of orderedEntities) {
                await this.save(entity, snapshot.entities[entity]);
            }

            return {
                restoredEntities: orderedEntities.length,
                orderedEntities,
                skippedEntities,
                version: String(snapshot.version || '1'),
                importId: String(snapshot.importId || '')
            };
        }

        async healthCheck() {
            try {
                await this.load('appConfig');
                return { ok: true, mode: 'supabase', writable: null };
            } catch (error) {
                return {
                    ok: false,
                    mode: 'supabase',
                    writable: null,
                    errorCode: error.code || 'SUPABASE_OPERATION_FAILED'
                };
            }
        }
    }

    return Object.freeze({
        DEFAULT_TABLE_MAP,
        IMPORT_ENTITY_ORDER,
        NON_RESTORABLE_ENTITIES,
        SupabaseRepository
    });
}));
