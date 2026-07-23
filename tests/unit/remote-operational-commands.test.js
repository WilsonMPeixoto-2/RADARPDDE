'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { PendencyService } = require('../../src/application/pendency-service.js');
const { transformLegacyState } = require('../../src/data/legacy-state-adapter.js');
const { createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function createState() {
    return {
        config: { exercicios: ['2026'], competenciaFechamento: '2026-05' },
        programs: [{ id: 'BASIC', name: 'PDDE Básico', active: true }],
        controllers: [],
        inventoryTeamMembers: [],
        competences: [{ key: '2026-05', label: 'Maio 2026' }],
        schools: [{
            id: '04.10.001', designação: '04.10.001', denominação: 'Escola Teste',
            cre: '4ª CRE', programasIds: ['BASIC'], competenciaInicial: '2026-05'
        }],
        verifications: {},
        pendencies: [],
        contacts: [],
        assets: [],
        registeredInvoices: [],
        logs: []
    };
}

function snapshotFromState(state) {
    const transformed = transformLegacyState(state);
    return createSnapshotEnvelope(transformed.entities, {
        version: '1', importId: 'remote-operational-commands',
        exportedAt: '2026-07-22T22:00:00.000Z'
    });
}

function createDataService(state, repository) {
    let defaultPersistCalls = 0;
    return {
        service: {
            async execute(command) {
                const value = await command.mutate();
                const snapshot = snapshotFromState(state);
                if (typeof command.persist === 'function') {
                    await command.persist({
                        value,
                        snapshot,
                        repository,
                        defaultPersist: async () => { defaultPersistCalls += 1; }
                    });
                } else {
                    defaultPersistCalls += 1;
                }
                return { ok: true, value, snapshot };
            }
        },
        getDefaultPersistCalls: () => defaultPersistCalls
    };
}

function appendLogFactory(state) {
    let sequence = 0;
    return (action, details, context = {}) => {
        sequence += 1;
        const log = {
            id: `op-log-${sequence}`,
            escolaId: context.escolaId || context.schoolId || null,
            usuario: 'Controlador Teste', perfil: 'Controlador',
            acao: action, detalhes: details,
            dataHora: '2026-07-22T22:00:00.000Z'
        };
        state.logs.push(log);
        return log;
    };
}

test('contato e log usam uma única RPC idempotente', async () => {
    const state = createState();
    const rpcCalls = [];
    const repository = {
        savePendencyContactWithLog: async input => {
            rpcCalls.push(structuredClone(input));
            return { contact: input.contact, administrative_log: input.administrativeLog };
        }
    };
    const data = createDataService(state, repository);
    const service = new PendencyService({
        dataService: data.service,
        getState: () => state,
        appendLog: appendLogFactory(state),
        getCurrentUser: () => ({ name: 'Controlador Teste', role: 'Controlador' }),
        createId: prefix => `${prefix}-atomic-contact`,
        now: () => '2026-07-22T22:00:00.000Z'
    });

    await service.registerContact({
        schoolId: '04.10.001',
        channel: 'Telefone',
        description: 'Orientação registrada.',
        serviceDate: '2026-07-22',
        operationId: 'operation-contact-1'
    });

    assert.equal(rpcCalls.length, 1);
    assert.equal(data.getDefaultPersistCalls(), 0);
    assert.equal(rpcCalls[0].operationId, 'operation-contact-1');
    assert.equal(rpcCalls[0].contact.id, 'cont-atomic-contact');
    assert.equal(rpcCalls[0].contact.school_id, '04.10.001');
    assert.equal(rpcCalls[0].administrativeLog.id, 'op-log-1');
    assert.equal(rpcCalls[0].administrativeLog.school_id, '04.10.001');
});

const pendencyDomain = require('../../src/domain/pendencias.js');

function createDocumentaryPendency(overrides = {}) {
    const pendency = pendencyDomain.createDocumentPendency({
        id: 'pendency-atomic-1',
        escolaId: '04.10.001',
        competencia: '2026-05',
        programaId: 'BASIC',
        documentoKey: 'extCC',
        item: 'Extrato Conta Corrente',
        erros: ['Documento ilegível'],
        observacao: 'Correção necessária.',
        dataAbertura: '2026-07-22',
        ...overrides
    }, {
        eventId: 'event-open-1',
        at: '2026-07-22T22:00:00.000Z',
        usuario: 'Controlador Teste',
        perfil: 'Controlador'
    });
    pendency.rowVersion = 3;
    return pendency;
}

function createPendencyHarness(configureState) {
    const state = createState();
    configureState?.(state);
    const rpcCalls = [];
    const repository = {
        savePendencyCommand: async input => {
            rpcCalls.push(structuredClone(input));
            return { pendency: input.pendency, attempt: input.attempt, verification: input.verification };
        }
    };
    const data = createDataService(state, repository);
    let sequence = 0;
    const service = new PendencyService({
        dataService: data.service,
        domain: pendencyDomain,
        getState: () => state,
        appendLog: appendLogFactory(state),
        getCurrentUser: () => ({ name: 'Controlador Teste', role: 'Controlador' }),
        createId: prefix => `${prefix}-atomic-${++sequence}`,
        now: () => '2026-07-22T22:00:00.000Z',
        getCorrectAnalysisLabel: () => 'Correto'
    });
    return { state, service, rpcCalls, getDefaultPersistCalls: data.getDefaultPersistCalls };
}

test('abertura de pendência e log usam uma única RPC', async () => {
    const harness = createPendencyHarness();

    await harness.service.open({
        schoolId: '04.10.001', competence: '2026-05', programId: 'BASIC',
        documentKey: 'extCC', item: 'Extrato Conta Corrente',
        errors: ['Documento ilegível'], observation: 'Correção necessária.'
    });

    assert.equal(harness.rpcCalls.length, 1);
    assert.equal(harness.rpcCalls[0].operation, 'open');
    assert.equal(harness.rpcCalls[0].expectedPendencyVersion, null);
    assert.equal(harness.rpcCalls[0].pendency.school_id, '04.10.001');
    assert.equal(harness.rpcCalls[0].administrativeLog.school_id, '04.10.001');
    assert.equal(harness.getDefaultPersistCalls(), 0);
});

test('novo envio persiste pendência, tentativa, verificação e log atomicamente', async () => {
    const harness = createPendencyHarness(state => {
        state.pendencies.push(createDocumentaryPendency());
        state.verifications = {
            '04.10.001': {
                '2026-05_BASIC': {
                    bonificacao: { extCC: 'Sim' },
                    analise: { extCC: 'Incorreto' },
                    resultadoBonif: 'apta',
                    rowVersion: 4
                }
            }
        };
    });

    await harness.service.registerAttempt({
        pendencyId: 'pendency-atomic-1',
        availabilityDate: '2026-07-22',
        observation: 'Novo arquivo disponibilizado.',
        link: 'https://drive.google.com/file/atomic'
    });

    assert.equal(harness.rpcCalls.length, 1);
    assert.equal(harness.rpcCalls[0].operation, 'register_attempt');
    assert.equal(harness.rpcCalls[0].expectedPendencyVersion, 3);
    assert.equal(harness.rpcCalls[0].expectedVerificationVersion, 4);
    assert.equal(harness.rpcCalls[0].attempt.pendency_id, 'pendency-atomic-1');
    assert.equal(harness.rpcCalls[0].verification.analysis.extCC, 'Não analisado');
    assert.equal(harness.getDefaultPersistCalls(), 0);
});

test('cancelamento persiste status e log em uma única RPC', async () => {
    const harness = createPendencyHarness(state => {
        state.pendencies.push(createDocumentaryPendency());
    });

    await harness.service.cancel({
        pendencyId: 'pendency-atomic-1',
        justification: 'Lançamento indevido.'
    });

    assert.equal(harness.rpcCalls.length, 1);
    assert.equal(harness.rpcCalls[0].operation, 'update_status');
    assert.equal(harness.rpcCalls[0].expectedPendencyVersion, 3);
    assert.equal(harness.rpcCalls[0].pendency.status, 'Cancelada');
    assert.equal(harness.rpcCalls[0].administrativeLog.action, 'Pendência Cancelada');
    assert.equal(harness.getDefaultPersistCalls(), 0);
});

const { InventoryService } = require('../../src/application/inventory-service.js');

function createInventoryHarness(configureState) {
    const state = createState();
    state.schools[0].processoInventario = '07/000.001/2026';
    configureState?.(state);
    const rpcCalls = [];
    const repository = {
        saveAssetWithLog: async input => {
            rpcCalls.push(structuredClone(input));
            return { asset: input.asset, administrative_log: input.administrativeLog };
        }
    };
    const data = createDataService(state, repository);
    let sequence = 0;
    const service = new InventoryService({
        dataService: data.service,
        getState: () => state,
        appendLog: appendLogFactory(state),
        createId: prefix => `${prefix}-atomic-${++sequence}`,
        now: () => new Date('2026-07-22T22:00:00.000Z')
    });
    return { state, service, rpcCalls, getDefaultPersistCalls: data.getDefaultPersistCalls };
}

test('cadastro de bem e log usam uma única RPC', async () => {
    const harness = createInventoryHarness();

    await harness.service.createAsset({
        profile: 'controlador', schoolId: '04.10.001', competence: '2026-05',
        description: 'Notebook institucional', amount: 4500, invoiceNumber: 'NF-100'
    });

    assert.equal(harness.rpcCalls.length, 1);
    assert.equal(harness.rpcCalls[0].expectedVersion, null);
    assert.equal(harness.rpcCalls[0].asset.description, 'Notebook institucional');
    assert.equal(harness.rpcCalls[0].asset.status, 'Encaminhada');
    assert.equal(harness.rpcCalls[0].administrativeLog.school_id, '04.10.001');
    assert.equal(harness.getDefaultPersistCalls(), 0);
});

test('encaminhamento de bem e log usam versão esperada na mesma RPC', async () => {
    const harness = createInventoryHarness(state => {
        state.assets.push({
            id: 'asset-atomic-1', escolaId: '04.10.001', competencia: '2026-05',
            item: 'Projetor', descricao: 'Projetor', tipo: 'permanente', valor: 2500,
            notaFiscal: 'NF-200', processoInventario: '', status: 'Não encaminhada', rowVersion: 3
        });
    });

    await harness.service.forward({ profile: 'controlador', assetId: 'asset-atomic-1' });

    assert.equal(harness.rpcCalls.length, 1);
    assert.equal(harness.rpcCalls[0].expectedVersion, 3);
    assert.equal(harness.rpcCalls[0].asset.status, 'Encaminhada');
    assert.equal(harness.rpcCalls[0].administrativeLog.action, 'Capital Encaminhado');
    assert.equal(harness.getDefaultPersistCalls(), 0);
});

test('inventariação e log usam versão esperada na mesma RPC', async () => {
    const harness = createInventoryHarness(state => {
        state.assets.push({
            id: 'asset-atomic-2', escolaId: '04.10.001', competencia: '2026-05',
            item: 'Impressora', descricao: 'Impressora', tipo: 'permanente', valor: 1800,
            notaFiscal: 'NF-300', processoInventario: '07/000.001/2026',
            status: 'Encaminhada', rowVersion: 5
        });
    });

    await harness.service.inventory({
        profile: 'inventario', assetId: 'asset-atomic-2',
        responsible: 'Equipe Inventário', responsibleId: 'INV-1', notes: 'Conferido.'
    });

    assert.equal(harness.rpcCalls.length, 1);
    assert.equal(harness.rpcCalls[0].expectedVersion, 5);
    assert.equal(harness.rpcCalls[0].asset.status, 'Inventariada');
    assert.equal(harness.rpcCalls[0].asset.inventoried_by_member_id, 'INV-1');
    assert.equal(harness.rpcCalls[0].administrativeLog.action, 'Inventariação Concluída');
    assert.equal(harness.getDefaultPersistCalls(), 0);
});

const { DirectoryService } = require('../../src/application/directory-service.js');
const { ConfigurationService } = require('../../src/application/configuration-service.js');
const { SchoolService } = require('../../src/application/school-service.js');

function createAdministrativeHarness(ServiceCtor, repository, configureState, extraOptions = {}) {
    const state = createState();
    state.config.rowVersion = 6;
    configureState?.(state);
    const data = createDataService(state, repository);
    let sequence = 0;
    const service = new ServiceCtor({
        dataService: data.service,
        getState: () => state,
        appendLog: appendLogFactory(state),
        createId: prefix => `${prefix}-atomic-${++sequence}`,
        ...extraOptions
    });
    return { state, service, getDefaultPersistCalls: data.getDefaultPersistCalls };
}

test('cadastro e desativação de programa usam RPC atômica com log', async () => {
    const rpcCalls = [];
    const repository = {
        saveProgramWithLog: async input => {
            rpcCalls.push(structuredClone(input));
            return { program: input.program, administrative_log: input.administrativeLog };
        }
    };
    const harness = createAdministrativeHarness(DirectoryService, repository, state => {
        state.programs.push({ id: 'EXISTING', name: 'Programa Existente', desc: '', active: true, rowVersion: 4 });
    }, { teamAccountGateway: null });

    await harness.service.saveProgram({ name: 'Programa Novo', description: 'Descrição.' });
    await harness.service.deactivateProgram({ programId: 'EXISTING' });

    assert.equal(rpcCalls.length, 2);
    assert.equal(rpcCalls[0].expectedVersion, null);
    assert.equal(rpcCalls[0].program.name, 'Programa Novo');
    assert.equal(rpcCalls[1].expectedVersion, 4);
    assert.equal(rpcCalls[1].program.active, false);
    assert.equal(rpcCalls[1].administrativeLog.action, 'Programa Desativado');
    assert.equal(harness.getDefaultPersistCalls(), 0);
});

test('alteração de calendário e log usam uma única RPC versionada', async () => {
    const rpcCalls = [];
    const repository = {
        saveCalendarWithLog: async input => {
            rpcCalls.push(structuredClone(input));
            return { app_config: input.appConfig, administrative_log: input.administrativeLog };
        }
    };
    const harness = createAdministrativeHarness(ConfigurationService, repository, state => {
        state.competences = [{ key: '2026-05', label: 'Maio 2026' }, { key: '2026-06', label: 'Junho 2026' }];
        state.config.competenciaFechamento = '2026-05';
    });

    await harness.service.saveCalendar({ closingCompetence: '2026-06', bonusWindowExtended: true });

    assert.equal(rpcCalls.length, 1);
    assert.equal(rpcCalls[0].expectedVersion, 6);
    assert.equal(rpcCalls[0].appConfig.closing_competence, '2026-06');
    assert.equal(rpcCalls[0].administrativeLog.action, 'Calendário Alterado');
    assert.equal(harness.getDefaultPersistCalls(), 0);
});

test('atribuição individual de controlador e log usam uma única RPC versionada', async () => {
    const rpcCalls = [];
    const repository = {
        assignControllerWithLog: async input => {
            rpcCalls.push(structuredClone(input));
            return { schools: input.schools, administrative_log: input.administrativeLog };
        }
    };
    const harness = createAdministrativeHarness(SchoolService, repository, state => {
        state.controllers = [
            { id: 'CTRL-1', name: 'Controlador Um', active: true },
            { id: 'CTRL-2', name: 'Controlador Dois', active: true }
        ];
        state.schools[0].controladorId = 'CTRL-1';
        state.schools[0].rowVersion = 7;
    });

    await harness.service.assignController({ schoolId: '04.10.001', controllerId: 'CTRL-2' });

    assert.equal(rpcCalls.length, 1);
    assert.equal(rpcCalls[0].schools.length, 1);
    assert.equal(rpcCalls[0].schools[0].id, '04.10.001');
    assert.equal(rpcCalls[0].schools[0].controller_id, 'CTRL-2');
    assert.equal(rpcCalls[0].schools[0].expected_version, 7);
    assert.equal(rpcCalls[0].administrativeLog.action, 'Redistribuição de Carteira');
    assert.equal(harness.getDefaultPersistCalls(), 0);
});

test('reanálise seleciona o log criado pelo comando, sem depender da ordem da coleção', async () => {
    const state = createState();
    const opened = createDocumentaryPendency();
    const awaiting = pendencyDomain.registerCorrectiveSubmission(opened, {
        id: 'attempt-reanalysis-1',
        dataDisponibilizacao: '2026-07-22',
        observacao: 'Arquivo substituído.',
        link: 'https://drive.example/reanalysis'
    }, {
        eventId: 'event-attempt-1', at: '2026-07-22T22:01:00.000Z',
        usuario: 'Controlador Teste', perfil: 'Controlador'
    });
    awaiting.rowVersion = 3;
    state.pendencies.push(awaiting);
    state.verifications = {
        '04.10.001': {
            '2026-05_BASIC': {
                bonificacao: { extCC: 'Sim' },
                analise: { extCC: 'Não analisado' },
                resultadoBonif: 'apta',
                rowVersion: 4
            }
        }
    };
    state.logs.push({
        id: 'zzzz-preexisting-log', escolaId: '04.10.001', usuario: 'Outro',
        perfil: 'Controlador', acao: 'Log preexistente', detalhes: '',
        dataHora: '2026-07-22T23:59:00.000Z'
    });
    const rpcCalls = [];
    const repository = {
        reanalyzePendencyWithVerification: async input => {
            rpcCalls.push(structuredClone(input));
            return input;
        }
    };
    const data = createDataService(state, repository);
    const service = new PendencyService({
        dataService: data.service,
        domain: pendencyDomain,
        getState: () => state,
        appendLog: appendLogFactory(state),
        getCurrentUser: () => ({ name: 'Controlador Teste', role: 'Controlador' }),
        createId: prefix => `${prefix}-reanalysis`,
        now: () => '2026-07-22T22:02:00.000Z',
        getCorrectAnalysisLabel: () => 'Correto'
    });

    await service.reanalyze({
        pendencyId: 'pendency-atomic-1',
        result: 'correto',
        observation: 'Regularização confirmada.'
    });

    assert.equal(rpcCalls.length, 1);
    assert.equal(rpcCalls[0].expectedPendencyVersion, 3);
    assert.equal(rpcCalls[0].expectedVerificationVersion, 4);
    assert.equal(rpcCalls[0].attempt.id, 'attempt-reanalysis-1');
    assert.equal(rpcCalls[0].administrativeLog.id, 'op-log-1');
    assert.notEqual(rpcCalls[0].administrativeLog.id, 'zzzz-preexisting-log');
    assert.equal(data.getDefaultPersistCalls(), 0);
});

test('edição de escola seleciona o log criado pelo comando e preserva a versão anterior', async () => {
    const rpcCalls = [];
    const repository = {
        saveSchoolWithPrograms: async input => {
            rpcCalls.push(structuredClone(input));
            return input;
        }
    };
    const harness = createAdministrativeHarness(SchoolService, repository, state => {
        state.controllers = [{ id: 'CTRL-1', name: 'Controlador Um', active: true }];
        state.schools[0].controladorId = 'CTRL-1';
        state.schools[0].rowVersion = 7;
        state.logs.push({
            id: 'zzzz-school-log', usuario: 'Outro', perfil: 'Administrador',
            acao: 'Log preexistente', detalhes: '', dataHora: '2026-07-22T23:59:00.000Z'
        });
    });

    await harness.service.saveSchool({
        id: '04.10.001', controllerId: 'CTRL-1', programIds: ['BASIC'],
        phone: '2122223333'
    });

    assert.equal(rpcCalls.length, 1);
    assert.equal(rpcCalls[0].expectedSchoolVersion, 7);
    assert.equal(rpcCalls[0].administrativeLog.id, 'op-log-1');
    assert.notEqual(rpcCalls[0].administrativeLog.id, 'zzzz-school-log');
    assert.equal(harness.getDefaultPersistCalls(), 0);
});

test('criação de exercício seleciona o log criado pelo comando', async () => {
    const rpcCalls = [];
    const repository = {
        saveExerciseWithCompetences: async input => {
            rpcCalls.push(structuredClone(input));
            return input;
        }
    };
    const harness = createAdministrativeHarness(ConfigurationService, repository, state => {
        state.logs.push({
            id: 'zzzz-exercise-log', usuario: 'Outro', perfil: 'Administrador',
            acao: 'Log preexistente', detalhes: '', dataHora: '2026-07-22T23:59:00.000Z'
        });
    });

    await harness.service.createExercise({ year: '2035', initialMonth: '03' });

    assert.equal(rpcCalls.length, 1);
    assert.equal(rpcCalls[0].competences.filter(item => item.id.startsWith('2035-')).length, 12);
    assert.equal(rpcCalls[0].administrativeLog.id, 'op-log-1');
    assert.notEqual(rpcCalls[0].administrativeLog.id, 'zzzz-exercise-log');
    assert.equal(harness.getDefaultPersistCalls(), 0);
});
