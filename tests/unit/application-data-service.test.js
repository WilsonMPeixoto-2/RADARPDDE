'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createStatePort } = require('../../src/application/state-port.js');
const { UnitOfWork } = require('../../src/application/unit-of-work.js');
const { DataService } = require('../../src/application/data-service.js');
const bridge = require('../../src/data/state-bridge-metadata.js');
const { LocalStorageRepository } = require('../../src/data/local-storage-repository.js');
const { RepositoryError, createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function createMemoryStorage(seed = {}) {
    const values = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)]));
    return {
        get length() {
            return values.size;
        },
        key(index) {
            return [...values.keys()][index] ?? null;
        },
        getItem(key) {
            return values.has(key) ? values.get(key) : null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        },
        removeItem(key) {
            values.delete(key);
        },
        dump() {
            return Object.fromEntries(values.entries());
        }
    };
}

function createLegacyState(name = 'Escola Inicial') {
    return {
        config: {
            exercicios: ['2026'],
            competenciaFechamento: '2026-05',
            prazoBonificacaoProrrogado: false,
            competencias: [{ key: '2026-05', label: 'Maio 2026', bonifPrazo: '2026-06-15' }]
        },
        programs: [{ id: 'BASIC', name: 'PDDE Básico', desc: '' }],
        controllers: [],
        inventoryTeamMembers: [],
        schools: [{
            id: '04.31.001',
            designação: '04.31.001',
            denominação: name,
            programasIds: ['BASIC'],
            competenciaInicial: '2026-01'
        }],
        verifications: {},
        pendencies: [],
        contacts: [],
        assets: [],
        registeredInvoices: [],
        logs: [],
        dataVersion: 'test-v1',
        pendencySchemaVersion: '2'
    };
}

function seedLegacyStorage(storage, state) {
    Object.entries(bridge.LEGACY_STORAGE_MAP).forEach(([stateKey, descriptor]) => {
        storage.setItem(descriptor.key, JSON.stringify(state[stateKey] ?? descriptor.fallback));
    });
    storage.setItem('radar_pdde_data_version', state.dataVersion);
    storage.setItem('radar_pdde_pendency_schema_version', state.pendencySchemaVersion);
}

function createPortHarness(initialState = createLegacyState()) {
    const storage = createMemoryStorage({ unrelated: 'preserve' });
    seedLegacyStorage(storage, initialState);
    let memory = structuredClone(initialState);
    const statePort = createStatePort({
        storage,
        bridge,
        readMemory: () => structuredClone(memory),
        writeMemory: next => {
            memory = structuredClone(next);
        },
        dataVersion: 'test-v1',
        pendencySchemaVersion: '2'
    });
    return {
        storage,
        statePort,
        getMemory: () => structuredClone(memory),
        setMemory: next => {
            memory = structuredClone(next);
        }
    };
}

test('state port captura e restaura memória e todas as chaves radar_pdde_* sem tocar em outras chaves', async () => {
    const harness = createPortHarness();
    harness.storage.setItem('radar_pdde_custom_future_key', 'original');
    const capture = await harness.statePort.capture();

    const mutated = harness.getMemory();
    mutated.schools[0].denominação = 'Alterada';
    harness.setMemory(mutated);
    harness.storage.setItem('radar_pdde_escolas', JSON.stringify(mutated.schools));
    harness.storage.setItem('radar_pdde_custom_future_key', 'alterada');
    harness.storage.setItem('radar_pdde_new_key', 'remover');
    harness.storage.setItem('unrelated', 'continua');

    await harness.statePort.restore(capture);

    assert.equal(harness.getMemory().schools[0].denominação, 'Escola Inicial');
    assert.equal(harness.storage.getItem('radar_pdde_custom_future_key'), 'original');
    assert.equal(harness.storage.getItem('radar_pdde_new_key'), null);
    assert.equal(harness.storage.getItem('unrelated'), 'continua');
});

test('bootstrap importa o legado uma única vez quando o repositório local canônico está vazio', async () => {
    const harness = createPortHarness();
    const canonicalStorage = createMemoryStorage();
    const repository = new LocalStorageRepository({
        storage: canonicalStorage,
        keyPrefix: 'canonical',
        schemaVersion: '1'
    });
    const service = new DataService({
        repository,
        statePort: harness.statePort,
        unitOfWork: new UnitOfWork({ statePort: harness.statePort })
    });

    const first = await service.bootstrap();
    const second = await service.bootstrap();

    assert.equal(first.importedLegacy, true);
    assert.equal(second.importedLegacy, false);
    assert.equal((await repository.load('schools')).length, 1);
    assert.equal((await repository.load('schools'))[0].denomination, 'Escola Inicial');
});

test('bootstrap nunca semeia um repositório Supabase vazio com dados locais', async () => {
    let restored = 0;
    let applied = 0;
    const emptySnapshot = createSnapshotEnvelope({}, {
        importId: 'remote-empty',
        exportedAt: '2026-07-14T12:00:00.000Z'
    });
    const repository = {
        capabilities: () => ({ mode: 'supabase', remote: true, canImportLegacy: false }),
        load: async () => [],
        save: async () => [],
        remove: async () => ({ removed: 0 }),
        exportSnapshot: async () => structuredClone(emptySnapshot),
        restoreSnapshot: async () => {
            restored += 1;
        },
        healthCheck: async () => ({ ok: true, mode: 'supabase' })
    };
    const statePort = {
        capture: async () => ({ memory: {}, storage: {} }),
        exportCanonical: async () => {
            throw new Error('Dados locais não podem ser exportados para seed remoto automático.');
        },
        applyCanonical: async () => {
            applied += 1;
        },
        restore: async () => undefined
    };
    const service = new DataService({ repository, statePort });

    const result = await service.bootstrap();

    assert.equal(result.importedLegacy, false);
    assert.equal(result.empty, true);
    assert.equal(restored, 0);
    assert.equal(applied, 0);
});

test('execute restaura memória, armazenamento e repositório quando a persistência falha', async () => {
    const harness = createPortHarness();
    const beforeStorage = harness.storage.dump();
    const beforeMemory = harness.getMemory();
    const repositoryState = {
        schools: [{ id: '04.31.001', name: 'Escola Inicial' }],
        programs: [{ id: 'BASIC', name: 'PDDE Básico' }]
    };
    const repository = {
        capabilities: () => ({ mode: 'local', remote: false, canImportLegacy: true }),
        load: async entity => structuredClone(repositoryState[entity] || []),
        exportSnapshot: async () => createSnapshotEnvelope(repositoryState, {
            importId: 'before-command',
            exportedAt: '2026-07-14T12:00:00.000Z'
        }),
        save: async (entity, records) => {
            repositoryState[entity] = structuredClone(records);
            if (entity === 'programs') {
                throw new RepositoryError('WRITE_FAILED', 'Falha induzida.', { entity });
            }
        },
        remove: async () => ({ removed: 0 }),
        restoreSnapshot: async snapshot => {
            Object.keys(repositoryState).forEach(key => delete repositoryState[key]);
            Object.assign(repositoryState, structuredClone(snapshot.entities));
        },
        healthCheck: async () => ({ ok: true, mode: 'local' })
    };
    const service = new DataService({
        repository,
        statePort: harness.statePort,
        unitOfWork: new UnitOfWork({ statePort: harness.statePort })
    });

    await assert.rejects(
        service.execute({
            name: 'alterar escola e programa',
            changedEntities: ['schools', 'programs'],
            mutate: () => {
                const next = harness.getMemory();
                next.schools[0].denominação = 'Escola Alterada';
                next.programs[0].name = 'Programa Alterado';
                harness.setMemory(next);
                return { schoolId: '04.31.001' };
            }
        }),
        error => error instanceof RepositoryError && error.code === 'TRANSACTION_FAILED'
    );

    assert.deepEqual(harness.getMemory(), beforeMemory);
    assert.deepEqual(harness.storage.dump(), beforeStorage);
    assert.deepEqual(repositoryState.schools, [{ id: '04.31.001', name: 'Escola Inicial' }]);
    assert.deepEqual(repositoryState.programs, [{ id: 'BASIC', name: 'PDDE Básico' }]);
});

test('execute devolve resultado e snapshot clonados depois de uma gravação bem-sucedida', async () => {
    const harness = createPortHarness();
    const repository = new LocalStorageRepository({
        storage: createMemoryStorage(),
        keyPrefix: 'canonical'
    });
    const service = new DataService({
        repository,
        statePort: harness.statePort,
        unitOfWork: new UnitOfWork({ statePort: harness.statePort })
    });
    await service.bootstrap();

    const result = await service.execute({
        name: 'renomear escola',
        changedEntities: ['schools'],
        mutate: () => {
            const next = harness.getMemory();
            next.schools[0].denominação = 'Escola Confirmada';
            harness.setMemory(next);
            return { schoolId: '04.31.001' };
        }
    });

    assert.equal(result.ok, true);
    assert.deepEqual(result.value, { schoolId: '04.31.001' });
    assert.equal(result.snapshot.entities.schools[0].denomination, 'Escola Confirmada');
    result.snapshot.entities.schools[0].denomination = 'Mutação externa';
    assert.equal((await repository.load('schools'))[0].denomination, 'Escola Confirmada');
});

test('execute preserva exatamente o estado legado em memória e armazenamento após persistir o canônico', async () => {
    const initial = createLegacyState();
    initial.pendencies = [{
        id: 'pend-exata',
        escolaId: '04.31.001',
        competenciaOrigem: '2026-05',
        programaId: 'BASIC',
        documentoKey: 'extCC',
        status: 'Resolvida',
        responsavel: null,
        motivo: null,
        dataAbertura: '2026-06-01',
        dataResolucao: '2026-06-02',
        tentativas: [{
            id: 'tentativa-exata',
            numero: 1,
            dataRegistro: '2026-06-01T12:00:00.000Z',
            dataDisponibilizacao: '2026-06-01',
            link: null,
            resultado: 'correto'
        }],
        historico: []
    }];
    initial.assets = [{
        id: 'bem-legado-incompleto',
        escolaId: '04.31.001',
        item: 'Bem preservado',
        status: 'Não encaminhada'
    }];
    const harness = createPortHarness(initial);
    const repository = new LocalStorageRepository({
        storage: createMemoryStorage(),
        keyPrefix: 'canonical-exact'
    });
    const service = new DataService({ repository, statePort: harness.statePort });
    await service.bootstrap();
    harness.setMemory(initial);

    await service.execute({
        name: 'preservar legado exato',
        changedEntities: ['pendencies', 'pendencyAttempts', 'assets'],
        mutate: () => ({ saved: true })
    });

    assert.deepEqual(harness.getMemory().pendencies, initial.pendencies);
    assert.deepEqual(harness.getMemory().assets, initial.assets);
    assert.deepEqual(
        JSON.parse(harness.storage.getItem('radar_pdde_pendencias')),
        initial.pendencies
    );
    assert.deepEqual(
        JSON.parse(harness.storage.getItem('radar_pdde_bens')),
        initial.assets
    );
});

test('execute preserva código e mensagem de erro de domínio depois de restaurar a mutação', async () => {
    const harness = createPortHarness();
    const repository = new LocalStorageRepository({
        storage: createMemoryStorage(),
        keyPrefix: 'canonical',
        schemaVersion: '1'
    });
    const service = new DataService({ repository, statePort: harness.statePort });
    await service.bootstrap();
    const before = harness.getMemory();

    await assert.rejects(
        () => service.execute({
            name: 'duplicate-domain-command',
            changedEntities: ['appConfig'],
            mutate: () => {
                harness.setMemory({ ...before, config: { altered: true } });
                throw new RepositoryError(
                    'DUPLICATE_EXERCISE',
                    'O exercício já está cadastrado.',
                    { operation: 'createExercise' }
                );
            }
        }),
        error => error instanceof RepositoryError
            && error.code === 'DUPLICATE_EXERCISE'
            && error.message === 'O exercício já está cadastrado.'
    );

    assert.deepEqual(harness.getMemory(), before);
});

test('compatibilidade prepara a gravação sincronicamente e restaura tudo se localStorage falhar', async () => {
    const harness = createPortHarness();
    const repository = new LocalStorageRepository({
        storage: createMemoryStorage(),
        keyPrefix: 'canonical-compatibility'
    });
    const service = new DataService({ repository, statePort: harness.statePort });
    await service.bootstrap();
    const beforeMemory = harness.getMemory();
    const beforeStorage = harness.storage.dump();
    const originalSetItem = harness.storage.setItem.bind(harness.storage);
    let failed = false;
    harness.storage.setItem = (key, value) => {
        if (!failed && key === 'radar_pdde_logs') {
            failed = true;
            throw new Error('Falha síncrona induzida.');
        }
        originalSetItem(key, value);
    };

    assert.throws(
        () => service.stageCompatibility({ changedEntities: ['administrativeLogs'] }),
        error => error instanceof RepositoryError && error.code === 'TRANSACTION_FAILED'
    );
    assert.deepEqual(harness.getMemory(), beforeMemory);
    assert.deepEqual(harness.storage.dump(), beforeStorage);
});
