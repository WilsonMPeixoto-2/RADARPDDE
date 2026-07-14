(function installRadarErrorMapper(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const api = factory(contract);

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (root) {
        root.RadarErrorMapper = Object.freeze(api);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createRadarErrorMapper(contract) {
    'use strict';

    if (!contract) {
        throw new Error('RadarRepositoryContract deve ser carregado antes do mapeador de erros.');
    }

    const { RepositoryError, cloneValue } = contract;
    const DATA_ERROR_CODES = Object.freeze([
        'NETWORK_UNAVAILABLE',
        'SESSION_EXPIRED',
        'PERMISSION_DENIED',
        'OPTIMISTIC_CONFLICT',
        'VALIDATION_FAILED',
        'TRANSACTION_FAILED',
        'REMOTE_UNAVAILABLE',
        'IMPORT_RECONCILIATION_FAILED'
    ]);
    const DATA_ERROR_SET = new Set(DATA_ERROR_CODES);

    function classifyError(error, fallbackCode = 'TRANSACTION_FAILED') {
        const code = String(error?.code || '').toUpperCase();
        const status = Number(error?.status || error?.statusCode || 0);
        const message = String(error?.message || '').toLowerCase();

        if (DATA_ERROR_SET.has(code)) return code;
        if (status === 401 || code === 'PGRST301' || message.includes('jwt expired')) {
            return 'SESSION_EXPIRED';
        }
        if (status === 403 || code === '42501' || message.includes('row-level security')) {
            return 'PERMISSION_DENIED';
        }
        if (status === 409 || code === '23505' || code === 'OPTIMISTIC_CONFLICT') {
            return 'OPTIMISTIC_CONFLICT';
        }
        if (status >= 500 || code === 'SUPABASE_OPERATION_FAILED') {
            return 'REMOTE_UNAVAILABLE';
        }
        if (error instanceof TypeError
            && (message.includes('fetch') || message.includes('network'))) {
            return 'NETWORK_UNAVAILABLE';
        }
        return DATA_ERROR_SET.has(fallbackCode) ? fallbackCode : 'TRANSACTION_FAILED';
    }

    function toRepositoryError(error, options = {}) {
        const requestedCode = options.code || options.fallbackCode || 'TRANSACTION_FAILED';
        const code = classifyError(error, requestedCode);
        if (error instanceof RepositoryError && error.code === code && !options.message) {
            return error;
        }

        return new RepositoryError(
            code,
            options.message || error?.message || 'A operação de dados não pôde ser concluída.',
            {
                cause: error,
                entity: options.entity || error?.entity || null,
                operation: options.operation || error?.operation || null,
                details: cloneValue({
                    ...(error?.details || {}),
                    ...(options.details || {}),
                    sourceCode: error?.code || null
                })
            }
        );
    }

    return Object.freeze({
        DATA_ERROR_CODES,
        classifyError,
        toRepositoryError
    });
}));
