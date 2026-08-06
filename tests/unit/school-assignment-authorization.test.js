'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { SchoolService } = require('../../src/application/school-service.js');

function createHarness(profile) {
    const state = {
        schools: [{
            id: 'ESC-AUTH-1',
            inep: '33000001',
            cnpj: '00.000.000/0001-01',
            denominação: 'Escola Autorização',
            designação: '04.99.001',
            cre: '4ª CRE',
            ra: '99ª R.A.',
            sici: '99001',
            email: 'escola@example.test',
            diretor: 'Direção',
            telefoneDiretor: '',
            diretorAdjunto: '',
            telefoneDiretorAdjunto: '',
            telefone: '',
            telefoneCelularInstitucional: '',
            controladorId: 'CTRL-AUTH-1',
            processoInventario: '',
            programasIds: ['BASIC'],
            competenciaInicial: '2026-05',
            rowVersion: 1,
            active: true
        }],
        programs: [{ id: 'BASIC', active: true }],
        controllers: [
            { id: 'CTRL-AUTH-1', name: 'Controlador Atual', active: true },
            { id: 'CTRL-AUTH-2', name: 'Controlador Destino', active: true }
        ],
        logs: []
    };
    const dataService = {
        async execute(command) {
            const value = await command.mutate();
            return { ok: true, value };
        }
    };
    return {
        state,
        service: new SchoolService({
            dataService,
            getState: () => state,
            getCurrentProfile: () => profile,
            appendLog: (action, details) => {
                const log = { id: `LOG-${state.logs.length + 1}`, action, details };
                state.logs.unshift(log);
                return log;
            }
        })
    };
}

test('Controlador não pode alterar a carteira pela edição cadastral da escola', async () => {
    const harness = createHarness('controlador');

    await assert.rejects(
        harness.service.saveSchool({
            id: 'ESC-AUTH-1',
            director: 'Direção Atualizada',
            controllerId: 'CTRL-AUTH-2',
            programIds: ['BASIC']
        }),
        error => error?.code === 'AUTHORIZATION_DENIED'
    );

    assert.equal(harness.state.schools[0].controladorId, 'CTRL-AUTH-1');
    assert.equal(harness.state.logs.length, 0);
});

test('Assistente mantém a redistribuição autorizada pela edição cadastral', async () => {
    const harness = createHarness('assistente');

    const result = await harness.service.saveSchool({
        id: 'ESC-AUTH-1',
        director: 'Direção Atualizada',
        controllerId: 'CTRL-AUTH-2',
        programIds: ['BASIC']
    });

    assert.equal(result.value.school.controladorId, 'CTRL-AUTH-2');
    assert.equal(harness.state.logs[0].action, 'Escola Atualizada');
});

test('Modal cadastral torna o seletor de controlador imutável para o perfil Controlador', () => {
    const appSource = fs.readFileSync(path.join(__dirname, '../../app.js'), 'utf8');

    assert.match(appSource, /const canManageControllerAssignment = getRadarAccessProfile\(\) === 'assistente';/);
    assert.match(appSource, /selectCtrl\.disabled = !canManageControllerAssignment;/);
    assert.match(appSource, /controllerId:\s*canManageControllerAssignment\s*\?\s*ctrlId\s*:\s*existingControllerId/);
});
