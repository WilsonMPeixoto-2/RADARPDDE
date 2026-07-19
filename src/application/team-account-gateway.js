(function installRadarTeamAccountGateway(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const api = factory(contract);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarTeamAccountGateway = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createTeamAccountGatewayApi(contract) {
    'use strict';

    if (!contract) throw new Error('RadarRepositoryContract é obrigatório.');
    const { RepositoryError, cloneValue } = contract;
    const FUNCTION_NAME = 'team-account-management';

    function errorCode(error, data) {
        const explicit = String(data?.code || error?.code || '').trim();
        if (explicit) return explicit;
        const message = String(data?.message || error?.message || '');
        const status = Number(error?.status || data?.status || 0);
        if (status === 401 || message.includes('SESSION_EXPIRED')) return 'SESSION_EXPIRED';
        if (status === 403 || message.includes('AUTHORIZATION_DENIED')) return 'PERMISSION_DENIED';
        if (message.includes('ACCOUNT_CONFLICT')) return 'ACCOUNT_CONFLICT';
        if (message.includes('VALIDATION')) return 'VALIDATION_FAILED';
        return 'REMOTE_UNAVAILABLE';
    }

    class TeamAccountGateway {
        constructor(options = {}) {
            this.enabled = options.enabled !== false;
            this.client = options.client || null;
            if (this.enabled && typeof this.client?.functions?.invoke !== 'function') {
                throw new RepositoryError(
                    'MISSING_FUNCTIONS_CLIENT',
                    'O cliente Supabase não oferece execução de Edge Functions.',
                    { operation: 'constructTeamAccountGateway' }
                );
            }
        }

        async invoke(operation, payload = {}) {
            if (!this.enabled) {
                throw new RepositoryError(
                    'REMOTE_UNAVAILABLE',
                    'O provisionamento remoto de contas não está habilitado.',
                    { operation }
                );
            }
            let result;
            try {
                result = await this.client.functions.invoke(FUNCTION_NAME, {
                    body: { operation, ...cloneValue(payload) }
                });
            } catch (error) {
                throw new RepositoryError(
                    errorCode(error),
                    error?.message || 'Não foi possível acessar o serviço de contas da equipe.',
                    { operation, cause: error }
                );
            }

            if (result?.error || result?.data?.ok === false) {
                const source = result?.data || result?.error || {};
                throw new RepositoryError(
                    errorCode(result?.error, result?.data),
                    source.message || 'A operação de acesso da equipe foi recusada.',
                    {
                        operation,
                        cause: result?.error || null,
                        details: cloneValue(source.details || {})
                    }
                );
            }
            return cloneValue(result?.data ?? { ok: true });
        }

        saveController(input) {
            return this.invoke('save_controller', input);
        }

        deactivateController(input) {
            return this.invoke('deactivate_controller', input);
        }

        saveInventoryMember(input) {
            return this.invoke('save_inventory_member', input);
        }

        deactivateInventoryMember(input) {
            return this.invoke('deactivate_inventory_member', input);
        }
    }

    return Object.freeze({ TeamAccountGateway, FUNCTION_NAME });
}));
