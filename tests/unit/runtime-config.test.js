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
    assert.equal(config.productionBlocked, false);
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

    assert.equal(config.environment, 'production');
    assert.equal(config.dataMode, DATA_MODES.LOCAL);
    assert.equal(config.supabase.connectionEnabled, false);
    assert.equal(config.productionBlocked, true);
    assert.equal(config.activeRepository, 'unavailable');
    assert.match(config.diagnostics.join(' '), /produção/i);
});

test('marcador do deployment mantém Production fail-closed se config.runtime estiver ausente', () => {
    const config = createRuntimeConfig({ deploymentTarget: 'production' });

    assert.equal(config.environment, 'production');
    assert.equal(config.dataMode, DATA_MODES.LOCAL);
    assert.equal(config.productionBlocked, true);
    assert.equal(config.activeRepository, 'unavailable');
    assert.equal(config.supabase.connectionEnabled, false);
    assert.match(config.diagnostics.join(' '), /production|produção/i);
});

test('Production válida com marcador permanece conectada ao Supabase', () => {
    const config = createRuntimeConfig({
        deploymentTarget: 'production',
        dataMode: DATA_MODES.SUPABASE_PRODUCTION,
        environment: 'production',
        productionActivationApproved: true,
        supabase: {
            url: 'https://example.supabase.co',
            publishableKey: 'sb_publishable_example'
        },
        features: {
            supabaseRepositoryEnabled: true
        }
    });

    assert.equal(config.productionBlocked, false);
    assert.equal(config.activeRepository, 'supabase');
    assert.equal(config.supabase.connectionEnabled, true);
});


test('piloto operacional depende de banco loopback e ambiente de teste', () => {
    const local = createRuntimeConfig({
        dataMode: DATA_MODES.SUPABASE_PREVIEW,
        environment: 'test',
        features: { supabaseRepositoryEnabled: true, operationalCorrectionPilot: true },
        supabase: { url: 'http://127.0.0.1:54321', publishableKey: 'sb_publishable_test' }
    });
    assert.equal(local.features.operationalCorrectionPilot, true);

    const remote = createRuntimeConfig({
        dataMode: DATA_MODES.SUPABASE_PREVIEW,
        environment: 'preview',
        features: { supabaseRepositoryEnabled: true, operationalCorrectionPilot: true },
        supabase: { url: 'https://example.supabase.co', publishableKey: 'sb_publishable_test' }
    });
    assert.notEqual(remote.features.operationalCorrectionPilot, true);

    const prod = createRuntimeConfig({
        deploymentTarget: 'production',
        dataMode: DATA_MODES.SUPABASE_PRODUCTION,
        environment: 'production',
        productionActivationApproved: true,
        features: { supabaseRepositoryEnabled: true, operationalCorrectionPilot: true },
        supabase: { url: 'https://example.supabase.co', publishableKey: 'sb_publishable_test' }
    });
    assert.notEqual(prod.features.operationalCorrectionPilot, true);
});

test('release T0–T3 requer deployment de produção, Supabase válido e autorização dedicada', () => {
    const base = {
        deploymentTarget: 'production',
        dataMode: DATA_MODES.SUPABASE_PRODUCTION,
        environment: 'production',
        productionActivationApproved: true,
        features: {
            supabaseRepositoryEnabled: true,
            operationalCorrectionRelease: true
        },
        supabase: {
            url: 'https://example.supabase.co',
            publishableKey: 'sb_publishable_example'
        }
    };
    const enabled = createRuntimeConfig(base);
    assert.equal(enabled.features.operationalCorrectionRelease, true);
    assert.notEqual(enabled.features.operationalCorrectionPilot, true);
    for (const changes of [
        { deploymentTarget: 'preview' },
        { productionActivationApproved: false },
        { dataMode: DATA_MODES.SUPABASE_PREVIEW },
        { features: { ...base.features, supabaseRepositoryEnabled: false } },
        { features: { supabaseRepositoryEnabled: true } },
        { supabase: { ...base.supabase, url: 'http://127.0.0.1:54321' } },
        { supabase: { ...base.supabase, url: 'http://example.supabase.co' } }
    ]) {
        const candidate = createRuntimeConfig({ ...base, ...changes });
        assert.notEqual(candidate.features.operationalCorrectionRelease, true);
    }
});

test('T4 não herda a ativação T0–T3 e permanece desligada sem autorização específica', () => {
    const base = {
        deploymentTarget: 'production',
        dataMode: DATA_MODES.SUPABASE_PRODUCTION,
        environment: 'production',
        productionActivationApproved: true,
        features: { supabaseRepositoryEnabled: true, operationalCorrectionRelease: true },
        supabase: { url: 'https://example.supabase.co', publishableKey: 'sb_publishable_example' }
    };
    assert.notEqual(createRuntimeConfig(base).features.bonificationCorrectionRelease, true);
    const explicit = createRuntimeConfig({
        ...base, features: { ...base.features, bonificationCorrectionRelease: true }
    });
    assert.equal(explicit.features.bonificationCorrectionRelease, true);
    for (const changes of [
        { deploymentTarget: 'preview' },
        { productionActivationApproved: false },
        { features: { supabaseRepositoryEnabled: true, bonificationCorrectionRelease: true } },
        { supabase: { ...base.supabase, url: 'http://127.0.0.1:54321' } }
    ]) {
        const candidate = createRuntimeConfig({ ...base, ...changes });
        assert.notEqual(candidate.features.bonificationCorrectionRelease, true);
    }
});

test('bootstrap do navegador mantém release OFF sem HTTPS e ON apenas com opt-in de production', () => {
    const fs = require('node:fs');
    const vm = require('node:vm');
    const path = require('node:path');
    const source = fs.readFileSync(path.resolve(__dirname, '../../config.js'), 'utf8');
    const input = {
        deploymentTarget: 'production',
        dataMode: DATA_MODES.SUPABASE_PRODUCTION,
        environment: 'production',
        productionActivationApproved: true,
        features: { supabaseRepositoryEnabled: true, operationalCorrectionRelease: true },
        supabase: { url: 'https://example.supabase.co', publishableKey: 'sb_publishable_example' }
    };
    function visible(runtimeInput, protocol) {
        const context = {
            URL,
            window: {
                RADAR_PDDE_RUNTIME_INPUT: runtimeInput,
                location: { hostname: 'radarpdde-fix.vercel.app', protocol }
            }
        };
        vm.runInNewContext(source, context, { filename: 'config.js' });
        return context.window.RADAR_OPERATIONAL_CORRECTION_PREVIEW;
    }
    assert.equal(visible(input, 'https:'), true);
    assert.equal(visible(input, 'http:'), false);
    assert.equal(visible({ ...input, features: { supabaseRepositoryEnabled: true } }, 'https:'), false);
    assert.equal(visible({ ...input, deploymentTarget: 'preview' }, 'https:'), false);
});

test('ativação simultânea de piloto e release falha fechado nos dois lados no runtime', () => {
    const simultaneous = createRuntimeConfig({
        deploymentTarget: 'preview',
        dataMode: DATA_MODES.SUPABASE_PREVIEW,
        environment: 'test',
        features: {
            supabaseRepositoryEnabled: true,
            operationalCorrectionPilot: true,
            operationalCorrectionRelease: true
        },
        supabase: {
            url: 'http://127.0.0.1:54321',
            publishableKey: 'sb_publishable_local_example'
        }
    });
    assert.notEqual(simultaneous.features.operationalCorrectionPilot, true);
    assert.notEqual(simultaneous.features.operationalCorrectionRelease, true);
});

test('exclusão de contexto T4 não herda bonificação e só libera produção com autorização própria', () => {
    const base = {
        deploymentTarget: 'production',
        dataMode: DATA_MODES.SUPABASE_PRODUCTION,
        environment: 'production',
        productionActivationApproved: true,
        features: {
            supabaseRepositoryEnabled: true,
            operationalCorrectionRelease: true,
            bonificationCorrectionRelease: true
        },
        supabase: {
            url: 'https://example.supabase.co',
            publishableKey: 'sb_publishable_example'
        }
    };
    assert.notEqual(createRuntimeConfig(base).features.contextDeletionRelease, true);
    const authorized = createRuntimeConfig({
        ...base,
        features: { ...base.features, contextDeletionRelease: true }
    });
    assert.equal(authorized.features.contextDeletionRelease, true);
    for (const change of [
        { deploymentTarget: 'preview' },
        { productionActivationApproved: false },
        { features: { ...base.features, bonificationCorrectionRelease: false, contextDeletionRelease: true } },
        { features: { ...base.features, operationalCorrectionRelease: false, contextDeletionRelease: true } },
        { supabase: { ...base.supabase, url: 'http://127.0.0.1:54321' } }
    ]) {
        const candidate = createRuntimeConfig({ ...base, ...change,
            features: change.features || { ...base.features, contextDeletionRelease: true }
        });
        assert.notEqual(candidate.features.contextDeletionRelease, true);
    }
});
