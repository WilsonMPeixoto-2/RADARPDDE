(function installSupabaseRepository(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('./repository-contract.js')
        : root.RadarRepositoryContract;
    const errorMapper = typeof module !== 'undefined' && module.exports
        ? require('../application/error-mapper.js')
        : root.RadarErrorMapper;
    const api = factory(contract, errorMapper);

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarSupabaseRepository = Object.freeze(api);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createSupabaseRepositoryApi(contract, errorMapper) {
    'use strict';

    if (!contract || !errorMapper) {
        throw new Error('Contrato e mapeador de erros devem ser carregados antes do repositório Supabase.');
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
    const { withSafeReadRetry } = errorMapper;

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
            this.readRetry = Object.freeze({
                maxAttempts: positiveInteger(options.readRetry?.maxAttempts, 3),
                delayMs: Number.isFinite(options.readRetry?.delayMs) && options.readRetry.delayMs >= 0
                    ? options.readRetry.delayMs
                    : 120
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

        async loadPage(entity, offset = 0, limit = this.pageSize) {
            const table = this.tableFor(entity);
            const pageSize = positiveInteger(limit, this.pageSize);
            const start = Math.max(0, Number.isInteger(offset) ? offset : 0);
            const data = await withSafeReadRetry(async () => {
                let query = this.client.from(table).select('*');
                if (typeof query.order === 'function') query = query.order('id', { ascending: true });
                if (typeof query.range === 'function') query = query.range(start, start + pageSize - 1);
                return this.execute(entity, 'loadPage', query);
            }, this.readRetry);
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

        async insertOnly(entity, records, options = {}) {
            const table = this.tableFor(entity);
            const collection = normalizeCollection(records);
            if (collection.length === 0) return [];
            const batchSize = positiveInteger(options.batchSize, this.writeBatchSize);

            for (const batch of chunks(collection, batchSize)) {
                await this.execute(
                    entity,
                    'insertOnly',
                    this.client.from(table).insert(batch)
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

        async executeRpc(name, args, operation) {
            if (typeof this.client.rpc !== 'function') {
                throw new RepositoryError(
                    'MISSING_RPC_CLIENT',
                    'O cliente Supabase não oferece execução de RPC.',
                    { operation }
                );
            }
            try {
                const result = await this.client.rpc(name, cloneValue(args || {}));
                if (result?.error) throw result.error;
                return cloneValue(result?.data ?? null);
            } catch (error) {
                if (error instanceof RepositoryError) throw error;
                const message = String(error?.message || 'Falha em operação transacional Supabase.');
                let code = 'SUPABASE_OPERATION_FAILED';
                if (message.includes('OPTIMISTIC_CONFLICT')) code = 'OPTIMISTIC_CONFLICT';
                else if (message.includes('AUTHORIZATION_DENIED')) code = 'PERMISSION_DENIED';
                else if (message.includes('VALIDATION_ERROR')) code = 'VALIDATION_FAILED';
                else if (message.includes('NOT_FOUND')) code = 'NOT_FOUND';
                throw new RepositoryError(code, message, {
                    operation,
                    cause: error,
                    details: { rpc: name }
                });
            }
        }

        async saveInvoiceWithEffects(input = {}) {
            if (!input.invoice || typeof input.invoice !== 'object') {
                throw new RepositoryError(
                    'VALIDATION_FAILED',
                    'A RPC de nota exige o registro da nota fiscal.',
                    { operation: 'saveInvoiceWithEffects' }
                );
            }
            return this.executeRpc('save_invoice_with_effects', {
                p_invoice: cloneValue(input.invoice),
                p_asset: input.asset ? cloneValue(input.asset) : null,
                p_verification_patch: input.verificationPatch
                    ? cloneValue(input.verificationPatch)
                    : null,
                p_expected_invoice_version: input.expectedInvoiceVersion ?? null,
                p_expected_asset_version: input.expectedAssetVersion ?? null,
                p_expected_verification_version: input.expectedVerificationVersion ?? null,
                p_administrative_log: input.administrativeLog
                    ? cloneValue(input.administrativeLog)
                    : null
            }, 'saveInvoiceWithEffects');
        }

        async deleteInvoiceWithEffects(input = {}) {
            if (!input.invoiceId) {
                throw new RepositoryError(
                    'VALIDATION_FAILED',
                    'A RPC de remoção exige o identificador da nota fiscal.',
                    { operation: 'deleteInvoiceWithEffects' }
                );
            }
            return this.executeRpc('delete_invoice_with_effects', {
                p_invoice_id: input.invoiceId,
                p_expected_invoice_version: input.expectedInvoiceVersion ?? null,
                p_delete_linked_asset: input.deleteLinkedAsset !== false,
                p_expected_asset_version: input.expectedAssetVersion ?? null,
                p_verification_patch: input.verificationPatch
                    ? cloneValue(input.verificationPatch)
                    : null,
                p_expected_verification_version: input.expectedVerificationVersion ?? null,
                p_administrative_log: input.administrativeLog
                    ? cloneValue(input.administrativeLog)
                    : null
            }, 'deleteInvoiceWithEffects');
        }

        async saveExerciseWithCompetences(input = {}) {
            return this.executeRpc('save_exercise_with_competences', {
                p_config: cloneValue(input.appConfig || {}),
                p_competences: cloneValue(input.competences || []),
                p_administrative_log: input.administrativeLog ? cloneValue(input.administrativeLog) : null
            }, 'saveExerciseWithCompetences');
        }

        async saveSchoolWithPrograms(input = {}) {
            return this.executeRpc('save_school_with_programs', {
                p_school: cloneValue(input.school || {}),
                p_programs: cloneValue(input.programs || []),
                p_expected_school_version: input.expectedSchoolVersion ?? null,
                p_administrative_log: input.administrativeLog ? cloneValue(input.administrativeLog) : null
            }, 'saveSchoolWithPrograms');
        }

        async reanalyzePendencyWithVerification(input = {}) {
            return this.executeRpc('reanalyze_pendency_with_verification', {
                p_pendency: cloneValue(input.pendency || {}),
                p_attempt: input.attempt ? cloneValue(input.attempt) : null,
                p_verification_patch: cloneValue(input.verification || {}),
                p_expected_pendency_version: input.expectedPendencyVersion ?? null,
                p_expected_verification_version: input.expectedVerificationVersion ?? null,
                p_administrative_log: input.administrativeLog ? cloneValue(input.administrativeLog) : null
            }, 'reanalyzePendencyWithVerification');
        }

        async beginImport(input = {}) {
            return this.executeRpc('begin_data_import', {
                p_import_id: input.importId,
                p_snapshot_format: input.format,
                p_snapshot_version: input.version,
                p_source_hash: input.hash || input.sourceHash,
                p_entity_counts: cloneValue(input.counts || {})
            }, 'beginImport');
        }

        async stageImportBatch(input = {}) {
            return this.executeRpc('stage_data_import_batch', {
                p_import_id: input.importId,
                p_entity: input.entity,
                p_batch_index: input.batchIndex,
                p_records: cloneValue(input.records || []),
                p_source_hash: input.hash || input.sourceHash
            }, 'stageImportBatch');
        }

        async loadStagedSnapshot(importId) {
            return this.executeRpc('load_staged_import', { p_import_id: importId }, 'loadStagedSnapshot');
        }

        async promoteImportSnapshot(input = {}) {
            return this.executeRpc('promote_data_import', {
                p_import_id: input.importId,
                p_source_hash: input.hash || input.sourceHash,
                p_entity_counts: cloneValue(input.counts || {}),
                p_snapshot: cloneValue(input.snapshot || {})
            }, 'promoteImportSnapshot');
        }

        async completeImport(input = {}) {
            return this.executeRpc('complete_data_import', {
                p_import_id: input.importId,
                p_source_hash: input.hash || input.sourceHash,
                p_reconciliation: cloneValue(input.reconciliation || {})
            }, 'completeImport');
        }

        async rollbackImport(input) {
            const importId = typeof input === 'object' ? input.importId : input;
            return this.executeRpc('rollback_data_import', { p_import_id: importId }, 'rollbackImport');
        }

        capabilities() {
            return Object.freeze({
                mode: 'supabase',
                remote: true,
                writable: true,
                canImportLegacy: false,
                atomicTransactions: false,
                atomicInvoiceEffects: true,
                atomicExerciseCreation: true,
                atomicSchoolPrograms: true,
                atomicPendencyReanalysis: true,
                resumableImport: true,
                reversibleImport: true,
                optimisticConcurrency: true,
                safeReadRetry: true
            });
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
