'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const generatorUrl = pathToFileURL(
    path.resolve(__dirname, '../../scripts/generate-runtime-config.mjs')
).href;

async function loadGenerator() {
    return import(generatorUrl);
}

test('gera entrada local determinística sem credenciais publicadas', async () => {
    const { buildRuntimeInput, renderRuntimeConfig } = await loadGenerator();
    const input = buildRuntimeInput({
        RADAR_DATA_MODE: 'local',
        RADAR_ENVIRONMENT: 'local',
        RADAR_SUPABASE_REPOSITORY_ENABLED: 'false',
        RADAR_SUPABASE_URL: 'https://example.supabase.co',
        RADAR_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_should_be_discarded'
    });

    assert.deepEqual(input, {
        environment: 'local',
        dataMode: 'local',
        productionActivationApproved: false,
        features: {
            supabaseRepositoryEnabled: false
        },
        supabase: {
            url: '',
            publishableKey: ''
        }
    });

    const first = renderRuntimeConfig(input);
    const second = renderRuntimeConfig(input);
    assert.equal(first, second);
    assert.match(first, /^window\.RADAR_PDDE_RUNTIME_INPUT = Object\.freeze\(/);
    assert.doesNotMatch(first, /should_be_discarded/);
    assert.doesNotMatch(first, /legacyAppBridgeEnabled/);
});

test('compara configurações reproduzíveis sem depender da quebra de linha do checkout', async () => {
    const { runtimeConfigMatches } = await loadGenerator();
    const lf = 'linha 1\nlinha 2\n';
    const crlf = 'linha 1\r\nlinha 2\r\n';

    assert.equal(runtimeConfigMatches(lf, crlf), true);
    assert.equal(runtimeConfigMatches(lf, 'linha 1\r\nlinha diferente\r\n'), false);
});

test('gera configuração de preview apenas com autorização e credenciais públicas válidas', async () => {
    const { buildRuntimeInput } = await loadGenerator();
    const input = buildRuntimeInput({
        RADAR_DATA_MODE: 'supabase-preview',
        RADAR_ENVIRONMENT: 'preview',
        RADAR_SUPABASE_REPOSITORY_ENABLED: 'true',
        RADAR_SUPABASE_URL: 'https://example.supabase.co',
        RADAR_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example'
    });

    assert.equal(input.dataMode, 'supabase-preview');
    assert.equal(input.environment, 'preview');
    assert.equal(input.features.supabaseRepositoryEnabled, true);
    assert.equal(input.supabase.url, 'https://example.supabase.co');
    assert.equal(input.supabase.publishableKey, 'sb_publishable_example');
});

test('rejeita segredos sem reproduzir o valor na mensagem de erro', async () => {
    const { buildRuntimeInput } = await loadGenerator();
    const secret = 'sb_secret_NEVER_PRINT_THIS_VALUE';

    assert.throws(
        () => buildRuntimeInput({
            RADAR_DATA_MODE: 'supabase-preview',
            RADAR_ENVIRONMENT: 'preview',
            RADAR_SUPABASE_REPOSITORY_ENABLED: 'true',
            RADAR_SUPABASE_URL: 'https://example.supabase.co',
            RADAR_SUPABASE_PUBLISHABLE_KEY: secret
        }),
        error => /secreta/i.test(error.message) && !error.message.includes(secret)
    );

    assert.throws(
        () => buildRuntimeInput({
            RADAR_DATA_MODE: 'local',
            RADAR_ENVIRONMENT: 'local',
            SUPABASE_SERVICE_ROLE_KEY: secret
        }),
        error => /variável secreta/i.test(error.message) && !error.message.includes(secret)
    );
});

test('bloqueia modo de produção sem ambiente e autorização explícitos', async () => {
    const { buildRuntimeInput } = await loadGenerator();
    const base = {
        RADAR_DATA_MODE: 'supabase-production',
        RADAR_ENVIRONMENT: 'production',
        RADAR_SUPABASE_REPOSITORY_ENABLED: 'true',
        RADAR_SUPABASE_URL: 'https://example.supabase.co',
        RADAR_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example'
    };

    assert.throws(
        () => buildRuntimeInput(base),
        /produção.*autorização/i
    );

    const approved = buildRuntimeInput({
        ...base,
        RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED: 'true'
    });
    assert.equal(approved.dataMode, 'supabase-production');
    assert.equal(approved.productionActivationApproved, true);
});
