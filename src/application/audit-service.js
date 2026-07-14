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
            return this.dataService.execute({
                name: 'audit:record',
                changedEntities: ['administrativeLogs'],
                mutate: () => ({
                    log: cloneValue(this.appendLog(action, details, event))
                })
            });
        }
    }

    return Object.freeze({ AuditService });
}));

