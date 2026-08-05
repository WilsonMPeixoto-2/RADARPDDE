'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { TeamAccountGateway } = require('../../src/application/team-account-gateway.js');
const errorMapper = require('../../src/application/error-mapper.js');

const edgeSource = fs.readFileSync(
    path.resolve(__dirname, '../../supabase/functions/team-account-management/index.ts'),
    'utf8'
);

function gatewayReturningConflict(message = 'A conta já existe e não pode receber um novo convite.') {
    const context = new Response(JSON.stringify({
        ok: false,
        code: 'ACCOUNT_CONFLICT',
        message
    }), {
        status: 409,
        headers: { 'content-type': 'application/json' }
    });
    return new TeamAccountGateway({
        enabled: true,
        client: {
            functions: {
                async invoke() {
                    return {
                        data: null,
                        error: {
                            name: 'FunctionsHttpError',
                            message: 'Edge Function returned a non-2xx status code',
                            context
                        }
                    };
                }
            }
        }
    });
}

test('gateway preserva ACCOUNT_CONFLICT recebido no corpo de FunctionsHttpError', async () => {
    const gateway = gatewayReturningConflict();

    await assert.rejects(
        () => gateway.saveController({ controller: { id: 'CTRL-JULIANA' } }),
        error => error
            && error.code === 'ACCOUNT_CONFLICT'
            && error.message === 'A conta já existe e não pode receber um novo convite.'
    );
});

test('interface exibe conflito funcional em vez de falsa indisponibilidade', async () => {
    const expectedMessage = 'Desative o vínculo atual antes de alterar a função.';
    const gateway = gatewayReturningConflict(expectedMessage);
    let caught;
    try {
        await gateway.saveController({ controller: { id: 'CTRL-JULIANA' } });
    } catch (error) {
        caught = error;
    }

    const originalConsoleError = globalThis.console.error;
    globalThis.console.error = () => {};
    try {
        const mapped = errorMapper.showDataOperationError(caught, {
            incidentId: 'RADAR-TEST-ACCOUNT-CONFLICT'
        });
        assert.equal(mapped.code, 'VALIDATION_FAILED');
        assert.match(mapped.message, /Desative o vínculo atual antes de alterar a função\./);
        assert.doesNotMatch(mapped.message, /temporariamente indisponível/i);
    } finally {
        globalThis.console.error = originalConsoleError;
    }
});

test('Edge Function procura conta Auth pelo e-mail antes de enviar convite', () => {
    assert.match(edgeSource, /async function authUserByEmail/);
    assert.match(edgeSource, /admin\.auth\.admin\.listUsers/);
    assert.match(edgeSource, /await authUserByEmail\(admin, entity\.email\)/);

    const lookupPosition = edgeSource.indexOf('await authUserByEmail(admin, entity.email)');
    const invitePosition = edgeSource.indexOf('inviteUserByEmail(entity.email');
    assert.ok(lookupPosition >= 0, 'a busca de conta Auth pelo e-mail deve existir');
    assert.ok(invitePosition > lookupPosition, 'o convite só pode ocorrer depois da busca pelo e-mail');
});

test('transição de perfil só reutiliza conta sem vínculo ativo conflitante', () => {
    assert.match(edgeSource, /async function assertReusableAccount/);
    assert.match(edgeSource, /\.from\("user_profiles"\)/);
    assert.match(edgeSource, /\.eq\("active", true\)/);
    assert.match(edgeSource, /desative o vínculo atual antes de alterar a função/i);
});

test('compensação restaura o estado de bloqueio anterior da conta', () => {
    assert.match(edgeSource, /function restorationBanDuration/);
    assert.match(edgeSource, /previousUser\.banned_until/);
    assert.match(edgeSource, /ban_duration: restorationBanDuration\(previousUser\)/);
    assert.doesNotMatch(
        edgeSource,
        /async function restoreUser[\s\S]{0,600}ban_duration:\s*"none"/
    );
});
