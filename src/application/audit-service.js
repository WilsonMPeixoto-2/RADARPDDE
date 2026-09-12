(function installRadarAuditService(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const api = factory(contract);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarAuditService = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createAuditServiceApi(contract) {
    'use strict';

    if (!contract) throw new Error('Contrato de dados obrigatório para auditoria.');
    const { RepositoryError, cloneValue } = contract;

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    class AuditService {
        constructor(options = {}) {
            this.dataService = options.dataService;
            this.appendLog = options.appendLog;
            if (!this.dataService || typeof this.dataService.execute !== 'function'
                || typeof this.appendLog !== 'function') {
                throw new RepositoryError(
                    'INVALID_AUDIT_SERVICE',
                    'Dependências do serviço de auditoria inválidas.',
                    { operation: 'construct' }
                );
            }
        }

        async persistRemoteLog(context, logId) {
            const { snapshot, repository, defaultPersist } = context;
            if (repository?.capabilities?.().remote !== true) return defaultPersist();
            if (typeof repository.insertOnly !== 'function') return defaultPersist();

            const canonicalLog = (snapshot?.entities?.administrativeLogs || [])
                .find(record => String(record?.id) === String(logId));
            if (!canonicalLog) {
                throw new RepositoryError(
                    'PERSISTENCE_CONTEXT_MISSING',
                    'O registro administrativo produzido pela operação não foi encontrado para persistência.',
                    { operation: 'audit:record', details: { logId } }
                );
            }

            const inserted = await repository.insertOnly('administrativeLogs', [canonicalLog]);
            return {
                administrative_log: cloneValue(inserted?.[0] || canonicalLog)
            };
        }

        async record(event = {}) {
            const action = text(event.action || event.acao);
            const details = text(event.details || event.detalhes);
            if (!action) {
                throw new RepositoryError(
                    'VALIDATION_FAILED',
                    'A ação de auditoria é obrigatória.',
                    { operation: 'audit:record' }
                );
            }
            const persistence = { logId: null };
            return this.dataService.execute({
                name: 'audit:record',
                changedEntities: ['administrativeLogs'],
                incrementalStateEntities: ['administrativeLogs'],
                remoteResultIsAuthoritative: true,
                remoteRefreshExemptEntities: ['administrativeLogs'],
                mutate: () => {
                    const log = cloneValue(this.appendLog(action, details, event));
                    persistence.logId = text(log?.id);
                    if (!persistence.logId) {
                        throw new RepositoryError(
                            'PERSISTENCE_CONTEXT_MISSING',
                            'O registro administrativo não recebeu identificador.',
                            { operation: 'audit:record' }
                        );
                    }
                    return { log };
                },
                persist: context => this.persistRemoteLog(context, persistence.logId)
            });
        }
    }

    return Object.freeze({ AuditService });
}));

