'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createStatePort } = require('../../src/application/state-port.js');
const bridge = require('../../src/data/state-bridge-metadata.js');
const { collections, envelope, emptyCollections } = require('../fixtures/school-operational-context.js');

function harness() {
    const local = collections(), foreign = collections('T'), history = collections('S', '-history');
    history.verifications[0].competence_id = '2026-03';
    history.verifications[0].id = 'S::2026-03::BASIC-history';
    const all = Object.fromEntries(Object.keys(local).map(entity => [entity, [...local[entity], ...foreign[entity], ...history[entity]]]));
    all.pendencyContacts.push({ id: 'general', school_id: 'S', pendency_id: null, payload: {} });
    let memory = bridge.canonicalEntitiesToLegacyState(all);
    const patches = [];
    const storage = { length: 0, key: () => null, getItem: () => null,
        setItem() { throw new Error('Sem persistência operacional no navegador'); }, removeItem() {} };
    const port = createStatePort({ storage, readMemory: () => memory, writeMemory() {},
        patchSchoolMemory(patch) { patches.push(patch); memory = { ...memory, ...patch }; } });
    return { port, get memory() { return memory; }, patches, local, foreign, history };
}

test('fatia substitui seis coleções em um patch, remove última linha e filhos do pai anterior', () => {
    const h = harness();
    const other = h.memory.pendencies.find(row => row.escolaId === 'T');
    const historical = h.memory.pendencies.find(row => row.id === 'pS-history');
    const unrelatedVerification = h.memory.verifications.T;
    const result = h.port.applySchoolOperationalContext(envelope(emptyCollections()), envelope(h.local), { shouldApply: () => true });
    assert.equal(result.stale, false);
    assert.equal(h.patches.length, 1);
    assert.deepEqual(Object.keys(h.patches[0]).sort(), ['assets', 'contacts', 'pendencies', 'registeredInvoices', 'verifications']);
    assert.equal(h.memory.verifications.S['2026-08_BASIC'], undefined);
    assert.equal(h.memory.verifications.T, unrelatedVerification);
    assert.equal(h.memory.pendencies.includes(other), true);
    assert.equal(h.memory.pendencies.includes(historical), true);
    assert.equal(h.memory.pendencies.some(row => row.id === 'pS'), false);
    assert.equal(h.memory.contacts.some(row => row.id === 'cS'), false);
    assert.equal(h.memory.contacts.some(row => row.id === 'general'), true);
    assert.equal(h.memory.assets.some(row => row.id === 'aS'), false);
    assert.equal(h.memory.registeredInvoices.some(row => row.id === 'iS'), false);
});

test('alterações, criações e filhos novos substituem a cobertura, preservando estado alheio', () => {
    const h = harness();
    const next = collections();
    next.registeredInvoices[0].amount = 99;
    next.pendencies[0].status = 'Aguardando reanálise';
    next.pendencyAttempts.push({ id: 't-new', pendency_id: 'pS', attempt_number: 2, payload: {} });
    h.port.applySchoolOperationalContext(envelope(next), envelope(h.local), { shouldApply: () => true });
    assert.equal(h.memory.registeredInvoices.find(row => row.id === 'iS').valor, 99);
    assert.deepEqual(h.memory.pendencies.find(row => row.id === 'pS').tentativas.map(row => row.id), ['tS', 't-new']);
    assert.equal(h.memory.pendencies.find(row => row.id === 'pS').status, 'Aguardando reanálise');
    assert.equal(h.memory.contacts.some(row => row.id === 'general'), true);
});

test('incompleto/fallback não aplica nenhuma coleção; envelope inválido não modifica memória', () => {
    const h = harness(), before = structuredClone(h.memory);
    const incomplete = envelope(collections(), { coverage: { ...envelope().coverage, complete: false } });
    assert.equal(h.port.applySchoolOperationalContext(incomplete, envelope(h.local), { shouldApply: () => true }).fallback, true);
    assert.throws(() => h.port.applySchoolOperationalContext(envelope({ ...collections(), assets: null }), envelope(h.local)),
        { code: 'INVALID_SCHOOL_OPERATIONAL_CONTEXT' });
    assert.deepEqual(h.memory, before);
    assert.equal(h.patches.length, 0);
});

test('checagem na fronteira de aplicação descarta resposta obsoleta sem patch', () => {
    const h = harness(), before = structuredClone(h.memory);
    assert.equal(h.port.applySchoolOperationalContext(envelope(emptyCollections()), envelope(h.local),
        { shouldApply: () => false }).stale, true);
    assert.deepEqual(h.memory, before);
    assert.equal(h.patches.length, 0);
});

test('identidade fora da escola na memória exige fallback, sem remover registro estrangeiro', () => {
    const h = harness();
    h.memory.assets.find(row => row.id === 'aS').escolaId = 'T';
    const before = structuredClone(h.memory);
    const result = h.port.applySchoolOperationalContext(envelope(emptyCollections()), envelope(h.local), { shouldApply: () => true });
    assert.equal(result.fallback, true);
    assert.deepEqual(h.memory, before);
    assert.equal(h.patches.length, 0);
});

test('falha ao preparar projeção acontece antes de expor qualquer parte da fatia', () => {
    const h = harness();
    const before = structuredClone(h.memory);
    const broken = { ...collections(), pendencyAttempts: [{ id: 'broken', pendency_id: 'absent' }] };
    assert.throws(() => h.port.applySchoolOperationalContext(envelope(broken), envelope(h.local)));
    assert.deepEqual(h.memory, before);
    assert.equal(h.patches.length, 0);
});

test('bridge que falha ou muda geração durante preparação nunca publica meio estado', () => {
    for (const throws of [false, true]) {
        let current = true, patches = 0;
        const memory = bridge.canonicalEntitiesToLegacyState(collections());
        const port = createStatePort({ storage: { length: 0, key() {}, getItem() {}, setItem() {}, removeItem() {} },
            readMemory: () => memory, patchSchoolMemory() { patches += 1; },
            bridge: { ...bridge, canonicalEntitiesToLegacyState(entities) {
                if (throws) throw new Error('transform failed');
                current = false; return bridge.canonicalEntitiesToLegacyState(entities);
            } } });
        const apply = () => port.applySchoolOperationalContext(envelope(emptyCollections()), envelope(collections()),
            { shouldApply: () => current });
        if (throws) assert.throws(apply, /transform failed/);
        else assert.equal(apply().stale, true);
        assert.equal(patches, 0);
    }
});

test('adaptador assíncrono não é capacidade de commit escolar atômico', () => {
    let calls = 0;
    const port = createStatePort({ storage: { length: 0, key() {}, getItem() {}, setItem() {}, removeItem() {} },
        readMemory: () => bridge.canonicalEntitiesToLegacyState(collections()),
        async patchSchoolMemory() { calls += 1; } });
    assert.equal(port.supportsSchoolOperationalContext(), false);
    assert.equal(port.applySchoolOperationalContext(envelope(), envelope(collections())).fallback, true);
    assert.equal(calls, 0);
});

test('commit real do navegador troca estado e índices sem reconstruir escolas alheias', () => {
    const fs = require('node:fs'), vm = require('node:vm');
    const root = vm.createContext({ document: {}, structuredClone,
        RadarRepositoryContract: require('../../src/data/repository-contract.js'), RadarStateBridge: bridge });
    root.window = root;
    const entities = Object.fromEntries(Object.keys(collections()).map(entity => [entity, [...collections()[entity], ...collections('T')[entity]]]));
    root.initial = bridge.canonicalEntitiesToLegacyState(entities);
    vm.runInContext('let verificacoes = initial.verifications, pendencias = initial.pendencies, contatos = initial.contacts, bens = initial.assets, notasRegistradas = initial.registeredInvoices; let _pendenciasByEscolaId = new Map(), _bensByEscolaId = new Map();', root);
    vm.runInContext(fs.readFileSync(require.resolve('../../src/application/state-port.js'), 'utf8'), root);
    const port = root.RadarStatePort.createStatePort({ storage: { length: 0, key() {}, getItem() {}, setItem() {}, removeItem() {} } });
    assert.equal(port.supportsSchoolOperationalContext(), true);
    port.applySchoolOperationalContext(envelope(emptyCollections()), envelope(collections()), { shouldApply: () => true });
    assert.equal(vm.runInContext('_pendenciasByEscolaId.has("S") || _bensByEscolaId.has("S")', root), false);
    assert.equal(vm.runInContext('_pendenciasByEscolaId.get("T")[0] === initial.pendencies[1]', root), true);
    assert.equal(vm.runInContext('verificacoes.T === initial.verifications.T', root), true);
    assert.equal(vm.runInContext('contatos.length + notasRegistradas.length', root), 2);
});
