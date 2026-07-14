'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { DirectoryService } = require('../../src/application/directory-service.js');

function createHarness() {
    const state = {
        programs: [{ id: 'BASIC', name: 'PDDE Básico', desc: '', active: true }],
        controllers: [
            { id: 'CTRL-1', name: 'Um', email: 'um@rio.gov.br', active: true },
            { id: 'CTRL-2', name: 'Dois', email: 'dois@rio.gov.br', active: true }
        ],
        inventoryTeamMembers: [
            { id: 'INV-1', name: 'Ana', email: 'ana@rio.gov.br', active: true },
            { id: 'INV-2', name: 'Bia', email: 'bia@rio.gov.br', active: true }
        ],
        schools: [{ id: 'ESC-1', controladorId: 'CTRL-1', programasIds: ['BASIC'] }],
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
    let id = 0;
    const service = new DirectoryService({
        dataService,
        getState: () => state,
        appendLog: (action, details) => state.logs.unshift({ action, details }),
        createId: prefix => `${prefix}-${++id}`
    });
    return { state, calls, service };
}

test('cadastra programa e o desativa sem apagar o registro histórico', async () => {
    const harness = createHarness();

    const created = await harness.service.saveProgram({ name: 'Qualidade', description: 'Ações' });
    const programId = created.value.program.id;
    assert.equal(harness.state.programs.at(-1).active, true);
    assert.equal(harness.state.logs[0].action, 'Programa Cadastrado');

    await harness.service.deactivateProgram({ programId });
    assert.equal(harness.state.programs.find(item => item.id === programId).active, false);
    assert.equal(harness.state.logs[0].action, 'Programa Desativado');
    assert.equal(harness.calls[1].changedEntities.includes('programs'), true);
});

test('desativa controlador somente após reatribuir suas escolas na mesma operação', async () => {
    const harness = createHarness();

    const result = await harness.service.deactivateController({
        controllerId: 'CTRL-1',
        fallbackControllerId: 'CTRL-2'
    });

    assert.equal(result.value.reassignedCount, 1);
    assert.equal(harness.state.schools[0].controladorId, 'CTRL-2');
    assert.equal(harness.state.controllers[0].active, false);
    assert.deepEqual(
        harness.calls[0].changedEntities,
        ['controllers', 'schools', 'administrativeLogs']
    );
});

test('salva integrante e impede desativar o último integrante ativo', async () => {
    const harness = createHarness();

    const saved = await harness.service.saveInventoryMember({
        name: 'Carla',
        email: 'carla@rio.gov.br'
    });
    assert.equal(saved.value.member.active, true);

    await harness.service.deactivateInventoryMember({ memberId: 'INV-1' });
    await harness.service.deactivateInventoryMember({ memberId: 'INV-2' });
    await assert.rejects(
        () => harness.service.deactivateInventoryMember({ memberId: saved.value.member.id }),
        error => error && error.code === 'LAST_ACTIVE_MEMBER'
    );
});

