(function installRadarAuthGate(root, factory) {
    'use strict';

    const NAVIGATION_SCRIPTS = Object.freeze([
        '/src/integration/navigation-routes.js',
        '/src/integration/navigation-policy.js',
        '/src/integration/navigation-bootstrap.js',
        '/src/integration/navigation-history.js'
    ]);

    function loadScriptOnce(document, src) {
        const existing = Array.from(document.scripts || []).find(script => (
            script.dataset?.radarNavigationScript === src
            || script.getAttribute?.('src') === src
        ));
        if (existing?.dataset?.radarLoaded === 'true') return Promise.resolve(existing);
        if (existing) {
            return new Promise((resolve, reject) => {
                existing.addEventListener('load', () => resolve(existing), { once: true });
                existing.addEventListener('error', () => reject(new Error(`Falha ao carregar ${src}.`)), { once: true });
            });
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            script.dataset.radarNavigationScript = src;
            script.addEventListener('load', () => {
                script.dataset.radarLoaded = 'true';
                resolve(script);
            }, { once: true });
            script.addEventListener('error', () => reject(new Error(`Falha ao carregar ${src}.`)), { once: true });
            document.head.appendChild(script);
        });
    }

    function waitForAuthorizedData(root) {
        return new Promise(resolve => {
            const tryApply = () => {
                const remoteEnabled = root.RADAR_PDDE_CONFIG?.supabase?.connectionEnabled === true;
                const dataReady = root.RadarDataContext?.ready === true;
                const authReady = !remoteEnabled || Boolean(root.RadarAuthContext?.authorization);
                const competenceReady = Boolean(
                    root.RadarCompetenceContext?.isInitialized?.()
                );
                const navigationReady = Boolean(
                    root.RadarNavigationHistory
                    && root.__radarNavigationHistoryInstalled
                );
                if (dataReady && authReady && competenceReady && navigationReady) {
                    resolve(root.RadarNavigationHistory.applyPendingRoute(root));
                    return true;
                }
                return false;
            };

            if (tryApply()) return;
            const interval = root.setInterval(() => {
                if (tryApply()) root.clearInterval(interval);
            }, 20);
        });
    }

    function installNavigationModules(root) {
        if (root.RadarNavigationReady) return root.RadarNavigationReady;
        root.RadarNavigationReady = NAVIGATION_SCRIPTS.reduce(
            (promise, src) => promise.then(() => loadScriptOnce(root.document, src)),
            Promise.resolve()
        ).then(() => waitForAuthorizedData(root)).catch(error => {
            root.RADAR_LAST_NAVIGATION_ERROR = error;
            console.error('Não foi possível inicializar as rotas internas do RADAR.', error);
            return false;
        });
        return root.RadarNavigationReady;
    }

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.RadarAuthGateApi = Object.freeze(api);
        if (root.document) {
            root.RadarAuthGate = new api.AuthGate({ root, document: root.document });
            root.RadarAuthGate.initialize();
            installNavigationModules(root);
        }
    }
}(typeof window !== 'undefined' ? window : globalThis, function createAuthGateApi() {
    'use strict';

    const ROLE_TO_OPERATIONAL_PROFILE = Object.freeze({
        controller: 'controlador',
        federal_assistant: 'assistente',
        inventory: 'inventario',
        sme_management: 'sme'
    });
    const TECHNICAL_ROLES = Object.freeze(new Set(['technical_admin']));
    const TECHNICAL_HIDDEN_SELECTORS = Object.freeze([
        '.search-bar-container',
        '#global-competence-badge',
        '#exercise-select',
        '#theme-toggle-btn',
        '#alerts-bell-container'
    ]);
    const AUTH_DESCRIPTION = 'Entre com sua conta autorizada para acessar os dados do RADAR PDDE.';
    const AUTH_RESOLVING_DESCRIPTION = 'Verificando a sessão existente antes de liberar o acesso…';
    const AUTH_LOADING_DATA_DESCRIPTION = 'Sessão reconhecida. Carregando os dados autorizados…';
    const WORKSPACE_ERROR_DESCRIPTION = 'Sua autenticação foi confirmada, mas o ambiente de trabalho não pôde ser preparado.';
    const WORKSPACE_ERROR_STATUS = 'Não foi possível carregar o ambiente de trabalho. Recarregue para tentar novamente.';

    function isTechnicalRole(role) {
        return TECHNICAL_ROLES.has(String(role || ''));
    }

    function operationalProfileForRole(role) {
        const normalizedRole = String(role || '');
        if (isTechnicalRole(normalizedRole)) {
            throw new Error('Papel técnico não possui perfil operacional na interface.');
        }
        const profile = ROLE_TO_OPERATIONAL_PROFILE[normalizedRole];
        if (!profile) throw new Error('Perfil institucional não reconhecido pela interface.');
        return profile;
    }

    function setForcedDisplay(element, hidden) {
        if (!element) return;
        element.hidden = hidden;
        element.setAttribute?.('aria-hidden', hidden ? 'true' : 'false');
        if (!element.style) return;
        if (hidden) element.style.setProperty?.('display', 'none', 'important');
        else element.style.removeProperty?.('display');
    }

    function errorCode(error) {
        const code = String(error?.code || '').trim();
        return code || 'WORKSPACE_STARTUP_FAILED';
    }

    class AuthGate {
        constructor(options = {}) {
            this.root = options.root;
            this.document = options.document;
            this.enabled = this.root?.RADAR_PDDE_CONFIG?.supabase?.connectionEnabled === true;
            this.bound = false;
            this.phase = 'idle';
        }

        initialize() {
            this.bind();
            this.root.addEventListener('radar:auth-required', event => {
                this.show(event?.detail?.message || 'Entre para acessar o RADAR PDDE.');
            });
            this.root.addEventListener('radar:auth-resolved', event => {
                this.showLoadingData(event?.detail?.authentication || null);
            });
            this.root.addEventListener('unhandledrejection', event => {
                if (this.phase !== 'loading_data') return;
                event?.preventDefault?.();
                this.showWorkspaceError(event?.reason, { stage: 'post-auth-workspace' });
            });
            this.root.addEventListener('error', event => {
                if (this.phase !== 'loading_data') return;
                event?.preventDefault?.();
                this.showWorkspaceError(event?.error, { stage: 'post-auth-workspace' });
            });
            if (!this.enabled) {
                this.document.documentElement.classList.remove('radar-auth-required');
                this.setFormVisible(false);
                return;
            }
            this.showResolving();
        }

        bind() {
            if (this.bound) return;
            const form = this.document.getElementById('radar-auth-form');
            const logout = this.document.getElementById('auth-logout-button');
            if (!form) return;
            this.bound = true;
            form.addEventListener('submit', event => this.handleSubmit(event));
            logout?.addEventListener('click', () => this.handleSignOut());
            const switcher = this.document.querySelector('.profile-switcher');
            if (switcher && this.enabled) {
                switcher.hidden = true;
                switcher.setAttribute('aria-hidden', 'true');
            }
            if (logout) logout.hidden = false;
        }

        setFormVisible(visible) {
            const form = this.document.getElementById('radar-auth-form');
            if (!form) return;
            form.hidden = !visible;
            form.inert = !visible;
            form.setAttribute?.('aria-hidden', visible ? 'false' : 'true');
        }

        setWorkspaceErrorMode(active) {
            const form = this.document.getElementById('radar-auth-form');
            if (!form) return;
            Array.from(form.querySelectorAll?.('.form-group') || []).forEach(field => {
                field.hidden = active;
            });
            const submit = form.querySelector?.('[type="submit"]');
            if (submit) {
                submit.hidden = false;
                submit.disabled = false;
                submit.textContent = active ? 'Recarregar ambiente' : 'Entrar';
            }
            if (form.dataset) {
                if (active) form.dataset.mode = 'workspace-error';
                else delete form.dataset.mode;
            }
        }

        setDescription(message) {
            const description = this.document.getElementById('radar-auth-description');
            if (description) description.textContent = message || AUTH_DESCRIPTION;
        }

        showResolving() {
            this.phase = 'resolving';
            this.document.documentElement.classList.add('radar-auth-required');
            const app = this.document.getElementById('app-layout');
            if (app) app.inert = true;
            this.setWorkspaceErrorMode(false);
            this.setDescription(AUTH_RESOLVING_DESCRIPTION);
            this.setFormVisible(false);
        }

        showLoadingData(authentication) {
            this.phase = 'loading_data';
            this.document.documentElement.classList.add('radar-auth-required');
            const app = this.document.getElementById('app-layout');
            if (app) app.inert = true;
            if (authentication?.authorization) this.setAuthenticationContext(authentication);
            this.setWorkspaceErrorMode(false);
            this.setDescription(AUTH_LOADING_DATA_DESCRIPTION);
            this.setFormVisible(false);
            this.setStatus('Acesso confirmado. Preparando o ambiente de trabalho…', 'success');
        }

        showWorkspaceError(error, options = {}) {
            this.phase = 'workspace_error';
            this.document.documentElement.classList.add('radar-auth-required');
            const app = this.document.getElementById('app-layout');
            if (app) app.inert = true;
            const stage = String(options.stage || 'post-auth-workspace');
            const code = errorCode(error);
            this.root.RADAR_STARTUP_DIAGNOSTICS = Object.freeze({
                stage,
                code,
                occurredAt: new Date().toISOString()
            });
            this.root.console?.error?.(
                `Falha ao preparar o ambiente do RADAR (${stage}/${code}).`,
                error
            );
            this.setWorkspaceErrorMode(true);
            this.setDescription(WORKSPACE_ERROR_DESCRIPTION);
            this.setFormVisible(true);
            this.setStatus(WORKSPACE_ERROR_STATUS, 'error');
        }

        show(message) {
            this.phase = 'required';
            this.document.documentElement.classList.add('radar-auth-required');
            const app = this.document.getElementById('app-layout');
            if (app) app.inert = true;
            this.setWorkspaceErrorMode(false);
            this.setDescription(AUTH_DESCRIPTION);
            this.setFormVisible(true);
            this.setStatus(message || 'Entre para acessar o RADAR PDDE.', 'info');
            this.root.requestAnimationFrame?.(() => {
                this.document.getElementById('radar-auth-email')?.focus();
            });
        }

        hide() {
            this.phase = 'authenticated';
            this.document.documentElement.classList.remove('radar-auth-required');
            const app = this.document.getElementById('app-layout');
            if (app) app.inert = false;
            this.setWorkspaceErrorMode(false);
            this.setFormVisible(false);
            this.setDescription(AUTH_DESCRIPTION);
            this.setStatus('', 'info');
        }

        setStatus(message, type = 'info') {
            const status = this.document.getElementById('radar-auth-status');
            if (!status) return;
            status.textContent = message || '';
            status.dataset.type = type;
        }

        async handleSubmit(event) {
            event.preventDefault();
            if (this.phase === 'workspace_error') {
                this.root.location?.reload?.();
                return;
            }
            if (this.enabled && this.phase !== 'required') {
                this.setStatus('A autenticação ainda está inicializando. Aguarde.', 'info');
                return;
            }
            const form = event.currentTarget;
            const submit = form.querySelector('[type="submit"]');
            const email = this.document.getElementById('radar-auth-email')?.value || '';
            const password = this.document.getElementById('radar-auth-password')?.value || '';
            const service = this.root.RadarSessionContext?.service;
            if (!service) {
                if (!this.enabled) {
                    this.setStatus('Sessão local iniciada.', 'success');
                    this.hide();
                    return;
                }
                this.setStatus('A autenticação ainda está inicializando. Tente novamente.', 'error');
                return;
            }

            if (submit) submit.disabled = true;
            form.setAttribute('aria-busy', 'true');
            this.setStatus('Autenticando…', 'info');
            try {
                await service.signIn({ email, password });
                const passwordInput = this.document.getElementById('radar-auth-password');
                if (passwordInput) passwordInput.value = '';
                this.setStatus('Sessão validada. Carregando dados autorizados…', 'success');
                if (this.root.RadarDataContext?.ready === true) {
                    this.root.location?.reload?.();
                }
            } catch (error) {
                this.setStatus(error?.message || 'Não foi possível autenticar.', 'error');
                this.document.getElementById('radar-auth-email')?.focus();
            } finally {
                if (submit) submit.disabled = false;
                form.removeAttribute('aria-busy');
            }
        }

        setAuthenticationContext(authentication) {
            const authorization = authentication.authorization;
            this.root.RadarAuthContext = Object.freeze({
                user: Object.freeze({ ...(authentication.user || {}) }),
                authorization: Object.freeze({ ...authorization })
            });
            const label = this.document.getElementById('profile-btn-label');
            if (label) label.textContent = authorization.profile?.label || authorization.role;
            this.document.body.dataset.authRole = authorization.role;
        }

        setOperationalChromeVisible(visible) {
            setForcedDisplay(this.document.querySelector('.sidebar'), !visible);
            TECHNICAL_HIDDEN_SELECTORS.forEach(selector => {
                setForcedDisplay(this.document.querySelector(selector), !visible);
            });
            const app = this.document.getElementById('app-layout');
            if (app?.style) {
                if (visible) app.style.removeProperty?.('grid-template-columns');
                else app.style.setProperty?.('grid-template-columns', '1fr', 'important');
            }
        }

        setProfileSwitcherVisible(visible) {
            setForcedDisplay(this.document.querySelector('.profile-switcher'), !visible);
        }

        renderTechnicalAccess(authentication) {
            const defaultOperationalProfile = 'controlador';
            this.setAuthenticationContext(authentication);
            this.setOperationalChromeVisible(true);
            this.setProfileSwitcherVisible(true);
            this.root.switchProfile(defaultOperationalProfile);
            this.hide();
            return defaultOperationalProfile;
        }

        applyAuthorization(authentication) {
            if (!this.enabled || !authentication?.authorization) return null;
            const authorization = authentication.authorization;
            if (isTechnicalRole(authorization.role)) {
                return this.renderTechnicalAccess(authentication);
            }

            const operationalProfile = operationalProfileForRole(authorization.role);
            this.setOperationalChromeVisible(true);
            this.setProfileSwitcherVisible(false);
            this.setAuthenticationContext(authentication);
            this.root.switchProfile(operationalProfile);
            this.hide();
            return operationalProfile;
        }

        async handleSignOut() {
            const service = this.root.RadarSessionContext?.service;
            if (service) {
                try {
                    await service.signOut();
                } catch (error) {
                    this.setStatus(error?.message || 'Não foi possível encerrar a sessão remotamente.', 'error');
                    return false;
                }
            }
            this.root.RadarAuthContext = null;
            if (this.enabled && typeof this.root.location?.reload === 'function') {
                this.root.location.reload();
                return true;
            }
            this.show('Sessão encerrada. Entre novamente para continuar.');
            this.document.getElementById('radar-auth-email')?.focus();
            return true;
        }
    }

    return Object.freeze({
        AuthGate,
        ROLE_TO_OPERATIONAL_PROFILE,
        operationalProfileForRole,
        isTechnicalRole,
        // Compatibilidade de importação para consumidores anteriores; o conteúdo já exclui o papel técnico.
        ROLE_TO_LEGACY_PROFILE: ROLE_TO_OPERATIONAL_PROFILE,
        legacyProfileForRole: operationalProfileForRole
    });
}));