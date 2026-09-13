'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { createStatePort, INCREMENTAL_MEMORY_ENTITY_MAP } = require('../../src/application/state-port.js');

function memoryStorage() {
    const values = new Map();
    return {
        get length() { return values.size; },
        key(index) { return [...values.keys()][index] ?? null; },
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, String(value)); },
        removeItem(key) { values.delete(key); }
    };
}

function snapshot() {
    return {
        format: 'radar-pdde-snapshot',
        version: '1',
        importId: 'incremental-state-port',
        exportedAt: '2026-09-13T03:30:00.000Z',
        entities: {
            appConfig: [{ id: 'global', exercises: ['2026'], settings: {} }],
            programs: [{ id: 'BASIC', name: 'PDDE Básico', description: '', active: true }],
            controllers: [{ id: 'ctrl', name: 'Controlador', active: true }],
            inventoryTeamMembers: [{ id: 'inv', name: 'Inventário', active: true }],
            schools: [{ id: '04.31.001', designation: '04.31.001', denomination: 'Escola', active: true }],
            schoolPrograms: [{ id: '04.31.001::BASIC', school_id: '04.31.001', program_id: 'BASIC', active: true }],
            competences: [{ id: '2026-08', label: 'Agosto 2026', exercise: 2026 }],
            verifications: [{
                id: '04.31.001::2026-08::BASIC',
                school_id: '04.31.001',
                competence_id: '2026-08',
                program_id: 'BASIC',
                bonification: {},
                analysis: {},
                bonus_result: ''
            }],
            pendencies: [{
                id: 'pend-1',
                school_id: '04.31.001',
                competence_origin: '2026-08',
                program_id: 'BASIC',
                document_key: 'extCC',
                status: 'Aberta',
                payload: {}
            }],
            pendencyAttempts: [{
                id: 'attempt-1',
                pendency_id: 'pend-1',
                attempt_number: 1,
                submitted_at: '2026-09-01T12:00:00.000Z',
                available_at: '2026-09-01',
                payload: {}
            }],
            pendencyContacts: [{
                id: 'contact-1',
                school_id: '04.31.001',
                pendency_id: 'pend-1',
                contact_type: 'E-mail',
                contact_date: '2026-09-01',
                description: 'Cobrança',
                payload: {}
            }],
            assets: [{
                id: 'asset-1',
                school_id: '04.31.001',
                description: 'Notebook',
                expense_type: 'permanente',
                status: 'Não encaminhada',
                amount: 1000,
                payload: {}
            }],
            registeredInvoices: [{
                id: 'invoice-1',
                school_id: '04.31.001',
                competence_id: '2026-08',
                program_id: 'BASIC',
                source_context_key: '2026-08_BASIC',
                description: 'Notebook',
                expense_type: 'permanente',
                amount: 1000,
                payload: {}
            }],
            administrativeLogs: [{
                id: 'log-1',
                school_id: '04.31.001',
                action: 'Teste',
                details: {},
                event_at: '2026-09-01T12:00:00.000Z'
            }]
        }
    };
}

const EXPECTED_INCREMENTAL = [
    'appConfig',
    'programs',
    'controllers',
    'inventoryTeamMembers',
    'schools',
    'schoolPrograms',
    'competences',
    'verifications',
    'pendencies',
    'pendencyAttempts',
    'pendencyContacts',
    'assets',
    'registeredInvoices',
    'administrativeLogs'
];

test('porta remota oferece atualização incremental para todo o estado operacional do RADAR', () => {
    EXPECTED_INCREMENTAL.forEach(entity => {
        assert.equal(
            typeof INCREMENTAL_MEMORY_ENTITY_MAP[entity],
            'string',
            `${entity} precisa possuir destino incremental na memória do navegador`
        );
    });
});

test('atualização de uma pendência preserva tentativas já presentes no snapshot completo', async () => {
    let patch = null;
    const port = createStatePort({
        storage: memoryStorage(),
        readMemory: () => ({}),
        writeMemory: () => undefined,
        patchMemory: value => { patch = structuredClone(value); }
    });

    await port.applyEntities(snapshot(), ['pendencies'], {
        persistStorage: false,
        source: 'remote-result-incremental'
    });

    assert.equal(Array.isArray(patch?.pendencies), true);
    assert.equal(patch.pendencies.length, 1);
    assert.equal(patch.pendencies[0].id, 'pend-1');
    assert.equal(patch.pendencies[0].tentativas?.length, 1);
    assert.equal(patch.pendencies[0].tentativas[0].id, 'attempt-1');
});

test('alteração de vínculo de programa recalcula somente a projeção escolar em memória', async () => {
    let patch = null;
    const port = createStatePort({
        storage: memoryStorage(),
        readMemory: () => ({}),
        writeMemory: () => undefined,
        patchMemory: value => { patch = structuredClone(value); }
    });

    await port.applyEntities(snapshot(), ['schoolPrograms'], {
        persistStorage: false,
        source: 'remote-result-incremental'
    });

    assert.equal(Array.isArray(patch?.schools), true);
    assert.deepEqual(patch.schools[0].programasIds, ['BASIC']);
    assert.deepEqual(Object.keys(patch), ['schools']);
});

test('patch real do navegador reconstrói índices usados na Carteira após substituir pendências e bens', async () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const vm = require('node:vm');
    const root = vm.createContext({ document: {}, structuredClone,
        RadarRepositoryContract: require('../../src/data/repository-contract.js'),
        RadarStateBridge: require('../../src/data/state-bridge-metadata.js'),
        storage: memoryStorage()
    });
    root.window = root;
    vm.runInContext('let pendencias = []; let bens = []; let _pendenciasByEscolaId = new Map(); let _bensByEscolaId = new Map();', root);
    const app = fs.readFileSync(path.join(__dirname, '../../app.js'), 'utf8');
    vm.runInContext(app.slice(app.indexOf('function rebuildOperationalIndexes()'), app.indexOf('let verificacoes =')), root);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../src/application/state-port.js'), 'utf8'), root);
    const port = root.RadarStatePort.createStatePort({ storage: root.storage, readMemory: () => ({}), writeMemory() {} });
    await port.applyEntities(snapshot(), ['pendencies', 'assets'], { persistStorage: false });
    assert.equal(vm.runInContext('_pendenciasByEscolaId.get("04.31.001")[0].id', root), 'pend-1');
    assert.equal(vm.runInContext('_bensByEscolaId.get("04.31.001")[0].id', root), 'asset-1');
    await port.applyEntities({ ...snapshot(), entities: { pendencies: [], pendencyAttempts: [], assets: [] } }, ['pendencies', 'assets'], { persistStorage: false });
    assert.equal(vm.runInContext('_pendenciasByEscolaId.size + _bensByEscolaId.size', root), 0);
});
