(function installRadarDataService(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const errorMapper = typeof module !== 'undefined' && module.exports
        ? require('./error-mapper.js')
        : root.RadarErrorMapper;
    const unitOfWorkApi = typeof module !== 'undefined' && module.exports
        ? require('./unit-of-work.js')
        : root.RadarUnitOfWork;
    const jsonContracts = typeof module !== 'undefined' && module.exports
        ? require('../domain/json-contracts.js')
        : root.RadarJsonContracts;
    const api = factory(contract, errorMapper, unitOfWorkApi, jsonContracts);

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarDataService = Object.freeze(api);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createRadarDataServiceApi(
    contract,
    errorMapper,
    unitOfWorkApi,
    jsonContracts
) {
    'use strict';

    if (!contract || !errorMapper || !unitOfWorkApi || !jsonContracts) {
        throw new Error('Contrato, mapeador de erros, unidade de trabalho e contratos JSON são obrigatórios.');
    }

    const {
        RepositoryError,
        assertKnownEntity,
        assertRepositoryContract,
        cloneValue,
        isSnapshotEmpty
    } = contract;
    const { toRepositoryError } = errorMapper;
    const { UnitOfWork } = unitOfWorkApi;
    const { assertCanonicalRecords } = jsonContracts;
    const GENERATED_INSERT_FIELDS = Object.freeze(['row_version', 'created_at', 'updated_at']);
    const VOLATILE_COMPARISON_FIELDS = Object.freeze(['row_version', 'created_at', 'updated_at']);

    function assertSnapshotJson(snapshot, operation) {
        for (const [entity, records] of Object.entries(snapshot?.entities || {})) {
            assertCanonicalRecords(entity, records, { operation });
        }
        return snapshot;
    }

    function normalizedRecords(records) {
        return Array.isArray(records) ? records : [];
    }

    function recordId(record) {
        const id = record?.id;
        return id === undefined || id === null || id === '' ? null : String(id);
    }

    function comparableRecord(record) {
        const value = cloneValue(record || {});
        VOLATILE_COMPARISON_FIELDS.forEach(field => delete value[field]);
        return value;
    }

    function stableValue(value) {
        if (Array.isArray(value)) return value.map(stableValue);
        if (!value || typeof value !== 'object') return value;
        return Object.keys(value).sort().reduce((result, key) => {
            result[key] = stableValue(value[key]);
            return result;
        }, {});
    }

    function recordsDiffer(left, right) {
        return JSON.stringify(stableValue(comparableRecord(left)))
            !== JSON.stringify(stableValue(comparableRecord(right)));
    }

    function diffRecords(beforeRecords, afterRecords) {
        const before = normalizedRecords(beforeRecords);
        const after = normalizedRecords(afterRecords);
        const beforeById = new Map();
        const afterById = new Map();

        before.forEach(record => {
            const id = recordId(record);
            if (id) beforeById.set(id, record);
        });
        after.forEach(record => {
            const id = recordId(record);
            if (id) afterById.set(id, record);
        });

        const added = [];
        const updated = [];
        const removed = [];

        after.forEach(record => {
            const id = recordId(record);
            if (!id || !beforeById.has(id)) {
                added.push(record);
                return;
            }
            if (recordsDiffer(beforeById.get(id), record)) updated.push(record);
        });

        before.forEach(record => {
            const id = recordId(record);
            if (id && !afterById.has(id)) removed.push(record);
        });

        return { added, updated, removed };
    }

    function prepareInsertRecord(record) {
        const value = cloneValue(record || {});
        GENERATED_INSERT_FIELDS.forEach(field => {
            const empty = value[field] === null || value[field] === undefined || value[field] === '';
            const invalidVersion = field === 'row_version'
                && (!Number.isInteger(value[field]) || value[field] <= 0);
            if (empty || invalidVersion) delete value[field];
        });
        return value;
    }

    async function persistInsert(repository, entity, records) {
        const prepared = normalizedRecords(records).map(prepareInsertRecord);
        if (prepared.length === 0) return;
        if (typeof repository.insertOnly === 'function') {
            await repository.insertOnly(entity, prepared);
            return;
        }
        await repository.save(entity, prepared);
    }

    async function persistRemoteEntity(repository, entity, beforeRecords, afterRecords) {
        const changes = diffRecords(beforeRecords, afterRecords);

        if (entity === 'administrativeLogs') {
            await persistInsert(repository, entity, changes.added);
            return changes;
        }

        await persistInsert(repository, entity, changes.added);
        if (changes.updated.length > 0) {
            await repository.save(entity, changes.updated);
        }
        for (const record of changes.removed) {
            const id = recordId(record);
            if (id) await repository.remove(entity, id);
        }
        return changes;
    }

    const PERSISTED_RESULT_ENTITY_MAP = Object.freeze({
        app_config: 'appConfig',
        program: 'programs',
        controller: 'controllers',
        inventory_member: 'inventoryTeamMembers',
        school: 'schools',
        school_program: 'schoolPrograms',
        verification: 'verifications',
        pendency: 'pendencies',
        attempt: 'pendencyAttempts',
        contact: 'pendencyContacts',
        asset: 'assets',
        invoice: 'registeredInvoices',
        registered_invoice: 'registeredInvoices',
        administrative_log: 'administrativeLogs',
        log: 'administrativeLogs',
        competences: 'competences'
    });

    function entityForPersistedResult(key, value) {
        if (key === 'schools') return 'schools';
        if (key === 'school_programs') return 'schoolPrograms';
        if (key === 'programs') {
            const first = Array.isArray(value) ? value[0] : value;
            return first?.school_id && first?.program_id ? 'schoolPrograms' : 'programs';
        }
        return PERSISTED_RESULT_ENTITY_MAP[key] || null;
    }

    function mergeRecordsById(currentRecords, nextRecords) {
        const current = normalizedRecords(currentRecords).map(cloneValue);
        const byId = new Map(current.map((record, index) => [recordId(record) || `#${index}`, record]));
        normalizedRecords(nextRecords).forEach((record, index) => {
            const id = recordId(record);
            if (id) byId.set(id, cloneValue(record));
            else byId.set(`new#${index}`, cloneValue(record));
        });
        return [...byId.values()];
    }

    function mergePersistedResult(snapshot, persisted) {
        const next = cloneValue(snapshot);
        const appliedEntities = new Set();
        if (!persisted || typeof persisted !== 'object' || Array.isArray(persisted)) {
            return { snapshot: next, appliedEntities: [] };
        }
        Object.entries(persisted).forEach(([key, value]) => {
            const entity = entityForPersistedResult(key, value);
            if (!entity || value == null) return;
            const records = Array.isArray(value) ? value : [value];
            if (records.length === 0 || records.some(record => !record || typeof record !== 'object')) return;
            next.entities[entity] = mergeRecordsById(next.entities[entity], records);
            appliedEntities.add(entity);
        });
        assertSnapshotJson(next, 'mergePersistedResult');
        return { snapshot: next, appliedEntities: [...appliedEntities] };
    }

    class DataService {
        constructor(options = {}) {
            this.repository = assertRepositoryContract(options.repository);
            this.statePort = options.statePort;
            if (!this.statePort
                || typeof this.statePort.exportCanonical !== 'function'
                || typeof this.statePort.applyCanonical !== 'function') {
                throw new RepositoryError(
                    'INVALID_STATE_PORT',
                    'Uma porta de estado válida é obrigatória para o serviço de dados.',
                    { operation: 'construct' }
                );
            }
            this.unitOfWork = options.unitOfWork || new UnitOfWork({ statePort: this.statePort });
        }

        async bootstrap() {
            const capabilities = this.repository.capabilities();
            const current = await this.repository.exportSnapshot({ includeEmpty: true });
            assertSnapshotJson(current, 'bootstrap');
            const empty = isSnapshotEmpty(current);

            if (empty && capabilities.remote === true) {
                return {
                    importedLegacy: false,
                    empty: true,
                    snapshot: cloneValue(current)
                };
            }

            if (empty && capabilities.canImportLegacy === true) {
                const legacySnapshot = await this.statePort.exportCanonical({
                    version: current.version || '1',
                    importId: `legacy-bootstrap-${Date.now()}`,
                    exportedAt: new Date().toISOString()
                });
                await this.repository.restoreSnapshot(legacySnapshot);
                await this.statePort.applyCanonical(legacySnapshot);
                return {
                    importedLegacy: true,
                    empty: false,
                    snapshot: cloneValue(legacySnapshot)
                };
            }

            if (!empty) await this.statePort.applyCanonical(current);
            return {
                importedLegacy: false,
                empty,
                snapshot: cloneValue(current)
            };
        }

        stageCompatibility(options = {}) {
            const changedEntities = [...new Set(options.changedEntities || [])];
            if (changedEntities.length === 0) {
                throw new RepositoryError(
                    'VALIDATION_FAILED',
                    'A persistência de compatibilidade exige entidades alteradas.',
                    { operation: 'stageCompatibility' }
                );
            }
            changedEntities.forEach(assertKnownEntity);
            if (typeof this.statePort.captureSync !== 'function'
                || typeof this.statePort.exportCanonicalSync !== 'function'
                || typeof this.statePort.commitCurrent !== 'function'
                || typeof this.statePort.restoreSync !== 'function') {
                throw new RepositoryError(
                    'INVALID_STATE_PORT',
                    'A compatibilidade legada exige uma porta de estado síncrona.',
                    { operation: 'stageCompatibility' }
                );
            }

            const capture = this.statePort.captureSync();
            try {
                const snapshot = this.statePort.exportCanonicalSync({
                    version: options.version || '1',
                    importId: options.importId || `compatibility-${Date.now()}`,
                    exportedAt: options.exportedAt || new Date().toISOString()
                });
                assertSnapshotJson(snapshot, 'stageCompatibility');
                this.statePort.commitCurrent(snapshot);
                return {
                    changedEntities,
                    snapshot: cloneValue(snapshot)
                };
            } catch (error) {
                let rollbackError = null;
                try {
                    this.statePort.restoreSync(capture);
                } catch (restoreError) {
                    rollbackError = restoreError;
                }
                throw toRepositoryError(error, {
                    code: 'TRANSACTION_FAILED',
                    operation: String(options.name || 'persist-compatibility'),
                    message: rollbackError
                        ? 'A gravação local falhou e o estado não pôde ser restaurado integralmente.'
                        : error?.message || 'A gravação local foi desfeita após uma falha.',
                    details: { rollbackCode: rollbackError?.code || null }
                });
            }
        }

        async persistSnapshot(snapshot, changedEntities, options = {}) {
            const entities = [...new Set(changedEntities || [])];
            if (entities.length === 0) {
                throw new RepositoryError(
                    'VALIDATION_FAILED',
                    'O snapshot exige ao menos uma entidade para persistência.',
                    { operation: 'persistSnapshot' }
                );
            }
            entities.forEach(assertKnownEntity);
            const beforeRepository = await this.repository.exportSnapshot({ includeEmpty: true });
            try {
                assertSnapshotJson(snapshot, String(options.name || 'persistSnapshot'));
                for (const entity of entities) {
                    await this.repository.save(entity, snapshot.entities?.[entity] || []);
                }
                return { ok: true, snapshot: cloneValue(snapshot) };
            } catch (error) {
                let rollbackError = null;
                try {
                    await this.repository.restoreSnapshot(beforeRepository, { replace: true });
                } catch (restoreError) {
                    rollbackError = restoreError;
                }
                throw toRepositoryError(error, {
                    code: 'TRANSACTION_FAILED',
                    operation: String(options.name || 'persistSnapshot'),
                    message: rollbackError
                        ? 'A persistência canônica falhou e o repositório não pôde ser restaurado.'
                        : 'A persistência canônica foi desfeita após uma falha.',
                    details: { rollbackCode: rollbackError?.code || null }
                });
            }
        }

        async captureRemoteEntities(changedEntities) {
            const entities = {};
            for (const entity of changedEntities) {
                entities[entity] = await this.repository.load(entity);
            }
            return { entities };
        }

        async refreshRemoteEntities(snapshot, changedEntities) {
            const refreshed = cloneValue(snapshot);
            for (const entity of changedEntities) {
                refreshed.entities[entity] = await this.repository.load(entity);
            }
            assertSnapshotJson(refreshed, 'refreshRemoteEntities');
            await this.statePort.applyCanonical(refreshed, {
                persistStorage: false,
                source: 'remote-refresh'
            });
            return refreshed;
        }

        async execute(command = {}) {
            if (typeof command.mutate !== 'function') {
                throw new RepositoryError(
                    'VALIDATION_FAILED',
                    'O comando de dados exige uma mutação explícita.',
                    { operation: 'execute' }
                );
            }
            const changedEntities = [...new Set(command.changedEntities || [])];
            if (changedEntities.length === 0) {
                throw new RepositoryError(
                    'VALIDATION_FAILED',
                    'O comando deve declarar ao menos uma entidade alterada.',
                    { operation: String(command.name || 'data-command') }
                );
            }
            changedEntities.forEach(assertKnownEntity);
            const capabilities = this.repository.capabilities();
            const remote = capabilities.remote === true;
            const beforeRepository = remote
                ? await this.captureRemoteEntities(changedEntities)
                : await this.repository.exportSnapshot({ includeEmpty: true });

            try {
                const defaultPersist = async ({ snapshot }) => {
                    assertSnapshotJson(snapshot, String(command.name || 'data-command'));
                    for (const entity of changedEntities) {
                        if (remote) {
                            await persistRemoteEntity(
                                this.repository,
                                entity,
                                beforeRepository.entities?.[entity] || [],
                                snapshot.entities?.[entity] || []
                            );
                        } else {
                            await this.repository.save(entity, snapshot.entities?.[entity] || []);
                        }
                    }
                };
                const result = await this.unitOfWork.run({
                    ...command,
                    changedEntities,
                    deferLocalCommit: remote,
                    remotePersistence: remote,
                    persist: async context => {
                        if (typeof command.persist !== 'function') {
                            return defaultPersist(context);
                        }
                        return command.persist({
                            ...context,
                            repository: this.repository,
                            defaultPersist: () => defaultPersist(context)
                        });
                    }
                });

                let committedSnapshot = result.snapshot;
                let refreshPending = false;
                let stateApplyError = null;
                if (remote) {
                    const merged = mergePersistedResult(result.snapshot, result.persisted);
                    committedSnapshot = merged.snapshot;
                    if (merged.appliedEntities.length > 0) {
                        try {
                            await this.statePort.applyCanonical(committedSnapshot, {
                                persistStorage: false,
                                source: 'remote-result'
                            });
                        } catch (applyError) {
                            stateApplyError = applyError;
                        }
                    }
                    try {
                        committedSnapshot = await this.refreshRemoteEntities(committedSnapshot, changedEntities);
                    } catch (refreshError) {
                        refreshPending = true;
                        if (merged.appliedEntities.length === 0) {
                            try {
                                await this.statePort.applyCanonical(result.snapshot, {
                                    persistStorage: false,
                                    source: 'remote-fallback'
                                });
                            } catch (applyError) {
                                stateApplyError = stateApplyError || applyError;
                            }
                        }
                    }
                }

                return {
                    ok: true,
                    incidentId: result.incidentId,
                    value: cloneValue(result.value),
                    snapshot: cloneValue(committedSnapshot),
                    persisted: cloneValue(result.persisted),
                    refreshPending,
                    stateApplyErrorCode: stateApplyError?.code || null
                };
            } catch (error) {
                if (remote) {
                    if (error instanceof RepositoryError
                        && error.details?.unitOfWorkPhase === 'mutate') {
                        throw error;
                    }
                    throw toRepositoryError(error, {
                        operation: String(command.name || 'data-command'),
                        message: error?.message || 'A gravação no Supabase não pôde ser concluída.'
                    });
                }

                let rollbackError = null;
                try {
                    await this.repository.restoreSnapshot(beforeRepository, { replace: true });
                } catch (restoreError) {
                    rollbackError = restoreError;
                }
                if (!rollbackError
                    && error instanceof RepositoryError
                    && error.details?.unitOfWorkPhase === 'mutate') {
                    throw error;
                }
                throw toRepositoryError(error, {
                    code: 'TRANSACTION_FAILED',
                    operation: String(command.name || 'data-command'),
                    message: rollbackError
                        ? 'A operação falhou e o repositório não pôde ser restaurado integralmente.'
                        : 'A operação de dados foi desfeita após uma falha de persistência.',
                    details: {
                        rollbackCode: rollbackError?.code || null
                    }
                });
            }
        }
    }

    return Object.freeze({ DataService });
}));
