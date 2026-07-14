(function installRadarUnitOfWork(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const api = factory(contract);

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarUnitOfWork = Object.freeze(api);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createRadarUnitOfWorkApi(contract) {
    'use strict';

    if (!contract) {
        throw new Error('RadarRepositoryContract deve ser carregado antes da unidade de trabalho.');
    }

    const { RepositoryError, assertKnownEntity, cloneValue } = contract;

    class UnitOfWork {
        constructor(options = {}) {
            this.statePort = options.statePort;
            if (!this.statePort
                || typeof this.statePort.capture !== 'function'
                || typeof this.statePort.exportCanonical !== 'function'
                || typeof this.statePort.applyCanonical !== 'function'
                || typeof this.statePort.restore !== 'function') {
                throw new RepositoryError(
                    'INVALID_STATE_PORT',
                    'Uma porta de estado completa é obrigatória para a unidade de trabalho.',
                    { operation: 'construct' }
                );
            }
        }

        async run(command = {}) {
            if (typeof command.mutate !== 'function' || typeof command.persist !== 'function') {
                throw new RepositoryError(
                    'INVALID_COMMAND',
                    'A unidade de trabalho exige funções mutate e persist.',
                    { operation: 'run' }
                );
            }
            const changedEntities = [...new Set(command.changedEntities || [])];
            changedEntities.forEach(assertKnownEntity);
            const capture = await this.statePort.capture();

            try {
                const value = await command.mutate();
                const snapshot = await this.statePort.exportCanonical({
                    version: command.version || '1',
                    importId: command.importId || `command-${Date.now()}`,
                    exportedAt: command.exportedAt || new Date().toISOString()
                });
                await command.persist({
                    name: String(command.name || 'data-command'),
                    changedEntities,
                    value: cloneValue(value),
                    snapshot: cloneValue(snapshot)
                });
                await this.statePort.applyCanonical(snapshot);
                return { value: cloneValue(value), snapshot: cloneValue(snapshot) };
            } catch (error) {
                try {
                    await this.statePort.restore(capture);
                } catch (rollbackError) {
                    throw new RepositoryError(
                        'TRANSACTION_FAILED',
                        'A operação falhou e o estado local não pôde ser restaurado.',
                        {
                            operation: String(command.name || 'data-command'),
                            cause: error,
                            details: { rollbackCode: rollbackError?.code || null }
                        }
                    );
                }
                throw error;
            }
        }
    }

    return Object.freeze({ UnitOfWork });
}));
