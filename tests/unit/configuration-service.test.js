'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { ConfigurationService } = require('../../src/application/configuration-service.js');

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
    const existingCompetences = Array.from({ length: 12 }, (_item, index) => {
        const month = String(index + 1).padStart(2, '0');
        return {
            key: `2026-${month}`,
            label: `Competência ${month}/2026`,
            bonifPrazo: `2026-${month}-15`
        };
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
    const persisted = [];
    const repository = {
        async saveExerciseWithCompetences(input) {
            persisted.push(input);
            return { ok: true };
        }
    };
    const appendLog = (action, details) => {
        const log = {
            id: `log-${state.logs.length + 1}`,
            action,
            details
        };
        state.logs.unshift(log);
        return log;
    };
    const dataService = {
        async execute(command) {
            const value = await command.mutate();
            const snapshot = {
                entities: {
                    appConfig: [{ id: 'global' }],
                    competences: state.competences.map(item => ({
                        id: item.key,
                        exercise: Number(item.key.slice(0, 4)),
                        label: item.label,
                        bonus_deadline: item.bonifPrazo
                    })),
                    administrativeLogs: state.logs.map(item => ({ ...item }))
                }
            };
            await command.persist({
                snapshot,
                repository,
                defaultPersist: async () => {
                    throw new Error('A criação remota deve usar o RPC transacional.');
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
    return { state, persisted, service };
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

test('envia ao RPC somente as doze competências do novo exercício', async () => {
    const harness = createRemoteExerciseHarness();

    await harness.service.createExercise({ year: '2027', initialMonth: '05' });

    assert.equal(harness.state.competences.length, 24);
    assert.equal(harness.persisted.length, 1);
    assert.equal(harness.persisted[0].competences.length, 12);
    assert.equal(
        harness.persisted[0].competences.some(item => item.id.startsWith('2026-')),
        false
    );
    assert.deepEqual(
        harness.persisted[0].competences.map(item => item.id),
        Array.from({ length: 12 }, (_item, index) => `2027-${String(index + 1).padStart(2, '0')}`)
    );
});
