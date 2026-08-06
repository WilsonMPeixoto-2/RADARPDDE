'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { ConfigurationService, createCompetence } = require('../../src/application/configuration-service.js');

function createHarness() {
    const state = {
        config: {
            exercicios: ['2026'],
            competenciaFechamento: '2026-05',
            prazoBonificacaoProrrogado: false,
            competencias: []
        },
        competences: [],
        logs: []
    };
    const calls = [];
    const dataService = {
        async execute(command) {
            calls.push(command);
            const value = await command.mutate();
            return { ok: true, value };
        }
    };
    const appendLog = (action, details) => state.logs.unshift({ action, details });
    const service = new ConfigurationService({
        dataService,
        getState: () => state,
        appendLog
    });
    return { state, calls, service };
}

function createRemoteExerciseHarness() {
    const existingCompetences = Array.from({ length: 12 }, (_unused, index) => {
        const month = String(index + 1).padStart(2, '0');
        return createCompetence('2026', month);
    });
    const state = {
        config: {
            exercicios: ['2026'],
            competenciaFechamento: '2026-05',
            prazoBonificacaoProrrogado: false,
            competencias: existingCompetences.map(item => ({ ...item }))
        },
        competences: existingCompetences.map(item => ({ ...item })),
        logs: []
    };
    let persistedInput = null;
    const repository = {
        async saveExerciseWithCompetences(input) {
            persistedInput = input;
            return { ok: true };
        }
    };
    const appendLog = (action, details) => {
        const log = {
            id: `log-${state.logs.length + 1}`,
            action,
            details,
            actorUserId: '00000000-0000-4000-8000-000000000001'
        };
        state.logs.unshift(log);
        return log;
    };
    const dataService = {
        async execute(command) {
            const value = await command.mutate();
            const snapshot = {
                entities: {
                    appConfig: [{
                        id: 'global',
                        exercises: [...state.config.exercicios],
                        closing_competence: state.config.competenciaFechamento,
                        bonus_deadline_extended: state.config.prazoBonificacaoProrrogado,
                        settings: {}
                    }],
                    competences: state.competences.map(item => ({
                        id: item.key,
                        exercise: Number(item.key.slice(0, 4)),
                        month: Number(item.key.slice(5, 7)),
                        label: item.label,
                        bonus_deadline: item.bonifPrazo,
                        payload: {}
                    })),
                    administrativeLogs: state.logs.map(item => ({
                        id: item.id,
                        actor_user_id: item.actorUserId,
                        action: item.action,
                        details: {},
                        event_at: '2026-08-06T00:00:00.000Z'
                    }))
                }
            };
            await command.persist({
                snapshot,
                repository,
                defaultPersist: async () => {
                    throw new Error('A persistência específica do exercício deveria ser usada.');
                }
            });
            return { ok: true, value };
        }
    };
    const service = new ConfigurationService({
        dataService,
        getState: () => state,
        appendLog
    });
    return {
        state,
        service,
        getPersistedInput: () => persistedInput
    };
}

test('salva calendário e prorrogação com auditoria na mesma unidade de trabalho', async () => {
    const harness = createHarness();
    harness.state.competences.push({ key: '2026-06', label: 'Junho 2026', bonifPrazo: '2026-07-15' });

    const result = await harness.service.saveCalendar({
        closingCompetence: '2026-06',
        bonusWindowExtended: true
    });

    assert.equal(result.ok, true);
    assert.equal(harness.state.config.competenciaFechamento, '2026-06');
    assert.equal(harness.state.config.prazoBonificacaoProrrogado, true);
    assert.equal(harness.state.logs[0].action, 'Calendário Alterado');
    assert.deepEqual(
        harness.calls[0].changedEntities,
        ['appConfig', 'administrativeLogs']
    );
});

test('cria exercício com doze competências, prazo e auditoria sem duplicar ano', async () => {
    const harness = createHarness();

    const result = await harness.service.createExercise({ year: '2027', initialMonth: '05' });

    assert.equal(result.value.year, '2027');
    assert.equal(result.value.initialCompetence, '2027-05');
    assert.equal(harness.state.config.competenciaFechamento, '2027-05');
    assert.deepEqual(harness.state.config.exercicios, ['2026', '2027']);
    assert.equal(harness.state.competences.length, 12);
    assert.deepEqual(harness.state.competences[0], {
        key: '2027-01',
        label: 'Janeiro 2027',
        bonifPrazo: '2027-02-15'
    });
    assert.equal(harness.state.competences[11].bonifPrazo, '2028-01-15');
    assert.equal(harness.state.config.competencias.length, 12);
    assert.equal(harness.state.logs[0].action, 'Exercício Criado');
    assert.deepEqual(
        harness.calls[0].changedEntities,
        ['appConfig', 'competences', 'administrativeLogs']
    );

    await assert.rejects(
        () => harness.service.createExercise({ year: '2027', initialMonth: '06' }),
        error => error && error.code === 'DUPLICATE_EXERCISE'
    );
});

test('envia à RPC somente as doze competências do novo exercício quando já há exercício anterior', async () => {
    const harness = createRemoteExerciseHarness();

    const result = await harness.service.createExercise({ year: '2027', initialMonth: '03' });
    const persisted = harness.getPersistedInput();

    assert.equal(result.value.initialCompetence, '2027-03');
    assert.equal(harness.state.competences.length, 24);
    assert.ok(persisted);
    assert.equal(persisted.competences.length, 12);
    assert.ok(persisted.competences.every(item => item.exercise === 2027));
});
