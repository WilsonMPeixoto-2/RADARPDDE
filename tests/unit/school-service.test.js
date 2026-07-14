'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { SchoolService } = require('../../src/application/school-service.js');

function createHarness() {
    const state = {
        schools: [{
            id: 'ESC-1',
            inep: '33000001',
            cnpj: '00.000.000/0001-00',
            denominação: 'Escola Original',
            designação: '04.01.001',
            cre: '4ª CRE',
            ra: 'RA 1',
            sici: '',
            email: '',
            diretor: 'Diretor',
            telefoneDiretor: '',
            diretorAdjunto: '',
            telefoneDiretorAdjunto: '',
            telefone: '',
            telefoneCelularInstitucional: '',
            controladorId: 'CTRL-1',
            processoInventario: '',
            programasIds: ['BASIC', 'OLD'],
            competenciaInicial: '2026-05',
            active: true
        }],
        programs: [
            { id: 'BASIC', active: true },
            { id: 'NEW', active: true },
            { id: 'OLD', active: false }
        ],
        controllers: [
            { id: 'CTRL-1', name: 'Um', active: true },
            { id: 'CTRL-2', name: 'Dois', active: true }
        ],
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
    const service = new SchoolService({
        dataService,
        getState: () => state,
        appendLog: (action, details) => state.logs.unshift({ action, details }),
        createId: () => 'ESC-NEW',
        createInep: () => '33099999',
        createCnpj: () => '00.000.000/0001-99',
        createDesignation: () => '04.01.999',
        createDenomination: () => 'Nova Unidade Escolar 999'
    });
    return { state, calls, service };
}

test('edita escola, troca controlador e preserva programa histórico inativo', async () => {
    const harness = createHarness();

    const result = await harness.service.saveSchool({
        id: 'ESC-1',
        email: 'escola@rio.edu.br',
        director: 'Nova Direção',
        controllerId: 'CTRL-2',
        programIds: ['BASIC', 'NEW']
    });

    assert.equal(result.value.school.controladorId, 'CTRL-2');
    assert.equal(result.value.school.diretor, 'Nova Direção');
    assert.deepEqual(result.value.school.programasIds, ['BASIC', 'NEW', 'OLD']);
    assert.equal(harness.state.logs[0].action, 'Escola Atualizada');
    assert.deepEqual(
        harness.calls[0].changedEntities,
        ['schools', 'schoolPrograms', 'administrativeLogs']
    );
});

test('cadastra escola com identificadores gerados e programa básico obrigatório', async () => {
    const harness = createHarness();

    const result = await harness.service.saveSchool({
        email: 'nova@rio.edu.br',
        director: 'Diretora',
        controllerId: 'CTRL-1',
        programIds: ['NEW'],
        initialCompetence: '2026-05'
    });

    assert.equal(result.value.school.id, 'ESC-NEW');
    assert.equal(result.value.school.inep, '33099999');
    assert.deepEqual(result.value.school.programasIds, ['BASIC', 'NEW']);
    assert.equal(harness.state.logs[0].action, 'Escola Cadastrada');
});

test('atribui uma escola e uma seleção em lote sem contabilizar registros inalterados', async () => {
    const harness = createHarness();
    harness.state.schools.push({
        ...harness.state.schools[0],
        id: 'ESC-2',
        controladorId: 'CTRL-2'
    });

    await harness.service.assignController({ schoolId: 'ESC-1', controllerId: 'CTRL-2' });
    const result = await harness.service.bulkAssignController({
        schoolIds: ['ESC-1', 'ESC-2'],
        controllerId: 'CTRL-1'
    });

    assert.equal(result.value.updatedCount, 2);
    assert.equal(harness.state.schools.every(item => item.controladorId === 'CTRL-1'), true);
    assert.equal(harness.state.logs[0].action, 'Redistribuição em Lote');
});

