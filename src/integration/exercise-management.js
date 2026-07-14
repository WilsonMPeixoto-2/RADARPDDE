(function installExerciseManagement(root, factory) {
    'use strict';

    const api = factory(root);

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    if (!root) return;

    root.RadarExerciseManagement = Object.freeze(api);
    root.changeExercise = api.changeExercise;
    root.criarExercicio = api.createExerciseFromForm;

    if (typeof document === 'undefined') return;

    const initializeWhenReady = () => api.initialize();
    if (document.readyState === 'complete') {
        initializeWhenReady();
    } else {
        root.addEventListener('load', initializeWhenReady, { once: true });
    }
}(typeof window !== 'undefined' ? window : globalThis, function createExerciseManagementApi(root) {
    'use strict';

    const MONTH_NAMES = Object.freeze([
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro'
    ]);

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function normalizeYear(value) {
        const year = Number.parseInt(text(value), 10);
        return Number.isInteger(year) && year >= 2000 && year <= 2100
            ? String(year)
            : '';
    }

    function normalizeMonth(value) {
        const month = Number.parseInt(text(value), 10);
        return Number.isInteger(month) && month >= 1 && month <= 12
            ? String(month).padStart(2, '0')
            : '';
    }

    function createCompetence(yearValue, monthValue) {
        const year = normalizeYear(yearValue);
        const month = normalizeMonth(monthValue);
        if (!year || !month) return null;

        const monthNumber = Number(month);
        const nextMonthDate = new Date(Date.UTC(Number(year), monthNumber, 15));
        return {
            key: `${year}-${month}`,
            label: `${MONTH_NAMES[monthNumber - 1]} ${year}`,
            bonifPrazo: nextMonthDate.toISOString().slice(0, 10)
        };
    }

    function normalizeCompetence(record) {
        if (!record || typeof record !== 'object') return null;
        const key = text(record.key || record.id);
        const match = key.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
        if (!match) return null;
        const generated = createCompetence(match[1], match[2]);
        return {
            key,
            label: text(record.label) || generated.label,
            bonifPrazo: text(record.bonifPrazo || record.bonus_deadline) || generated.bonifPrazo
        };
    }

    function getRuntimeCollections() {
        const runtimeConfig = typeof config !== 'undefined' ? config : null;
        const competences = typeof COMPETENCIAS !== 'undefined' ? COMPETENCIAS : null;
        return { runtimeConfig, competences };
    }

    function mergeConfiguredCompetences() {
        const { runtimeConfig, competences } = getRuntimeCollections();
        if (!runtimeConfig || !Array.isArray(competences)) return [];

        const normalizedExercises = Array.from(new Set(
            (Array.isArray(runtimeConfig.exercicios) ? runtimeConfig.exercicios : [])
                .map(normalizeYear)
                .filter(Boolean)
        )).sort();

        const byKey = new Map();
        competences.map(normalizeCompetence).filter(Boolean).forEach(item => byKey.set(item.key, item));
        (Array.isArray(runtimeConfig.competencias) ? runtimeConfig.competencias : [])
            .map(normalizeCompetence)
            .filter(Boolean)
            .forEach(item => byKey.set(item.key, item));

        normalizedExercises.forEach(year => {
            for (let month = 1; month <= 12; month += 1) {
                const item = createCompetence(year, month);
                if (!byKey.has(item.key)) byKey.set(item.key, item);
            }
        });

        const merged = [...byKey.values()].sort((left, right) => left.key.localeCompare(right.key));
        competences.splice(0, competences.length, ...merged);
        runtimeConfig.exercicios = normalizedExercises;
        runtimeConfig.competencias = merged.map(item => ({ ...item }));
        return merged;
    }

    function renderExerciseSelector() {
        if (typeof document === 'undefined') return;
        const select = document.getElementById('exercise-select');
        const { runtimeConfig } = getRuntimeCollections();
        if (!select || !runtimeConfig) return;

        const years = Array.from(new Set(
            (Array.isArray(runtimeConfig.exercicios) ? runtimeConfig.exercicios : [])
                .map(normalizeYear)
                .filter(Boolean)
        )).sort();

        select.innerHTML = years
            .map(year => `<option value="${year}">Exercício ${year}</option>`)
            .join('');

        const selectedYear = typeof currentExercise !== 'undefined'
            ? normalizeYear(currentExercise)
            : '';
        select.value = years.includes(selectedYear) ? selectedYear : (years[0] || '');
    }

    function renderInitialCompetenceOptions() {
        if (typeof document === 'undefined') return;
        const select = document.getElementById('new-exercise-competencia');
        if (!select) return;
        const selected = normalizeMonth(select.value) || '01';
        select.innerHTML = MONTH_NAMES.map((name, index) => {
            const month = String(index + 1).padStart(2, '0');
            return `<option value="${month}" ${month === selected ? 'selected' : ''}>${name}</option>`;
        }).join('');
    }

    function removeObsoleteOfficialChargeControl() {
        if (typeof document === 'undefined') return;
        const obsoleteControl = document.getElementById('cobranca-envio-registro');
        if (!obsoleteControl) return;
        const container = obsoleteControl.closest('#cobranca-flag-container');
        if (container) container.remove();
        else obsoleteControl.remove();
    }

    function chooseCompetenceForExercise(year) {
        const { runtimeConfig, competences } = getRuntimeCollections();
        if (!runtimeConfig || !Array.isArray(competences)) return '';
        const available = competences
            .map(normalizeCompetence)
            .filter(item => item && item.key.startsWith(`${year}-`))
            .sort((left, right) => left.key.localeCompare(right.key));
        const closing = text(runtimeConfig.competenciaFechamento);
        if (closing.startsWith(`${year}-`) && available.some(item => item.key === closing)) {
            return closing;
        }
        return available[0]?.key || '';
    }

    function changeExercise(value) {
        const year = normalizeYear(value);
        const { runtimeConfig } = getRuntimeCollections();
        if (!year || !runtimeConfig || !runtimeConfig.exercicios.includes(year)) return false;

        if (typeof currentExercise !== 'undefined') currentExercise = year;
        const competence = chooseCompetenceForExercise(year);
        if (competence && typeof activeCompetenciaKey !== 'undefined') {
            activeCompetenciaKey = competence;
        }
        if (typeof activeProntuarioCompetencia !== 'undefined') {
            activeProntuarioCompetencia = null;
        }

        renderExerciseSelector();
        if (typeof updateGlobalCompetenceIndicator === 'function') {
            updateGlobalCompetenceIndicator();
        }
        if (typeof switchView === 'function' && typeof currentView !== 'undefined') {
            switchView(currentView);
        }
        return true;
    }

    function createExercise(yearValue, initialMonthValue) {
        const year = normalizeYear(yearValue);
        const month = normalizeMonth(initialMonthValue);
        const { runtimeConfig, competences } = getRuntimeCollections();

        if (!runtimeConfig || !Array.isArray(competences)) {
            return { ok: false, reason: 'runtime-unavailable' };
        }
        if (!year || !month) return { ok: false, reason: 'invalid-period' };
        if (runtimeConfig.exercicios.includes(year)) {
            return { ok: false, reason: 'duplicate-exercise', year };
        }

        runtimeConfig.exercicios.push(year);
        runtimeConfig.exercicios.sort();
        for (let monthNumber = 1; monthNumber <= 12; monthNumber += 1) {
            const competence = createCompetence(year, monthNumber);
            if (!competences.some(item => text(item.key || item.id) === competence.key)) {
                competences.push(competence);
            }
        }
        competences.sort((left, right) => text(left.key || left.id).localeCompare(text(right.key || right.id)));
        runtimeConfig.competencias = competences.map(item => normalizeCompetence(item)).filter(Boolean);
        runtimeConfig.competenciaFechamento = `${year}-${month}`;

        if (typeof currentExercise !== 'undefined') currentExercise = year;
        if (typeof activeCompetenciaKey !== 'undefined') activeCompetenciaKey = `${year}-${month}`;

        if (typeof registerLog === 'function') {
            registerLog(
                'Exercício Criado',
                `Exercício ${year} criado com competência operacional inicial ${year}-${month}.`
            );
        } else if (typeof persist === 'function') {
            persist('config');
        }

        return { ok: true, year, initialCompetence: `${year}-${month}` };
    }

    function createExerciseFromForm() {
        if (typeof document === 'undefined') return false;
        const yearInput = document.getElementById('new-exercise-input');
        const monthSelect = document.getElementById('new-exercise-competencia');
        const result = createExercise(yearInput?.value, monthSelect?.value);

        if (!result.ok) {
            const messages = {
                'runtime-unavailable': 'A configuração do sistema ainda não está disponível.',
                'invalid-period': 'Informe um ano entre 2000 e 2100 e uma competência inicial válida.',
                'duplicate-exercise': `O exercício ${result.year || ''} já está cadastrado.`
            };
            root.alert?.(messages[result.reason] || 'Não foi possível criar o exercício.');
            return false;
        }

        if (yearInput) yearInput.value = '';
        renderExerciseSelector();
        if (typeof renderSMEConfig === 'function') renderSMEConfig();
        if (typeof updateGlobalCompetenceIndicator === 'function') updateGlobalCompetenceIndicator();
        root.alert?.(`Exercício ${result.year} criado com sucesso.`);
        return true;
    }

    function wrapSMEConfigRenderer() {
        if (typeof root.renderSMEConfig !== 'function' || root.renderSMEConfig.__exerciseManagementWrapped) {
            return;
        }
        const original = root.renderSMEConfig;
        const wrapped = function renderSMEConfigWithExerciseManagement(...args) {
            const result = original.apply(this, args);
            renderInitialCompetenceOptions();
            return result;
        };
        wrapped.__exerciseManagementWrapped = true;
        root.renderSMEConfig = wrapped;
    }

    function initialize() {
        mergeConfiguredCompetences();
        renderExerciseSelector();
        wrapSMEConfigRenderer();
        renderInitialCompetenceOptions();
        removeObsoleteOfficialChargeControl();
    }

    return Object.freeze({
        MONTH_NAMES,
        normalizeYear,
        normalizeMonth,
        createCompetence,
        normalizeCompetence,
        mergeConfiguredCompetences,
        renderExerciseSelector,
        renderInitialCompetenceOptions,
        changeExercise,
        createExercise,
        createExerciseFromForm,
        initialize
    });
}));
