'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

const generator = pathToFileURL(path.resolve(__dirname, '../../scripts/generate-runtime-config.mjs')).href;
const approved = {
    RADAR_DATA_MODE: 'supabase-production',
    RADAR_ENVIRONMENT: 'production',
    RADAR_SUPABASE_REPOSITORY_ENABLED: 'true',
    RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED: 'true',
    RADAR_SUPABASE_URL: 'https://example.supabase.co',
    RADAR_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
    RADAR_OPERATIONAL_CORRECTION_RELEASE_ENABLED: 'true',
    RADAR_BONIFICATION_CORRECTION_RELEASE_ENABLED: 'true',
    RADAR_T4_CONTEXT_DELETION_RELEASE_ENABLED: 'true'
};

test('T4 histórico permanece OFF sem ativação explícita em Production', async () => {
    const { buildRuntimeInput } = await import(generator);
    const result = buildRuntimeInput(approved);
    assert.equal(result.features.itemHistoryRelease, undefined);
});

test('T4 histórico exige autorização própria e exclusão de contexto previamente liberada', async () => {
    const { buildRuntimeInput } = await import(generator);
    const wanted = { ...approved, RADAR_T4_ITEM_HISTORY_RELEASE_ENABLED: 'true' };
    assert.equal(buildRuntimeInput(wanted).features.itemHistoryRelease, true);
    assert.throws(() => buildRuntimeInput({
        ...wanted, RADAR_T4_CONTEXT_DELETION_RELEASE_ENABLED: 'false'
    }), /histórico.*exclusão de contexto/i);
    assert.throws(() => buildRuntimeInput({
        ...wanted, RADAR_T4_CONTEXT_DELETION_RELEASE_ENABLED: 'false',
        RADAR_OPERATIONAL_CORRECTION_RELEASE_ENABLED: 'false'
    }), /histórico|correção operacional|release operacional/i);
});
