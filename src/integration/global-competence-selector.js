(function installGlobalCompetenceSelector(root, factory) {
    'use strict';

    const domain = typeof module !== 'undefined' && module.exports
        ? require('../domain/competence-context.js')
        : root.RadarCompetenceContextDomain;
    const api = factory(domain);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarGlobalCompetenceSelector = Object.freeze(api);
    if (root?.document) api.install(root);
}(typeof window !== 'undefined' ? window : globalThis, function createGlobalCompetenceSelectorApi(domain) {
    'use strict';

    if (!domain?.createCompetenceContext) {
        throw new Error('RadarCompetenceContextDomain deve ser carregado antes do seletor global.');
    }

    const { createCompetenceContext } = domain;
    const ROOT_ID = 'global-competence-control';
    let hydrationSequence = 0;
    let lastHydratedCompetence = '';
    let suppressHydrationOnce = false;

    function runtimeReady(root) {
        return Boolean(
            root?.document
            && root.RadarDataContext?.ready === true
            && Array.isArray(root.COMPETENCIAS)
            && root.config
        );
    }

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function currentCalendarCompetence(competences = []) {
        const now = new Date();
        const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return competences.some(item => text(item?.key) === key) ? key : '';
    }

    function readRuntimeState(root) {
        const competences = Array.isArray(root.COMPETENCIAS) ? root.COMPETENCIAS : [];
        const exercises = Array.isArray(root.config?.exercicios)
            ? root.config.exercicios.map(String).filter(Boolean)
            : [];
        const persistedCompetence = text(root.activeCompetenciaKey);
        const activeExercise = text(root.currentExercise);
        const calendarCompetence = currentCalendarCompetence(competences);
        const initialCompetence = [
            calendarCompetence,
            persistedCompetence,
            text(root.config?.competenciaFechamento),
            text(competences[0]?.key)
        ].find(key => /^\d{4}-\d{2}$/.test(key) && competences.some(item => item.key === key)) || '';
        const initialExercise = [
            initialCompetence.slice(0, 4),
            persistedCompetence.slice(0, 4),
            activeExercise,
            exercises[0]
        ].find(year => exercises.includes(year)) || exercises[0] || '';
        return { competences, exercises, initialCompetence, initialExercise };
    }

    function currentView(root) {
        const active = root.document.querySelector('.nav-item.active[data-view]');
        return text(active?.dataset?.view || root.currentView || 'dashboard') || 'dashboard';
    }

    function refreshCurrentView(root) {
        const view = currentView(root);
        const schoolId = text(root.activeProntuarioSchoolId || root.currentSchoolId);
        if (typeof root.switchView === 'function') {
            root.switchView(view, schoolId || undefined);
            return true;
        }
        return false;
    }

    function remoteDataService(root) {
        const service = root.RadarApplicationServices?.data;
        if (!service || typeof service.loadOperationalContext !== 'function') return null;
        try {
            return service.repository?.capabilities?.().remote === true ? service : null;
        } catch (_error) {
            return null;
        }
    }

    function setContextBusy(root, busy) {
        const selector = root.document.getElementById('global-competence-select');
        const main = root.document.getElementById('main-container');
        if (selector) {
            selector.disabled = busy === true;
            selector.setAttribute('aria-busy', String(busy === true));
        }
        if (main) main.setAttribute('aria-busy', String(busy === true));
    }

    function emitOperationalContext(root, state, source) {
        if (typeof root.dispatchEvent !== 'function' || typeof root.CustomEvent !== 'function') return;
        root.dispatchEvent(new root.CustomEvent('radar:operational-context-refreshed', {
            detail: {
                competenceKey: state.activeKey,
                source
            }
        }));
    }

    async function hydrateRemoteState(root, context, state, meta = {}) {
        const service = remoteDataService(root);
        if (!service) {
            refreshCurrentView(root);
            return true;
        }

        const sequence = ++hydrationSequence;
        setContextBusy(root, true);
        try {
            const loaded = await service.loadOperationalContext(state.activeKey, {
                source: 'competence-change'
            });
            if (sequence !== hydrationSequence || loaded?.stale === true) return false;
            if (context.getState()?.activeKey !== state.activeKey) return false;
            lastHydratedCompetence = state.activeKey;
            refreshCurrentView(root);
            emitOperationalContext(root, state, meta.source || 'competence-change');
            return true;
        } catch (error) {
            root.console?.error?.('Não foi possível carregar a competência selecionada no Supabase.', error);
            if (sequence !== hydrationSequence) return false;
            const fallback = text(lastHydratedCompetence);
            if (fallback && fallback !== state.activeKey) {
                suppressHydrationOnce = true;
                try {
                    context.select(fallback, { source: 'remote-hydration-rollback' });
                } catch (_rollbackError) {
                    suppressHydrationOnce = false;
                }
            }
            if (typeof root.alert === 'function') {
                root.alert('Não foi possível carregar os dados desta competência. A última competência confirmada foi mantida.');
            }
            return false;
        } finally {
            if (sequence === hydrationSequence) setContextBusy(root, false);
        }
    }

    function createControl(root) {
        const document = root.document;
        let container = document.getElementById(ROOT_ID);
        if (container) return container;

        const host = document.querySelector('.top-header-actions')
            || document.querySelector('.top-header');
        if (!host) return null;

        container = document.createElement('div');
        container.id = ROOT_ID;
        container.className = 'global-competence-control';
        container.innerHTML = `
            <label for="global-competence-select">Competência</label>
            <select id="global-competence-select" aria-label="Competência mensal ativa"></select>
            <span id="global-competence-label" class="global-competence-label" aria-live="polite"></span>
        `;
        host.prepend(container);
        return container;
    }

    function renderControl(root, context) {
        const container = createControl(root);
        if (!container) return false;
        const select = container.querySelector('#global-competence-select');
        const label = container.querySelector('#global-competence-label');
        const state = context.getState();
        const available = context.listAvailable().map(item => ({
            key: item.key,
            label: item.label || item.key
        }));

        const signature = available.map(item => `${item.key}:${item.label}`).join('|');
        if (select.dataset.signature !== signature) {
            select.replaceChildren(...available.map(item => {
                const option = root.document.createElement('option');
                option.value = item.key;
                option.textContent = item.label;
                return option;
            }));
            select.dataset.signature = signature;
        }
        if (select.value !== state.activeKey) select.value = state.activeKey;
        const current = available.find(item => item.key === state.activeKey);
        label.textContent = current?.label || state.activeKey;
        return true;
    }

    function applyState(root, context, state, meta = {}) {
        root.activeCompetenciaKey = state.activeKey;
        root.currentExercise = state.exercise;
        root.activeProntuarioCompetencia = state.activeKey;
        try {
            activeCompetenciaKey = state.activeKey;
            currentExercise = state.exercise;
            activeProntuarioCompetencia = state.activeKey;
        } catch (_error) {
            // bindings globais opcionais
        }
        renderControl(root, context);
        if (typeof root.syncExerciseSelectsFromState === 'function') {
            root.syncExerciseSelectsFromState();
        }

        const service = remoteDataService(root);
        if (meta.initial === true) {
            lastHydratedCompetence = text(service?.currentOperationalCompetence) || state.activeKey;
        } else if (suppressHydrationOnce) {
            suppressHydrationOnce = false;
            lastHydratedCompetence = state.activeKey;
            refreshCurrentView(root);
        } else if (service) {
            void hydrateRemoteState(root, context, state, meta);
        } else {
            refreshCurrentView(root);
        }

        if (typeof root.dispatchEvent === 'function' && typeof root.CustomEvent === 'function') {
            root.dispatchEvent(new root.CustomEvent('radar:competence-change', {
                detail: {
                    state,
                    source: meta.source || 'context'
                }
            }));
        }
    }

    function initializeContext(root) {
        const runtime = readRuntimeState(root);
        const context = createCompetenceContext({
            competences: runtime.competences,
            exercises: runtime.exercises,
            closingKey: root.config?.competenciaFechamento,
            initialCompetence: runtime.initialCompetence,
            initialExercise: runtime.initialExercise,
            storage: root.sessionStorage || null,
            calendarDate: new Date()
        });
        root.RadarCompetenceContext = context;
        const state = context.initialize();
        applyState(root, context, state, { initial: true, source: 'bootstrap' });
        context.subscribe((next, meta) => applyState(root, context, next, meta));
        return context;
    }

    function install(root = globalThis) {
        if (!root?.document) return false;
        if (root.__radarGlobalCompetenceSelectorInstalled === true) return true;

        const start = () => {
            if (!runtimeReady(root)) return false;
            const context = root.RadarCompetenceContext?.getState
                ? root.RadarCompetenceContext
                : initializeContext(root);
            renderControl(root, context);

            const select = root.document.getElementById('global-competence-select');
            if (select && select.dataset.bound !== 'true') {
                select.addEventListener('change', event => {
                    const key = text(event.target.value);
                    try {
                        context.select(key, { source: 'global-selector' });
                    } catch (error) {
                        renderControl(root, context);
                        root.console?.error?.('Não foi possível alterar a competência global.', error);
                    }
                });
                select.dataset.bound = 'true';
            }

            root.handleCompetenceChange = event => {
                const key = text(event?.target?.value);
                if (!key) return false;
                try {
                    context.select(key, { source: 'legacy-selector-bridge' });
                    return true;
                } catch (error) {
                    root.console?.error?.('Não foi possível alterar a competência global.', error);
                    return false;
                }
            };
            try { handleCompetenceChange = root.handleCompetenceChange; } catch (_error) { /* binding legado */ }
            root.__radarGlobalCompetenceSelectorInstalled = true;
            return true;
        };

        if (start()) return true;
        root.addEventListener?.('radar:data-ready', start, { once: true });
        return false;
    }

    return Object.freeze({
        ROOT_ID,
        install,
        readRuntimeState,
        currentCalendarCompetence,
        remoteDataService,
        hydrateRemoteState
    });
}));
