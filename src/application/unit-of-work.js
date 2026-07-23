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

    function isRecoverableLocalCacheError(error) {
        const name = String(error?.name || '');
        const code = Number(error?.code || 0);
        const message = String(error?.message || '').toLowerCase();
        return name === 'QuotaExceededError'
            || name === 'NS_ERROR_DOM_QUOTA_REACHED'
            || code === 22
            || code === 1014
            || message.includes('quota has been exceeded')
            || message.includes('quota exceeded');
    }

    function createIncidentId(command = {}) {
        if (command.incidentId) return String(command.incidentId);
        if (typeof command.createIncidentId === 'function') return String(command.createIncidentId());
        const time = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).slice(2, 8).toUpperCase();
        return `RADAR-${time}-${random}`;
    }

    function annotateFailure(error, metadata = {}) {
        const target = error instanceof RepositoryError
            ? error
            : new RepositoryError(
                String(error?.code || 'TRANSACTION_FAILED'),
                String(error?.message || 'A operação de dados não pôde ser concluída.'),
                { cause: error, operation: metadata.operation }
            );
        target.details = {
            ...(target.details || {}),
            incidentId: metadata.incidentId,
            unitOfWorkPhase: metadata.phase,
            rollbackConfirmed: metadata.rollbackConfirmed === true,
            localRestoreConfirmed: metadata.localRestoreConfirmed === true,
            remoteCommitConfirmed: metadata.remoteCommitConfirmed === true
        };
        target.incidentId = metadata.incidentId;
        target.operation = target.operation || metadata.operation;
        return target;
    }

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
            const operation = String(command.name || 'data-command');
            const incidentId = createIncidentId(command);
            const capture = await this.statePort.capture();
            let phase = 'mutate';
            let remoteCommitConfirmed = false;

            try {
                const value = await command.mutate();
                phase = 'export';
                const snapshot = await this.statePort.exportCanonical({
                    version: command.version || '1',
                    importId: command.importId || `command-${Date.now()}`,
                    exportedAt: command.exportedAt || new Date().toISOString()
                });
                phase = 'persist';
                const persisted = await command.persist({
                    name: operation,
                    incidentId,
                    changedEntities,
                    value: cloneValue(value),
                    snapshot: cloneValue(snapshot)
                });
                remoteCommitConfirmed = persisted?.remoteCommitConfirmed !== false;
                phase = 'commit';
                if (command.deferLocalCommit !== true) {
                    try {
                        if (typeof this.statePort.commitCurrent === 'function') {
                            this.statePort.commitCurrent(snapshot);
                        } else {
                            await this.statePort.applyCanonical(snapshot);
                        }
                    } catch (commitError) {
                        if (!isRecoverableLocalCacheError(commitError)) {
                            throw new RepositoryError(
                                'TRANSACTION_FAILED',
                                'A gravação remota foi concluída, mas a atualização local falhou.',
                                {
                                    operation,
                                    cause: commitError,
                                    details: {
                                        incidentId,
                                        unitOfWorkPhase: 'commit',
                                        rollbackConfirmed: false,
                                        remoteCommitConfirmed: true
                                    }
                                }
                            );
                        }
                    }
                }
                return {
                    incidentId,
                    value: cloneValue(value),
                    snapshot: cloneValue(snapshot),
                    persisted: cloneValue(persisted)
                };
            } catch (error) {
                let localRestoreConfirmed = false;
                try {
                    await this.statePort.restore(capture);
                    localRestoreConfirmed = true;
                } catch (rollbackError) {
                    throw new RepositoryError(
                        'TRANSACTION_FAILED',
                        'A operação falhou e o estado local não pôde ser restaurado.',
                        {
                            operation,
                            cause: error,
                            details: {
                                incidentId,
                                unitOfWorkPhase: phase,
                                rollbackConfirmed: false,
                                localRestoreConfirmed: false,
                                remoteCommitConfirmed,
                                rollbackCode: rollbackError?.code || null
                            }
                        }
                    );
                }

                const rollbackConfirmed = phase === 'mutate' || phase === 'export'
                    ? true
                    : error?.details?.rollbackConfirmed === true;
                throw annotateFailure(error, {
                    incidentId,
                    operation,
                    phase,
                    rollbackConfirmed,
                    localRestoreConfirmed,
                    remoteCommitConfirmed: remoteCommitConfirmed || error?.details?.remoteCommitConfirmed === true
                });
            }
        }
    }

    return Object.freeze({ UnitOfWork, createIncidentId });
}));
