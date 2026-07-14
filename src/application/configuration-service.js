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

        async saveCalendar(input = {}) {
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
                    config.competenciaFechamento = closingCompetence;
                    config.prazoBonificacaoProrrogado = bonusWindowExtended;
                    this.appendLog(
                        'Calendário Alterado',
                        `Competência de fechamento alterada de ${previous} para ${closingCompetence}. Janela prorrogada: ${bonusWindowExtended}.`
                    );
                    return { closingCompetence, bonusWindowExtended };
                }
            });
        }

        async createExercise(input = {}) {
            const year = normalizeYear(input.year);
            const initialMonth = normalizeMonth(input.initialMonth);
            if (!year || !initialMonth) {
                fail('INVALID_PERIOD', 'Exercício ou competência inicial inválidos.', 'createExercise');
            }
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
                    this.appendLog(
                        'Exercício Criado',
                        `Exercício ${year} criado com competência operacional inicial ${year}-${initialMonth}.`
                    );
                    return { year, initialCompetence: `${year}-${initialMonth}` };
                }
            });
        }
    }

    return Object.freeze({ ConfigurationService, normalizeYear, normalizeMonth, createCompetence });
}));

