(function installRadarAuthGate(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    if (root) {
        root.RadarAuthGateApi = Object.freeze(api);
        if (root.document) {
            root.RadarAuthGate = new api.AuthGate({ root, document: root.document });
            root.RadarAuthGate.initialize();
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

    class AuthGate {
        constructor(options = {}) {
            this.root = options.root;
            this.document = options.document;
            this.enabled = this.root?.RADAR_PDDE_CONFIG?.supabase?.connectionEnabled === true;
            this.bound = false;
        }

        initialize() {
            this.bind();
            this.root.addEventListener('radar:auth-required', event => {
                this.show(event?.detail?.message || 'Entre para acessar o RADAR PDDE.');
            });
            if (!this.enabled) {
                this.document.documentElement.classList.remove('radar-auth-required');
                return;
            }
            this.show('Entre para acessar o RADAR PDDE.');
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

        show(message) {
            this.document.documentElement.classList.add('radar-auth-required');
            const app = this.document.getElementById('app-layout');
            if (app) app.inert = true;
            this.setStatus(message || 'Entre para acessar o RADAR PDDE.', 'info');
            this.root.requestAnimationFrame?.(() => {
                this.document.getElementById('radar-auth-email')?.focus();
            });
        }

        hide() {
            this.document.documentElement.classList.remove('radar-auth-required');
            const app = this.document.getElementById('app-layout');
            if (app) app.inert = false;
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

        renderTechnicalAccess(authentication) {
            this.setAuthenticationContext(authentication);
            this.setOperationalChromeVisible(false);
            const container = this.document.getElementById('main-container');
            if (container) {
                container.innerHTML = `
                    <section class="panel-card radar-technical-access" aria-labelledby="technical-access-title">
                        <h1 id="technical-access-title">Acesso técnico</h1>
                        <p>Esta conta administra segurança, perfis, escopos e infraestrutura do RADAR PDDE.</p>
                        <p>Não há uma superfície operacional atribuída a este papel. As ações técnicas permanecem separadas do trabalho cotidiano da equipe.</p>
                    </section>
                `;
            }
            this.hide();
            return null;
        }

        applyAuthorization(authentication) {
            if (!this.enabled || !authentication?.authorization) return null;
            const authorization = authentication.authorization;
            if (isTechnicalRole(authorization.role)) {
                return this.renderTechnicalAccess(authentication);
            }

            const operationalProfile = operationalProfileForRole(authorization.role);
            this.setOperationalChromeVisible(true);
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
                }
            }
            this.root.RadarAuthContext = null;
            this.show('Sessão encerrada. Entre novamente para continuar.');
            this.document.getElementById('radar-auth-email')?.focus();
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
