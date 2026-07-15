(function installRadarSchoolService(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const api = factory(contract);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarSchoolService = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createSchoolServiceApi(contract) {
    'use strict';

    if (!contract) throw new Error('RadarRepositoryContract é obrigatório.');
    const { RepositoryError } = contract;

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function fail(code, message, operation) {
        throw new RepositoryError(code, message, { operation });
    }

    function unique(values) {
        return [...new Set((Array.isArray(values) ? values : []).map(text).filter(Boolean))];
    }

    class SchoolService {
        constructor(options = {}) {
            this.dataService = options.dataService;
            this.getState = options.getState;
            this.appendLog = options.appendLog;
            this.createId = options.createId || (() => `esc-${Date.now()}`);
            this.createInep = options.createInep || (() => `330${Math.floor(10000 + Math.random() * 90000)}`);
            this.createCnpj = options.createCnpj || (() => `00.000.000/0001-${Math.floor(10 + Math.random() * 89)}`);
            this.createDesignation = options.createDesignation || (() => `01.09.${Math.floor(100 + Math.random() * 900)}`);
            this.createDenomination = options.createDenomination || (() => `Nova Unidade Escolar ${Math.floor(Math.random() * 100)}`);
            if (!this.dataService || typeof this.dataService.execute !== 'function'
                || typeof this.getState !== 'function'
                || typeof this.appendLog !== 'function') {
                fail('INVALID_SCHOOL_SERVICE', 'Dependências do serviço de escolas inválidas.', 'construct');
            }
        }

        activeController(state, controllerId, operation) {
            const controller = state.controllers.find(item => item.id === controllerId && item.active !== false);
            if (!controller) fail('INVALID_CONTROLLER', 'Selecione um controlador ativo.', operation);
            return controller;
        }

        normalizedProgramIds(state, requested, existingSchool) {
            const requestedIds = unique(['BASIC', ...requested]);
            const activeIds = requestedIds.filter(id => state.programs.some(program => program.id === id && program.active !== false));
            if (!activeIds.includes('BASIC')) activeIds.unshift('BASIC');
            const historical = unique(existingSchool?.programasIds).filter(id => {
                const program = state.programs.find(item => item.id === id);
                return program && program.active === false;
            });
            return unique([...activeIds, ...historical]);
        }

        async saveSchool(input = {}) {
            let persistedSchoolId = text(input.id);
            return this.dataService.execute({
                name: 'school:save',
                changedEntities: ['schools', 'schoolPrograms', 'administrativeLogs'],
                mutate: () => {
                    const state = this.getState();
                    const controllerId = text(input.controllerId);
                    const controller = this.activeController(state, controllerId, 'saveSchool');
                    const existing = input.id ? state.schools.find(item => item.id === input.id) : null;
                    if (input.id && !existing) fail('NOT_FOUND', 'Escola não localizada.', 'saveSchool');
                    const school = existing || {
                        id: this.createId(),
                        inep: this.createInep(),
                        cnpj: this.createCnpj(),
                        denominação: this.createDenomination(),
                        designação: this.createDesignation(),
                        cre: '4ª CRE',
                        ra: 'Geral',
                        competenciaInicial: text(input.initialCompetence) || '2026-05',
                        active: true
                    };
                    const previousController = school.controladorId;
                    const mappings = {
                        sici: 'sici',
                        email: 'email',
                        director: 'diretor',
                        directorPhone: 'telefoneDiretor',
                        deputyDirector: 'diretorAdjunto',
                        deputyDirectorPhone: 'telefoneDiretorAdjunto',
                        phone: 'telefone',
                        institutionalMobile: 'telefoneCelularInstitucional',
                        inventoryProcess: 'processoInventario'
                    };
                    Object.entries(mappings).forEach(([source, target]) => {
                        if (Object.prototype.hasOwnProperty.call(input, source)) school[target] = text(input[source]);
                    });
                    school.controladorId = controllerId;
                    school.programasIds = this.normalizedProgramIds(state, input.programIds, existing);
                    school.active = true;
                    if (!existing) state.schools.push(school);
                    persistedSchoolId = String(school.id);
                    let details = existing
                        ? `Dados da escola ${school.denominação} atualizados.`
                        : `Nova escola cadastrada: ${school.denominação} com controlador designado.`;
                    if (existing && previousController !== controllerId) {
                        details += ` Controlador alterado para ${controller.name}.`;
                    }
                    this.appendLog(existing ? 'Escola Atualizada' : 'Escola Cadastrada', details);
                    return { school: { ...school, programasIds: [...school.programasIds] } };
                },
                persist: async ({ snapshot, repository, defaultPersist }) => {
                    if (typeof repository.saveSchoolWithPrograms !== 'function') {
                        return defaultPersist();
                    }
                    const school = (snapshot.entities.schools || [])
                        .find(record => String(record.id) === persistedSchoolId);
                    const programs = (snapshot.entities.schoolPrograms || [])
                        .filter(record => String(record.school_id) === persistedSchoolId);
                    if (!school) return defaultPersist();
                    return repository.saveSchoolWithPrograms({
                        school,
                        programs,
                        expectedSchoolVersion: input.id ? Number(school.row_version || 1) : null,
                        administrativeLog: snapshot.entities.administrativeLogs?.at(-1) || null
                    });
                }
            });
        }

        async assignController(input = {}) {
            const schoolId = text(input.schoolId);
            const controllerId = text(input.controllerId);
            return this.dataService.execute({
                name: 'school:assign-controller',
                changedEntities: ['schools', 'administrativeLogs'],
                mutate: () => {
                    const state = this.getState();
                    const school = state.schools.find(item => item.id === schoolId);
                    if (!school) fail('NOT_FOUND', 'Escola não localizada.', 'assignController');
                    const controller = this.activeController(state, controllerId, 'assignController');
                    if (school.controladorId === controllerId) return { schoolId, changed: false };
                    const previous = state.controllers.find(item => item.id === school.controladorId);
                    school.controladorId = controllerId;
                    this.appendLog(
                        'Redistribuição de Carteira',
                        `Escola ${school.denominação || school.denominaçao} redistribuída de ${previous?.name || 'Ninguém'} para ${controller.name}.`
                    );
                    return { schoolId, changed: true };
                }
            });
        }

        async bulkAssignController(input = {}) {
            const schoolIds = unique(input.schoolIds);
            const controllerId = text(input.controllerId);
            if (schoolIds.length === 0) fail('VALIDATION_FAILED', 'Selecione ao menos uma escola.', 'bulkAssignController');
            return this.dataService.execute({
                name: 'school:bulk-assign-controller',
                changedEntities: ['schools', 'administrativeLogs'],
                mutate: () => {
                    const state = this.getState();
                    const controller = this.activeController(state, controllerId, 'bulkAssignController');
                    let updatedCount = 0;
                    state.schools.forEach(school => {
                        if (schoolIds.includes(String(school.id)) && school.controladorId !== controllerId) {
                            school.controladorId = controllerId;
                            updatedCount += 1;
                        }
                    });
                    if (updatedCount > 0) {
                        this.appendLog(
                            'Redistribuição em Lote',
                            `Atribuição em lote realizada: ${updatedCount} escolas redistribuídas para o controlador ${controller.name}.`
                        );
                    }
                    return { updatedCount, controllerId };
                }
            });
        }
    }

    return Object.freeze({ SchoolService });
}));

