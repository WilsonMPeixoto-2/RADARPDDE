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

