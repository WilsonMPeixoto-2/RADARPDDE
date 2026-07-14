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
    const api = factory(contract, errorMapper, unitOfWorkApi);

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarDataService = Object.freeze(api);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createRadarDataServiceApi(
    contract,
    errorMapper,
    unitOfWorkApi
) {
    'use strict';

    if (!contract || !errorMapper || !unitOfWorkApi) {
        throw new Error('Contrato, mapeador de erros e unidade de trabalho são obrigatórios.');
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
            const beforeRepository = await this.repository.exportSnapshot({ includeEmpty: true });

            try {
                const result = await this.unitOfWork.run({
                    ...command,
                    changedEntities,
                    persist: async ({ snapshot }) => {
                        for (const entity of changedEntities) {
                            await this.repository.save(entity, snapshot.entities[entity] || []);
                        }
                    }
                });
                return {
                    ok: true,
                    value: cloneValue(result.value),
                    snapshot: cloneValue(result.snapshot)
                };
            } catch (error) {
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
