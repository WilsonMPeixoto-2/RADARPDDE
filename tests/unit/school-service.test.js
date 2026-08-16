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
            sici: 'SICI-001',
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
            programasVinculos: [
                { id: 'LINK-BASIC', programaId: 'BASIC', ativo: true, rowVersion: 2 },
                { id: 'LINK-OLD', programaId: 'OLD', ativo: true, rowVersion: 3 }
            ],
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
        getCurrentProfile: () => 'assistente',
        appendLog: (action, details) => state.logs.unshift({ action, details })
    });
    return { state, calls, service };
}

test('edita escola, troca controlador e sincroniza programas ativos preservando histórico do vínculo', async () => {
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
    assert.deepEqual(result.value.school.programasIds, ['BASIC', 'NEW']);
    assert.deepEqual(
        result.value.school.programasVinculos.map(link => ({
            id: link.id || null,
            programaId: link.programaId,
            ativo: link.ativo
        })),
        [
            { id: 'LINK-BASIC', programaId: 'BASIC', ativo: true },
            { id: 'LINK-OLD', programaId: 'OLD', ativo: false },
            { id: null, programaId: 'NEW', ativo: true }
        ]
    );
    assert.equal(harness.state.logs[0].action, 'Escola Atualizada');
    assert.deepEqual(
        harness.calls[0].changedEntities,
        ['schools', 'schoolPrograms', 'administrativeLogs']
    );
});

test('atualização sem programIds preserva os vínculos já ativos em vez de zerar programas', async () => {
    const harness = createHarness();
    harness.state.programs.find(program => program.id === 'OLD').active = true;

    const result = await harness.service.saveSchool({
        id: 'ESC-1',
        controllerId: 'CTRL-1',
        email: 'novo-email@rio.edu.br'
    });

    assert.deepEqual(result.value.school.programasIds, ['BASIC', 'OLD']);
    assert.deepEqual(
        result.value.school.programasVinculos.map(link => [link.programaId, link.ativo]),
        [['BASIC', true], ['OLD', true]]
    );
});

test('cadastra escola somente com identificadores institucionais informados', async () => {
    const harness = createHarness();

    const result = await harness.service.saveSchool({
        id: 'ESC-NEW',
        isNewSchool: true,
        designation: '04.01.999',
        denomination: 'Escola Municipal Nova',
        inep: '33099999',
        cnpj: '12.345.678/0001-90',
        sici: 'SICI-999',
        email: 'nova@rio.edu.br',
        director: 'Diretora',
        controllerId: 'CTRL-1',
        programIds: ['NEW'],
        initialCompetence: '2026-05'
    });

    assert.equal(result.value.school.id, 'ESC-NEW');
    assert.equal(result.value.school.designação, '04.01.999');
    assert.equal(result.value.school.denominação, 'Escola Municipal Nova');
    assert.equal(result.value.school.inep, '33099999');
    assert.equal(result.value.school.cnpj, '12.345.678/0001-90');
    assert.equal(result.value.school.sici, 'SICI-999');
    assert.deepEqual(result.value.school.programasIds, ['BASIC', 'NEW']);
    assert.deepEqual(
        result.value.school.programasVinculos.map(link => [link.programaId, link.ativo]),
        [['BASIC', true], ['NEW', true]]
    );
    assert.equal(harness.state.logs[0].action, 'Escola Cadastrada');
});

test('bloqueia cadastro sem dados institucionais completos', async () => {
    const harness = createHarness();

    await assert.rejects(
        harness.service.saveSchool({
            id: 'ESC-NEW',
            isNewSchool: true,
            designation: '04.01.999',
            denomination: 'Escola Municipal Nova',
            email: 'nova@rio.edu.br',
            director: 'Diretora',
            controllerId: 'CTRL-1',
            programIds: ['NEW'],
            initialCompetence: '2026-05'
        }),
        error => error && error.code === 'INSTITUTIONAL_DATA_REQUIRED'
    );

    assert.equal(harness.state.schools.length, 1);
});

test('bloqueia identificadores institucionais duplicados', async () => {
    const harness = createHarness();

    await assert.rejects(
        harness.service.saveSchool({
            id: 'ESC-NEW',
            isNewSchool: true,
            designation: '04.01.999',
            denomination: 'Escola Municipal Nova',
            inep: '33000001',
            cnpj: '12.345.678/0001-90',
            sici: 'SICI-999',
            email: 'nova@rio.edu.br',
            director: 'Diretora',
            controllerId: 'CTRL-1',
            programIds: ['NEW'],
            initialCompetence: '2026-05'
        }),
        error => error && error.code === 'DUPLICATE_INSTITUTIONAL_IDENTIFIER'
    );
});

test('rejeita edição de uma escola que deixou de existir sem recriar o cadastro', async () => {
    const harness = createHarness();

    await assert.rejects(
        harness.service.saveSchool({
            id: 'ESC-REMOVED',
            designation: '04.01.998',
            denomination: 'Escola Removida',
            inep: '33099998',
            cnpj: '12.345.678/0001-80',
            sici: 'SICI-998',
            controllerId: 'CTRL-1',
            programIds: ['NEW'],
            initialCompetence: '2026-05'
        }),
        error => error && error.code === 'NOT_FOUND'
    );

    assert.equal(harness.state.schools.length, 1);
});

test('atribui uma escola e uma seleção em lote sem contabilizar registros inalterados', async () => {
    const harness = createHarness();
    harness.state.schools.push({
        ...harness.state.schools[0],
        id: 'ESC-2',
        inep: '33000002',
        cnpj: '00.000.000/0002-00',
        designação: '04.01.002',
        sici: 'SICI-002',
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