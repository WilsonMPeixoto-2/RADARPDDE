(function installRadarCompetenceContext(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarCompetenceContext = api;
}(typeof window !== 'undefined' ? window : globalThis, function createRadarCompetenceContextApi() {
    'use strict';

    const STORAGE_KEY = 'radar_pdde_active_competence';
    let singleton = null;

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function normalizeYear(value) {
        const year = Number.parseInt(text(value), 10);
        return Number.isInteger(year) && year >= 2000 && year <= 2100 ? String(year) : '';
    }

    function normalizeCompetence(record) {
        const key = text(record?.key || record?.id || record);
        const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(key);
        if (!match) return null;
        return {
            key,
            exercise: match[1],
            label: text(record?.label) || key
        };
    }

    function normalizeCompetences(records) {
        const byKey = new Map();
        (Array.isArray(records) ? records : [])
            .map(normalizeCompetence)
            .filter(Boolean)
            .forEach(item => byKey.set(item.key, item));
        return [...byKey.values()].sort((left, right) => left.key.localeCompare(right.key));
    }

    function createSelectionError(value) {
        const error = new Error(`Competência inválida ou indisponível: ${text(value) || 'vazia'}.`);
        error.code = 'INVALID_COMPETENCE_SELECTION';
        return error;
    }

    function safeStorage(storage) {
        return storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function'
            ? storage
            : null;
    }

    function createCompetenceContext(options = {}) {
        const storage = safeStorage(options.storage);
        let competences = normalizeCompetences(options.competences);
        let closingKey = text(options.closingCompetence);
        let exercise = normalizeYear(options.currentExercise)
            || normalizeCompetence(options.initialCompetence)?.exercise
            || normalizeCompetence(closingKey)?.exercise
            || competences[0]?.exercise
            || '';
        const listeners = new Set();

        function availableRecords(year = exercise) {
            const normalizedYear = normalizeYear(year);
            return competences.filter(item => item.exercise === normalizedYear);
        }

        function availableKeys(year = exercise) {
            return availableRecords(year).map(item => item.key);
        }

        function storedSelection(year = exercise) {
            const stored = text(storage?.getItem(STORAGE_KEY));
            return availableKeys(year).includes(stored) ? stored : '';
        }

        function chooseInitial(year = exercise, explicit = options.initialCompetence) {
            const keys = availableKeys(year);
            if (!keys.length) throw createSelectionError(year);
            const stored = storedSelection(year);
            if (stored) return stored;
            const explicitKey = text(explicit);
            if (keys.includes(explicitKey)) return explicitKey;
            if (keys.includes(closingKey)) return closingKey;
            return keys[keys.length - 1];
        }

        let activeKey = chooseInitial(exercise);

        function snapshot() {
            return Object.freeze({
                exercise,
                activeKey,
                availableKeys: Object.freeze(availableKeys()),
                closingKey
            });
        }

        function notify(meta = {}) {
            const state = snapshot();
            listeners.forEach(listener => listener(state, Object.freeze({ ...meta })));
            return state;
        }

        function persistSelection() {
            storage?.setItem(STORAGE_KEY, activeKey);
        }

        function select(value, meta = {}) {
            const key = text(value);
            if (!availableKeys().includes(key)) throw createSelectionError(value);
            if (key === activeKey) return snapshot();
            activeKey = key;
            persistSelection();
            return notify({ source: text(meta.source) || 'select' });
        }

        function selectExercise(value, meta = {}) {
            const nextExercise = normalizeYear(value);
            const records = availableRecords(nextExercise);
            if (!nextExercise || !records.length) throw createSelectionError(value);
            const previousExercise = exercise;
            const previousKey = activeKey;
            exercise = nextExercise;
            activeKey = chooseInitial(nextExercise, meta.initialCompetence);
            persistSelection();
            if (previousExercise === exercise && previousKey === activeKey) return snapshot();
            return notify({ source: text(meta.source) || 'select-exercise' });
        }

        function replaceConfiguration(next = {}) {
            const nextCompetences = next.competences === undefined
                ? competences
                : normalizeCompetences(next.competences);
            const nextClosing = next.closingCompetence === undefined
                ? closingKey
                : text(next.closingCompetence);
            const requestedExercise = normalizeYear(next.currentExercise) || exercise;
            competences = nextCompetences;
            closingKey = nextClosing;
            exercise = requestedExercise;
            const keys = availableKeys();
            if (!keys.length) throw createSelectionError(requestedExercise);
            if (!keys.includes(activeKey)) activeKey = chooseInitial(exercise, next.initialCompetence);
            persistSelection();
            return notify({ source: text(next.source) || 'replace-configuration' });
        }

        function subscribe(listener) {
            if (typeof listener !== 'function') throw new TypeError('Listener de competência inválido.');
            listeners.add(listener);
            return () => listeners.delete(listener);
        }

        return Object.freeze({
            getState: snapshot,
            getAvailableForExercise: year => availableRecords(year).map(item => ({ ...item })),
            select,
            selectExercise,
            replaceConfiguration,
            subscribe
        });
    }

    function requireSingleton() {
        if (!singleton) {
            const error = new Error('Contexto global de competência ainda não foi inicializado.');
            error.code = 'COMPETENCE_CONTEXT_NOT_INITIALIZED';
            throw error;
        }
        return singleton;
    }

    const api = {
        STORAGE_KEY,
        normalizeCompetence,
        normalizeCompetences,
        createCompetenceContext,
        initialize(options = {}) {
            singleton = createCompetenceContext(options);
            return api;
        },
        isInitialized() {
            return Boolean(singleton);
        },
        getState() {
            return requireSingleton().getState();
        },
        getAvailableForExercise(year) {
            return requireSingleton().getAvailableForExercise(year);
        },
        select(key, meta) {
            return requireSingleton().select(key, meta);
        },
        selectExercise(year, meta) {
            return requireSingleton().selectExercise(year, meta);
        },
        replaceConfiguration(next) {
            return requireSingleton().replaceConfiguration(next);
        },
        subscribe(listener) {
            return requireSingleton().subscribe(listener);
        }
    };

    return Object.freeze(api);
}));
