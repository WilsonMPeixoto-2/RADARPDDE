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
    const DEFAULT_PAGE_SIZE = 500;
    const DEFAULT_WRITE_BATCH_SIZE = 250;

    function positiveInteger(value, fallback) {
        return Number.isInteger(value) && value > 0 ? value : fallback;
    }

    function chunks(records, size) {
        const result = [];
        for (let offset = 0; offset < records.length; offset += size) {
            result.push(records.slice(offset, offset + size));
        }
        return result;
    }

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
            this.pageSize = positiveInteger(options.pageSize, DEFAULT_PAGE_SIZE);
            this.writeBatchSize = positiveInteger(
                options.writeBatchSize,
                DEFAULT_WRITE_BATCH_SIZE
            );
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

        async loadPage(entity, offset = 0, limit = this.pageSize) {
            const table = this.tableFor(entity);
            const pageSize = positiveInteger(limit, this.pageSize);
            const start = Math.max(0, Number.isInteger(offset) ? offset : 0);
            let query = this.client.from(table).select('*');
            if (typeof query.order === 'function') {
                query = query.order('id', { ascending: true });
            }
            if (typeof query.range === 'function') {
                query = query.range(start, start + pageSize - 1);
            }
            const data = await this.execute(entity, 'loadPage', query);
            return normalizeCollection(data);
        }

        async load(entity) {
            const rows = [];
            let offset = 0;

            while (true) {
                const page = await this.loadPage(entity, offset, this.pageSize);
                rows.push(...page);
                if (page.length < this.pageSize) break;
                offset += page.length;
            }

            return cloneValue(rows);
        }

        async save(entity, records, options = {}) {
            const table = this.tableFor(entity);
            const collection = normalizeCollection(records);
            if (collection.length === 0) return [];
            const batchSize = positiveInteger(options.batchSize, this.writeBatchSize);

            for (const batch of chunks(collection, batchSize)) {
                await this.execute(
                    entity,
                    'save',
                    this.client.from(table).upsert(batch)
                );
            }
            return cloneValue(collection);
        }

        async updateWithVersion(entity, record, expectedVersion) {
            const table = this.tableFor(entity);
            const id = record && record.id;
            if (id === undefined || id === null || id === '') {
                throw new RepositoryError(
                    'MISSING_RECORD_ID',
                    'A atualização otimista exige um identificador explícito.',
                    { entity, operation: 'updateWithVersion' }
                );
            }
            if (!Number.isInteger(expectedVersion) || expectedVersion <= 0) {
                throw new RepositoryError(
                    'INVALID_ROW_VERSION',
                    'A atualização otimista exige row_version positivo.',
                    { entity, operation: 'updateWithVersion', details: { id, expectedVersion } }
                );
            }

            const payload = cloneValue(record);
            delete payload.id;
            delete payload.row_version;

            let query = this.client.from(table).update(payload).eq('id', id).eq(
                'row_version',
                expectedVersion
            );
            if (typeof query.select === 'function') query = query.select('*');
            const updatedRows = await this.execute(entity, 'updateWithVersion', query);

            if (updatedRows.length === 0) {
                throw new RepositoryError(
                    'OPTIMISTIC_CONFLICT',
                    `O registro ${String(id)} foi alterado por outra sessão.`,
                    {
                        entity,
                        operation: 'updateWithVersion',
                        details: { id, expectedVersion }
                    }
                );
            }

            return cloneValue(updatedRows[0]);
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

        async restoreSnapshot(snapshot, options = {}) {
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
                await this.save(entity, snapshot.entities[entity], options);
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
                await this.loadPage('appConfig', 0, 1);
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
        DEFAULT_PAGE_SIZE,
        DEFAULT_WRITE_BATCH_SIZE,
        SupabaseRepository
    });
}));
