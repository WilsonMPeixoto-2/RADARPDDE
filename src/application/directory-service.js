(function installRadarDirectoryService(root, factory) {
    'use strict';

    const contract = typeof module !== 'undefined' && module.exports
        ? require('../data/repository-contract.js')
        : root.RadarRepositoryContract;
    const api = factory(contract, root);

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarDirectoryService = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createDirectoryServiceApi(contract, root) {
    'use strict';

    if (!contract) throw new Error('RadarRepositoryContract é obrigatório.');
    const { RepositoryError, cloneValue } = contract;

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

    async function runtimeGateway(method, value) {
        if (root?.RADAR_PDDE_CONFIG?.supabase?.connectionEnabled !== true) return null;
        if (!root.RadarTeamAccountGateway?.TeamAccountGateway) {
            const base = root.document?.baseURI || root.location?.href || '/';
            await import(new URL('src/application/team-account-gateway.js', base).href);
        }
        const client = root.RadarSessionContext?.service?.client;
        if (!client || !root.RadarTeamAccountGateway?.TeamAccountGateway) {
            fail(
                'MISSING_FUNCTIONS_CLIENT',
                'O serviço autenticado de contas da equipe não está disponível.',
                method
            );
        }
        const gateway = new root.RadarTeamAccountGateway.TeamAccountGateway({
            client,
            enabled: true
        });
        return gateway[method](value);
    }

    function createRuntimeGateway() {
        if (root?.RADAR_PDDE_CONFIG?.supabase?.connectionEnabled !== true) return null;
        return Object.freeze({
            saveController: value => runtimeGateway('saveController', value),
            deactivateController: value => runtimeGateway('deactivateController', value),
            saveInventoryMember: value => runtimeGateway('saveInventoryMember', value),
            deactivateInventoryMember: value => runtimeGateway('deactivateInventoryMember', value)
        });
    }

    function withRemotePersist(command, gateway, method) {
        if (!gateway || typeof gateway[method] !== 'function') return command;
        return {
            ...command,
            persist: async ({ value }) => gateway[method](value)
        };
    }

    class DirectoryService {
        constructor(options = {}) {
            this.dataService = options.dataService;
            this.getState = options.getState;
            this.appendLog = options.appendLog;
            this.createId = options.createId || (prefix => `${prefix}-${Date.now()}`);
            this.teamAccountGateway = options.teamAccountGateway || createRuntimeGateway();
            if (!this.dataService || typeof this.dataService.execute !== 'function'
                || typeof this.getState !== 'function'
                || typeof this.appendLog !== 'function') {
                fail('INVALID_DIRECTORY_SERVICE', 'Dependências do serviço de cadastros inválidas.', 'construct');
            }
        }

        persistProgram(context, persistence) {
            const { snapshot, repository, defaultPersist } = context;
            if (!repository || typeof repository.saveProgramWithLog !== 'function') {
                return typeof defaultPersist === 'function' ? defaultPersist() : undefined;
            }
            const program = list(snapshot?.entities?.programs)
                .find(record => String(record.id) === String(persistence.programId));
            const administrativeLog = list(snapshot?.entities?.administrativeLogs)
                .find(record => String(record.id) === String(persistence.logId));
            if (!program || !administrativeLog) {
                fail('PERSISTENCE_CONTEXT_MISSING', 'Programa ou histórico ausente para persistência.', 'persistProgram');
            }
            return repository.saveProgramWithLog({
                program,
                expectedVersion: persistence.expectedVersion,
                administrativeLog
            });
        }

        async saveProgram(input = {}) {
            const persistence = {};
            const name = text(input.name);
            const description = text(input.description);
            if (!name) fail('VALIDATION_FAILED', 'Informe o nome do programa.', 'saveProgram');
            return this.dataService.execute({
                name: 'directory:save-program',
                changedEntities: ['programs', 'administrativeLogs'],
                mutate: () => {
                    const { programs } = this.getState();
                    const existing = input.id ? programs.find(item => item.id === input.id) : null;
                    if (input.id && !existing) fail('NOT_FOUND', 'Programa não localizado.', 'saveProgram');
                    const program = existing || { id: this.createId('prog') };
                    persistence.programId = program.id;
                    persistence.expectedVersion = existing ? rowVersionOf(existing) : null;
                    program.name = name;
                    program.desc = description;
                    program.active = true;
                    if (!existing) programs.push(program);
                    const log = this.appendLog(
                        existing ? 'Programa Atualizado' : 'Programa Cadastrado',
                        `${existing ? 'Programa atualizado' : 'Novo programa cadastrado'}: ${name}.`
                    );
                    persistence.logId = text(log?.id);
                    return { program: { ...program } };
                },
                persist: context => this.persistProgram(context, persistence)
            });
        }

        async deactivateProgram(input = {}) {
            const persistence = {};
            const programId = text(input.programId);
            if (!programId || programId === 'BASIC') {
                fail('PROTECTED_PROGRAM', 'O programa básico não pode ser desativado.', 'deactivateProgram');
            }
            return this.dataService.execute({
                name: 'directory:deactivate-program',
                changedEntities: ['programs', 'administrativeLogs'],
                mutate: () => {
                    const { programs } = this.getState();
                    const program = programs.find(item => item.id === programId);
                    if (!program) fail('NOT_FOUND', 'Programa não localizado.', 'deactivateProgram');
                    persistence.programId = program.id;
                    persistence.expectedVersion = rowVersionOf(program);
                    program.active = false;
                    const log = this.appendLog('Programa Desativado', `Programa ${program.name || programId} desativado sem apagar seu histórico.`);
                    persistence.logId = text(log?.id);
                    return { programId };
                },
                persist: context => this.persistProgram(context, persistence)
            });
        }

        async saveController(input = {}) {
            const name = text(input.name);
            const email = text(input.email).toLowerCase();
            if (!name || !email) fail('VALIDATION_FAILED', 'Preencha nome e e-mail do controlador.', 'saveController');
            const command = {
                name: 'directory:save-controller',
                changedEntities: ['controllers', 'administrativeLogs'],
                mutate: () => {
                    const { controllers } = this.getState();
                    const existing = input.id ? controllers.find(item => item.id === input.id) : null;
                    if (input.id && !existing) fail('NOT_FOUND', 'Controlador não localizado.', 'saveController');
                    const previousController = existing ? cloneValue(existing) : null;
                    const previousName = existing?.name;
                    const controller = existing || { id: this.createId('ctrl') };
                    controller.name = name;
                    controller.email = email;
                    controller.active = true;
                    if (!existing) controllers.push(controller);
                    const administrativeLog = this.appendLog(
                        'Gestão de Equipe',
                        existing
                            ? `Dados do controlador ${previousName} atualizados para: ${name} (${email}).`
                            : `Controlador ${name} (${email}) adicionado à equipe e convidado para acesso.`
                    );
                    return {
                        controller: cloneValue(controller),
                        previousController,
                        administrativeLog: cloneValue(administrativeLog)
                    };
                }
            };
            return this.dataService.execute(withRemotePersist(
                command,
                this.teamAccountGateway,
                'saveController'
            ));
        }

        async deactivateController(input = {}) {
            const controllerId = text(input.controllerId);
            const fallbackControllerId = text(input.fallbackControllerId);
            const command = {
                name: 'directory:deactivate-controller',
                changedEntities: ['controllers', 'schools', 'administrativeLogs'],
                mutate: () => {
                    const { controllers, schools } = this.getState();
                    const controller = controllers.find(item => item.id === controllerId && item.active !== false);
                    if (!controller) fail('NOT_FOUND', 'Controlador ativo não localizado.', 'deactivateController');
                    const activeControllers = controllers.filter(item => item.active !== false);
                    if (activeControllers.length <= 1) {
                        fail('LAST_ACTIVE_CONTROLLER', 'Não é possível desativar o único controlador ativo.', 'deactivateController');
                    }
                    const assigned = schools.filter(item => item.controladorId === controllerId);
                    const fallback = activeControllers.find(item => item.id === fallbackControllerId && item.id !== controllerId);
                    if (assigned.length > 0 && !fallback) {
                        fail('REFERENCED_CONTROLLER', 'Escolha um controlador ativo para receber as escolas vinculadas.', 'deactivateController');
                    }
                    assigned.forEach(school => { school.controladorId = fallback.id; });
                    controller.active = false;
                    const administrativeLog = this.appendLog(
                        'Gestão de Equipe',
                        `Controlador ${controller.name} desativado. ${assigned.length} escolas foram transferidas${fallback ? ` para ${fallback.name}` : ''}. O acesso ao RADAR foi desativado.`
                    );
                    return {
                        controllerId,
                        fallbackControllerId: fallback?.id || null,
                        reassignedCount: assigned.length,
                        administrativeLog: cloneValue(administrativeLog)
                    };
                }
            };
            return this.dataService.execute(withRemotePersist(
                command,
                this.teamAccountGateway,
                'deactivateController'
            ));
        }

        async saveInventoryMember(input = {}) {
            const name = text(input.name);
            const email = text(input.email).toLowerCase();
            if (!name || !email) fail('VALIDATION_FAILED', 'Preencha nome e e-mail do integrante.', 'saveInventoryMember');
            const command = {
                name: 'directory:save-inventory-member',
                changedEntities: ['inventoryTeamMembers', 'administrativeLogs'],
                mutate: () => {
                    const { inventoryTeamMembers } = this.getState();
                    const existing = input.id ? inventoryTeamMembers.find(item => item.id === input.id) : null;
                    if (input.id && !existing) fail('NOT_FOUND', 'Integrante não localizado.', 'saveInventoryMember');
                    const previousMember = existing ? cloneValue(existing) : null;
                    const previousName = existing?.name;
                    const member = existing || { id: this.createId('inv') };
                    member.name = name;
                    member.email = email;
                    member.active = true;
                    if (!existing) inventoryTeamMembers.push(member);
                    const administrativeLog = this.appendLog(
                        'Gestão de Equipe',
                        existing
                            ? `Dados do integrante do Inventário ${previousName} atualizados para: ${name} (${email}).`
                            : `Integrante do Inventário ${name} (${email}) adicionado à equipe e convidado para acesso.`
                    );
                    return {
                        member: cloneValue(member),
                        previousMember,
                        administrativeLog: cloneValue(administrativeLog)
                    };
                }
            };
            return this.dataService.execute(withRemotePersist(
                command,
                this.teamAccountGateway,
                'saveInventoryMember'
            ));
        }

        async deactivateInventoryMember(input = {}) {
            const memberId = text(input.memberId);
            const command = {
                name: 'directory:deactivate-inventory-member',
                changedEntities: ['inventoryTeamMembers', 'administrativeLogs'],
                mutate: () => {
                    const { inventoryTeamMembers } = this.getState();
                    const member = inventoryTeamMembers.find(item => item.id === memberId && item.active !== false);
                    if (!member) fail('NOT_FOUND', 'Integrante ativo não localizado.', 'deactivateInventoryMember');
                    if (inventoryTeamMembers.filter(item => item.active !== false).length <= 1) {
                        fail('LAST_ACTIVE_MEMBER', 'Não é possível desativar o único integrante ativo.', 'deactivateInventoryMember');
                    }
                    member.active = false;
                    const administrativeLog = this.appendLog(
                        'Gestão de Equipe',
                        `Integrante do Inventário ${member.name} desativado sem apagar seu histórico. O acesso ao RADAR foi desativado.`
                    );
                    return {
                        memberId,
                        administrativeLog: cloneValue(administrativeLog)
                    };
                }
            };
            return this.dataService.execute(withRemotePersist(
                command,
                this.teamAccountGateway,
                'deactivateInventoryMember'
            ));
        }
    }

    return Object.freeze({ DirectoryService });
}));
