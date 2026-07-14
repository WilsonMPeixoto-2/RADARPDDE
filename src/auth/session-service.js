(function installRadarSessionService(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const api = factory(contract);

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.RadarSessionService = Object.freeze(api);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createSessionServiceApi(contract) {
    'use strict';

    const cloneValue = contract?.cloneValue || (value => structuredClone(value));

    class SessionError extends Error {
        constructor(code, message, options = {}) {
            super(message);
            this.name = 'SessionError';
            this.code = code;
            this.operation = options.operation || null;
            this.cause = options.cause;
        }
    }

    function fail(code, message, operation, cause) {
        throw new SessionError(code, message, { operation, cause });
    }

    function normalizeProfileRelation(value) {
        if (Array.isArray(value)) return value[0] || null;
        return value && typeof value === 'object' ? value : null;
    }

    function normalizeUser(user) {
        if (!user) return null;
        const metadata = user.user_metadata || {};
        return {
            id: String(user.id || ''),
            email: String(user.email || ''),
            displayName: String(metadata.name || metadata.full_name || user.email || 'Usuário')
        };
    }

    function normalizeSession(session) {
        if (!session) return null;
        return {
            expiresAt: Number.isFinite(session.expires_at) ? session.expires_at : null,
            expiresIn: Number.isFinite(session.expires_in) ? session.expires_in : null
        };
    }

    class SessionService {
        constructor(options = {}) {
            if (!options.client?.auth
                || typeof options.client.auth.getSession !== 'function'
                || typeof options.client.auth.signInWithPassword !== 'function') {
                throw new SessionError(
                    'INVALID_AUTH_CLIENT',
                    'Um cliente Supabase Auth válido é obrigatório.',
                    { operation: 'construct' }
                );
            }
            this.client = options.client;
            this.state = this.createSignedOutState();
            this.listeners = new Set();
            this.waiters = new Set();
            this.subscription = null;
        }

        createSignedOutState() {
            return {
                status: 'signed_out',
                session: null,
                user: null,
                authorization: null
            };
        }

        getState() {
            return cloneValue(this.state);
        }

        getAuthorizationContext() {
            return this.state.authorization ? cloneValue(this.state.authorization) : null;
        }

        onChange(listener) {
            if (typeof listener !== 'function') return () => {};
            this.listeners.add(listener);
            return () => this.listeners.delete(listener);
        }

        publish(state) {
            this.state = state;
            const snapshot = this.getState();
            this.listeners.forEach(listener => listener(snapshot));
            if (state.status === 'authenticated') {
                this.waiters.forEach(waiter => waiter.resolve(snapshot));
                this.waiters.clear();
            }
            return snapshot;
        }

        initialize() {
            if (!this.subscription && typeof this.client.auth.onAuthStateChange === 'function') {
                const response = this.client.auth.onAuthStateChange((event, session) => {
                    if (event === 'SIGNED_OUT' || !session) {
                        this.publish(this.createSignedOutState());
                        return;
                    }
                    queueMicrotask(() => {
                        this.establish(session).catch(() => {
                            this.publish(this.createSignedOutState());
                        });
                    });
                });
                this.subscription = response?.data?.subscription || null;
            }
            return this.restore();
        }

        async restore() {
            const { data, error } = await this.client.auth.getSession();
            if (error) {
                fail('SESSION_EXPIRED', 'A sessão não pôde ser restaurada.', 'restore', error);
            }
            const session = data?.session || null;
            if (!session?.user) return this.publish(this.createSignedOutState());
            return this.establish(session);
        }

        async signIn(input = {}) {
            const email = String(input.email || '').trim();
            const password = String(input.password || '');
            if (!email || !password) {
                fail('VALIDATION_FAILED', 'Informe e-mail e senha.', 'signIn');
            }

            const { data, error } = await this.client.auth.signInWithPassword({ email, password });
            if (error || !data?.session?.user) {
                fail('INVALID_CREDENTIALS', 'E-mail ou senha inválidos.', 'signIn', error);
            }

            try {
                return await this.establish(data.session);
            } catch (authorizationError) {
                await this.client.auth.signOut().catch(() => null);
                this.publish(this.createSignedOutState());
                throw authorizationError;
            }
        }

        async signOut() {
            const { error } = await this.client.auth.signOut();
            if (error) fail('SIGN_OUT_FAILED', 'Não foi possível encerrar a sessão.', 'signOut', error);
            return this.publish(this.createSignedOutState());
        }

        waitForAuthenticated() {
            if (this.state.status === 'authenticated') {
                return Promise.resolve(this.getState());
            }
            return new Promise((resolve, reject) => {
                this.waiters.add({ resolve, reject });
            });
        }

        dispose() {
            this.subscription?.unsubscribe?.();
            this.subscription = null;
            this.listeners.clear();
            this.waiters.clear();
        }

        async establish(session) {
            const user = session?.user;
            if (!user?.id) fail('SESSION_EXPIRED', 'A sessão autenticada não possui usuário válido.', 'establish');
            const authorization = await this.loadAuthorization(user);
            return this.publish({
                status: 'authenticated',
                session: normalizeSession(session),
                user: normalizeUser(user),
                authorization
            });
        }

        async loadAuthorization(user) {
            const profilesResult = await this.client
                .from('user_profiles')
                .select('user_id, profile_id, controller_id, inventory_member_id, cre_scope, active, profiles ( id, label, active )')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });
            if (profilesResult.error) {
                fail('AUTHORIZATION_UNAVAILABLE', 'Não foi possível carregar o perfil institucional.', 'loadAuthorization', profilesResult.error);
            }

            const rows = Array.isArray(profilesResult.data) ? profilesResult.data : [];
            if (rows.length === 0) {
                fail('PROFILE_MISSING', 'O usuário autenticado não possui perfil institucional.', 'loadAuthorization');
            }
            const activeRows = rows.filter(row => (
                row?.active === true && normalizeProfileRelation(row.profiles)?.active !== false
            ));
            if (activeRows.length === 0) {
                fail('USER_INACTIVE', 'O perfil institucional deste usuário está inativo.', 'loadAuthorization');
            }
            if (activeRows.length > 1) {
                fail('MULTIPLE_ACTIVE_PROFILES', 'O usuário possui mais de um perfil ativo.', 'loadAuthorization');
            }

            const profileRow = activeRows[0];
            const profile = normalizeProfileRelation(profileRow.profiles) || {
                id: profileRow.profile_id,
                label: profileRow.profile_id,
                active: true
            };
            const roleResult = await this.client.rpc('current_app_role');
            if (roleResult.error) {
                fail('AUTHORIZATION_UNAVAILABLE', 'Não foi possível confirmar o papel institucional.', 'loadAuthorization', roleResult.error);
            }
            if (roleResult.data !== profileRow.profile_id) {
                fail('AUTHORIZATION_INCONSISTENT', 'O perfil do usuário diverge da autorização efetiva do banco.', 'loadAuthorization');
            }

            const scopesResult = await this.client
                .from('user_school_scopes')
                .select('school_id, can_write')
                .eq('user_id', user.id)
                .order('school_id', { ascending: true });
            if (scopesResult.error) {
                fail('AUTHORIZATION_UNAVAILABLE', 'Não foi possível carregar os escopos de escolas.', 'loadAuthorization', scopesResult.error);
            }

            return {
                userId: String(user.id),
                role: String(profileRow.profile_id),
                profile: {
                    id: String(profile.id || profileRow.profile_id),
                    label: String(profile.label || profileRow.profile_id)
                },
                controllerId: profileRow.controller_id || null,
                inventoryMemberId: profileRow.inventory_member_id || null,
                creScope: profileRow.cre_scope || null,
                scopes: (scopesResult.data || []).map(scope => ({
                    schoolId: String(scope.school_id),
                    canWrite: scope.can_write === true
                }))
            };
        }
    }

    return Object.freeze({
        SessionError,
        SessionService,
        normalizeSession,
        normalizeUser
    });
}));
