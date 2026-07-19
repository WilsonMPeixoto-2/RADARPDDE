'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { DirectoryService } = require('../../src/application/directory-service.js');

function createHarness(options = {}) {
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
    const gatewayCalls = [];
    let defaultPersistCount = 0;
    const dataService = {
        async execute(command) {
            calls.push(command);
            const value = await command.mutate();
            const defaultPersist = async () => { defaultPersistCount += 1; };
            if (typeof command.persist === 'function') {
                await command.persist({ value, snapshot: { entities: {} }, defaultPersist });
            } else {
                await defaultPersist();
            }
            return { ok: true, value };
        }
    };
    const teamAccountGateway = options.remote === true ? {
        async saveController(input) {
            gatewayCalls.push({ method: 'saveController', input });
            return { ok: true };
        },
        async deactivateController(input) {
            gatewayCalls.push({ method: 'deactivateController', input });
            return { ok: true };
        },
        async saveInventoryMember(input) {
            gatewayCalls.push({ method: 'saveInventoryMember', input });
            return { ok: true };
        },
        async deactivateInventoryMember(input) {
            gatewayCalls.push({ method: 'deactivateInventoryMember', input });
            return { ok: true };
        }
    } : null;
    let id = 0;
    const service = new DirectoryService({
        dataService,
        getState: () => state,
        appendLog: (action, details) => {
            const log = { id: `log-${++id}`, action, details, eventAt: '2026-07-19T00:00:00.000Z' };
            state.logs.unshift(log);
            return log;
        },
        createId: prefix => `${prefix}-${++id}`,
        teamAccountGateway
    });
    return {
        state,
        calls,
        gatewayCalls,
        service,
        get defaultPersistCount() { return defaultPersistCount; }
    };
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
    assert.equal(harness.defaultPersistCount, 2);
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
    assert.equal(harness.defaultPersistCount, 1);
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

test('modo remoto provisiona convite e vínculo ao cadastrar controlador', async () => {
    const harness = createHarness({ remote: true });

    const result = await harness.service.saveController({
        name: 'Carla Controle',
        email: 'carla.controle@rioeduca.net'
    });

    assert.equal(harness.defaultPersistCount, 0);
    assert.equal(harness.gatewayCalls.length, 1);
    assert.equal(harness.gatewayCalls[0].method, 'saveController');
    assert.deepEqual(harness.gatewayCalls[0].input.controller, result.value.controller);
    assert.equal(harness.gatewayCalls[0].input.previousController, null);
    assert.equal(harness.gatewayCalls[0].input.administrativeLog.id, result.value.administrativeLog.id);
});

test('modo remoto propaga edição do controlador para a conta vinculada', async () => {
    const harness = createHarness({ remote: true });

    await harness.service.saveController({
        id: 'CTRL-1',
        name: 'Um Atualizado',
        email: 'um.atualizado@rioeduca.net'
    });

    const call = harness.gatewayCalls[0];
    assert.equal(call.method, 'saveController');
    assert.equal(call.input.controller.email, 'um.atualizado@rioeduca.net');
    assert.equal(call.input.previousController.email, 'um@rio.gov.br');
});

test('modo remoto desativa acesso e redistribui carteira na mesma operação', async () => {
    const harness = createHarness({ remote: true });

    await harness.service.deactivateController({
        controllerId: 'CTRL-1',
        fallbackControllerId: 'CTRL-2'
    });

    assert.equal(harness.defaultPersistCount, 0);
    assert.equal(harness.gatewayCalls[0].method, 'deactivateController');
    assert.equal(harness.gatewayCalls[0].input.controllerId, 'CTRL-1');
    assert.equal(harness.gatewayCalls[0].input.fallbackControllerId, 'CTRL-2');
    assert.equal(harness.gatewayCalls[0].input.reassignedCount, 1);
});

test('modo remoto provisiona e desativa integrante do Inventário', async () => {
    const harness = createHarness({ remote: true });

    const saved = await harness.service.saveInventoryMember({
        name: 'Carla Inventário',
        email: 'carla.inventario@rioeduca.net'
    });
    await harness.service.deactivateInventoryMember({ memberId: saved.value.member.id });

    assert.deepEqual(
        harness.gatewayCalls.map(call => call.method),
        ['saveInventoryMember', 'deactivateInventoryMember']
    );
    assert.equal(harness.defaultPersistCount, 0);
});
