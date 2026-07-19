'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { TeamAccountGateway } = require('../../src/application/team-account-gateway.js');

function createHarness(response = { data: { ok: true }, error: null }) {
    const calls = [];
    const client = {
        functions: {
            async invoke(name, options) {
                calls.push({ name, options });
                return response;
            }
        }
    };
    return {
        calls,
        gateway: new TeamAccountGateway({ client, enabled: true })
    };
}

test('envia cadastro de controlador para a Edge Function protegida', async () => {
    const harness = createHarness({ data: { ok: true, userId: 'user-1' }, error: null });
    const input = {
        controller: { id: 'CTRL-3', name: 'Carla', email: 'carla@rioeduca.net' },
        previousController: null,
        administrativeLog: { id: 'log-1' }
    };

    const result = await harness.gateway.saveController(input);

    assert.deepEqual(result, { ok: true, userId: 'user-1' });
    assert.equal(harness.calls[0].name, 'team-account-management');
    assert.deepEqual(harness.calls[0].options.body, {
        operation: 'save_controller',
        ...input
    });
});

test('usa operações distintas para desativação e Inventário', async () => {
    const harness = createHarness();

    await harness.gateway.deactivateController({ controllerId: 'CTRL-1' });
    await harness.gateway.saveInventoryMember({ member: { id: 'INV-3' } });
    await harness.gateway.deactivateInventoryMember({ memberId: 'INV-3' });

    assert.deepEqual(
        harness.calls.map(call => call.options.body.operation),
        ['deactivate_controller', 'save_inventory_member', 'deactivate_inventory_member']
    );
});

test('rejeita cliente sem suporte a Edge Functions quando habilitado', () => {
    assert.throws(
        () => new TeamAccountGateway({ client: {}, enabled: true }),
        error => error && error.code === 'MISSING_FUNCTIONS_CLIENT'
    );
});

test('converte autorização negada em erro público estável', async () => {
    const harness = createHarness({
        data: null,
        error: { message: 'AUTHORIZATION_DENIED: perfil sem permissão', status: 403 }
    });

    await assert.rejects(
        () => harness.gateway.saveController({ controller: { id: 'CTRL-4' } }),
        error => error && error.code === 'PERMISSION_DENIED'
    );
});

test('preserva conflito de conta e validação retornados pela função', async () => {
    const conflict = createHarness({
        data: { ok: false, code: 'ACCOUNT_CONFLICT', message: 'E-mail já vinculado.' },
        error: null
    });
    await assert.rejects(
        () => conflict.gateway.saveController({ controller: { id: 'CTRL-4' } }),
        error => error && error.code === 'ACCOUNT_CONFLICT'
    );

    const validation = createHarness({
        data: { ok: false, code: 'VALIDATION_FAILED', message: 'E-mail inválido.' },
        error: null
    });
    await assert.rejects(
        () => validation.gateway.saveInventoryMember({ member: { id: 'INV-4' } }),
        error => error && error.code === 'VALIDATION_FAILED'
    );
});
