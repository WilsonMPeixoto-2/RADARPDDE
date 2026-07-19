'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadDomain() {
    return import(pathToFileURL(path.resolve(
        __dirname,
        '../../supabase/functions/_shared/team-account-domain.mjs'
    )).href);
}

test('reconhece somente Assistente e Administrador técnico como gestores de equipe', async () => {
    const { isTeamManagerRole } = await loadDomain();

    assert.equal(isTeamManagerRole('federal_assistant'), true);
    assert.equal(isTeamManagerRole('technical_admin'), true);
    assert.equal(isTeamManagerRole('sme_management'), false);
    assert.equal(isTeamManagerRole('controller'), false);
    assert.equal(isTeamManagerRole('inventory'), false);
});

test('normaliza cadastro de controlador com e-mail institucional e escopo', async () => {
    const { normalizeTeamCommand } = await loadDomain();

    const command = normalizeTeamCommand({
        operation: 'save_controller',
        controller: {
            id: ' CTRL-7 ',
            name: ' Carla Controle ',
            email: ' CARLA.CONTROLE@RIOEDUCA.NET ',
            active: true
        },
        previousController: null,
        administrativeLog: { id: 'log-7', action: 'Gestão de Equipe' }
    });

    assert.equal(command.operation, 'save_controller');
    assert.deepEqual(command.entity, {
        id: 'CTRL-7',
        name: 'Carla Controle',
        email: 'carla.controle@rioeduca.net',
        active: true,
        cre_scope: '4ª CRE'
    });
    assert.equal(command.profileId, 'controller');
});

test('normaliza cadastro e desativação do Inventário', async () => {
    const { normalizeTeamCommand } = await loadDomain();

    const save = normalizeTeamCommand({
        operation: 'save_inventory_member',
        member: { id: 'INV-7', name: 'Ana Patrimônio', email: 'ana@rioeduca.net' },
        administrativeLog: { id: 'log-8' }
    });
    const deactivate = normalizeTeamCommand({
        operation: 'deactivate_inventory_member',
        memberId: 'INV-7',
        administrativeLog: { id: 'log-9' }
    });

    assert.equal(save.profileId, 'inventory');
    assert.equal(save.entity.id, 'INV-7');
    assert.equal(deactivate.entityId, 'INV-7');
});

test('rejeita operação desconhecida, e-mail inválido e payload incompleto', async () => {
    const { normalizeTeamCommand } = await loadDomain();

    assert.throws(
        () => normalizeTeamCommand({ operation: 'delete_everything' }),
        /operação/i
    );
    assert.throws(
        () => normalizeTeamCommand({
            operation: 'save_controller',
            controller: { id: 'CTRL-8', name: 'Sem Email', email: 'invalido' },
            administrativeLog: { id: 'log-10' }
        }),
        /e-mail/i
    );
    assert.throws(
        () => normalizeTeamCommand({ operation: 'deactivate_controller', controllerId: 'CTRL-1' }),
        /controlador substituto|administrativo/i
    );
});

test('gera metadados de convite sem credenciais e com perfil correto', async () => {
    const { buildInviteMetadata } = await loadDomain();

    const metadata = buildInviteMetadata({
        profileId: 'controller',
        entity: { id: 'CTRL-9', name: 'Pessoa Controle', cre_scope: '4ª CRE' }
    });

    assert.deepEqual(metadata, {
        display_name: 'Pessoa Controle',
        radar_profile: 'controller',
        radar_entity_id: 'CTRL-9',
        radar_cre_scope: '4ª CRE'
    });
    assert.equal(JSON.stringify(metadata).includes('password'), false);
    assert.equal(JSON.stringify(metadata).includes('token'), false);
});
