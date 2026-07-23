(function installRadarErrorMapper(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const api = factory(contract, root);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarErrorMapper = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createRadarErrorMapper(contract, root) {
    'use strict';

    if (!contract) throw new Error('RadarRepositoryContract deve ser carregado antes do mapeador de erros.');

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
    const TRANSIENT_READ_CODES = new Set(['NETWORK_UNAVAILABLE', 'REMOTE_UNAVAILABLE']);
    const DATA_ERROR_MESSAGES = Object.freeze({
        NETWORK_UNAVAILABLE: 'A conexão foi interrompida. Seus dados foram preservados; verifique a rede e tente novamente.',
        SESSION_EXPIRED: 'Sua sessão expirou. O formulário foi preservado; autentique-se novamente para continuar.',
        PERMISSION_DENIED: 'Seu perfil não possui autorização para concluir esta operação.',
        OPTIMISTIC_CONFLICT: 'Este registro foi alterado por outra sessão. Recarregue os dados e compare as versões antes de salvar.',
        VALIDATION_FAILED: 'Há informações inválidas ou incompletas. Corrija os campos indicados sem fechar o formulário.',
        TRANSACTION_FAILED: 'Não foi possível confirmar a conclusão da operação. Recarregue os dados antes de tentar novamente.',
        REMOTE_UNAVAILABLE: 'O serviço de dados está temporariamente indisponível. O último estado confirmado foi mantido.',
        IMPORT_RECONCILIATION_FAILED: 'A reconciliação da migração encontrou divergências. A promoção foi bloqueada e o relatório deve ser revisado.'
    });

    function classifyError(error, fallbackCode = 'TRANSACTION_FAILED') {
        const code = String(error?.code || '').toUpperCase();
        const status = Number(error?.status || error?.statusCode || 0);
        const message = String(error?.message || '').toLowerCase();

        if (DATA_ERROR_SET.has(code)) return code;
        if (status === 401 || code === 'PGRST301' || code === 'AUTH_SESSION_MISSING'
            || message.includes('jwt expired') || message.includes('session expired')) {
            return 'SESSION_EXPIRED';
        }
        if (status === 403 || code === '42501' || message.includes('row-level security')
            || message.includes('authorization_denied')) {
            return 'PERMISSION_DENIED';
        }
        if (status === 409 || code === '23505' || message.includes('optimistic_conflict')) {
            return 'OPTIMISTIC_CONFLICT';
        }
        if (code === 'VALIDATION_ERROR' || code === '23514' || code === '22P02' || code === '22023' || status === 422) {
            return 'VALIDATION_FAILED';
        }
        if (code === 'IMPORT_RECONCILIATION_FAILED') return code;
        if (status >= 500 || code === 'SUPABASE_OPERATION_FAILED' || code === 'PGRST000') {
            return 'REMOTE_UNAVAILABLE';
        }
        if ((error instanceof TypeError || code === 'FETCH_ERROR')
            && (message.includes('fetch') || message.includes('network') || message.includes('connection'))) {
            return 'NETWORK_UNAVAILABLE';
        }
        return DATA_ERROR_SET.has(fallbackCode) ? fallbackCode : 'TRANSACTION_FAILED';
    }

    function toRepositoryError(error, options = {}) {
        const requestedCode = options.code || options.fallbackCode || 'TRANSACTION_FAILED';
        const code = classifyError(error, requestedCode);
        if (error instanceof RepositoryError && error.code === code && !options.message && !options.details) return error;

        const technical = {
            status: error?.status ?? error?.details?.status ?? null,
            postgresCode: error?.postgresCode ?? error?.details?.postgresCode ?? null,
            requestId: error?.requestId ?? error?.details?.requestId ?? null
        };
        const mapped = new RepositoryError(
            code,
            options.message || DATA_ERROR_MESSAGES[code] || error?.message || 'A operação de dados não pôde ser concluída.',
            {
                cause: error,
                entity: options.entity || error?.entity || null,
                operation: options.operation || error?.operation || null,
                details: cloneValue({
                    ...(error?.details || {}),
                    ...(options.details || {}),
                    ...technical,
                    sourceCode: error?.code || null
                })
            }
        );
        mapped.status = technical.status;
        mapped.postgresCode = technical.postgresCode;
        mapped.requestId = technical.requestId;
        mapped.incidentId = options.incidentId || error?.incidentId || mapped.details?.incidentId || null;
        return mapped;
    }

    function incidentIdFor(error, context = {}) {
        const supplied = context.incidentId || error?.incidentId || error?.details?.incidentId;
        if (supplied) return String(supplied);
        const time = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).slice(2, 7).toUpperCase();
        return `RADAR-${time}-${random}`;
    }

    function publicMessageFor(code, error, context = {}, incidentId = incidentIdFor(error, context)) {
        const phase = context.phase || error?.details?.unitOfWorkPhase || null;
        const rollbackConfirmed = context.rollbackConfirmed === true || error?.details?.rollbackConfirmed === true;
        const remoteCommitConfirmed = context.remoteCommitConfirmed === true || error?.details?.remoteCommitConfirmed === true;
        const businessMessage = context.businessMessage || null;
        let message = context.message || businessMessage;

        if (!message && code === 'TRANSACTION_FAILED' && remoteCommitConfirmed) {
            message = 'A alteração foi confirmada no servidor, mas a tela não pôde ser atualizada. Recarregue os dados antes de repetir a operação.';
        }
        if (!message && code === 'TRANSACTION_FAILED' && rollbackConfirmed) {
            message = ['capture', 'mutate', 'export'].includes(phase)
                ? 'A operação não chegou a ser enviada ao servidor e nenhuma alteração remota foi realizada.'
                : 'A operação não foi concluída e a reversão foi confirmada.';
        }
        if (!message) message = DATA_ERROR_MESSAGES[code] || 'A operação de dados não pôde ser concluída.';
        return `${message} Código do incidente: ${incidentId}.`;
    }

    function delay(milliseconds) {
        return milliseconds > 0
            ? new Promise(resolve => setTimeout(resolve, milliseconds))
            : Promise.resolve();
    }

    async function withSafeReadRetry(operation, options = {}) {
        if (typeof operation !== 'function') throw new TypeError('A leitura segura exige uma função.');
        const maxAttempts = Number.isInteger(options.maxAttempts) && options.maxAttempts > 0
            ? Math.min(options.maxAttempts, 4)
            : 3;
        const delayMs = Number.isFinite(options.delayMs) && options.delayMs >= 0 ? options.delayMs : 120;
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            try {
                return await operation({ attempt, maxAttempts });
            } catch (error) {
                lastError = error;
                const code = classifyError(error);
                if (!TRANSIENT_READ_CODES.has(code) || attempt === maxAttempts) throw error;
                await delay(delayMs * attempt);
            }
        }
        throw lastError;
    }

    function resolveElement(value) {
        if (!root?.document || !value) return null;
        if (typeof value === 'string') return root.document.querySelector(value);
        return value?.nodeType === 1 ? value : null;
    }

    function ensureStatusRegion(context = {}) {
        if (!root?.document) return null;
        let region = resolveElement(context.statusElement || context.statusSelector)
            || root.document.getElementById('radar-data-operation-status');
        if (!region) {
            region = root.document.createElement('div');
            region.id = 'radar-data-operation-status';
            region.className = 'sr-only';
            region.setAttribute('role', 'alert');
            region.setAttribute('aria-live', 'assertive');
            region.setAttribute('aria-atomic', 'true');
            root.document.body.appendChild(region);
        }
        return region;
    }

    function showDataOperationError(error, context = {}) {
        const sourceCode = String(error?.code || '').toUpperCase();
        const isBusinessRepositoryError = error instanceof RepositoryError
            && sourceCode
            && !DATA_ERROR_SET.has(sourceCode);
        const publicCode = isBusinessRepositoryError
            ? 'VALIDATION_FAILED'
            : classifyError(error, context.fallbackCode || 'TRANSACTION_FAILED');
        const incidentId = incidentIdFor(error, context);
        const phase = context.phase || error?.details?.unitOfWorkPhase || null;
        const rollbackConfirmed = context.rollbackConfirmed === true || error?.details?.rollbackConfirmed === true;
        const remoteCommitConfirmed = context.remoteCommitConfirmed === true || error?.details?.remoteCommitConfirmed === true;
        const publicMessage = publicMessageFor(publicCode, error, {
            ...context,
            phase,
            rollbackConfirmed,
            remoteCommitConfirmed,
            businessMessage: isBusinessRepositoryError ? error?.message : null
        }, incidentId);
        const mapped = toRepositoryError(error, {
            code: publicCode,
            operation: context.operation,
            entity: context.entity,
            message: publicMessage,
            incidentId,
            details: {
                incidentId,
                unitOfWorkPhase: phase,
                rollbackConfirmed,
                remoteCommitConfirmed
            }
        });
        mapped.incidentId = incidentId;
        const publicError = Object.freeze({
            code: mapped.code,
            incidentId,
            phase,
            rollbackConfirmed,
            remoteCommitConfirmed,
            message: mapped.message,
            operation: mapped.operation,
            entity: mapped.entity,
            occurredAt: new Date().toISOString()
        });
        if (root) root.RADAR_LAST_DATA_ERROR = publicError;

        root?.console?.error?.('[RADAR_DATA_ERROR]', {
            incidentId,
            code: mapped.code,
            phase,
            operation: mapped.operation,
            entity: mapped.entity,
            rollbackConfirmed,
            remoteCommitConfirmed,
            status: mapped.status ?? null,
            postgresCode: mapped.postgresCode ?? null,
            requestId: mapped.requestId ?? null,
            sourceCode: mapped.details?.sourceCode ?? null,
            technicalMessage: String(error?.message || ''),
            details: cloneValue(error?.details || {})
        });

        const region = ensureStatusRegion(context);
        if (region) {
            region.hidden = false;
            region.textContent = mapped.message;
        }

        const form = resolveElement(context.form || context.formSelector);
        if (form) {
            form.setAttribute('data-data-error', mapped.code);
            form.setAttribute('data-incident-id', incidentId);
            form.setAttribute('aria-describedby', region?.id || 'radar-data-operation-status');
        }

        const focusTarget = resolveElement(context.focusTarget || context.focusSelector)
            || (mapped.code === 'VALIDATION_FAILED'
                ? form?.querySelector('[aria-invalid="true"], :invalid, input, select, textarea, button')
                : null)
            || resolveElement(context.trigger);
        if (focusTarget && typeof focusTarget.focus === 'function') {
            root.requestAnimationFrame?.(() => focusTarget.focus({ preventScroll: true }));
        }

        if (root?.dispatchEvent && typeof root.CustomEvent === 'function') {
            root.dispatchEvent(new root.CustomEvent('radar:data-error', { detail: publicError }));
            if (mapped.code === 'SESSION_EXPIRED') {
                root.dispatchEvent(new root.CustomEvent('radar:session-expired', { detail: publicError }));
            }
        }
        return mapped;
    }

    return Object.freeze({
        DATA_ERROR_CODES,
        DATA_ERROR_MESSAGES,
        TRANSIENT_READ_CODES,
        classifyError,
        toRepositoryError,
        incidentIdFor,
        publicMessageFor,
        withSafeReadRetry,
        showDataOperationError
    });
}));
