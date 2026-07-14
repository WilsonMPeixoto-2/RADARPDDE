'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    DATA_MODES,
    createRuntimeConfig,
    isForbiddenSupabaseKey
} = require('../../config.js');

function jwtWithRole(role) {
    const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
    return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role })}.signature`;
}

test('modo local é o padrão e neutraliza credenciais mesmo quando preenchidas', () => {
    const config = createRuntimeConfig({
        supabase: {
            url: 'https://example.supabase.co',
            publishableKey: 'sb_publishable_example'
        },
        features: {
            supabaseRepositoryEnabled: true
        }
    });

    assert.equal(config.dataMode, DATA_MODES.LOCAL);
    assert.equal(config.supabase.url, '');
    assert.equal(config.supabase.publishableKey, '');
    assert.equal(config.supabase.connectionEnabled, false);
    assert.equal(config.features.supabaseRepositoryEnabled, false);
    assert.equal(Object.hasOwn(config.features, 'legacyAppBridgeEnabled'), false);
});

test('conexão exige modo não local, ambiente coerente e autorização explícita', () => {
    const disabled = createRuntimeConfig({
        dataMode: DATA_MODES.SUPABASE_PREVIEW,
        environment: 'preview',
        supabase: {
            url: 'https://example.supabase.co',
            publishableKey: 'sb_publishable_example'
        },
        features: {
            supabaseRepositoryEnabled: false
        }
    });

    assert.equal(disabled.supabase.connectionEnabled, false);
    assert.equal(disabled.supabase.url, '');

    const enabled = createRuntimeConfig({
        dataMode: DATA_MODES.SUPABASE_PREVIEW,
        environment: 'preview',
        supabase: {
            url: 'https://example.supabase.co',
            publishableKey: 'sb_publishable_example'
        },
        features: {
            supabaseRepositoryEnabled: true
        }
    });

    assert.equal(enabled.supabase.connectionEnabled, true);
    assert.equal(enabled.supabase.url, 'https://example.supabase.co');
    assert.equal(enabled.supabase.publishableKey, 'sb_publishable_example');
    assert.equal(enabled.environment, 'preview');

    const missingEnvironment = createRuntimeConfig({
        dataMode: DATA_MODES.SUPABASE_PREVIEW,
        features: { supabaseRepositoryEnabled: true },
        supabase: {
            url: 'https://example.supabase.co',
            publishableKey: 'sb_publishable_example'
        }
    });
    assert.equal(missingEnvironment.dataMode, DATA_MODES.LOCAL);
    assert.equal(missingEnvironment.supabase.connectionEnabled, false);
    assert.match(missingEnvironment.diagnostics.join(' '), /ambiente/i);
});

test('chaves secretas, inclusive JWT service_role, são rejeitadas', () => {
    const serviceRoleJwt = jwtWithRole('service_role');
    const anonJwt = jwtWithRole('anon');

    assert.equal(isForbiddenSupabaseKey('sb_secret_1234567890abcdef'), true);
    assert.equal(isForbiddenSupabaseKey('service_role'), true);
    assert.equal(isForbiddenSupabaseKey(serviceRoleJwt), true);
    assert.equal(isForbiddenSupabaseKey('sb_publishable_example'), false);
    assert.equal(isForbiddenSupabaseKey(anonJwt), false);

    assert.throws(() => createRuntimeConfig({
        dataMode: DATA_MODES.SUPABASE_PREVIEW,
        environment: 'preview',
        supabase: {
            url: 'https://example.supabase.co',
            publishableKey: serviceRoleJwt
        },
        features: {
            supabaseRepositoryEnabled: true
        }
    }), /chave secreta/i);
});

test('modo de produção não pode ser ativado sem autorização própria', () => {
    const config = createRuntimeConfig({
        dataMode: DATA_MODES.SUPABASE_PRODUCTION,
        environment: 'production',
        productionActivationApproved: false,
        supabase: {
            url: 'https://example.supabase.co',
            publishableKey: 'sb_publishable_example'
        },
        features: {
            supabaseRepositoryEnabled: true
        }
    });

    assert.equal(config.dataMode, DATA_MODES.LOCAL);
    assert.equal(config.supabase.connectionEnabled, false);
    assert.match(config.diagnostics.join(' '), /produção/i);
});
