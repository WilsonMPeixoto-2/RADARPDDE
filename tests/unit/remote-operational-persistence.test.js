'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { DataService } = require('../../src/application/data-service.js');
const { RepositoryError, createSnapshotEnvelope } = require('../../src/data/repository-contract.js');

function snapshot(entities) {
    return createSnapshotEnvelope(entities, {
        version: '1',
        importId: 'remote-operational-test',
        exportedAt: '2026-07-22T16:00:00.000Z'
    });
}

function clone(value) {
    return structuredClone(value);
}

function createHarness(initialEntities) {
    let current = snapshot(clone(initialEntities));
    const captures = [];
    const applied = [];
    const inserted = [];
    const saved = [];
    const removed = [];
    let repositoryRestoreCalls = 0;

    const repositoryState = clone(initialEntities);
    const repository = {
        capabilities: () => ({ mode: 'supabase', remote: true, writable: true }),
        load: async entity => clone(repositoryState[entity] || []),
        save: async (entity, records) => {
            saved.push({ entity, records: clone(records) });
            const byId = new Map((repositoryState[entity] || []).map(record => [String(record.id), record]));
            records.forEach(record => byId.set(String(record.id), clone(record)));
            repositoryState[entity] = [...byId.values()];
            return clone(records);
        },
        insertOnly: async (entity, records) => {
            inserted.push({ entity, records: clone(records) });
            repositoryState[entity] = [...(repositoryState[entity] || []), ...clone(records)];
            return clone(records);
        },
        remove: async (entity, id) => {
            removed.push({ entity, id });
            repositoryState[entity] = (repositoryState[entity] || [])
                .filter(record => String(record.id) !== String(id));
            return { removedId: id };
        },
        exportSnapshot: async () => snapshot(clone(repositoryState)),
        restoreSnapshot: async () => {
            repositoryRestoreCalls += 1;
        },
        healthCheck: async () => ({ ok: true, mode: 'supabase' })
    };

    const statePort = {
        capture: async () => {
            const capture = clone(current);
            captures.push(capture);
            return capture;
        },
        exportCanonical: async () => clone(current),
        applyCanonical: async next => {
            current = clone(next);
            applied.push(clone(next));
        },
        commitCurrent: next => {
            current = clone(next);
        },
        restore: async capture => {
            current = clone(capture);
        }
    };

    return {
        repository,
        statePort,
        inserted,
        saved,
        removed,
        applied,
        captures,
        getCurrent: () => clone(current),
        setCurrent: next => {
            current = clone(next);
        },
        getRepositoryState: () => clone(repositoryState),
        getRepositoryRestoreCalls: () => repositoryRestoreCalls
    };
}

function baseEntities() {
    return {
        competences: [{
            id: '2026-05',
            label: 'Maio 2026',
            exercise: 2026,
            row_version: 1
        }],
        verifications: [{
            id: 'ver-1',
            school_id: '04.31.001',
            competence_id: '2026-05',
            program_id: 'BASIC',
            bonification: { extCC: '' },
            analysis: { extCC: 'Não analisado' },
            bonus_result: null,
            payload: {},
            row_version: 1
        }],
        pendencyContacts: [],
        administrativeLogs: [{
            id: 'bootstrap-log',
            school_id: null,
            user_identifier: 'admin',
            profile_name: 'Administrador Técnico',
            action: 'Bootstrap',
            details: {},
            event_at: '2026-07-20T06:13:52.000Z'
        }]
    };
}

test('avaliação remota persiste somente a verificação alterada e o novo histórico', async () => {
    const harness = createHarness(baseEntities());
    const service = new DataService({ repository: harness.repository, statePort: harness.statePort });

    await service.execute({
        name: 'verification:set-technical-analysis',
        changedEntities: ['verifications', 'administrativeLogs'],
        mutate: () => {
            const next = harness.getCurrent();
            next.entities.verifications[0].analysis.extCC = 'Correto';
            next.entities.administrativeLogs.push({
                id: 'log-new',
                school_id: '04.31.001',
                user_identifier: 'controlador',
                profile_name: 'Controlador',
                action: 'Análise Técnica Alterada',
                details: { document: 'extCC' },
                event_at: '2026-07-22T16:01:00.000Z'
            });
            harness.setCurrent(next);
            return { verificationId: 'ver-1' };
        }
    });

    assert.deepEqual(harness.saved.map(call => call.entity), ['verifications']);
    assert.equal(harness.saved[0].records.length, 1);
    assert.equal(harness.saved[0].records[0].analysis.extCC, 'Correto');
    assert.deepEqual(harness.inserted.map(call => call.entity), ['administrativeLogs']);
    assert.deepEqual(harness.inserted[0].records.map(record => record.id), ['log-new']);
    assert.equal(harness.getRepositoryRestoreCalls(), 0);
    assert.equal(harness.saved.some(call => call.entity === 'competences'), false);
});

test('contato remoto omite campos gerados vazios antes do INSERT', async () => {
    const harness = createHarness(baseEntities());
    const service = new DataService({ repository: harness.repository, statePort: harness.statePort });

    await service.execute({
        name: 'pendency:register-contact',
        changedEntities: ['pendencyContacts', 'administrativeLogs'],
        mutate: () => {
            const next = harness.getCurrent();
            next.entities.pendencyContacts.push({
                id: 'cont-new',
                school_id: '04.31.001',
                pendency_id: null,
                contact_type: 'WhatsApp',
                contact_date: '2026-07-22',
                description: 'Contato de teste',
                official_charge: false,
                payload: {},
                created_by: null,
                row_version: null,
                created_at: '',
                updated_at: null
            });
            next.entities.administrativeLogs.push({
                id: 'log-contact',
                school_id: '04.31.001',
                user_identifier: 'controlador',
                profile_name: 'Controlador',
                action: 'Contato Registrado',
                details: {},
                event_at: '2026-07-22T16:02:00.000Z'
            });
            harness.setCurrent(next);
            return { contactId: 'cont-new' };
        }
    });

    const contactInsert = harness.inserted.find(call => call.entity === 'pendencyContacts');
    assert.ok(contactInsert);
    assert.equal(contactInsert.records.length, 1);
    assert.equal(Object.hasOwn(contactInsert.records[0], 'row_version'), false);
    assert.equal(Object.hasOwn(contactInsert.records[0], 'created_at'), false);
    assert.equal(Object.hasOwn(contactInsert.records[0], 'updated_at'), false);
});

test('falha remota restaura somente o estado local e nunca tenta restaurar o banco inteiro', async () => {
    const harness = createHarness(baseEntities());
    harness.repository.save = async () => {
        throw new RepositoryError('PERMISSION_DENIED', 'Falha remota induzida.', {
            operation: 'save'
        });
    };
    const service = new DataService({ repository: harness.repository, statePort: harness.statePort });
    const before = harness.getCurrent();

    await assert.rejects(
        service.execute({
            name: 'verification:set-bonification',
            changedEntities: ['verifications', 'administrativeLogs'],
            mutate: () => {
                const next = harness.getCurrent();
                next.entities.verifications[0].bonification.extCC = 'Sim';
                harness.setCurrent(next);
                return { verificationId: 'ver-1' };
            }
        }),
        error => error instanceof RepositoryError && error.code === 'PERMISSION_DENIED'
    );

    assert.deepEqual(harness.getCurrent(), before);
    assert.equal(harness.getRepositoryRestoreCalls(), 0);
});
