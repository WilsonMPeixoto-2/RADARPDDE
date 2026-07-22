(function installRadarConfigurationService(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const api = factory(contract);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarConfigurationService = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createConfigurationServiceApi(contract) {
    'use strict';

    if (!contract) throw new Error('RadarRepositoryContract é obrigatório.');
    const { RepositoryError, cloneValue } = contract;
    const MONTH_NAMES = Object.freeze([
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]);

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function list(value) {
        return Array.isArray(value) ? value : [];
    }

    function rowVersionOf(record) {
        const candidate = record?.rowVersion ?? record?.row_version;
        return Number.isInteger(candidate) && candidate > 0 ? candidate : null;
    }

    function fail(code, message, operation) {
        throw new RepositoryError(code, message, { operation });
    }

    function normalizeYear(value) {
        const year = Number.parseInt(text(value), 10);
        return Number.isInteger(year) && year >= 2000 && year <= 2100 ? String(year) : '';
    }

    function normalizeMonth(value) {
        const month = Number.parseInt(text(value), 10);
        return Number.isInteger(month) && month >= 1 && month <= 12
            ? String(month).padStart(2, '0')
            : '';
    }

    function createCompetence(year, month) {
        const monthNumber = Number(month);
        return {
            key: `${year}-${month}`,
            label: `${MONTH_NAMES[monthNumber - 1]} ${year}`,
            bonifPrazo: new Date(Date.UTC(Number(year), monthNumber, 15)).toISOString().slice(0, 10)
        };
    }

    class ConfigurationService {
        constructor(options = {}) {
            this.dataService = options.dataService;
            this.getState = options.getState;
            this.appendLog = options.appendLog;
            if (!this.dataService || typeof this.dataService.execute !== 'function'
                || typeof this.getState !== 'function'
                || typeof this.appendLog !== 'function') {
                fail('INVALID_CONFIGURATION_SERVICE', 'Dependências do serviço de configuração inválidas.', 'construct');
            }
        }

        persistCalendar(context, persistence) {
            const { snapshot, repository, defaultPersist } = context;
            if (typeof repository.saveCalendarWithLog !== 'function') return defaultPersist();
            const appConfig = list(snapshot?.entities?.appConfig)[0] || null;
            const administrativeLog = list(snapshot?.entities?.administrativeLogs)
                .find(record => String(record.id) === String(persistence.logId));
            if (!appConfig || !administrativeLog) {
                fail('PERSISTENCE_CONTEXT_MISSING', 'Calendário ou histórico ausente para persistência.', 'persistCalendar');
            }
            return repository.saveCalendarWithLog({
                appConfig,
                expectedVersion: persistence.expectedVersion,
                administrativeLog
            });
        }

        async saveCalendar(input = {}) {
            const persistence = {};
            const closingCompetence = text(input.closingCompetence);
            if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(closingCompetence)) {
                fail('INVALID_COMPETENCE', 'Competência de fechamento inválida.', 'saveCalendar');
            }
            const bonusWindowExtended = input.bonusWindowExtended === true;
            return this.dataService.execute({
                name: 'configuration:save-calendar',
                changedEntities: ['appConfig', 'administrativeLogs'],
                mutate: () => {
                    const { config, competences } = this.getState();
                    if (!config || !Array.isArray(competences)) {
                        fail('RUNTIME_UNAVAILABLE', 'Configuração operacional indisponível.', 'saveCalendar');
                    }
                    if (competences.length > 0
                        && !competences.some(item => text(item?.key || item?.id) === closingCompetence)) {
                        fail('UNKNOWN_COMPETENCE', 'A competência informada não está cadastrada.', 'saveCalendar');
                    }
                    const previous = text(config.competenciaFechamento);
                    persistence.expectedVersion = rowVersionOf(config);
                    config.competenciaFechamento = closingCompetence;
                    config.prazoBonificacaoProrrogado = bonusWindowExtended;
                    const log = this.appendLog(
                        'Calendário Alterado',
                        `Competência de fechamento alterada de ${previous} para ${closingCompetence}. Janela prorrogada: ${bonusWindowExtended}.`
                    );
                    persistence.logId = text(log?.id);
                    return { closingCompetence, bonusWindowExtended };
                },
                persist: context => this.persistCalendar(context, persistence)
            });
        }

        async createExercise(input = {}) {
            const year = normalizeYear(input.year);
            const initialMonth = normalizeMonth(input.initialMonth);
            if (!year || !initialMonth) {
                fail('INVALID_PERIOD', 'Exercício ou competência inicial inválidos.', 'createExercise');
            }
            const persistence = { logId: null };
            return this.dataService.execute({
                name: 'configuration:create-exercise',
                changedEntities: ['appConfig', 'competences', 'administrativeLogs'],
                mutate: () => {
                    const { config, competences } = this.getState();
                    if (!config || !Array.isArray(competences)) {
                        fail('RUNTIME_UNAVAILABLE', 'Configuração operacional indisponível.', 'createExercise');
                    }
                    const exercises = Array.isArray(config.exercicios) ? config.exercicios : [];
                    if (exercises.map(String).includes(year)) {
                        fail('DUPLICATE_EXERCISE', `O exercício ${year} já está cadastrado.`, 'createExercise');
                    }
                    exercises.push(year);
                    exercises.sort();
                    config.exercicios = exercises;
                    for (let monthNumber = 1; monthNumber <= 12; monthNumber += 1) {
                        const month = String(monthNumber).padStart(2, '0');
                        const competence = createCompetence(year, month);
                        if (!competences.some(item => text(item?.key || item?.id) === competence.key)) {
                            competences.push(competence);
                        }
                    }
                    competences.sort((left, right) => text(left?.key || left?.id).localeCompare(text(right?.key || right?.id)));
                    config.competencias = competences.map(item => cloneValue(item));
                    config.competenciaFechamento = `${year}-${initialMonth}`;
                    const log = this.appendLog(
                        'Exercício Criado',
                        `Exercício ${year} criado com competência operacional inicial ${year}-${initialMonth}.`
                    );
                    persistence.logId = text(log?.id);
                    return { year, initialCompetence: `${year}-${initialMonth}` };
                },
                persist: async ({ snapshot, repository, defaultPersist }) => {
                    if (typeof repository.saveExerciseWithCompetences !== 'function') {
                        return defaultPersist();
                    }
                    const administrativeLog = list(snapshot?.entities?.administrativeLogs)
                        .find(record => String(record.id) === String(persistence.logId));
                    if (!administrativeLog) {
                        fail(
                            'PERSISTENCE_CONTEXT_MISSING',
                            'Histórico ausente para criação transacional do exercício.',
                            'createExercise'
                        );
                    }
                    return repository.saveExerciseWithCompetences({
                        appConfig: snapshot.entities.appConfig?.[0] || {},
                        competences: snapshot.entities.competences || [],
                        administrativeLog
                    });
                }
            });
        }
    }

    return Object.freeze({ ConfigurationService, normalizeYear, normalizeMonth, createCompetence });
}));

