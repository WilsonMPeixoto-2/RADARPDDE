'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    DATA_MODES,
    createRuntimeConfig,
    isForbiddenSupabaseKey
} = require('../../config.js');

test('modo local é o padrão e neutraliza credenciais mesmo quando preenchidas', () => {
    const config = createRuntimeConfig({
        supabase: {
            url: 'https://example.supabase.co',
            publishableKey: 'sb_publishable_example'
        },
        features: {
            supabaseRepositoryEnabled: true,
            legacyAppBridgeEnabled: true
        }
    });

    assert.equal(config.dataMode, DATA_MODES.LOCAL);
    assert.equal(config.supabase.url, '');
    assert.equal(config.supabase.publishableKey, '');
    assert.equal(config.supabase.connectionEnabled, false);
    assert.equal(config.features.supabaseRepositoryEnabled, false);
    assert.equal(config.features.legacyAppBridgeEnabled, false);
});

test('conexão exige modo não local e dupla autorização explícita', () => {
    const disabled = createRuntimeConfig({
        dataMode: DATA_MODES.SUPABASE_PREVIEW,
        supabase: {
            url: 'https://example.supabase.co',
            publishableKey: 'sb_publishable_example'
        },
        features: {
            supabaseRepositoryEnabled: true,
            legacyAppBridgeEnabled: false
        }
    });

    assert.equal(disabled.supabase.connectionEnabled, false);
    assert.equal(disabled.supabase.url, '');

    const enabled = createRuntimeConfig({
        dataMode: DATA_MODES.SUPABASE_PREVIEW,
        supabase: {
            url: 'https://example.supabase.co',
            publishableKey: 'sb_publishable_example'
        },
        features: {
            supabaseRepositoryEnabled: true,
            legacyAppBridgeEnabled: true
        }
    });

    assert.equal(enabled.supabase.connectionEnabled, true);
    assert.equal(enabled.supabase.url, 'https://example.supabase.co');
    assert.equal(enabled.supabase.publishableKey, 'sb_publishable_example');
});

test('chaves secretas são rejeitadas', () => {
    assert.equal(isForbiddenSupabaseKey('sb_secret_1234567890abcdef'), true);
    assert.equal(isForbiddenSupabaseKey('service_role'), true);
    assert.equal(isForbiddenSupabaseKey('sb_publishable_example'), false);

    assert.throws(() => createRuntimeConfig({
        dataMode: DATA_MODES.SUPABASE_PREVIEW,
        supabase: {
            url: 'https://example.supabase.co',
            publishableKey: 'sb_secret_1234567890abcdef'
        },
        features: {
            supabaseRepositoryEnabled: true,
            legacyAppBridgeEnabled: true
        }
    }), /chave secreta/i);
});

test('modo de produção não pode ser ativado sem autorização própria', () => {
    const config = createRuntimeConfig({
        dataMode: DATA_MODES.SUPABASE_PRODUCTION,
        productionActivationApproved: false,
        supabase: {
            url: 'https://example.supabase.co',
            publishableKey: 'sb_publishable_example'
        },
        features: {
            supabaseRepositoryEnabled: true,
            legacyAppBridgeEnabled: true
        }
    });

    assert.equal(config.dataMode, DATA_MODES.LOCAL);
    assert.equal(config.supabase.connectionEnabled, false);
    assert.match(config.diagnostics.join(' '), /produção/i);
});
