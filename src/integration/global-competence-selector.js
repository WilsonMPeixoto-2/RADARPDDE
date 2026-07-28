(function installGlobalCompetenceSelector(root, factory) {
    'use strict';

    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (!root) return;
    root.RadarGlobalCompetenceSelector = Object.freeze(api);
    if (typeof document !== 'undefined') api.install();
}(typeof window !== 'undefined' ? window : globalThis, function createGlobalCompetenceSelectorApi(root) {
    'use strict';

    let installed = false;
    let contextUnsubscribe = null;
    let retryTimer = null;
    let originalRenderCompetencias = null;
    let originalCreateExerciseFromForm = null;

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function competenceExercise(value) {
        const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(text(value));
        return match ? match[1] : '';
    }

    function competenceExists(value) {
        const key = text(value);
        return COMPETENCIAS.some(item => text(item?.key || item?.id) === key);
    }

    function runtimeReady() {
        return Boolean(
            root.RadarCompetenceContext
            && typeof root.RadarCompetenceContext.initialize === 'function'
            && typeof COMPETENCIAS !== 'undefined'
            && Array.isArray(COMPETENCIAS)
            && typeof config !== 'undefined'
            && config
            && typeof currentExercise !== 'undefined'
            && root.RadarDataContext?.ready === true
        );
    }

    function readRuntimeState() {
        const closingCompetence = text(config.competenciaFechamento);
        const initialCompetence = typeof activeCompetenciaKey !== 'undefined'
            ? text(activeCompetenciaKey)
            : '';
        const storedCompetence = text(
            root.localStorage?.getItem(root.RadarCompetenceContext.STORAGE_KEY)
        );
        const persistedCompetence = competenceExists(storedCompetence) ? storedCompetence : '';
        const resolvedExercise = competenceExercise(persistedCompetence)
            || competenceExercise(initialCompetence)
            || competenceExercise(closingCompetence)
            || text(currentExercise)
            || text(config.exercicios?.[0]);

        return {
            competences: COMPETENCIAS,
            currentExercise: resolvedExercise,
            closingCompetence,
            initialCompetence
        };
    }

    function formatLabel(key) {
        const item = COMPETENCIAS.find(competence => text(competence?.key || competence?.id) === key);
        if (item?.label) return text(item.label);
        if (root.RadarCompetencia?.formatCompetencia) {
            return root.RadarCompetencia.formatCompetencia(key, { format: 'display' });
        }
        return key;
    }

    function createElement(tagName, properties = {}) {
        const element = document.createElement(tagName);
        Object.entries(properties).forEach(([key, value]) => {
            if (key === 'textContent') element.textContent = value;
            else if (key === 'className') element.className = value;
            else element.setAttribute(key, value);
        });
        return element;
    }

    function ensureControlMarkup() {
        const badge = document.getElementById('global-competence-badge');
        if (!badge) return null;
        if (badge.dataset.radarCompetenceControl === 'true') {
            return document.getElementById('global-competence-select');
        }

        badge.dataset.radarCompetenceControl = 'true';
        badge.classList.add('global-competence-control');
        badge.removeAttribute('title');
        badge.replaceChildren();

        const controlLabel = createElement('label', {
            for: 'global-competence-select',
            textContent: 'Competência'
        });
        const select = createElement('select', {
            id: 'global-competence-select',
            className: 'global-competence-select',
            'aria-describedby': 'global-competence-help global-competence-label'
        });
        const currentLabel = createElement('span', {
            id: 'global-competence-label',
            className: 'global-competence-current',
            'aria-live': 'polite'
        });
        const help = createElement('span', {
            id: 'global-competence-help',
            className: 'sr-only',
            textContent: 'A seleção atualiza todas as telas e exportações mensais.'
        });
        badge.append(controlLabel, select, currentLabel, help);
        return select;
    }

    function renderSelector(state = root.RadarCompetenceContext.getState()) {
        const select = ensureControlMarkup();
        if (!select) return false;
        const records = root.RadarCompetenceContext.getAvailableForExercise(state.exercise);
        const previous = select.value;
        const fragment = document.createDocumentFragment();
        records.forEach(item => {
            const option = document.createElement('option');
            option.value = item.key;
            option.textContent = item.label || formatLabel(item.key);
            fragment.appendChild(option);
        });
        select.replaceChildren(fragment);
        select.value = records.some(item => item.key === state.activeKey)
            ? state.activeKey
            : (previous || records[0]?.key || '');
        const label = document.getElementById('global-competence-label');
        if (label) label.textContent = formatLabel(state.activeKey);
        return true;
    }

    function removeLocalCompetenceControl() {
        const select = document.getElementById('comp-select-view');
        if (!select) return;
        const wrapper = select.parentElement;
        if (wrapper) wrapper.remove();
        else select.remove();
    }

    function refreshCurrentView() {
        if (typeof updateGlobalCompetenceIndicator === 'function') {
            updateGlobalCompetenceIndicator();
        }
        if (typeof switchView === 'function' && typeof currentView !== 'undefined') {
            switchView(currentView, typeof activeSchoolId !== 'undefined' ? activeSchoolId : null);
        }
        removeLocalCompetenceControl();
    }

    function applyState(state, meta = {}) {
        if (typeof activeCompetenciaKey !== 'undefined') activeCompetenciaKey = state.activeKey;
        if (typeof currentExercise !== 'undefined') currentExercise = state.exercise;
        if (typeof activeProntuarioCompetencia !== 'undefined') activeProntuarioCompetencia = null;
        renderSelector(state);
        const exerciseSelect = document.getElementById('exercise-select');
        if (exerciseSelect && exerciseSelect.value !== state.exercise) exerciseSelect.value = state.exercise;
        if (meta.initial !== true) refreshCurrentView();
        root.dispatchEvent?.(new CustomEvent('radar:competence-change', {
            detail: { ...state, source: text(meta.source) || 'context' }
        }));
    }

    function initializeContext() {
        if (!runtimeReady()) return false;
        const runtimeState = readRuntimeState();
        root.RadarCompetenceContext.initialize({
            ...runtimeState,
            storage: root.localStorage
        });
        if (contextUnsubscribe) contextUnsubscribe();
        contextUnsubscribe = root.RadarCompetenceContext.subscribe((state, meta) => applyState(state, meta));
        const state = root.RadarCompetenceContext.getState();
        applyState(state, { initial: true, source: 'initialize' });
        wrapLegacyEntryPoints();
        return true;
    }

    function handleCompetenceChange(event) {
        try {
            root.RadarCompetenceContext.select(event.target.value, { source: 'global-selector' });
        } catch (error) {
            renderSelector();
            root.alert?.(error?.message || 'Não foi possível alterar a competência.');
        }
    }

    function installSelectorListener() {
        const select = ensureControlMarkup();
        if (!select || select.dataset.radarCompetenceBound === 'true') return;
        select.dataset.radarCompetenceBound = 'true';
        select.addEventListener('change', handleCompetenceChange);
    }

    function wrapLegacyEntryPoints() {
        root.changeExercise = function changeExerciseFromGlobalContext(value) {
            try {
                root.RadarCompetenceContext.selectExercise(value, { source: 'exercise-selector' });
                return true;
            } catch (error) {
                return false;
            }
        };

        root.changeCompetenciaView = function changeCompetenceFromLegacyControl(value) {
            try {
                root.RadarCompetenceContext.select(value, { source: 'legacy-competence-control' });
                return true;
            } catch (error) {
                return false;
            }
        };

        if (typeof root.renderCompetencias === 'function' && !root.renderCompetencias.__globalCompetenceWrapped) {
            originalRenderCompetencias = root.renderCompetencias;
            const wrapped = function renderCompetenciasWithoutLocalSelector(...args) {
                const result = originalRenderCompetencias.apply(this, args);
                removeLocalCompetenceControl();
                return result;
            };
            wrapped.__globalCompetenceWrapped = true;
            root.renderCompetencias = wrapped;
        }

        if (typeof root.criarExercicio === 'function' && !root.criarExercicio.__globalCompetenceWrapped) {
            originalCreateExerciseFromForm = root.criarExercicio;
            const wrapped = async function createExerciseAndRefreshContext(...args) {
                const result = await originalCreateExerciseFromForm.apply(this, args);
                if (result !== false) refreshContext({ source: 'exercise-created' });
                return result;
            };
            wrapped.__globalCompetenceWrapped = true;
            root.criarExercicio = wrapped;
        }
    }

    function refreshContext(meta = {}) {
        if (!runtimeReady()) return false;
        if (!root.RadarCompetenceContext.isInitialized()) return initializeContext();
        const runtimeState = readRuntimeState();
        root.RadarCompetenceContext.replaceConfiguration({
            ...runtimeState,
            source: text(meta.source) || 'refresh'
        });
        renderSelector();
        wrapLegacyEntryPoints();
        return true;
    }

    function attemptInstall() {
        installSelectorListener();
        if (!runtimeReady()) return false;
        const ready = root.RadarCompetenceContext.isInitialized()
            ? refreshContext({ source: 'install-refresh' })
            : initializeContext();
        if (ready && retryTimer) {
            root.clearInterval(retryTimer);
            retryTimer = null;
        }
        return ready;
    }

    function install() {
        if (installed) {
            attemptInstall();
            return true;
        }
        installed = true;
        installSelectorListener();
        if (!attemptInstall()) {
            retryTimer = root.setInterval(attemptInstall, 50);
            document.addEventListener('DOMContentLoaded', attemptInstall, { once: true });
            root.addEventListener('load', attemptInstall, { once: true });
        }
        return true;
    }

    return Object.freeze({
        install,
        refreshContext,
        renderSelector,
        removeLocalCompetenceControl
    });
}));
